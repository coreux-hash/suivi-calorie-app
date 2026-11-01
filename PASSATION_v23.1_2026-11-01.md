# Passation — correction v23.1 : mise en page Rapide /100 g alignée sur Manuel (2026-11-01)

## État du dossier
Dossier `SuiviCalorieApp_mobile_quotidien_v22_reglages_accordeon_20260819` = **v23.1** (v23 + cette correction, écrite en place). Précédente passation : `PASSATION_v23_2026-11-01.md`.

## Demande
Sur mobile, même mise en page pour les deux modes d'encodage repas ; dans Rapide /100 g, le champ **Poids (g)** passe tout en bas, sur les deux colonnes.

## Modification (1 fichier)
`css/screens/mobile-daily.css`, dans `@media (max-width:860px)`, bloc `#mobileDailyMealsSlot` :
- `#mealPanelQuick` reçoit le même `padding:12px` que `#mealPanelManual` ;
- `#mealPanelQuick>.row.mt-05>div:nth-child(2)` (le champ `#qWeight`, 2e enfant dans `index.html` l.~1673) → `order:10; grid-column:1 / -1` : grille kcal · P / G · L, puis Poids pleine largeur ;
- ligne d'action `.row.mt-03` en `display:block`, `#btnQuickAddMeal` en pleine largeur, comme « Ajouter ce repas » en Manuel.

Aucun changement HTML ni JS. Desktop non touché (vérifié : `order` = 0 à 1280 px). Dépendance structurelle assumée : si l'ordre des champs du panneau Rapide change dans `index.html`, adapter le `nth-child(2)`.

## Contrôles exécutés
CSS équilibré (244/244) ; `app-state-navigation` 11/11 ; `mobile-daily-structure` 12/12 ; `structure` 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` 9/9 ; débordement 0 px à 320 et 390 ; captures viewport 320/390 (Rapide et Manuel) contrôlées : Poids seul en dernière ligne, largeur = largeur de la grille, bouton pleine largeur.

## Points ouverts
Inchangés depuis `PASSATION_v23_2026-11-01.md` (test téléphone physique, seconde garde Activité/Sommeil neutralisée, onglet Manuel par défaut, teasers « mode expert » hors Repas, fichiers JS orphelins, favoris/duplication de repas).

## Incident d'écriture (corrigé, 11:28)
La première écriture de `css/screens/mobile-daily.css` a été signalée comme réussie mais avait recopié la **version v23** (30 199 octets) au lieu de la v23.1 (30 726 octets). Cause probable : copie de transfert réutilisée sur le même chemin intermédiaire. Réécrit depuis un chemin neuf, puis **relu depuis le disque** : les 6 fichiers modifiés depuis v22 (`index.html`, `mobile-daily.css`, `flowviz.css`, `phase6-mobile-daily.js`, `legacy-app-init.js`, cette passation) sont identiques octet pour octet aux versions testées.

**Règle ajoutée à la procédure** : après chaque écriture dans le dossier, relire le fichier depuis le disque et comparer octet pour octet avec la version testée avant d'annoncer la correction comme faite.
