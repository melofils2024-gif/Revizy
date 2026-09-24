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
-- BREVET — MATHÉMATIQUES (7 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_1',s.id,1,'Calcul littéral et équations du premier degré','SA 1',
'📚 CALCUL LITTÉRAL ET ÉQUATIONS DU 1ER DEGRÉ

📌 1. Expressions littérales
Réduire : 3x + 2x = 5x ; 4a − a = 3a.
Développer : a(b+c) = ab + ac ; (a+b)(c+d) = ac + ad + bc + bd.
Factoriser : ab + ac = a(b+c).
Identités remarquables :
• (a+b)² = a² + 2ab + b²
• (a−b)² = a² − 2ab + b²
• (a+b)(a−b) = a² − b²

📌 2. Équation du premier degré ax + b = 0
Résolution : ax = −b → x = −b/a (si a ≠ 0).
Équation-produit : A×B = 0 ⟺ A = 0 ou B = 0.

📌 3. Inégalités
Résolution : comme une équation, sauf si on multiplie/divise par un négatif → inversion du signe.

📌 4. Problèmes
Étapes : définir l''inconnue, traduire en équation, résoudre, vérifier, conclure.',
'Exemple — Résolution d''équation',
'Résoudre : 3(2x − 1) = 2x + 9.',
'Développer : 6x − 3 = 2x + 9.
Isoler x : 6x − 2x = 9 + 3 → 4x = 12 → x = 3.
Vérification : 3(2×3−1) = 3×5 = 15 et 2×3+9 = 15. ✓',
'QCM — Équations',
'La solution de l''équation 2x + 4 = 10 est :',
'qcm',
'["a) x = 2","b) x = 3","c) x = 7","d) x = 4"]'::jsonb,
'b',
'2x + 4 = 10 → 2x = 6 → x = 3. Vérif : 2×3 + 4 = 10 ✓.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_2',s.id,2,'Systèmes d''équations','SA 2',
'📚 SYSTÈMES D''ÉQUATIONS

📌 1. Système 2×2
{ a₁x + b₁y = c₁
{ a₂x + b₂y = c₂

📌 2. Méthode par substitution
1. Exprimer une inconnue en fonction de l''autre dans la 1ère équation.
2. Substituer dans la 2ème.
3. Résoudre l''équation à une inconnue.
4. Trouver la 2ème inconnue.

📌 3. Méthode par combinaison (addition/soustraction)
Multiplier chaque équation par un coefficient pour éliminer une inconnue.

📌 4. Interprétation graphique
Chaque équation = une droite dans le plan.
Système avec 1 solution : droites sécantes.
Aucune solution : droites parallèles. Infinité : droites confondues.',
'Exemple — Substitution',
'Résoudre : { x + y = 5 ; { 2x − y = 1.',
'De la 1ère : x = 5 − y.
Substituer : 2(5−y) − y = 1 → 10 − 2y − y = 1 → 3y = 9 → y = 3.
Donc x = 5 − 3 = 2.
Solution : (x; y) = (2; 3).',
'QCM — Systèmes',
'La solution du système { x + y = 6 ; 2x + y = 9 est :',
'qcm',
'["a) (2;4)","b) (3;3)","c) (4;2)","d) (1;5)"]'::jsonb,
'b',
'Soustraction : (2x+y) − (x+y) = 9−6 → x = 3. Donc y = 6−3 = 3. Solution (3;3). Vérif : 3+3=6 ✓ et 6+3=9 ✓.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_3',s.id,3,'Fonctions linéaires et affines','SA 3',
'📚 FONCTIONS LINÉAIRES ET AFFINES

📌 1. Fonction linéaire f(x) = ax
Représentation : droite passant par l''origine O(0;0).
a = coefficient de proportionnalité (= pente = coefficient directeur).
a > 0 : croissante ; a < 0 : décroissante.

📌 2. Fonction affine f(x) = ax + b
Représentation : droite quelconque.
a = coefficient directeur (pente) ; b = ordonnée à l''origine.
Pour tracer : deux points suffisent (calculer f(0) et f(1)).

📌 3. Lecture graphique
Pente : a = (y₂−y₁)/(x₂−x₁) entre deux points de la droite.
Intersection avec l''axe y : b = f(0).
Intersection avec l''axe x : f(x) = 0 → x = −b/a.

📌 4. Application : tableau de valeurs
Pour f(x) = 2x + 1 : f(0)=1, f(1)=3, f(2)=5, f(−1)=−1.',
'Exemple — Tracer une droite',
'Tracer f(x) = −x + 4. Trouver l''intersection avec les axes.',
'Axe y : f(0) = 4 → point (0;4).
Axe x : −x + 4 = 0 → x = 4 → point (4;0).
La droite passe par (0;4) et (4;0), de pente a = −1 (décroissante).',
'Vrai ou Faux',
'La fonction f(x) = 3x est une fonction affine avec b = 0.',
'vf',
'["Vrai","Faux"]'::jsonb,
'vrai',
'VRAI. f(x) = 3x est bien une fonction affine f(x) = ax + b avec a = 3 et b = 0. C''est aussi une fonction linéaire car b = 0. Toute fonction linéaire est un cas particulier de fonction affine.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_4',s.id,4,'Géométrie plane : triangles, cercles, transformations','SA 2',
'📚 GÉOMÉTRIE PLANE

📌 1. Triangles
Somme des angles : 180°.
Triangle rectangle : angle droit, hypoténuse opposée à l''angle droit.
Théorème de Pythagore : AC² = AB² + BC² (dans un triangle rectangle en B).
Converse : si AC² = AB² + BC² alors l''angle en B est droit.

📌 2. Théorème de Thalès
Si (DE) ∥ (BC) et D ∈ [AB], E ∈ [AC] alors : AD/AB = AE/AC = DE/BC.

📌 3. Cercles
Cercle de centre O, rayon R.
Périmètre : C = 2πR ; Aire : A = πR².
Angle inscrit = ½ angle au centre interceptant le même arc.

📌 4. Transformations
Symétrie axiale : conservation des longueurs et angles.
Translation, rotation (angle, sens, centre).
Homothétie de rapport k : longueurs multipliées par |k|.',
'Exemple — Pythagore',
'Triangle ABC rectangle en A, AB = 6 cm, AC = 8 cm. Calculer BC.',
'BC² = AB² + AC² = 6² + 8² = 36 + 64 = 100.
BC = √100 = 10 cm.',
'QCM — Géométrie',
'Dans un triangle rectangle de cathètes 5 cm et 12 cm, l''hypoténuse mesure :',
'qcm',
'["a) 17 cm","b) 13 cm","c) 15 cm","d) 11 cm"]'::jsonb,
'b',
'h² = 5² + 12² = 25 + 144 = 169. h = √169 = 13 cm. C''est un triangle remarquable (5-12-13).'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_5',s.id,5,'Statistiques et probabilités','SA 3',
'📚 STATISTIQUES ET PROBABILITÉS

📌 1. Statistiques descriptives
Effectif, fréquence, fréquence cumulée.
Moyenne : x̄ = Σ(nᵢxᵢ)/N.
Médiane : valeur qui partage la série en deux moitiés.
Mode : valeur la plus fréquente.
Étendue = valeur max − valeur min.

📌 2. Représentations graphiques
Diagramme en barres, en secteurs (camembert), histogramme, polygone des fréquences.

📌 3. Probabilités (vocabulaire)
Expérience aléatoire, univers Ω, événement A.
Probabilité : P(A) = nombre de cas favorables / nombre de cas total (équiprobabilité).
P(Ā) = 1 − P(A).
P(A∪B) = P(A) + P(B) − P(A∩B).
Si A et B incompatibles (A∩B = ∅) : P(A∪B) = P(A) + P(B).',
'Exemple — Calcul de probabilité',
'Un sac contient 3 billes rouges, 4 bleues, 3 vertes (10 en tout). On tire une bille au hasard. Calculer P(bleue) et P(non bleue).',
'P(bleue) = 4/10 = 0,4.
P(non bleue) = 1 − 0,4 = 0,6.
Ou directement : P(non bleue) = (3+3)/10 = 6/10 = 0,6.',
'QCM — Probabilités',
'On lance un dé équilibré à 6 faces. La probabilité d''obtenir un nombre pair est :',
'qcm',
'["a) 1/6","b) 1/3","c) 1/2","d) 2/3"]'::jsonb,
'c',
'Nombres pairs : {2, 4, 6} → 3 cas favorables sur 6 possibles. P = 3/6 = 1/2.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_6',s.id,6,'Théorème de Pythagore et trigonométrie','SA 2',
'📚 PYTHAGORE ET TRIGONOMÉTRIE

📌 1. Théorème de Pythagore (rappel)
Dans un triangle rectangle en C : AB² = AC² + BC².

📌 2. Trigonométrie dans le triangle rectangle
Angle aigu α dans un triangle rectangle.
• sin α = côté opposé / hypoténuse
• cos α = côté adjacent / hypoténuse
• tan α = côté opposé / côté adjacent
Mnémotechnique : SOH-CAH-TOA.
Valeurs remarquables :
sin 30° = 1/2, cos 30° = √3/2, tan 30° = 1/√3
sin 45° = cos 45° = √2/2, tan 45° = 1
sin 60° = √3/2, cos 60° = 1/2, tan 60° = √3.',
'Exemple — Calcul trigonométrique',
'Dans un triangle rectangle, l''angle α = 35° et l''hypoténuse = 10 cm. Calculer le côté opposé à α.',
'sin α = côté opposé / hypoténuse.
côté opposé = 10 × sin 35° ≈ 10 × 0,574 ≈ 5,74 cm.',
'Vrai ou Faux',
'Dans un triangle rectangle, sin²α + cos²α = 1 pour tout angle α.',
'vf',
'["Vrai","Faux"]'::jsonb,
'vrai',
'VRAI. C''est l''identité pythagoricienne fondamentale : sin²α + cos²α = 1. Elle découle directement du théorème de Pythagore appliqué au triangle trigonométrique unitaire.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_maths_7',s.id,7,'Volumes et aires','SA 3',
'📚 VOLUMES ET AIRES

📌 1. Périmètres et aires (figures planes)
Carré (côté a) : P = 4a, A = a².
Rectangle (l×L) : P = 2(l+L), A = l×L.
Triangle (base b, hauteur h) : A = ½bh.
Cercle (rayon R) : C = 2πR, A = πR².
Trapèze (bases a, b, hauteur h) : A = ½(a+b)h.

📌 2. Volumes (solides)
Cube (arête a) : V = a³, Slat = 6a².
Parallélépipède (l,L,h) : V = l×L×h.
Cylindre (R, h) : V = πR²h, Slat = 2πRh.
Cône (R, h) : V = ⅓πR²h.
Pyramide (B = aire base, h) : V = ⅓Bh.
Sphère (R) : V = 4/3πR³, S = 4πR².

📌 3. Conversions
1 m² = 10 000 cm² ; 1 m³ = 1 000 000 cm³ = 1 000 L.',
'Exemple — Volume d''un cylindre',
'Un cylindre a un rayon de 3 cm et une hauteur de 10 cm. Calculer son volume.',
'V = πR²h = π × 3² × 10 = 90π ≈ 282,7 cm³.',
'QCM — Volumes',
'L''aire d''un disque de rayon 5 cm est :',
'qcm',
'["a) 10π cm²","b) 25π cm²","c) 50π cm²","d) 5π cm²"]'::jsonb,
'b',
'A = πR² = π × 5² = 25π cm² ≈ 78,5 cm². Ne pas confondre avec le périmètre C = 2πR = 10π cm.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='mathematiques'
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- BREVET — SVT (6 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_svt_1',s.id,1,'Cellule et organisation du vivant','SA 1',
'📚 CELLULE ET ORGANISATION DU VIVANT

📌 1. La cellule — unité du vivant
Toute matière vivante est composée de cellules.
• Cellule animale : membrane plasmique, cytoplasme, noyau, mitochondries, ribosomes.
• Cellule végétale : + paroi cellulosique, chloroplastes, vacuole.
• Procaryote (bactérie) : pas de noyau membranaire.

📌 2. Fonctions cellulaires
Nutrition : mitochondries → respiration (ATP). Chloroplastes → photosynthèse.
Reproduction : mitose (cellules somatiques) → 2 cellules identiques.
Communication : récepteurs membranaires, signaux chimiques.

📌 3. Niveaux d''organisation
Cellule → tissu → organe → système → organisme.
Ex : cellules musculaires → tissu musculaire → muscle → appareil locomoteur.

📌 4. Diversité du vivant
Règnes : animaux, végétaux, champignons, protistes, bactéries.
Classification phylogénétique : basée sur les caractères homologues.',
'Exemple — Comparer cellule animale et végétale',
'Donner 3 différences entre une cellule animale et une cellule végétale.',
'1. Paroi cellulosique : présente chez la végétale, absente chez l''animale.
2. Chloroplastes : présents chez la végétale (photosynthèse), absents chez l''animale.
3. Grande vacuole centrale : chez la végétale, petites ou absentes chez l''animale.',
'QCM — Cellule',
'L''organite responsable de la photosynthèse dans la cellule végétale est :',
'qcm',
'["a) La mitochondrie","b) Le noyau","c) Le chloroplaste","d) Le ribosome"]'::jsonb,
'c',
'Les chloroplastes sont les organites spécifiques des cellules végétales qui réalisent la photosynthèse (transformation de la lumière en énergie chimique). Les mitochondries font la respiration cellulaire (les deux types de cellules en ont).'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_svt_2',s.id,2,'Digestion et nutrition','SA 2',
'📚 DIGESTION ET NUTRITION

📌 1. Le tube digestif
Bouche → œsophage → estomac → intestin grêle → gros intestin → rectum → anus.
Organes annexes : foie (bile), pancréas (suc pancréatique), glandes salivaires.

📌 2. Digestion mécanique et chimique
Mécanique : mastication, brassage gastrique → réduction en petits morceaux.
Chimique : enzymes digestives qui découpent les molécules.
• Amylase salivaire : amidon → maltose.
• Pepsine (estomac) : protéines → peptides.
• Lipase (intestin) : lipides → acides gras + glycérol.

📌 3. Absorption intestinale
L''intestin grêle absorbe les nutriments via les villosités intestinales (surface ×500).
Nutriments → sang → cellules.
Eau absorbée au niveau du gros intestin.

📌 4. Alimentation équilibrée
Glucides (énergie rapide), lipides (énergie longue terme), protéines (construction), vitamines, sels minéraux, eau.',
'Exemple — Rôle des enzymes',
'Pourquoi une personne qui avale rapidement sans mâcher aura-t-elle plus de difficultés à digérer ?',
'La mastication réalise la digestion mécanique : elle broie les aliments et les mélange à la salive (amylase salivaire). En augmentant la surface de contact, elle facilite l''action des enzymes dans l''estomac et l''intestin. Sans mastication, les morceaux sont trop gros → les enzymes travaillent moins efficacement → digestion incomplète.',
'Vrai ou Faux',
'La digestion chimique commence dans l''intestin grêle.',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. La digestion chimique commence dans la bouche grâce à l''amylase salivaire (qui hydrolyse l''amidon). Elle continue dans l''estomac (pepsine sur les protéines) avant l''intestin grêle.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='svt'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_svt_3',s.id,3,'Respiration et circulation sanguine','SA 3',
'📚 RESPIRATION ET CIRCULATION SANGUINE

📌 1. La respiration
Inspiration : muscles intercostaux + diaphragme se contractent → poumons se dilatent → air entre.
Expiration : relâchement → poumons se compriment → air sort.
Échanges gazeux dans les alvéoles pulmonaires : O₂ passe dans le sang, CO₂ en sort.
Cellule : O₂ + glucose → CO₂ + H₂O + énergie (ATP).

📌 2. La circulation sanguine
Petite circulation (pulmonaire) : cœur → poumons → cœur.
Grande circulation (systémique) : cœur → organes → cœur.
Cœur : 4 cavités (2 oreillettes + 2 ventricules), 4 valvules.
Sang artériel (rouge) : riche en O₂. Sang veineux (sombre) : riche en CO₂.

📌 3. Le sang
Plasma (eau + protéines + nutriments).
Globules rouges/hématies (transportent O₂ via hémoglobine).
Globules blancs/leucocytes (défense immunitaire).
Plaquettes (coagulation).

📌 4. Hygiène cardiovasculaire
Tabac, sédentarité, alimentation grasse → risques : athérosclérose, infarctus, AVC.
Exercice physique, alimentation équilibrée, non-tabagisme → protection.',
'Exemple — Trajet du sang',
'Décrire le trajet d''un globule rouge de l''oreillette droite jusqu''aux poumons.',
'Oreillette droite → ventricule droit (contraction du cœur droit) → artère pulmonaire → poumons (échanges gazeux dans les alvéoles : CO₂ libéré, O₂ capté) → veines pulmonaires → oreillette gauche.',
'QCM — Circulation',
'Le sang qui sort du ventricule gauche du cœur est :',
'qcm',
'["a) Veineux, pauvre en O₂","b) Artériel, riche en O₂","c) Oxygéné, dirigé vers les poumons","d) Désoxygéné, dirigé vers les organes"]'::jsonb,
'b',
'Le ventricule gauche reçoit le sang oxygéné venant des poumons et le propulse dans l''aorte vers tous les organes. Ce sang artériel est riche en O₂. Le ventricule droit, lui, envoie le sang veineux vers les poumons.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='svt'
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- BREVET — FRANÇAIS (4 chapitres)
-- ═══════════════════════════════════════════════════════════════════

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_fr_1',s.id,1,'Lecture et compréhension de texte','SA 1',
'📚 LECTURE ET COMPRÉHENSION DE TEXTE

📌 1. Types de textes
Narratif : raconte des événements (roman, nouvelle, conte).
Descriptif : décrit un lieu, une personne, un objet.
Argumentatif : défend une thèse avec des arguments.
Explicatif/informatif : explique un phénomène.
Injonctif : donne des ordres, des consignes.

📌 2. Stratégies de lecture
1. Lire le titre et repérer l''auteur.
2. Lire une première fois rapidement (idée générale).
3. Relire attentivement en soulignant les mots clés.
4. Répondre aux questions en citant le texte.

📌 3. Questions de compréhension
• Reformulation : « D''après le texte… »
• Explication : « Que signifie l''expression… ? »
• Interprétation : « Pourquoi l''auteur dit-il… ? »

📌 4. Champ lexical
Ensemble de mots liés à un même thème.
Ex : champ lexical de la guerre → bataille, soldat, arme, victoire, défaite.',
'Exemple — Analyser un texte court',
'Texte : « Le soleil se couchait sur la savane béninoise, teintant le ciel d''or et de pourpre. Les oiseaux rentraient au bercail. » Identifier le type et le champ lexical dominant.',
'Type de texte : descriptif (description d''un paysage).
Champ lexical de la nature : soleil, savane, ciel, or, pourpre, oiseaux.
Champ lexical du soir/coucher : se couchait, teintant, rentraient.
Registre : lyrique (beauté évoquée avec des termes mélioratifs).',
'QCM — Types de textes',
'Un texte qui présente les arguments pour et contre le port du casque à moto est de type :',
'qcm',
'["a) Narratif","b) Descriptif","c) Argumentatif","d) Injonctif"]'::jsonb,
'c',
'Un texte qui défend des thèses et utilise des arguments est de type argumentatif. Il vise à convaincre ou à persuader le lecteur d''adopter un point de vue.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='francais'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_fr_2',s.id,2,'Grammaire : nature et fonction, conjugaison','SA 2',
'📚 GRAMMAIRE : NATURE, FONCTION, CONJUGAISON

📌 1. Nature des mots (classe grammaticale)
Nom, pronom, déterminant (article, adj. possessif/démonstratif), adjectif qualificatif, verbe, adverbe, préposition, conjonction (coordination/subordination), interjection.

📌 2. Fonctions grammaticales
Sujet (qui fait l''action), prédicat/verbe, COD (sans préposition), COI (avec à/de), complément circonstanciel (lieu, temps, manière…), attribut du sujet (après être, paraître…), épithète (adj. qualifiant un nom).

📌 3. Conjugaison — temps essentiels
Indicatif : présent, imparfait, passé composé, passé simple, futur simple, conditionnel présent.
Subjonctif présent : que je sois, que tu fasses…
Impératif présent : mange ! finissons !
Règle accord participe passé avec être : accord avec le sujet.
Avec avoir : accord avec le COD si placé avant.

📌 4. Types et formes de phrases
Types : déclarative, interrogative, impérative, exclamative.
Formes : affirmative/négative, active/passive, personnelle/impersonnelle.',
'Exemple — Analyse grammaticale',
'Analyser : « Les enfants ont lu attentivement ce beau livre. »',
'Les (déterminant article défini pluriel) enfants (nom commun, sujet) ont lu (verbe lire, passé composé, 3ème pers. plur.) attentivement (adverbe de manière) ce (déterminant démonstratif) beau (adj. qualificatif épithète) livre (nom commun, COD).',
'QCM — Grammaire',
'Dans la phrase « Marie mange une pomme », le COD est :',
'qcm',
'["a) Marie","b) mange","c) une pomme","d) Il n''y a pas de COD"]'::jsonb,
'c',
'Le COD répond à la question « Qui/quoi ? » posée après le verbe sans préposition. Marie mange quoi ? → une pomme. C''est le COD. Marie est le sujet.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='francais'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_fr_3',s.id,3,'Orthographe et vocabulaire','SA 3',
'📚 ORTHOGRAPHE ET VOCABULAIRE

📌 1. Orthographe grammaticale
Accord sujet-verbe : le verbe s''accorde en nombre et personne.
Accord du nom et de l''adjectif : en genre et nombre.
Homophones : a/à, et/est, son/sont, ou/où, ce/se, leur/leurs.

📌 2. Homophones courants
a (avoir) vs à (préposition) : remplacer par « avait » pour tester.
et (conjonction) vs est (être) : remplacer par « était ».
son (possessif) vs sont (être) : remplacer par « était/étaient ».

📌 3. Vocabulaire — formation des mots
Préfixes : re-(répétition), dé-(négation), in-/im-(négation), pré-(avant).
Suffixes : -tion (action), -eur (agent), -able (possibilité), -ment (adverbe).
Synonymes, antonymes, paronymes (mots proches mais différents).

📌 4. Registres de langue
Familier, courant, soutenu. Adapter le registre au contexte.',
'Exemple — Homophones',
'Compléter : « ___ frère ___ parti, et il n''___ pas encore rentré. »',
'Son frère est parti, et il n''a pas encore rentré.
« Son » = possessif (son frère). « est » = verbe être (remplacer par « était » : était parti ✓). « a » = verbe avoir (remplacer par « avait » : n''avait pas ✓).',
'Vrai ou Faux',
'Le mot « innovation » est formé du préfixe « in- » (négation) + radical « novation ».',
'vf',
'["Vrai","Faux"]'::jsonb,
'faux',
'FAUX. Dans « innovation », le préfixe « in- » ne signifie pas la négation mais « dans/vers l''intérieur » (du latin in). « Innovation » = « in » (dans) + « novare » (rendre nouveau). Le « in- » négatif s''écrit aussi « in- » mais s''applique à des adjectifs : injuste, incapable.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='francais'
on conflict (slug) do nothing;

insert into public.chapters (slug,subject_id,num,title,sa_label,cours,exemple_titre,exemple_enonce,exemple_solution,exercice_consigne,exercice_question,exercice_type,exercice_options,exercice_correct_option,exercice_explication)
select 'brevet_fr_4',s.id,4,'Rédaction : récit, description, lettre','SA 2',
'📚 RÉDACTION : RÉCIT, DESCRIPTION, LETTRE

📌 1. Le récit
Schéma narratif : situation initiale → élément déclencheur → péripéties → dénouement → situation finale.
Temps : imparfait (description/arrière-plan) + passé simple (actions ponctuelles) ou présent de narration.
Point de vue : interne (je), omniscient (il sait tout), externe (observateur).

📌 2. La description
Ordre : spatial (haut→bas, gauche→droite) ou impressionniste.
Verbes d''état (être, sembler, paraître), adjectifs riches, comparaisons.
Eviter : répétitions, descriptions trop génériques.

📌 3. La lettre
Formelle/officielle : date, objet, formule d''appel (Monsieur/Madame…), corps, formule de politesse.
Amicale/informelle : plus libre, vouvoiement ou tutoiement.
Structure : introduction → développement → conclusion + formule de clôture.',
'Exemple — Début de récit',
'Rédiger les deux premières phrases d''un récit commençant par : « C''était un matin comme les autres… »',
'C''était un matin comme les autres à Cotonou, sauf que le ciel, d''habitude limpide, portait d''étranges nuages noirs venus de l''horizon.
Kofi n''y prêta d''abord aucune attention, trop occupé à préparer son cartable pour l''école.',
'QCM — Rédaction',
'Dans le schéma narratif, l''élément déclencheur est :',
'qcm',
'["a) La fin de l''histoire","b) La description du lieu","c) L''événement qui rompt l''équilibre initial","d) Le point de vue du narrateur"]'::jsonb,
'c',
'L''élément déclencheur (ou perturbateur) est l''événement qui vient rompre la situation initiale stable et lancer l''action du récit. Sans lui, il n''y a pas d''histoire. Ex : une rencontre, une catastrophe, une découverte inattendue.'
from public.subjects s where s.niveau_code='brevet' and s.serie_code is null and s.code='francais'
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- FIN — Finaliser la transaction
-- ═══════════════════════════════════════════════════════════════════

commit;

-- ============================================================
-- Note : Ce seed couvre les matières principales.
-- Les autres matières (Anglais, Économie, Comptabilité, 
-- Physique-Chimie-Technologie Brevet, Histoire-Géo Brevet, etc.)
-- seront générées dynamiquement par Gemini au premier accès.
-- ============================================================
