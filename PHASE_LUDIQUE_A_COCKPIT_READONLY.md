# Phase ludique A — Cockpit lecture-seule

Objectif : ajouter une couche de motivation fonctionnelle, non punitive, en parallèle des encodages.

## Doctrine

- Lecture d'état, pas score sur 100.
- Constance hebdomadaire non punitive : un jour manquant éteint un segment, il ne remet rien à zéro.
- Compagnon sobre : un signal court qui fait le pont entre moteur expert et utilisateur lambda.
- Aucune modification du moteur nutritionnel.
- Aucune écriture de données par la couche ludique.

## Sources lues

La couche lit uniquement les données sauvegardées du journal :

- `loadDays()`
- `getDay(date)`
- `getSelectedDate()`
- `historyV2_hasMeaningfulData(dayObj)` quand disponible

Champs utilisés :

- `dayObj.eaten.{k,p,c,f}`
- `dayObj.targetKcal`
- `dayObj.targetP`
- `dayObj.montreAdjusted` / `dayObj.montreRaw`
- `dayObj.meals`
- `dayObj.sport` / `dayObj.sportSessions`
- `dayObj.morningWeight`
- `dayObj.dietMode`
- `dayObj.goalPct`

## Fonctions ajoutées

Fichier : `js/legacy/legacy-playful-tracking.js`

- `normalizePlayfulDay(dayObj)`
- `etatDuJour(dayObj)`
- `missionsDuJour(dayObj)`
- `rythmeSemaine(days, selectedDate)`
- `trajectoireSemaine(days, selectedDate)`
- `renderAll()`

Exposition de debug : `window.__PlayfulTracking`.

## Implantations UI

- Pilotage : panneau `Cockpit du jour`.
- Journal : panneau compact `Missions du jour`.
- Historique : panneau `Trajectoire — semaine`.

## Frontière technique

Le fichier ne contient aucun appel à :

- `saveDays()`
- `compute()`
- `phase6CompatSaveProfileSettings()`
- `localStorage.setItem()`

Il wrappe seulement certaines actions existantes (`upsertDay`, `deleteDay`, etc.) pour déclencher un rafraîchissement visuel après l'écriture déjà effectuée par le système existant.
