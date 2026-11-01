# Passation — correction v23.2 : repas récents, ajout en 1 tap (2026-11-01)

## État du dossier
Dossier `SuiviCalorieApp_mobile_quotidien_v22_reglages_accordeon_20260819` = **v23.2** (v23.1 + cette correction, écrite en place). Précédente passation : `PASSATION_v23.1_2026-11-01.md`.

Hypothèse non vérifiable d'ici : M. Colin a testé la v23.1 via le lien GitHub Pages et l'a validée, donc le dépôt `coreux-hash/suivi-calorie-app` a été mis à jour depuis le 7 août. **À refaire après cette correction** (pousser le dossier), sinon le téléphone restera en v23.1.

## Objectif servi
« Encodage journalier simple avec décompte » : le repas était le geste le plus coûteux (4 à 6 saisies, plusieurs fois par jour). Un repas déjà encodé un autre jour s'ajoute désormais en **1 tap**.

## Modifications
- `js/phase6/phase6-mobile-daily.js`
  - `recentMeals()` : liste des 8 derniers repas distincts, **déduite de `loadDays()`** (journées les plus récentes d'abord, dernier repas de la journée d'abord). Un repas nommé est identifié par son nom en minuscules (la version la plus récente gagne) ; le nom générique « Repas » est distingué par ses valeurs kcal/P/G/L. Les repas sans nom sont ignorés.
  - `addRecentMeal()` : remplit `#mealName/#mealK/#mealP/#mealC/#mealF` puis **clique `#btnAddMeal`** → chemin legacy intact (`addMealFromInputs` : `normalizeMeal`, `setMealsForDay`, `renderMealsTable`, `compute(true)`, champs vidés).
  - `installRecentMeals()` / `syncRecentMeals()` / `removeRecentMeals()` : bloc `#mobileDailyRecentMeals` inséré en tête de `#mobileDailyMealsSlot` à l'activation mobile, reconstruit à chaque synchronisation, masqué si la liste est vide, retiré au retour desktop.
- `css/screens/mobile-daily.css` : styles du bloc (grille 2 colonnes, boutons ≥ 48 px, nom en ellipsis).
- `tests/mobile-daily-surface.cjs` : nouveau groupe « Repas récents » (ordre, dédoublonnage, ajout tel quel, formulaire vidé, bloc masqué sans historique, bloc retiré sur desktop).

Aucune clé `localStorage`, aucun format, aucun calcul nouveau. `index.html` non touché. Desktop non touché.

## Contrôles exécutés
`node --check` OK ; 0 id dupliqué ; CSS équilibré (253/253) ; `app-state-navigation` 11/11 ; `mobile-daily-structure` 12/12 ; `structure` 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` **10/10** ; débordement 0 px à 320/390 ; captures 320/390 avant/après tap contrôlées (bloc Récents, « 1 repas », décompte mis à jour) ; relecture octet pour octet des fichiers écrits sur le disque.

## Limites / choix assumés
- Si un nom est en cours de frappe dans « Nom du repas » au moment du tap, il est remplacé (le chemin legacy vide le formulaire après ajout). Pas de brouillon conservé.
- Pas d'édition avant ajout : corriger un repas ajouté se fait dans Historique → « Repas · voir et corriger » (tableau existant).
- La liste est vide tant qu'aucun repas nommé n'a été encodé ; le gain arrive avec l'usage.
- Dédoublonnage par nom : « Petit-déj » à 400 kcal lundi et 450 kcal mardi → une seule entrée, celle de mardi.

## Points ouverts
Inchangés (téléphone physique, seconde garde Activité/Sommeil neutralisée, onglet Manuel par défaut, teasers « mode expert » hors Repas, fichiers JS orphelins). Prochain levier possible : mémoriser le dernier onglet Manuel/Rapide (touche aussi le desktop — à décider).
