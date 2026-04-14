# PASS660 — diagnostic réel cadre glucidique

## Cause principale observée

Le cartouche `#carbGoalHelp` était encore piloté depuis la mécanique générique `phaseEllipsisTap` au niveau de la card `settingsGoalsSlot`.

Dans `js/legacy/legacy-shell-observers.js`, le popover était programmé depuis les listeners capturants de la card :
- `settingsCard.addEventListener('input', ...)`
- `settingsCard.addEventListener('change', ...)`

Même si le test visait `#carbGuardBox #carbGoal`, l'ouverture restait dans une couche générique de refresh / ellipsis au lieu d'un binding dédié au select `#carbGoal`.

## Refonte locale appliquée

1. suppression de l'ouverture du cartouche depuis les listeners génériques de la card
2. binding dédié directement sur `#carbGoal`
3. garde locale dans `phaseEllipsisTapShow()` : `#carbGoalHelp` n'est plus autorisé à s'ouvrir sans drapeau explicite `forceCarbGoalHelp`
4. conservation du refresh générique pour le reste de la card
5. spinbuttons masqués localement sur les champs pilotage demandés

## Fichiers modifiés

- `js/legacy/legacy-shell-observers.js`
- `css/screens/flowviz.css`
