# Bugfix Requirements Document

## Introduction

Le site éducatif Revizy pour l'enseignement béninois présente trois bugs critiques qui empêchent le bon fonctionnement de la plateforme : (1) les cours ne se chargent pas automatiquement depuis la base de données Supabase, (2) seulement 2 chapitres s'affichent au lieu de tous les chapitres disponibles par matière, et (3) les réponses correctes des QCM sont révélées aux étudiants, rendant l'évaluation inutile. Ces problèmes impactent l'apprentissage des élèves béninois qui dépendent de cette plateforme pour leurs révisions.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN un utilisateur accède à une matière (ex: SVT série C) THEN le système affiche "Revizy IA génère le programme complet" et charge du contenu généré au lieu des 7 chapitres stockés dans la base de données

1.2 WHEN le système charge des chapitres THEN seulement 2 chapitres s'affichent au lieu de tous les chapitres disponibles pour cette matière dans Supabase

1.3 WHEN un étudiant consulte un QCM THEN les options contiennent des indicateurs comme "(Correct)" ou "Bonne réponse" qui révèlent la solution

1.4 WHEN l'application démarre THEN elle utilise le contenu de fallback hardcodé au lieu de charger le curriculum réel depuis seed_curriculum.sql

### Expected Behavior (Correct)

2.1 WHEN un utilisateur accède à une matière THEN le système SHALL charger automatiquement tous les chapitres correspondants depuis la base de données Supabase via la RPC get_curriculum_topics

2.2 WHEN le système charge des chapitres THEN il SHALL afficher tous les chapitres disponibles pour la matière sélectionnée (ex: 7 chapitres pour SVT série C)

2.3 WHEN un étudiant consulte un QCM THEN les options SHALL être présentées sans aucun indicateur de la réponse correcte

2.4 WHEN l'application démarre THEN elle SHALL se connecter à Supabase et charger le contenu pédagogique réel provenant de seed_curriculum.sql

### Unchanged Behavior (Regression Prevention)

3.1 WHEN un utilisateur se connecte/déconnecte THEN le système SHALL CONTINUE TO fonctionner normalement pour l'authentification

3.2 WHEN un étudiant débloque un chapitre payant THEN le système SHALL CONTINUE TO enregistrer correctement l'achat dans unlocked_chapters

3.3 WHEN l'interface affiche les matières par niveau (BAC/Brevet) et série THEN elle SHALL CONTINUE TO respecter la structure existante

3.4 WHEN les 3 premiers chapitres sont gratuits THEN cette règle tarifaire SHALL CONTINUE TO s'appliquer correctement

3.5 WHEN un utilisateur admin accède aux statistiques THEN les fonctionnalités d'administration SHALL CONTINUE TO fonctionner sans modification