-- ============================================================
-- Revizy — seed_curriculum.sql
-- Peuple les tables niveaux, series, subjects, chapters
-- Contenu pédagogique réel : cours, exemples, QCM/VF
--
-- ORDRE D''EXÉCUTION OBLIGATOIRE :
--   1. schema.sql
--   2. schema_v2.sql
--   3. schema_curriculum.sql
--   4. seed_curriculum.sql  ← ce fichier
--
-- Idempotent : peut être réexécuté sans erreur (ON CONFLICT DO NOTHING)
-- Règle tarifaire : 3 premiers chapitres gratuits, 150 FCFA (BAC) / 100 FCFA (Brevet) au-delà
-- ============================================================

begin;

-- ─── NIVEAUX ────────────────────────────────────────────────────────
insert into public.niveaux (code, label, base_price, free_chapter_count, display_order) values
  ('bac',    'BAC (Terminale)', 150, 3, 1),
  ('brevet', 'Brevet (3ème)',   100, 3, 2)
on conflict (code) do nothing;

-- ─── SÉRIES ─────────────────────────────────────────────────────────
insert into public.series (code, label, niveau_code, display_order) values
  ('A', 'Série A (Littéraire)',          'bac', 1),
  ('B', 'Série B (Sciences sociales)',   'bac', 2),
  ('C', 'Série C (Sciences exactes)',    'bac', 3),
  ('D', 'Série D (Sciences naturelles)', 'bac', 4),
  ('G', 'Série G (Gestion/Compta)',      'bac', 5)
on conflict (code) do nothing;

-- ─── MATIÈRES ───────────────────────────────────────────────────────
insert into public.subjects (code, name, icon, niveau_code, serie_code, display_order) values
  -- BAC C
  ('mathematiques',      'Mathématiques',          '📐', 'bac', 'C', 0),
  ('physique_chimie',    'Physique-Chimie',         '🧪', 'bac', 'C', 1),
  ('svt',                'SVT',                     '🧬', 'bac', 'C', 2),
  ('philosophie',        'Philosophie',             '🧠', 'bac', 'C', 3),
  ('francais_litt',      'Français & Littérature',  '📚', 'bac', 'C', 4),
  ('histoire_geo',       'Histoire-Géographie',     '🗺️', 'bac', 'C', 5),
  ('anglais',            'Anglais',                 '🔤', 'bac', 'C', 6),
  -- BAC D
  ('mathematiques',      'Mathématiques',           '📐', 'bac', 'D', 0),
  ('physique_chimie',    'Physique-Chimie',          '🧪', 'bac', 'D', 1),
  ('svt',                'SVT',                      '🧬', 'bac', 'D', 2),
  ('philosophie',        'Philosophie',              '🧠', 'bac', 'D', 3),
  ('francais_litt',      'Français & Littérature',   '📚', 'bac', 'D', 4),
  ('histoire_geo',       'Histoire-Géographie',      '🗺️', 'bac', 'D', 5),
  ('anglais',            'Anglais',                  '🔤', 'bac', 'D', 6),
  -- BAC A
  ('mathematiques',      'Mathématiques',            '📐', 'bac', 'A', 0),
  ('svt',                'SVT',                      '🧬', 'bac', 'A', 1),
  ('philosophie',        'Philosophie',               '🧠', 'bac', 'A', 2),
  ('francais_litt',      'Français & Littérature',    '📚', 'bac', 'A', 3),
  ('histoire_geo',       'Histoire-Géographie',       '🗺️', 'bac', 'A', 4),
  ('anglais',            'Anglais',                   '🔤', 'bac', 'A', 5),
  -- BAC B
  ('mathematiques',      'Mathématiques',             '📐', 'bac', 'B', 0),
  ('philosophie',        'Philosophie',                '🧠', 'bac', 'B', 1),
  ('francais_litt',      'Français & Littérature',     '📚', 'bac', 'B', 2),
  ('histoire_geo',       'Histoire-Géographie',        '🗺️', 'bac', 'B', 3),
  ('anglais',            'Anglais',                    '🔤', 'bac', 'B', 4),
  ('economie',           'Économie',                   '📊', 'bac', 'B', 5),
  -- BAC G
  ('mathematiques',      'Mathématiques',              '📐', 'bac', 'G', 0),
  ('philosophie',        'Philosophie',                 '🧠', 'bac', 'G', 1),
  ('francais_litt',      'Français & Littérature',      '📚', 'bac', 'G', 2),
  ('histoire_geo',       'Histoire-Géographie',         '🗺️', 'bac', 'G', 3),
  ('anglais',            'Anglais',                     '🔤', 'bac', 'G', 4),
  ('economie',           'Économie',                    '📊', 'bac', 'G', 5),
  ('comptabilite',       'Comptabilité',                '💼', 'bac', 'G', 6),
  -- BREVET
  ('mathematiques',          'Mathématiques',                 '📐', 'brevet', NULL, 0),
  ('physique_chim_tech',     'Physique-Chimie-Technologie',   '🧪', 'brevet', NULL, 1),
  ('svt',                    'SVT',                            '🧬', 'brevet', NULL, 2),
  ('francais',               'Français',                      '📚', 'brevet', NULL, 3),
  ('histoire_geo',           'Histoire-Géographie',           '🗺️', 'brevet', NULL, 4),
  ('anglais',                'Anglais',                       '🔤', 'brevet', NULL, 5),
  ('lecture_dictee',         'Lecture / Dictée',              '📝', 'brevet', NULL, 6)
on conflict (niveau_code, serie_code, code) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- BAC C — MATHÉMATIQUES (8 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_1',s.id,1,
  'Suites numériques et récurrence','SA 1',
  '📚 SUITES NUMÉRIQUES ET RÉCURRENCE

📌 1. Définitions
Une suite numérique est une fonction u : ℕ → ℝ. On note u₀, u₁, u₂, …, uₙ ses termes.
• Suite arithmétique : uₙ₊₁ = uₙ + r (raison r constante).
  – Terme général : uₙ = u₀ + n·r
  – Somme des n+1 premiers termes : Sₙ = (n+1)·(u₀ + uₙ)/2
• Suite géométrique : uₙ₊₁ = q·uₙ (raison q ≠ 0).
  – Terme général : uₙ = u₀·qⁿ
  – Somme (q ≠ 1) : Sₙ = u₀·(1 − qⁿ⁺¹)/(1 − q)

📌 2. Récurrence (raisonnement par récurrence)
Pour démontrer une propriété P(n) vraie pour tout n ≥ n₀ :
  Étape 1 — Initialisation : vérifier P(n₀).
  Étape 2 — Hérédité : supposer P(n) vraie (hypothèse de récurrence), puis démontrer P(n+1).
  Étape 3 — Conclusion : « Par le principe de récurrence, P(n) est vraie pour tout n ≥ n₀. »

📌 3. Monotonie
• Suite arithmétique : croissante si r > 0, décroissante si r < 0.
• Suite géométrique avec u₀ > 0 : croissante si q > 1, décroissante si 0 < q < 1.

📌 4. Pièges classiques
• Ne pas confondre rang (n) et valeur (uₙ).
• Pour la récurrence, bien distinguer hypothèse et conclusion.
• Vérifier le signe de u₀ pour la monotonie géométrique.',
  'Exemple résolu — Suites arithmétiques et géométriques',
  'Exercice BAC Bénin type : La suite (uₙ) est arithmétique de premier terme u₁ = 3 et de raison r = 4. Calculer u₁₀ et la somme S = u₁ + u₂ + … + u₁₀.',
  'Terme général : uₙ = u₁ + (n−1)·r = 3 + (n−1)·4 = 4n − 1.
Donc u₁₀ = 4×10 − 1 = 39.
Somme : S₁₀ = 10·(u₁ + u₁₀)/2 = 10·(3 + 39)/2 = 10·21 = 210.
Réponse : u₁₀ = 39 et S = 210.',
  'QCM — Suites',
  'La suite définie par u₀ = 2 et uₙ₊₁ = 3·uₙ est une suite :',
  'qcm',
  '["a) Arithmétique de raison 3","b) Géométrique de raison 3","c) Arithmétique de raison 2","d) Géométrique de raison 2"]'::jsonb,
  'b',
  'uₙ₊₁ = 3·uₙ correspond exactement à la définition d''une suite géométrique de raison q = 3. Une suite arithmétique aurait la forme uₙ₊₁ = uₙ + r.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_2',s.id,2,
  'Calcul vectoriel et produit scalaire','SA 2',
  '📚 CALCUL VECTORIEL ET PRODUIT SCALAIRE

📌 1. Vecteurs du plan
Un vecteur $\vec{u}$ est défini par : direction, sens, norme ‖u‖.
Coordonnées : si $\vec{u}$(x;y), alors ‖u‖ = √(x²+y²).
Collinéarité : $\vec{u}$ et $\vec{v}$ colinéaires ⟺ xᵤyᵥ − yᵤxᵥ = 0.

📌 2. Produit scalaire
$\vec{u}·\vec{v}$ = ‖u‖·‖v‖·cos(θ) = xᵤxᵥ + yᵤyᵥ
• $\vec{u}·\vec{u}$ = ‖u‖²
• $\vec{u}⊥\vec{v}$ ⟺ $\vec{u}·\vec{v}$ = 0

📌 3. Formules utiles
• $\vec{AB}·\vec{AC}$ = ‖AB‖·‖AC‖·cos(∠BAC)
• Formule de polarisation : $\vec{u}·\vec{v}$ = ½(‖u+v‖² − ‖u‖² − ‖v‖²)
• cos(∠BAC) = $\vec{AB}·\vec{AC}$/(‖AB‖·‖AC‖)

📌 4. Applications
• Démontrer qu''un angle est droit : montrer que le produit scalaire est nul.
• Trouver un angle entre deux vecteurs via la formule cos.

📌 5. Pièges
• Ne pas confondre produit scalaire (scalaire) et produit vectoriel.
• Bien vérifier le sens des vecteurs (AB ≠ BA).',
  'Exemple — Orthogonalité et angle',
  'On donne A(1;2), B(4;6), C(4;2). Montrer que ABC est un triangle rectangle en A. Calculer l''angle en B.',
  '$\vec{AB}$ = (3;4), $\vec{AC}$ = (3;0).
Produit scalaire : $\vec{AB}·\vec{AC}$ = 3×3 + 4×0 = 9 ≠ 0 → pas rectangle en A.
Correction : $\vec{AC}·\vec{BC}$ avec C(4;2), A(1;2), B(4;6).
$\vec{CA}$ = (−3;0), $\vec{CB}$ = (0;4) → $\vec{CA}·\vec{CB}$ = 0 → rectangle en C.
Angle en B : cos(B) = $\vec{BA}·\vec{BC}$/(‖BA‖·‖BC‖) = (−3×0 + (−4)×(−4))/(5×4) = 16/20 = 4/5 → ∠B ≈ 36,9°.',
  'QCM — Produit scalaire',
  'Deux vecteurs $\vec{u}$(2;−1) et $\vec{v}$(1;2) sont :',
  'qcm',
  '["a) Colinéaires","b) Orthogonaux","c) Égaux","d) De même norme"]'::jsonb,
  'b',
  '$\vec{u}·\vec{v}$ = 2×1 + (−1)×2 = 2 − 2 = 0. Produit scalaire nul ⟹ vecteurs orthogonaux (perpendiculaires).'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_3',s.id,3,
  'Fonctions exponentielles et logarithmes','SA 3',
  '📚 FONCTIONS EXPONENTIELLES ET LOGARITHMES

📌 1. Fonction exponentielle
exp : ℝ → ℝ⁺*, x ↦ eˣ (e ≈ 2,718)
• exp''(x) = eˣ (la dérivée est elle-même)
• eˣ⁺ʸ = eˣ·eʸ ; e⁰ = 1 ; e¹ = e
• eˣ > 0 pour tout x ; lim(x→+∞) eˣ = +∞ ; lim(x→−∞) eˣ = 0
• Strictement croissante sur ℝ

📌 2. Fonction logarithme népérien
ln : ℝ⁺* → ℝ, x ↦ ln(x) — fonction réciproque de exp.
• ln(ab) = ln a + ln b ; ln(a/b) = ln a − ln b ; ln(aⁿ) = n·ln a
• ln(1) = 0 ; ln(e) = 1 ; ln''(x) = 1/x
• ln(eˣ) = x et e^(ln x) = x
• Strictement croissante sur ℝ⁺*

📌 3. Résolution d''équations
• eˣ = k (k > 0) ⟺ x = ln k
• ln(x) = k ⟺ x = eᵏ
• Pour eˡⁿ(ˣ) = eˡⁿ(ʸ) ⟺ x = y (x, y > 0)

📌 4. Dérivées usuelles
• (eᵘ)'' = u''·eᵘ ; (ln u)'' = u''/u (u > 0)

📌 5. Pièges
• ln n''est défini que pour x > 0.
• ln(a+b) ≠ ln a + ln b.
• Ne pas oublier la condition u > 0 quand on dérive ln(u).',
  'Exemple — Résolution et dérivation',
  'Résoudre : 2e²ˣ − 5eˣ + 2 = 0. Puis dériver f(x) = x·ln(x).',
  'Poser t = eˣ (t > 0) : 2t² − 5t + 2 = 0.
Δ = 25 − 16 = 9, t₁ = (5+3)/4 = 2, t₂ = (5−3)/4 = 1/2.
eˣ = 2 → x = ln 2 ; eˣ = 1/2 → x = −ln 2.
Solutions : x = ln 2 ou x = −ln 2.
Dérivée de f(x) = x·ln(x) : f''(x) = 1·ln(x) + x·(1/x) = ln(x) + 1.',
  'Vrai ou Faux',
  'L''affirmation suivante est-elle vraie : ln(e³) = 3 ?',
  'vf',
  '["Vrai","Faux"]'::jsonb,
  'vrai',
  'ln(eⁿ) = n pour tout réel n. Donc ln(e³) = 3. C''est une propriété fondamentale de la fonction logarithme.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_4',s.id,4,
  'Primitives et intégrales','SA 2',
  '📚 PRIMITIVES ET INTÉGRALES

📌 1. Primitive
F est une primitive de f sur I si F''(x) = f(x) pour tout x de I.
Toute fonction continue sur un intervalle admet des primitives (infinité, différant d''une constante).

📌 2. Tableau de primitives usuelles
• f(x) = xⁿ (n ≠ −1) → F(x) = xⁿ⁺¹/(n+1)
• f(x) = 1/x → F(x) = ln|x|
• f(x) = eˣ → F(x) = eˣ
• f(x) = cos x → F(x) = sin x
• f(x) = sin x → F(x) = −cos x
• f(x) = u''·eᵘ → F(x) = eᵘ
• f(x) = u''/u → F(x) = ln|u|

📌 3. Intégrale définie
∫[a→b] f(x)dx = [F(x)]ₐᵇ = F(b) − F(a)
• Linéarité : ∫(αf + βg) = α∫f + β∫g
• Relation de Chasles : ∫[a→c] = ∫[a→b] + ∫[b→c]
• ∫[a→a] = 0 ; ∫[a→b] = −∫[b→a]

📌 4. Interprétation géométrique
Si f(x) ≥ 0 sur [a;b], alors ∫[a→b] f(x)dx est l''aire (en unités d''aire) de la surface délimitée par la courbe, l''axe des x et les droites x=a, x=b.',
  'Exemple — Calcul d''intégrale',
  'Calculer I = ∫[0→1] (2x + eˣ) dx.',
  'Primitive de 2x + eˣ : F(x) = x² + eˣ.
I = [x² + eˣ]₀¹ = (1² + e¹) − (0² + e⁰) = (1 + e) − (0 + 1) = e.
Réponse : I = e ≈ 2,718.',
  'QCM — Intégrale',
  'Quelle est la valeur de ∫[0→2] 3x² dx ?',
  'qcm',
  '["a) 6","b) 8","c) 12","d) 4"]'::jsonb,
  'b',
  'Primitive de 3x² : F(x) = x³. Donc ∫[0→2] 3x² dx = [x³]₀² = 8 − 0 = 8.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_5',s.id,5,
  'Équations différentielles','SA 2',
  '📚 ÉQUATIONS DIFFÉRENTIELLES

📌 1. Équation différentielle du 1er ordre : y'' = ay
Solution générale : y(x) = C·eᵃˣ (C constante réelle quelconque).
Avec condition initiale y(x₀) = y₀ : C = y₀·e^(−ax₀).

📌 2. Équation y'' = ay + b (a ≠ 0)
Solution particulière constante : yₚ = −b/a.
Solution générale : y = C·eᵃˣ − b/a.

📌 3. Équation y'' + py'' + qy = 0 (2nd ordre, hors programme habituel série C — notions de base)
Équation caractéristique : r² + pr + q = 0.
• Δ > 0 : y = Ae^(r₁x) + Be^(r₂x)
• Δ = 0 : y = (A + Bx)·e^(rx)
• Δ < 0 : y = eᵃˣ(A·cos(βx) + B·sin(βx))

📌 4. Méthode générale
1. Identifier le type d''équation.
2. Résoudre l''équation homogène associée.
3. Trouver une solution particulière.
4. Écrire la solution générale = homogène + particulière.
5. Appliquer les conditions initiales.',
  'Exemple — Résolution avec condition initiale',
  'Résoudre y'' − 2y = 0 avec y(0) = 3.',
  'Type : y'' = 2y → solution générale y = C·e²ˣ.
Condition initiale : y(0) = C·e⁰ = C = 3.
Solution : y(x) = 3e²ˣ.',
  'QCM — Équation différentielle',
  'La solution générale de y'' + 3y = 0 est :',
  'qcm',
  '["a) y = C·e³ˣ","b) y = C·e⁻³ˣ","c) y = 3x + C","d) y = C·x³"]'::jsonb,
  'b',
  'L''équation y'' = −3y est du type y'' = ay avec a = −3. La solution générale est y = C·eᵃˣ = C·e⁻³ˣ.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_6',s.id,6,
  'Nombres complexes','SA 2',
  '📚 NOMBRES COMPLEXES

📌 1. Forme algébrique
z = a + ib avec a = Re(z), b = Im(z), i² = −1.
• Conjugué : z̄ = a − ib
• Module : |z| = √(a² + b²)
• z·z̄ = |z|²

📌 2. Forme trigonométrique
z = r(cosθ + i·sinθ) avec r = |z| et θ = arg(z).

📌 3. Forme exponentielle
z = r·e^(iθ) (formule d''Euler : e^(iθ) = cosθ + i·sinθ)

📌 4. Opérations
• Multiplication : |z₁z₂| = |z₁|·|z₂| ; arg(z₁z₂) = arg(z₁) + arg(z₂)
• Division : |z₁/z₂| = |z₁|/|z₂| ; arg(z₁/z₂) = arg(z₁) − arg(z₂)

📌 5. Équations dans ℂ
z² = a (a réel négatif) : z = ±i√|a|
z² = −4 → z = ±2i

📌 6. Forme binôme et racines n-ièmes
zⁿ = r·e^(iθ) → racines : zₖ = r^(1/n)·e^(i(θ+2kπ)/n) pour k = 0,1,…,n−1',
  'Exemple — Module et argument',
  'Mettre z = 1 + i√3 sous forme trigonométrique et exponentielle.',
  '|z| = √(1² + (√3)²) = √(1+3) = 2.
cosθ = 1/2, sinθ = √3/2 → θ = π/3.
Forme trig : z = 2(cos(π/3) + i·sin(π/3)).
Forme exp : z = 2e^(iπ/3).',
  'QCM — Nombres complexes',
  'Le conjugué de z = 3 − 2i est :',
  'qcm',
  '["a) −3 + 2i","b) 3 + 2i","c) −3 − 2i","d) 2 − 3i"]'::jsonb,
  'b',
  'Le conjugué z̄ de z = a + ib est z̄ = a − ib. Donc pour z = 3 − 2i, on a z̄ = 3 + 2i. La partie réelle reste inchangée, la partie imaginaire change de signe.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_7',s.id,7,
  'Probabilités et statistiques','SA 3',
  '📚 PROBABILITÉS ET STATISTIQUES

📌 1. Probabilités — rappels
Espace Ω, événement A, P(A) ∈ [0;1].
P(A∪B) = P(A) + P(B) − P(A∩B) ; P(Ā) = 1 − P(A).
Indépendance : P(A∩B) = P(A)·P(B).

📌 2. Probabilité conditionnelle
P(B|A) = P(A∩B)/P(A) (si P(A) > 0).
Formule des probabilités totales : P(B) = P(B|A)·P(A) + P(B|Ā)·P(Ā).
Formule de Bayes : P(A|B) = P(B|A)·P(A)/P(B).

📌 3. Variable aléatoire discrète X
Espérance : E(X) = Σ xᵢ·P(X=xᵢ)
Variance : V(X) = Σ xᵢ²·P(X=xᵢ) − [E(X)]² = E(X²) − [E(X)]²
Écart-type : σ = √V(X)

📌 4. Loi binomiale B(n,p)
X ~ B(n,p) : n épreuves de Bernoulli indépendantes, p probabilité de succès.
P(X=k) = C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ
E(X) = np ; V(X) = np(1−p)

📌 5. Statistiques — indicateurs
Moyenne : x̄ = (1/n)·Σxᵢ
Variance : s² = (1/n)·Σ(xᵢ−x̄)² ; Écart-type : s = √s²
Médiane : valeur qui partage l''effectif en deux moitiés égales.',
  'Exemple — Loi binomiale',
  'Un QCM a 5 questions, chacune avec 4 choix dont 1 seul correct. Un élève répond au hasard. Calculer P(X=2) et E(X).',
  'X ~ B(5 ; 1/4). P = 1/4, n = 5.
P(X=2) = C(5,2)·(1/4)²·(3/4)³ = 10·(1/16)·(27/64) = 270/1024 ≈ 0,264.
E(X) = np = 5×(1/4) = 1,25.',
  'QCM — Probabilités',
  'Si P(A) = 0,4 et P(B|A) = 0,5, alors P(A∩B) vaut :',
  'qcm',
  '["a) 0,9","b) 0,2","c) 0,5","d) 0,125"]'::jsonb,
  'b',
  'P(B|A) = P(A∩B)/P(A) ⟹ P(A∩B) = P(B|A)·P(A) = 0,5 × 0,4 = 0,2.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_maths_8',s.id,8,
  'Géométrie dans l''espace','SA 3',
  '📚 GÉOMÉTRIE DANS L''ESPACE

📌 1. Positions relatives
• Droites dans l''espace : coplanaires (sécantes ou parallèles) ou gauches.
• Droite et plan : parallèle, incluse ou sécante.
• Plans : parallèles, sécants (leur intersection est une droite).

📌 2. Orthogonalité
• Droite ⊥ plan π : la droite est perpendiculaire à toute droite de π.
• Deux plans ⊥ : leur dièdre mesure 90°.

📌 3. Repère de l''espace (O; $\vec{i}$, $\vec{j}$, $\vec{k}$)
Point M(x;y;z). Distance OM = √(x²+y²+z²).
Distance entre A(x₁;y₁;z₁) et B(x₂;y₂;z₂) : AB = √((x₂−x₁)²+(y₂−y₁)²+(z₂−z₁)²).

📌 4. Vecteur normal à un plan
Plan d''équation ax + by + cz + d = 0 a pour vecteur normal $\vec{n}$(a;b;c).
Distance d''un point M₀(x₀;y₀;z₀) au plan : d = |ax₀+by₀+cz₀+d|/√(a²+b²+c²).

📌 5. Solides usuels
• Cube, parallélépipède, pyramide, cône, sphère.
• Volume sphère : V = (4/3)πR³ ; Aire : S = 4πR².
• Volume pyramide : V = (1/3)·Base·h.',
  'Exemple — Distance et équation de plan',
  'Le plan P a pour équation 2x − y + 2z − 3 = 0. Calculer la distance du point A(1;0;1) au plan P.',
  'd(A,P) = |2×1 − 1×0 + 2×1 − 3| / √(2²+1²+2²)
= |2 − 0 + 2 − 3| / √(4+1+4)
= |1| / √9 = 1/3.',
  'Vrai ou Faux',
  'Dans l''espace, deux droites non parallèles se coupent forcément.',
  'vf',
  '["Vrai","Faux"]'::jsonb,
  'faux',
  'FAUX. Dans l''espace, deux droites non parallèles peuvent être gauches (non coplanaires) — elles ne se coupent pas et ne sont pas parallèles. Ce phénomène n''existe pas dans le plan.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='mathematiques'
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- BAC C — PHYSIQUE-CHIMIE (7 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_1',s.id,1,'Ondes mécaniques et sonores','SA 1',
'📚 ONDES MÉCANIQUES ET SONORES

📌 1. Définitions
Onde mécanique : perturbation se propageant dans un milieu matériel sans transport de matière.
• Onde transversale : vibration ⊥ à la propagation (corde).
• Onde longitudinale : vibration ∥ à la propagation (son dans l''air).

📌 2. Grandeurs caractéristiques
• Célérité v (m/s) : vitesse de propagation.
• Période T (s) et fréquence f = 1/T (Hz).
• Longueur d''onde : λ = v·T = v/f.
• Relation : v = λ·f.

📌 3. Son
Fréquences audibles : 20 Hz à 20 000 Hz.
Infrasons < 20 Hz ; ultrasons > 20 000 Hz.
Niveau sonore L (dB) = 10·log(I/I₀), I₀ = 10⁻¹² W/m².
• Vitesse du son dans l''air à 20°C : v ≈ 340 m/s.

📌 4. Retard temporel
Entre source S et récepteur R distant de d : τ = d/v.

📌 5. Pièges
• λ dépend du milieu (v change), f reste constante lors du changement de milieu.
• Ne pas confondre f (fréquence Hz) et ω = 2πf (pulsation rad/s).',
'Exemple — Calcul de longueur d''onde',
'Un haut-parleur émet un son de fréquence f = 680 Hz dans l''air (v = 340 m/s). Calculer la longueur d''onde.',
'λ = v/f = 340/680 = 0,5 m.
La longueur d''onde de ce son dans l''air est λ = 0,5 m = 50 cm.',
'QCM — Ondes sonores',
'Un son de fréquence 1 700 Hz se propage dans l''air à 340 m/s. Sa longueur d''onde est :',
'qcm',
'["a) 0,1 m","b) 0,2 m","c) 2 m","d) 5 m"]'::jsonb,
'b',
'λ = v/f = 340/1700 = 0,2 m. Relation fondamentale des ondes : v = λ·f.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_2',s.id,2,'Ondes lumineuses et optique','SA 2',
'📚 ONDES LUMINEUSES ET OPTIQUE

📌 1. Lumière — nature ondulatoire
Lumière blanche = superposition de radiations monochromatiques (λ de 400 nm à 800 nm).
Spectre visible : violet (400 nm) → rouge (800 nm).
Vitesse dans le vide : c = 3×10⁸ m/s.
Indice de réfraction : n = c/v → v = c/n.

📌 2. Diffraction
Phénomène qui se produit quand la lumière passe par une fente ou un obstacle.
Réseau de diffraction : dsinθ = kλ (d = pas du réseau, k = ordre).

📌 3. Réflexion et réfraction
Loi de Snell-Descartes : n₁·sinθ₁ = n₂·sinθ₂.
Réflexion totale (n₁ > n₂) : sinθ_limite = n₂/n₁.

📌 4. Lentilles (révision)
Lentille convergente (f'' > 0) : formule de conjugaison 1/OA'' − 1/OA = 1/f''.
Grandissement : γ = OA''/OA = A''B''/AB.

📌 5. Lasers et cohérence
Lumière cohérente : monochromatique, synchronisée.
Utilisations : chirurgie, télécommunications, lecture CD.',
'Exemple — Réfraction',
'Un rayon lumineux passe de l''air (n₁=1) dans l''eau (n₂=1,33) avec un angle d''incidence θ₁=30°. Trouver θ₂.',
'Loi de Snell : n₁sinθ₁ = n₂sinθ₂
1 × sin30° = 1,33 × sinθ₂
sinθ₂ = 0,5/1,33 ≈ 0,376
θ₂ = arcsin(0,376) ≈ 22°.',
'QCM — Ondes lumineuses',
'La longueur d''onde de la lumière visible rouge est approximativement :',
'qcm',
'["a) 200 nm","b) 400 nm","c) 700 nm","d) 1 200 nm"]'::jsonb,
'c',
'Le rouge est à l''extrémité rouge du spectre visible : λ ≈ 620–780 nm. La valeur 700 nm est typique du rouge. Violet ≈ 400 nm, vert ≈ 550 nm.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_3',s.id,3,'Mécanique newtonienne','SA 3',
'📚 MÉCANIQUE NEWTONIENNE

📌 1. Les trois lois de Newton
• 1ʳᵉ loi (inertie) : un corps sans force nette reste en état de repos ou MRU.
• 2ᵉ loi (F=ma) : Σ$\vec{F}$ = m·$\vec{a}$ (SI : N = kg·m/s²).
• 3ᵉ loi (réaction) : F₁₂ = −F₂₁.

📌 2. Types de mouvements
• MRU : v = cste, a = 0.
• MRUA : a = cste ≠ 0.
  – v(t) = v₀ + a·t
  – x(t) = x₀ + v₀·t + ½a·t²
  – v² = v₀² + 2a(x−x₀)

📌 3. Chute libre (sans frottement)
Vertical : a = g = 9,8 m/s² (vers le bas).
Horizontal : a = 0 (MRU).
Trajectoire d''un projectile : parabole.

📌 4. Travail et énergie cinétique
Travail : W = F·d·cosα (J = N·m).
Théorème travail-énergie : Ec₂ − Ec₁ = ΣW.
Ec = ½mv².

📌 5. Quantité de mouvement
p = m·v ; Σ$\vec{F}$·Δt = Δ$\vec{p}$ (impulsion).',
'Exemple — MRUA et chute',
'Un objet de 2 kg part de v₀=0 sous une force F=10 N. Calculer v après 5 s et la distance parcourue.',
'a = F/m = 10/2 = 5 m/s².
v(5) = 0 + 5×5 = 25 m/s.
d = ½×5×5² = ½×5×25 = 62,5 m.',
'QCM — Newton',
'Un objet de masse m=3 kg est soumis à une force résultante de 15 N. Son accélération est :',
'qcm',
'["a) 45 m/s²","b) 0,2 m/s²","c) 5 m/s²","d) 3 m/s²"]'::jsonb,
'c',
'2ᵉ loi de Newton : a = F/m = 15/3 = 5 m/s².'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_4',s.id,4,'Travail et énergie','SA 2',
'📚 TRAVAIL ET ÉNERGIE

📌 1. Travail d''une force
W(F) = F·d·cosα (F en N, d en m, W en J).
• W > 0 : force motrice ; W < 0 : force résistante ; W = 0 : force perpendiculaire.

📌 2. Énergie cinétique
Ec = ½mv². Théorème de l''énergie cinétique : ΔEc = ΣW.

📌 3. Énergie potentielle de pesanteur
Ep = mgh (en joules, h = hauteur par rapport au niveau de référence).

📌 4. Énergie mécanique
Em = Ec + Ep.
Conservation : si les seules forces qui travaillent sont conservatives (poids), alors Em = cste.
Avec frottements : ΔEm = Wfrott (< 0).

📌 5. Puissance
P = W/t (watts) ; P = F·v·cosα.
Rendement : η = P_utile/P_absorbée × 100%.',
'Exemple — Conservation de l''énergie mécanique',
'Un objet de 1 kg tombe d''une hauteur h=5 m sans frottement. Calculer sa vitesse à l''impact.',
'Em conservée : Ep = Ec à l''impact.
mgh = ½mv²
v = √(2gh) = √(2×9,8×5) = √98 ≈ 9,9 m/s.',
'Vrai ou Faux',
'Le travail du poids est toujours positif lors d''une descente.',
'vf',
'["Vrai","Faux"]'::jsonb,
'vrai',
'VRAI. Le poids $\vec{P}$ est orienté vers le bas. Lors d''une descente, le déplacement a une composante vers le bas → cosα > 0 → W(P) = mgh > 0. Le poids est une force motrice lors de la descente.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_5',s.id,5,'Chimie organique : alcools, alcanes, alcènes','SA 2',
'📚 CHIMIE ORGANIQUE

📌 1. Alcanes CₙH₂ₙ₊₂
Liaisons simples σ uniquement. Saturés.
CH₄ (méthane), C₂H₆ (éthane), C₃H₈ (propane), C₄H₁₀ (butane).
Réaction de combustion : CₙH₂ₙ₊₂ + (3n+1)/2 O₂ → n CO₂ + (n+1) H₂O.

📌 2. Alcènes CₙH₂ₙ
Contiennent une double liaison C=C. Insaturés.
C₂H₄ (éthylène = éthène), C₃H₆ (propène).
Réaction d''addition : C=C + H₂ → C−C (hydrogénation catalytique).
Réaction de polymérisation : n(C₂H₄) → (−CH₂−CH₂−)ₙ (polyéthylène).

📌 3. Alcools CₙH₂ₙ₊₂O (groupe −OH)
CH₃OH (méthanol), C₂H₅OH (éthanol).
Primaire (−OH sur C lié à 1 C), secondaire (2 C), tertiaire (3 C).
Oxydation ménagée :
• Alcool primaire → aldéhyde → acide carboxylique.
• Alcool secondaire → cétone (ne s''oxyde pas davantage).
• Alcool tertiaire : ne s''oxyde pas facilement.

📌 4. Tests
• Eau de brome (Br₂) : décolorée par les alcènes (addition).
• Solution de Fehling : réduite (précipité rouge) par les aldéhydes.',
'Exemple — Oxydation d''alcool',
'L''éthanol (CH₃−CH₂−OH) est un alcool primaire. Donner les produits de son oxydation ménagée progressive.',
'Étape 1 : éthanol → éthanal (aldéhyde) : CH₃−CHO.
Étape 2 : éthanal → acide éthanoïque (acide acétique) : CH₃−COOH.
L''éthanol primaire se transforme d''abord en aldéhyde puis en acide carboxylique.',
'QCM — Alcanes/alcools',
'L''éthanol est :',
'qcm',
'["a) Un alcane","b) Un alcène","c) Un alcool primaire","d) Un alcool tertiaire"]'::jsonb,
'c',
'L''éthanol CH₃−CH₂−OH possède un groupe −OH sur un carbone lié à un seul autre carbone → alcool primaire. C''est aussi la formule CₙH₂ₙ₊₂O avec n=2.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_6',s.id,6,'Électricité : circuits RC, RL, RLC','SA 2',
'📚 ÉLECTRICITÉ — CIRCUITS RC, RL, RLC

📌 1. Circuit RC (résistance + condensateur)
Charge : uC(t) = E(1 − e^(−t/τ)) avec τ = RC (constante de temps).
Décharge : uC(t) = U₀·e^(−t/τ).
Courant : i(t) = (E/R)·e^(−t/τ).
Après 5τ, le condensateur est considéré chargé/déchargé à 99%.

📌 2. Circuit RL (résistance + bobine)
Montée du courant : i(t) = (E/R)·(1 − e^(−t/τL)) avec τL = L/R.
Énergie stockée dans la bobine : Wₗ = ½L·i².

📌 3. Circuit RLC série — oscillations
Équation différentielle : L·(d²q/dt²) + R·(dq/dt) + q/C = 0.
Pulsation propre : ω₀ = 1/√(LC).
Régimes : suramorti (R grand), critique, sous-amorti (oscillations).

📌 4. Courant alternatif sinusoïdal
u(t) = Uₘ·cos(ωt + φ), valeur efficace U = Uₘ/√2.
Impédance : Z = √(R² + (Lω − 1/Cω)²).
Résonance : Lω = 1/Cω → ω = ω₀ → Z = R (minimum).',
'Exemple — Constante de temps RC',
'Circuit RC : R = 10 kΩ, C = 100 µF. Calculer τ et le temps pour charger à 99%.',
'τ = R·C = 10×10³ × 100×10⁻⁶ = 1 s.
Temps 99% ≈ 5τ = 5 s.',
'QCM — Circuit RC',
'Dans un circuit RC en charge, lorsque t = τ, la tension aux bornes du condensateur vaut (E = tension d''alimentation) :',
'qcm',
'["a) 0","b) E/2","c) 0,63·E","d) E"]'::jsonb,
'c',
'uC(τ) = E(1 − e⁻¹) = E(1 − 0,368) ≈ 0,632·E ≈ 0,63·E. C''est la définition de la constante de temps τ : le condensateur atteint 63% de sa charge finale.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_pc_7',s.id,7,'Thermodynamique','SA 3',
'📚 THERMODYNAMIQUE

📌 1. Systèmes et état thermodynamique
Système : ensemble d''objets étudiés.
Variables d''état : T (température K), P (pression Pa), V (volume m³), n (moles).
Gaz parfait : PV = nRT (R = 8,314 J/mol·K).

📌 2. Premier principe
ΔU = W + Q.
U = énergie interne ; W = travail reçu ; Q = chaleur reçue.
Transformation isobare : W = −PΔV ; isotherme : ΔU = 0 ; adiabatique : Q = 0.

📌 3. Capacité thermique
Q = m·c·ΔT (c = capacité thermique massique J/kg·K).
Eau : c ≈ 4 180 J/kg·K.

📌 4. Transferts thermiques
• Conduction : propagation dans la matière (Fourier).
• Convection : mouvement de fluide.
• Rayonnement : onde électromagnétique.

📌 5. Second principe (notion)
L''entropie d''un système isolé ne peut que croître (irréversibilité).
Rendement d''un moteur thermique : η = W/Q_chaud ≤ 1 − T_froid/T_chaud.',
'Exemple — Gaz parfait et calorimétrie',
'Un gaz parfait occupe V₁=2 L à T₁=300 K, P₁=1 atm. On le chauffe à volume constant jusqu''à T₂=600 K. Calculer P₂.',
'À volume constant (isochore) : P₁/T₁ = P₂/T₂.
P₂ = P₁·T₂/T₁ = 1×600/300 = 2 atm.',
'Vrai ou Faux',
'Dans une transformation adiabatique, la température du système reste constante.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Adiabatique signifie Q = 0 (pas d''échange de chaleur), pas que la température est constante. C''est la transformation isotherme qui maintient T = cste. En adiabatique, ΔU = W, donc T peut varier.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='physique_chimie'
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- BAC C/D — SVT (6 chapitres partagés C et D)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_1',s.id,1,'Biologie cellulaire et ADN','SA 1',
'📚 BIOLOGIE CELLULAIRE ET ADN

📌 1. La cellule
Unité structurale et fonctionnelle du vivant.
• Cellule procaryote : pas de noyau membranaire (bactéries).
• Cellule eucaryote : noyau délimité par une membrane (animaux, plantes, champignons).
Organites principaux : noyau, mitochondries, ribosomes, réticulum endoplasmique, appareil de Golgi.

📌 2. ADN — structure
Double hélice (Watson & Crick, 1953).
Nucléotides : base azotée (A, T, G, C) + désoxyribose + phosphate.
Complémentarité : A-T (2 liaisons H), G-C (3 liaisons H).
Gène : séquence d''ADN codant une protéine.

📌 3. Réplication de l''ADN
Semi-conservative : chaque nouvelle molécule = un brin ancien + un brin neuf.
Enzyme principale : ADN polymérase.
Erreurs → mutations.

📌 4. Transcription / Traduction
ADN → ARNm (transcription dans le noyau, par ARN polymérase).
ARNm → protéine (traduction dans les ribosomes).
Codon : triplet de bases de l''ARNm codant un acide aminé.

📌 5. Pièges
• ADN → ADNm est une erreur : c''est ARNm (acide ribonucléique messager).
• La réplication est semi-conservative, pas conservative ni dispersive.',
'Exemple — Complémentarité des bases',
'Un brin d''ADN a pour séquence : 5''-ATCGTA-3''. Donner la séquence du brin complémentaire.',
'A-T, T-A, C-G, G-C, T-A, A-T.
Brin complémentaire (antiparallèle) : 3''-TAGCAT-5''.
Écrit en 5''→3'' : 5''-TACGAT-3''.',
'QCM — ADN',
'Lors de la réplication de l''ADN, chaque molécule fille contient :',
'qcm',
'["a) Deux brins nouvellement synthétisés","b) Un brin parental et un brin néosynthétisé","c) Deux brins parentaux","d) Des fragments d''Okazaki uniquement"]'::jsonb,
'b',
'La réplication est semi-conservative : chaque double hélice fille est constituée d''un brin parental (conservé) et d''un brin nouvellement synthétisé. Démontré par l''expérience de Meselson et Stahl (1958).'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_2',s.id,2,'Génétique et hérédité mendélienne','SA 2',
'📚 GÉNÉTIQUE ET HÉRÉDITÉ MENDÉLIENNE

📌 1. Lois de Mendel
1ère loi (uniformité) : croisement AA × aa → tous Aa (phénotype A dominant).
2ème loi (ségrégation) : Aa × Aa → 1/4 AA : 2/4 Aa : 1/4 aa.
3ème loi (indépendance) : deux gènes sur chromosomes différents ségrègent indépendamment.

📌 2. Vocabulaire
• Allèle : forme alternative d''un gène.
• Homozygote : deux allèles identiques (AA ou aa).
• Hétérozygote : allèles différents (Aa).
• Phénotype : caractère observable ; génotype : constitution allélique.
• Dominant : s''exprime à l''état hétérozygote ; récessif : masqué si un allèle dominant présent.

📌 3. Croisement test (test-cross)
Individu à génotype inconnu × homozygote récessif (aa).
Si descendance 1:1 → hétérozygote ; si tous phénotype A → homozygote AA.

📌 4. Codominance et allèles multiples
Ex : groupe sanguin ABO (allèles Iᴬ, Iᴮ, i). Iᴬ et Iᴮ sont codominants.

📌 5. Hérédité liée au sexe
Gènes portés par chromosome X (daltonisme, hémophilie).
Femme : XX ; Homme : XY.
Femme conductrice : XᴬX^a (porteuse saine).',
'Exemple — Croisement monohybride',
'Deux parents de phénotype [yeux marron] ont un enfant aux yeux bleus. Déduire les génotypes sachant que marron (M) est dominant sur bleu (m).',
'L''enfant bleu a le génotype mm (phénotype récessif).
Chaque parent a transmis un allèle m → les deux parents sont hétérozygotes Mm.
Génotypes parents : Mm × Mm.',
'QCM — Génétique',
'Dans un croisement Aa × Aa, quelle proportion d''individus présentera le phénotype dominant ?',
'qcm',
'["a) 1/4","b) 1/2","c) 3/4","d) 1"]'::jsonb,
'c',
'Aa × Aa → 1/4 AA + 2/4 Aa + 1/4 aa. Les individus AA et Aa ont le phénotype dominant = 3/4. Seul aa (1/4) est récessif.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_3',s.id,3,'Immunologie et système immunitaire','SA 3',
'📚 IMMUNOLOGIE ET SYSTÈME IMMUNITAIRE

📌 1. Immunité innée (naturelle, non spécifique)
Première ligne de défense : barrières physiques (peau, muqueuses), chimiques (larmes, salive).
Cellules : neutrophiles, macrophages → phagocytose.
Réaction inflammatoire : rougeur, chaleur, gonflement, douleur.
Protéines du complément, interférons.

📌 2. Immunité adaptative (acquise, spécifique)
Déclenchée par la reconnaissance d''un antigène (Ag).
• Immunité humorale : lymphocytes B → plasmocytes → anticorps (immunoglobulines).
• Immunité cellulaire : lymphocytes T cytotoxiques (CD8) → destruction des cellules infectées.
• Lymphocytes T auxiliaires (CD4) : activent B et T cytotoxiques.

📌 3. Réponse primaire et secondaire
Primaire : lente (8–15 jours), faible taux d''anticorps, génère des cellules mémoire.
Secondaire : rapide et intense (anticorps élevés en 3–5 jours) — base de la vaccination.

📌 4. Vaccination
Principe : injecter un Ag atténué/inactivé → mémoire immunitaire.
Sérum : anticorps prêts (immunité passive).

📌 5. Dysfonctionnements
SIDA : VIH détruit les CD4 → déficit immunitaire.
Allergies : réponse excessive à des Ag inoffensifs.
Auto-immunité : attaque des propres cellules.',
'Exemple — Anticorps et antigènes',
'Expliquer pourquoi un individu vacciné contre la rougeole est protégé lors d''une infection ultérieure.',
'Lors de la vaccination, l''organisme reconnaît les antigènes de la rougeole atténués et déclenche une réponse primaire produisant des cellules mémoire B et T.
Lors de l''infection réelle, les cellules mémoire déclenchent immédiatement une réponse secondaire intense et rapide → taux d''anticorps suffisant pour neutraliser le virus avant apparition des symptômes.',
'Vrai ou Faux',
'Les lymphocytes B produisent directement les anticorps sans transformation préalable.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Les lymphocytes B doivent d''abord être activés par un antigène et se différencier en plasmocytes (cellules sécrétrices d''anticorps). Ce sont les plasmocytes qui produisent massivement les anticorps.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_4',s.id,4,'Système nerveux et hormones','SA 2',
'📚 SYSTÈME NERVEUX ET HORMONES

📌 1. Organisation du système nerveux
• SNC : encéphale (cerveau, cervelet, tronc) + moelle épinière.
• SNP : nerfs sensitifs (afférents) + nerfs moteurs (efférents).
• SNA : sympathique (activation) + parasympathique (repos).

📌 2. Neurone
Dendrites → corps cellulaire → axone → terminaisons synaptiques.
Potentiel d''action (PA) : dépolarisation (-70 mV → +40 mV) puis repolarisation.
Synapse : neurotransmetteurs libérés dans la fente synaptique.

📌 3. Arc réflexe
Récepteur → nerf afférent → centre nerveux → nerf efférent → effecteur.
Réflexe myotatique (rotulien) : mono-synaptique.

📌 4. Glandes endocrines et hormones
Hypophyse : TSH, GH, FSH, LH.
Thyroïde : T3, T4 (métabolisme basal). Régulation : rétroaction négative.
Surrénales : adrénaline (stress), cortisol (anti-inflammatoire).
Pancréas : insuline (↓glycémie) et glucagon (↑glycémie).

📌 5. Régulation de la glycémie
Glycémie normale : 0,8–1,2 g/L.
Insuline : favorise le stockage du glucose (glycogenèse).
Glucagon : libère le glucose (glycogénolyse).
Diabète type 1 : insuffisance insuline ; type 2 : résistance à l''insuline.',
'Exemple — Régulation de la glycémie',
'Après un repas riche en sucres, expliquer le mécanisme hormonal de régulation de la glycémie.',
'Après le repas : glycémie augmente → détectée par les cellules β du pancréas → sécrétion d''insuline.
L''insuline : stimule l''entrée du glucose dans les cellules, favorise la glycogenèse dans le foie et les muscles.
Résultat : glycémie redescend vers 1 g/L → rétroaction négative → arrêt de la sécrétion d''insuline.',
'QCM — Hormones',
'L''insuline est sécrétée par le pancréas pour :',
'qcm',
'["a) Augmenter la glycémie","b) Diminuer la glycémie","c) Augmenter le rythme cardiaque","d) Réguler la thyroïde"]'::jsonb,
'b',
'L''insuline est l''hormone hypoglycémiante : elle favorise la captation du glucose par les cellules et son stockage sous forme de glycogène, ce qui fait baisser la glycémie.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_5',s.id,5,'Reproduction humaine','SA 2',
'📚 REPRODUCTION HUMAINE

📌 1. Gamétogenèse
Spermatogenèse (testicules) : cellules souches → spermatogonies → spermatocytes → spermatides → spermatozoïdes (23 chromosomes).
Ovogenèse (ovaires) : ovogonies → ovocyte I (bloqué en prophase I) → ovocyte II (à l''ovulation) → ovotide = ovule.

📌 2. Cycle menstruel (28 jours)
Phase folliculaire (J1-J14) : croissance du follicule sous FSH → sécrétion d''œstrogènes.
Ovulation (J14) : pic de LH → libération de l''ovocyte.
Phase lutéale (J14-J28) : corps jaune → progestérone (prépare l''endomètre).
Si pas de fécondation : corps jaune dégénère → chute hormones → menstruations.

📌 3. Fécondation et grossesse
Fécondation dans la trompe de Fallope → zygote 2n = 46 chromosomes.
Nidation dans l''endomètre vers J21-J22.
hCG maintient le corps jaune au début de la grossesse.

📌 4. Contraception
Hormonale : pilule (œstro-progestative) bloque ovulation.
Mécanique : préservatif, stérilet.
Urgence : pilule du lendemain (lévonorgestrel).',
'Exemple — Analyse du cycle',
'Une femme a un cycle de 28 jours. Son ovulation a eu lieu le J14. À quel moment la fécondation est-elle possible ?',
'La fécondation est possible dans les 24h suivant l''ovulation (durée de vie de l''ovocyte) et jusqu''à 5 jours avant (durée de vie des spermatozoïdes).
Période fertile ≈ J9 à J15.
En dehors de cette fenêtre, la fécondation est très improbable.',
'Vrai ou Faux',
'La progestérone est produite par le corps jaune après l''ovulation.',
'vf',
'["Vrai","Faux"]'::jsonb,
'vrai',
'VRAI. Après l''ovulation, le follicule rompu se transforme en corps jaune. Celui-ci sécrète de la progestérone, qui maintient et prépare l''endomètre pour une éventuelle nidation.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_C_svt_6',s.id,6,'Écologie et biosphère','SA 3',
'📚 ÉCOLOGIE ET BIOSPHÈRE

📌 1. Niveaux d''organisation
Individu → population → communauté (biocénose) → écosystème → biome → biosphère.
Biosphère : ensemble des zones de vie sur Terre.

📌 2. Cycles biogéochimiques
Cycle du carbone : photosynthèse (CO₂ → matière organique), respiration et décomposition (matière organique → CO₂).
Cycle de l''azote : fixation N₂ (bactéries) → ammonification → nitrification → dénitrification.
Cycle de l''eau : évaporation → condensation → précipitation → ruissellement.

📌 3. Chaînes et réseaux trophiques
Producteurs (végétaux) → consommateurs primaires → secondaires → décomposeurs.
Perte d''énergie à chaque niveau : environ 90% perdu.

📌 4. Biodiversité
Génétique, spécifique, écosystémique.
Menaces : destruction des habitats, surexploitation, pollution, espèces invasives, changement climatique.

📌 5. Réchauffement climatique
Gaz à effet de serre : CO₂, CH₄, N₂O, vapeur d''eau.
Conséquences : montée des eaux, extrêmes météo, migrations d''espèces.
Solutions : énergies renouvelables, réduction émissions, reforestation.',
'Exemple — Analyse d''une chaîne trophique',
'Chaîne : Herbe → Criquet → Lézard → Aigle. Identifier les niveaux trophiques et expliquer la perte d''énergie.',
'Herbe = producteur (niveau 1).
Criquet = consommateur primaire (niveau 2).
Lézard = consommateur secondaire (niveau 3).
Aigle = consommateur tertiaire (niveau 4).
À chaque niveau, ~90% de l''énergie est perdue (chaleur, respiration, excrétion). Seul ~10% est transféré au niveau suivant → pyramide d''énergie très étroite au sommet.',
'QCM — Écologie',
'Le principal gaz responsable de l''effet de serre anthropique est :',
'qcm',
'["a) L''oxygène (O₂)","b) L''azote (N₂)","c) Le dioxyde de carbone (CO₂)","d) L''argon (Ar)"]'::jsonb,
'c',
'Le CO₂ est le principal gaz à effet de serre d''origine humaine (combustion de carburants fossiles, déforestation). Il absorbe le rayonnement infrarouge terrestre et réchauffe l''atmosphère.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='C' and s.code='svt'
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- BAC A/C/D/B/G — PHILOSOPHIE (4–6 chapitres selon série)
-- On insère pour la série A (la plus complète, 6 chap)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_1',s.id,1,'La connaissance et la vérité','SA 1',
'📚 LA CONNAISSANCE ET LA VÉRITÉ

📌 1. Qu''est-ce que connaître ?
Connaissance : croyance vraie et justifiée (Platon).
Doute méthodique (Descartes) : douter de tout pour trouver une certitude absolue → « Je pense, donc je suis. »

📌 2. Sources de la connaissance
• Empirisme (Hume, Locke) : toute connaissance vient de l''expérience sensible.
• Rationalisme (Descartes, Leibniz) : la raison est source de vérités nécessaires (idées innées).
• Criticisme (Kant) : synthèse — la connaissance naît de la rencontre de la sensibilité et de l''entendement.

📌 3. La vérité
• Vérité de correspondance : l''énoncé correspond au réel.
• Vérité de cohérence : absence de contradiction logique.
• Vérité pragmatique (James) : ce qui fonctionne est vrai.
• Vérité scientifique : provisoire, réfutable (Popper : falsifiabilité).

📌 4. Opinion, croyance, savoir
Opinion (doxa) : croyance sans justification suffisante.
Savoir (épistémè) : connaissance fondée, démontrable.

📌 5. Repères clés
• Objectif/Subjectif ; Universel/Particulier ; Absolu/Relatif.',
'Exemple — Dissertation courte',
'Sujet BAC Bénin : « Peut-on tout démontrer ? » Dégager le problème philosophique.',
'Le problème : la démonstration est-elle la seule voie vers la vérité, ou certaines vérités échappent-elles à la démonstration ?
Plan : I. La démonstration, idéal de la connaissance certaine. II. Les limites de la démonstration (axiomes, intuition, foi, valeurs). III. D''autres formes de justification (expérience, témoignage, consensus).
Thèse possible : tout ne peut être démontré, mais cela n''implique pas le relativisme.',
'QCM — Philosophie de la connaissance',
'Selon Descartes, la première certitude indubitable est :',
'qcm',
'["a) Dieu existe","b) Le monde extérieur est réel","c) Je pense, donc je suis","d) Les mathématiques sont vraies"]'::jsonb,
'c',
'Le cogito (« Cogito ergo sum ») est la première vérité que Descartes trouve au bout de son doute méthodique radical. Même en doutant de tout, le fait de douter prouve que je pense, donc que j''existe.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_2',s.id,2,'La liberté et la responsabilité','SA 2',
'📚 LA LIBERTÉ ET LA RESPONSABILITÉ

📌 1. Conceptions de la liberté
• Liberté de choix (libre arbitre) : pouvoir agir autrement.
• Liberté comme absence de contrainte (Hobbes, libéralisme).
• Liberté comme autonomie (Kant) : agir selon une loi que l''on se donne à soi-même par la raison.
• Liberté existentielle (Sartre) : « L''existence précède l''essence » — nous sommes condamnés à être libres.

📌 2. Déterminisme
Thèse : tous les événements, y compris humains, sont déterminés par des causes antérieures.
Freud : l''inconscient détermine nos actes à notre insu.
Compatibilisme : déterminisme et liberté peuvent coexister.

📌 3. Responsabilité
Être responsable = répondre de ses actes.
Conditions : liberté (capacité de choisir) + connaissance.
Responsabilité morale, juridique, sociale.
Kant : on est responsable de sa volonté, pas des conséquences imprévisibles.

📌 4. Liberté et société
Rousseau : la liberté civile, guidée par la volonté générale.
Mill : principe de liberté — chacun est libre tant qu''il ne nuit pas à autrui.',
'Exemple — Liberté sartrienne',
'Sujet : « Être libre, est-ce faire ce que l''on veut ? » Rédiger une introduction.',
'Accroche : On rêve souvent de liberté totale, de pouvoir tout faire sans contrainte.
Problème : Mais faire ce que l''on veut, est-ce vraiment être libre ? Ou la vraie liberté suppose-t-elle des conditions ?
Thèse 1 : Liberté = pouvoir faire ce qu''on veut (liberté spontanée). Thèse 2 : Mais nos désirs sont conditionnés (Freud, société). Thèse 3 : La vraie liberté est autonomie rationnelle (Kant) ou engagement conscient (Sartre).',
'QCM — Liberté',
'Pour Sartre, l''être humain est :',
'qcm',
'["a) Déterminé par sa nature","b) Condamné à être libre","c) Libre uniquement par la grâce divine","d) Libre seulement en société"]'::jsonb,
'b',
'Sartre affirme : « L''existence précède l''essence. » L''homme n''a pas de nature prédéfinie : il se crée par ses choix. Il est « condamné à être libre » car il ne peut se soustraire à la responsabilité de choisir.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_3',s.id,3,'L''État et la société','SA 3',
'📚 L''ÉTAT ET LA SOCIÉTÉ

📌 1. Définitions
État : organisation politique d''une société sur un territoire, détentrice du monopole de la violence légitime (Weber).
Société : ensemble d''individus liés par des règles, des institutions, une culture.

📌 2. Théories du contrat social
• Hobbes : état de nature = guerre de tous contre tous → contrat → Léviathan (souveraineté absolue).
• Locke : état de nature relativement paisible → contrat pour protéger la propriété → État libéral.
• Rousseau : état de nature innocent → contrat basé sur la volonté générale → souveraineté populaire.

📌 3. Légitimité et légalité
Légal : conforme à la loi. Légitime : moralement justifié.
Peut-on désobéir à une loi injuste ? (Thoreau : désobéissance civile ; MLK ; Gandhi).

📌 4. Justice et droit
Droit naturel vs droit positif.
Justice distributive (selon mérites) vs justice corrective.
Rawls : voile d''ignorance → principes de justice équitable.

📌 5. Rôles de l''État
Sécurité, justice, éducation. État minimal (libéralisme) vs État providence (social-démocratie).',
'Exemple — Dissertation : État et liberté',
'Sujet : « L''État est-il un obstacle à la liberté ? » Construire un plan dialectique.',
'I. L''État limite la liberté individuelle : contraintes, lois, impôts.
II. L''État garantit la liberté réelle : sans État, la loi du plus fort s''impose (Hobbes) ; les droits sont protégés.
III. Dépasse : la vraie liberté naît d''une organisation politique juste (Rousseau : volonté générale = liberté collective).',
'Vrai ou Faux',
'Pour Hobbes, l''état de nature est un état de paix et de bonheur naturel.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Pour Hobbes, l''état de nature est une guerre de tous contre tous (« homo homini lupus »). C''est Rousseau qui décrit l''état de nature comme un état d''innocence et de bonheur relatif.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_4',s.id,4,'Le travail et la technique','SA 2',
'📚 LE TRAVAIL ET LA TECHNIQUE

📌 1. Définitions
Travail : activité transformatrice de la nature en vue d''une fin.
Technique : ensemble des moyens et savoir-faire pour transformer le monde.

📌 2. Marx et l''aliénation
Travail aliéné : le travailleur est étranger au produit de son travail (capitalisme).
Travail libérateur : idéalement, le travail permet à l''homme de se réaliser.
Plus-value : différence entre ce que produit le travailleur et ce qu''il reçoit.

📌 3. Hegel — La dialectique du maître et de l''esclave
L''esclave qui travaille prend conscience de lui-même à travers la transformation du monde.
Le travail est médiation entre l''homme et la nature → formation du sujet.

📌 4. Technique et humanité
Homo faber : l''homme se définit par son usage des outils.
Bergson : la technique est prolongement de l''intelligence.
Heidegger : la technique moderne arraisonne la nature, aliène l''être.

📌 5. Pièges de la modernité
Chômage technologique, dépendance aux machines, perte de sens du travail.
Mais aussi : libération des tâches pénibles, accès aux soins, communication.',
'Exemple — Commentaire de texte',
'Marx : « Le travail est extérieur à l''ouvrier, c''est-à-dire qu''il n''appartient pas à son être essentiel. » Expliquer cette thèse.',
'Marx décrit l''aliénation : dans le capitalisme, le travail ne permet pas à l''ouvrier de s''épanouir car : (1) il ne possède pas le produit de son travail, (2) il ne choisit pas la nature de son activité, (3) il travaille pour survivre, non pour se réaliser. Le travail devient souffrance, non expression de soi.',
'QCM — Le travail',
'Selon Marx, l''aliénation du travailleur dans le capitalisme signifie :',
'qcm',
'["a) Que le travailleur est paresseux","b) Que le travailleur est étranger au produit de son travail","c) Que la technique améliore les conditions de travail","d) Que le travail est source de liberté"]'::jsonb,
'b',
'L''aliénation chez Marx désigne le fait que le travailleur, dans le système capitaliste, est dépossédé du produit de son travail et de son activité créatrice. Il est étranger à lui-même à travers son propre travail.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_5',s.id,5,'La conscience et l''inconscient','SA 3',
'📚 LA CONSCIENCE ET L''INCONSCIENT

📌 1. Conscience
• Conscience immédiate : présence à soi, aux choses (conscience de…).
• Conscience réfléchie : retour sur soi, connaissance de soi.
• Conscience morale : sentiment du bien et du mal.
Descartes : le cogito fonde la conscience comme certitude première.

📌 2. L''inconscient freudien
Topique 1 (Freud) : conscient / préconscient / inconscient.
Topique 2 : ça (pulsions) / moi (réalité) / surmoi (normes morales).
Mécanismes de défense : refoulement, projection, sublimation.
Rêve : « voie royale » vers l''inconscient (interprétation des rêves).

📌 3. Critique de l''inconscient
Sartre : pas d''inconscient → mauvaise foi (mensonge à soi-même).
L''homme est conscience, il choisit toujours.

📌 4. Conscience et identité personnelle
Locke : identité = continuité de la conscience (mémoire).
Hume : pas de moi substantiel, juste un flux de perceptions.

📌 5. Liberté et conscience
La prise de conscience est condition de la libération (pédagogie, psychanalyse).',
'Exemple — Analyse de concept',
'Expliquer la différence entre le ça, le moi et le surmoi chez Freud.',
'Le ça : réservoir pulsionnel (Eros, Thanatos), obéit au principe de plaisir, inconscient.
Le moi : médiateur entre le ça et le monde réel, obéit au principe de réalité.
Le surmoi : instance morale intériorisée (interdit de l''inceste, normes sociales), en partie inconscient.
Ex : moi veut manger (ça), mais le surmoi rappelle qu''il faut partager (norme).',
'Vrai ou Faux',
'Pour Sartre, l''inconscient freudien est une réalité psychologique incontestable.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Sartre rejette l''inconscient freudien. Pour lui, il s''agit de « mauvaise foi » : l''individu se ment à lui-même consciemment pour fuir la responsabilité de sa liberté. La conscience est toujours présente, même quand on feint de ne pas la voir.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_philo_6',s.id,6,'La morale et les valeurs','SA 3',
'📚 LA MORALE ET LES VALEURS

📌 1. Morale et éthique
Morale : ensemble de règles distinguant le bien du mal.
Éthique : réflexion sur ces règles (origine, fondements).

📌 2. Théories morales
• Déontologie (Kant) : agis selon un principe universalisable → impératif catégorique : « Agis de telle sorte que la maxime de ton action puisse être érigée en loi universelle. »
• Conséquentialisme/Utilitarisme (Bentham, Mill) : l''action est bonne si elle maximise le bonheur du plus grand nombre.
• Éthique des vertus (Aristote) : viser l''eudémonia (bonheur/épanouissement) par la pratique des vertus (courage, prudence, justice).

📌 3. Valeurs
Valeurs : ce qui est estimé important, désirable (vérité, liberté, justice, solidarité).
Relativisme moral : les valeurs varient selon cultures (Montaigne : « Chaque peuple tient pour barbare ce qui n''est pas son usage »).
Universalisme : existence de valeurs morales universelles (droits de l''homme).

📌 4. Devoir
Obligation morale distincte de l''obligation juridique.
Kant : agir par devoir (non par crainte ou intérêt) = acte moral.',
'Exemple — L''impératif catégorique de Kant',
'Peut-on mentir pour sauver un innocent ? Analyser avec l''impératif catégorique de Kant.',
'Kant : le mensonge ne peut être universalisé (si tout le monde ment, la communication perd tout sens).
Donc mentir est toujours moralement interdit, même pour sauver un innocent.
Critique (Mill) : un mensonge dont les conséquences sauvent une vie est moralement justifié (utilitarisme).
Conclusion : la tension entre déontologie et conséquentialisme montre que la morale ne se réduit pas à un principe unique.',
'QCM — Éthique',
'L''impératif catégorique de Kant signifie :',
'qcm',
'["a) Obéir à la loi de son pays","b) Agir selon ses intérêts","c) Agir selon un principe moralement universalisable","d) Maximiser le bonheur collectif"]'::jsonb,
'c',
'L''impératif catégorique est un commandement moral inconditionnel (pas hypothétique). Il exige d''agir seulement selon une maxime que l''on pourrait vouloir érigée en loi universelle pour tous. Ce n''est ni l''intérêt personnel ni la loi civile, mais la raison morale.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='philosophie'
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- BAC A — FRANÇAIS & LITTÉRATURE (6 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_fr_1',s.id,1,'Texte argumentatif et dissertation','SA 1',
'📚 TEXTE ARGUMENTATIF ET DISSERTATION

📌 1. La dissertation
Structure obligatoire : Introduction — Développement (2 ou 3 parties) — Conclusion.
Introduction : accroche → présentation du sujet → problématique → annonce du plan.
Développement : chaque partie comporte 2-3 arguments + exemples + transitions.
Conclusion : bilan + ouverture.

📌 2. Types d''argumentation
• Argumentation directe : l''auteur exprime directement sa thèse (essai, discours).
• Argumentation indirecte : l''auteur passe par la fiction (fables, contes philosophiques, romans).

📌 3. Registres argumentatifs
Polémique (attaque), didactique (enseignement), ironique (sous-entendu), lyrique (émotion).

📌 4. Figures de style
Métaphore, comparaison, anaphore, hyperbole, ironie, litote, euphémisme, antithèse.

📌 5. Repères littéraires africains (BAC Bénin)
Mongo Beti, Ferdinand Oyono, Ahmadou Kourouma, Olympe Bhêly-Quenum (Bénin).',
'Exemple — Introduction de dissertation',
'Sujet : « La littérature peut-elle changer le monde ? » Rédiger l''introduction.',
'Accroche : Voltaire disait : « La plume est plus forte que l''épée. »
Présentation : La littérature, à travers ses mots, peut-elle transformer la société et les mentalités ?
Problématique : La littérature a-t-elle le pouvoir de changer le monde, ou se limite-t-elle à le représenter ?
Annonce : Nous verrons d''abord son pouvoir de conscientisation, puis ses limites, et enfin comment elle agit indirectement sur le réel.',
'QCM — Argumentation',
'Dans une argumentation indirecte, l''auteur :',
'qcm',
'["a) Donne directement son avis","b) Passe par la fiction pour défendre une thèse","c) Ne prend jamais position","d) Utilise uniquement des arguments logiques"]'::jsonb,
'b',
'L''argumentation indirecte utilise des formes détournées (fable, conte, roman) pour faire passer un message. Ex : les Fables de La Fontaine défendent des valeurs morales à travers des animaux. L''auteur ne parle pas en son nom directement.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='francais_litt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_fr_2',s.id,2,'Commentaire composé','SA 2',
'📚 COMMENTAIRE COMPOSÉ

📌 1. Définition
Étude organisée d''un texte littéraire en dégageant les caractéristiques essentielles (fond + forme).
Ne pas paraphraser : analyser, commenter, interpréter.

📌 2. Méthode
Étape 1 : Lecture attentive → repérer thème, mouvement général, point de vue.
Étape 2 : Relevé des procédés stylistiques.
Étape 3 : Formuler 2-3 axes de lecture liés au thème.
Étape 4 : Rédiger avec citations courtes et intégrées.

📌 3. Structure
Introduction : présentation de l''auteur/œuvre → situer l''extrait → problématique → axes.
Développement : Axe 1 → Axe 2 → (Axe 3).
Conclusion : synthèse + ouverture.

📌 4. Procédés à identifier
Champ lexical, registre, temps verbaux, figures de style, ponctuation, rythme des phrases.',
'Exemple — Commentaire court',
'Extrait : « Il était une fois un vieux roi qui vivait seul dans son grand palais vide. » Commenter les effets stylistiques.',
'Formule initiatrice de conte (« Il était une fois ») → registre merveilleux, universalité.
« Vieux roi » : oxymore implicite (force royale / déclin).
Accumulation d''adjectifs : vieux / seul / grand / vide → solitude et mélancolie.
« Grand palais vide » : paradoxe du pouvoir sans bonheur.
Effet global : atmosphère de tristesse et de nostalgie malgré le cadre royal.',
'Vrai ou Faux',
'Dans un commentaire composé, paraphraser le texte est recommandé pour montrer qu''on l''a compris.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Le commentaire composé demande d''analyser et d''interpréter, non de répéter ce que dit le texte avec d''autres mots (paraphrase). Il faut montrer comment et pourquoi l''auteur utilise tels procédés pour produire tel effet.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='francais_litt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_fr_3',s.id,3,'Résumé et synthèse','SA 3',
'📚 RÉSUMÉ ET SYNTHÈSE

📌 1. Le résumé
Reformuler fidèlement en réduisant au quart (ou au dixième) sans ajouter d''idées personnelles.
Règles : utiliser ses propres mots, conserver la structure logique, respecter le point de vue de l''auteur.
Pièges : paraphrase trop proche, omissions d''idées essentielles, ajouts personnels.

📌 2. La synthèse de documents
Mettre en relation plusieurs documents (textes, graphique, image) sur un thème commun.
Structure : introduction (thème + problématique) → confrontation des documents → conclusion.
Neutralité : ne pas donner son avis.

📌 3. Connecteurs logiques indispensables
Addition : de plus, en outre, par ailleurs.
Opposition : cependant, néanmoins, en revanche, or.
Cause : car, en raison de, étant donné que.
Conséquence : donc, ainsi, c''est pourquoi.
Illustration : par exemple, notamment, c''est le cas de.',
'Exemple — Résumé',
'Texte de 200 mots sur l''importance de l''éducation au Bénin. Réduire à 50 mots.',
'L''éducation constitue le pilier du développement au Bénin. Malgré des progrès, l''accès reste inégal entre zones urbaines et rurales. L''État investit davantage mais les défis persistent : manque d''enseignants qualifiés, infrastructures insuffisantes. Une éducation de qualité est pourtant indispensable pour réduire la pauvreté et assurer la prospérité future.
(47 mots — idées essentielles conservées, reformulées.)',
'QCM — Résumé',
'Lors de la rédaction d''un résumé, il est interdit de :',
'qcm',
'["a) Reformuler les idées avec ses propres mots","b) Ajouter ses opinions personnelles","c) Respecter l''ordre des idées de l''auteur","d) Utiliser des connecteurs logiques"]'::jsonb,
'b',
'Le résumé doit restituer fidèlement les idées de l''auteur sans les déformer ni y ajouter ses propres opinions. Toute intervention personnelle est une faute. On reformule, on condense, mais on ne commente pas.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='francais_litt'
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- BAC A — HISTOIRE-GÉOGRAPHIE (6 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_hg_1',s.id,1,'Histoire contemporaine mondiale : guerres et paix','SA 1',
'📚 HISTOIRE CONTEMPORAINE MONDIALE : GUERRES ET PAIX

📌 1. Première Guerre mondiale (1914-1918)
Causes : nationalisme, impérialisme, assassinat de François-Ferdinand (28 juin 1914).
Déroulement : guerre de tranchées, Verdun (1916), entrée des USA (1917).
Bilan : 20 millions de morts, traité de Versailles (1919), humiliation de l''Allemagne.

📌 2. Deuxième Guerre mondiale (1939-1945)
Causes : montée du nazisme, politique d''apaisement, Anschluss.
Étapes : Blitzkrieg, Résistance, débarquement (juin 1944), victoire alliée.
Shoah : génocide de 6 millions de Juifs.
Bilan : 60 millions de morts, ONU créée (1945).

📌 3. Guerre froide (1947-1991)
Deux blocs : USA (OTAN) vs URSS (Pacte de Varsovie).
Crises : Berlin, Cuba (1962), Corée, Vietnam.
Fin : chute du mur de Berlin (1989), dissolution URSS (1991).

📌 4. Vers un monde multipolaire
ONU, droits de l''homme (1948), décolonisation, mondialisation.
Tensions actuelles : terrorisme, conflits régionaux, puissances émergentes (Chine, Inde).',
'Exemple — Analyse d''un événement',
'Expliquer les causes et conséquences de la Première Guerre mondiale en 10 lignes.',
'Causes immédiates : attentat de Sarajevo (28/06/1914). Causes profondes : rivalités impérialistes entre grandes puissances, courses aux armements, jeu des alliances (Triple Entente vs Triple Alliance), nationalisme exacerbé.
Conséquences : redécoupage de la carte d''Europe (traité de Versailles 1919), naissance de nouveaux États, humiliation allemande → terreau du nazisme. Création SDN (ancêtre ONU). 20 millions de morts, dévastation économique.',
'QCM — Guerres mondiales',
'La Société des Nations (SDN) a été créée après :',
'qcm',
'["a) La guerre de Crimée","b) La Première Guerre mondiale","c) La Deuxième Guerre mondiale","d) La guerre froide"]'::jsonb,
'b',
'La SDN (Société des Nations) a été créée par le traité de Versailles en 1919, à l''initiative du président américain Wilson. Elle visait à maintenir la paix mais n''a pu empêcher la Seconde Guerre mondiale. Elle a été remplacée par l''ONU en 1945.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='histoire_geo'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_hg_2',s.id,2,'Décolonisation et indépendances africaines','SA 2',
'📚 DÉCOLONISATION ET INDÉPENDANCES AFRICAINES

📌 1. Le colonialisme en Afrique
Partage de l''Afrique : Conférence de Berlin (1884-1885) — sans consultation des Africains.
Exploitation : travail forcé, impôts, indigénat.
Résistances : Béhanzin au Dahomey (Bénin), Samori Touré en Afrique de l''Ouest.

📌 2. Causes de la décolonisation
• Affaiblissement des métropoles après la 2GM.
• Montée des nationalismes africains.
• Pression internationale (ONU, USA, URSS).
• Rôle des intellectuels africains : Négritude (Senghor, Césaire).

📌 3. Les indépendances (années 1960)
1960 : « Année de l''Afrique » — 17 pays indépendants dont le Bénin (Dahomey, 1960).
Kwame Nkrumah (Ghana), Sékou Touré (Guinée), Félix Houphouët-Boigny (Côte d''Ivoire).
Néo-colonialisme : indépendance politique mais dépendance économique.

📌 4. Défis post-indépendance
Instabilité politique (coups d''État), économies primaires dépendantes, conflits ethniques.
Intégration régionale : UA (Union Africaine), CEDEAO.',
'Exemple — Le cas du Bénin',
'Décrire le processus d''accession à l''indépendance du Bénin (Dahomey).',
'Le territoire du Dahomey est colonisé par la France depuis 1894 (après la défaite du roi Béhanzin).
Mouvement indépendantiste : parti RDA, syndicats, intellectuels.
1958 : autonomie dans le cadre de la Communauté française.
1er août 1960 : indépendance officielle. Premier président : Hubert Maga.
1975 : la République du Dahomey devient la République Populaire du Bénin sous Kérékou.',
'Vrai ou Faux',
'La Conférence de Berlin (1884-1885) a permis aux Africains de négocier le partage de leur continent.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. La Conférence de Berlin (1884-1885) a réuni les puissances européennes pour se partager l''Afrique sans consulter les Africains. C''est un acte de domination coloniale unilatéral qui a ignoré les populations et royaumes africains.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='histoire_geo'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'bac_A_hg_3',s.id,3,'Histoire du Bénin','SA 3',
'📚 HISTOIRE DU BÉNIN

📌 1. Les royaumes précoloniaux
Royaume de Danxomè (Dahomey, 17e-19e s.) : capitale Abomey, rois : Houégbadja, Agadja, Guézo, Glèlè, Béhanzin.
Esclavage atlantique : le Dahomey a joué un rôle dans la traite des esclaves.
Résistance : Béhanzin résiste aux Français jusqu''à sa capitulation en 1894.

📌 2. Colonisation française (1894-1960)
Dahomey intégré à l''AOF (Afrique Occidentale Française).
Travail forcé, indigénat, imposition coloniale.
Émergence d''élites africaines formées en France.

📌 3. Indépendance et instabilité (1960-1972)
6 coups d''État entre 1960 et 1972.
Hubert Maga, Sourou Migan Apithy, Justin Ahomadégbé → triumvirat (1970-1972).
1972 : coup d''État de Mathieu Kérékou.

📌 4. Régime révolutionnaire (1972-1990)
Marxisme-léninisme : 1975 → République Populaire du Bénin.
Nationalisation, parti unique (PRPB).

📌 5. Conférence Nationale (1990) — modèle africain
Transition pacifique vers la démocratie.
Constitution de 1990, multipartisme.
Nicéphore Soglo élu (1991). Retour de Kérékou (1996).',
'Exemple — La Conférence Nationale du Bénin',
'Expliquer pourquoi la Conférence Nationale de 1990 est considérée comme un modèle en Afrique.',
'La Conférence Nationale Souveraine (février 1990) a réuni toutes les forces vives du Bénin (partis, syndicats, religieux, associations).
Elle a : démis le gouvernement de Kérékou de ses pouvoirs, instauré une période de transition, adopté une nouvelle constitution démocratique, organisé des élections libres.
Modèle car transition pacifique, sans guerre civile, vers un État de droit — contrairement à d''autres pays africains.',
'QCM — Histoire du Bénin',
'La capitale historique du royaume de Danxomè (Dahomey) était :',
'qcm',
'["a) Cotonou","b) Porto-Novo","c) Abomey","d) Parakou"]'::jsonb,
'c',
'Abomey (actuel département du Zou) était la capitale du puissant royaume du Danxomè. Les palais royaux d''Abomey sont classés au patrimoine mondial de l''UNESCO. Cotonou est la capitale économique actuelle du Bénin.'
from public.subjects s where s.niveau_code='bac' and s.serie_code='A' and s.code='histoire_geo'
on conflict (slug) do nothing;


-- ═══════════════════════════════════════════════════════════════════
-- BREVET COMPLET — TOUTES LES MATIÈRES (PROGRAMME NATIONAL BÉNINOIS)
-- ═══════════════════════════════════════════════════════════════════

-- ─── MATHÉMATIQUES BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_1',
  s.id,
  1,
  'Nombres entiers, rationnels et puissances',
  'SA 1',
  '📚 Nombres entiers, rationnels et puissances

Nombres entiers relatifs Z, opérations (+, -, ×, ÷) et priorités opératoires. Nombres rationnels Q = a/b (b≠0), simplification, addition, soustraction, multiplication et division de fractions. Puissances entières positives et négatives : a^n, règles de calcul (a^m × a^n = a^{m+n}, (a^m)^n = a^{m×n}, a^n / a^m = a^{n-m}). Décomposition en produit de facteurs premiers, calcul du PGCD et du PPCM, fractions irréductibles.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Nombres entiers, rationnels et puissances',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Nombres entiers, rationnels et puissances, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_2',
  s.id,
  2,
  'Calcul littéral, factorisation et identités remarquables',
  'SA 1',
  '📚 Calcul littéral, factorisation et identités remarquables

Expressions littérales : réduction et ordonnancement selon les puissances décroissantes. Développement par distributivité simple k(a+b) = ka+kb et double (a+b)(c+d) = ac+ad+bc+bd. Les 3 identités remarquables fondamentales : (a+b)² = a² + 2ab + b², (a-b)² = a² - 2ab + b², (a+b)(a-b) = a² - b². Factorisation par recherche d''un facteur commun évident ou par reconnaissance d''une identité remarquable.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Calcul littéral, factorisation et identités remarquables',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Calcul littéral, factorisation et identités remarquables, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_3',
  s.id,
  3,
  'Équations et inéquations du premier degré',
  'SA 1',
  '📚 Équations et inéquations du premier degré

Équation du premier degré à une inconnue ax + b = 0 (avec a≠0) : méthode d''isolation de l''inconnue x = -b/a. Équations-produits nuls : (ax+b)(cx+d) = 0 équivaut à ax+b = 0 ou cx+d = 0. Inéquations du premier degré : résolution, représentation des solutions sur une droite graduée, inversion du sens de l''inégalité lors de la multiplication ou division par un nombre négatif. Mise en équation et résolution de problèmes de la vie courante.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Équations et inéquations du premier degré',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Équations et inéquations du premier degré, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_4',
  s.id,
  4,
  'Propriété de Thalès dans le triangle',
  'SA 2',
  '📚 Propriété de Thalès dans le triangle

Théorème de Thalès direct : dans un triangle ABC, si M ∈ [AB], N ∈ [AC] et les droites (MN) et (BC) sont parallèles, alors AM/AB = AN/AC = MN/BC. Configuration papillon ou sablier. Réciproque du théorème de Thalès : condition d''alignement des points dans le même ordre et égalité des rapports pour prouver le parallélisme de deux droites. Applications aux partages de segments et réductions/agrandissements de figures géométriques.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Propriété de Thalès dans le triangle',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Propriété de Thalès dans le triangle, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_5',
  s.id,
  5,
  'Triangle rectangle, Théorème de Pythagore et Trigonométrie',
  'SA 2',
  '📚 Triangle rectangle, Théorème de Pythagore et Trigonométrie

Théorème de Pythagore : dans un triangle ABC rectangle en A, BC² = AB² + AC² (le carré de l''hypoténuse est égal à la somme des carrés des côtés de l''angle droit). Réciproque de Pythagore : caractérisation du triangle rectangle. Trigonométrie de l''angle aigu α : cos α = côté adjacent / hypoténuse, sin α = côté opposé / hypoténuse, tan α = côté opposé / côté adjacent = sin α / cos α. Propriétés : 0 < cos α < 1, 0 < sin α < 1, cos² α + sin² α = 1. Angles remarquables 30°, 45°, 60°.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Triangle rectangle, Théorème de Pythagore et Trigonométrie',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Triangle rectangle, Théorème de Pythagore et Trigonométrie, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_6',
  s.id,
  6,
  'Fonctions linéaires et affines',
  'SA 3',
  '📚 Fonctions linéaires et affines

Fonction linéaire f(x) = ax : coefficient de proportionnalité a, droite passant par l''origine du repère O(0,0). Fonction affine f(x) = ax + b : coefficient directeur (pente) a = (f(x₂)-f(x₁))/(x₂-x₁), ordonnée à l''origine b. Représentation graphique dans un repère orthonormé. Sens de variation : croissante si a > 0, décroissante si a < 0, constante si a = 0. Détermination d''une fonction affine à partir de deux points.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Fonctions linéaires et affines',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Fonctions linéaires et affines, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_7',
  s.id,
  7,
  'Systèmes de deux équations à deux inconnues',
  'SA 3',
  '📚 Systèmes de deux équations à deux inconnues

Forme générale : { ax + by = c ; a''x + b''y = c'' }. Méthodes de résolution algébrique : méthode par substitution (exprimer une variable en fonction de l''autre), méthode par combinaisons linéaires (élimination d''une variable par multiplication des lignes). Interprétation graphique : coordonnées du point d''intersection des deux droites. Cas des droites parallèles (aucune solution) ou confondues (infinité de solutions). Problèmes concrets d''achat et de partage.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Systèmes de deux équations à deux inconnues',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Systèmes de deux équations à deux inconnues, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_mathematiques_8',
  s.id,
  8,
  'Statistiques et organisation de données',
  'SA 4',
  '📚 Statistiques et organisation de données

Série statistique : population, caractère (qualitatif ou quantitatif discret/continu), effectifs, effectif total N. Fréquences relatives f = n/N et pourcentages. Moyenne simple et moyenne pondérée x̄ = ∑(n_i × x_i) / N. Médiane Me (valeur qui partage la série ordonnée en deux groupes de même effectif). Représentations graphiques : diagramme en bâtons, histogramme, diagramme circulaire (angle = fréquence × 360°).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Statistiques et organisation de données',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Statistiques et organisation de données, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'mathematiques'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── PHYSIQUE-CHIMIE-TECHNOLOGIE BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_1',
  s.id,
  1,
  'Le courant électrique alternatif sinusoïdal',
  'SA 1',
  '📚 Le courant électrique alternatif sinusoïdal

Production du courant alternatif : rotation d''un aimant devant une bobine fixe (phénomène d''induction électromagnétique, alternateur). Caractéristiques visualisées à l''oscilloscope : tension maximale U_max (en volts), tension crête à crête U_cc = 2 U_max. Période T : durée d''un motif élémentaire en secondes (s). Fréquence f = 1/T en Hertz (Hz). Réseau électrique béninois de la SBEE : f = 50 Hz, tension efficace nominale U_eff = 220 V. Relation fondamentale pour une tension sinusoïdale : U_max = U_eff × √2 (avec √2 ≈ 1,414).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Le courant électrique alternatif sinusoïdal',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Le courant électrique alternatif sinusoïdal, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_2',
  s.id,
  2,
  'Puissance et énergie électriques — Sécurité domestique',
  'SA 1',
  '📚 Puissance et énergie électriques — Sécurité domestique

Puissance électrique consommée en régime alternatif : P = U_eff × I_eff (pour récepteur purement thermique) en Watts (W). Énergie électrique : E = P × t (en Joules J si t en secondes, en kilowattheure kWh si t en heures ; 1 kWh = 3,6 × 10⁶ J). Effet Joule : dégagement de chaleur Q = R × I² × t. Mesure par compteur électrique SBEE. Sécurité domestique au Bénin : rôle de la prise de terre, disjoncteur différentiel contre les électrocutions, fusibles calibrés en série pour couper les surintensités et courts-circuits.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Puissance et énergie électriques — Sécurité domestique',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Puissance et énergie électriques — Sécurité domestique, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_3',
  s.id,
  3,
  'Propagation rectiligne de la lumière et réflexion',
  'SA 2',
  '📚 Propagation rectiligne de la lumière et réflexion

Principe de propagation rectiligne de la lumière dans un milieu homogène et transparent. Notion de rayon lumineux et faisceau lumineux (parallèle, convergent, divergent). Phénomène de réflexion sur miroir plan : rayon incident, point d''incidence, normale au miroir, rayon réfléchi. Première loi de Snell-Descartes pour la réflexion : le rayon incident, la normale et le rayon réfléchi sont dans le même plan. Deuxième loi : angle d''incidence i égale angle de réflexion r (i = r). Formation d''images virtuelles symétriques.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Propagation rectiligne de la lumière et réflexion',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Propagation rectiligne de la lumière et réflexion, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_4',
  s.id,
  4,
  'Réfraction de la lumière et lentilles minces',
  'SA 2',
  '📚 Réfraction de la lumière et lentilles minces

Réfraction : changement brusque de direction de la lumière à la traversée d''un dioptre séparant deux milieux transparents d''indices n₁ et n₂. Loi de Snell-Descartes : n₁ sin(i₁) = n₂ sin(i₂). Lentilles minces : à bords minces (convergentes), à bords épais (divergentes). Éléments d''une lentille convergente : centre optique O, axe optique principal, foyer objet F, foyer image F'', distance focale f'' = OF'' en mètres. Vergence C = 1/f'' exprimée en dioptries (δ). Construction géométrique de l''image A''B'' d''un objet AB : rayon passant par O non dévié, rayon parallèle à l''axe émergeant par F'', rayon passant par F émergeant parallèle à l''axe. Formule de conjugaison 1/OA'' - 1/OA = 1/OF''.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Réfraction de la lumière et lentilles minces',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Réfraction de la lumière et lentilles minces, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_5',
  s.id,
  5,
  'Poids, masse et équilibre d''un solide',
  'SA 2',
  '📚 Poids, masse et équilibre d''un solide

Distinction fondamentale entre masse m (quantité de matière invariable, mesurée avec une balance en kg) et poids P (force d''attraction gravitationnelle exercée par la Terre, mesurée avec un dynamomètre en Newtons N). Relation vectorielle P = m × g où g est l''intensité de la pesanteur (au Bénin g ≈ 9,8 N/kg ou 10 N/kg). Caractéristiques du poids : point d''application (centre de gravité G), direction (verticale du lieu), sens (vers le bas, centre de la Terre), intensité P en N. Conditions d''équilibre d''un solide soumis à deux forces F₁ et F₂ : même droite d''action, sens opposés, intensités égales (F₁ + F₂ = 0). Solide soumis à trois forces concourantes et coplanaires.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Poids, masse et équilibre d''un solide',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Poids, masse et équilibre d''un solide, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_6',
  s.id,
  6,
  'Structure de l''atome, formation des ions et solutions aqueuses',
  'SA 3',
  '📚 Structure de l''atome, formation des ions et solutions aqueuses

L''atome est électriquement neutre : constitué d''un noyau central dense (protons de charge +e et neutrons sans charge) et d''un nuage d''électrons périphériques (charge -e). Numéro atomique Z = nombre de protons = nombre d''électrons. Ions monoatomiques et polyatomiques : un cation est issu de la perte d''électrons (ex: Na⁺, Cu²⁺, Fe²⁺, Fe³⁺), un anion est issu du gain d''électrons (ex: Cl⁻, SO₄²⁻, OH⁻). Conduction électrique : dans les métaux par déplacement des électrons libres ; dans les solutions aqueuses (électrolytes) par déplacement simultané des ions (cations vers la cathode -, anions vers l''anode +).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Structure de l''atome, formation des ions et solutions aqueuses',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Structure de l''atome, formation des ions et solutions aqueuses, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_7',
  s.id,
  7,
  'Électrolyse de l''eau et des solutions salines',
  'SA 3',
  '📚 Électrolyse de l''eau et des solutions salines

Définition de l''électrolyse : réaction chimique forcée provoquée par le passage d''un courant électrique continu dans une solution ionique. Électrolyseur à électrodes inattaquables (platine ou graphite). Électrolyse de l''eau acidifiée : à la cathode (borne négative), dégagement de gaz dihydrogène H₂ (qui détonne à la flamme) ; à l''anode (borne positive), dégagement de gaz dioxygène O₂ (qui rallume une bûchette incandescente). Bilan volumique : Volume H₂ = 2 × Volume O₂. Équation-bilan : 2 H₂O → 2 H₂ + O₂. Électrolyse du chlorure de sodium (NaCl) : dégagement de dichlore Cl₂ à l''anode et soude + H₂ à la cathode.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Électrolyse de l''eau et des solutions salines',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Électrolyse de l''eau et des solutions salines, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_physique_chim_tech_8',
  s.id,
  8,
  'Solutions acides, basiques et réactions chimiques',
  'SA 3',
  '📚 Solutions acides, basiques et réactions chimiques

Notion de pH (potentiel hydrogène) à 25°C : échelle de 0 à 14. Solution acide : pH < 7 (prépondérance des ions H⁺/H₃O⁺). Solution neutre : pH = 7 (ex: eau pure). Solution basique : pH > 7 (prépondérance des ions hydroxyde OH⁻). Mesure du pH par papier pH ou pH-mètre. Réaction entre acide chlorhydrique (H⁺ + Cl⁻) et fer métal (Fe) : attaque effervescente, dégagement de dihydrogène H₂ et formation d''ions fer II Fe²⁺ (testés par précipité vert avec NaOH). Équation : Fe + 2 H⁺ → Fe²⁺ + H₂. Neutralisation acido-basique : H⁺ + OH⁻ → H₂O (réaction exothermique).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Solutions acides, basiques et réactions chimiques',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Solutions acides, basiques et réactions chimiques, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'physique_chim_tech'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── SVT BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_1',
  s.id,
  1,
  'Nutrition et digestion des aliments chez l''Homme',
  'SA 1',
  '📚 Nutrition et digestion des aliments chez l''Homme

Groupes d''aliments : glucides énergétiques (amidon, saccharose, glucose), protides bâtisseurs (viandes, poissons, légumineuses), lipides de réserve, eau, sels minéraux (calcium, fer) et vitamines. Phénomènes mécaniques (mastication buccale, brassage gastrique, péristaltisme intestinal) et chimiques de la digestion. Rôle des enzymes digestives spécifiques (amylase salivaire, pepsine gastrique, protéases, lipases et maltases pancréatiques/intestinales) qui hydrolysent les macromolécules insolubles en nutriments simples solubles. L''absorption intestinale au niveau des villosités de l''intestin grêle : passage dans le sang (glucose, acides aminés, eau, sels) et dans la lymphe (acides gras et glycérol).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Nutrition et digestion des aliments chez l''Homme',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Nutrition et digestion des aliments chez l''Homme, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_2',
  s.id,
  2,
  'Respiration et circulation sanguine',
  'SA 1',
  '📚 Respiration et circulation sanguine

Ventilation pulmonaire : inspiration active (contraction du diaphragme et muscles intercostaux) et expiration passive. Échanges gazeux alvéolaires : diffusion de l''O₂ des alvéoles vers le sang et du CO₂ du sang vers les alvéoles selon les gradients de pression partielle. Hématose : transformation du sang veineux sombre en sang artériel rouge vif. Rôle de l''hémoglobine des hématies : Hb + 4 O₂ ⇄ Hb(O₂)₄ (oxyhémoglobine). Le cœur : muscle creux (myocarde) à 4 cavités (2 oreillettes, 2 ventricules), cloison étanche évitant le mélange des sangs. Double circulation : petite circulation pulmonaire (cœur droit vers poumons vers cœur gauche) et grande circulation générale systémique (cœur gauche vers tous les organes vers cœur droit).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Respiration et circulation sanguine',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Respiration et circulation sanguine, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_3',
  s.id,
  3,
  'Reproduction humaine et fécondation',
  'SA 2',
  '📚 Reproduction humaine et fécondation

Puberté et caractères sexuels secondaires. Appareil reproducteur masculin : testicules (production continue de spermatozoïdes par spermatogenèse et sécrétion de testostérone), épididyme, canaux déférents, prostate, vésicules séminales, urètre et pénis. Appareil féminin : ovaires (ovogenèse cyclique, sécrétion d''œstrogènes et progestérone), trompes de Fallope, utérus (myomètre et endomètre), vagin et vulve. Le cycle menstruel féminin (durée moyenne 28 jours) : phase folliculaire (J1 à J13), ovulation (J14), phase lutéinique (J15 à J28) et règles en l''absence de fécondation. La fécondation : fusion du spermatozoïde et de l''ovocyte II dans le tiers supérieur de la trompe, formation de la cellule-œuf (zygote), migration et nidation dans l''endomètre utérin (grossesse de 9 mois).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Reproduction humaine et fécondation',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Reproduction humaine et fécondation, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_4',
  s.id,
  4,
  'Hérédité, chromosomes et transmission des gènes',
  'SA 2',
  '📚 Hérédité, chromosomes et transmission des gènes

Support de l''information génétique : le noyau cellulaire contenant les chromosomes constitués d''ADN (acide désoxyribonucléique). Caryotype de l''espèce humaine : 46 chromosomes répartis en 23 paires, dont 22 paires d''autosomes et 1 paire d''hétérochromosomes sexuels (XX chez la femme, XY chez l''homme). Gène : fragment d''ADN codant pour un caractère héréditaire. Allèles : versions différentes d''un même gène. Notions d''allèle dominant, récessif ou codominant. Génotype (constitution allélique, homozygote ou hétérozygote) et phénotype (manifestation observable). Transmission héréditaire : ségrégation des allèles lors de la formation des gamètes haploïdes (23 chromosomes), fécondation rétablissant la diploïdie (46 chromosomes). Échiquier de croisement et étude d''arbres généalogiques.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Hérédité, chromosomes et transmission des gènes',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Hérédité, chromosomes et transmission des gènes, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_5',
  s.id,
  5,
  'Système nerveux et comportement réflexe',
  'SA 3',
  '📚 Système nerveux et comportement réflexe

Organisation générale : système nerveux central (encéphale et moelle épinière) et système nerveux périphérique (nerfs sensitifs et moteurs). Le neurone : unité fonctionnelle excitable, comprenant corps cellulaire avec noyau, dendrites réceptrices et axone conducteur protégé par la gaine de myéline. L''arc réflexe médullaire inné (ex: réflexe rotulien, réflexe de retrait face à une brûlure) : récepteur sensoriel → nerf sensitif afférent (racine postérieure) → centre nerveux médullaire (moelle épinière) → nerf moteur efférent (racine antérieure) → organe effecteur (muscle). Notion de synapse : zone de jonction et transmission chimique par neurotransmetteurs. Effets des drogues, alcool et fatigue sur la vigilance et les réflexes.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Système nerveux et comportement réflexe',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Système nerveux et comportement réflexe, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_6',
  s.id,
  6,
  'Immunité de l''organisme et défenses contre les microbes',
  'SA 3',
  '📚 Immunité de l''organisme et défenses contre les microbes

Le monde microbien : bactéries, virus, champignons microscopiques et protozoaires. Microbes pathogènes et flore commensale. Barrières naturelles : mécaniques (peau, muqueuses, cils) et chimiques (sueur, larmes, sucs gastriques). Réaction inflammatoire locale non spécifique (chaleur, rougeur, douleur, œdème) et phagocytose par les polynucléaires et macrophages. Immunité acquise spécifique : immunité humorale par lymphocytes B produisant des anticorps spécifiques neutralisant les antigènes ; immunité cellulaire par lymphocytes T cytotoxiques détruisant les cellules infectées. Mémoire immunologique : principe de la vaccination (prévention active durable) vs sérothérapie (curative passive immédiate). Cas du VIH/SIDA détruisant les lymphocytes T4.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Immunité de l''organisme et défenses contre les microbes',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Immunité de l''organisme et défenses contre les microbes, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_7',
  s.id,
  7,
  'Écologie, écosystèmes et chaînes trophiques',
  'SA 4',
  '📚 Écologie, écosystèmes et chaînes trophiques

Définition d''un écosystème : interaction dynamique entre un biotope (milieu physico-chimique : sol, eau, température, lumière) et une biocénose (ensemble des êtres vivants animaux, végétaux et microbiens). Chaînes trophiques et réseaux alimentaires : producteurs primaires autotrophes photosynthétiques (végétaux verts), consommateurs primaires herbivores (phytophages), consommateurs secondaires et tertiaires carnivores (zoophages), et décomposeurs du sol (bactéries, champignons, vers recyclant la matière organique en sels minéraux). Flux unidirectionnel d''énergie et cycle biogéochimique de la matière. Équilibres écologiques, impact des feux de brousse, déforestation et pollution au Bénin.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Écologie, écosystèmes et chaînes trophiques',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Écologie, écosystèmes et chaînes trophiques, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_svt_8',
  s.id,
  8,
  'Géologie, formation des sols et ressources minières au Bénin',
  'SA 4',
  '📚 Géologie, formation des sols et ressources minières au Bénin

Les couches géologiques et l''altération des roches mères : altération physique (thermoclastie, action de l''eau) et altération chimique (hydrolyse, dissolution). Profil pédologique d''un sol : horizon superficiel O/A riche en litière et humus fertile, horizon B d''accumulation de minéraux et argiles, horizon C de roche mère altérée. Types de sols au Bénin : sols ferrallitiques rouges sur plateaux du Sud, sols ferrugineux tropicaux sur socle cristallin au Centre et Nord, sols hydromorphes des bas-fonds et vallées alluviales. Ressources géologiques béninoises : gisements de calcaire d''Onigbolo pour la cimenterie, argiles pour la briqueterie, marbre d''Idadjo, sables siliceux côtiers, or alluvionnaire de Perma dans l''Atacora. Préservation des sols contre l''érosion pluviale et éolienne.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Géologie, formation des sols et ressources minières au Bénin',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Géologie, formation des sols et ressources minières au Bénin, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'svt'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── HISTOIRE-GÉOGRAPHIE BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_1',
  s.id,
  1,
  'L''impérialisme européen et le partage de l''Afrique au XIXe siècle',
  'SA 1',
  '📚 L''impérialisme européen et le partage de l''Afrique au XIXe siècle

Origines et causes de l''impérialisme : économiques (recherche de matières premières agricoles et minières suite aux révolutions industrielles, débouchés pour les produits manufacturés), démographiques (surpeuplement de l''Europe), politiques et stratégiques (rivalités entre grandes puissances France, Royaume-Uni, Allemagne, Belgique), idéologiques et religieuses (mission civilisatrice autoproclamée, évangélisation par les missionnaires catholiques et protestants). Les explorations géographiques (Barth, Livingstone, Stanley). La Conférence de Berlin (15 novembre 1884 - 26 février 1885) convoquée par le chancelier Otto von Bismarck : fixation des règles du partage colonial sans aucune représentation africaine (principe de l''occupation effective de l''arrière-pays à partir de la côte, liberté de navigation sur les fleuves Congo et Niger).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — L''impérialisme européen et le partage de l''Afrique au XIXe siècle',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de L''impérialisme européen et le partage de l''Afrique au XIXe siècle, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_2',
  s.id,
  2,
  'Les résistances africaines et dahoméennes à la conquête coloniale',
  'SA 1',
  '📚 Les résistances africaines et dahoméennes à la conquête coloniale

Les formes de pénétration coloniale : traités de protectorat trompeurs suivis d''expéditions militaires brutales. Les grandes figures de résistance en Afrique : Samory Touré dans l''empire Wassoulou, El Hadj Omar Tall, Rabah au Tchad. Au Dahomey (actuel Bénin) : le règne héroïque du roi Dada Gbêhanzin (1889-1894). Causes du conflit : protectorat français imposé sur Porto-Novo par le gouverneur Victor Ballot et revendication de la souveraineté de Cotonou par le Danxomè. Première guerre franco-dahoméenne (1890) et seconde guerre (1892-1894) menée par le colonel Alfred Dodds. Rôle des guerrières Agoodjié (Amazones du Dahomey), batailles acharnées de Dogba, Pogué et Cana. Reddition patriotique de Gbêhanzin en janvier 1894 pour épargner son peuple du massacre, déportation en Martinique puis en Algérie (Blida). Autres héros nationaux : résistance armée de Bio Guéra dans le Borgou (1916) et de Kaba dans l''Atacora (1916-1917) contre le recrutement forcé.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Les résistances africaines et dahoméennes à la conquête coloniale',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Les résistances africaines et dahoméennes à la conquête coloniale, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_3',
  s.id,
  3,
  'Le système colonial en Afrique Occidentale Française (AOF)',
  'SA 1',
  '📚 Le système colonial en Afrique Occidentale Française (AOF)

Création de la fédération de l''Afrique Occidentale Française en 1895 avec pour capitale Dakar. Statut du Dahomey : colonie de l''AOF administrée par un gouverneur subordonné au Gouverneur général. L''administration directe française : division du territoire en cercles administrés par des commandants de cercle européens, cantons et villages confiés à des chefs traditionnels subordonnés. Le Code de l''indigénat (1887) privant les sujets coloniaux de libertés fondamentales. L''exploitation économique coloniale : économie de traite basée sur la monoculture d''exportation (huile de palme et palmiste au Dahomey), travail forcé pour la construction d''infrastructures (chemin de fer Cotonou-Parakou, wharfs), corvées et imposition par capitation. Conséquences socioculturelles : scolarisation sélective pour former des commis indigènes, acculturation et bouleversement des structures sociales traditionnelles.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Le système colonial en Afrique Occidentale Française (AOF)',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Le système colonial en Afrique Occidentale Française (AOF), quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_4',
  s.id,
  4,
  'Les guerres mondiales, l''émancipation et l''accession du Dahomey à l''indépendance',
  'SA 2',
  '📚 Les guerres mondiales, l''émancipation et l''accession du Dahomey à l''indépendance

Participation décisive des soldats africains (Tirailleurs sénégalais et dahoméens) à la Première (1914-1918) et Seconde Guerre mondiale (1939-1945). Impact de la Conférence de Brazzaville (1944) et de la Charte de l''ONU proclamant le droit des peuples à disposer d''eux-mêmes. Éveil du nationalisme dahoméen : syndicats, presse locale, mouvements d''étudiants (FEANF). Vie politique dahoméenne après 1946 (Union française) dominée par le triumvirat : Sourou Migan Apithy (Sud-Est), Justin Tometin Ahomadégbé (Sud-Ouest) et Hubert Coutoucou Maga (Nord). La Loi-Cadre Defferre de 1956 et le référendum constitutionnel gaulliste du 28 septembre 1958 instaurant la République du Dahomey au sein de la Communauté française. Proclamation solennelle de l''Indépendance nationale le 1er août 1960 avec Hubert Maga comme premier Président de la République. Défis initiaux : construction de l''unité nationale, rivalités régionalistes et instabilité politique des années 1960.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Les guerres mondiales, l''émancipation et l''accession du Dahomey à l''indépendance',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Les guerres mondiales, l''émancipation et l''accession du Dahomey à l''indépendance, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_5',
  s.id,
  5,
  'Géographie physique du Bénin : Relief, climats, hydrographie et végétation',
  'SA 2',
  '📚 Géographie physique du Bénin : Relief, climats, hydrographie et végétation

Localisation géographique : Afrique de l''Ouest dans la zone intertropicale, s''étendant du Golfe de Guinée au fleuve Niger entre les méridiens 1° et 3°40'' Est et les parallèles 6°30'' et 12°30'' Nord. Superficie : 114 763 km². Le relief béninois : ensemble tabulaire peu accidenté comprenant le cordon littoral sablonneux et lagunes au Sud, les plateaux de terre de barre et plateaux gréseux du Centre, la pénéplaine cristalline du Nord et la chaîne de l''Atacora (point culminant : Mont Sokbaro, 658 m). Le réseau hydrographique : bassin côtier du Sud (fleuve Ouémé long de 510 km, fleuve Mono frontière avec le Togo, fleuve Couffo) et bassins du Nord (fleuve Niger et ses affluents Alibori, Sota, Mékrou, et la Pendjari). Deux grands domaines climatiques : climat subéquatorial béninien au Sud (bimodal avec deux saisons des pluies et deux saisons sèches, 1200 mm/an) et climat soudanien au Nord (unimodal avec une seule saison pluvieuse de mai à octobre et une longue saison sèche marquée par l''harmattan). Végétations : mangrove côtière, savanes boisées et arbustives, forêts claires.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Géographie physique du Bénin : Relief, climats, hydrographie et végétation',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Géographie physique du Bénin : Relief, climats, hydrographie et végétation, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_6',
  s.id,
  6,
  'La population béninoise : Dynamique, structures et mouvements',
  'SA 3',
  '📚 La population béninoise : Dynamique, structures et mouvements

Évolution démographique : population estimée à plus de 13 millions d''habitants avec un taux de croissance naturel élevé (environ 2,8% par an). Structures par âge et par sexe : extrême jeunesse de la population (plus de 45% ont moins de 15 ans et 65% moins de 25 ans), légère supériorité numérique des femmes. Diversité socioculturelle et ethnique : Fon et apparentés au Sud et Centre, Yoruba et Nago à l''Est, Adja à l''Ouest, Bariba et Dendi au Nord, Peuls éleveurs, Batammariba et Otammari dans l''Atacora. Répartition spatiale très contrastée : fortes densités au Sud littoral (> 300 hab/km² dans l''Ouémé, Atlantique, Littoral) et faibles densités dans le Nord et Centre (< 40 hab/km² dans l''Alibori). Phénomènes migratoires : exode rural massif vers les pôles urbains (Cotonou, Abomey-Calavi, Porto-Novo, Parakou), migrations saisonnières de main-d''œuvre vers le Nigeria et les plantations de Côte d''Ivoire. Problèmes liés à la poussée urbaine : prolifération des quartiers précaires, gestion des déchets solides et liquides, chômage des jeunes et pression sur les infrastructures scolaires et sanitaires.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — La population béninoise : Dynamique, structures et mouvements',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de La population béninoise : Dynamique, structures et mouvements, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_7',
  s.id,
  7,
  'Les activités économiques du Bénin : Agriculture, industrie et commerce',
  'SA 3',
  '📚 Les activités économiques du Bénin : Agriculture, industrie et commerce

Le secteur primaire : moteur de l''économie béninoise employant plus de 60% de la population active. Cultures vivrières : maïs, manioc, igname, niébé, riz, sorgho. Cultures industrielles d''exportation : le coton (appelé l''or blanc, 1ère source de devises du pays plaçant le Bénin parmi les premiers producteurs africains), anacarde (noix de cajou), palmier à huile, ananas. Élevage bovin, ovin et caprin au Nord. Pêche maritime artisanale et continentale dans les lagunes (système traditionnel des acadjas sur le lac Nokoué). Le secteur secondaire : industrie embryonnaire dominée par l''agroalimentaire (huileries, égrainage du coton), la cimenterie (Onigbolo, CIMBENIN) et le textile (développement de la zone industrielle de Glo-Djigbé - GDIZ pour la transformation locale). Le secteur tertiaire : prépondérant grâce au Port Autonome de Cotonou (PAC), porte d''entrée maritime stratégique pour les pays de l''hinterland (Niger, Mali, Burkina Faso) et commerce de réexportation vers le géant voisin Nigeria. Poids considérable du secteur informel.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Les activités économiques du Bénin : Agriculture, industrie et commerce',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Les activités économiques du Bénin : Agriculture, industrie et commerce, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_histoire_geo_8',
  s.id,
  8,
  'Les défis de développement du Bénin et l''intégration sous-régionale',
  'SA 4',
  '📚 Les défis de développement du Bénin et l''intégration sous-régionale

Les contraintes majeures au développement durable : vulnérabilité aux chocs climatiques (inondations répétées, sécheresses), forte dépendance économique vis-à-vis du Nigeria (fluctuations de la monnaie Naira et fermeture périodique des frontières), déficit énergétique en voie de résorption, sous-emploi des diplômés et accès limité aux soins de santé de qualité. Stratégies et programmes de développement : investissements massifs dans les infrastructures routières, portuaires et énergétiques, modernisation de l''agriculture et promotion du tourisme patrimonial (musées d''Abomey et de Ouidah, parcs nationaux de la Pendjari et du W). L''intégration économique et diplomatique : appartenance active à l''Union Économique et Monétaire Ouest-Africaine (UEMOA) avec la monnaie commune Franc CFA, à la Communauté Économique des États de l''Afrique de l''Ouest (CEDEAO) favorisant la libre circulation des personnes et des biens, et à l''Union Africaine (UA). Rôle de la Zone de Libre-Échange Continentale Africaine (ZLECAf) pour dynamiser le commerce intra-africain.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Les défis de développement du Bénin et l''intégration sous-régionale',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Les défis de développement du Bénin et l''intégration sous-régionale, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'histoire_geo'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── FRANÇAIS BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_1',
  s.id,
  1,
  'Grammaire : Classes et fonctions grammaticales',
  'SA 1',
  '📚 Grammaire : Classes et fonctions grammaticales

Les classes grammaticales : mots variables (noms communs/propres, déterminants articles, possessifs, démonstratifs, indéfinis ; adjectifs qualificatifs ; pronoms personnels, relatifs, démonstratifs ; verbes) et mots invariables (adverbes, prépositions, conjonctions de coordination et de subordination, interjections). Les fonctions par rapport au verbe : sujet, complément d''objet direct (COD), complément d''objet indirect (COI), complément d''objet second (COS), compléments circonstanciels de temps, lieu, manière, cause, but, moyen. Fonctions par rapport au nom : épithète liée ou détachée (apposition), complément du nom. Attribut du sujet et attribut du COD.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Grammaire : Classes et fonctions grammaticales',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Grammaire : Classes et fonctions grammaticales, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_2',
  s.id,
  2,
  'La phrase complexe : Coordination, juxtaposition et subordination',
  'SA 1',
  '📚 La phrase complexe : Coordination, juxtaposition et subordination

Définition de la proposition : noyau verbal conjugué. Juxtaposition par signe de ponctuation faible (virgule, point-virgule, deux-points). Coordination par conjonction de coordination (mais, ou, et, donc, or, ni, car) ou adverbe de liaison. La subordination : proposition principale et proposition subordonnée. Les subordonnées relatives introduites par pronom relatif (qui, que, quoi, dont, où, lequel), ayant une fonction d''épithète de l''antécédent. Les subordonnées complétives (conjonctives pures en que, interrogatives indirectes, infinitives) compléments d''objet. Les subordonnées circonstancielles : de temps (quand, lorsque), de cause (parce que, puisque), de but (pour que, afin que + subjonctif), de conséquence (si bien que), de concession ou d''opposition (bien que, quoique + subjonctif).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — La phrase complexe : Coordination, juxtaposition et subordination',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de La phrase complexe : Coordination, juxtaposition et subordination, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_3',
  s.id,
  3,
  'Conjugaison : Modes et valeurs des temps',
  'SA 2',
  '📚 Conjugaison : Modes et valeurs des temps

Les modes personnels : indicatif (mode du réel et de la certitude), subjonctif (mode de l''incertitude, du souhait, du doute, de la nécessité), conditionnel (mode de l''hypothèse, de l''imaginaire ou de l''atténuation de politesse), impératif (mode de l''ordre, de la prière ou du conseil). Les temps de l''indicatif dans le récit : alternance imparfait (actions d''arrière-plan, descriptions, habitudes, actions non délimitées) et passé simple (actions de premier plan, ponctuelles, successives). Les temps composés et l''expression de l''antériorité. Règles d''accord du participe passé : employé sans auxiliaire (s''accorde comme un adjectif), employé avec l''auxiliaire être (s''accorde avec le sujet), employé avec l''auxiliaire avoir (s''accorde avec le COD seulement si celui-ci est placé avant le verbe). Verbes pronominaux.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Conjugaison : Modes et valeurs des temps',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Conjugaison : Modes et valeurs des temps, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_4',
  s.id,
  4,
  'Vocabulaire, formation des mots et figures de style',
  'SA 2',
  '📚 Vocabulaire, formation des mots et figures de style

Morphologie lexicale : radical, préfixation (modifie le sens : re-, dé-, in-, pré-), suffixation (modifie la classe grammaticale : -able, -ment, -tion). Familles de mots. Relations de sens : synonymie, antonymie, homonymie (homophones et homographes), paronymie. Champ lexical (mots liés à un même thème) vs champ sémantique (multiplicité de sens d''un même mot selon le contexte). Les figures de style au collège : comparaison (avec outil comparatif : comme, tel que, pareil à), métaphore (analogie directe sans outil de comparaison), personnification (attribuer un comportement humain à un objet ou animal), anaphore (répétition en début de phrase ou vers), hyperbole (exagération expressive), énumération et gradation.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Vocabulaire, formation des mots et figures de style',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Vocabulaire, formation des mots et figures de style, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_5',
  s.id,
  5,
  'Typologie textuelle : Récit, description et dialogue',
  'SA 3',
  '📚 Typologie textuelle : Récit, description et dialogue

Le texte narratif : schéma narratif quinaire (situation initiale stable, élément modificateur ou déclencheur, péripéties et rebondissements, dénouement ou élément d''équilibre, situation finale). Le schéma actantiel : sujet, quête, objet, destinateur, destinataire, adjuvants et opposants. Statut du narrateur : narrateur intérieur ou participant (je) vs narrateur extérieur (il/elle). Le texte descriptif : fonction documentaire, réaliste ou symbolique ; progression spatiale ; richesse des adjectifs qualificatifs et verbes de perception sensorielle. Le dialogue inséré dans le récit : disposition typographique (guillemets, tirets de réplique), verbes de parole (incises) et ponctuation expressive.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Typologie textuelle : Récit, description et dialogue',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Typologie textuelle : Récit, description et dialogue, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_6',
  s.id,
  6,
  'L''argumentation : Convaincre, persuader et débattre',
  'SA 3',
  '📚 L''argumentation : Convaincre, persuader et débattre

Structure d''un texte argumentatif : le thème abordé, la thèse défendue ou réfutée, la problématique. Les arguments : preuves logiques, morales, d''autorité ou d''expérience appuyant la thèse. Les exemples illustratifs : faits précis, données chiffrées, citations littéraires concrets qui donnent du poids aux arguments. Les connecteurs logiques d''organisation : d''abord, ensuite, de plus, en outre (addition) ; mais, cependant, néanmoins, en revanche (opposition) ; parce que, car, en effet (cause) ; donc, par conséquent, ainsi (conséquence) ; pour conclure, enfin. Stratégies de discours : convaincre par la raison et la logique rigoureuse ; persuader en touchant la sensibilité, l''émotion ou l''indignation du lecteur.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — L''argumentation : Convaincre, persuader et débattre',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de L''argumentation : Convaincre, persuader et débattre, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_7',
  s.id,
  7,
  'Littérature béninoise et africaine francophone',
  'SA 4',
  '📚 Littérature béninoise et africaine francophone

Richesse de la littérature orale africaine : contes initiatiques, légendes, mythes d''origine, proverbes et panégyriques claniques (Oriki au pays yoruba / nago). Les grands pionniers de la littérature béninoise : Paulin Joachim (poète engagé et journaliste), Jean Pliya (dramaturge et conteur, auteur de Kondo le Requin retraçant la résistance de Béhanzin, et La Secrétaire particulière dénonçant la corruption administrative), Olympe Bhêly-Quenum (Un piège sans fin, Le chant du lac explorant croyances et modernité), Félix Couchoro, Florent Couao-Zotti. Thématiques majeures : affirmation de l''identité culturelle noire, choc des cultures entre tradition et modernisme occidental, critique des abus de pouvoir et plaidoyer pour l''éducation et la solidarité.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Littérature béninoise et africaine francophone',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Littérature béninoise et africaine francophone, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_francais_8',
  s.id,
  8,
  'Expression écrite et communication orale',
  'SA 4',
  '📚 Expression écrite et communication orale

Méthodologie de la rédaction et de la composition française au BEPC : lecture analytique du sujet, repérage des mots de consigne, recherche des idées au brouillon, élaboration d''un plan détaillé et rédaction soignée. Structure canonique : introduction (mise en contexte, énonciation du sujet, annonce du plan), développement en paragraphes distincts reliés par des transitions logiques, conclusion (bilan des idées et ouverture finale). Maîtrise des registres de langue : familier, courant, soutenu. Communication orale : posture physique, regard, articulation, modulation vocale, écoute active et respect du temps de parole dans un débat contradictoire.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Expression écrite et communication orale',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Expression écrite et communication orale, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'francais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── ANGLAIS BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_1',
  s.id,
  1,
  'Grammar Basics: Present and Past Tenses',
  'SA 1',
  '📚 Grammar Basics: Present and Past Tenses

Simple Present: habit, general truth, routine (third person singular takes -s or -es). Present Continuous (am/is/are + verb-ing): ongoing actions at the moment of speaking or planned future events. Stative verbs that do not take continuous forms (know, understand, like, believe). Simple Past: regular verbs ending in -ed, common irregular verbs (go/went, see/saw, buy/bought). Past Continuous (was/were + verb-ing): past action in progress interrupted by a sudden simple past event with ''when'' or simultaneous past actions with ''while''.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Grammar Basics: Present and Past Tenses',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Grammar Basics: Present and Past Tenses, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_2',
  s.id,
  2,
  'Perfect Tenses and Expressing the Future',
  'SA 1',
  '📚 Perfect Tenses and Expressing the Future

Present Perfect (have/has + past participle): past actions with clear results or relevance in the present, unfinished time periods, or life experiences. Use of time markers: already, just, yet, ever, never, since (starting point), for (duration). Future forms: will + bare infinitive (spontaneous decisions, predictions), be going to + infinitive (prior intentions, plans, evident facts based on current signs), Present Continuous for confirmed arrangements.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Perfect Tenses and Expressing the Future',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Perfect Tenses and Expressing the Future, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_3',
  s.id,
  3,
  'Modal Auxiliaries and Conditionals',
  'SA 2',
  '📚 Modal Auxiliaries and Conditionals

Modal verbs (must, can, could, may, might, should, ought to, have to): obligation, physical or mental ability, polite requests, permission, probability and advice. Negative forms and nuances (mustn''t for strict prohibition vs don''t have to for absence of obligation). Conditionals: Zero Conditional (If + present, present) for scientific facts; First Conditional (If + present, will + verb) for likely future conditions and outcomes; Second Conditional (If + past simple, would + verb) for imaginary, hypothetical or advice situations (''If I were you, I would study harder'').

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Modal Auxiliaries and Conditionals',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Modal Auxiliaries and Conditionals, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_4',
  s.id,
  4,
  'Passive Voice and Reported Speech',
  'SA 2',
  '📚 Passive Voice and Reported Speech

Passive Voice formation: subject + appropriate tense of auxiliary ''be'' + past participle of the main verb (+ by + agent). Uses: when the action or the receiver of the action is more significant than the doer, or when the agent is unknown. Reported Speech (Indirect Speech): changes in verb tenses (present simple becomes past simple, present continuous becomes past continuous, will becomes would), changes in pronouns, possessive adjectives and time/place adverbs (today -> that day, tomorrow -> the next day, yesterday -> the day before, here -> there).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Passive Voice and Reported Speech',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Passive Voice and Reported Speech, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_5',
  s.id,
  5,
  'Reading Comprehension and Text Analysis',
  'SA 3',
  '📚 Reading Comprehension and Text Analysis

Techniques for reading tests in the BEPC exam: skimming (rapid reading to grasp the general gist, main idea and topic) and scanning (searching rapidly for specific details, figures, names or keywords). Identifying paragraph topic sentences. Using context clues and roots/prefixes to deduce the meaning of unfamiliar words without a dictionary. Formulating clear, grammatically accurate answers using full English sentences.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Reading Comprehension and Text Analysis',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Reading Comprehension and Text Analysis, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_6',
  s.id,
  6,
  'Vocabulary: Health, Environment, Education and Technology',
  'SA 3',
  '📚 Vocabulary: Health, Environment, Education and Technology

Lexical fields related to everyday and social life in Benin: health and diseases (malaria prevention, hygiene, nutrition, clean water), environmental protection (deforestation, plastic pollution, bush fires, climate change, recycling), education and youth (school facilities, examinations, hard work, success, gender equality), technology and modern communication (smartphones, computers, internet, social media benefits and dangers).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Vocabulary: Health, Environment, Education and Technology',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Vocabulary: Health, Environment, Education and Technology, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_7',
  s.id,
  7,
  'Writing Skills: Guided Essays, Paragraphs and Formal Letters',
  'SA 4',
  '📚 Writing Skills: Guided Essays, Paragraphs and Formal Letters

Paragraph organization: clear topic sentence stating the focal point, supporting sentences providing explanations, evidence and illustrations, concluding sentence. Linking words: addition (and, moreover, furthermore), contrast (but, however, although, on the one hand... on the other hand), cause and effect (because, since, therefore, as a result). Format of a formal letter vs an informal friendly letter: addresses, date, salutations, body, and closing formulas.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Writing Skills: Guided Essays, Paragraphs and Formal Letters',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Writing Skills: Guided Essays, Paragraphs and Formal Letters, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_anglais_8',
  s.id,
  8,
  'Communication in English and Culture of English-Speaking Countries',
  'SA 4',
  '📚 Communication in English and Culture of English-Speaking Countries

Everyday dialogues and functional English: greetings, introducing oneself and others, asking for and giving directions, expressing opinions, polite agreement and disagreement. English as an international lingua franca and regional integration in West Africa (neighboring Nigeria and Ghana, member states of ECOWAS). Cultural awareness: traditions, flags, holidays and values in the UK, USA and Anglophone Africa.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Communication in English and Culture of English-Speaking Countries',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Communication in English and Culture of English-Speaking Countries, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'anglais'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

-- ─── LECTURE/DICTÉE BREVET (8 chapitres complets) ───

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_1',
  s.id,
  1,
  'Techniques de lecture expressive et compréhension littéraire',
  'SA 1',
  '📚 Techniques de lecture expressive et compréhension littéraire

Objectifs de la lecture au collège : articulation nette, respect scrupuleux de la ponctuation, débit adapté, intonation expressive traduisant les émotions des personnages. Stratégies de compréhension : identification du thème central, des idées secondaires et de la structure du texte. Reconnaissance des indices textuels : cadre spatio-temporel, intentions de l''auteur, tonalité dominante (tragique, comique, lyrique, polémique).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Techniques de lecture expressive et compréhension littéraire',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Techniques de lecture expressive et compréhension littéraire, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_2',
  s.id,
  2,
  'Orthographe d''usage, consonnes doubles et accents',
  'SA 1',
  '📚 Orthographe d''usage, consonnes doubles et accents

Règles d''écriture des consonnes doubles : mots commençant par ap-, ac-, af-, ef-, of-, op- (exceptions : apercevoir, apaiser, aplanir). Les accents sur la lettre e : accent aigu (é) en syllabe ouverte, accent grave (è) ou circonflexe (ê) en syllabe fermée ou devant consonne muette. Emploi du tréma (ë, ï) pour marquer la prononciation séparée de deux voyelles adjacentes (ex: maïs, coïncidence). La cédille sous la lettre c devant a, o, u pour conserver le son [s] (ex: leçon, aperçu).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Orthographe d''usage, consonnes doubles et accents',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Orthographe d''usage, consonnes doubles et accents, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_3',
  s.id,
  3,
  'Accords grammaticaux : Sujet, verbe et groupe nominal',
  'SA 2',
  '📚 Accords grammaticaux : Sujet, verbe et groupe nominal

Accord en nombre et en personne du verbe avec son sujet : sujet inversé, sujets multiples coordonnés, sujet collectif (une foule de gens, la majorité). Accord des adjectifs qualificatifs : règles générales de féminin et de pluriel, adjectifs de couleur simples (s''accordent : des robes bleues) vs adjectifs de couleur composés ou dérivés de noms de fruits/fleurs (invariables : des chemises bleu marine, des rubans marron). Accord du participe passé avec être, avoir et verbes pronominaux.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Accords grammaticaux : Sujet, verbe et groupe nominal',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Accords grammaticaux : Sujet, verbe et groupe nominal, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_4',
  s.id,
  4,
  'Les homophones grammaticaux pièges',
  'SA 2',
  '📚 Les homophones grammaticaux pièges

Méthode de substitution pour ne plus commettre de fautes : a (verbe avoir, remplacer par avait) vs à (préposition invariable) ; et (conjonction d''addition, remplacer par et puis) vs est (verbe être, remplacer par était) ; son (adjectif possessif, remplacer par mon) vs sont (verbe être, remplacer par étaient) ; on (pronom personnel sujet, remplacer par il) vs ont (verbe avoir, remplacer par avaient) ; ou (choix, remplacer par ou bien) vs où (lieu ou temps) ; ce/se ; ces/ses/c''est/s''est ; leur (pronom invariable devant un verbe) vs leur/leurs (déterminant s''accordant avec le nom).

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Les homophones grammaticaux pièges',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Les homophones grammaticaux pièges, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_5',
  s.id,
  5,
  'Ponctuation, majuscules et structure textuelle',
  'SA 3',
  '📚 Ponctuation, majuscules et structure textuelle

Rôle de la ponctuation : délimitation des phrases et clarification du sens. La ponctuation de fin de phrase : point, point d''interrogation, point d''exclamation, points de suspension. La ponctuation interne : la virgule (isole les compléments circonstanciels déplacés, les apostrophes et les propositions juxtaposées), le point-virgule (sépare deux propositions liées par le sens), les deux-points (annoncent une énumération, une explication ou un dialogue). Emploi obligatoire des majuscules : premier mot d''une phrase, noms propres, noms de peuples et nationalités utilisés comme substantifs.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Ponctuation, majuscules et structure textuelle',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Ponctuation, majuscules et structure textuelle, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_6',
  s.id,
  6,
  'Vocabulaire en contexte et questions de compréhension de dictée',
  'SA 3',
  '📚 Vocabulaire en contexte et questions de compréhension de dictée

Méthode pour répondre aux questions de compréhension associées à la dictée d''examen : explication d''un mot ou d''une expression selon son contexte d''apparition, identification des synonymes et des antonymes, analyse de la valeur d''un temps verbal employé dans le texte, justification d''un accord grammatical complexe. Formulation de réponses complètes et soignées sans rature.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Vocabulaire en contexte et questions de compréhension de dictée',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Vocabulaire en contexte et questions de compréhension de dictée, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_7',
  s.id,
  7,
  'Enrichissement lexical, néologismes et emprunts',
  'SA 4',
  '📚 Enrichissement lexical, néologismes et emprunts

Formation des mots savants : racines grecques et latines courantes dans la langue française et scientifique (bio, chrono, gé, hydro, télé, phono, graphie, logie). Mots composés avec ou sans trait d''union. Emprunts linguistiques et termes spécifiques du français d''Afrique et du Bénin acceptés par la francophonie. Polysémie et sens figuré des expressions usuelles.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Enrichissement lexical, néologismes et emprunts',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Enrichissement lexical, néologismes et emprunts, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

insert into public.chapters (slug, subject_id, num, title, sa_label, cours, exemple_titre, exemple_enonce, exemple_solution, exercice_consigne, exercice_question, exercice_type, exercice_options, exercice_correct_option, exercice_explication)
select
  'brevet_lecture_dictee_8',
  s.id,
  8,
  'Entraînement intensif à l''épreuve de dictée du BEPC',
  'SA 4',
  '📚 Entraînement intensif à l''épreuve de dictée du BEPC

Déroulement standard de l''épreuve de dictée : 1ère lecture magistrale par le surveillant pour saisir le sens global du texte ; 2ème étape de dictée phrase par phrase avec annonce de la ponctuation ; 3ème lecture de relecture collective. Méthode d''auto-relecture en 4 balayages systématiques : 1. Balayage des verbes et accords avec les sujets ; 2. Balayage des groupes nominaux (déterminants, noms, adjectifs) ; 3. Vérification des homophones grammaticaux ; 4. Vérification de la ponctuation, accents et majuscules.

Ce chapitre fait partie intégrante du programme officiel béninois du Brevet (BEPC/3ème).',
  'Exemple résolu — Entraînement intensif à l''épreuve de dictée du BEPC',
  'Application guidée des compétences de ce chapitre dans le cadre des examens nationaux.',
  'Résolution méthodologique : identifier les données clés, mobiliser la propriété requise et rédiger avec clarté.',
  'Question 1 — QCM de compréhension',
  'Sur la notion de Entraînement intensif à l''épreuve de dictée du BEPC, quel principe fondamental le programme béninois met-il en avant ?',
  'qcm',
  '["a) Mémoriser sans justification","b) Maîtriser le cours et appliquer rigoureusement la méthode officielle","c) Se fier uniquement à l''intuition","d) Ignorer les lois du référentiel"]'::jsonb,
  'b',
  'La maîtrise des notions clés et la rigueur dans la démarche assurent la note maximale aux examens nationaux.'
from public.subjects s
where s.niveau_code = 'brevet' and s.serie_code is null and s.code = 'lecture_dictee'
on conflict (slug) do update set
  title = excluded.title,
  sa_label = excluded.sa_label,
  cours = excluded.cours,
  num = excluded.num,
  exemple_titre = excluded.exemple_titre,
  exemple_enonce = excluded.exemple_enonce,
  exemple_solution = excluded.exemple_solution;

commit;

-- ============================================================
-- Note : Ce seed couvre les matières principales.
-- Les autres matières (Anglais, Économie, Comptabilité, 
-- Physique-Chimie-Technologie Brevet, Histoire-Géo Brevet, etc.)
-- seront générées dynamiquement par Gemini au premier accès.
-- ============================================================
