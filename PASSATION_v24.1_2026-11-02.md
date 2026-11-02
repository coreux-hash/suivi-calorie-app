# Passation — v24.1 : vocabulaire, passe 2 (Aujourd'hui et Noter) — 2026-11-02

## État du dossier
Dossier = **v24.1** (v24.0 + cette passe, écrite en place). Précédente passation : `PASSATION_v24.0_2026-11-02.md`. À déposer sur GitHub dans les sous-dossiers.

## Périmètre
- **Aujourd'hui mobile** : en-tête (« Ta journée · C'est parti / En cours / Tout est noté · 0/3 choses notées »), trois volets (**Ce que tu brûles** « À confirmer » · **Repas** « Rien noté encore » · **Activité** « Si tu as bougé, note-le »), bouton « Oui, c'est bien ça », « Tes habitudes · un tap et c'est ajouté », « Et aussi · sommeil, poids, glycémie », Relire mobile (« voir, corriger », « Tendances · le détail »).
- **Aujourd'hui desktop** : « Ta journée », raccourcis (Jour · où tu en es / Le compte · cible et reste / noter / régler ; « * t'emmène ailleurs dans l'app »), « Ce qu'il te reste », « Ce que tu brûles aujourd'hui » + « L'app retient : … · pour tous les calculs », « Où tu en es » (ex-Progression du jour), « Les petites choses du jour », « 0/5 faites », « 0/7 jours notés », états vides (« Rien noté », « Pas de séance », « Pas suivi »), bloc « Le compte » (ex-Lecture consolidée).
- **Noter** : « Ce que tu notes », raccourcis (ajouter, corriger / ta séance / ta nuit / Poids · ta mesure / Glycémie · si tu la suis), « Déjà noté », carte Repas (« Ce que tu as mangé », onglets **Les valeurs** / **L'étiquette /100 g**, « Si tu les connais, tape-les », « Recopie l'étiquette (pour 100 g), mets le poids, et c'est calculé », « Calculer et ajouter », « Exemple : 35 g à 420 kcal/100 g, ça fait 147 kcal », « Tu peux corriger directement dans le tableau », « Ce qu'il te reste »), Sommeil (« Rien noté pour cette nuit », « + Noter ma nuit », « Qualité (optionnel) »), Poids (« Ton poids », « Même heure, même tenue, même balance »), Glycémie (ex-Module diabète), étiquettes des teasers (« Affichage + sport et sommeil » / « Affichage Tout »).
- Missions/badges (`legacy-playful-tracking.js`) : « Note au moins un repas », « Si tu as bougé, note-le », « Pas assez de protéines », « Dans les clous », « Presque », « Poids noté », « À noter », « N jours notés cette semaine ».

**Hors passe** : descriptions des badges (« Une activité a été prise en compte. »…), tableau des repas (en-têtes générés par `legacy-meals-body.js`), textes dynamiques de Ce que tu vises, shell desktop (« Bon à savoir », « Accès transverses », barre de statut « Espace actif / Lecture, saisie, analyse ou réglages », sous-titres des quatre tuiles « Paramètres et maintenance »), Relire, Aide. → passes 3 et 4.

## Liste avant → après
`RELECTURE_v24.1_avant_apres.md` (126 lignes, HTML + JS). Corrige dedans, je reporte.

## Fichiers touchés
`index.html` · `js/phase6/phase6-mobile-daily.js` · `js/legacy/legacy-shell-observers.js` · `js/legacy/legacy-playful-tracking.js` · `tests/mobile-daily-structure.test.cjs` (deux regex de wording) · `RELECTURE_v24.1_avant_apres.md` (nouveau) · cette passation.
Aucun `id`, `class`, `data-*`, `value`, clé ni calcul modifié. Les clés de missions/badges (`meals`, `activity`, `week_3_days`…) sont inchangées ; seuls les libellés le sont.

## Contrôles exécutés
`node --check` OK ; 0 id dupliqué ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` 13/13 ; débordement 0 px à 390 ; captures contrôlées : Aujourd'hui mobile (en-tête, Ce que tu brûles, Repas avec habitudes, Étiquette), Aujourd'hui et Noter desktop ; relecture octet pour octet après écriture.

## Suite
Passe 3 : Relire (mobile + desktop) + textes dynamiques de Ce que tu vises (`legacy-compromise-ui.js`) + descriptions des badges. Passe 4 : shell desktop, guides, Aide et mots-clés. Puis pont NutriApp.
