/**
 * Agrège les épreuves types Revizy.
 * Chaque module expose { DOCUMENTS: [...] }.
 */

const maths = require('./contenu-maths');
const francais = require('./contenu-francais');
const espagnol = require('./contenu-espagnol');
const allemand = require('./contenu-allemand');

const DOCUMENTS = []
  .concat(maths.DOCUMENTS)
  .concat(francais.DOCUMENTS)
  .concat(espagnol.DOCUMENTS)
  .concat(allemand.DOCUMENTS);

module.exports = { DOCUMENTS };
