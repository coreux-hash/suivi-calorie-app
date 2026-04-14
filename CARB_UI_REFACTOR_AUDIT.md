# Refonte locale profonde — cadre glucidique (`settingsGoalsSlot`)

## Étape A — audit

### Fichiers actifs concernés
- `js/legacy/legacy-compat-ui.js`
- `js/legacy/legacy-app-init.js`
- `js/legacy/legacy-shell-observers.js`
- `js/legacy/legacy-carb-patches.js`
- `js/phase6/phase6-features.js`
- `css/screens/flowviz.css`

### DOM ciblé
- `#carbGuardEnabled`
- `#carbGoal`
- `#carbGoalHelp`
- `#lowCarbEnabled`
- `#lowCarbLevel`
- `#lowCarbStep`
- `#lowCarbHelp`
- `#carbGuardBox`
- `#lowCarbBox`
- zone racine `#settingsGoalsSlot`

### Points d’entrée / listeners actifs identifiés avant refonte
- `wireEvents()` dans `legacy-app-init.js` attachait directement les listeners carb.
- `legacy-shell-observers.js` réouvrait le popover `#carbGoalHelp` depuis la couche générique `phaseEllipsisTap` sur les événements `input/change` du settings card.
- `legacy-compat-ui.js` pilotait une partie du rendu glucidique et ajoutait encore des listeners directs sur `#carbCapGPerKg` dans `initCarbGuardsUI()`.
- `legacy-carb-patches.js` ajoutait encore des listeners annexes pour `applyRatioPriority()`.
- `phase6-features.js` appelait plusieurs fonctions locales différentes (`updateCarbSteps`, `syncCarbGuardsFromUI`, `syncCarbModeUI`, etc.) selon le point d’entrée.

## Étape B — cartographie des causes

### Cause principale
Le popover `#carbGoalHelp` était piloté par la couche générique `phaseEllipsisTap` au lieu d’être piloté explicitement par le sous-système glucidique. Résultat : la logique d’aide n’était pas réellement découplée du cycle de refresh UI.

### Causes structurelles secondaires
- responsabilités éclatées entre plusieurs fonctions de rendu partiel ;
- binding carb dispersé entre `wireEvents`, `initCarbGuardsUI`, `legacy-carb-patches` et `phaseEllipsisTap` ;
- ouverture d’aide décidée dans un observer générique et non dans la logique carb ;
- refresh UI + aide mélangés.

## Étape C — stratégie locale de refonte

### Conservé
- IDs existants
- HTML global
- CSS global
- compatibilité presets / low-carb / diabète / carb loading
- phase ellipsis générique

### Supprimé / neutralisé
- ouverture automatique de `#carbGoalHelp` depuis les listeners génériques `input/change` du settings card ;
- listeners carb dispersés dans `wireEvents()` ;
- listeners directs ajoutés à chaque init dans `initCarbGuardsUI()` ;
- binding ratio non protégé contre les doublons.

### Reconstruit
- couche unique de lecture d’état : `readCarbUiState()` ;
- couche unique de rendu local : `renderCarbUi()` ;
- couche dédiée d’aides : événements custom `carb-ui:help-open-request` / `carb-ui:help-close-request` ;
- binding unique de zone : `bindCarbUiZoneEvents(runSettings)` ;
- phase6 settings entry points reroutés vers `syncCarbUiZone()`.

## Étape D — implémentation

### `legacy-compat-ui.js`
Ajout du contrôleur local glucidique :
- `getCarbUiDom()`
- `readCarbUiState()`
- `renderCarbUi()`
- `syncCarbUiZone()`
- `bindCarbUiZoneEvents()`

### `legacy-app-init.js`
Remplacement des listeners carb dispersés par un seul appel :
- `window.bindCarbUiZoneEvents?.(runSettings);`

### `phase6-features.js`
Tous les entry points carb relaient désormais vers :
- `window.syncCarbUiZone(...)`

### `legacy-shell-observers.js`
La couche `phaseEllipsisTap` n’ouvre plus `#carbGoalHelp` sur simple `input/change` du card settings.
Elle n’ouvre les aides carb que sur requête explicite via événement custom.

### `legacy-carb-patches.js`
Binding `applyRatioPriority()` regroupé dans un binder protégé :
- `bindCarbRatioPriority()`

### `flowviz.css`
Masquage local des spinbuttons natifs dans l’espace Pilotage uniquement.

## Étape E — validation manuelle à exécuter

1. Ouvrir l’app.
2. Aller dans Réglages > cadre glucidique.
3. Vérifier que `#carbGoal` affiche `— Choisir un objectif —` si aucun objectif actif.
4. Activer `#carbGuardEnabled`.
5. Changer `#carbGoal`.
6. Vérifier que `#carbGoalHelp` s’ouvre et que son texte suit l’objectif choisi.
7. Activer `#lowCarbEnabled`.
8. Vérifier qu’aucune ouverture de `#carbGoalHelp` ne se produit.
9. Changer à nouveau `#carbGoal`.
10. Vérifier que `#carbGoalHelp` s’ouvre à nouveau avec le nouveau contenu.
11. Changer `#lowCarbLevel` puis `#lowCarbStep`.
12. Vérifier que seul `#lowCarbHelp` est concerné par sa propre UI et qu’aucun popover `#carbGoalHelp` ne s’ouvre.
13. Tester un preset régime compatible et incompatible.
14. Tester le mode diabète activé / désactivé.
15. Vérifier dans l’espace Pilotage que les flèches natives des champs numériques ont disparu.
