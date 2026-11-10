/**
 * Épreuves types Revisy — Informatique (BEPC 3e).
 * Document original écrit en interne.
 */
const SUJET = {
  id: 'bepc-3e-info-sujet', fichier: 'bepc-3e-informatique-sujet',
  titre: 'Épreuve type Informatique — BEPC 3e',
  description: 'Sujet d’entraînement : traitement de texte, tableur, sécurité. Barème sur 20.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Informatique', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION" },
    { type: 'consigne', lignes: ['ÉPREUVE D’INFORMATIQUE', 'Durée : 2 heures — Coefficient : 2 — Les exercices utilisent un poste habituel.', 'Les quatre parties sont obligatoires.'] },
    { type: 'sousTitre', texte: 'Partie 1 (5 points) — Traitement de texte' },
    { type: 'texte', texte: "Un enseignant veut préparer une copie avec un titre, un paragraphe justifié et une numérotation." },
    { type: 'liste', items: ['a) Cite deux logiciels de traitement de texte.', 'b) Explique l’intérêt de l’enregistrement (.odt / .docx).', 'c) Quelles actions pour mettre un titre en gras et en couleur ?'] },
    { type: 'sousTitre', texte: 'Partie 2 (5 points) — Tableur' },
    { type: 'texte', texte: "On dispose d’un tableau : les élèves Bebel, Aziz, Miriam et Dorcas ont eu les notes : 12, 15, 9 et 17." },
    { type: 'liste', items: ['a) Quelle formule pour calculer la moyenne ?', 'b) Quelle formule pour compter le nombre d’élèves ayant au moins 10 ?', 'c) Comment trier les élèves par ordre décroissant ?'] },
    { type: 'sousTitre', texte: 'Partie 3 (5 points) — Sécurité' },
    { type: 'liste', items: ['a) Qu’est-ce qu’un mot de passe fort ? Donne un exemple.', 'b) Cite deux risques liés au partage de photos sans consentement.', 'c) Quelle action effectuer avant de cliquer sur un lien reçu par message ?'] },
    { type: 'sousTitre', texte: 'Partie 4 (5 points) — Logiciel libre' },
    { type: 'texte', texte: "Le recteur veut 500 ordinateurs supplémentaires pour l’école. Le budget est limité. Tu proposes un système basé sur des logiciels libres." },
    { type: 'liste', items: ['a) Donne deux logiciels libres et leur équivalent propriétaire.', 'b) Pourquoi les logiciels libres peuvent être avantageux dans ce contexte ?'] }
  ]
};
const CORRIGE = {
  id: 'bepc-3e-info-corrige', fichier: 'bepc-3e-informatique-corrige',
  titre: 'Corrigé — Épreuve type Informatique (BEPC 3e)',
  description: 'Corrigé rédigé avec barème.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Informatique', type: 'corrige',
  sourceNom: 'Revisy — corrigé d’épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPE INFORMATIQUE (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 20 points.'] },
    { type: 'sousTitre', texte: 'Partie 1 — Traitement de texte' },
    { type: 'liste', items: ['a) LibreOffice Writer, Microsoft Word.', 'b) L’enregistrement conserve le document ; le format .odt ou .docx assure le partage.', 'c) Sélectionner le titre → Gras + couleur; optionnel : taille, police, alignement titré.'] },
    { type: 'sousTitre', texte: 'Partie 2 — Tableur' },
    { type: 'liste', items: ['a) =MOYENNE(plage) ou =AVERAGE.', 'b) =NB.SI(plage;">=10") ou =COUNTIF(range,">=10").', 'c) Données → Trier par la colonne Notes, ordre décroissant.'] },
    { type: 'sousTitre', texte: 'Partie 3 — Sécurité' },
    { type: 'liste', items: ['a) Exemple : Revisy#2026! (longueur, majuscules/minuscules, chiffres, symbole).', 'b) Risques : atteinte à la vie privée, usurpation, chantage, diffusion non consentie.', 'c) Vérifier l’expéditeur, maintenir l’antivirus, ne pas cliquer sur des liens suspects.'] },
    { type: 'sousTitre', texte: 'Partie 4 — Logiciel libre' },
    { type: 'liste', items: ['a) LibreOffice (MS Office), GIMP (Photoshop), Linux (Windows).', 'b) Coût faible, maintenance motivée, ingénierie libre, communauté vaste.'] }
  ]
};
module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
