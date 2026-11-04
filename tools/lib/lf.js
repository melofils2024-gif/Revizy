/**
 * tools/lib/lf.js — normalisation des fins de ligne.
 *
 * Pourquoi : sur Windows, un fichier SQL réécrit par PowerShell ou par un
 * script Node peut se retrouver en CRLF (ou pire, en « mixte »). Or Git
 * n'applique sa normalisation CRLF→LF que sur les fichiers qu'il a classés
 * comme textuels. Un fichier SQL en CRLF finit donc versionné en CRLF, et
 * chaque régénération repeint le fichier entier (diff de plusieurs centaines
 * de lignes au lieu de quelques lignes utiles).
 *
 * Règle du dépôt : le SQL est TOUJOURS en LF (voir .gitattributes). Cet
 * utilitaire sert de filet de sécurité dans les générateurs : même si une
 * source est réécrite en CRLF, le SQL produit reste en LF et le diff reste
 * lisible.
 */

/** Convertit tous les CRLF et CR isolés en LF. */
function normaliserLF(contenu) {
  return String(contenu).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

module.exports = { normaliserLF };
