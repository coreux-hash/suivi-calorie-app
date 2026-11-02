/* QA navigateur — surface mobile « Aujourd'hui » (v23).
   Verrouille : modales affichables sur mobile (CGU), essentiel Activité honnête,
   Dépense confirmable sans changer la valeur, Rapide /100 g accessible en mode Simple,
   décompte visible, ordre des cartes Réglages, cycle mobile → desktop → mobile.
   Lancer : node tests/mobile-daily-surface.cjs (Playwright + Chromium requis). */
const path = require('path');
const http = require('http');
const fs = require('fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const appRoot = path.resolve(__dirname, '..');
const today = new Date().toISOString().slice(0, 10);
const MOBILE = { width:390, height:844 };
const DESKTOP = { width:1280, height:800 };

const simpleSettings = {
  sex:'M', age:48, height:182, weight:86, watchBrand:'custom', montre:2600, errPct:0, errMode:'subtract',
  dietMode:'cut_standard', goalPct:85, protPerKg:2, fatPerKg:0.9, fatFloorGPerKg:0.9,
  carbGoal:'dry_sport', carbCapGPerKg:4, ratioCP:2.2, lowCarbEnabled:false,
  useMode:'simple', compromiseId:'cut_sport', diabEnabled:false
};
function fixture(settings, days = []){
  return {
    termsAccepted_v1:'1',
    'secheapp.profiles.v1':JSON.stringify([{ id:'default', label:'default' }]),
    'secheapp.activeProfile.v1':'default',
    'secheapp.default.settings.v2':JSON.stringify(settings),
    'secheapp.default.days.v6':JSON.stringify(days)
  };
}
function mimeType(p){ const e = path.extname(p).toLowerCase(); return ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.webmanifest':'application/manifest+json' })[e] || 'application/octet-stream'; }
function startServer(){
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const filePath = path.resolve(appRoot, rel);
      if (!filePath.startsWith(appRoot + path.sep)) { res.writeHead(403).end(); return; }
      fs.readFile(filePath, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'Content-Type':mimeType(filePath), 'Cache-Control':'no-store' }); res.end(data); });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
async function open(browser, origin, storage, viewport){
  const context = await browser.newContext({ viewport, isMobile:viewport.width < 861, hasTouch:viewport.width < 861 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**', (r) => r.abort());
  await page.addInitScript((entries) => { localStorage.clear(); sessionStorage.clear(); Object.entries(entries).forEach(([k, v]) => localStorage.setItem(k, v)); }, storage);
  await page.goto(origin, { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(900);
  return { context, page, pageErrors };
}
const display = (page, sel) => page.$eval(sel, (e) => getComputedStyle(e).display);
const days = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('secheapp.default.days.v6') || '[]'));
const count = (page) => page.$eval('#mobileDailyCount', (e) => e.textContent.replace(/\s+/g, ''));
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const results = [];
function ok(name){ results.push(`✔ ${name}`); console.log(`✔ ${name}`); }

(async () => {
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  try {
    /* 1. Premier lancement mobile : la modale CGU doit être visible et acceptable. */
    {
      const { context, page, pageErrors } = await open(browser, origin, {}, MOBILE);
      assert.equal(await page.$eval('#termsGateModal', (e) => e.classList.contains('is-open')), true, 'CGU ouverte au boot');
      assert.equal(await display(page, '#termsGateModal'), 'block', 'CGU affichée (display:block) à 390px');
      assert.equal(await page.isVisible('#ackTerms'), true, '#ackTerms visible');
      await page.check('#ackTerms');
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => localStorage.getItem('termsAccepted_v1')), '1', 'CGU acceptées persistées');
      assert.equal(await page.$eval('html', (h) => h.classList.contains('app-locked')), false, 'app déverrouillée');
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('CGU acceptable sur mobile au premier lancement');
      /* Ordre des cartes Réglages : Mes informations avant Utilisateurs. */
      const infosTop = await page.$eval('.settingsCardInfos', (e) => e.getBoundingClientRect().top);
      const usersTop = await page.$eval('.settingsCardUsers', (e) => e.getBoundingClientRect().top);
      assert.ok(infosTop < usersTop, `Mes informations (${infosTop}) doit précéder Utilisateurs (${usersTop})`);
      ok('Réglages mobile : « Mes informations » avant « Utilisateurs »');
      /* Menu → Aide : modale affichée. */
      await page.click('#menuBtn'); await page.waitForTimeout(200);
      await page.click('#btnMobileMenuOpenHelp'); await page.waitForTimeout(300);
      assert.equal(await display(page, '#settingsHelpModal'), 'block', 'modale Aide affichée');
      ok('Menu mobile → Aide ouvre une modale visible');
      await context.close();
    }

    /* 2. Profil complet, mode Simple : parcours d'encodage honnête. */
    {
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings), MOBILE);
      assert.equal(await page.$eval('body', (b) => b.dataset.tab), 'today');
      assert.equal(await page.$eval('body', (b) => b.dataset.usemode), 'simple');
      assert.equal(await count(page), '0/3', 'journée vide = 0/3');
      /* Décompte visible avant toute saisie (cible calculée). */
      assert.equal(await page.isVisible('#mobileDailyRemaining'), true, 'décompte visible');
      assert.match(await page.$eval('#mobileDailyRemaining', (e) => e.textContent), /Reste\s+\d+\s*kcal/, 'décompte = Reste N kcal');
      const rest0 = Number((await page.$eval('#mobileDailyRemaining strong', (e) => e.textContent)).replace(/\D/g, ''));
      /* Activité : carte non vide en mode Simple. */
      await page.click('[data-mobile-action="activity"]'); await page.waitForTimeout(300);
      assert.equal(await page.isVisible('#btnSportAdd'), true, 'bouton « Ajouter une séance » visible en mode Simple');
      assert.equal(await page.$eval('#sportCard', (e) => e.getAttribute('data-um')), 'mobile', 'data-um neutralisé sur mobile');
      ok('Activité : carte utilisable en mode Simple');
      /* Repas (manuel) : 0/3 → 1/3, Activité reste non cochée. */
      await page.click('[data-mobile-action="meals"]'); await page.waitForTimeout(300);
      await page.fill('#mealName', 'Test'); await page.fill('#mealK', '500'); await page.fill('#mealP', '30'); await page.fill('#mealC', '50'); await page.fill('#mealF', '15');
      await page.click('#btnAddMeal'); await page.waitForTimeout(500);
      assert.equal(await count(page), '1/3', 'un repas = 1/3 (Activité non cochée)');
      assert.equal(await page.$eval('#mobileDailyActivityCard', (e) => e.dataset.complete), 'false', 'Activité non complète sans séance');
      const rest1 = Number((await page.$eval('#mobileDailyRemaining strong', (e) => e.textContent)).replace(/\D/g, ''));
      assert.equal(rest1, rest0 - 500, `décompte décrémenté de 500 (${rest0} → ${rest1})`);
      ok('Repas : compteur 1/3 et décompte décrémenté');
      /* Rapide /100 g accessible en mode Simple. */
      await page.click('#mealModeQuick'); await page.waitForTimeout(200);
      assert.equal(await display(page, '#mealPanelQuick'), 'block', 'panneau Rapide affiché en Simple');
      assert.equal(await display(page, '#mealPanelQuickLocked'), 'none', 'aperçu verrouillé jamais affiché');
      await page.fill('#mealName', 'Étiquette'); await page.fill('#qKcal100', '100'); await page.fill('#qWeight', '200');
      await page.click('#btnQuickAddMeal'); await page.waitForTimeout(500);
      const d = await days(page);
      assert.equal(d[0].meals.length, 2, 'deux repas enregistrés');
      assert.equal(d[0].meals[1].k, 200, 'repas étiquette = 200 kcal');
      ok('Rapide /100 g : utilisable en mode Simple, calcul correct');
      /* Dépense : confirmation 1 tap sans changer la valeur. */
      await page.click('[data-mobile-action="spend"]'); await page.waitForTimeout(300);
      assert.equal(await page.$eval('#todaySpendEdit', (e) => e.value), '2600');
      assert.equal(await page.isVisible('#mobileDailySpendConfirm'), true, 'bouton Confirmer visible');
      await page.click('#mobileDailySpendConfirm'); await page.waitForTimeout(600);
      const d2 = await days(page);
      assert.equal(d2[0].energyExplicit, true, 'dépense explicite après confirmation');
      assert.equal(d2[0].montreRaw, 2600, 'valeur inchangée');
      assert.equal(await count(page), '2/3', 'repas + dépense = 2/3');
      assert.equal(await page.isVisible('#mobileDailySpendConfirm'), false, 'bouton masqué une fois confirmé');
      assert.doesNotMatch(await page.$eval('#mobileDailySpendCard', (e) => e.textContent), /kcal kcal/, 'plus de « kcal kcal »');
      ok('Dépense : confirmable en 1 tap, valeur inchangée, explicite');
      assert.equal(await overflowX(page), 0, 'aucun débordement horizontal');
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      await context.close();
    }

    /* 3. Journée avec séance : Activité = 3/3 uniquement avec une vraie séance. */
    {
      const day = { date:today, meals:[{ id:'m1', name:'A', k:500, p:30, c:50, f:15 }], energyExplicit:true, montreRaw:2600, montreAdjusted:2600, sportSessions:[{ id:'s1', type:'course', minutes:30, kcal:300 }], sport:{ minutes:30, kcal:300 } };
      const { context, page } = await open(browser, origin, fixture(simpleSettings, [day]), MOBILE);
      assert.equal(await count(page), '3/3', 'repas + dépense + séance = 3/3');
      await context.close();
    }

    /* 3b. Repas récents (v23.2) : déduits des journées passées, ajout en 1 tap, dédoublonnés. */
    {
      const d1 = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const d2 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
      const past = [
        { date:d2, meals:[{ id:'a', name:'Petit-déj', k:400, p:20, c:50, f:12 }, { id:'b', name:'Pâtes', k:700, p:25, c:100, f:15 }] },
        { date:d1, meals:[{ id:'c', name:'petit-déj', k:450, p:22, c:55, f:14 }, { id:'d', name:'Repas', k:300, p:10, c:30, f:10 }, { id:'e', name:'Repas', k:600, p:30, c:60, f:20 }] }
      ];
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings, past), MOBILE);
      assert.equal(await count(page), '0/3');
      await page.click('[data-mobile-action="meals"]'); await page.waitForTimeout(300);
      /* v24.6 : liste combinée au champ « Ce que tu as mangé » (chevron = select invisible) ; choisir remplit le formulaire ; corbeille = repas dont le nom est dans le champ. */
      assert.equal(await page.$eval('#mobileDailyRecentMeals .mobileDailyRecentMeals__field', (e) => e.contains(document.getElementById('mealName'))), true, 'le champ du nom est dans la cellule combinée');
      assert.equal(await page.$eval('#mobileDailyRecentMeals', (e) => e.dataset.empty), '0');
      assert.equal(await page.isVisible('#mobileDailyRecentMeals .mobileDailyRecentMeals__chevron'), true, 'chevron visible');
      const options = () => page.$$eval('#mobileDailyRecentMealSelect option', (els) => els.map((e) => e.textContent));
      assert.deepEqual(await options(), ['Tes habitudes…', 'Repas · 600 kcal', 'Repas · 300 kcal', 'petit-déj · 450 kcal', 'Pâtes · 700 kcal'], `récents dédoublonnés, plus récents d'abord (${(await options()).join(', ')})`);
      assert.equal(await page.$eval('#mobileDailyRecentMealForget', (e) => e.disabled), true, 'corbeille inactive sans choix');
      await page.selectOption('#mobileDailyRecentMealSelect', '3'); await page.waitForTimeout(100);
      assert.equal(await page.$eval('#mealName', (e) => e.value), 'Pâtes', 'choisir met le nom dans le champ');
      assert.equal(await page.$eval('#mobileDailyRecentMealSelect', (e) => e.value), '', 'la liste revient sur l\'invite');
      assert.equal(await page.$eval('#mobileDailyRecentMealForget', (e) => e.disabled), false, 'corbeille active : le champ contient un repas habituel');
      await page.click('#mobileDailyRecentMealForget'); await page.waitForTimeout(300);
      assert.deepEqual(await options(), ['Tes habitudes…', 'Repas · 600 kcal', 'Repas · 300 kcal', 'petit-déj · 450 kcal'], 'repas oublié retiré de la liste');
      assert.match(await page.textContent('#mobileDailyRecentMealNote'), /« Pâtes » : oublié jusqu’à une future note\./);
      assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('secheapp.default.forgottenMeals.v1'))), { 'pâtes':d2 }, 'oubli stocké par profil avec la date de la dernière note');
      assert.deepEqual(await days(page), past, 'oublier ne modifie pas l\'historique');
      assert.equal(await page.$eval('#mobileDailyRecentMealForget', (e) => e.disabled), true, 'corbeille inactive : « Pâtes » n\'est plus une habitude');
      await page.fill('#mealName', 'petit-déj'); await page.waitForTimeout(100);
      assert.equal(await page.$eval('#mobileDailyRecentMealForget', (e) => e.disabled), false, 'taper un nom connu active la corbeille');
      await page.selectOption('#mobileDailyRecentMealSelect', '2'); await page.waitForTimeout(150);
      assert.deepEqual(await page.$$eval('#mealName, #mealK, #mealP, #mealC, #mealF', (els) => els.map((e) => e.value)), ['petit-déj', '450', '22', '55', '14'], 'choisir remplit le formulaire');
      assert.equal(await page.$eval('#mealModeManual', (e) => e.classList.contains('is-active')), true, 'onglet Les valeurs actif');
      assert.equal(await count(page), '0/3', 'choisir n\'ajoute rien');
      await page.click('#btnAddMeal'); await page.waitForTimeout(500);
      const d = await days(page);
      const todayDay = d.find((x) => x.date === today);
      assert.ok(todayDay, 'journée du jour créée par l\'ajout');
      assert.equal(todayDay.meals.length, 1);
      assert.deepEqual([todayDay.meals[0].name, todayDay.meals[0].k, todayDay.meals[0].p, todayDay.meals[0].c, todayDay.meals[0].f], ['petit-déj', 450, 22, 55, 14], 'repas ajouté tel quel');
      assert.equal(await count(page), '1/3', 'ajout = 1/3');
      assert.equal(await page.$eval('#mealName', (e) => e.value), '', 'formulaire vidé après ajout (chemin legacy)');
      assert.equal(await page.$eval('#mobileDailyRecentMealSelect', (e) => e.value), '', 'liste remise sur l\'invite après ajout');
      /* Une note ultérieure (aujourd'hui > d2) ramène le repas oublié. */
      await page.fill('#mealName', 'Pâtes'); await page.fill('#mealK', '700'); await page.click('#btnAddMeal'); await page.waitForTimeout(500);
      assert.deepEqual(await options(), ['Tes habitudes…', 'Pâtes · 700 kcal', 'petit-déj · 450 kcal', 'Repas · 600 kcal', 'Repas · 300 kcal'], 'repas oublié de retour après une nouvelle note');
      assert.equal(await overflowX(page), 0);
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Repas habituels : cellule combinée, choisir remplit, Ajouter ce repas, corbeille réversible');
      /* Journée vide et aucun historique : bloc masqué. */
      await context.close();
      const empty = await open(browser, origin, fixture(simpleSettings), MOBILE);
      await empty.page.click('[data-mobile-action="meals"]'); await empty.page.waitForTimeout(300);
      assert.equal(await empty.page.$eval('#mobileDailyRecentMeals', (e) => e.dataset.empty), '1', 'sans historique : champ texte simple');
      assert.equal(await empty.page.isVisible('#mobileDailyRecentMeals .mobileDailyRecentMeals__chevron'), false, 'pas de chevron sans historique');
      await empty.context.close();
    }

    /* 3d. v23.4 : chaîne Dépense lisible, cible dans l'en-tête, préremplissage par nom. */
    {
      const prudent = { ...simpleSettings, montre:4000, errPct:20, errMode:'conservative', goalPct:92 };
      const d1 = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const past = [{ date:d1, meals:[{ id:'a', name:'Petit déj', k:420, p:21, c:52, f:13 }] }];
      const { context, page, pageErrors } = await open(browser, origin, fixture(prudent, past), MOBILE);
      const chain = await page.$eval('#mobileDailySpendChain', (e) => ({ hidden:e.hidden, text:e.textContent.replace(/\s+/g, ' ').trim() }));
      assert.equal(chain.hidden, false, 'chaîne affichée');
      assert.match(chain.text, /^Ta montre dit 4000, l’app retient 3200 kcal ℹ️$/, `chaîne lisible (${chain.text})`);
      const dot = await page.$eval('#mobileDailySpendChain .info-dot', (e) => ({ role:e.getAttribute('role'), text:e.getAttribute('data-modaltext') }));
      assert.equal(dot.role, 'button');
      assert.match(dot.text, /Marge de sécurité : −20 %/, 'explication de la prudence dans l\'info-dot');
      await page.click('#mobileDailySpendChain .info-dot'); await page.waitForTimeout(300);
      assert.equal(await display(page, '#watchInfoModal'), 'block', 'info-dot ouvre la modale');
      await page.evaluate(() => document.querySelector('#watchInfoModal').classList.remove('is-open'));
      assert.equal(await page.$eval('#mobileDailySpendSlot .phase1PulseMeta', (e) => getComputedStyle(e).display), 'none', 'ligne legacy masquée sur mobile');
      const head = await page.$eval('#mobileDailyRemaining', (e) => e.textContent.replace(/\s+/g, ' ').trim());
      assert.match(head, /^Reste \d+ kcal sur cible de \d+ kcal$/, `en-tête (${head})`);
      const target = Number(head.match(/cible de (\d+)/)[1]);
      assert.equal(target, 2944, 'cible = 92 % de 3200');
      /* Préremplissage par nom (casse ignorée), sans ajout. */
      await page.click('[data-mobile-action="meals"]'); await page.waitForTimeout(300);
      await page.fill('#mealName', 'petit DÉJ'); await page.waitForTimeout(100);
      assert.deepEqual(await page.$$eval('#mealK, #mealP, #mealC, #mealF', (els) => els.map((e) => e.value)), ['420', '21', '52', '13'], 'valeurs préremplies');
      assert.equal(await count(page), '0/3', 'rien ajouté');
      /* Valeurs déjà saisies : pas d'écrasement. */
      await page.fill('#mealName', ''); await page.fill('#mealK', '999'); await page.fill('#mealName', 'petit déj'); await page.waitForTimeout(100);
      assert.equal(await page.$eval('#mealK', (e) => e.value), '999', 'valeur saisie conservée');
      /* Sans prudence : chaîne courte. */
      await context.close();
      const plain = await open(browser, origin, fixture({ ...simpleSettings, errPct:0 }), MOBILE);
      assert.match(await plain.page.$eval('#mobileDailySpendChain', (e) => e.textContent), /L’app retient 2600 kcal/, 'chaîne courte sans prudence');
      assert.equal(await plain.page.$('#mobileDailySpendChain .info-dot'), null, 'pas d\'info-dot sans prudence');
      await plain.context.close();
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Dépense : chaîne lisible ; en-tête avec cible ; préremplissage par nom');
    }

    /* 3e. v23.5 : volets refermables ; libellés mesures scindés ; carte Montre raccourcie. */
    {
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings), MOBILE);
      assert.equal(await page.$eval('#mobileDailySpendSlot', (e) => e.hidden), false, 'Dépense ouverte au départ');
      await page.tap('[data-mobile-action="spend"]'); await page.waitForTimeout(200);
      assert.equal(await page.$eval('#mobileDailySpendSlot', (e) => e.hidden), true, 're-tap referme le volet');
      assert.equal(await page.$eval('[data-mobile-action="spend"]', (e) => e.getAttribute('aria-expanded')), 'false');
      await page.tap('[data-mobile-action="spend"]'); await page.waitForTimeout(200);
      assert.equal(await page.$eval('#mobileDailySpendSlot', (e) => e.hidden), false, 'tap rouvre le volet');
      await page.tap('[data-mobile-action="meals"]'); await page.waitForTimeout(200);
      assert.equal(await page.$eval('#mobileDailySpendSlot', (e) => e.hidden), true, 'un seul volet ouvert');
      /* Mesures : nom + unité, une ligne, cellules alignées. */
      await page.click('#mobileDailyMore summary'); await page.waitForTimeout(300);
      const labels = await page.$$eval('#phase3BodyCompGrid .accTile label', (els) => els.map((e) => ({ text:e.textContent.trim(), unit:e.querySelector('.mobileLabelUnit')?.textContent, h:Math.round(e.getBoundingClientRect().height) })));
      assert.deepEqual(labels.map((l) => l.text), ['Masse grasse (%)', 'Masse musculaire (%)', 'Masse osseuse (kg)'], 'texte des libellés inchangé');
      assert.deepEqual(labels.map((l) => l.unit), ['(%)', '(%)', '(kg)'], 'unités conservées');
      assert.ok(labels.every((l) => l.h === labels[0].h && l.h < 30), `libellés sur une ligne, même hauteur (${labels.map((l) => l.h)})`);
      const tops = await page.$$eval('#fatPct, #musclePct, #boneKg', (els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      assert.ok(tops.every((v) => v === tops[0]), `cellules alignées (${tops})`);
      /* Carte Montre : libellés courts, aides masquées, info-dot conservé. */
      await page.click('#menuBtn'); await page.waitForTimeout(200); await page.click('[data-mobile-menu-view="settings"]'); await page.waitForTimeout(300);
      await page.click('[data-mobile-setup="watch"]'); await page.waitForTimeout(400);
      const watchLabels = await page.$$eval('.mobileWatchCard label', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim()));
      assert.deepEqual(watchLabels, ['Ta montre', 'Kcal / jour'], `libellés courts en mode Simple (${watchLabels.join(' | ')})`);
      assert.equal(await page.$eval('#errPct', (e) => e.parentElement.querySelector('label').textContent), 'Marge (%)', 'libellé court même hors affichage');
      assert.equal(await page.$eval('#watchProfileInfo', (e) => e.closest('.muted').classList.contains('mobileWatchHint')), false, 'aide portant l\'info-dot non masquée');
      assert.equal(await page.$$eval('.mobileWatchCard .mobileWatchHint', (els) => els.filter((e) => e.getBoundingClientRect().height > 0).length), 0, 'aides masquées');
      /* Retour desktop : libellés d'origine. */
      await page.setViewportSize(DESKTOP); await page.waitForTimeout(500);
      assert.equal(await page.$eval('#watchBrand', (e) => e.parentElement.querySelector('label').textContent), 'Ta montre', 'libellé restauré sur desktop');
      assert.equal(await page.$eval('#fatPct', (e) => e.previousElementSibling.textContent.trim()), 'Masse grasse (%)');
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Volets refermables ; libellés mesures nom+unité ; carte Montre raccourcie');
      await context.close();
    }

    /* 3c. Menu burger → Réglages ferme le menu ; tiroir Contexte : croix et tap extérieur (v23.3). */
    {
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings), MOBILE);
      const menuOpen = () => page.$eval('#menuPanel', (e) => e.classList.contains('is-open'));
      await page.tap('#menuBtn'); await page.waitForTimeout(200);
      assert.equal(await menuOpen(), true);
      await page.tap('[data-mobile-menu-view="settings"]'); await page.waitForTimeout(400);
      assert.equal(await menuOpen(), false, 'menu fermé après Réglages');
      assert.equal(await page.$eval('#mobileDailySettings', (e) => e.hidden), false, 'vue Réglages affichée');
      const drawerOpen = () => page.$eval('#phase5StatusBar', (e) => e.classList.contains('is-open'));
      await page.tap('#mobileDailyContextBtn'); await page.waitForTimeout(300);
      assert.equal(await drawerOpen(), true, 'tiroir ouvert');
      assert.equal(await page.isVisible('.mobileDailyDrawerClose'), true, 'croix visible');
      await page.tap('.mobileDailyDrawerClose'); await page.waitForTimeout(300);
      assert.equal(await drawerOpen(), false, 'tiroir fermé par la croix');
      await page.tap('#mobileDailyContextBtn'); await page.waitForTimeout(300);
      assert.equal(await drawerOpen(), true);
      await page.touchscreen.tap(30, 700); await page.waitForTimeout(300); /* zone hors tiroir */
      assert.equal(await drawerOpen(), false, 'tiroir fermé par un tap extérieur');
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Menu → Réglages ferme le menu ; tiroir Contexte : croix et tap extérieur');
      await context.close();
    }

    /* 3f. v24.4 : « Comment ça marche » cachés dans les cartes, regroupés dans la fenêtre du menu ;
       étapes « Ce que tu vises » et « Façon de manger » scindées. */
    {
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings), MOBILE);
      const visibleTutos = await page.$$eval('details.notice', (els) => els.filter((d) => /^(Mini-tuto|Comment ça marche)/.test(d.querySelector('summary')?.textContent.trim() || '') && d.getBoundingClientRect().height > 0).length);
      assert.equal(visibleTutos, 0, 'aucun « Comment ça marche » visible dans les cartes');
      await page.click('#menuBtn'); await page.waitForTimeout(200);
      assert.equal(await page.isVisible('#btnMobileMenuOpenTuto'), true, 'entrée « Comment ça marche ici » dans le menu mobile');
      await page.click('#btnMobileMenuOpenTuto'); await page.waitForTimeout(300);
      assert.equal(await page.getAttribute('#settingsTutoModal', 'aria-hidden'), 'false', 'fenêtre ouverte');
      assert.equal(await page.textContent('#settingsTutoTitle'), 'Comment ça marche — Aujourd’hui');
      assert.deepEqual(await page.$$eval('.phase5TutoCard__title', (els) => els.map((e) => e.textContent)), ['Dépense', 'Repas', 'Synthèse'], 'tutos de la vue Aujourd’hui');
      await page.evaluate(() => document.querySelector('#settingsTutoModal .modal__backdrop').click()); await page.waitForTimeout(200);
      await page.click('#menuBtn'); await page.waitForTimeout(200); await page.click('[data-mobile-menu-view="settings"]'); await page.waitForTimeout(400);
      const headsFor = async (key) => {
        await page.evaluate((k) => { const slot = document.getElementById('mobileDailySettingsSlot'); if (slot.hidden || slot.dataset.mobileSettingsOpen !== k) document.querySelector(`[data-mobile-setup="${k}"]`).click(); }, key);
        await page.waitForTimeout(250);
        return page.$$eval('#mobileDailySettingsSlot h2, #mobileDailySettingsSlot label', (els) => els.filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.textContent.replace(/\s+/g, ' ').trim().replace(/ ℹ️$/, '')));
      };
      const compromise = await headsFor('compromise');
      assert.ok(compromise.includes('Je vise') && !compromise.includes('Ta façon de manger'), `étape Ce que tu vises = le choix seul (${compromise.join(' | ')})`);
      const goals = await headsFor('goals');
      assert.ok(goals.includes('Ta façon de manger') && !goals.includes('Je vise') && !goals.includes('Ce que tu vises'), `étape Façon de manger = sans le choix (${goals.join(' | ')})`);
      await page.click('#menuBtn'); await page.waitForTimeout(200); await page.click('#btnMobileMenuOpenTuto'); await page.waitForTimeout(300);
      assert.deepEqual(await page.$$eval('.phase5TutoCard__title', (els) => els.map((e) => e.textContent)), ['Profil', 'Dépense', 'Objectif', 'Sport et objectif', 'Cadrage glucidique'], 'tutos de Mon cadre (Objectif et Sport et objectif distincts)');
      assert.equal(await overflowX(page), 0);
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Comment ça marche : cachés des cartes, fenêtre menu par vue ; étapes 3/4 scindées');
      await context.close();
    }

    /* 4. Cycle mobile → desktop → mobile : restauration de data-um et du bouton. */
    {
      const { context, page, pageErrors } = await open(browser, origin, fixture(simpleSettings), MOBILE);
      assert.equal(await page.$eval('#sportCard', (e) => e.getAttribute('data-um')), 'mobile');
      await page.setViewportSize(DESKTOP); await page.waitForTimeout(500);
      assert.equal(await page.$eval('#sportCard', (e) => e.getAttribute('data-um')), 'sport', 'data-um restauré sur desktop');
      assert.equal(await page.$eval('.phase2JournalPanel--activity', (e) => e.classList.contains('hidden')), true, 'desktop Simple : panneau Activité masqué par le registre, comme en v22');
      assert.equal(await page.$eval('.phase2JournalPanel--activity', (e) => e.getAttribute('aria-hidden')), 'true');
      assert.equal(await page.$('#mobileDailySpendConfirm'), null, 'bouton Confirmer retiré sur desktop');
      assert.equal(await page.$('#mobileDailyRecentMeals'), null, 'bloc Récents retiré sur desktop');
      assert.equal(await page.$eval('#mobileDailyApp', (e) => e.hidden), true);
      await page.setViewportSize(MOBILE); await page.waitForTimeout(500);
      assert.equal(await page.$eval('#sportCard', (e) => e.getAttribute('data-um')), 'mobile', 'data-um neutralisé à nouveau');
      assert.equal(await page.$eval('.phase2JournalPanel--activity', (e) => e.classList.contains('hidden')), false, 'panneau Activité révélé à nouveau');
      assert.equal(await page.$('#mobileDailySpendConfirm') !== null, true, 'bouton Confirmer recréé');
      assert.equal(pageErrors.length, 0, `erreurs JS: ${pageErrors.join(' | ')}`);
      ok('Cycle mobile → desktop → mobile sans résidu');
      await context.close();
    }

    /* 5. Desktop, premier lancement : CGU visible (inchangé). */
    {
      const { context, page } = await open(browser, origin, {}, DESKTOP);
      assert.equal(await display(page, '#termsGateModal'), 'block');
      assert.equal(await page.isVisible('#ackTerms'), true);
      ok('Desktop : CGU visible au premier lancement (inchangé)');
      await context.close();
    }

    console.log(`\nQA surface mobile réussie (${results.length} groupes).`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => { console.error('ÉCHEC QA surface mobile :', error); process.exit(1); });
