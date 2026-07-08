# Phase ludique A2 — Épuration cockpit

## Objectif

Réduire la couche ludique à une lecture rapide, non redondante et plus proche d’un tableau de bord vivant.

## Changements produit

- Le cockpit Pilotage conserve uniquement : état global dans le badge, Missions du jour, Rythme hebdomadaire.
- Les cartes internes “État du jour” et “Signal” sont supprimées pour éviter les doublons avec le header.
- Le bloc Journal reste un rappel compact des missions de la date active.
- Le bloc Historique “Trajectoire — semaine” est placé au-dessus du calendrier pour jouer son rôle de synthèse.
- Les indicateurs de trajectoire passent en grille de 4 colonnes desktop, puis 2/1 colonne en responsive.

## Frontière technique

- Lecture seule.
- Aucun recalcul moteur.
- Aucune écriture dans le journal.
- Aucun appel direct à `saveDays()` ou `localStorage.setItem()`.
- Les interpréteurs de `legacy-playful-tracking.js` restent la source commune des rendus.
