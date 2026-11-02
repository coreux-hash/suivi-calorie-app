# Passation v24.3 — 2026-11-02 — Vocabulaire, passe 4 (coque, Mon cadre, guides)

Référence de départ : dossier v24.2 (disque utilisateur). Sauvegarde du point de départ : `v23_before_pass4`.

## 1. Modifications réalisées

Passe 4 du vocabulaire « vécu, direct, tutoiement ». Uniquement des textes ; aucune clé de stockage, aucun id, aucun mécanisme touché.

- **Coque desktop** (`index.html`) : bandeau « Deux choses à garder en tête », groupe « Où aller », bloc « Le reste » (L'accès / Tes données / Pour cet écran / Les mots), accès « Fermée pour l'instant » / « Ouverte ».
- **Mon cadre** : tuiles de navigation rapide → Toi · Montre · Façon de manger · Sport · Ce que tu vises. « Ta façon de manger » raccourci en « Façon de manger » sur les 3 tuiles desktop (l.652, 653, 678) : la QA navigateur a détecté un débordement réel à 1366 px avec la version longue. Le libellé du champ (`dietMode`) et l'étape mobile gardent « Ta façon de manger ».
- **Guide « Comment ça marche ? »** et **« Comprendre l'application »** réécrits. Ids des h3 conservés, titres changés : Rôle du produit → « À quoi elle sert » ; Flux métier → « Comment ça s'enchaîne » ; Orientation par intention → « Selon ce que tu veux faire » ; Données qui alimentent le moteur → « Ce que l'app utilise pour calculer » ; Santé / diabète → « Glycémie » ; Les différents niveaux d'aide → « Où trouver de l'aide ».
- Lexique → « Les mots » ; case « Je suis ma glycémie (glucides + mesures) ».
- **Barre de statut** (`legacy-shell-observers.js`) : « Jour affiché », « Qui », « Affichage · glycémie », « Ce que tu vises », « Ta façon de manger », « Où tu es dans l'app. ».
- **Accès** (`legacy-app-init.js`) : titres « Fermée pour l'instant » / « Ouverte », libellés rapides « Toi · prêt », « Montre et kcal », « Façon de manger », « Ce que tu vises » ; statuts `requis` / `prêt` inchangés.

## 2. Fichiers touchés

- `index.html`
- `js/legacy/legacy-shell-observers.js`
- `js/legacy/legacy-app-init.js`
- `tests/structure.test.cjs` (regex sur les 3 titres h3 renommés + phrase « estimé par la montre ou confirmé par toi »)
- `tests/browser-non-regression.cjs` (regex « À quoi elle sert », « Comment ça s'enchaîne »)
- `RELECTURE_v24.3_avant_apres.md` (nouveau, 135 anciens / 132 nouveaux textes, diff automatique)
- `PASSATION_v24.3_2026-11-02.md` (ce fichier)

## 3. Comportements préservés

Statuts prêt/requis et compteur, destination « Relire → Calendrier » des deux pastilles, max(L,D), D 6/7 incomplet, aucune sauvegarde silencieuse au changement de profil/date (vérifié par la QA navigateur : `localStorage` identique avant/après ouverture des guides), ids HTML, clés de stockage.

## 4. Contrôles exécutés et résultats

- `node --check` sur tous les scripts `js/legacy` et `js/phase6` : OK.
- `tests/structure.test.cjs` : 8/8.
- `tests/app-state-navigation.test.cjs` : 11/11.
- `tests/mobile-daily-structure.test.cjs` : 12/12.
- `tests/mobile-daily-surface.cjs` : 13 groupes OK.
- `tests/browser-non-regression.cjs` (Playwright, 360/390/768/1366/1440) : réussie, sans débordement horizontal après le raccourci « Façon de manger ». Premier passage en échec sur ce débordement → corrigé.
- Captures contrôlées à l'œil : `responsive-complete-no-load-1366x768-settings.png`, `-390x844-settings.png` : tuiles alignées, rien de tronqué.
- Byte-compare après écriture sur le disque utilisateur : voir §6.

## 5. Limites restantes

- Catalogue des compromis (~90 chaînes) et descriptions de missions/badges hors périmètre de cette passe.
- Relecture humaine attendue sur `RELECTURE_v24.3_avant_apres.md` ; les corrections demandées seront appliquées en micro-corrections.
- Publication GitHub : dépôt non lié au compte, envoi manuel requis.

## 6. Fichiers à envoyer sur GitHub (dans leurs sous-dossiers)

- `index.html` (racine)
- `js/legacy/legacy-shell-observers.js`
- `js/legacy/legacy-app-init.js`
- `tests/structure.test.cjs`, `tests/browser-non-regression.cjs` (facultatif pour le site, nécessaire pour les tests)
