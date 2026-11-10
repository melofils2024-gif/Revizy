/**
 * tools/generer-epreuves-types.js
 *
 * Fabrique les épreuves types Revisy (PDF + Word) et leur catalogue.
 *
 * Les documents sont ÉCRITS PAR NOUS (document original) : on peut donc les
 * héberger et les distribuer. Rien n'est téléchargé depuis un site tiers.
 *
 * Usage : node tools/generer-epreuves-types.js
 * Sortie : epreuves/types/*.pdf, epreuves/types/*.docx, epreuves/types/catalogue.json
 */

const fs = require('fs');
const path = require('path');
const { rendreBlocsPdf } = require('./lib/pdf-mini.js');
const { creerDocx } = require('./lib/docx-mini.js');
const { DOCUMENTS } = require('./epreuves-types/index.js');

const ROOT = path.resolve(__dirname, '..');
const SORTIE = path.join(ROOT, 'epreuves', 'types');

function main() {
  fs.mkdirSync(SORTIE, { recursive: true });

  const catalogue = [];
  for (const document of DOCUMENTS) {
    const base = path.join(SORTIE, document.fichier);

    const pdf = rendreBlocsPdf(document.blocs, {
      titre: document.titre,
      sujet: `${document.matiere} — ${document.examen} ${document.classe || ''}`.trim()
    });
    fs.writeFileSync(base + '.pdf', pdf);

    const docx = creerDocx({ titre: document.titre, blocs: document.blocs });
    fs.writeFileSync(base + '.docx', docx);

    catalogue.push({
      id: document.id,
      fichier: document.fichier,
      titre: document.titre,
      description: document.description || '',
      examen: document.examen,
      niveau: document.niveau,
      classe: document.classe || null,
      serie: document.serie || null,
      annee: document.annee,
      matiere: document.matiere,
      type: document.type,
      source: { nom: document.sourceNom, url: document.sourceUrl, licence: document.licence },
      formats: [
        { format: 'pdf', nom: document.fichier + '.pdf', octets: pdf.length },
        { format: 'docx', nom: document.fichier + '.docx', octets: docx.length }
      ]
    });

    console.log(`✓ ${document.fichier}.pdf (${pdf.length} o) + .docx (${docx.length} o)`);
  }

  fs.writeFileSync(
    path.join(SORTIE, 'catalogue.json'),
    JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), documents: catalogue }, null, 2),
    'utf8'
  );
  console.log(`\n${catalogue.length} document(s) — catalogue : epreuves/types/catalogue.json`);
}

main();
