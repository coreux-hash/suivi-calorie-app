# Refonte visuelle carte blanche — cockpit lambda

## Intention
Créer une branche conceptuelle plus lisible pour un utilisateur moins expert, sans modifier le moteur, les calculs, les mappings, les presets, la persistance ni les scripts métier.

## Scope appliqué
- CSS uniquement : `css/screens/flowviz.css`.
- Ajout d'une couche finale d'overrides visuels.
- Aucun changement HTML.
- Aucun changement JavaScript.

## Axes UI
1. Appbar plus produit, plus stable.
2. Navigation principale simplifiée en cockpit.
3. Panneaux et cartes unifiés par une même grammaire visuelle.
4. Info-dots conservés mais normalisés visuellement.
5. Formulaires plus lisibles : hauteur, bordure, focus.
6. Bandeau "Bon à savoir" traité comme rappel fixe, non interactif.
7. Menu mobile et modales renforcés en lisibilité.
8. Mobile allégé : rayons, espacements, navigation compacte.

## Limites volontaires
Cette branche est une peau visuelle expérimentale. Elle ne réorganise pas les écrans, ne déplace pas les champs et ne modifie aucun comportement applicatif.
