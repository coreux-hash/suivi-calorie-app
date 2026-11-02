# Passation — correction v23.5 : cinq ajustements d'ergonomie mobile (2026-11-01)

## État du dossier
Dossier = **v23.5** (v23.4 + cette correction, écrite en place). Précédente passation : `PASSATION_v23.4_2026-11-01.md`.

**Dépôt GitHub** : vérifié ce soir par clonage — les dépôts manuels de 13:34 et 14:50 n'avaient enregistré que les passations (racine), pas les fichiers des sous-dossiers `js/`, `css/`, `tests/` ; corrigé ensuite par M. Colin (v23.4 confirmée en ligne). Rappel : déposer les fichiers **dans leur sous-dossier** sur GitHub. La liaison du compte GitHub à Claude (pour que je pousse moi-même) n'est pas faite.

## Demandes traitées (M. Colin, 21:30)
1. Volets Aujourd'hui (Dépense / Repas / Activité) : un re-tap sur le volet ouvert le referme. Avant : un volet ne se fermait que si un autre s'ouvrait.
2. Mesures optionnelles (Masse grasse / musculaire / osseuse) : nom tronqué en ellipse, **unité conservée** en fin, cellules alignées.
3. Carte « Montre et dépense » : libellés courts (`Marque de la montre` → **Montre**, `Mode de prudence` → **Prudence**, `Calories brûlées (kcal)` → **Calories (kcal)**, `Incertitude (en %)` → **Incertitude (%)**), aides sous les cellules masquées sur mobile (sauf « Pourquoi cette prudence ? ℹ️ », conservée).
4. En-tête : « **Reste N kcal** / sur cible de T kcal » — plus de kcal consommées.
5. Explication de la prudence déplacée dans un **info-dot** (composant `.info-dot` existant → modale `watchInfoModal` via la délégation legacy `initPinnedTips`), clavier géré (Entrée/Espace).

## Modifications
- `js/phase6/phase6-mobile-daily.js`
  - `collapseActions()` + gestionnaire `[data-mobile-action]` : toggle.
  - `splitUnitLabels()` : les labels de `#fatPct/#musclePct/#boneKg` deviennent `<span.mobileLabelName>Nom</span> <span.mobileLabelUnit>(unité)</span>` — texte strictement identique, fait une fois, sans effet visuel hors mobile.
  - `shortenWatchLabels(isMobile)` : libellés courts à l'activation mobile, **originaux restaurés au retour desktop** (`data-mobile-label-original`) ; classe `mobileWatchHint` posée/retirée sur les `.muted` de la carte, sauf celui qui porte l'info-dot.
  - `syncRemaining()` : nouveau libellé.
  - `syncSpendChain()` : info-dot avec `data-modaltext` (montre saisie, prudence et mode, retenue, où régler) ; pas d'info-dot quand brut = retenue.
- `css/screens/mobile-daily.css` : labels composition en flex/ellipsis ; `.mobileWatchHint{display:none}` ; info-dot inline dans la chaîne ; en-tête sur deux lignes.
- `tests/mobile-daily-surface.cjs` : groupe « Volets refermables ; libellés mesures nom+unité ; carte Montre raccourcie » (toggle, un seul volet ouvert, libellés une ligne et cellules alignées, libellés courts en Simple, aides masquées, restauration desktop) ; groupe 3d mis à jour (chaîne + info-dot qui ouvre la modale, en-tête).

`index.html` non touché. Moteur, stockage, desktop intacts (libellés restaurés au retour desktop — vérifié par test).

## Contrôles exécutés
`node --check` OK ; CSS équilibré (262/262) ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` **13/13** ; débordement 0 px à 320/390 ; captures 320/390 (Aujourd'hui, mesures, carte Montre, mode Expert) contrôlées ; relecture octet pour octet après écriture.

## Limites
- À 320 px, trois colonnes de mesures laissent ~6 caractères au nom (« Mass… (%) ») : lisible grâce à l'unité, mais serré. Passer à 2 colonnes sous 360 px est possible si souhaité.
- Le libellé « Profil de la montre » (bloc info) n'est pas raccourci : il porte l'info-dot « Pourquoi cette prudence ? » et n'apparaît qu'en Sportif/Expert.
