# Phase ludique A7 — clarification missions et signal activité

## Objectif

Clarifier la couche ludique sans modifier le moteur nutritionnel ni les données enregistrées.

## Modifications

- Le bloc Journal `Missions du jour` devient `Déjà renseigné` pour éviter la redondance avec le cockpit Pilotage.
- La phrase du bloc Journal devient `Repères rapides de ce qui est déjà renseigné pour la date active.`
- Les info-dots Cockpit, Journal, Trajectoire et Badges sont simplifiées pour un public plus lambda.
- L’état `recovery_attention` est élargi : une journée avec activité et apport énergétique bas passe désormais en `À surveiller`, même si les protéines sont correctes.

## Frontière technique

- Lecture seule.
- Aucun recalcul moteur.
- Aucune écriture dans le journal.
- Aucun `localStorage.setItem()`.
- Aucun appel à `saveDays()`, `compute()` ou `calculate()`.

## Intention produit

Le signal `À surveiller` ne juge pas l’utilisateur. Il relie seulement une activité présente à un apport bas, pour éviter qu’une journée active sous-alimentée soit lue comme un simple écart calorique isolé.
