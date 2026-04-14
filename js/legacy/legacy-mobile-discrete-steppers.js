(function(global){
  'use strict';

  const doc = global.document;
  if (!doc) return;

  const TARGET_IDS = ['protPerKg','fatFloorGPerKg','ratioCP','carbCapGPerKg','lowCarbStep'];
  const mq = global.matchMedia ? global.matchMedia('(max-width: 680px)') : { matches:false, addEventListener:null, addListener:null };

  function byId(id){ return doc.getElementById(id); }
  function toNum(v){
    if (v == null) return NaN;
    const n = Number(String(v).replace(',', '.').trim());
    return Number.isFinite(n) ? n : NaN;
  }
  function clamp(v, min, max){
    let out = v;
    if (Number.isFinite(min)) out = Math.max(min, out);
    if (Number.isFinite(max)) out = Math.min(max, out);
    return out;
  }
  function stepPrecision(step){
    const s = String(step || '1');
    if (!s.includes('.')) return 0;
    return s.split('.')[1].length;
  }
  function fmtForStep(value, step){
    const p = stepPrecision(step);
    if (p <= 0) return String(Math.round(value));
    return Number(value).toFixed(p);
  }
  function snapToStep(value, step, base){
    const s = Number(step);
    if (!Number.isFinite(s) || s <= 0) return value;
    const anchor = Number.isFinite(base) ? Number(base) : 0;
    const snapped = anchor + Math.round((value - anchor) / s) * s;
    const p = stepPrecision(s);
    return Number(Number(snapped).toFixed(Math.max(p, 4)));
  }
  function getSelectedCompromiseConfig(){
    try {
      const sel = byId('compromiseSelect');
      const key = String(sel?.value || '');
      if (!key || key === '__create_custom__') return null;
      const map = global.__CompromiseUI?.getApplyMap?.() || global.__CompromiseApplyMap || null;
      return map ? (map[key] || null) : null;
    } catch(_){
      return null;
    }
  }
  function getEffectiveBounds(input){
    let min = toNum(input.getAttribute('min'));
    let max = toNum(input.getAttribute('max'));
    const step = (() => {
      const raw = toNum(input.getAttribute('step'));
      return Number.isFinite(raw) && raw > 0 ? raw : 1;
    })();

    const dietMode = String(byId('dietMode')?.value || 'custom');
    const cfg = getSelectedCompromiseConfig();

    if (input.id === 'protPerKg') {
      const presetRanges = global.PROT_RANGES || global.PROT_RANGES_BY_DIET || null;
      const range = presetRanges && dietMode && dietMode !== 'custom' ? presetRanges[dietMode] : null;
      if (range) {
        const rMin = toNum(range.min);
        const rMax = toNum(range.max);
        if (Number.isFinite(rMin)) min = Number.isFinite(min) ? Math.max(min, rMin) : rMin;
        if (Number.isFinite(rMax)) max = Number.isFinite(max) ? Math.min(max, rMax) : rMax;
      }
      if (cfg) {
        const exact = toNum(cfg.protPerKg);
        const recMin = toNum(cfg.protRecommendedMin);
        const recMax = toNum(cfg.protRecommendedMax);
        if (Number.isFinite(recMin) || Number.isFinite(recMax)) {
          if (Number.isFinite(recMin)) min = Number.isFinite(min) ? Math.max(min, recMin) : recMin;
          if (Number.isFinite(recMax)) max = Number.isFinite(max) ? Math.min(max, recMax) : recMax;
        } else if (Number.isFinite(exact)) {
          min = exact;
          max = exact;
        }
      }
    }

    if (input.id === 'fatFloorGPerKg') {
      if (cfg) {
        const exact = toNum(cfg.fatFloorGPerKg);
        const recMin = toNum(cfg.fatRecommendedMin);
        const recMax = toNum(cfg.fatRecommendedMax);
        if (Number.isFinite(recMin) || Number.isFinite(recMax)) {
          if (Number.isFinite(recMin)) min = Number.isFinite(min) ? Math.max(min, recMin) : recMin;
          if (Number.isFinite(recMax)) max = Number.isFinite(max) ? Math.min(max, recMax) : recMax;
        } else if (Number.isFinite(exact)) {
          min = exact;
          max = exact;
        }
      }
    }

    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      max = min;
    }
    return { min, max, step };
  }
  function updateButtonState(input){
    const wrap = input?.parentElement?.querySelector?.('.mobileDiscreteStepper');
    if (!wrap) return;
    const minus = wrap.querySelector('[data-dir="-1"]');
    const plus = wrap.querySelector('[data-dir="1"]');
    const { min, max } = getEffectiveBounds(input);
    const cur = toNum(input.value);
    const disabled = !!input.disabled;
    if (minus) minus.disabled = disabled || (Number.isFinite(min) && Number.isFinite(cur) && cur <= min + 1e-9);
    if (plus) plus.disabled = disabled || (Number.isFinite(max) && Number.isFinite(cur) && cur >= max - 1e-9);
  }
  function dispatchInputChange(input){
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function applyStep(input, direction){
    if (!input || input.disabled) return;
    const { min, max, step } = getEffectiveBounds(input);
    let cur = toNum(input.value);
    if (!Number.isFinite(cur)) {
      cur = Number.isFinite(min) ? min : 0;
    }
    cur = clamp(cur, min, max);
    let next = cur + (Number(direction) * step);
    next = snapToStep(next, step, Number.isFinite(min) ? min : 0);
    next = clamp(next, min, max);
    const nextValue = fmtForStep(next, step);
    if (String(input.value) !== nextValue) {
      input.value = nextValue;
      dispatchInputChange(input);
    } else {
      updateButtonState(input);
    }
  }
  function applyReadonlyMode(){
    const mobile = !!mq.matches;
    TARGET_IDS.forEach((id) => {
      const input = byId(id);
      if (!input) return;
      input.readOnly = mobile;
      input.setAttribute('aria-readonly', mobile ? 'true' : 'false');
      updateButtonState(input);
    });
  }
  function buildStepper(input){
    if (!input || input.dataset.mobileStepperInit === '1') return;
    const host = input.parentElement;
    if (!host) return;
    host.classList.add('mobileStepperHost');
    input.classList.add('mobileStepperInput');

    const wrap = doc.createElement('div');
    wrap.className = 'mobileDiscreteStepper';
    wrap.setAttribute('aria-hidden', 'false');

    const minus = doc.createElement('button');
    minus.type = 'button';
    minus.className = 'mobileDiscreteStepper__btn';
    minus.setAttribute('data-dir', '-1');
    minus.setAttribute('aria-label', `Diminuer ${input.id}`);
    minus.textContent = '−';

    const plus = doc.createElement('button');
    plus.type = 'button';
    plus.className = 'mobileDiscreteStepper__btn';
    plus.setAttribute('data-dir', '1');
    plus.setAttribute('aria-label', `Augmenter ${input.id}`);
    plus.textContent = '+';

    minus.addEventListener('click', () => applyStep(input, -1));
    plus.addEventListener('click', () => applyStep(input, 1));

    wrap.appendChild(minus);
    wrap.appendChild(plus);
    host.appendChild(wrap);

    ['input','change'].forEach((evt) => input.addEventListener(evt, () => updateButtonState(input)));
    input.dataset.mobileStepperInit = '1';
    updateButtonState(input);
  }
  function init(){
    TARGET_IDS.forEach((id) => buildStepper(byId(id)));
    applyReadonlyMode();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', applyReadonlyMode);
  else if (typeof mq.addListener === 'function') mq.addListener(applyReadonlyMode);

  global.__mobileDiscreteSteppers = { init, applyReadonlyMode, updateButtonState, getEffectiveBounds };
})(window);
