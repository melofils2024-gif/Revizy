/**
 * server_epreuves_ia.js — génération automatique d'épreuves types.
 *
 * Principe : le SUJET et le CORRIGÉ d'une épreuve type sont rédigés par le
 * modèle, à partir du programme officiel du pays (contexts.js + base).
 * Le contenu produit est un document ORIGINAL : il peut donc être
 * rediffusé par Revizy, contrairement à un sujet d'examen numérisé par un
 * tiers.
 *
 * Chaîne complète :
 *   1. le programme de la (matière, niveau, série) est choisi par la base ;
 *   2. le modèle rédige sujet + corrigé, en JSON ;
 *   3. la réponse est normalisée en blocs de document (même format que les
 *      épreuves types versionnées) ;
 *   4. la fiche est enregistrée dans `epreuves`, le document dans
 *      `epreuve_contenus`, la correction dans `epreuve_corrections` ;
 *   5. au téléchargement, le serveur rend le PDF à la volée : aucun fichier
 *      à héberger, donc rien à perdre au redémarrage de Render.
 *
 * Garde-fou : un corrigé payant reste marqué « non validé » tant qu'un
 * humain ne l'a pas relu (verifierPublication).
 */

const epreuves = require('./server_epreuves.js');

const BAREME_DEFAUT = 20;
const NB_EXERCICES_MIN = 3;
const NB_EXERCICES_MAX = 6;
const LONGUEUR_SOLUTION_MIN = 80;

/** Programme officiel d'une matière (la base pilote, le local complète). */
function topicsDeLaMatiere(params) {
  if (Array.isArray(params.topics) && params.topics.length) return params.topics;
  return [];
}

/**
 * Prompt de génération. Le programme est joint verbatim : le modèle ne doit
 * pas s'en écarter (c'est la « lettre » de la base).
 */
function construirePromptEpreuve(params) {
  const topics = topicsDeLaMatiere(params);
  const type = params.type === 'corrige' ? 'corrigé' : 'sujet';
  const niveau = params.niveau === 'brevet'
    ? 'BEPC (3e)'
    : `BAC Terminale${params.serie ? ` série ${params.serie}` : ''}`;
  const bareme = Number(params.bareme) > 0 ? Number(params.bareme) : BAREME_DEFAUT;

  const lignes = [];
  lignes.push(`Tu es l'inspecteur pédagogique du ministère de l'Éducation du Bénin.`);
  lignes.push(`Tu rédiges une ${type} d'examen de ${params.matiere} pour le ${niveau} — année ${params.annee}.`);
  lignes.push('');
  lignes.push('PROGRAMME OFFICIEL À RESPECTER (tu ne sors pas de ces thèmes) :');
  if (topics.length) {
    for (const topic of topics) lignes.push(`- ${topic}`);
  } else {
    lignes.push('- (programme détaillé non disponible : reste sur les notions de base de la matière)');
  }
  lignes.push('');
  lignes.push('CONSIGNES :');
  lignes.push(`- ${NB_EXERCICES_MIN} à ${NB_EXERCICES_MAX} exercices, total ${bareme} points ;`);
  lignes.push('- chaque exercice a un titre, un énoncé complet et son nombre de points ;');
  lignes.push('- le niveau et le style correspondent à une épreuve réelle du pays (données réalistes, consignes claires) ;');
  lignes.push('- tu rédiges aussi une correction détaillée, question par question, qui suit exactement le barème ;');
  lignes.push('- pas de marque, pas de mention de l\'intelligence artificielle, pas de commentaire sur le document ;');
  lignes.push('- texte en français, avec les accents corrects.');
  lignes.push('');
  lignes.push('RÉPONDS UNIQUEMENT PAR UN JSON, de cette forme :');
  lignes.push('{');
  lignes.push('  "titre": "Épreuve de <matière> — <niveau> <année>",');
  lignes.push('  "consigne": ["ligne 1", "ligne 2"],');
  lignes.push('  "exercices": [');
  lignes.push('    { "titre": "Exercice 1", "enonce": "énoncé complet, avec les données et les questions", "points": 4 }');
  lignes.push('  ],');
  lignes.push('  "solution": "correction détaillée, question par question, avec les points",');
  lignes.push(`  "bareme": ${bareme},`);
  lignes.push('  "difficulte": "facile" | "moyen" | "difficile"');
  lignes.push('}');

  return lignes.join('\n');
}

/** Nettoie un texte généré (espaces parasites, guillemets, longueur). */
function nettoyerTexte(valeur, max = 6000) {
  if (valeur === null || valeur === undefined) return '';
  return String(valeur)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/**
 * Transforme la réponse JSON du modèle en fiche + blocs de document.
 * Retourne { ok, erreurs, titre, blocs, solution, bareme, difficulte }.
 */
function normaliserEpreuveIA(brut, params = {}) {
  const erreurs = [];
  const data = brut && typeof brut === 'object' ? brut : {};
  const bareme = Number(data.bareme) > 0 ? Math.round(Number(data.bareme)) : BAREME_DEFAUT;

  const exercices = Array.isArray(data.exercices) ? data.exercices : [];
  const retenus = exercices.slice(0, NB_EXERCICES_MAX).filter(e => e && (e.enonce || e.titre));
  if (retenus.length < NB_EXERCICES_MIN) {
    erreurs.push(`moins de ${NB_EXERCICES_MIN} exercices exploitables (${retenus.length})`);
  }

  let totalPoints = 0;
  const blocs = [];
  const titre = nettoyerTexte(data.titre || '', 180) ||
    `Épreuve de ${params.matiere || 'Mathématiques'} — ${params.niveau === 'brevet' ? 'BEPC' : 'BAC'} ${params.annee || ''}`.trim();
  blocs.push({ type: 'titre', texte: titre });

  const consigne = Array.isArray(data.consigne) ? data.consigne.map(l => nettoyerTexte(l, 300)).filter(Boolean) : [];
  if (consigne.length) blocs.push({ type: 'consigne', lignes: consigne });

  retenus.forEach((exercice, index) => {
    const points = Number(exercice.points) > 0 ? Math.round(Number(exercice.points)) : 0;
    totalPoints += points;
    const intitule = nettoyerTexte(exercice.titre || `Exercice ${index + 1}`, 120);
    blocs.push({
      type: 'sousTitre',
      texte: `${intitule}${points ? ` (${points} point${points > 1 ? 's' : ''})` : ''}`
    });
    const enonce = nettoyerTexte(exercice.enonce, 4000);
    if (enonce) blocs.push({ type: 'texte', texte: enonce });
  });

  if (retenus.length && totalPoints !== bareme) {
    erreurs.push(`le total des points (${totalPoints}) ne correspond pas au barème annoncé (${bareme})`);
  }

  const solution = nettoyerTexte(data.solution, 12000);
  const difficulte = ['facile', 'moyen', 'difficile'].includes(String(data.difficulte || '').toLowerCase())
    ? String(data.difficulte).toLowerCase()
    : 'moyen';

  if (params.type === 'corrige') {
    if (solution.length < LONGUEUR_SOLUTION_MIN) {
      erreurs.push(`correction trop courte (${solution.length} caractères, minimum ${LONGUEUR_SOLUTION_MIN})`);
    }
    blocs.push({ type: 'page' });
    blocs.push({ type: 'titre', texte: 'CORRIGÉ' });
    blocs.push({ type: 'consigne', lignes: [`Barème : ${bareme} points.`, 'Solution rédigée, question par question.'] });
    blocs.push({ type: 'texte', texte: solution });
    blocs.push({
      type: 'tableau',
      entetes: ['Exercice', 'Points'],
      lignes: retenus.map((exercice, index) => [
        nettoyerTexte(exercice.titre || `Exercice ${index + 1}`, 120),
        String(Number(exercice.points) > 0 ? Math.round(Number(exercice.points)) : 0)
      ]).concat([['Total', String(totalPoints)]])
    });
  }

  return {
    ok: erreurs.length === 0,
    erreurs,
    titre,
    blocs,
    solution,
    bareme: params.type === 'corrige' ? bareme : null,
    totalPoints,
    difficulte,
    nbExercices: retenus.length
  };
}

/**
 * Génère une épreuve et l'enregistre.
 *
 * deps : { callGemini, extractJson, restWrite, model, temperature }
 * Retourne { ok, epreuve, correction, erreurs, modele }.
 */
async function genererEpreuve(params, deps = {}) {
  const erreurs = [];
  if (typeof deps.callGemini !== 'function') {
    return { ok: false, erreurs: ['générateur IA indisponible'], epreuve: null, correction: null };
  }
  if (typeof deps.restWrite !== 'function') {
    return {
      ok: false,
      erreurs: ['écriture en base impossible (SUPABASE_SERVICE_KEY absente ?)'],
      epreuve: null,
      correction: null
    };
  }

  const prompt = construirePromptEpreuve(params);
  let reponseIA;
  try {
    reponseIA = await deps.callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: deps.temperature === undefined ? 0.4 : deps.temperature,
        maxOutputTokens: 32768,
        responseMimeType: 'application/json'
      }
    }, deps.timeoutMs || 110000);
  } catch (e) {
    return { ok: false, erreurs: ['appel IA impossible : ' + (e.message || e)], epreuve: null, correction: null };
  }

  if (!reponseIA || !reponseIA.ok) {
    const detail = reponseIA && reponseIA.data ? JSON.stringify(reponseIA.data).slice(0, 200) : 'aucune réponse';
    return {
      ok: false,
      erreurs: [`génération IA en échec (${reponseIA ? reponseIA.status : 'sans réponse'}) : ${detail}`],
      epreuve: null,
      correction: null
    };
  }

  const texte = reponseIA.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let brut;
  try {
    brut = typeof deps.extractJson === 'function' ? deps.extractJson(texte) : JSON.parse(texte);
  } catch (e) {
    return { ok: false, erreurs: ['réponse IA illisible (JSON invalide)'], epreuve: null, correction: null };
  }

  const normalise = normaliserEpreuveIA(brut, params);
  erreurs.push(...normalise.erreurs);
  if (!normalise.ok) {
    return { ok: false, erreurs, epreuve: null, correction: null, normalise };
  }

  // Fiche de l'épreuve.
  const annee = Number(params.annee) > 0 ? Math.round(Number(params.annee)) : new Date().getFullYear();
  const type = params.type === 'corrige' ? 'corrige' : 'sujet';
  const slug = epreuves.epreuveSlug({
    pays: params.pays || 'BJ',
    niveau: params.niveau || 'bac',
    annee,
    matiere: params.matiere,
    type,
    classe: params.classe || null,
    serie: params.serie || null
  });

  const ligne = {
    slug,
    pays: params.pays || 'BJ',
    niveau: params.niveau || 'bac',
    annee,
    matiere: params.matiere,
    type,
    titre: normalise.titre,
    description: params.description || `Épreuve type ${type === 'corrige' ? 'corrigée' : ''} — ${params.matiere} (${params.niveau === 'brevet' ? 'BEPC' : 'BAC'}${params.serie ? ' série ' + params.serie : ''}) ${annee}`.trim(),
    // Contenu généré : le serveur rend le PDF à la volée.
    fichier_url: `genere:${slug}`,
    fichier_nom: `${slug}.pdf`,
    format: 'pdf',
    classe: params.classe || null,
    serie: params.serie || null,
    source_nom: 'Revizy — épreuve type générée',
    source_url: 'https://revisy.onrender.com',
    licence: 'Document original Revizy — libre de reproduction et de rediffusion',
    is_free: type === 'sujet',
    price: type === 'corrige' ? (Number(params.price) > 0 ? Math.round(Number(params.price)) : 200) : 0,
    published: type === 'sujet' ? true : false
  };

  const ecrit = await deps.restWrite('/rest/v1/epreuves?on_conflict=slug', 'POST', ligne, {
    prefer: 'resolution=merge-duplicates,return=representation'
  });
  if (!ecrit || !ecrit.ok) {
    return {
      ok: false,
      erreurs: [`enregistrement de l'épreuve impossible : ${(ecrit && ecrit.error) || 'erreur inconnue'}`],
      epreuve: null,
      correction: null
    };
  }

  const row = Array.isArray(ecrit.data) ? ecrit.data[0] : (ecrit.data || ligne);
  const id = row && row.id ? row.id : null;
  if (!id) {
    return {
      ok: false,
      erreurs: ['l\'épreuve a été écrite mais son identifiant est introuvable'],
      epreuve: null,
      correction: null
    };
  }

  const contenu = await deps.restWrite('/rest/v1/epreuve_contenus?on_conflict=epreuve_id', 'POST', {
    epreuve_id: id,
    blocs: normalise.blocs,
    origine: 'ia',
    modele: (reponseIA.modele || deps.modele || '') || null
  }, { prefer: 'resolution=merge-duplicates' });
  if (!contenu || !contenu.ok) {
    return {
      ok: false,
      erreurs: [`enregistrement du document impossible : ${(contenu && contenu.error) || 'erreur inconnue'}`],
      epreuve: id,
      correction: null
    };
  }

  let correction = null;
  if (type === 'corrige') {
    // Un corrigé payant reste NON validé : un humain doit le relire.
    const ecritCorrection = await deps.restWrite('/rest/v1/epreuve_corrections?on_conflict=epreuve_id', 'POST', {
      epreuve_id: id,
      solution: normalise.solution,
      bareme: normalise.bareme,
      difficulte: normalise.difficulte,
      validee: false
    }, { prefer: 'resolution=merge-duplicates' });
    if (!ecritCorrection || !ecritCorrection.ok) {
      return {
        ok: false,
        erreurs: [`enregistrement de la correction impossible : ${(ecritCorrection && ecritCorrection.error) || 'erreur inconnue'}`],
        epreuve: id,
        correction: null
      };
    }
    correction = {
      solution: normalise.solution,
      bareme: normalise.bareme,
      difficulte: normalise.difficulte,
      validee: false
    };
  }

  return {
    ok: true,
    erreurs,
    epreuve: id,
    slug,
    titre: normalise.titre,
    correction,
    blocs: normalise.blocs,
    modele: reponseIA.modele || deps.modele || '',
    nbExercices: normalise.nbExercices
  };
}

module.exports = {
  construirePromptEpreuve,
  normaliserEpreuveIA,
  genererEpreuve,
  nettoyerTexte,
  BAREME_DEFAUT,
  NB_EXERCICES_MIN,
  NB_EXERCICES_MAX,
  LONGUEUR_SOLUTION_MIN
};
