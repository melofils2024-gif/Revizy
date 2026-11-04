/**
 * Écriture PDF minimale, sans aucune dépendance externe.
 *
 * Pourquoi pas une librairie ? La machine de build n'a ni Python ni
 * Chromium : un générateur Node pur garantit que les épreuves types
 * peuvent être régénérées n'importe où (`node tools/generer-epreuves-types.js`).
 *
 * Périmètre : documents texte (sujets, corrigés). PDF 1.4, polices
 * standard Type1 (Helvetica) avec encodage WinAnsi — donc les accents
 * français, « », °, — s'affichent correctement.
 */

const PAGE_A4 = { largeur: 595.28, hauteur: 841.89 };
const MARGE = { haut: 56, bas: 56, gauche: 56, droite: 56 };

/** Caractères WinAnsi (Windows-1252) — tout ce qui sort du jeu est remplacé. */
const WINANSI = new Map();
for (let i = 0; i < 256; i++) WINANSI.set(String.fromCharCode(i), i);
const REMPLACEMENTS = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F,
  // Symboles mathématiques hors WinAnsi : on retombe sur l'équivalent ASCII.
  '−': 0x2D, // signe moins
  '≈': 0x7E, // environ
  '≤': 0x3D, '≥': 0x3E, // inequalities (approximatives en ASCII)
  '→': 0x2D, // flèche
  '∞': 0x3F
};

/**
 * Convertit une chaîne JS en caractères WinAnsi (codes 0-255) : le PDF est
 * ensuite assemblé en latin1, donc chaque caractère tient sur un octet.
 * Tout ce qui n'existe pas en WinAnsi devient '?'.
 */
function versWinAnsi(texte) {
  let sortie = '';
  for (const caractere of String(texte)) {
    if (REMPLACEMENTS[caractere] !== undefined) { sortie += String.fromCharCode(REMPLACEMENTS[caractere]); continue; }
    const code = WINANSI.get(caractere);
    sortie += code === undefined ? '?' : String.fromCharCode(code);
  }
  return sortie;
}

function echapperPdf(texte) {
  return String(texte).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Découpe un texte en lignes d'une largeur maximale (approximation Helvetica). */
function largeurTexte(texte, taille) {
  // Helvetica : largeur moyenne ~0.5 em, chiffres ~0.556 em, majuscules plus larges.
  let total = 0;
  for (const c of String(texte)) {
    if (c === ' ') total += 0.278;
    else if (/[iljtfr.,:;'!|]/.test(c)) total += 0.28;
    else if (/[mwMW@%&]/.test(c)) total += 0.82;
    else if (/[A-Z0-9]/.test(c)) total += 0.66;
    else total += 0.52;
  }
  return total * taille;
}

function decouper(texte, taille, largeurMax) {
  const mots = String(texte).split(/\s+/).filter(Boolean);
  const lignes = [];
  let ligne = '';
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (largeurTexte(essai, taille) <= largeurMax || !ligne) {
      ligne = essai;
    } else {
      lignes.push(ligne);
      ligne = mot;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

class DocumentPdf {
  constructor(options = {}) {
    this.titre = options.titre || 'Document';
    this.auteur = options.auteur || 'Revizy';
    this.sujet = options.sujet || '';
    this.largeur = (options.largeur || PAGE_A4.largeur);
    this.hauteur = (options.hauteur || PAGE_A4.hauteur);
    this.marge = Object.assign({}, MARGE, options.marge || {});
    this.pages = [];
    this.contenuCourant = null;
    this.y = 0;
    this.nouvellePage();
  }

  nouvellePage() {
    this.contenuCourant = [];
    this.pages.push(this.contenuCourant);
    this.y = this.hauteur - this.marge.haut;
    return this;
  }

  /** Espace vertical ; crée une page si on descend trop bas. */
  reserver(hauteur) {
    if (this.y - hauteur < this.marge.bas) { this.nouvellePage(); }
    return this;
  }

  texte(contenu, options = {}) {
    const taille = options.taille || 10.5;
    const interligne = options.interligne || taille * 1.45;
    const largeurMax = this.largeur - this.marge.gauche - this.marge.droite - (options.indent || 0);
    const lignes = Array.isArray(contenu) ? contenu : decouper(contenu, taille, largeurMax);
    for (const ligne of lignes) {
      this.reserver(interligne);
      const x = this.marge.gauche + (options.indent || 0);
      this.y -= interligne;
      this.contenuCourant.push(
        `BT /${options.gras ? 'F2' : 'F1'} ${taille} Tf ${options.couleur || '0 0 0'} rg ` +
        `1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${echapperPdf(versWinAnsi(ligne))}) Tj ET`
      );
    }
    return this;
  }

  titrePrincipal(contenu) {
    this.reserver(34);
    this.y -= 26;
    this.contenuCourant.push(
      `BT /F2 16 Tf 0 0 0 rg 1 0 0 1 ${this.marge.gauche} ${this.y.toFixed(2)} Tm (${echapperPdf(versWinAnsi(contenu))}) Tj ET`
    );
    this.reserver(10);
    this.y -= 6;
    this.ligne(this.marge.gauche, this.y, this.largeur - this.marge.droite, this.y, 0.25);
    this.y -= 12;
    return this;
  }

  sousTitre(contenu, taille = 12) {
    this.reserver(taille * 2);
    this.y -= taille * 1.5;
    this.contenuCourant.push(
      `BT /F2 ${taille} Tf 0 0 0 rg 1 0 0 1 ${this.marge.gauche} ${this.y.toFixed(2)} Tm (${echapperPdf(versWinAnsi(contenu))}) Tj ET`
    );
    this.y -= 4;
    return this;
  }

  ligne(x1, y1, x2, y2, epaisseur = 0.6) {
    this.contenuCourant.push(
      `${epaisseur} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
    return this;
  }

  rectangle(x, y, largeur, hauteur, couleur = '0.93 0.95 0.99') {
    this.contenuCourant.push(`${couleur} rg ${x.toFixed(2)} ${y.toFixed(2)} ${largeur.toFixed(2)} ${hauteur.toFixed(2)} re f`);
    return this;
  }

  /** Encadré (bandeau titre, consigne, mention). */
  encadre(lignes, options = {}) {
    const taille = options.taille || 10;
    const interligne = taille * 1.4;
    const largeur = this.largeur - this.marge.gauche - this.marge.droite;
    const hauteur = lignes.length * interligne + 14;
    this.reserver(hauteur + 8);
    const haut = this.y;
    this.rectangle(this.marge.gauche, haut - hauteur + 6, largeur, hauteur, options.couleur || '0.96 0.97 0.99');
    this.ligne(this.marge.gauche, haut - hauteur + 6, this.marge.gauche + largeur, haut - hauteur + 6, 0.8);
    this.y = haut - 12;
    this.texte(lignes, { taille, interligne });
    this.y = haut - hauteur;
    this.y -= 6;
    return this;
  }

  espacement(hauteur = 8) { this.y -= hauteur; return this; }

  /**
   * Tableau simple : colonnes dimensionnées d'après le contenu, ligne
   * d'en-tête surlignée, filets fins entre les lignes.
   */
  tableau(entetes, lignes) {
    const toutes = [entetes].concat(lignes);
    const colonnes = Math.max(...toutes.map(l => l.length));
    const largeurUtile = this.largeur - this.marge.gauche - this.marge.droite;
    // Poids de chaque colonne = longueur maximale de son contenu.
    const poids = [];
    for (let c = 0; c < colonnes; c++) {
      let max = 4;
      for (const l of toutes) {
        const texte = String(l[c] === undefined ? '' : l[c]);
        max = Math.max(max, largeurTexte(texte, 9.5));
      }
      poids.push(max);
    }
    const somme = poids.reduce((a, b) => a + b, 0);
    const largeurs = poids.map(p => Math.max(70, (p / somme) * largeurUtile));

    const ligneEnTete = (cellules, gras, fond) => {
      const taille = 9.5;
      const interligne = taille * 1.5;
      const celluleLignes = cellules.map((texte, index) =>
        decouper(String(texte === undefined ? '' : texte), taille, largeurs[index] - 8));
      const hauteur = Math.max(...celluleLignes.map(l => l.length)) * interligne + 8;
      this.reserver(hauteur + 4);
      const haut = this.y;
      if (fond) this.rectangle(this.marge.gauche, haut - hauteur + 4, largeurUtile, hauteur, fond);
      let x = this.marge.gauche;
      celluleLignes.forEach((lignesCellule, index) => {
        let y = haut - 6;
        for (const ligne of lignesCellule) {
          y -= interligne;
          this.contenuCourant.push(
            `BT /${gras ? 'F2' : 'F1'} ${taille} Tf 0 0 0 rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${echapperPdf(versWinAnsi(ligne))}) Tj ET`
          );
        }
        x += largeurs[index];
      });
      this.ligne(this.marge.gauche, haut - hauteur + 4, this.marge.gauche + largeurUtile, haut - hauteur + 4, 0.6);
      this.y = haut - hauteur;
    };

    ligneEnTete(entetes, true, '0.94 0.96 0.99');
    for (const l of lignes) ligneEnTete(l, false, null);
    this.y -= 8;
    return this;
  }

  pagination() {
    // Numéro de page + pied de page, ajouté à la construction.
    const total = this.pages.length;
    this.pages.forEach((contenu, index) => {
      const numero = `${index + 1} / ${total}`;
      const largeur = largeurTexte(numero, 8.5);
      contenu.push(
        `BT /F1 8.5 Tf 0.45 0.5 0.58 rg 1 0 0 1 ${(this.largeur - this.marge.droite - largeur).toFixed(2)} ${(this.marge.bas - 26).toFixed(2)} Tm (${echapperPdf(versWinAnsi(numero))}) Tj ET`
      );
      const pied = 'Revizy — épreuve type (document original)';
      contenu.push(
        `BT /F1 8.5 Tf 0.45 0.5 0.58 rg 1 0 0 1 ${this.marge.gauche} ${(this.marge.bas - 26).toFixed(2)} Tm (${echapperPdf(versWinAnsi(pied))}) Tj ET`
      );
    });
    return this;
  }

  construire() {
    this.pagination();
    const objets = [];
    const ajouter = (contenu) => { objets.push(contenu); return objets.length; };

    const idCatalog = ajouter(null); // 1
    const idPages = ajouter(null); // 2
    const idPolice = ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const idPoliceGras = ajouter('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const idInfo = ajouter(
      `<< /Title (${echapperPdf(versWinAnsi(this.titre))}) /Author (${echapperPdf(versWinAnsi(this.auteur))}) ` +
      `/Subject (${echapperPdf(versWinAnsi(this.sujet))}) /Producer (Revizy - generateur PDF natif) >>`
    );

    const idPagesFilles = [];
    for (const contenu of this.pages) {
      const flux = contenu.join('\n');
      const idFlux = ajouter(`<< /Length ${Buffer.byteLength(flux, 'latin1')} >>\nstream\n${flux}\nendstream`);
      const idPage = ajouter(
        `<< /Type /Page /Parent ${idPages} 0 R /MediaBox [0 0 ${this.largeur.toFixed(2)} ${this.hauteur.toFixed(2)}] ` +
        `/Resources << /Font << /F1 ${idPolice} 0 R /F2 ${idPoliceGras} 0 R >> >> /Contents ${idFlux} 0 R >>`
      );
      idPagesFilles.push(idPage);
    }

    objets[idCatalog - 1] = `<< /Type /Catalog /Pages ${idPages} 0 R >>`;
    objets[idPages - 1] = `<< /Type /Pages /Kids [${idPagesFilles.map(i => `${i} 0 R`).join(' ')}] /Count ${idPagesFilles.length} >>`;

    // Table xref
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    objets.forEach((corps, index) => {
      offsets[index + 1] = Buffer.byteLength(pdf, 'latin1');
      pdf += `${index + 1} 0 obj\n${corps}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objets.length + 1} /Root ${idCatalog} 0 R /Info ${idInfo} 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }
}

module.exports = { DocumentPdf, decouper, largeurTexte, PAGE_A4 };
