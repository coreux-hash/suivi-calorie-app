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

test('guide Comment ça marche pédagogique et interactif', () => {
  assert.match(html, /<div class="menuGroupLabel">Aide<\/div>/);
  assert.match(html, /id="btnMenuOpenPilotagePlan"[^>]*>Comment ça marche \?<\/button>/);
  assert.match(html, /id="pilotagePlanTitle">Comment ça marche \?<\/div>/);
  assert.match(html, /id="pilotagePlanStartTitle">Commence ici<\/h3>/);
  assert.match(html, /id="pilotageGuideDemoInfo"[^>]+data-modaltext=/);
  assert.match(html, /id="pilotageGuideSignalDemo"[^>]+data-modaltext=/);
  assert.match(html, /Activité \*/);
  assert.match(html, /Dépense \*/);
  assert.match(html, /<summary>Pour aller plus loin<\/summary>/);
  assert.doesNotMatch(html, /id="pilotagePlanTitle">Plan de pilotage<\/div>/);
});
