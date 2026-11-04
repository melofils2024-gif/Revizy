/**
 * Génération DOCX minimale, sans dépendance externe.
 *
 * Un .docx est une archive ZIP contenant du XML. On écrit donc :
 *   1. les parties XML (document, styles, types de contenu, relations) ;
 *   2. l'archive ZIP à la main (deflate brut via zlib).
 *
 * Objectif : proposer la même épreuve type en Word, pour que l'élève
 * puisse l'imprimer ou la travailler hors ligne.
 */

const zlib = require('zlib');

// ── CRC32 (nécessaire aux en-têtes ZIP) ────────────────────────────
const TABLE_CRC = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) crc = (crc >>> 8) ^ TABLE_CRC[(crc ^ buffer[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

/** Assemble une archive ZIP (méthode 8 : deflate). */
function creerZip(entrees) {
  const morceaux = [];
  const central = [];
  let offset = 0;

  for (const entree of entrees) {
    const nom = Buffer.from(entree.nom, 'utf8');
    const donnees = Buffer.from(entree.contenu, 'utf8');
    const compresse = zlib.deflateRawSync(donnees, { level: 9 });
    const crc = crc32(donnees);

    const entete = Buffer.alloc(30);
    entete.writeUInt32LE(0x04034B50, 0);
    entete.writeUInt16LE(20, 4);        // version nécessaire
    entete.writeUInt16LE(0, 6);         // drapeaux
    entete.writeUInt16LE(8, 8);         // méthode : deflate
    entete.writeUInt16LE(0, 10);        // heure
    entete.writeUInt16LE(0x21, 12);     // date fixe (1996-01-01) -> archives reproductibles
    entete.writeUInt32LE(crc, 14);
    entete.writeUInt32LE(compresse.length, 18);
    entete.writeUInt32LE(donnees.length, 22);
    entete.writeUInt16LE(nom.length, 26);
    entete.writeUInt16LE(0, 28);

    morceaux.push(entete, nom, compresse);

    const entreeCentral = Buffer.alloc(46);
    entreeCentral.writeUInt32LE(0x02014B50, 0);
    entreeCentral.writeUInt16LE(20, 4);
    entreeCentral.writeUInt16LE(20, 6);
    entreeCentral.writeUInt16LE(0, 8);
    entreeCentral.writeUInt16LE(8, 10);
    entreeCentral.writeUInt16LE(0, 12);
    entreeCentral.writeUInt16LE(0x21, 14);
    entreeCentral.writeUInt32LE(crc, 16);
    entreeCentral.writeUInt32LE(compresse.length, 20);
    entreeCentral.writeUInt32LE(donnees.length, 24);
    entreeCentral.writeUInt16LE(nom.length, 28);
    entreeCentral.writeUInt16LE(0, 30);
    entreeCentral.writeUInt16LE(0, 32);
    entreeCentral.writeUInt16LE(0, 34);
    entreeCentral.writeUInt16LE(0, 36);
    entreeCentral.writeUInt32LE(0, 38);
    entreeCentral.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([entreeCentral, nom]));

    offset += entete.length + nom.length + compresse.length;
  }

  const centralBuffer = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054B50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(central.length, 8);
  fin.writeUInt16LE(central.length, 10);
  fin.writeUInt32LE(centralBuffer.length, 12);
  fin.writeUInt32LE(offset, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...morceaux, centralBuffer, fin]);
}

// ── XML ─────────────────────────────────────────────────────────────
function echapperXml(texte) {
  return String(texte === null || texte === undefined ? '' : texte)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function paragraphe(texte, options = {}) {
  const gras = options.gras ? '<w:b/>' : '';
  const taille = options.taille ? `<w:sz w:val="${Math.round(options.taille * 2)}"/>` : '';
  const espacement = options.espacement
    ? `<w:spacing w:before="${Math.round(options.espacement * 20)}" w:after="${Math.round(options.espacement * 20)}"/>`
    : '<w:spacing w:after="80"/>';
  const alignement = options.centre ? '<w:jc w:val="center"/>' : (options.justifie ? '<w:jc w:val="both"/>' : '');
  const style = options.style ? `<w:pStyle w:val="${options.style}"/>` : '';
  const couleur = options.couleur ? `<w:color w:val="${options.couleur}"/>` : '';
  return `<w:p><w:pPr>${style}${alignement}${espacement}</w:pPr>` +
    `<w:r><w:rPr>${gras}${taille}${couleur}</w:rPr>` +
    `<w:t xml:space="preserve">${echapperXml(texte)}</w:t></w:r></w:p>`;
}

function tableau(entetes, lignes) {
  const bordure = '<w:tblBorders>' +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map(c => `<w:${c} w:val="single" w:sz="4" w:space="0" w:color="B8C4D9"/>`).join('') +
    '</w:tblBorders>';
  const ligneEntete = `<w:tr>${entetes.map(e =>
    `<w:tc><w:tcPr><w:shd w:val="clear" w:fill="EEF2FA"/></w:tcPr>${paragraphe(e, { gras: true })}</w:tc>`).join('')}</w:tr>`;
  const corps = lignes.map(l => `<w:tr>${l.map(c =>
    `<w:tc>${paragraphe(c)}</w:tc>`).join('')}</w:tr>`).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${bordure}</w:tblPr>` +
    `<w:tblGrid><w:gridCol w:w="3000"/></w:tblGrid>${ligneEntete}${corps}</w:tbl>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
</w:styles>`;

/**
 * Construit un .docx à partir d'une liste de blocs (même structure que
 * le générateur PDF).
 */
function creerDocx(options = {}) {
  const blocs = options.blocs || [];
  const corps = [];

  for (const bloc of blocs) {
    switch (bloc.type) {
      case 'titre':
        corps.push(paragraphe(bloc.texte, { gras: true, taille: 16, centre: true, espacement: 6 }));
        break;
      case 'sousTitre':
        corps.push(paragraphe(bloc.texte, { gras: true, taille: 13, espacement: 6 }));
        break;
      case 'texte':
        corps.push(paragraphe(bloc.texte, { justifie: true }));
        break;
      case 'consigne':
        for (const ligne of bloc.lignes || []) {
          corps.push(paragraphe(ligne, { gras: true, taille: 10.5, centre: true }));
        }
        corps.push(paragraphe('', { espacement: 2 }));
        break;
      case 'liste':
        for (const item of bloc.items || []) {
          corps.push(paragraphe('- ' + item, { justifie: true }));
        }
        break;
      case 'tableau':
        corps.push(tableau(bloc.entetes || [], bloc.lignes || []));
        corps.push(paragraphe('', { espacement: 2 }));
        break;
      case 'page':
        corps.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
        break;
      default:
        break;
    }
  }

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${corps.join('')}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
</w:sectPr></w:body></w:document>`;

  return creerZip([
    { nom: '[Content_Types].xml', contenu: CONTENT_TYPES },
    { nom: '_rels/.rels', contenu: RELS },
    { nom: 'word/_rels/document.xml.rels', contenu: DOC_RELS },
    { nom: 'word/styles.xml', contenu: STYLES },
    { nom: 'word/document.xml', contenu: document }
  ]);
}

module.exports = { creerDocx, creerZip, crc32 };
