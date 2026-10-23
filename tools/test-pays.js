// Test du catalogue pays et de la conversion des devises.
const c = require('../contexts.js');

console.log('pays au catalogue =', c.PAYS_DISPONIBLES.length);
const afriques = c.PAYS_DISPONIBLES.filter(p => p.zone === 'afrique');
console.log('pays africains =', afriques.length, '| autres =', c.PAYS_DISPONIBLES.length - afriques.length);

console.log('--- 10 premiers de la liste du selecteur ---');
c.listePaysPourSelecteur().slice(0, 10).forEach(p => {
  console.log('  ', p.code, p.nom, '|', p.devise, '|', p.codeDevise, '| programme:', p.programme);
});

console.log('--- 100 FCFA convertis ---');
['XOF', 'NGN', 'GHS', 'EUR', 'MAD', 'KES'].forEach(d => {
  console.log('  ', d, JSON.stringify(c.prixEnDevise(100, d)));
});

console.log('--- 2000 FCFA convertis (abonnement) ---');
['XOF', 'NGN', 'GHS', 'EUR', 'MAD'].forEach(d => {
  console.log('  ', d, JSON.stringify(c.prixEnDevise(2000, d)));
});

console.log('--- 3000 FCFA convertis (abonnement BAC) ---');
['XOF', 'NGN', 'GHS', 'EUR'].forEach(d => {
  console.log('  ', d, JSON.stringify(c.prixEnDevise(3000, d)));
});

console.log('programme publie : BJ =', c.programmeDisponible('BJ'), '| SN =', c.programmeDisponible('SN'), '| CI =', c.programmeDisponible('CI'));
console.log('devise SN =', JSON.stringify(c.devisePour('SN')), '| devise CI =', JSON.stringify(c.devisePour('CI')));
