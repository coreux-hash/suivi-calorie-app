# Phase ludique A3 — Validation métier des signaux + info-dots lambda

## Objectif

Corriger la couche ludique sans toucher au moteur nutritionnel : rendre les états plus cohérents pour un utilisateur lambda et simplifier les textes d'aide.

## Corrections métier

### Cas activité seule

Avant : une activité pouvait être cochée dans les missions pendant que le cockpit restait à `À renseigner`.

Après : une journée avec activité mais sans repas devient `À compléter`.

Message interne associé :

- `Activité prise en compte. Repas encore à renseigner.`

### Cas repas créé sans valeur

Ajout d'un état partiel :

- `Repas créé. Valeurs encore à renseigner.`

### Cas information seule

Une information isolée, par exemple poids ou sommeil, donne une lecture prudente :

- `À compléter`
- `Une information est présente. Repas encore à renseigner.`

## Info-dots simplifiés

Les aides ne parlent plus de fonctions, moteur, recalcul ou API interne.

- Cockpit : `Cette zone résume ta journée. Elle ne change rien à tes données.`
- Missions : `Ces repères indiquent ce qui est déjà rempli aujourd’hui. Ils ne modifient rien.`
- Trajectoire : `Cette zone compte les jours vraiment renseignés de la semaine. Rater un jour ne remet rien à zéro.`

## Frontière technique

La couche reste lecture-seule.

- Aucun recalcul moteur.
- Aucune écriture dans le journal.
- Aucun `localStorage.setItem()`.
- Aucun appel à `saveDays()`.
- Aucun changement de recette, preset, compromis, mapping, profil ou pipeline nutritionnel.

## Fichiers modifiés

- `index.html`
- `js/legacy/legacy-playful-tracking.js`

## Fichier ajouté

- `PHASE_LUDIQUE_A3_SIGNAUX_LAMBDA.md`
