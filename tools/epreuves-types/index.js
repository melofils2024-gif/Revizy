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

const DOCUMENTS = []
  .concat(maths.DOCUMENTS)
  .concat(francais.DOCUMENTS)
  .concat(espagnol.DOCUMENTS)
  .concat(allemand.DOCUMENTS)
  .concat(anglais.DOCUMENTS)
  .concat(physique.DOCUMENTS);

module.exports = { DOCUMENTS };
