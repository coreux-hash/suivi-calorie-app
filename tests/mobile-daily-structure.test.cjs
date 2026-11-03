const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/screens/mobile-daily.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/phase6/phase6-mobile-daily.js'), 'utf8');
const diabetes = fs.readFileSync(path.join(root, 'js/legacy/legacy-diabetes.js'), 'utf8');
const discreteSteppers = fs.readFileSync(path.join(root, 'js/legacy/legacy-mobile-discrete-steppers.js'), 'utf8');
const ellipsis = fs.readFileSync(path.join(root, 'js/legacy/legacy-shell-observers.js'), 'utf8');

test('surface mobile : deux vues principales, réglages hors navigation basse', () => {
  assert.match(html, /id="mobileDailyToday"/);
  assert.match(html, /id="mobileDailyHistory"/);
  assert.match(html, /id="mobileDailySettings"/);
  assert.match(html, /data-mobile-view="today"/);
  assert.match(html, /data-mobile-view="history"/);
  assert.doesNotMatch(html, /data-mobile-view="settings"/);
});

test('réglages mobile : parcours de configuration en quatre étapes, sans dupliquer les champs', () => {
  assert.match(html, /id="mobileSetupState"/);
  assert.match(html, /data-mobile-setup="profile"/);
  assert.match(html, /data-mobile-setup="watch"/);
  assert.match(html, /data-mobile-setup="goals"/);
  assert.match(html, /data-mobile-setup="compromise"/);
  assert.match(html, /id="mobileSetupModeSlot"/);
  assert.doesNotMatch(html, /id="mobileSetupToday"/);
  assert.match(js, /const SETUP_STEPS/);
  assert.match(html, /<div class="card" id="settingsMacrosCard">/);
  assert.match(js, /compromise: \{ panel: '\.settingsPanel--goals', target: '#settingsMacrosCard' \}/);
  assert.match(js, /goals: \{ panel: '\.settingsPanel--goals', target: '#dietMode', targetLabel:true \}/);
  assert.match(js, /function portMobileSetupContext/);
  assert.match(js, /mobileSetupPorts = \{ mode:null, watch:null, errMode:null \}/);
  assert.match(js, /function syncMobileSetup/);
  assert.match(js, /function openMobileSetupStep/);
  assert.match(js, /phase6GetSetupState/);
  assert.match(css, /#mobileDailySettingsSlot\[data-mobile-settings-open="profile"\]/);
  assert.match(css, /\.mobileSetupSteps/);
  assert.match(css, /#mobileSetupModeSlot\{margin:0 0 12px\}/);
  assert.match(css, /\.settingsRow--users,#mobileDailySettingsSlot \.settingsRow--infos,#mobileDailySettingsSlot \.settingsRow--macros/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileWatchCard>\.row\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(js, /const watchBrandRow = \$\('watchBrand'\)\?\.closest\('\.row'\)/);
  assert.match(js, /const errModeField = \$\('errMode'\)\?\.parentElement/);
  assert.match(css, /\.mobileWatchCard \.mobileWatchEmptyRow\{display:none\}/);
  assert.match(css, /\.mobileWatchCard \.mobileWatchProfile\{margin:0 0 12px;padding:0;border:0;background:transparent\}/);
  assert.match(js, /selector: '\.phase2Grid--settings', mobile: 'mobileDailySettingsSlot'/);
});

test('réglages mobile : chaque ellipsis conserve son contrat de lecture tactile après portage', () => {
  assert.match(ellipsis, /e\.target\.closest\('\.phaseEllipsisTapTarget'\)/);
  assert.match(ellipsis, /\(node\.scrollHeight - node\.clientHeight\) > 1/);
  assert.match(css, /#mobileDailySettingsSlot \.phaseEllipsisTap__text\{[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/);
  assert.match(css, /#mobileDailySettingsSlot \.phaseEllipsisTap__content\{[^}]*-webkit-line-clamp:2/);
});

test('réglages mobile : les steppers discrets restent attachés aux inputs après portage', () => {
  assert.match(discreteSteppers, /host\.className = 'mobileStepperInputWrap'/);
  assert.match(discreteSteppers, /field\.insertBefore\(host, input\)/);
  assert.match(discreteSteppers, /host\.appendChild\(input\)/);
  assert.match(discreteSteppers, /wrap\.className = 'mobileDiscreteStepper'/);
  assert.match(js, /selector: '\.phase2Grid--settings', mobile: 'mobileDailySettingsSlot'/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileStepperInputWrap\{position:relative;width:100%\}/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileDiscreteStepper\{display:none\}/);
  assert.match(css, /@media \(max-width:680px\)\{/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileStepperInput\{box-sizing:border-box;width:100%;padding-right:4\.4rem\}/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileDiscreteStepper\{position:absolute/);
  assert.match(css, /#mobileDailySettingsSlot \.mobileDiscreteStepper__btn\{width:1\.7rem!important/);
});

test('surface mobile : les trois essentiels sont portés sans champ dupliqué', () => {
  ['mobileDailySpendSlot', 'mobileDailyMealsSlot', 'mobileDailyActivitySlot'].forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(js, /phase1PulseCard--spendEdit/);
  assert.match(js, /phase2JournalPanel--meals/);
  assert.match(js, /phase2JournalPanel--activity/);
  assert.match(js, /portNodes\(true\)/);
  assert.match(js, /portNodes\(false\)/);
});

test('surface mobile : le compteur 3\/3 décrit une saisie, pas une réussite nutritionnelle', () => {
  assert.match(html, /choses notées/);
  assert.match(js, /Tout est noté/);
  assert.doesNotMatch(html + js, /journée réussie/i);
  assert.match(css, /mobileDailyNav/);
});

test('surface mobile : les essentiels restent des données métier et une seule carte est ouverte', () => {
  assert.match(js, /energyExplicit === true/);
  assert.match(js, /__PlayfulTracking\?\.missionsDuJour/);
  assert.match(js, /function setAction/);
  assert.match(html, /data-mobile-action="spend"/);
  assert.match(html, /data-mobile-action="meals"/);
  assert.match(html, /data-mobile-action="activity"/);
  assert.match(html, /id="mobileDailyNextBadge"/);
});

test('surface mobile : la barre de statut devient un tiroir sans nouveau contenu métier', () => {
  assert.match(html, /id="mobileDailyContextBtn"/);
  assert.match(js, /function installContextDrawer/);
  assert.match(js, /function watchContextDrawer/);
  assert.match(css, /phase5StatusBar--drawer/);
  assert.doesNotMatch(js, /textContent = 'Changer mon cadre'/, 'Mon cadre : accès unique par le menu ☰ (v25.3)');
  assert.match(js, /\$\('menuBtn'\)\?\.addEventListener\('click', closeDrawer, true\)/);
  assert.match(js, /function installMobileInfoDots/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
  assert.match(css, /#phase5ShellLine\{display:block!important;margin:0!important\}/);
  assert.match(css, /\.mobileDailyContextTab::after\{content:""/);
  assert.match(css, /right:8px!important;left:auto!important/);
  assert.doesNotMatch(html, /id="phase5ActiveSpace"/);
});

test('surface mobile : le résumé est collé sous l’appbar et le point Sport réutilise le contrat info-dot', () => {
  assert.match(css, /\.container\{max-width:680px;padding:calc\(var\(--appbar-h, 56px\) \+ 4px\)/);
  assert.match(css, /\.mobileDaily__head\{display:none\}/);
  assert.doesNotMatch(js, /cardId:'sleepCard'/, 'v25.5 : plus de ⓘ Activité / Sommeil');
  assert.match(css, /#mobileDailyActivitySlot #sportCard \.phase1SplitNote,#mobileDailyMoreSlot #sleepCard \.phase1SplitNote\{display:none\}/);
  assert.match(js, /dot\.className = `info-dot mobileDailyInlineInfo/);
  assert.match(js, /note\.classList\.add\('mobileDailyInfoSource'\)/);
  assert.match(css, /\.phase1SplitNote\.mobileDailyInfoSource\{display:none!important\}/);
  assert.match(css, /\.mobileDailyInlineInfo\{flex:0 0 24px;margin:0!important\}/);
  assert.match(css, /body\.phase5MobileStatusFixed \.container\{padding-top:calc\(var\(--appbar-h, 56px\) \+ 4px\)!important\}/);
});

test('surface mobile : menu réduit, repas condensés et tableau déplacé sans duplication', () => {
  assert.match(html, /class="menuGroup mobileMenuGroup"/);
  assert.match(css, /\.mobileMenuGroup\{display:none\}/);
  assert.match(html, /Aide pour démarrer/);
  assert.match(html, /id="mobileDailyMealsHistorySlot"/);
  assert.match(html, /id="mealsTableDesktopSlot"/);
  assert.match(js, /selector: '#mealsTableWrap', mobile: 'mobileDailyMealsHistorySlot'/);
  assert.match(css, /#mobileDailyMealsSlot #mealPanelManual>\.row,#mobileDailyMealsSlot #mealPanelQuick>\.row\.mt-05\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#mobileDailyMealsSlot \.phase2DietNoteDisclosure\{display:none\}/);
  assert.match(css, /#mobileDailyMealsSlot \.phase2MealModeRow\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#mobileDailyMealsSlot #btnClearMeals\{display:none\}/);
  assert.match(css, /#mobileDailyMealsSlot #mealPanelQuick>\.row\.mt-05\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.mobileDailyMealsHistory summary>span:first-child\{display:flex;gap:4px;align-items:center;font:inherit/);
});

test('surface mobile : les repères optionnels ne modifient pas les essentiels et le diabète dépend du module', () => {
  assert.match(html, /id="mobileDailyMore"/);
  assert.doesNotMatch(html.match(/id="mobileDailyMore"[^>]*>/)?.[0] || '', /\sopen(?:=|\s|>)/);
  assert.match(js, /function syncOptionalPanels/);
  assert.match(js, /function applyMobileDiabetesHistoryToolbar/);
  assert.match(js, /date\?\.closest\('\.historyDiabToolbar'\)/);
  assert.match(js, /const diabetesEnabled = \$\('diabEnabled'\)\?\.checked === true/);
  assert.match(js, /diabetesPanel\.hidden = !diabetesEnabled/);
  assert.match(js, /\['dayDate','todaySpendEdit','btnAddMeal','btnClearMeals','btnSportSave','diabEnabled'\]/);
  assert.match(css, /\.phase2JournalPanel--diabetes\[hidden\]\{display:none!important\}/);
  assert.match(css, /mobileDailyDiabetesContextMain/);
  assert.match(css, /mobileDailyDiabetesGlucoseFields/);
});

test('historique mobile : analyses condensées et tableau diabète lisible sans donnée supprimée', () => {
  assert.match(css, /\.phase2HistoryPanel--trend #accTrendExpert \.accGrid/);
  assert.match(css, /\.phase2HistoryPanel--health #accHistAdvanced>\.accBody>\.accGrid:not\(\.accGrid3\)/);
  assert.match(css, /\.phase2HistoryPanel--diab \.historyDiabToolbar/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(104px,\.72fr\)/);
  assert.match(css, /min-width:660px!important/);
  assert.match(diabetes, /historyDiabTable__label--full/);
  assert.match(diabetes, /historyDiabTable__label--short/);
  assert.match(diabetes, /<th>Stress<\/th>/);
});
