/**
 * Épreuves types Revisy — Physique-Chimie (BEPC 3e).
 * Document original écrit en interne.
 */
const SUJET = {
  id: 'bepc-3e-physique-sujet',
  fichier: 'bepc-3e-physique-sujet',
  titre: 'Épreuve type de Physique-Chimie — BEPC 3e',
  description: 'Sujet d’entraînement : mesures, circuits, réactions chimiques. Barème sur 20.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Physique-Chimie', type: 'sujet',
  sourceNom: 'Revisy — épreuve type rédigée en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: "BREVET D'ÉTUDES DU PREMIER CYCLE — SESSION DE RÉVISION"},
    { type: 'consigne', lignes: ['ÉPREUVE DE PHYSIQUE-CHIMIE','Durée : 2 heures — Coefficient : 3 — La calculatrice est autorisée.','Les quatre parties sont obligatoires.'] },
    { type: 'sousTitre', texte: 'Partie 1 (4 points) — Mesures'},
    { type: 'liste', items: ['a) Convertis 1,2 L en mL.','b) Convertis 2,5 kg en g.','c) Écris la formule du poids en fonction de la masse et de g.'] },
    { type: 'sousTitre', texte: 'Partie 2 (5 points) — Circuits électriques'},
    { type: 'texte', texte: "Un circuit comprend une pile de 6 V, une résistance de 12 Ω et une lampe." },
    { type: 'liste', items: ['a) Calcule l’intensité qui traverse le circuit.','b) Calcule la tension aux bornes de la lampe en série.','c) Si on ajoute une seconde résistance en parallèle, que devient l’intensité totale ? Justifie.'] },
    { type: 'sousTitre', texte: 'Partie 3 (5 points) — Chimie'},
    { type: 'liste', items: ['a) Écris la réaction entre le fer et l’acide chlorhydrique.','b) Identifie le gaz produit.','c) Quel danger lors de cette réaction ?'] },
    { type: 'sousTitre', texte: 'Partie 4 (6 points) — Application'},
    { type: 'texte', texte: "Un bus de 1 200 kg roule à 15 m/s. Le chauffeur freine brusquement. Après 10 m, le bus est arrêté." },
    { type: 'liste', items: ['a) Calcule l’énergie cinétique du bus avant freinage.','b) Calcule le travail fourni par les freins.','c) En déduire la force moyenne de freinage.'] },
    { type: 'texte', texte: 'Bon courage !' }
  ]
};
const CORRIGE = {
  id: 'bepc-3e-physique-corrige',
  fichier: 'bepc-3e-physique-corrige',
  titre: 'Corrigé — Épreuve type de Physique-Chimie (BEPC 3e)',
  description: 'Corrigé rédigé avec barème.',
  examen: 'BEPC', niveau: 'brevet', classe: '3e', serie: null, annee: 2026,
  matiere: 'Physique-Chimie', type: 'corrige',
  sourceNom: 'Revisy — corrigé d’épreuve type rédigé en interne',
  sourceUrl: 'https://revisy.onrender.com',
  licence: 'Document original Revisy — libre de reproduction et de rediffusion',
  blocs: [
    { type: 'titre', texte: 'CORRIGÉ — ÉPREUVE TYPE DE PHYSIQUE-CHIMIE (BEPC 3e)'},
    { type: 'consigne', lignes: ['Barème sur 20 points.'] },
    { type: 'sousTitre', texte: 'Partie 1 — Measurements' },
    { type: 'liste', items: ['a) 1200 mL','b) 2500 g','c) P = m × g'] },
    { type: 'sousTitre', texte: 'Partie 2 — Circuits' },
    { type: 'liste', items: ['a) I = V/R = 6/12 = 0,5 A.','b) En série, la tension se repartit proportionnellement : U_lampe = 3 V si R_lampe = 6 Ω (dans ce cas) − la tension est partagée quand la résistance de la lampe est connue ; sinonicité : U_lampe = U_pile − I × R = 6 − 0,5×12 = 0 V.','c) En parallèle, la résistance totale diminue, donc l’intensité totale augmente (loi d’Ohm).'] },
    { type: 'sousTitre', texte: 'Partie 3 — Chemistry' },
    { type: 'liste', items: ['a) Fe + 2HCl → FeCl2 + H2.','b) Hydrogène H2.','c) Dégagement gazeux inflammable ; risque d’explosion si étincelle.'] },
    { type: 'sousTitre', texte: 'Partie 4 — Mechanics' },
    { type: 'liste', items: ['a) Ec = ½ × 1200 × 15^2 = 135 000 J.','b) Travail = variagation de Ec : 135 000 J.','c) F = W/d = 135 000 / 10 = 13 500 N.'] }
  ]
};
module.exports = { DOCUMENTS: [SUJET, CORRIGE] };
