/**
 * Analyse statique du SQL de migration.
 *
 * PostgreSQL refuse un « ON CONFLICT (expr, …) » s'il n'existe aucun index
 * unique dont les expressions correspondent EXACTEMENT. C'est une erreur
 * d'EXÉCUTION : invisible à la relecture, fatale au milieu d'une migration
 * (tout est annulé) ou au premier appel de la fonction concernée.
 *
 * C'est exactement la famille de bugs qui a fait échouer la migration
 * (déclencheur « INSERT OR UPDATE OF »). Ce module sert de garde-fou.
 *
 * Exports : analyseOnConflict(sql), expressionsEquivalentes(a, b)
 */
'use strict';

/** Minuscules, espaces normalisés, parenthèses extérieures superflues retirées. */
function normaliserExpression(expr) {
  let s = String(expr || '').replace(/\s+/g, ' ').trim().toLowerCase();
  // retire les parenthèses qui n'enveloppent qu'une expression
  let change = true;
  while (change) {
    change = false;
    if (s.startsWith('(') && s.endsWith(')')) {
      let depth = 0;
      let enveloppeTout = true;
      let inStr = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inStr) { if (c === "'") { if (s[i + 1] === "'") i++; else inStr = false; } continue; }
        if (c === "'") { inStr = true; continue; }
        if (c === '(') depth++;
        else if (c === ')') { depth--; if (depth === 0 && i < s.length - 1) { enveloppeTout = false; break; } }
      }
      if (enveloppeTout) { s = s.slice(1, -1).trim(); change = true; }
    }
  }
  return s;
}

/** Contenu entre parenthèses équilibrées (null si non fermé). */
function parentheseEquilibree(texte, openIdx) {
  let depth = 0, inStr = false;
  for (let i = openIdx; i < texte.length; i++) {
    const c = texte[i];
    if (inStr) { if (c === "'") { if (texte[i + 1] === "'") i++; else inStr = false; } continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return texte.slice(openIdx + 1, i); }
  }
  return null;
}

/** Découpe une liste d'expressions sur les virgules de premier niveau. */
function splitExpressions(s) {
  const out = [];
  let cur = '', depth = 0, inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      cur += c;
      if (c === "'") { if (s[i + 1] === "'") cur += s[++i]; else inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map(normaliserExpression);
}

/** Index uniques déclarés : table → [{ nom, colonnes }] */
function collecterIndexUniques(sql) {
  const parTable = new Map();
  const re = /create\s+unique\s+index\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+on\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const inner = parentheseEquilibree(sql, m.index + m[0].length - 1);
    if (inner === null) continue;
    const table = m[2].toLowerCase();
    if (!parTable.has(table)) parTable.set(table, []);
    parTable.get(table).push({ nom: m[1].toLowerCase(), colonnes: splitExpressions(inner) });
  }
  return parTable;
}

/** Contraintes de table : clé primaire, unique (multi-colonnes), colonne unique. */
function collecterContraintes(sql) {
  const tables = new Map();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const inner = parentheseEquilibree(sql, m.index + m[0].length - 1);
    if (inner === null) continue;
    const table = m[1].toLowerCase();
    const info = { pk: [], uniques: [], uniqueCols: new Set() };
    const reC = /unique\s*\(/gi;
    let c;
    while ((c = reC.exec(inner)) !== null) {
      const cols = parentheseEquilibree(inner, c.index + c[0].length - 1);
      if (cols) info.uniques.push(splitExpressions(cols));
    }
    const rePk = /primary\s+key\s*\(/gi;
    while ((c = rePk.exec(inner)) !== null) {
      const cols = parentheseEquilibree(inner, c.index + c[0].length - 1);
      if (cols) info.pk = splitExpressions(cols);
    }
    splitExpressions(inner).forEach(def => {
      const nom = (def.match(/^([a-z0-9_"]+)\s/) || [])[1];
      if (!nom) return;
      const nomNet = nom.replace(/"/g, '').toLowerCase();
      if (/\bunique\b/.test(def) && !/\bunique\s*\(/.test(def)) info.uniqueCols.add(nomNet);
      if (/\bprimary\s+key\b/.test(def)) info.pk = [nomNet];
    });
    if (!tables.has(table)) tables.set(table, info);
  }
  return tables;
}

/**
 * Définitions de fonctions, dans l'ordre : sert à savoir si une version
 * antérieure d'une fonction est supplantée par une version plus récente
 * (même nom et même nombre d'arguments).
 */
function collecterFonctions(sql) {
  const re = /(?:create\s+(?:or\s+replace\s+)?function|drop\s+function\s+if\s+exists)\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  const defs = [];
  let m;
  while ((m = re.exec(sql)) !== null) {
    const inner = parentheseEquilibree(sql, m.index + m[0].length - 1);
    if (inner === null) continue;
    const args = splitExpressions(inner).filter(a => !['default', 'null'].includes(a)).length;
    defs.push({ nom: m[1].toLowerCase(), args, pos: m.index, type: /^\s*drop/i.test(m[0]) ? 'drop' : 'create' });
  }
  return defs;
}

/** Une cible ON CONFLICT correspond-elle à un index unique déclaré ? */
function cibleIndexee(cible, table, indexUniques, contraintes) {
  for (const idx of (indexUniques.get(table) || [])) {
    if (idx.colonnes.length === cible.length && idx.colonnes.every((c, i) => c === cible[i])) {
      return 'index ' + idx.nom;
    }
  }
  const info = contraintes.get(table);
  if (info) {
    for (const u of info.uniques) {
      if (u.length === cible.length && u.every((c, i) => c === cible[i])) return 'contrainte unique';
    }
    if (info.pk.length === cible.length && info.pk.every((c, i) => c === cible[i])) return 'clé primaire';
    if (cible.length === 1 && info.uniqueCols.has(cible[0])) return 'colonne unique';
  }
  // Table que le script ne gère pas (storage.objects, auth.users…) : on ne
  // peut pas juger, ce n'est pas une cible de migration.
  if (!indexUniques.has(table) && !contraintes.has(table)) {
    return 'table externe (hors script)';
  }
  return null;
}

/**
 * Analyse complète. Renvoie { problemes, cibles } où chaque cible décrit la
 * table, la cible, le verdict et, le cas échéant, la raison.
 */
function analyseOnConflict(sql) {
  const indexUniques = collecterIndexUniques(sql);
  const contraintes = collecterContraintes(sql);
  const fonctions = collecterFonctions(sql);

  const cibles = [];
  const re = /\bon\s+conflict\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const inner = parentheseEquilibree(sql, m.index + m[0].length - 1);
    if (inner === null) continue;
    const cible = splitExpressions(inner);
    const avant = sql.slice(Math.max(0, m.index - 8000), m.index);
    const inserts = [...avant.matchAll(/insert\s+into\s+(?:public\.)?([a-z0-9_]+)/gi)];
    const table = inserts.length ? inserts[inserts.length - 1][1].toLowerCase() : '?';
    const ligne = sql.slice(0, m.index).split('\n').length;

    // La cible est-elle dans le corps d'une fonction ? Si oui, elle ne compte
    // que si cette version de la fonction est la dernière (une version
    // ultérieure de la même fonction la remplace).
    const dansFonction = [...avant.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi)];
    let supplantee = false;
    if (dansFonction.length) {
      const nom = dansFonction[dansFonction.length - 1][1].toLowerCase();
      const apres = sql.slice(m.index);
      const suivantes = [...apres.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi)];
      supplantee = suivantes.some(n => n[1].toLowerCase() === nom);
    }

    const verdict = cibleIndexee(cible, table, indexUniques, contraintes);
    cibles.push({ table, cible, ligne, verdict, supplantee, dansFonction: dansFonction.length > 0 });
  }

  // Dédoublonnage : une même cible répétée (le seed répète 100 fois la même)
  const vus = new Set();
  const uniques = [];
  cibles.forEach(c => {
    const cle = c.table + '|' + c.cible.join(',');
    if (vus.has(cle)) return;
    vus.add(cle);
    uniques.push(c);
  });

  const problemes = uniques.filter(c => !c.verdict && !c.supplantee);
  return { problemes, cibles: uniques, total: cibles.length };
}

/**
 * Vérifie qu'un « INSERT INTO t (colonnes…) VALUES (valeurs…) » ou
 * « INSERT INTO t (colonnes…) SELECT valeurs… » a bien autant de valeurs
 * que de colonnes : un écart est une erreur d'EXÉCUTION.
 */
function analyserInsertions(sql) {
  const problemes = [];
  const re = /insert\s+into\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const table = m[1].toLowerCase();
    const colsInner = parentheseEquilibree(sql, m.index + m[0].length - 1);
    if (colsInner === null) continue;
    const colonnes = splitExpressions(colsInner);
    if (!colonnes.length) continue;

    const suite = sql.slice(m.index + m[0].length + colsInner.length + 1);
    const apres = suite.replace(/^\s*\)/, '');

    let valeurs = null;
    let forme = '';
    const reValues = /^\s*values\s*\(/i;
    const reSelect = /^\s*select\s+/i;
    if (reValues.test(apres)) {
      const open = apres.search(reValues) + apres.slice(apres.search(reValues)).length - 1;
      const inner = parentheseEquilibree(apres, open);
      if (inner !== null) {
        valeurs = splitExpressions(inner);
        forme = 'values';
      }
    } else if (reSelect.test(apres)) {
      const mSelect = reSelect.exec(apres);
      const debut = mSelect ? mSelect[0].length : 0;
      const fin = apres.slice(debut).search(/\bfrom\b/i);
      const liste = fin >= 0 ? apres.slice(debut, debut + fin) : apres.slice(debut);
      valeurs = splitExpressions(liste);
      forme = 'select';
    }
    if (!valeurs) continue;

    // La ligne « select 'slug', s.id, … » : les valeurs scalaires doivent
    // correspondre au nombre de colonnes. Les fonctions (count(*), etc.)
    // comptent pour une.
    if (valeurs.length !== colonnes.length) {
      const ligne = sql.slice(0, m.index).split('\n').length;
      problemes.push({
        table,
        forme,
        colonnes: colonnes.length,
        valeurs: valeurs.length,
        ligne
      });
    }
  }
  return problemes;
}

module.exports = {
  analyseOnConflict,
  analyserInsertions,
  normaliserExpression,
  splitExpressions,
  parentheseEquilibree,
  collecterIndexUniques,
  collecterContraintes
};
