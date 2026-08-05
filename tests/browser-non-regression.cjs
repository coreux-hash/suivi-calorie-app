const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const appRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const outputRoot = path.resolve(process.argv[3] || path.join(appRoot, 'tests/qa-screenshots/after'));
const captureOnly = process.argv.includes('--capture-only');
const selectedDate = new Date().toISOString().slice(0, 10);

const viewports = [
  { name:'360x800', width:360, height:800 },
  { name:'390x844', width:390, height:844 },
  { name:'768x1024', width:768, height:1024 },
  { name:'859x900', width:859, height:900 },
  { name:'861x900', width:861, height:900 },
  { name:'1366x768', width:1366, height:768 },
  { name:'1440x900', width:1440, height:900 }
];

const baseSettings = {
  sex:'M', age:48, height:182, weight:86,
  watchBrand:'garmin', montre:3000, errPct:0, errMode:'subtract',
  dietMode:'cut_standard', goalPct:85,
  protPerKg:2, fatPerKg:0.9, fatFloorGPerKg:0.9,
  carbGoal:'dry_sport', carbCapGPerKg:4, ratioCP:2.2,
  lowCarbEnabled:true, lowCarbLevel:'moderate',
  useMode:'sport', compromiseId:'cut_sport', diabEnabled:false
};

function isoAdd(dateStr, delta){
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function energyDays(count, { spend = 4000, bmr = 2000 } = {}){
  return Array.from({ length:count }, (_, index) => ({
    date:isoAdd(selectedDate, index - count + 1),
    energyExplicit:true,
    montreRaw:spend,
    montreAdjusted:spend,
    bmr
  }));
}

function fixture({ settings = baseSettings, days = [], profiles, activeProfile = 'default', extraSettings = {} } = {}){
  const profileList = profiles || [{ id:'default', label:'default' }];
  const storage = {
    termsAccepted_v1:'1',
    'secheapp.profiles.v1':JSON.stringify(profileList),
    'secheapp.activeProfile.v1':activeProfile,
    [`secheapp.${activeProfile}.settings.v2`]:JSON.stringify({ ...settings, ...extraSettings }),
    [`secheapp.${activeProfile}.days.v6`]:JSON.stringify(days)
  };
  return storage;
}

function mimeType(filePath){
  const ext = path.extname(filePath).toLowerCase();
  return ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json', '.png':'image/png', '.pdf':'application/pdf' })[ext] || 'application/octet-stream';
}

function startServer(){
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
      const filePath = path.resolve(appRoot, relative);
      if (!filePath.startsWith(appRoot + path.sep) && filePath !== path.join(appRoot, 'index.html')) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) { res.writeHead(404).end('Not found'); return; }
        res.writeHead(200, { 'Content-Type':mimeType(filePath), 'Cache-Control':'no-store' });
        res.end(data);
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function openFixture(browser, origin, storage, viewport){
  const realContext = browser.__scaCdpMode ? browser.contexts()[0] : await browser.newContext({ viewport });
  const page = await realContext.newPage();
  if (browser.__scaCdpMode) await page.setViewportSize(viewport);
  const context = browser.__scaCdpMode ? { close:() => page.close() } : realContext;
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.addInitScript(entries => {
    localStorage.clear();
    sessionStorage.clear();
    Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
  }, storage);
  await page.goto(origin, { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(650);
  return { context, page, pageErrors };
}

async function reservePort(){
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function launchBrowser(){
  if (!process.env.CHROMIUM_EXECUTABLE_PATH) return { browser:await chromium.launch({ headless:true }), process:null };
  const port = await reservePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sca-chromium-'));
  const args = [
    '--headless=shell', '--no-sandbox', '--single-process', '--no-zygote',
    '--disable-setuid-sandbox', '--disable-site-isolation-trials', '--disable-webgl',
    '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`,
    'about:blank'
  ];
  const browserProcess = spawn(process.env.CHROMIUM_EXECUTABLE_PATH, args, { stdio:['ignore', 'ignore', 'pipe'] });
  let browserLog = '';
  browserProcess.stderr.on('data', chunk => { browserLog += String(chunk); });
  const endpoint = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error(`Chromium CDP indisponible.\n${browserLog}`);
  const browser = await chromium.connectOverCDP(endpoint);
  browser.__scaCdpMode = true;
  return { browser, process:browserProcess };
}

async function assertNoHorizontalOverflow(page, label){
  const metrics = await page.evaluate(() => ({
    viewport:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth
  }));
  assert.ok(metrics.scroll <= metrics.viewport + 1, `${label}: débordement horizontal ${metrics.scroll}/${metrics.viewport}`);
}

async function assertSettingsTitlesNotClipped(page, label = 'Réglages'){
  const clipped = await page.evaluate(() => Array.from(document.querySelectorAll(
    '.phase2HeroQuickNav--settings .phase2HeroQuickNav__btn--settings strong'
  )).filter(title => {
    const titleRect = title.getBoundingClientRect();
    const buttonRect = title.closest('button')?.getBoundingClientRect();
    return title.scrollWidth > title.clientWidth + 1
      || !buttonRect
      || titleRect.right > buttonRect.right + 1
      || titleRect.bottom > buttonRect.bottom + 1;
  }).map(title => {
    const titleRect = title.getBoundingClientRect();
    const buttonRect = title.closest('button')?.getBoundingClientRect();
    const style = getComputedStyle(title);
    return {
      text:title.textContent.trim(),
      clientWidth:title.clientWidth,
      scrollWidth:title.scrollWidth,
      titleRight:Math.round(titleRect.right),
      buttonRight:Math.round(buttonRect?.right || 0),
      fontSize:style.fontSize,
      whiteSpace:style.whiteSpace
    };
  }));
  assert.deepEqual(clipped, [], `${label}: titres Réglages rognés: ${JSON.stringify(clipped)}`);
}

async function captureResponsiveSet(browser, origin, storage, prefix){
  for (const viewport of viewports) {
    const { context, page, pageErrors } = await openFixture(browser, origin, storage, viewport);
    await assertNoHorizontalOverflow(page, `${prefix}-${viewport.name}`);
    const active = await page.getAttribute('body', 'data-tab');
    await page.screenshot({ path:path.join(outputRoot, `${prefix}-${viewport.name}-${active || 'unknown'}.png`), fullPage:true });
    for (const space of ['settings', 'history']) {
      await page.evaluate(target => window.__Phase6.NavigationFacade.openTab(target, { delay:0 }), space);
      await page.waitForTimeout(140);
      await assertNoHorizontalOverflow(page, `${prefix}-${viewport.name}-${space}`);
      if (space === 'settings' && !captureOnly) {
        await assertSettingsTitlesNotClipped(page, `${prefix}-${viewport.name}`);
      }
      await page.screenshot({ path:path.join(outputRoot, `${prefix}-${viewport.name}-${space}.png`), fullPage:true });
    }
    assert.deepEqual(pageErrors, [], `${prefix}-${viewport.name}: erreurs JS`);
    await context.close();
  }
}

async function assertInitialRouting(browser, origin){
  const incomplete = fixture({ settings:{ ...baseSettings, age:0, height:0, weight:0, compromiseId:'' } });
  {
    const { context, page, pageErrors } = await openFixture(browser, origin, incomplete, { width:390, height:844 });
    assert.equal(await page.getAttribute('body', 'data-tab'), 'settings');
    assert.equal(await page.getAttribute('#settingsQuickCompromiseBtn', 'aria-disabled'), 'false');
    assert.equal(await page.isDisabled('#settingsQuickCompromiseBtn'), false);
    assert.equal(await page.isDisabled('#settingsJumpFloatPanel [data-settings-jump="compromise"]'), false);
    assert.equal(await page.evaluate(() => window.phase6GetSetupState?.().configurationComplete), false);
    await assertSettingsTitlesNotClipped(page, 'profil-incomplet-390x844');
    await page.screenshot({ path:path.join(outputRoot, 'state-profile-incomplete-390x844-settings.png'), fullPage:true });
    assert.deepEqual(pageErrors, []);
    await context.close();
  }
  {
    const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), { width:1366, height:768 });
    assert.equal(await page.getAttribute('body', 'data-tab'), 'today');
    assert.equal(await page.evaluate(() => document.querySelectorAll('.tabSection.is-active').length), 1);
    assert.equal(await page.evaluate(() => window.phase6GetSetupState?.().configurationComplete), true);
    assert.deepEqual(pageErrors, []);
    await context.close();
  }
}

async function assertLoadStates(browser, origin){
  const scenarios = [
    { name:'no-load', days:[], visible:'1' },
    { name:'sport-present', days:[{ date:selectedDate, sportSessions:[{ id:'run', type:'course', minutes:30, kcal:250 }] }], visible:'0' },
    { name:'d6-of-7', days:energyDays(6), visible:'1' },
    { name:'d7-of-7', days:energyDays(7), visible:'0' }
  ];
  for (const scenario of scenarios) {
    const { context, page, pageErrors } = await openFixture(browser, origin, fixture({ days:scenario.days }), { width:390, height:844 });
    assert.equal(await page.getAttribute('#pilotageSettingsLoadNudge', 'data-onboarding-visible'), scenario.visible, scenario.name);
    assert.equal(await page.getAttribute('#loadSeedNudge', 'data-onboarding-visible'), scenario.visible, scenario.name);
    const availability = await page.evaluate(() => window.__TrainingLoadMatrix?.__state?.availability || null);
    assert.ok(availability, `${scenario.name}: disponibilité absente`);
    assert.equal(availability.showLoadNudge, scenario.visible === '1', scenario.name);
    await page.screenshot({ path:path.join(outputRoot, `state-${scenario.name}-390x844-today.png`), fullPage:true });
    assert.deepEqual(pageErrors, [], `${scenario.name}: erreurs JS`);
    await context.close();
  }
}

async function assertNudgeNavigation(browser, origin, nudgeId, startSpace, viewport){
  const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), viewport);
  if (startSpace !== 'today') {
    await page.evaluate(space => window.__Phase6.NavigationFacade.openTab(space, { delay:0 }), startSpace);
    await page.waitForTimeout(120);
  }
  await page.evaluate(id => document.getElementById(id)?.click(), nudgeId);
  await page.waitForTimeout(220);
  assert.equal(await page.getAttribute('body', 'data-tab'), 'history');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.modal.is-open').length), 0);
  assert.equal(await page.evaluate(() => {
    const panel = document.getElementById('historyMainPanel');
    return !!panel && !panel.classList.contains('hidden');
  }), true);
  await page.screenshot({ path:path.join(outputRoot, `nudge-${nudgeId}-${viewport.width}x${viewport.height}-history.png`), fullPage:true });
  assert.deepEqual(pageErrors, []);
  await context.close();
}

async function assertNavigationParity(browser, origin){
  const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), { width:390, height:844 });
  for (const sourceSpace of ['settings', 'today', 'journalEntry', 'history']) {
    await page.evaluate(space => window.__Phase6.NavigationFacade.openTab(space, { delay:0 }), sourceSpace);
    await page.waitForTimeout(120);
    const mismatches = await page.evaluate(space => {
      const api = window.__SCAStateNavigation;
      return api.getNavigationEntries(space)
        .filter(entry => entry.desktopSelector && entry.mobileSelector)
        .flatMap(entry => {
          const desktop = document.querySelector(entry.desktopSelector);
          const mobile = document.querySelector(entry.mobileSelector);
          const desktopDisabled = desktop?.disabled || desktop?.getAttribute('aria-disabled') === 'true';
          const mobileDisabled = mobile?.disabled || mobile?.getAttribute('aria-disabled') === 'true';
          return !desktop || !mobile || desktopDisabled !== mobileDisabled
            ? [{ key:entry.key, desktop:!!desktop, mobile:!!mobile, desktopDisabled, mobileDisabled }]
            : [];
        });
    }, sourceSpace);
    assert.deepEqual(mismatches, [], `${sourceSpace}: disponibilité desktop/mobile divergente`);
  }

  await page.evaluate(() => window.__Phase6.NavigationFacade.openTab('today', { delay:0 }));
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('.phase2HeroQuickNav--today [data-today-jump="settings"]')?.click());
  await page.waitForTimeout(180);
  assert.equal(await page.getAttribute('body', 'data-tab'), 'settings', 'accès transverse desktop vers Réglages');

  await page.evaluate(() => window.__Phase6.NavigationFacade.openTab('today', { delay:0 }));
  await page.waitForTimeout(80);
  await page.evaluate(() => document.querySelector('#todayJumpFloatPanel [data-today-jump="settings"]')?.click());
  await page.waitForTimeout(180);
  assert.equal(await page.getAttribute('body', 'data-tab'), 'settings', 'accès transverse mobile vers Réglages');
  assert.deepEqual(pageErrors, []);
  await context.close();
}

async function assertHistorySpendNavigation(browser, origin, { selector, viewport, label, mobile = false }){
  const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), viewport);
  await page.evaluate(() => window.__Phase6.NavigationFacade.openTab('history', { delay:0 }));
  await page.waitForTimeout(140);
  const before = await page.evaluate(() => ({
    date:document.getElementById('dayDate')?.value || '',
    days:localStorage.getItem('secheapp.default.days.v6')
  }));

  if (mobile) {
    await page.evaluate(() => document.getElementById('historyMainPanel')?.scrollIntoView());
    await page.waitForTimeout(120);
    await page.locator('#historyJumpFloatToggle').click();
  }
  await page.locator(selector).click();
  await page.waitForTimeout(220);

  assert.equal(await page.getAttribute('body', 'data-tab'), 'today', `${label}: espace Pilotage`);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.modal.is-open').length), 0, `${label}: aucune modale intermédiaire`);
  assert.equal(await page.evaluate(() => {
    const panel = document.getElementById('todayReadingPanel');
    if (!panel || panel.classList.contains('hidden')) return false;
    const rect = panel.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }), true, `${label}: Lecture du jour visible`);
  assert.deepEqual(await page.evaluate(() => ({
    date:document.getElementById('dayDate')?.value || '',
    days:localStorage.getItem('secheapp.default.days.v6')
  })), before, `${label}: date et persistance inchangées`);
  await page.screenshot({ path:path.join(outputRoot, `history-spend-${label}.png`), fullPage:true });
  assert.deepEqual(pageErrors, [], `${label}: erreurs JS`);
  await context.close();
}

async function assertHistoryChargeGuideInfo(browser, origin){
  const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), { width:390, height:844 });
  await page.evaluate(() => window.__Phase6.NavigationFacade.openTab('history', { delay:0 }));
  await page.waitForTimeout(140);
  await page.locator('#historyChargeGuideInfo').click();
  await page.waitForTimeout(80);
  assert.equal(await page.getAttribute('#watchInfoModal', 'aria-hidden'), 'false');
  const text = await page.textContent('#watchInfoBody');
  assert.match(text, /Première utilisation/);
  assert.match(text, /dépense énergétique totale/);
  assert.match(text, /Lors de tes retours/);
  assert.doesNotMatch(text, /calories brûlées/i);
  await page.screenshot({ path:path.join(outputRoot, 'history-charge-guide-info-390x844.png'), fullPage:true });
  assert.deepEqual(pageErrors, []);
  await context.close();
}

async function assertHowItWorksGuide(browser, origin, viewport){
  const label = `${viewport.width}x${viewport.height}`;
  const { context, page, pageErrors } = await openFixture(browser, origin, fixture(), viewport);
  const storageBefore = await page.evaluate(() => JSON.stringify(localStorage));

  const headerButtons = await page.locator('#menuBtn, #btnHeaderOpenPilotageGuide').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width:rect.width, height:rect.height };
  }));
  assert.deepEqual(headerButtons[0], headerButtons[1], `${label}: boutons d’en-tête symétriques`);
  assert.ok(headerButtons[0].width >= 44 && headerButtons[0].height >= 44, `${label}: cible tactile de 44 px`);

  await page.locator('#btnHeaderOpenPilotageGuide').click();
  await page.waitForTimeout(100);
  assert.equal(await page.getAttribute('#pilotagePlanModal', 'aria-hidden'), 'false', `${label}: guide ouvert`);
  assert.equal(await page.textContent('#pilotagePlanTitle'), 'Comment ça marche ?');
  assert.equal(await page.getAttribute('#appUnderstandingModal', 'aria-hidden'), 'true', `${label}: présentation conceptuelle distincte et fermée`);
  const guideText = await page.textContent('#pilotagePlanModal');
  assert.match(guideText, /Commence ici/);
  assert.match(guideText, /Activité \*/);
  assert.match(guideText, /Dépense \*/);
  assert.match(guideText, /Point clignotant/);
  assert.doesNotMatch(guideText, /Flux métier/);
  await assertNoHorizontalOverflow(page, `guide-${label}`);
  await page.screenshot({ path:path.join(outputRoot, `how-it-works-${label}.png`), fullPage:true });

  await page.locator('#pilotageGuideDemoInfo').click();
  await page.waitForTimeout(80);
  assert.equal(await page.getAttribute('#watchInfoModal', 'aria-hidden'), 'false', `${label}: démonstration info-dot ouverte`);
  assert.match(await page.textContent('#watchInfoBody'), /ne modifie jamais tes données/);
  await page.locator('#watchInfoClose').click();
  await page.waitForTimeout(50);
  assert.equal(await page.getAttribute('#pilotagePlanModal', 'aria-hidden'), 'false', `${label}: guide conservé après la démo info-dot`);

  await page.locator('#pilotageGuideSignalDemo').click();
  await page.waitForTimeout(80);
  assert.equal(await page.getAttribute('#watchInfoModal', 'aria-hidden'), 'false', `${label}: démonstration clignotant ouverte`);
  assert.match(await page.textContent('#watchInfoBody'), /Historique → Calendrier/);
  await page.locator('#watchInfoClose').click();
  await page.waitForTimeout(50);

  await page.locator('#pilotagePlanFootClose').click();
  await page.waitForTimeout(50);
  await page.locator('#menuBtn').click();
  await page.locator('#btnMenuOpenPilotagePlan').click();
  await page.waitForTimeout(100);
  assert.equal(await page.getAttribute('#pilotagePlanModal', 'aria-hidden'), 'true', `${label}: guide pratique reste fermé depuis le menu`);
  assert.equal(await page.getAttribute('#appUnderstandingModal', 'aria-hidden'), 'false', `${label}: compréhension autonome ouverte depuis le menu`);
  assert.equal(await page.textContent('#appUnderstandingTitle'), 'Comprendre l’application');
  const understandingText = await page.textContent('#appUnderstandingModal');
  assert.match(understandingText, /Rôle du produit/);
  assert.match(understandingText, /Les 4 espaces/);
  assert.match(understandingText, /Flux métier/);
  assert.match(understandingText, /Orientation par intention/);
  assert.match(understandingText, /Données qui alimentent le moteur/);
  assert.match(understandingText, /dépense automatique ou explicitement renseignée/);
  assert.doesNotMatch(understandingText, /Teste les repères visuels/);
  await assertNoHorizontalOverflow(page, `understanding-${label}`);
  await page.screenshot({ path:path.join(outputRoot, `understand-app-${label}.png`), fullPage:true });
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), storageBefore, `${label}: le guide ne modifie pas les données`);
  assert.deepEqual(pageErrors, [], `${label}: erreurs JS`);
  await context.close();
}

async function assertProfileAndDateDoNotSave(browser, origin){
  const profiles = [{ id:'alpha', label:'Alpha' }, { id:'beta', label:'Beta' }];
  const storage = fixture({ activeProfile:'alpha', profiles, days:energyDays(1) });
  storage['secheapp.beta.settings.v2'] = JSON.stringify({ ...baseSettings, age:0, compromiseId:'' });
  const { context, page, pageErrors } = await openFixture(browser, origin, storage, { width:768, height:1024 });
  const alphaBefore = await page.evaluate(() => localStorage.getItem('secheapp.alpha.days.v6'));
  await page.evaluate(() => window.__Phase6.NavigationFacade.openTab('settings', { delay:0 }));
  await page.waitForTimeout(120);
  await page.selectOption('#profileSelect', 'beta');
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => localStorage.getItem('secheapp.activeProfile.v1')), 'beta');
  assert.equal(await page.inputValue('#compromiseSelect'), '');
  assert.equal(await page.evaluate(() => window.phase6GetSetupState?.().configurationComplete), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('secheapp.alpha.days.v6')), alphaBefore);
  assert.equal(await page.evaluate(() => localStorage.getItem('secheapp.beta.days.v6')), null);

  const betaBeforeDateChange = await page.evaluate(() => localStorage.getItem('secheapp.beta.days.v6'));
  await page.evaluate(() => {
    const date = document.getElementById('dayDate');
    date.value = '2026-08-03';
    date.dispatchEvent(new Event('change', { bubbles:true }));
  });
  await page.waitForTimeout(220);
  assert.equal(await page.evaluate(() => localStorage.getItem('secheapp.beta.days.v6')), betaBeforeDateChange);
  assert.equal(await page.evaluate(() => window.__scaEnergyExplicitCommitDate || ''), '');
  assert.deepEqual(pageErrors, []);
  await context.close();
}

async function main(){
  fs.mkdirSync(outputRoot, { recursive:true });
  const server = await startServer();
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}/`;
  let browser;
  let browserProcess;
  try {
    ({ browser, process:browserProcess } = await launchBrowser());
    await captureResponsiveSet(browser, origin, fixture(), 'responsive-complete-no-load');
    if (!captureOnly) {
      await assertInitialRouting(browser, origin);
      await assertLoadStates(browser, origin);
      for (const viewport of [{ width:390, height:844 }, { width:1366, height:768 }]) {
        await assertNudgeNavigation(browser, origin, 'pilotageSettingsLoadNudge', 'today', viewport);
        await assertNudgeNavigation(browser, origin, 'loadSeedNudge', 'settings', viewport);
      }
      await assertNavigationParity(browser, origin);
      await assertHistorySpendNavigation(browser, origin, {
        selector:'.phase2HeroQuickNav--history [data-history-jump="spend"]',
        viewport:{ width:1366, height:768 },
        label:'desktop-1366x768'
      });
      await assertHistorySpendNavigation(browser, origin, {
        selector:'#historyJumpFloatPanel [data-history-jump="spend"]',
        viewport:{ width:390, height:844 },
        label:'mobile-390x844',
        mobile:true
      });
      await assertHistoryChargeGuideInfo(browser, origin);
      await assertHowItWorksGuide(browser, origin, { width:390, height:844 });
      await assertHowItWorksGuide(browser, origin, { width:1366, height:768 });
      await assertProfileAndDateDoNotSave(browser, origin);
    }
  } finally {
    if (browser) await browser.close();
    if (browserProcess && !browserProcess.killed) browserProcess.kill('SIGTERM');
    await new Promise(resolve => server.close(resolve));
  }
  console.log(`QA navigateur réussie — captures: ${outputRoot}`);
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
