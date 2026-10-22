// ============================================================
// Revizy — server_seo.js
// Visibilité : pages landing indexables (une URL réelle par
// pays × matière × niveau × série), une page par chapitre publié,
// sitemap dynamique et robots.txt.
//
// Le site est une SPA : sans ces pages, Google ne voit qu'une seule URL.
// Chaque page est du HTML rendu côté serveur (title, description,
// H1, contenu réel, liens internes) puis renvoie vers l'application.
//
// URLs : /<pays>/cours/<slug>.html
//   /cours/<slug>.html           -> alias (301) vers /benin/cours/...
//   /sitemap.xml                 -> toutes les pages, avec hreflang
// ============================================================

const SITE_URL = (process.env.APP_BASE_URL_FRONT || process.env.APP_BASE_URL || 'https://revisy.onrender.com').replace(/\/$/, '');
const SITE_NAME = 'Revizy';

const NIVEAU_LABEL = {
  bac: 'Terminale (BAC)',
  brevet: '3ème (Brevet)'
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036d]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Nettoie un texte de cours (markdown, LaTeX, puces) pour l'afficher
 * en contenu lisible et indexable.
 */
function toPlainText(value, maxLength = 4000) {
  const text = String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+[.)]\s+/gm, '• ')
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

/**
 * Construit la liste des pages landing d'un contexte (pays).
 * @param {object} curriculum  curriculum du contexte
 * @param {object} ctx         contexte (code, slug, textes, prix…)
 */
function buildLandingPages(curriculum, ctx) {
  const pages = [];
  if (!ctx) return pages;
  for (const [niveau, subjects] of Object.entries(curriculum || {})) {
    for (const [subject, value] of Object.entries(subjects || {})) {
      const bySerie = Array.isArray(value) ? { '': value } : value;
      for (const [serie, chapters] of Object.entries(bySerie)) {
        const slug = slugify(`${subject}-${niveau === 'brevet' ? '3eme-brevet' : 'terminale'}${serie ? '-serie-' + serie : ''}`);
        pages.push({
          kind: 'landing',
          slug,
          ctx,
          country: ctx.code,
          countrySlug: ctx.slug,
          subject,
          niveau,
          serie: serie || '',
          chapters: Array.isArray(chapters) ? chapters : []
        });
      }
    }
  }
  return pages;
}

/**
 * Construit une page par chapitre publié en base (contenu réel = SEO).
 */
function buildChapterPages(rows, ctx) {
  if (!Array.isArray(rows)) return [];
  const pages = [];
  for (const row of rows) {
    if (!row || !row.slug) continue;
    const subject = (row.subjects && row.subjects.name) || '';
    const niveau = (row.subjects && row.subjects.niveau_code) || 'bac';
    pages.push({
      kind: 'chapter',
      slug: slugify(row.slug),
      dbSlug: row.slug,
      ctx,
      country: ctx ? ctx.code : 'BJ',
      countrySlug: ctx ? ctx.slug : 'benin',
      subject: subject || 'Cours',
      niveau: niveau === 'brevet' ? 'brevet' : 'bac',
      serie: (row.subjects && row.subjects.serie_code) || '',
      num: Number(row.num) || 0,
      title: row.title || 'Chapitre',
      sa: row.sa_label || '',
      price: Number(row.price) || 0,
      isFree: row.is_free === true,
      content: toPlainText(row.cours, 4000),
      chapters: []
    });
  }
  return pages;
}

/** URL canonique d'une page. */
function pageUrl(page) {
  return `${SITE_URL}/${page.countrySlug}/cours/${page.slug}.html`;
}

/**
 * Titre et description optimisés pour le moteur de recherche.
 */
function buildMeta(page) {
  const ctx = page.ctx || {};
  const textes = ctx.textes || {};
  const paysTitre = textes.paysTitre || '';
  const level = NIVEAU_LABEL[page.niveau] || page.niveau;
  const serieText = page.serie ? ` série ${page.serie}` : '';

  if (page.kind === 'chapter') {
    const saText = page.sa ? ` — ${page.sa}` : '';
    const title = `${page.title} : cours complet${saText} | ${SITE_NAME}`;
    const intro = page.content ? page.content.slice(0, 180) : '';
    const description = `Cours complet « ${page.title} » (${page.subject}, ${level}${serieText}) ${paysTitre} : définitions, méthodes et exemples résolus${page.isFree ? ' — accessible gratuitement' : ''}. ${intro}`.slice(0, 300);
    return { title, description, level, serieText };
  }

  const title = `Cours de ${page.subject} ${level}${serieText} ${paysTitre} — Fiches, QCM corrigés | ${SITE_NAME}`;
  const chapterList = page.chapters.slice(0, 4).join(', ');
  const description = `Programme officiel ${page.subject} ${level}${serieText} ${paysTitre} : ${chapterList}. Cours clairs, fiches synthétiques, QCM corrigés et tuteur IA 24h/24.`.slice(0, 300);
  return { title, description, level, serieText };
}

/**
 * Bloc JSON-LD commun (organisation, site, fil d'Ariane).
 */
function buildJsonLd(page, meta) {
  const ctx = page.ctx || {};
  const textes = ctx.textes || {};
  const canonical = pageUrl(page);
  const appLink = `${SITE_URL}/?matiere=${encodeURIComponent(page.subject)}&niveau=${page.niveau}${page.serie ? '&serie=' + encodeURIComponent(page.serie) : ''}&pays=${encodeURIComponent(page.country || 'BJ')}`;

  const graph = [
    {
      '@type': 'EducationalOrganization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: "Plateforme de révision du programme officiel du Brevet et du BAC.",
      areaServed: { '@type': 'Country', name: ctx.nom || 'Bénin' },
      educationalCredentialAwarded: textes.credential || 'BEPC, BAC'
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ctx.langue || 'fr-BJ',
      publisher: { '@id': `${SITE_URL}/#organization` }
    }
  ];

  if (page.kind === 'chapter') {
    graph.push({
      '@type': 'LearningResource',
      '@id': `${canonical}#resource`,
      name: page.title,
      description: meta.description,
      inLanguage: ctx.langue || 'fr-BJ',
      learningResourceType: 'Cours',
      educationalLevel: meta.level,
      teaches: page.title,
      isAccessibleForFree: page.isFree === true,
      provider: { '@id': `${SITE_URL}/#organization` },
      url: canonical
    });
    if (page.content) {
      graph.push({
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: page.title,
        description: meta.description,
        inLanguage: ctx.langue || 'fr-BJ',
        articleSection: page.subject,
        publisher: { '@id': `${SITE_URL}/#organization` }
      });
    }
  } else {
    const prixChapitre = (ctx.prix && ctx.prix.chapitre && ctx.prix.chapitre[page.niveau]) || 150;
    graph.push({
      '@type': 'Course',
      '@id': `${canonical}#course`,
      name: `${page.subject} — ${meta.level}${meta.serieText}`,
      description: meta.description,
      inLanguage: ctx.langue || 'fr-BJ',
      provider: { '@id': `${SITE_URL}/#organization` },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT30H',
        inLanguage: ctx.langue || 'fr-BJ'
      },
      offers: {
        '@type': 'Offer',
        price: String(prixChapitre),
        priceCurrency: ctx.codeDevise || 'XOF',
        availability: 'https://schema.org/InStock',
        url: appLink
      },
      syllabus: page.chapters.join(' ; ')
    });
  }

  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: ctx.nom || 'Bénin', item: `${SITE_URL}/${page.countrySlug}/` },
      { '@type': 'ListItem', position: 3, name: page.subject, item: canonical }
    ]
  });

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Ajoute la FAQ au JSON-LD (doit être appelé avant le rendu).
 */
function graphFaq(faq, jsonLd) {
  jsonLd['@graph'].push({
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  });
}

/**
 * Page complète (HTML rendu côté serveur).
 */
function renderLandingPage(page, siblings = []) {
  const meta = buildMeta(page);
  const { title, description, level, serieText } = meta;
  const ctx = page.ctx || {};
  const textes = ctx.textes || {};
  const paysTitre = textes.paysTitre || '';
  const paysLocution = textes.paysLocution || '';
  const devise = ctx.devise || 'FCFA';
  const prix = (ctx.prix && ctx.prix.chapitre) || { brevet: 100, bac: 150 };
  const abonnements = (ctx.prix && ctx.prix.abonnement) || { brevet: 2000, bac: 3000 };
  const canonical = pageUrl(page);
  const appLink = `/?matiere=${encodeURIComponent(page.subject)}&niveau=${page.niveau}${page.serie ? '&serie=' + encodeURIComponent(page.serie) : ''}&pays=${encodeURIComponent(page.country || 'BJ')}`;
  const jsonLd = buildJsonLd(page, meta);

  const header = `
  <header style="max-width:900px;margin:0 auto;padding:20px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
    <a href="/" style="font-weight:800;font-size:1.2rem;color:#0f172a;text-decoration:none;">📖 ${SITE_NAME}</a>
    <a href="${appLink}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Commencer gratuitement</a>
  </header>`;

  const footer = `
  <footer style="border-top:1px solid #e2e8f0;padding:22px 18px;text-align:center;color:#64748b;font-size:0.85rem;">
    © ${new Date().getFullYear()} ${SITE_NAME} — ${textes.slogan || 'Réussir le Brevet et le BAC'}
  </footer>`;

  const otherPages = siblings
    .filter(s => s.slug !== page.slug && s.kind === page.kind && s.country === page.country)
    .slice(0, 24)
    .map(s => `<a href="/${s.countrySlug}/cours/${s.slug}.html">${escapeHtml(s.subject)} ${s.niveau === 'brevet' ? '3ème' : 'Terminale'}${s.serie ? ' ' + s.serie : ''}</a>`)
    .join(' · ');

  let body = '';

  if (page.kind === 'chapter') {
    const prixUnitaire = page.price || prix[page.niveau] || 150;
    const priceText = page.isFree
      ? 'Ce chapitre est gratuit.'
      : `Ce chapitre est à ${prixUnitaire} ${devise} (déblocage à l'unité), ou inclus dans l'abonnement mensuel (${abonnements[page.niveau]} ${devise}).`;
    const faq = [
      {
        q: `Que contient le cours « ${page.title} » ?`,
        a: page.content
          ? `Le cours couvre ${page.subject} (${level}${serieText}) : ${page.content.slice(0, 220)}`
          : `Ce cours de ${page.subject} suit le programme officiel du ${level}${serieText} ${paysLocution}.`
      },
      {
        q: `Combien coûte ce cours de ${page.subject} ?`,
        a: `${priceText} Les 3 premiers chapitres de chaque matière sont gratuits.`
      },
      {
        q: `Puis-je réviser ${page.subject} avec un tuteur IA ?`,
        a: "Oui : le tuteur IA de Revizy répond 24h/24 aux questions du programme officiel et prépare les QCM."
      }
    ];

    graphFaq(faq, jsonLd);

    body = `
  <main style="max-width:900px;margin:0 auto;padding:10px 18px 60px;">
    <p style="color:#64748b;font-size:0.9rem;margin:0 0 6px;">
      <a href="/" style="color:#2563eb;">Accueil</a> › <a href="/${page.countrySlug}/" style="color:#2563eb;">${escapeHtml(ctx.nom || 'Bénin')}</a> › ${escapeHtml(page.subject)} › ${escapeHtml(page.title)}
    </p>
    <h1 style="font-size:2rem;color:#0f172a;margin:6px 0 12px;line-height:1.2;">
      ${escapeHtml(page.title)}${page.sa ? ` — ${escapeHtml(page.sa)}` : ''}
    </h1>
    <p style="font-size:1.05rem;color:#334155;max-width:760px;">
      Cours complet de ${escapeHtml(page.subject)} — ${escapeHtml(level)}${escapeHtml(serieText)} ${escapeHtml(paysTitre)}, conforme au programme officiel. ${escapeHtml(priceText)}
    </p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:22px 0;">
      <a href="${appLink}" style="background:#2563eb;color:#fff;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:700;">
        ${page.isFree ? 'Lire le cours gratuitement' : 'Débloquer ce cours'}
      </a>
      <a href="${appLink}&quiz=1" style="background:#16a34a;color:#fff;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:700;">Faire 30 QCM</a>
    </div>

    <h2 style="color:#0f172a;margin-top:34px;">Le cours en détail</h2>
    <div style="color:#334155;line-height:1.85;white-space:pre-wrap;max-width:760px;">
${escapeHtml(page.content || "Ce cours est en cours de rédaction. Reviens bientôt, ou utilise le tuteur IA pour poser tes questions dès maintenant.")}
    </div>

    <h2 style="color:#0f172a;margin-top:34px;">Questions fréquentes</h2>
    ${faq.map(item => `
    <h3 style="font-size:1rem;color:#1e293b;margin:18px 0 4px;">${escapeHtml(item.q)}</h3>
    <p style="color:#475569;margin:0;">${escapeHtml(item.a)}</p>`).join('')}

    <h2 style="color:#0f172a;margin-top:34px;">Autres cours de ${escapeHtml(page.subject)}</h2>
    <p style="line-height:2;color:#475569;">${otherPages || 'Reviens bientôt : de nouveaux cours sont publiés chaque semaine.'}</p>
  </main>`;
  } else {
    const faq = [
      {
        q: `Quels sont les chapitres de ${page.subject} en ${level}${serieText} ${paysTitre} ?`,
        a: `Le programme officiel comprend : ${page.chapters.join(', ')}.`
      },
      {
        q: `Revizy propose-t-il des exercices pour ${page.subject} ?`,
        a: "Oui : chaque matière dispose de QCM et de Vrai/Faux corrigés, d'une banque d'exercices adaptée à la classe, et d'un tuteur IA disponible 24h/24."
      },
      {
        q: `Combien coûte l'accès aux cours de ${page.subject} ?`,
        a: `Les 3 premiers chapitres de chaque matière sont gratuits. Ensuite, ${prix[page.niveau]} ${devise} par chapitre, ou un abonnement mensuel illimité (${abonnements.brevet} ${devise} en 3ème, ${abonnements.bac} ${devise} au BAC).`
      }
    ];

    graphFaq(faq, jsonLd);

    const chapterItems = page.chapters.map(chap => `
      <li>${escapeHtml(chap)}</li>`).join('');

    body = `
  <main style="max-width:900px;margin:0 auto;padding:10px 18px 60px;">
    <p style="color:#64748b;font-size:0.9rem;margin:0 0 6px;">
      <a href="/" style="color:#2563eb;">Accueil</a> › <a href="/${page.countrySlug}/" style="color:#2563eb;">${escapeHtml(ctx.nom || 'Bénin')}</a> › ${escapeHtml(page.subject)} ${escapeHtml(level)}${escapeHtml(serieText)}
    </p>
    <h1 style="font-size:2rem;color:#0f172a;margin:6px 0 12px;line-height:1.2;">
      Cours de ${escapeHtml(page.subject)} — ${escapeHtml(level)}${escapeHtml(serieText)} ${escapeHtml(paysTitre)}
    </h1>
    <p style="font-size:1.05rem;color:#334155;max-width:760px;">
      ${escapeHtml(description)}
    </p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:22px 0;">
      <a href="${appLink}" style="background:#2563eb;color:#fff;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:700;">Réviser ${escapeHtml(page.subject)}</a>
      <a href="${appLink}&quiz=1" style="background:#16a34a;color:#fff;padding:13px 22px;border-radius:12px;text-decoration:none;font-weight:700;">Faire 30 QCM</a>
    </div>

    <h2 style="color:#0f172a;margin-top:34px;">Programme officiel — ${escapeHtml(page.subject)}</h2>
    <ol style="line-height:1.9;color:#334155;padding-left:22px;">
${chapterItems}
    </ol>

    <h2 style="color:#0f172a;margin-top:34px;">Ce que tu obtiens sur ${SITE_NAME}</h2>
    <ul style="line-height:1.9;color:#334155;padding-left:22px;">
      <li>3 chapitres gratuits par matière, sans carte bancaire</li>
      <li>Fiches de cours synthétiques et exemples résolus</li>
      <li>QCM et Vrai/Faux corrigés, banque de 30 questions par classe</li>
      <li>Tuteur IA disponible 24h/24 pour guider l'élève</li>
    </ul>

    <h2 style="color:#0f172a;margin-top:34px;">Questions fréquentes</h2>
    ${faq.map(item => `
    <h3 style="font-size:1rem;color:#1e293b;margin:18px 0 4px;">${escapeHtml(item.q)}</h3>
    <p style="color:#475569;margin:0;">${escapeHtml(item.a)}</p>`).join('')}

    <h2 style="color:#0f172a;margin-top:34px;">Autres matières</h2>
    <p style="line-height:2;color:#475569;">${otherPages}</p>
  </main>`;
  }

  return `<!DOCTYPE html>
<html lang="${ctx.langue || 'fr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#1d4ed8">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/icon-512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:locale" content="fr_BJ">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE_URL}/icon-512.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
${header}
${body}
${footer}
</body>
</html>`;
}

/**
 * Sitemap dynamique : accueil + pages de tous les contextes actifs.
 * Chaque URL déclare ses variantes (hreflang) pour les autres pays.
 */
function buildSitemap(pages = []) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', alternates: [] }
  ];

  // Variantes par (matière, niveau, série) : même contenu, autre pays
  const variants = new Map();
  for (const p of pages) {
    if (!p || !p.slug) continue;
    const key = `${p.subject}|${p.niveau}|${p.serie}|${p.kind}`;
    if (!variants.has(key)) variants.set(key, []);
    variants.get(key).push(p);
  }

  for (const p of pages) {
    if (!p || !p.slug) continue;
    const key = `${p.subject}|${p.niveau}|${p.serie}|${p.kind}`;
    const alts = variants.get(key) || [];
    urls.push({
      loc: pageUrl(p),
      priority: p.kind === 'landing' ? '0.8' : '0.6',
      changefreq: p.kind === 'landing' ? 'weekly' : 'monthly',
      alternates: alts
        .filter(a => a.slug !== p.slug)
        .map(a => ({ hreflang: a.country, href: pageUrl(a) }))
    });
  }

  const body = urls.map(u => {
    const alts = (u.alternates || []).map(a =>
      `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`
    ).join('\n');
    return `  <url>
    <loc>${u.loc}</loc>
${alts}${alts ? '\n' : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /v1/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

module.exports = {
  SITE_URL,
  buildLandingPages,
  buildChapterPages,
  renderLandingPage,
  buildSitemap,
  buildRobots,
  pageUrl,
  slugify,
  toPlainText
};
