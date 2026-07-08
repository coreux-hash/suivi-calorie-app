# Phase ludique A5 — Badges de parcours lecture-seule

## Intention

Ajout d’une couche de progression plus ludique : interface en **badges**, inspirée visuellement des grilles de badges mobiles, mais avec une logique de parcours basée sur les missions et la régularité.

## Doctrine

- Badge en façade utilisateur.
- Logique interne de progression : missions du jour, rythme semaine, trajectoire.
- Aucun badge ne récompense la restriction calorique, la perte rapide ou une journée “parfaite”.
- Les badges encouragent le suivi, la lisibilité et la régularité.

## Frontière technique

La couche reste lecture-seule :

- aucune écriture dans le journal ;
- aucun `localStorage.setItem()` ;
- aucun appel à `saveDays()` ;
- aucun appel à `compute()` ;
- aucun recalcul moteur ;
- aucune modification des presets, compromis, mappings, recettes, profils ou pipeline nutritionnel.

## Fonctions ajoutées

Dans `js/legacy/legacy-playful-tracking.js` :

- `badgesDuParcours(days, selectedDate)` ;
- `prochainBadge(days, selectedDate)` ;
- helpers internes de progression de badges ;
- rendu d’un badge compact dans Pilotage ;
- rendu d’une section Badges dans Historique.

## Implantation UI

- Pilotage : carte compacte **Prochain badge** sous le cockpit.
- Historique : section **Badges** sous Trajectoire — semaine et avant le calendrier.
- Grille de badges : badges débloqués, verrouillés, progression current/target.

## Badges de base

- Journée lancée ;
- Journée lisible ;
- Premier repas ;
- Première activité ;
- Premier poids ;
- Semaine lancée ;
- Semaine régulière ;
- Semaine complète ;
- Repère protéines ;
- Apport cadré ;
- Activité suivie ;
- Suivi complet.
