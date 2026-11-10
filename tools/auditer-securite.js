/**
 * tools/auditer-securite.js — audit « de l'extérieur », comme un pirate.
 *
 * Le principe : n'utiliser QUE ce qu'un visiteur possède déjà (la clé
 * publique « anon », visible dans le code du navigateur) et tenter de lire,
 * écrire ou télécharger ce qui ne doit pas l'être.
 *
 * Chaque contrôle affiche une preuve. Un contrôle en échec est une
 * VULNÉRABILITÉ à corriger, pas un détail à ignorer.
 *
 * Important : une table absente (migration SQL pas encore appliquée) n'est
 * PAS une vulnérabilité. C'est un état à signaler, rien de plus.
 *
 * Usage :
 *   node tools/auditer-securite.js            (production)
 *   node tools/auditer-securite.js --json     (sortie machine)
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const PROD = process.env.SITE_URL || 'https://revisy.onrender.com';
const SORTIE_JSON = process.argv.includes('--json');

// La clé anon est PUBLIQUE par construction (elle est dans le code du
// navigateur). Aucune clé secrète n'est lue ni affichée ici.
function lireConfigPublique() {
  const brut = fs.readFileSync(path.join(RACINE, 'config.js'), 'utf8');
  const url = /SUPABASE_URL\s*[:=]\s*['"]([^'"]+)['"]/.exec(brut);
  const cle = /SUPABASE_ANON_KEY\s*[:=]\s*['"]([^'"]+)['"]/.exec(brut);
  return {
    supabaseUrl: (url && url[1]) || '',
    cleAnon: (cle && cle[1]) || ''
  };
}

const controles = [];

function control(nom, ok, gravite, preuve) {
  controles.push({ nom, ok, gravite, preuve: String(preuve || '').slice(0, 220) });
}

/** Appelle l'API Supabase avec la clé publique. */
async function api(supabaseUrl, cleAnon, chemin, options = {}) {
  const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}${chemin}`, {
    method: options.method || 'GET',
    headers: {
      apikey: cleAnon,
      Authorization: `Bearer ${cleAnon}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const texte = await r.text();
  let data = null;
  try { data = JSON.parse(texte); } catch (e) { data = texte; }
  return { status: r.status, data, texte };
}

/** La table n'existe pas encore (migration non appliquée) : ce n'est pas une faille. */
function tableAbsente(res) {
  const msg = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || {});
  return res.status === 404 || msg.includes('PGRST205') || msg.includes('does not exist');
}

(async () => {
  const { supabaseUrl, cleAnon } = lireConfigPublique();
  if (!supabaseUrl || !cleAnon) {
    console.error('Configuration publique introuvable dans config.js.');
    process.exitCode = 1;
    return;
  }

  console.log('═══ AUDIT DE SÉCURITÉ REVISY ═══');
  console.log(`Site : ${PROD}`);
  console.log(`Base : ${supabaseUrl}`);
  console.log('Clé : clé publique « anon » (celle du navigateur)\n');

  // ── 1. Les fonctions sensibles sont-elles atteignables ? ──────────────
  // On ne récupère PAS le catalogue OpenAPI complet (il est énorme et fait
  // exploser la mémoire) : on interroge directement chaque fonction
  // sensible. Une réponse « fonction introuvable » (PGRST202) ou un refus
  // prouvent qu'elle n'est pas exécutable par un visiteur.
  const FONCTIONS_INTERDITES = [
    ['get_chapter_content', { p_chapter_id: '00000000-0000-0000-0000-000000000001' }],
    ['get_admin_stats', {}],
    ['upsert_quiz_bank', { p_niveau: 'bac', p_subject: 'Test', p_questions: [] }],
    ['upsert_curriculum_sequences', { p_niveau: 'brevet', p_serie: '', p_subject: 'Test', p_sequences: [] }],
    ['delete_curriculum_sequences', { p_niveau: 'brevet', p_serie: '', p_subject: 'Test' }],
    ['upsert_chapter_mapping', { p_chapter_id: '00000000-0000-0000-0000-000000000001', p_niveau: 'bac', p_pays: 'BJ', p_classe: '', p_serie: '' }],
    ['delete_chapter_mapping', { p_chapter_id: '00000000-0000-0000-0000-000000000001', p_niveau: 'bac', p_pays: 'BJ', p_classe: '' }]
  ];

  for (const [fn, corps] of FONCTIONS_INTERDITES) {
    const r = await api(supabaseUrl, cleAnon, `/rest/v1/rpc/${fn}`, { method: 'POST', body: corps });
    const msg = typeof r.data === 'string' ? r.data : JSON.stringify(r.data || {});
    // PGRST202 : la fonction n'existe pas dans le schéma expos�� au public.
    const introuvable = msg.includes('PGRST202') || msg.includes('Could not find the function');
    const refusee = r.status === 401 || r.status === 403 || r.status === 400;
    const ok = introuvable || refusee;
    control(`la fonction sensible « ${fn} » n'est pas exécutable par un visiteur`,
      ok, 'critique',
      ok
        ? (introuvable ? 'non exposée (PGRST202)' : `refusée (HTTP ${r.status})`)
        : `EXPOSÉE — HTTP ${r.status} : ${msg.slice(0, 120)}`);
  }

  // ── 2. Lecture directe des tables sensibles ───────────────────────────
  const TABLES_SENSIBLES = [
    ['epreuve_corrections', 'corrigés payants'],
    ['epreuve_contenus', 'contenus générés'],
    ['transactions', 'transactions de paiement'],
    ['subscriptions', 'abonnements'],
    ['unlocked_epreuves', 'déblocages'],
    ['admin_journal', 'journal d\'administration']
  ];
  for (const [table, libelle] of TABLES_SENSIBLES) {
    const r = await api(supabaseUrl, cleAnon, `/rest/v1/${table}?select=*&limit=3`);
    if (tableAbsente(r)) {
      control(`la table « ${table} » est inaccessible (absente)`, true, 'info', `absente — ${libelle}`);
      continue;
    }
    const lignes = Array.isArray(r.data) ? r.data.length : 0;
    control(`la table « ${table} » ne renvoie rien à un visiteur`,
      lignes === 0, 'critique',
      `${lignes} ligne(s) renvoyée(s) — ${libelle}`);
  }

  // ── 3. Tentative d'auto-promotion en administrateur ───────────────────
  // La ligne est immédiatement supprimée : le test se nettoie lui-même.
  const emailTest = `audit-securite-${Date.now()}@test.invalid`;
  const insert = await api(supabaseUrl, cleAnon, '/rest/v1/profiles', {
    method: 'POST',
    body: {
      id: '00000000-0000-0000-0000-000000000001',
      email: emailTest,
      full_name: 'Audit sécurité (test)',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  });
  if (tableAbsente(insert)) {
    control('l\'auto-promotion en admin est impossible', true, 'info', 'table profiles absente');
  } else {
    const cree = Array.isArray(insert.data) && insert.data.length > 0;
    const roleObtenu = cree ? String(insert.data[0].role) : '';
    control('l\'auto-promotion en admin est refusée',
      !cree || roleObtenu !== 'admin', 'critique',
      cree ? `rôle obtenu : ${roleObtenu}` : `refusée (HTTP ${insert.status})`);
    if (cree) {
      // Nettoyage immédiat de la ligne de test.
      await api(supabaseUrl, cleAnon, `/rest/v1/profiles?email=eq.${encodeURIComponent(emailTest)}`, { method: 'DELETE' });
      console.log(`  (ligne de test supprimée : ${emailTest})`);
    }
  }

  // ── 4. Contenu payant via une fonction publique ──────────────────────
  for (const [fn, corps] of [
    ['get_curriculum_chapters', { p_niveau: 'bac' }],
    ['get_chapters_for_student', { p_niveau: 'bac' }]
  ]) {
    const r = await api(supabaseUrl, cleAnon, `/rest/v1/rpc/${fn}`, { method: 'POST', body: corps });
    if (r.status === 404 || tableAbsente(r)) {
      control(`le contenu payant n'est pas exposé par « ${fn} »`, true, 'info', `indisponible (HTTP ${r.status})`);
      continue;
    }
    if (r.status !== 200) {
      control(`le contenu payant n'est pas exposé par « ${fn} »`, true, 'info', `refusé (HTTP ${r.status})`);
      continue;
    }
    const lignes = Array.isArray(r.data) ? r.data : [];
    // Une vraie fuite correspond à un chapitre payant (non gratuit ou verrouillé) dont le contenu est lisible
    const fuitePayante = lignes.find(l => l && (l.is_free === false || l.locked === true) && (l.contenu || l.cours || l.exercice_solution || l.solution));
    control(`le contenu payant n'est pas exposé par « ${fn} »`,
      !fuitePayante, 'critique',
      fuitePayante ? `fuite détectée sur ${fuitePayante.title || 'chapitre payant'}` : `${lignes.length} ligne(s), aucun contenu payant exposé`);
  }

  // ── 5. Espace d'administration sans jeton ─────────────────────────────
  for (const chemin of ['/v1/admin/securite', '/v1/admin/admins', '/v1/admin/epreuves', '/admin-panel']) {
    const r = await fetch(`${PROD}${chemin}`, { redirect: 'manual' });
    const adminVisible = r.status === 200 && (r.headers.get('content-type') || '').includes('json');
    control(`« ${chemin} » est fermé aux visiteurs`,
      !adminVisible, 'critique', `HTTP ${r.status}`);
  }

  // ── 6. Fichiers internes ──────────────────────────────────────────────
  for (const fichier of ['/.env', '/package.json', '/server.js', '/tools/verifier-migration.js', '/MIGRATION_TOUT.sql']) {
    const r = await fetch(`${PROD}${fichier}`);
    const expose = r.status === 200;
    control(`« ${fichier} » n'est pas exposé`, !expose, 'critique', `HTTP ${r.status}`);
  }

  // ── 7. En-têtes de sécurité ──────────────────────────────────────────
  const entetes = await fetch(PROD + '/');
  for (const h of ['content-security-policy', 'strict-transport-security', 'x-frame-options', 'x-content-type-options', 'referrer-policy']) {
    const v = entetes.headers.get(h);
    control(`l'en-tête « ${h} » est présent`, Boolean(v), 'alerte', v ? 'présent' : 'ABSENT');
  }

  // ── Bilan ─────────────────────────────────────────────────────────────
  const ko = controles.filter(c => !c.ok);
  const critiques = ko.filter(c => c.gravite === 'critique');
  if (SORTIE_JSON) {
    console.log(JSON.stringify({
      total: controles.length, ok: controles.length - ko.length,
      vulnerabilites: ko, controles
    }, null, 2));
  } else {
    console.log('\n─── RÉSULTAT ───');
    controles.forEach(c => {
      const etat = c.ok ? 'OK  ' : 'FUILLE';
      console.log(`${etat} ${c.nom}${c.preuve ? '  (' + c.preuve + ')' : ''}`);
    });
    console.log(`\n${controles.length - ko.length}/${controles.length} contrôles réussis — ${critiques.length} vulnérabilité(s) critique(s).`);
  }
  process.exitCode = critiques.length ? 1 : 0;
})();
