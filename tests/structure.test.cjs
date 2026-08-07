const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(appRoot, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const state = require(path.join(appRoot, 'js/legacy/legacy-app-state-navigation.js'));
const applicationSource = html + '\n' + walk(path.join(appRoot, 'js'), '.js')
  .filter(file => !file.endsWith('legacy-app-state-navigation.js'))
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

function walk(directory, extension){
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target, extension);
    return entry.isFile() && target.endsWith(extension) ? [target] : [];
  });
}

function stripCssCommentsAndStrings(css){
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
}

function countToken(value, token){
  return Array.from(value).filter(character => character === token).length;
}

function selectorAnchor(selector){
  const id = selector.match(/#([\w-]+)/)?.[1];
  if (id) return id;
  const data = selector.match(/\[(data-[\w-]+)="([^"]+)"\]/);
  if (data) return `${data[1]}="${data[2]}"`;
  const cssClass = selector.match(/\.([\w-]+)/)?.[1];
  return cssClass ? cssClass : '';
}

test('syntaxe de tous les scripts JavaScript', () => {
  const scripts = walk(path.join(appRoot, 'js'), '.js');
  assert.ok(scripts.length > 0);
  scripts.forEach(file => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding:'utf8' });
    assert.equal(result.status, 0, `${path.relative(appRoot, file)}\n${result.stderr}`);
  });
});

test('identifiants HTML uniques', () => {
  const ids = Array.from(html.matchAll(/\sid=["']([^"']+)["']/g), match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(Array.from(new Set(duplicates)), []);
});

test('scripts et feuilles de style locales HTML présents', () => {
  const refs = [
    ...Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/g), match => match[1]),
    ...Array.from(html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g), match => match[1])
  ].filter(ref => !/^(?:https?:|data:|#)/.test(ref));
  refs.forEach(ref => {
    const clean = ref.split(/[?#]/, 1)[0];
    assert.ok(fs.existsSync(path.join(appRoot, clean)), `ressource absente: ${ref}`);
  });
});

test('accolades CSS équilibrées', () => {
  const stylesheets = walk(path.join(appRoot, 'css'), '.css');
  stylesheets.forEach(file => {
    const css = stripCssCommentsAndStrings(fs.readFileSync(file, 'utf8'));
    assert.equal(
      countToken(css, '{'),
      countToken(css, '}'),
      `déséquilibre CSS: ${path.relative(appRoot, file)}`
    );
  });
});

test('sélecteurs principaux du registre ancrés dans le HTML', () => {
  state.NAVIGATION_ENTRIES.forEach(entry => {
    [entry.desktopSelector, entry.mobileSelector, ...(entry.controlSelectors || [])]
      .filter(Boolean)
      .forEach(selector => {
        const anchor = selectorAnchor(selector);
        assert.ok(anchor && applicationSource.includes(anchor), `${entry.sourceSpace}:${entry.key} — sélecteur orphelin: ${selector}`);
      });
  });
});

test('dépendance distante historique limitée au client Supabase optionnel', () => {
  const remoteScripts = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/g), match => match[1])
    .filter(src => /^https?:/.test(src));
  assert.deepEqual(remoteScripts, ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2']);
});

test('guide pratique et présentation conceptuelle sont autonomes', () => {
  assert.match(html, /<button[^>]+id="btnHeaderOpenPilotageGuide"[^>]*>\?<\/button>/);
  assert.match(html, /<button[^>]+aria-haspopup="dialog"[^>]+id="btnHeaderOpenPilotageGuide"/);
  assert.match(html, /<div class="menuGroupLabel">Plan d’accès<\/div>/);
  assert.match(html, /aria-controls="appUnderstandingModal"[^>]+id="btnMenuOpenPilotagePlan"[^>]*>Comprendre l’application<\/button>/);
  assert.match(html, /id="pilotagePlanTitle">Comment ça marche \?<\/div>/);
  assert.match(html, /id="pilotagePlanStartTitle">Commence ici<\/h3>/);
  assert.match(html, /id="pilotageGuideDemoInfo"[^>]+data-modaltext=/);
  assert.match(html, /id="pilotageGuideSignalDemo"[^>]+data-modaltext=/);
  assert.match(html, /Activité \*/);
  assert.match(html, /Dépense \*/);
  assert.match(html, /id="appUnderstandingModal"/);
  assert.match(html, /id="appUnderstandingTitle">Comprendre l’application<\/div>/);
  assert.match(html, /id="appUnderstandingRoleTitle">Rôle du produit<\/h3>/);
  assert.match(html, /id="appUnderstandingFlowTitle">Flux métier<\/h3>/);
  assert.match(html, /id="appUnderstandingIntentTitle">Orientation par intention<\/h3>/);
  assert.match(html, /id="appUnderstandingDataTitle">Données qui alimentent le moteur<\/h3>/);
  assert.match(html, /dépense automatique ou explicitement renseignée/);
  assert.doesNotMatch(html, /id="pilotageGuideMore"/);
  assert.doesNotMatch(html, /Pour aller plus loin/);
});

test('statusbar fixe mobile sans duplication DOM', () => {
  const shellObserverSource = fs.readFileSync(path.join(appRoot, 'js/legacy/legacy-shell-observers.js'), 'utf8');
  const appInitSource = fs.readFileSync(path.join(appRoot, 'js/legacy/legacy-app-init.js'), 'utf8');
  const flowvizCss = fs.readFileSync(path.join(appRoot, 'css/screens/flowviz.css'), 'utf8');
  assert.equal((shellObserverSource.match(/id = 'phase5StatusBar'/g) || []).length, 1);
  assert.match(appInitSource, /window\.phase6SyncAppbarHeightVar = phase6SyncAppbarHeightVar/);
  assert.match(appInitSource, /--phase5-statusbar-h/);
  assert.match(flowvizCss, /body\.phase5MobileStatusFixed \.phase5ShellLine\s*\{\s*display:block;/);
  assert.match(flowvizCss, /body\.phase5MobileStatusFixed \.phase5StatusBar\s*\{/);
  assert.match(flowvizCss, /grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(flowvizCss, /body\.phase5MobileStatusFixed \.phase5StatusMeta\s*\{\s*display:none;/);
});
