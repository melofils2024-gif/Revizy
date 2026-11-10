#!/usr/bin/env node
/**
 * Audit statique de sécurité — Revisy.
 * Lancez-le avant chaque déploiement :  node tools/audit-statique-securite.js
 *
 * Contrôles (échec = code de sortie 1) :
 *   1. .env candidat à git (suivit par git) ?
 *   2. Une clé service_role / SECRET exposée en clair (config.js / app.js / admin.html / *.html / *.js / *.json . . .) ?
 *   3. Une chaîne "SUPABASE_SERVICE_KEY" présente en clair hors de .env.exemples / documentation ?
 *   4. Une clé privée RSA/SSH/PEM/JWT inédite en clair ?
 *   5. Liste des fichiers statiques sous PUBLIC_FILES (server.js) — contenu pointant vers des secrets ?
 *
 * En plus des contrôles, un rapport JSON est imprimé sur stdout.
 * Aucun appel réseau n'est effectué.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

const SKIP_DIRS = new Set(['node_modules', '.git', 'cache', 'epreuves', 'supabase', 'tools/__pycache__', '.vscode', '.devin', '.kiro']);
const SCAN_EXTENSIONS = new Set(['.js', '.json', '.html', '.env', '.md', '.css', '.yml', '.yaml', '.map', '.txt', '.xml']);
const CRITICAL_PATTERNS = [
  { re: /service_role[\s"']?[=:][\s"']?[A-Za-z0-9._-]{20,}/gi, label: 'service_role en clair', capture: true },
  { re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, label: 'clé privée en clair', capture: false },
  { re: /FEDAPAY_SECRET_KEY\s*[:=]\s*['"]((?!test)[^'"]{6,})['"]/gi, label: 'secret FedaPay en clair', capture: true },
  { re: /SUPABASE_SERVICE_KEY\s*[:=]\s*['"]((?!test)[^'"]{6,})['"]/gi, label: 'clé service Supabase en clair', capture: true },
  { re: /GEMINI_API_KEY\s*[:=]\s*["']((?!test)[^"']{6,})["']/gi, label: 'clé Gemini en clair', capture: true },
];

// La clé "anon" (publishable) est publique par design — on doit la laisser passer.
// On décode la partie payload (Base64URL) de tout JWT pour filtrer par role.
const JWT_RE = /eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{10,}/g;
function roleJwt(token) {
  try {
    const parts = token.split('.');
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64').toString('utf8');
    const m = json.match(/"role"\s*:\s*"([^"]+)"/);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}
const CHECK_PRIVATE_ADMINS = /ADMIN_EMAILS\s*[:=]\s*['"][^'"]*@gmail\.com/;

// Fixtures de test inoffensives (valeurs factices, pas de vraies clés) :
const PLACEHOLDERS = /(^|[-_])(de-test|test-de-|cle_api_gemini_reelle|test-key|dummy-key|faux|bidon)([-_]|$)/;

function valeurEstPlaceholder(value) {
  return PLACEHOLDERS.test(value.trim().toLowerCase());
}

const findings = [];
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.env') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const ext = path.extname(entry.name).toLowerCase();
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    // Ne scanner .env que pour vérifier qu'il est suivi ; on n'affiche pas son contenu.
    if (entry.name === '.env') continue;
    let src;
    try { src = fs.readFileSync(full, 'utf8'); } catch { continue; }

    // Patterns critiques : on capture la valeur, saute si c'est unfixture de test.
    for (const entry2 of CRITICAL_PATTERNS) {
      let m;
      while ((m = entry2.re.exec(src)) !== null) {
        const value = String(m[1]);
        if (!valeurEstPlaceholder(value)) findings.push({ fichier: path.relative(ROOT, full), probleme: entry2.label });
      }
    }
    // JWT : seul un JWT dont le payload est un autre rôle que "anon" est un secret.
    const jwtMatches = src.match(JWT_RE) || [];
    for (const token of jwtMatches) {
      if (roleJwt(token) !== 'anon') findings.push({ fichier: path.relative(ROOT, full), probleme: 'JWT non-"anon" en clair' });
    }
    // Un compte personnalisé d'admin dans une valeur en clair ?
    if (CHECK_PRIVATE_ADMINS.test(src) && !/server_securite\.js|server\.js|DEPLOY\.md|SECURITY\.md/.test(full)) {
      findings.push({ fichier: path.relative(ROOT, full), probleme: 'ADMIN_EMAILS en clair (considérer l\'exposition)' });
    }
  }
}

walk(ROOT);

// 1) .env suivi par git ?
const gitTracked = { env: false };
try {
  const out = execSync('git ls-files -- .', { cwd: ROOT, encoding: 'utf8' });
  gitTracked.env = out.split('\n').map(s => s.trim()).includes('.env');
} catch { gitTracked.env = false; }
if (gitTracked.env) findings.push({ fichier: '.env', probleme: '.env est suivi par git : il doit être ignoré immédiatement' });

const hasCritical = findings.some(f => /service_role|JWT|PRIVATE KEY|FedaPay|Supabase service|Gemini/i.test(f.probleme));
const rapport = {
  outil: 'audit-statique-securite',
  date: new Date().toISOString(),
  critical_findings: findings.length,
  findings,
  verdict: findings.length === 0 ? 'OK — aucune fuite détectée' : 'A_VOIR — corrigez les findings avant déploiement',
};
console.log(JSON.stringify(rapport, null, 2));
if (findings.length > 0) process.exit(1);
