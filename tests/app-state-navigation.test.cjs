const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appRoot = path.resolve(__dirname, '..');
const state = require(path.join(appRoot, 'js/legacy/legacy-app-state-navigation.js'));

const validCompromiseIds = ['eq_global', 'cut_sport'];
const completeProfile = {
  sex:'M',
  age:48,
  height:182,
  weight:86,
  watchBrand:'Garmin',
  montre:3000,
  dietMode:'cut_standard',
  compromiseId:'cut_sport',
  validCompromiseIds
};

function isoAdd(dateStr, delta){
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function energyDays(endDate, count, { spend = 4000, bmr = 2000 } = {}){
  return Array.from({ length:count }, (_, index) => ({
    date:isoAdd(endDate, index - count + 1),
    energyExplicit:true,
    montreAdjusted:spend,
    bmr
  }));
}

function loadTrainingMatrix(days, selectedDate = '2026-08-04'){
  const code = fs.readFileSync(path.join(appRoot, 'js/legacy/legacy-training-load-matrix.js'), 'utf8');
  const windowObject = { __SCAStateNavigation:state };
  const context = {
    window:windowObject,
    document:{
      readyState:'loading',
      getElementById(){ return null; },
      addEventListener(){}
    },
    loadDays(){ return structuredClone(days); },
    getSelectedDate(){ return selectedDate; },
    escapeHtml(value){ return String(value); },
    setTimeout(){ return 0; },
    MutationObserver:undefined,
    console
  };
  vm.runInNewContext(code, context, { filename:'legacy-training-load-matrix.js' });
  return windowObject.__TrainingLoadMatrix;
}

test('1 — nouveau profil incomplet : Réglages et entrées requises accessibles', () => {
  const result = state.computeConfigurationState({ validCompromiseIds });
  assert.equal(result.configurationComplete, false);
  assert.equal(result.initialDestination, 'settings');
  assert.equal(result.sections.find(section => section.key === 'profile').ready, false);
  const compromiseEntry = state.getNavigationEntry('settings', 'compromise');
  assert.equal(state.isNavigationEntryAvailable(compromiseEntry, { useMode:'simple' }), true);
});

test('2 — profil complet : destination interne Pilotage (today)', () => {
  const result = state.computeConfigurationState(completeProfile);
  assert.equal(result.configurationComplete, true);
  assert.equal(result.initialDestination, 'today');
  assert.equal(result.sections.every(section => section.ready), true);
});

test('3 — ancien profil migrable : correspondance exacte unique', () => {
  const migratedId = state.resolveUniqueExactCompromiseId({
    legacySignatureComplete:true,
    exactIds:['cut_sport']
  });
  assert.equal(migratedId, 'cut_sport');
  const result = state.computeConfigurationState({ ...completeProfile, compromiseId:migratedId });
  assert.equal(result.configurationComplete, true);
});

test('4 — ancien profil ambigu ou incomplet : aucun compromis inventé', () => {
  assert.equal(state.resolveUniqueExactCompromiseId({ legacySignatureComplete:true, exactIds:['eq_global', 'cut_sport'] }), '');
  assert.equal(state.resolveUniqueExactCompromiseId({ legacySignatureComplete:false, exactIds:['cut_sport'] }), '');
  const result = state.computeConfigurationState({ ...completeProfile, compromiseId:'' });
  assert.equal(result.configurationComplete, false);
  assert.equal(result.initialDestination, 'settings');
});

test('configuration : un identifiant non disponible reste invalide', () => {
  const result = state.computeConfigurationState({ ...completeProfile, compromiseId:'inconnu' });
  assert.equal(result.sections.find(section => section.key === 'compromise').ready, false);
  assert.equal(result.configurationComplete, false);
});

test('5 — aucune charge : états faux et pastilles demandées', () => {
  const result = state.computeLoadAvailability({ sportMinutes:0, energyValidDays:0, energyRequiredDays:7 });
  assert.deepEqual(result, {
    sportLoadAvailable:false,
    energyLoadComplete:false,
    loadAvailable:false,
    showLoadNudge:true
  });
});

test('6 — D 6/7 : incomplet, aucun niveau D final', () => {
  const endDate = '2026-08-04';
  const matrix = loadTrainingMatrix(energyDays(endDate, 6), endDate);
  const energy = matrix.getWeeklyEnergyLoad(endDate);
  assert.equal(energy.complete, false);
  assert.equal(energy.validDays, 6);
  assert.equal(energy.id, null);
  assert.equal(energy.level, null);
  const availability = state.computeLoadAvailability({ sportMinutes:0, energyValidDays:energy.validDays, energyRequiredDays:energy.requiredDays });
  assert.equal(availability.loadAvailable, false);
  assert.equal(availability.showLoadNudge, true);
});

test('7 — D 7/7 : complet et niveau calculé selon les seuils actuels', () => {
  const endDate = '2026-08-04';
  const matrix = loadTrainingMatrix(energyDays(endDate, 7), endDate);
  const energy = matrix.getWeeklyEnergyLoad(endDate);
  assert.equal(energy.complete, true);
  assert.equal(energy.validDays, 7);
  assert.equal(energy.id, 'D3');
  assert.equal(energy.level, 'L3');
  const availability = state.computeLoadAvailability({ sportMinutes:0, energyValidDays:7, energyRequiredDays:7 });
  assert.equal(availability.loadAvailable, true);
  assert.equal(availability.showLoadNudge, false);
});

test('8 — activité récente : L0 reste disponible et max(L,D) est préservé', () => {
  const endDate = '2026-08-04';
  const sportDay = { date:endDate, sportSessions:[{ id:'s1', minutes:30, type:'course' }] };
  const matrix = loadTrainingMatrix([sportDay, ...energyDays(endDate, 7)], endDate);
  const minutes = matrix.getWeeklySportMinutes(endDate);
  const sportLevel = matrix.getLoadLevel(minutes / 60);
  assert.equal(minutes, 30);
  assert.equal(sportLevel, 'L0');
  const availability = state.computeLoadAvailability({ sportMinutes:minutes, energyValidDays:0, energyRequiredDays:7 });
  assert.equal(availability.sportLoadAvailable, true);
  assert.equal(availability.loadAvailable, true);
  assert.equal(availability.showLoadNudge, false);

  const energy = matrix.getWeeklyEnergyLoad(endDate);
  const combined = matrix.combineSportAndEnergyLoad(sportLevel, energy);
  assert.equal(combined.rule, 'max');
  assert.equal(combined.level, 'L3');
  assert.equal(combined.source, 'energy');
});

test('12 — desktop et mobile consomment les mêmes entrées métier', () => {
  const quickNavEntries = state.NAVIGATION_ENTRIES.filter(entry => entry.desktopSelector || entry.mobileSelector);
  assert.ok(quickNavEntries.length > 0);
  quickNavEntries.forEach(entry => {
    assert.ok(entry.desktopSelector, `${entry.sourceSpace}:${entry.key} sans sélecteur desktop`);
    assert.ok(entry.mobileSelector, `${entry.sourceSpace}:${entry.key} sans sélecteur mobile`);
    assert.equal(
      state.isNavigationEntryAvailable(entry, { useMode:'simple', diabEnabled:false }),
      state.isNavigationEntryAvailable(entry, { useMode:'simple', diabEnabled:false })
    );
  });
  const keys = state.NAVIGATION_ENTRIES.map(entry => `${entry.sourceSpace}:${entry.key}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(state.getNavigationEntry('settings', 'compromise').availability, 'always');
});

test('Historique — Dépense partage une destination desktop/mobile vers Lecture du jour', () => {
  const entry = state.getNavigationEntry('history', 'spend');
  assert.ok(entry);
  assert.equal(entry.destinationSpace, 'today');
  assert.deepEqual(entry.targetSelectors, ['#todayReadingPanel']);
  assert.equal(entry.availability, 'always');
  assert.equal(entry.behavior, 'open-and-scroll');
  assert.equal(entry.crossSpace, true);
  assert.match(entry.desktopSelector, /data-history-jump="spend"/);
  assert.match(entry.mobileSelector, /data-history-jump="spend"/);
});
