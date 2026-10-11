// Génère les icônes du site Revizy (favicon PNG + SVG) sans dépendance externe.
// Le logo est dessiné par géométrie : carré arrondi en dégradé bleu + livre ouvert blanc.
// Usage : node tools/generate-favicon.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..');

// --- Géométrie du logo (coordonnées 512x512, identiques au SVG) -------------
const RADIUS = 104;
const PAGES = [
  // Page gauche
  [[116, 150], [252, 182], [252, 384], [116, 356]],
  // Page droite
  [[260, 182], [396, 150], [396, 356], [260, 384]]
];
const RIBBON = [[312, 206], [344, 201], [344, 330], [328, 308], [312, 330]];

const COLOR_TOP = [59, 130, 246];    // #3b82f6
const COLOR_BOTTOM = [29, 78, 216];  // #1d4ed8
const WHITE = [255, 255, 255];
const AMBER = [245, 158, 11];        // #f59e0b

// --- Utilitaires géométriques ----------------------------------------------
function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function insideRoundedRect(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

// Rendu en supersampling 4x pour l'anticrénelage
function render(size) {
  const SS = 4;
  const big = size * SS;
  const scale = big / 512;
  const radius = RADIUS * scale;
  const pages = PAGES.map(poly => poly.map(([x, y]) => [x * scale, y * scale]));
  const ribbon = RIBBON.map(([x, y]) => [x * scale, y * scale]);

  // accumulateur RGB en haute résolution
  const acc = new Float64Array(big * big * 3);
  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      if (!insideRoundedRect(x + 0.5, y + 0.5, big, radius)) continue;

      const t = y / big;
      let color = mix(COLOR_TOP, COLOR_BOTTOM, t);

      let hit = false;
      for (const page of pages) {
        if (pointInPolygon(x + 0.5, y + 0.5, page)) { hit = true; break; }
      }
      if (hit) color = WHITE;

      if (pointInPolygon(x + 0.5, y + 0.5, ribbon)) color = AMBER;

      const idx = (y * big + x) * 3;
      acc[idx] = color[0];
      acc[idx + 1] = color[1];
      acc[idx + 2] = color[2];
    }
  }

  // réduction par moyennage
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const idx = (((y * SS + dy) * big) + (x * SS + dx)) * 3;
          const hasPixel = acc[idx] !== 0 || acc[idx + 1] !== 0 || acc[idx + 2] !== 0;
          if (hasPixel) {
            r += acc[idx]; g += acc[idx + 1]; b += acc[idx + 2]; a += 255;
          }
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      if (a === 0) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        const hits = a / 255;
        out[o] = Math.round(r / hits);
        out[o + 1] = Math.round(g / hits);
        out[o + 2] = Math.round(b / hits);
        out[o + 3] = Math.round(a / n);
      }
    }
  }
  return out;
}

// --- Encodeur PNG minimal ----------------------------------------------------
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(rgba, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // profondeur
  ihdr[9] = 6;   // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtre None
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// --- Écriture des fichiers --------------------------------------------------
const targets = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 }
];

for (const { file, size } of targets) {
  const png = encodePng(render(size), size);
  fs.writeFileSync(path.join(OUT_DIR, file), png);
  console.log(`${file} — ${size}x${size}, ${png.length} octets`);
}

const pagePath = poly => poly.map(([x, y]) => `${x},${y}`).join(' ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="${RADIUS}" ry="${RADIUS}" fill="url(#g)"/>
  <polygon points="${pagePath(PAGES[0])}" fill="#ffffff"/>
  <polygon points="${pagePath(PAGES[1])}" fill="#ffffff"/>
  <polygon points="${pagePath(RIBBON)}" fill="#f59e0b"/>
</svg>
`;
fs.writeFileSync(path.join(OUT_DIR, 'favicon.svg'), svg, 'utf8');
console.log('favicon.svg — ' + svg.length + ' octets');

// --- favicon.ico (les navigateurs le demandent par défaut à /favicon.ico) ----
// Conteneur ICO contenant une image PNG 32x32 (format accepté par tous les navigateurs actuels).
const png32 = fs.readFileSync(path.join(OUT_DIR, 'favicon-32.png'));
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);      // reserved
header.writeUInt16LE(1, 2);      // type = icône
header.writeUInt16LE(1, 4);      // 1 image
header[6] = 32;                  // largeur
header[7] = 32;                  // hauteur
header[8] = 0;                   // palette
header[9] = 0;                   // reserved
header.writeUInt16LE(1, 10);     // color planes
header.writeUInt16LE(32, 12);    // bits par pixel
header.writeUInt32BE(png32.length, 14);
header.writeUInt32LE(22, 18);    // offset des données
fs.writeFileSync(path.join(OUT_DIR, 'favicon.ico'), Buffer.concat([header, png32]));
console.log(`favicon.ico — ${22 + png32.length} octets`);