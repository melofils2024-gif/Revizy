/**
 * Agrège les épreuves types Revisy.
 * Chaque module expose { DOCUMENTS: [...] }.
 */

const maths = require('./contenu-maths');
const francais = require('./contenu-francais');
const espagnol = require('./contenu-espagnol');
const allemand = require('./contenu-allemand');
const anglais = require('./contenu-anglais');
const physique = require('./contenu-physique');
const svt = require('./contenu-sciences-de-la-vie');
const info = require('./contenu-informatique');
const bac = require('./contenu-bac');

const DOCUMENTS = []
  .concat(maths.DOCUMENTS)
  .concat(francais.DOCUMENTS)
  .concat(espagnol.DOCUMENTS)
  .concat(allemand.DOCUMENTS)
  .concat(anglais.DOCUMENTS)
  .concat(physique.DOCUMENTS)
  .concat(svt.DOCUMENTS)
  .concat(info.DOCUMENTS)
  .concat(bac.DOCUMENTS);

module.exports = { DOCUMENTS };
