// API IA optionnelle (pas encore sur Render). La base de données = Supabase via config.js
const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000/v1"
  : "https://revisy.onrender.com/v1";

const FEDAPAY_PUBLIC_KEY = 'pk_live_f9-BhipsvocdGhiSS2CxeyBA';

const MAX_ADMINS = 2;

const cfg = window.REVIZY_CONFIG || {};
const supabaseConfigured = Boolean(
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !String(cfg.SUPABASE_URL).includes('VOTRE_PROJECT_REF') &&
  !String(cfg.SUPABASE_ANON_KEY).includes('VOTRE_CLE')
);

const _supabaseLib = window.supabase;
const supabaseClient = (supabaseConfigured && _supabaseLib)
  ? _supabaseLib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;

function requireSupabase() {
  if (!supabaseClient) {
    alert("Supabase n'est pas configuré. Remplis SUPABASE_URL et SUPABASE_ANON_KEY dans config.js.");
    return false;
  }
  return true;
}

const state = {
  currentView: 'dashboard',
  currentNiveau: 'bac',
  currentSerie: 'C',
  user: null,
  unlockedChapterIds: [],
  unlockedMap: {},

  globalStats: {
    totalUsers: 0,
    unlockedChapters: 0,
    successRate: "0%"
  },

  adminStats: {
    revenue: 0,
    studentsCount: 0,
    fichesCount: 0
  },

  transactions: [],
  usersList: []
};

async function getAccessToken() {
  if (!supabaseClient) return '';
  const { data: { session } } = await supabaseClient.auth.getSession();
  return (session && session.access_token) || '';
}

const chapitresDatabase = {
  bac: {},
  brevet: {}
};

const matieresData = {
  bac: {
    "A": [
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Anglais', icon: '🔤' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'SVT', icon: '🧬' }
    ],
    "B": [
      { name: 'Économie', icon: '📊' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "C": [
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Physique-Chimie', icon: '🧪' },
      { name: 'SVT', icon: '🧬' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "D": [
      { name: 'SVT', icon: '🧬' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Physique-Chimie', icon: '🧪' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Histoire-Géographie', icon: '🗺️' },
      { name: 'Anglais', icon: '🔤' }
    ],
    "G": [
      { name: 'Comptabilité', icon: '💼' },
      { name: 'Économie', icon: '📊' },
      { name: 'Mathématiques', icon: '📐' },
      { name: 'Français & Littérature', icon: '📚' },
      { name: 'Philosophie', icon: '🧠' },
      { name: 'Anglais', icon: '🔤' }
    ]
  },
  brevet: [
    { name: 'Mathématiques', icon: '📐' },
    { name: 'Physique-Chimie-Technologie', icon: '🧪' },
    { name: 'SVT', icon: '🧬' },
    { name: 'Français', icon: '📚' },
    { name: 'Histoire-Géographie', icon: '🗺️' },
    { name: 'Anglais', icon: '🔤' },
    { name: 'Lecture / Dictée', icon: '📝' }
  ]
};

const KNOWLEDGE_BASE = {
  bac: {
    "Mathématiques": {
      chapters: [
        { title: "Suite numériques & Récurrence", sa: "SA 2", price: 200,
          cours: "Suite numérique (u_n) : fonction de ℕ → ℝ. Arithmétique : raison r, u_{n+1}=u_n+r, u_n = u_0 + n·r, somme S_n = (n+1)·(u_0+u_n)/2. Géométrique : raison q, u_{n+1}=q·u_n, u_n = u_0·q^n, somme S_n = u_0·(1-q^{n+1})/(1-q). Récurrence : 1) Initialisation (vérifier P(n0)), 2) Hérédité (supposer P(n) vraie, démontrer P(n+1)), 3) Conclusion." },
        { title: "Calcul Vectoriel dans le plan", sa: "SA 2", price: 200,
          cours: "Vecteur du plan : coordonnées (x, y), directions, norme ||u|| = √(x²+y²). Vecteurs colinéaires : u = k·v. Vecteurs orthogonaux : u · v = 0 (produit scalaire nul). Produit scalaire : u · v = ||u||·||v||·cos(θ) = u_x·v_x + u_y·v_y. Angle via cos(θ) = (u·v)/(||u||·||v||)." },
        { title: "Fonctions logarithmes & Exponentielles", sa: "SA 3", price: 200,
          cours: "ln : R⁺* → R, continue, bijective, dérivable. ln(ab) = ln a + ln b, ln(a/b) = ln a - ln b, ln(a^n) = n ln a. ln(e^x) = x, e^(ln x) = x. ln'(x) = 1/x. exp : R → R⁺*, exp'(x)=exp(x). ln 1 = 0, ln e = 1, e^0 = 1, e^1 = e." }
      ],
      vf: [
        { q: "Dans une suite arithmétique, la différence entre deux termes consécutifs est constante.", a: true, e: "C'est la définition même : u_{n+1} − u_n = r (raison)." },
        { q: "Le produit scalaire de deux vecteurs est toujours positif.", a: false, e: "Il peut être négatif si l'angle entre eux est obtus (>90°)." }
      ]
    },
    "Physique-Chimie": {
      chapters: [
        { title: "Chimie Organique : Alcools et alcanes", sa: "SA 2", price: 200,
          cours: "Alcanes : C_nH_{2n+2}, saturation, liaisons simples σ, famille homologue (méthane CH4, éthane C2H6, propane C3H8). Alcools : C_nH_{2n+2}O, groupe -OH (hydroxyle). Méthanol CH3OH, éthanol C2H5OH. Propriétés : polarité, solubilité dans l'eau (petits), liaison hydrogène. Oxydation douce alcool primaire → aldéhyde → acide carboxylique ; alcool secondaire → cétone." },
        { title: "Mécanique : Moment d'une force", sa: "SA 2", price: 200,
          cours: "Moment M_O(F) d'une force F par rapport à un point O : norme M = F × d (d = distance de O à droite support de F) ; ou M = r · F · sin(θ). Unité : N·m. Couple : deux forces opposées, parallèles, distinctes, tendent à faire tourner sans translater. Théorème du moment cinétique." }
      ],
      vf: [
        { q: "L'éthanol contient un groupe hydroxyle -OH.", a: true, e: "Oui : formule semi-développée CH₃-CH₂-OH." },
        { q: "Les alcanes sont des hydrocarbures insaturés.", a: false, e: "Les alcanes sont SATURÉS (seulement liaisons simples, pas de double ni triple)." }
      ]
    },
    "SVT": {
      chapters: [
        { title: "Immunologie et Système Immunitaire", sa: "SA 2", price: 200,
          cours: "Immunité innée (naturelle, non spécifique, immédiate) : barrières physiques, phagocytes (macrophages, neutrophiles), inflammation, système du complément. Immunité adaptative (spécifique, mémoire) : Lymphocytes B → plasmocytes → anticorps (immunité humorale). Lymphocytes T (Helper = CD4, Cytotoxiques = CD8, T régulateurs). Antigène, épitope, réponse primaire vs secondaire. Vaccins : mémoire immunologique. Pathologies : auto-immunité, déficit (SIDA), allergies." },
        { title: "Écologie et Biosphère", sa: "SA 3", price: 200,
          cours: "Biosphère : zone où vivent les êtres vivants (sur/atmo/hydro). Cycles biogéochimiques : C, N, H2O. Rétroactions positives/négatives. Réchauffement climatique anthropique : gaz à effet de serre (CO₂, CH₄, N₂O). Biodiversité : génétique, spécifique, écosystémique. Pertes : destruction habitat, surexploitation, pollution, espèces envahissantes, climat. Solutions : conservation (in situ, ex situ), développement durable, aires protégées." }
      ],
      vf: [
        { q: "Un lymphocyte B produit des anticorps.", a: true, e: "Après activation par un antigène, il se différencie en plasmocyte qui sécrète des anticorps." },
        { q: "L'immunité innée utilise une mémoire spécifique.", a: false, e: "La MEMOIRE est caractéristique de l'immunité ADAPTATIVE (acquise)." }
      ]
    }
  }
};

function escapeStr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  updateNavbar();
  await checkSession();
  renderNiveauTabs();
  renderMatieres();
  await loadPublicStats();
  renderHomeStats();

  if (window.lucide) lucide.createIcons();
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 200);
});

function renderHomeStats() {
  const usersEl = document.getElementById('statTotalUsers');
  const chaptersEl = document.getElementById('statUnlockedChapters');
  const rateEl = document.getElementById('statSuccessRate');

  if (usersEl) usersEl.textContent = state.globalStats.totalUsers;
  if (chaptersEl) chaptersEl.textContent = state.globalStats.unlockedChapters;
  if (rateEl) rateEl.textContent = state.globalStats.successRate;
}

async function loadPublicStats() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.rpc('get_public_stats');
    if (error || !data) return;
    state.globalStats.totalUsers = data.total_users || 0;
    state.globalStats.unlockedChapters = data.unlocked_chapters || 0;
    state.globalStats.successRate = data.success_rate || '98%';
  } catch (e) {
    console.warn('Stats publiques indisponibles', e);
  }
}

async function checkSession() {
  state.unlockedChapterIds = [];
  state.unlockedMap = {};
  state.user = null;

  if (!supabaseClient) {
    updateNavbar();
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      await hydrateUser(session.user);
      await loadUserUnlocks(session.user.id);
    }
  } catch (e) {
    console.warn('Session Supabase', e);
    state.user = null;
  }
  updateNavbar();
}

async function hydrateUser(authUser) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('id, email, name, role, niveau')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) console.warn('Profil', error);

  state.user = {
    id: authUser.id,
    email: (profile && profile.email) || authUser.email,
    name: (profile && profile.name) || (authUser.user_metadata && authUser.user_metadata.name) || authUser.email.split('@')[0],
    role: (profile && profile.role) || 'client',
    niveau: (profile && profile.niveau) || state.currentNiveau
  };
}

async function loadUserUnlocks(userId) {
  const { data, error } = await supabaseClient
    .from('unlocked_chapters')
    .select('chapter_id, title, niveau, subject, price')
    .eq('user_id', userId);

  if (error) {
    console.warn('Unlocks', error);
    return;
  }

  state.unlockedChapterIds = (data || []).map(r => r.chapter_id);
  state.unlockedMap = {};
  (data || []).forEach(r => {
    state.unlockedMap[r.chapter_id] = {
      title: r.title,
      niveau: r.niveau,
      subject: r.subject,
      price: r.price
    };
  });
}

function updateNavbar() {
  const container = document.getElementById('navActions');
  if (!container) return;

  if (state.user) {
    const isClient = state.user.role === 'client';
    container.innerHTML = `
      <button class="btn btn-outline" onclick="go('${isClient ? 'client-dashboard' : 'admin-dashboard'}')">
        ${isClient ? '👤 Mon Espace Élève' : '⚙️ Espace Admin'}
      </button>
      <button class="btn btn-ghost" onclick="logout()">Déconnexion</button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-primary" onclick="go('auth')">Se connecter / S'inscrire</button>
    `;
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  state.user = null;
  state.unlockedChapterIds = [];
  state.unlockedMap = {};
  updateNavbar();
  go('dashboard');
}

function go(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    state.currentView = viewId;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (viewId === 'client-dashboard' && state.user) renderClientDashboard();
  if (viewId === 'admin-dashboard' && state.user) renderAdminDashboard();
}

function switchNiveau(niveau) {
  state.currentNiveau = niveau;
  state.currentSerie = niveau === 'bac' ? 'C' : null;
  renderNiveauTabs();
  renderMatieres();
}

function switchSerie(serie) {
  state.currentSerie = serie;
  renderNiveauTabs();
  renderMatieres();
}

function renderNiveauTabs() {
  const tabs = document.getElementById('niveauTabs');
  if (!tabs) return;

  let html = `
    <button class="niveau-tab ${state.currentNiveau === 'brevet' ? 'active' : ''}" onclick="switchNiveau('brevet')">Brevet (3ème)</button>
    <button class="niveau-tab ${state.currentNiveau === 'bac' ? 'active' : ''}" onclick="switchNiveau('bac')">BAC (Terminale)</button>
  `;

  if (state.currentNiveau === 'bac') {
    html += `
      <div style="width:100%; display:flex; justify-content:center; margin-top:12px; gap:8px; flex-wrap:wrap;">
        ${['A', 'B', 'C', 'D', 'G'].map(s => `
          <button class="serie-badge ${state.currentSerie === s ? 'active' : ''}" onclick="switchSerie('${s}')">Série ${s}</button>
        `).join('')}
      </div>
    `;
  }
  tabs.innerHTML = html;
}

function renderMatieres() {
  const grid = document.getElementById('matiereGrid');
  if (!grid) return;

  let currentList;
  if (state.currentNiveau === 'bac') {
    currentList = (matieresData.bac && matieresData.bac[state.currentSerie]) ? matieresData.bac[state.currentSerie] : matieresData.bac["C"];
  } else {
    currentList = matieresData.brevet || [];
  }

  if (currentList.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:var(--text-muted);">Aucune matière disponible.</p>`;
    return;
  }

  grid.innerHTML = currentList.map(m => `
    <div class="matiere-card" onclick="openMatiere('${escapeStr(m.name)}')">
      <span class="icone">${m.icon}</span>
      <h3>${escapeStr(m.name)}</h3>
      <div class="matiere-meta">
        ${state.currentNiveau === 'bac' ? `<span class="mini-badge serie">Série ${state.currentSerie}</span>` : '<span class="mini-badge brevet">Brevet</span>'}
      </div>
    </div>
  `).join('');
}

function getAllChaptersAndSubjects() {
  const all = [];
  for (const niveau of Object.keys(chapitresDatabase)) {
    const bySubj = chapitresDatabase[niveau];
    for (const subject of Object.keys(bySubj)) {
      for (const chap of bySubj[subject]) {
        all.push({ ...chap, niveau, subject });
      }
    }
  }
  return all;
}

function generateAutoContentFallback(subjectName, niveau) {
  const knowledge = (KNOWLEDGE_BASE[niveau] && KNOWLEDGE_BASE[niveau][subjectName]) ? KNOWLEDGE_BASE[niveau][subjectName] : null;
  const prefixId = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const niveauTexte = niveau === 'bac' ? `Terminale (BAC Série ${state.currentSerie})` : '3ème (Brevet)';
  const price = niveau === 'brevet' ? 150 : 200;

  const chapters = [];

  chapters.push({
    id: `${niveau}_${prefixId}_auto_ch1_${Date.now()}`,
    num: 1,
    title: `SA 1 : Fondamentaux en ${subjectName} — Chapitre 1 : Introduction`,
    isFree: true,
    price: 0,
    cours: `Bienvenue dans le cours d'introduction de ${subjectName} pour le ${niveauTexte}. Cette Situation d'Apprentissage pose les bases théoriques : les concepts clés, les définitions fondamentales et la méthodologie de la matière. Apprendre c'est maîtriser le vocabulaire, puis les relations entre notions, enfin les applications dans l'exercice. Dans cette matière, on privilégie la rigueur, la structure et l'usage des mots de spécialité.`,
    exemple: {
      titre: "Exemple d'analyse — Méthodologie",
      enonce: `Comment réussir une question type en ${subjectName} à l'examen ?`,
      solution: "Étape 1 : Lire la consigne DEUX FOIS. Étape 2 : Identifier le concept interrogé. Étape 3 : Mettre ses connaissances en réseau (schéma mental). Étape 4 : Rédiger, structurer par paragraphes, argumenter, citer des exemples. Vérifier."
    },
    exercice: {
      consigne: "QCM — Vérification compréhension",
      question: `Quel est la bonne approche pour étudier ${subjectName} ?`,
      type: "qcm",
      options: [
        "a) Apprendre par cœur sans comprendre",
        "b) Comprendre les concepts puis appliquer par exercices (Correct)",
        "c) Ne lire qu'une fois",
        "d) Sauter les chapitres difficiles"
      ],
      correctOption: "b",
      explication: "Comprendre d'abord, pratiquer ensuite via exercices et annales, c'est la méthode qui garantit la réussite aux examens."
    }
  });

  if (knowledge && knowledge.chapters) {
    knowledge.chapters.forEach((kc, i) => {
      chapters.push({
        id: `${niveau}_${prefixId}_auto_sa2_${i + 2}`,
        num: chapters.length + 1,
        title: `${kc.sa || "SA 2"} : ${kc.title}`,
        isFree: false,
        price: kc.price || price,
        cours: kc.cours,
        exemple: {
          titre: `Exemple — ${kc.title.split(' : ')[0]}`,
          enonce: "Voici un exemple typique de question d'examen sur ce chapitre.",
          solution: "Pour résoudre, il faut identifier la notion exacte, appliquer la formule ou l'argumentaire méthodique, et conclure."
        },
        exercice: {
          consigne: `Exercice — Application ${subjectName}`,
          question: "As-tu assimilé les notions clés de ce chapitre ?",
          type: "qcm",
          options: [
            "a) Pas du tout",
            "b) Oui, je sais appliquer les méthodes (Correct)",
            "c) Je ne sais pas",
            "d) J'ai tout oublié"
          ],
          correctOption: "b",
          explication: "Parfait. Refais des exercices régulièrement (espacement) pour ancrer la mémoire à long terme."
        }
      });
    });
  }

  chapters.push({
    id: `${niveau}_${prefixId}_auto_chapfinal_${Date.now()}`,
    num: chapters.length + 1,
    title: `SA de fin : ${subjectName} — Chapitre ${chapters.length + 1} : Sujet type examen`,
    isFree: false,
    price,
    cours: `Ce chapitre est un sujet complet d'examen en ${subjectName} pour le ${niveauTexte}. Il regroupe toutes les notions : connaissances, capacité à analyser un problème, rédiger une réponse structurée, gérer son temps (≈20 min par exercice). Savoir mobiliser plusieurs chapitres est la clé. On simule une épreuve : sujet, barème, correction modèle disponible après déblocage.`,
    exemple: {
      titre: "Exercice type — Annales d'examen",
      enonce: "Sujet 2024 : Analyser le document et mobiliser vos connaissances.",
      solution: "Modèle de corrigé : introduction → plan en I/II/III → sous-parties → exemples → conclusion. Points bonus : citations, exemples personnels maîtrisés."
    },
    exercice: {
      consigne: "QCM — Synthèse du programme",
      question: `Qu'est-ce qui est ÉVALUÉ à l'examen de ${subjectName} ?`,
      type: "qcm",
      options: [
        "a) Seulement la mémoire",
        "b) Connaissances + capacités (application, analyse, rédaction) (Correct)",
        "c) Seulement la rédaction",
        "d) Seulement les exemples"
      ],
      correctOption: "b",
      explication: "L'examen évalue à la fois : vos connaissances (savoirs), votre capacité à les mobiliser (savoir-faire), et la qualité de votre expression/rédaction."
    }
  });

  return chapters;
}

async function fetchAutoContentFromAI(subjectName, niveau) {
  try {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/ai/generate-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subjectName, niveau, serie: state.currentSerie })
    });

    const data = await response.json();
    if (response.ok && data.success && data.chapitres) return data.chapitres;
  } catch (err) {
    console.warn("IA backend indisponible, passage en fallback intelligent.", err);
  }
  return generateAutoContentFallback(subjectName, niveau);
}

async function openMatiere(subjectName) {
  const titleElem = document.getElementById('matiereTitle');
  const listElem = document.getElementById('chapitreList');

  if (titleElem) {
    titleElem.textContent = `${subjectName} — ${state.currentNiveau === 'bac' ? `BAC Série ${state.currentSerie}` : 'Brevet 3ème'}`;
  }
  if (!listElem) return;

  const levelDb = chapitresDatabase[state.currentNiveau] || {};
  let chapitres = levelDb[subjectName] || [];

  if (chapitres.length === 0) {
    listElem.innerHTML = `
      <div style="text-align:center; padding:40px; color:#64748b;">
        <p>✨ <strong>Revizy IA</strong> génère le programme complet selon le référentiel béninois...</p>
      </div>
    `;
    chapitres = await fetchAutoContentFromAI(subjectName, state.currentNiveau);
    levelDb[subjectName] = chapitres;
  }

  listElem.innerHTML = chapitres.map(chap => {
    const isUnlocked = chap.isFree || state.unlockedChapterIds.includes(chap.id);
    return `
      <div class="chapitre-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="chap-info">
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
            <span class="chip-num">Chap. ${chap.num}</span>
            ${chap.isFree ? '<span class="mini-badge free">Gratuit</span>' : `<span class="mini-badge paid">${chap.price} FCFA</span>`}
          </div>
          <h4>${escapeStr(chap.title)}</h4>
          <p class="chap-extrait">${escapeStr(chap.cours).substring(0, 140)}...</p>
        </div>
        <div class="chap-action">
          ${isUnlocked
            ? `<button class="btn btn-primary" onclick="viewChapterContent('${chap.id}')">Ouvrir le cours</button>`
            : `<button class="btn btn-outline" onclick="triggerPayChapter('${chap.id}', '${escapeStr(chap.title)}', ${chap.price})">Débloquer ${chap.price} FCFA</button>`
          }
        </div>
      </div>
    `;
  }).join('');

  go('matiere');
}

function findChapterByIdAny(chapId) {
  const all = getAllChaptersAndSubjects();
  return all.find(c => c.id === chapId) || null;
}

function viewChapterContent(chapId) {
  let chapter = findChapterByIdAny(chapId);
  if (!chapter) {
    alert("Chapitre non trouvé dans la base de connaissances.");
    return;
  }

  const oldModal = document.getElementById('chapterContentModal');
  if (oldModal) oldModal.remove();

  const modalHtml = `
    <div id="chapterContentModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; box-sizing:border-box;">
      <div style="background:#fff; border-radius:12px; max-width:820px; width:100%; max-height:88vh; overflow-y:auto; padding:28px; box-shadow:0 10px 25px rgba(0,0,0,0.2); position:relative;">

        <button onclick="document.getElementById('chapterContentModal').remove()" style="position:absolute; top:15px; right:15px; border:none; background:transparent; font-size:1.5rem; cursor:pointer; color:#64748b;">✕</button>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="mini-badge serie">${chapter.niveau.toUpperCase()}</span>
          <span class="mini-badge brevet">${escapeStr(chapter.subject)}</span>
          ${chapter.isFree ? '<span class="mini-badge free">Gratuit</span>' : '<span class="mini-badge paid">Premium</span>'}
        </div>

        <h2 style="margin-top:0; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">${escapeStr(chapter.title)}</h2>

        <div style="margin-bottom:25px;">
          <h3 style="color:#2563eb; margin-bottom:8px;">📖 Cours complet</h3>
          <p style="line-height:1.7; color:#334155; background:#f8fafc; padding:18px; border-radius:8px; border-left:4px solid #2563eb; margin:0; white-space: pre-wrap;">
            ${escapeStr(chapter.cours)}
          </p>
        </div>

        ${chapter.exemple ? `
        <div style="margin-bottom:25px;">
          <h3 style="color:#059669; margin-bottom:8px;">💡 ${escapeStr(chapter.exemple.titre || 'Exemple guidé')}</h3>
          <div style="background:#ecfdf5; padding:18px; border-radius:8px; border:1px solid #a7f3d0;">
            <p style="margin-top:0;"><strong>Énoncé :</strong> ${escapeStr(chapter.exemple.enonce)}</p>
            <p style="margin-bottom:0; color:#065f46;"><strong>Solution :</strong> ${escapeStr(chapter.exemple.solution)}</p>
          </div>
        </div>
        ` : ''}

        ${chapter.exercice ? `
        <div>
          <h3 style="color:#d97706; margin-bottom:8px;">✏️ ${escapeStr(chapter.exercice.consigne || 'Exercice QCM / Vrai-Faux')}</h3>
          <div style="background:#fffbeb; padding:18px; border-radius:8px; border:1px solid #fde68a;">
            <p style="margin-top:0;"><strong>Question :</strong> ${escapeStr(chapter.exercice.question)}</p>
            <div id="exerciseArea_${chapId}" style="margin:14px 0;">
              ${chapter.exercice.type === 'vf' ? `
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}" value="vrai"> VRAI</label>
                <label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="radio" name="exOpt_${chapId}" value="faux"> FAUX</label>
              ` : (chapter.exercice.options || []).map(opt => `
                <label style="display:block; margin-bottom:8px; cursor:pointer; color:#1e293b;">
                  <input type="radio" name="exOpt_${chapId}" value="${opt.charAt(0).toLowerCase()}" style="margin-right:8px;">
                  ${escapeStr(opt)}
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary" onclick="checkChapterExercise('${chapId}')" style="margin-top:8px;">Vérifier ma réponse</button>
            <div id="chapExFeedback_${chapId}" style="margin-top:12px; display:none; padding:12px; border-radius:6px; font-weight:500; line-height:1.6;"></div>
          </div>
        </div>
        ` : ''}

      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 100);
}

function checkChapterExercise(chapId) {
  const chapter = findChapterByIdAny(chapId);
  if (!chapter || !chapter.exercice) return;

  const selected = document.querySelector(`input[name="exOpt_${chapId}"]:checked`);
  const feedback = document.getElementById(`chapExFeedback_${chapId}`);
  if (!feedback) return;

  if (!selected) {
    alert("Veuillez d'abord sélectionner une réponse.");
    return;
  }

  feedback.style.display = 'block';
  let ok = false;
  if (chapter.exercice.type === 'vf') {
    const correct = chapter.exercice.correctOption === 'vrai' ? 'vrai' : 'faux';
    ok = selected.value === correct;
  } else {
    const correct = String(chapter.exercice.correctOption || '').toLowerCase();
    ok = selected.value === correct;
  }

  if (ok) {
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#166534';
    feedback.innerHTML = `<strong>✅ Bravo !</strong> Bonne réponse.<br>${escapeStr(chapter.exercice.explication || 'Excellent travail.')}`;
  } else {
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    const correctTxt = chapter.exercice.type === 'vf'
      ? (chapter.exercice.correctOption === 'vrai' ? 'VRAI' : 'FAUX')
      : `Réponse : ${String(chapter.exercice.correctOption || '').toUpperCase()}`;
    feedback.innerHTML = `<strong>❌ Incorrect.</strong> La bonne réponse était <strong>${correctTxt}</strong>.<br>${escapeStr(chapter.exercice.explication || 'Revois le cours et réessaie !')}`;
  }
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').style.display = isLogin ? 'block' : 'none';
  document.getElementById('formSignup').style.display = isLogin ? 'none' : 'block';
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!requireSupabase()) return false;

  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) {
    alert("Renseignez votre email et mot de passe.");
    return false;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("Connexion impossible : " + error.message);
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') { go('admin-dashboard'); renderAdminDashboard(); }
  else { go('client-dashboard'); renderClientDashboard(); }
  return false;
}

async function countAdmins() {
  if (!supabaseClient) return 0;
  const { count, error } = await supabaseClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  if (error) return state.usersList.filter(u => u.role === 'admin').length;
  return count || 0;
}

async function handleSignup(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!requireSupabase()) return false;

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const passConf = document.getElementById('signupPassConfirm').value;
  const role = document.querySelector('input[name="signupRole"]:checked').value;

  if (!name || !email || !pass || !passConf) { alert("Veuillez remplir tous les champs."); return false; }
  if (pass.length < 6) { alert("Le mot de passe doit contenir au moins 6 caractères."); return false; }
  if (pass !== passConf) { alert("⚠️ Les deux mots de passe ne correspondent pas !"); return false; }
  if (role === 'admin' && (await countAdmins()) >= MAX_ADMINS) {
    alert(`🚫 Limite atteinte : maximum ${MAX_ADMINS} administrateurs autorisés.`);
    return false;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: pass,
    options: {
      data: { name, role, niveau: state.currentNiveau }
    }
  });

  if (error) {
    alert("Inscription impossible : " + error.message);
    return false;
  }

  if (!data.session) {
    alert("Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.");
    switchAuthTab('login');
    return false;
  }

  await hydrateUser(data.user);
  await loadUserUnlocks(data.user.id);
  updateNavbar();
  await loadPublicStats();
  renderHomeStats();

  if (state.user.role === 'admin') { go('admin-dashboard'); renderAdminDashboard(); }
  else { go('client-dashboard'); renderClientDashboard(); }
  return false;
}

function triggerPayChapter(chapId, title, price) {
  if (!state || !state.user) {
    alert("Veuillez vous connecter (ou créer un compte) pour débloquer ce chapitre premium.");
    go('auth');
    return;
  }

  if (typeof FedaPay !== 'undefined') {
    try {
      const widget = FedaPay.init({
        public_key: FEDAPAY_PUBLIC_KEY,
        environment: 'live',
        transaction: { amount: price, description: `Revizy - Achat ${title}` },
        customer: { email: state.user.email || 'eleve@revizy.bj', lastname: state.user.name || 'Élève' },
        onComplete: (response) => {
          const ok = response && (
            response.reason === FedaPay.CHECKOUT_COMPLETED ||
            response.status === 'approved' ||
            response.reason === 'APPROVED'
          );
          if (ok) finishUnlock(chapId, title, price, 'FedaPay (MoMo)');
          else alert("Paiement annulé ou échoué.");
        }
      });
      widget.open();
      return;
    } catch (e) { console.error(e); }
  }

  go('client-dashboard');
  switchClientTab('momo');
  populateMomoChapterSelect(chapId, title, price);
  alert("Redirection vers le paiement Mobile Money manuel. Remplissez et validez !");
}

function populateMomoChapterSelect(preselectId, title, price) {
  const select = document.getElementById('momoChapterSelect');
  if (!select) return;

  const all = getAllChaptersAndSubjects().filter(c => !c.isFree);
  select.innerHTML = all.map(c => {
    const chapTitle = `[${c.niveau.toUpperCase()}] ${c.subject} — ${c.title} (${c.price} FCFA)`;
    const pre = (preselectId && c.id === preselectId) ? 'selected' : '';
    return `<option value="${c.id}" data-price="${c.price}" ${pre}>${chapTitle}</option>`;
  }).join('');
}

function handleMoMoPayment(e) {
  if (e && e.preventDefault) e.preventDefault();
  const providerElem = document.getElementById('momoProvider');
  const phoneElem = document.getElementById('momoPhone');
  const select = document.getElementById('momoChapterSelect');
  if (!select || select.selectedIndex === -1) { alert("Choisissez un chapitre."); return false; }

  const provider = providerElem ? providerElem.value : 'MTN MoMo';
  const phone = phoneElem ? phoneElem.value.replace(/[^0-9]/g, '').trim() : '';
  const chapId = select.value;
  const selectedOption = select.options[select.selectedIndex];
  const chapTitle = selectedOption ? selectedOption.text.split('(')[0].trim() : 'Chapitre';
  const price = parseInt(selectedOption ? (selectedOption.dataset.price || 0) : 0, 10) || (state.currentNiveau === 'brevet' ? 150 : 200);

  if (!phone || phone.length < 8) { alert("Numéro de téléphone invalide (8 chiffres minimum)."); return false; }

  alert(`💬 Demande envoyée au ${phone} (${provider}). Validez sur votre téléphone la somme de ${price} FCFA.`);

  setTimeout(() => finishUnlock(chapId, chapTitle, price, `${provider} MoMo`), 1500);
  return false;
}

async function finishUnlock(chapId, title, price, providerLabel) {
  if (!state.user) {
    alert("Connecte-toi pour enregistrer ton achat.");
    go('auth');
    return;
  }

  const chap = findChapterByIdAny(chapId);
  const meta = {
    title: (chap && chap.title) || title,
    niveau: (chap && chap.niveau) || state.currentNiveau,
    subject: (chap && chap.subject) || '',
    price
  };

  if (supabaseClient) {
    const { error: unlockErr } = await supabaseClient.from('unlocked_chapters').upsert({
      user_id: state.user.id,
      chapter_id: chapId,
      title: meta.title,
      niveau: meta.niveau,
      subject: meta.subject,
      price,
      provider: providerLabel
    }, { onConflict: 'user_id,chapter_id' });

    if (unlockErr) {
      console.error(unlockErr);
      alert("Paiement OK mais enregistrement échoué : " + unlockErr.message);
      return;
    }

    await supabaseClient.from('transactions').insert({
      user_id: state.user.id,
      chapter_id: chapId,
      chapter_title: meta.title,
      amount: price,
      provider: providerLabel
    });
  }

  if (!state.unlockedChapterIds.includes(chapId)) {
    state.unlockedChapterIds.push(chapId);
  }
  state.unlockedMap[chapId] = meta;

  state.transactions.unshift({
    date: new Date().toLocaleDateString('fr-FR'),
    phone: `+229 (${providerLabel})`,
    provider: providerLabel,
    chapter: title,
    amount: `${price} FCFA`
  });

  await loadPublicStats();
  updateRealtimeStats();
  renderUnlockedChapters();
  alert(`🎉 Paiement de ${price} FCFA réussi ! Le chapitre "${title}" est désormais débloqué à vie sur votre compte.`);
  if (state.currentView === 'client-dashboard') switchClientTab('cours');
}

function renderUnlockedChapters() {
  const container = document.getElementById('clientUnlockedGrid');
  const countElem = document.getElementById('clientUnlockedCount');

  if (countElem) countElem.textContent = state.unlockedChapterIds.length;
  if (!container) return;

  const freeChapters = getAllChaptersAndSubjects().filter(c => c.isFree);
  const allUnlockedMeta = state.unlockedChapterIds.map(id => {
    const fromDb = findChapterByIdAny(id);
    if (fromDb) return fromDb;
    const m = state.unlockedMap[id];
    return { id, title: m ? m.title : id.replace(/_/g, ' '), niveau: m ? m.niveau : '?', subject: m ? m.subject : '?', isFree: false };
  });

  const combined = [...freeChapters.map(c => ({ ...c, source: 'free' })), ...allUnlockedMeta.map(c => ({ ...c, source: 'paid' }))];
  const seen = new Set();
  const unique = combined.filter(c => seen.has(c.id) ? false : (seen.add(c.id), true));

  if (unique.length === 0) {
    container.innerHTML = `
      <p style="color:var(--text-muted, #64748b); font-size:0.9rem;">
        Aucun chapitre pour l'instant. Rappel : Le <strong>Chapitre 1</strong> de chaque matière est <strong>GRATUIT</strong>, les autres sont payants.
      </p>`;
    return;
  }

  container.innerHTML = unique.sort((a, b) => (a.niveau + a.subject).localeCompare(b.niveau + b.subject)).map(c => `
    <div class="unlocked-card">
      <div class="unlocked-meta">
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
          <span class="mini-badge ${c.niveau === 'bac' ? 'serie' : 'brevet'}">${c.niveau.toUpperCase()}</span>
          <span class="mini-badge">${escapeStr(c.subject)}</span>
          ${c.source === 'free' ? '<span class="mini-badge free">Gratuit</span>' : '<span class="mini-badge paid">Premium</span>'}
        </div>
        <strong style="font-size:0.95rem;">${escapeStr(c.title)}</strong><br>
        <span style="font-size:0.8rem; color:var(--text-muted, #64748b);">Accès illimité ✓</span>
      </div>
      <button class="btn btn-primary" style="padding: 6px 12px; font-size:0.8rem;" onclick="viewChapterContent('${escapeStr(c.id)}')">
        Accéder
      </button>
    </div>
  `).join('');
}

function renderClientDashboard() {
  if (!state.user) return;
  const welcome = document.getElementById('clientWelcomeTitle');
  const avatar = document.getElementById('clientAvatar');
  const niveauText = document.getElementById('clientUserNiveau');

  const userName = state.user.name || 'Élève';
  if (welcome) welcome.textContent = `Ravi de te revoir, ${escapeStr(userName)} ! 👋`;
  if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
  if (niveauText) niveauText.textContent = state.currentNiveau === 'bac' ? `Terminale (BAC Série ${state.currentSerie})` : '3ème (Brevet)';

  renderUnlockedChapters();
  renderClientQcmTab();
  populateMomoChapterSelect();
}

function switchClientTab(tabName) {
  const tabs = ['cours', 'qcm', 'momo'];
  tabs.forEach(t => {
    const el = document.getElementById(`clientTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.style.display = (t === tabName) ? 'block' : 'none';
  });
  const buttons = document.querySelectorAll('#view-client-dashboard .dash-tab');
  buttons.forEach((btn, index) => {
    if (btn) btn.classList.toggle('active', tabs[index] === tabName);
  });
  if (tabName === 'qcm') renderClientQcmTab();
}

function renderClientQcmTab() {
  const section = document.getElementById('clientTabQcm');
  if (!section) return;

  const pool = getAllChaptersAndSubjects()
    .filter(c => c.isFree || state.unlockedChapterIds.includes(c.id))
    .filter(c => c.exercice);

  const container = section.querySelector('.qcm-container') || section.querySelector('.client-section');
  if (!container) return;

  if (pool.length === 0) {
    container.innerHTML = `
      <h3><i data-lucide="check-square"></i> Test de Connaissances</h3>
      <p class="text-muted" style="margin:20px 0;">Aucun cours débloqué pour proposer des QCM. Débloque un chapitre (ou profite des CHAPITRES 1 GRATUITS) !</p>
    `;
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
    return;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  state.currentClientQcm = pick;

  const isVf = pick.exercice.type === 'vf';
  container.innerHTML = `
    <h3><i data-lucide="check-square"></i> Test de Connaissances — ${escapeStr(pick.subject)} (${pick.niveau.toUpperCase()})</h3>
    <p class="text-muted" style="margin-bottom:20px;">
      Question tirée aléatoirement de tes cours débloqués — <em>${escapeStr(pick.title)}</em>
    </p>

    <div class="qcm-card">
      <div class="qcm-question" id="qcmQuestionText">
        <strong>Question :</strong> ${escapeStr(pick.exercice.question)}
        <div style="margin-top:8px;"><span class="mini-badge ${isVf ? 'paid' : 'serie'}">${isVf ? 'VRAI / FAUX' : 'QCM'}</span></div>
      </div>
      <div class="qcm-options" id="qcmOptionsBox">
        ${isVf ? `
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="vrai"> <span>VRAI</span></label>
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="faux"> <span>FAUX</span></label>
        ` : (pick.exercice.options || []).map(opt => `
          <label class="qcm-opt"><input type="radio" name="qcmOpt" value="${opt.charAt(0).toLowerCase()}"> <span>${escapeStr(opt)}</span></label>
        `).join('')}
      </div>
      <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="submitQCMAnswer()">Valider ma réponse</button>
        <button class="btn btn-outline" onclick="renderClientQcmTab()">🔄 Nouvelle question</button>
      </div>
      <div id="qcmFeedback" class="qcm-feedback" style="display:none; margin-top:15px; line-height:1.6;"></div>
    </div>
  `;
  if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
  if (window.MathJax) setTimeout(() => MathJax.typesetPromise(), 100);
}

function submitQCMAnswer() {
  const selected = document.querySelector('input[name="qcmOpt"]:checked');
  const feedback = document.getElementById('qcmFeedback');
  if (!feedback) return;
  if (!selected) { alert("Veuillez sélectionner une réponse."); return; }

  const pick = state.currentClientQcm;
  if (!pick) return;
  const isVf = pick.exercice.type === 'vf';
  let ok;
  if (isVf) ok = selected.value === (pick.exercice.correctOption === 'vrai' ? 'vrai' : 'faux');
  else ok = selected.value === String(pick.exercice.correctOption || '').toLowerCase();

  feedback.style.display = 'block';
  if (ok) {
    feedback.className = 'qcm-feedback success';
    feedback.innerHTML = `<strong>✅ Bravo, bon travail !</strong><br>${escapeStr(pick.exercice.explication || '')}`;
  } else {
    const correct = isVf
      ? (pick.exercice.correctOption === 'vrai' ? 'VRAI' : 'FAUX')
      : `Option ${String(pick.exercice.correctOption || '').toUpperCase()}`;
    feedback.className = 'qcm-feedback error';
    feedback.innerHTML = `<strong>❌ Raté.</strong> La bonne réponse était <strong>${correct}</strong>.<br>${escapeStr(pick.exercice.explication || '')}`;
  }
}

function updateRealtimeStats() {
  state.adminStats.revenue = state.transactions.reduce((total, tx) => {
    const n = parseInt(String(tx.amount).replace(/[^0-9]/g, ''), 10) || 0;
    return total + n;
  }, 0);
  state.adminStats.studentsCount = state.usersList.filter(u => u.role === 'client').length;
  state.globalStats.totalUsers = state.usersList.length;
  state.globalStats.unlockedChapters = state.transactions.length;
  renderHomeStats();
  renderAdminDashboard();
}

function renderAdminDashboard() {
  const rev = document.getElementById("adminTotalRevenue");
  if (rev) rev.innerText = state.adminStats.revenue.toLocaleString() + " FCFA";

  const txTable = document.getElementById("adminTxTableBody");
  if (txTable) {
    txTable.innerHTML = state.transactions.map(tx => {
      const p = String(tx.provider || '').toLowerCase();
      const cls = p.includes('mtn') ? 'mtn' : 'moov';
      return `
        <tr>
          <td>${escapeStr(tx.date)}</td>
          <td>${escapeStr(tx.phone)}</td>
          <td><span class="badge-mmo ${cls}">${escapeStr(tx.provider)}</span></td>
          <td>${escapeStr(tx.chapter)}</td>
          <td><strong>${escapeStr(tx.amount)}</strong></td>
        </tr>`;
    }).join('');
  }

  const userList = document.getElementById("adminUserList");
  if (userList) {
    userList.innerHTML = state.usersList.map(u => `
      <li>
        <div><strong>${escapeStr(u.name)}</strong> (${escapeStr(u.email)})</div>
        <span class="badge-free">${u.role === 'admin' ? 'Admin' : `Élève ${u.niveau === 'bac' ? 'BAC' : 'Brevet'}`}</span>
      </li>`).join('');
  }
}

function switchAdminTab(tabName) {
  const tabs = ['content', 'transactions', 'users'];
  tabs.forEach(t => {
    const el = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.style.display = (t === tabName) ? 'block' : 'none';
  });
  const buttons = document.querySelectorAll('#view-admin-dashboard .dash-tab');
  buttons.forEach((btn, index) => {
    if (btn) btn.classList.toggle('active', tabs[index] === tabName);
  });
}

function toggleChatbot() {
  const box = document.getElementById('chatbotBox');
  if (box) box.style.display = (box.style.display === 'none' || !box.style.display) ? 'flex' : 'none';
}

async function generateAiResponse(userPrompt) {
  const level = state.currentNiveau === 'bac' ? `Terminale BAC Série ${state.currentSerie} Bénin` : '3ème Brevet Bénin';
  try {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt: userPrompt, niveau: level })
    });
    const data = await response.json();
    if (response.ok && data.reply) return data.reply;
    return data.message || buildLocalReply(userPrompt, level);
  } catch (e) {
    return buildLocalReply(userPrompt, level);
  }
}

function buildLocalReply(prompt, level) {
  const p = prompt.toLowerCase();
  if (p.includes('bonjour') || p.includes('salut') || p.includes('coucou'))
    return `Salut ! 👋 Je suis ton tuteur Revizy pour le ${level}. Pose-moi une question de cours, un exercice, une notion, je t'explique.`;
  if (p.includes('thales') || p.includes('thalès'))
    return "📐 Thalès : si deux droites sont parallèles et coupent deux droites sécantes → segments proportionnels. Réciproque vraie aussi ! Application : calcul de longueurs dans un triangle.";
  if (p.includes('pythagore'))
    return "📐 Pythagore : triangle rectangle → hypo² = côté² + autre côté². Ex : 3-4-5 → 25=9+16 ✅. Réciproque : si BC²=AB²+AC² alors triangle ABC rectangle en A.";
  if (p.includes('newton'))
    return "🧪 Lois de Newton : 1) inertie (repose si pas de force ou ∑F=0). 2) ∑F=m·a (RFD). 3) action-réaction : forces opposées de même intensité entre deux corps.";
  if (p.includes('dériv') || p.includes('deriv'))
    return "📐 Dérivée : (xⁿ)' = n·xⁿ⁻¹, (e^u)' = u'·e^u, (uv)' = u'v + uv', (u/v)' = (u'v-uv')/v². Interprétation géométrique : coefficient directeur tangente.";
  if (p.includes('mot de passe') || p.includes('mdp') || p.includes('mot de passe'))
    return "🔐 Pour réinitialiser un mot de passe (version démo), déconnecte-toi, puis réinscris-toi. Ou contacte support WhatsApp en pied de page.";
  return `[Hors-ligne Revizy IA] — Niveau : ${level}. Je n'ai pas de connexion IA en ce moment, mais n'hésite pas à : 1) Ouvrir tes fiches dans 'Mes Cours', 2) Faire le QCM d'auto-évaluation, 3) Me poser une question sur un cours précis (ex: 'Explique Pythagore').`;
}

async function sendChatMessage(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('chatbotInput');
  const msgContainer = document.getElementById('chatbotMessages');
  if (!input || !msgContainer || !input.value.trim()) return false;

  const userText = input.value.trim();
  msgContainer.innerHTML += `<div class="msg user">${escapeStr(userText)}</div>`;
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const loadingId = `loading-${Date.now()}`;
  msgContainer.innerHTML += `<div class="msg bot" id="${loadingId}"><em>Revizy IA réfléchit... 🤔</em></div>`;
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const botReply = await generateAiResponse(userText);
  const loadingElem = document.getElementById(loadingId);
  if (loadingElem) loadingElem.innerHTML = escapeStr(botReply).replace(/\n/g, '<br>');
  msgContainer.scrollTop = msgContainer.scrollHeight;
  return false;
}

function handleGlobalSearch(query) {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!dropdown) return;
  if (!query.trim()) { dropdown.style.display = 'none'; return; }
  const q = query.toLowerCase().trim();

  const results = [];

  const subjectList = state.currentNiveau === 'bac'
    ? (matieresData.bac[state.currentSerie] || [])
    : matieresData.brevet;
  subjectList.filter(m => m.name.toLowerCase().includes(q)).forEach(m => {
    results.push({
      kind: 'subject',
      icon: m.icon,
      label: `Matière : ${m.name}`,
      onclick: `openMatiere('${escapeStr(m.name)}'); closeSearch()`
    });
  });

  getAllChaptersAndSubjects()
    .filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.cours.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    )
    .slice(0, 10)
    .forEach(c => {
      results.push({
        kind: 'chapter',
        icon: '📄',
        label: `Chapitre [${c.niveau.toUpperCase()} ${c.subject}] : ${c.title}`,
        onclick: `go('matiere'); openMatiere('${escapeStr(c.subject)}'); setTimeout(()=>{ window.scrollTo({top:0, behavior:'smooth'}); }, 50); closeSearch()`
      });
    });

  dropdown.style.display = 'block';
  if (results.length === 0) {
    dropdown.innerHTML = `<div style="padding:12px; color:var(--text-muted);">Aucun résultat pour « ${escapeStr(query)} »</div>`;
  } else {
    dropdown.innerHTML = results.map(r => `
      <div class="search-item" onclick="${r.onclick}">
        <span>${r.icon}</span> ${escapeStr(r.label)}
      </div>
    `).join('');
  }
}

function closeSearch() {
  const d = document.getElementById('searchResultsDropdown');
  if (d) d.style.display = 'none';
}

function handleAddChapter(e) {
  if (e && e.preventDefault) e.preventDefault();
  const title = document.getElementById('adminChapTitle').value.trim();
  const subject = document.getElementById('adminChapSubject').value;
  const niveau = document.getElementById('adminChapNiveau').value;
  const pdf = document.getElementById('adminChapPdfUrl').value.trim();

  if (!title || !subject || !pdf) { alert("Remplissez tous les champs."); return false; }

  const id = `${niveau}_admin_${subject.toLowerCase().replace(/[^a-z0-9]/g,'_')}_${Date.now()}`;
  const price = niveau === 'brevet' ? 150 : 200;
  const newChap = {
    id, num: 99, title,
    isFree: false, price,
    cours: `Chapitre publié par l'administrateur. PDF : ${pdf}. Contenu du cours à venir...`,
    exemple: { titre: "Exemple à venir", enonce: "À compléter.", solution: "À compléter." },
    exercice: { consigne: "QCM à ajouter", question: "À compléter.", type: "qcm", options: ["a)", "b)", "c)"], correctOption: "a", explication: "À ajouter." }
  };

  if (!chapitresDatabase[niveau][subject]) chapitresDatabase[niveau][subject] = [];
  chapitresDatabase[niveau][subject].push(newChap);
  state.adminStats.fichesCount++;

  alert(`✅ Chapitre ajouté !\nMatière : ${subject}\nNiveau : ${niveau.toUpperCase()}\nTitre : ${title}`);
  renderAdminDashboard();
  renderMatieres();
  e.target.reset();
  return false;
}

function toggleQcmType(type) {
  const gq = document.getElementById('groupQCM');
  const gv = document.getElementById('groupVF');
  if (type === 'vf') {
    if (gq) gq.style.display = 'none';
    if (gv) gv.style.display = 'block';
  } else {
    if (gq) gq.style.display = 'block';
    if (gv) gv.style.display = 'none';
  }
}

function handleAddQCM(e) {
  if (e && e.preventDefault) e.preventDefault();
  const type = document.getElementById('adminQcmType')?.value || 'qcm';
  const question = document.getElementById('adminQcmQuestion').value.trim();
  if (!question) { alert("Énoncez la question."); return false; }

  if (type === 'vf') {
    const answer = document.getElementById('adminVfAnswer').value;
    alert(`✅ Vrai/Faux enregistré !\nQuestion : ${question}\nRéponse : ${answer.toUpperCase()}`);
  } else {
    const optA = document.getElementById('adminQcmOptA').value.trim() || 'A';
    const optB = document.getElementById('adminQcmOptB')?.value?.trim() || 'B';
    alert(`✅ QCM enregistré !\nQuestion : ${question}\nBonne réponse = Option A : ${optA}\nDistracteur B : ${optB}`);
  }
  e.target.reset();
  toggleQcmType('qcm');
  return false;
}

function generateAutoContent(subjectName, niveau) {
  return generateAutoContentFallback(subjectName, niveau);
}
