/**
 * Épreuves types Revisy — Sciences de la vie et de la terre (BEPC 3e).
 * Document original écrit en interne.
 */
const SUJET = {
  id: 'bepc-3e-svt-sujet', fichier: 'bepc-3e-svt-sujet',
  titre: 'Épreuve type SVT — BEPC 3e',
  description: 'Sujet d’entraînement : alimentation, respiration, reproduction et environnement. Barème sur 20.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'SVT', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION" },
    { type: 'consigne', lignes: ['ÉPREUVE DE SVT', 'Durée : 2 heures — Coefficient : 2 — La calculatrice est autorisée.', 'Les quatre parties sont obligatoires.'] },
    { type: 'sousTitre', texte: 'Partie 1 (5 points) — Alimentation' },
    { type: 'texte', texte: "Madame Kondo invite son fils à marcher avec elle sur le marché. Elle achète : du riz, des œufs, du lait, de la mangue et du sucre. À la maison, elle prépare du riz cantonais et une omelette aux oignons." },
    { type: 'liste', items: ['a) Classe deux aliments en fonction de leur apport (glucides, protéines, lipides, vitamines).', 'b) Écris un menu équilibré pour le déjeuner.', 'c) Pourquoi les fibres alimentaires sont-elles importantes ? Donne deux exemples.'] },
    { type: 'sousTitre', texte: 'Partie 2 (5 points) — Respiration' },
    { type: 'liste', items: ['a) Nomme les organes principaux de l’appareil respiratoire humain.', 'b) Décris le trajet de l’air de l’extérieur jusqu’aux cellules.', 'c) Explique pourquoi les sportifs respirent plus vite lors d’un effort.'] },
    { type: 'sousTitre', texte: 'Partie 3 (5 points) — Reproduction' },
    { type: 'liste', items: ['a) Donne la différence entre reproduction sexuée et asexuée.', 'b) Décris le trajet du spermatozoïde jusqu’à l’ovule chez l’humain.', 'c) Cite un rôle du placenta.'] },
    { type: 'sousTitre', texte: 'Partie 4 (5 points) — Environnement' },
    { type: 'texte', texte: "Un village reçoit chaque saison des déchets plastiques et des eaux usées non traitées. Les habitants se plaignent de moustiques et de maux d’estomac." },
    { type: 'liste', items: ['a) Propose deux solutions concrètes pour réduire les moustiques.', 'b) Propose deux actions pour traiter les eaux usées avant déversement.'] }
  ]
};
const CORRIGE = {
  id: 'bepc-3e-svt-corrige', fichier: 'bepc-3e-svt-corrige',
  titre: 'Corrigé — Épreuve type SVT (BEPC 3e)',
  description: 'Corrigé rédigé avec barème.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'SVT', type: 'corrige',
  sourceNom: 'Revisy — corrigé d’épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPE SVT (BEPC 3e)' },
    { type: 'consigne', lignes: ['Barème sur 20 points.'] },
    { type: 'sousTitre', texte: 'Partie 1 — Alimentation' },
    { type: 'liste', items: ['a) Riz, pain, sucre → glucides ; œufs, lait → protéines/lipides ; mangue, légumes → vitamines/fibres.', 'b) Exemple : riz cantonais + omelette + mangue + eau. Points selon cohérence.', 'c) Les fibres facilitent le transit ; exemples : mangue, légumes, céréales complètes.'] },
    { type: 'sousTitre', texte: 'Partie 2 — Respiration' },
    { type: 'liste', items: ['a) Nez, pharynx, larynx, trachée, bronches, poumons.', 'b) Air → nez → pharynx → trachée → bronches → alvéoles → sang.', 'c) L’effort augmente le besoin en oxygène et la production de CO2 ; la fréquence respiratoire s’adapte.'] },
    { type: 'sousTitre', texte: 'Partie 3 — Reproduction' },
    { type: 'liste', items: ['a) Sexuée : deux parents, fusion de gamètes ; asexuée : un individu suffit (ex. bouturage).', 'b) Vagin → col de l’utérus → utérus → trompe de Fallope → ampoule.', 'c) Le placenta nourrit, oxygène le fœtus et élimine les déchets via le cordon.'] },
    { type: 'sousTitre', texte: 'Partie 4 — Environnement' },
    { type: 'liste', items: ['a) Suppression de l’eau stagnante, moustiquaires, lutte biologique.', 'b) Fosses septiques, lagunage, traitement UV/chloration avant rejet.'] }
  ]
};
module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
