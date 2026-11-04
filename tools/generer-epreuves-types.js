/**
 * tools/generer-epreuves-types.js
 *
 * Fabrique les épreuves types Revizy (PDF + Word) et leur catalogue.
 *
 * Les documents sont ÉCRITS PAR NOUS (document original) : on peut donc les
 * héberger et les distribuer. Rien n'est téléchargé depuis un site tiers.
 *
 * Usage : node tools/generer-epreuves-types.js
 * Sortie : epreuves/types/*.pdf, epreuves/types/*.docx, epreuves/types/catalogue.json
 */

const fs = require('fs');
const path = require('path');
const { DocumentPdf } = require('./lib/pdf-mini.js');
const { creerDocx } = require('./lib/docx-mini.js');
const { DOCUMENTS } = require('./epreuves-types/index.js');

const ROOT = path.resolve(__dirname, '..');
const SORTIE = path.join(ROOT, 'epreuves', 'types');

function rendrePdf(document) {
  const pdf = new DocumentPdf({
    titre: document.titre,
    auteur: 'Revizy',
    sujet: `${document.matiere} — ${document.examen} ${document.classe || ''}`.trim()
  });

  for (const bloc of document.blocs) {
    switch (bloc.type) {
      case 'titre':
        pdf.titrePrincipal(bloc.texte);
        break;
      case 'sousTitre':
        pdf.sousTitre(bloc.texte);
        break;
      case 'texte':
        pdf.texte(bloc.texte, { interligne: 15.5 });
        break;
      case 'consigne':
        pdf.encadre(bloc.lignes || [], { taille: 10 });
        break;
      case 'liste':
        for (const item of bloc.items || []) {
          pdf.texte('• ' + item, { indent: 10, interligne: 15.5 });
        }
        pdf.espacement(6);
        break;
      case 'tableau':
        pdf.tableau(bloc.entetes || [], bloc.lignes || []);
        break;
      case 'page':
        pdf.nouvellePage();
        break;
      default:
        break;
    }
  }
  return pdf.construire();
}

function main() {
  fs.mkdirSync(SORTIE, { recursive: true });

  const catalogue = [];
  for (const document of DOCUMENTS) {
    const base = path.join(SORTIE, document.fichier);

    const pdf = rendrePdf(document);
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
