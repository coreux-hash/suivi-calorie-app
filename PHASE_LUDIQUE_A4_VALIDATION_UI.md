# Phase ludique A4 — Validation UI desktop / mobile

Passe ciblée sur la lisibilité visuelle, sans modification moteur.

## Changements

- Trajectoire mobile : la liste reste en 2 colonnes × 2 lignes pour éviter une pile trop longue.
- Lecture consolidée desktop : `kpis-group-diet` et `kpis-group-energy` sont alignés sur la même ligne.
- Historique : la pill objectif de la sidecard énergie est rendue compacte et ne crée plus de barre parasite.

## Frontière technique

- CSS uniquement pour les corrections d’interface.
- Aucun recalcul nutritionnel.
- Aucune écriture de données.
- Aucun changement de persistence, recettes, mappings, compromis ou pipeline.
