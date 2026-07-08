
(function(global){
  const doc = global.document;
  if (!doc) return;
  const $ = (id) => doc.getElementById(id);
  const MOBILE_QUERY = '(max-width: 680px)';
  const mql = global.matchMedia ? global.matchMedia(MOBILE_QUERY) : { matches:false, addEventListener(){}, addListener(){} };
  const TARGETS = [
    { id:'protPerKg', decimals:1 },
    { id:'fatFloorGPerKg', decimals:1 },
    { id:'ratioCP', decimals:1 },
    { id:'carbCapGPerKg', decimals:0 },
    { id:'lowCarbStep', decimals:1 }
  ];
  const PROT_RANGES_BY_DIET = {
    cut_standard:{ min:1.7, max:2.3 },
    cut_aggressive:{ min:2.0, max:2.6 },
    recomp:{ min:1.6, max:2.3 },
    maintain:{ min:1.4, max:1.9 },
    endurance:{ min:1.5, max:2.0 }
  };

  function toNum(v){
    if (typeof global.toNum === 'function') return global.toNum(v);
    const n = parseFloat(String(v ?? '').replace(',', '.').trim());
    return Number.isFinite(n) ? n : NaN;
  }
  function round(v, d){
    const p = Math.pow(10, d || 0);
    return Math.round(Number(v) * p) / p;
  }
  function isMobile(){ return !!mql.matches; }
  function parseFinite(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
  function getSelectedCompromiseCfg(){
    try {
      const sel = $('compromiseSelect');
      const key = String(sel?.value || '');
      if (!key || key === '__create_custom__') return null;
      const map = global.__CompromiseUI?.getApplyMap?.() || global.__CompromiseApplyMap || null;
      return map && map[key] ? map[key] : null;
    } catch { return null; }
  }
  function getEffectiveBounds(input){
    const id = input?.id || '';
    const step = parseFinite(input?.step) || (id === 'carbCapGPerKg' ? 1 : 0.1);
    let min = parseFinite(input?.min);
    let max = parseFinite(input?.max);
    const cfg = getSelectedCompromiseCfg();

    if (id === 'protPerKg'){
      if (cfg && (Number.isFinite(Number(cfg.protRecommendedMin)) || Number.isFinite(Number(cfg.protRecommendedMax)))){
        if (Number.isFinite(Number(cfg.protRecommendedMin))) min = Number(cfg.protRecommendedMin);
        if (Number.isFinite(Number(cfg.protRecommendedMax))) max = Number(cfg.protRecommendedMax);
      } else {
        const mode = String($('dietMode')?.value || '');
        const presetRange = PROT_RANGES_BY_DIET[mode];
        if (presetRange){
          min = Number(presetRange.min);
          max = Number(presetRange.max);
        }
      }
    }

    if (id === 'fatFloorGPerKg' && cfg && (Number.isFinite(Number(cfg.fatRecommendedMin)) || Number.isFinite(Number(cfg.fatRecommendedMax)))){
      if (Number.isFinite(Number(cfg.fatRecommendedMin))) min = Number(cfg.fatRecommendedMin);
      if (Number.isFinite(Number(cfg.fatRecommendedMax))) max = Number(cfg.fatRecommendedMax);
    }

    if (id === 'lowCarbStep'){
      min = parseFinite(input?.min) ?? min;
      max = parseFinite(input?.max) ?? max;
    }

    return { min, max, step };
  }
  function formatValue(input, value){
    const id = input?.id || '';
    const decimals = TARGETS.find(t => t.id === id)?.decimals ?? ((parseFinite(input?.step) || 1) < 1 ? 1 : 0);
    const n = round(value, decimals);
    return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  }
  function emitInputLifecycle(input){
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function stepInputValue(input, direction){
    if (!input || input.disabled) return;
    const styleHidden = input.classList.contains('hidden') || input.offsetParent === null;
    if (styleHidden) return;
    const { min, max, step } = getEffectiveBounds(input);
    let current = toNum(input.value);
    if (!Number.isFinite(current)) {
      current = Number.isFinite(min) ? min : 0;
    }
    const origin = Number.isFinite(min) ? min : 0;
    const scaled = round((current - origin) / step, 4);
    let next = origin + (Math.round(scaled) + (direction > 0 ? 1 : -1)) * step;
    next = round(next, step < 1 ? 1 : 0);
    if (Number.isFinite(min)) next = Math.max(min, next);
    if (Number.isFinite(max)) next = Math.min(max, next);
    if (Math.abs(next - current) < 1e-9) {
      input.value = formatValue(input, next);
      syncOne(input.id);
      return;
    }
    input.value = formatValue(input, next);
    emitInputLifecycle(input);
    global.requestAnimationFrame(() => syncOne(input.id));
  }
  function ensureFrame(id){
    const input = $(id);
    if (!input) return null;
    let frame = input.closest('.settingsStepperFrame');
    if (!frame) {
      frame = doc.createElement('div');
      frame.className = 'settingsStepperFrame';
      frame.dataset.stepperFor = id;
      input.parentNode.insertBefore(frame, input);
      frame.appendChild(input);
    }
    if (id === 'ratioCP'){
      const ratioTxt = $('ratioCPText');
      if (ratioTxt && ratioTxt.parentNode !== frame) frame.appendChild(ratioTxt);
    }
    if (!frame.querySelector('[data-stepper-action="dec"]')) {
      const dec = doc.createElement('button');
      dec.type = 'button';
      dec.className = 'settingsStepperBtn';
      dec.dataset.stepperAction = 'dec';
      dec.dataset.targetInput = id;
      dec.setAttribute('aria-label', 'Diminuer');
      dec.textContent = '−';
      frame.appendChild(dec);
    }
    if (!frame.querySelector('[data-stepper-action="inc"]')) {
      const inc = doc.createElement('button');
      inc.type = 'button';
      inc.className = 'settingsStepperBtn';
      inc.dataset.stepperAction = 'inc';
      inc.dataset.targetInput = id;
      inc.setAttribute('aria-label', 'Augmenter');
      inc.textContent = '+';
      frame.appendChild(inc);
    }
    return frame;
  }
  function setMobileReadonly(input, enabled){
    if (!input) return;
    if (enabled) {
      if (!input.dataset.mobileStepperOrigInputmode) input.dataset.mobileStepperOrigInputmode = input.getAttribute('inputmode') || '';
      input.readOnly = true;
      input.setAttribute('inputmode', 'none');
    } else {
      input.readOnly = false;
      const orig = Object.prototype.hasOwnProperty.call(input.dataset, 'mobileStepperOrigInputmode') ? input.dataset.mobileStepperOrigInputmode : '';
      if (orig) input.setAttribute('inputmode', orig);
      else input.removeAttribute('inputmode');
    }
  }
  function syncOne(id){
    const input = $(id);
    if (!input) return;
    const frame = ensureFrame(id);
    if (!frame) return;
    const buttons = frame.querySelectorAll('.settingsStepperBtn');
    const hidden = input.classList.contains('hidden') || input.offsetParent === null;
    const ratioText = $('ratioCPText');
    const ratioProxyVisible = id === 'ratioCP' && !!ratioText && !ratioText.classList.contains('hidden');
    frame.classList.toggle('has-text-proxy', !!ratioProxyVisible);
    frame.classList.toggle('is-stepper-inactive', hidden || input.disabled);
    setMobileReadonly(input, isMobile());

    const { min, max } = getEffectiveBounds(input);
    const current = toNum(input.value);
    buttons.forEach((btn) => {
      let disabled = !isMobile() || hidden || input.disabled;
      if (!disabled && Number.isFinite(current)) {
        if (btn.dataset.stepperAction === 'dec' && Number.isFinite(min) && current <= min + 1e-9) disabled = true;
        if (btn.dataset.stepperAction === 'inc' && Number.isFinite(max) && current >= max - 1e-9) disabled = true;
      }
      btn.disabled = !!disabled;
    });
  }
  function syncAll(){ TARGETS.forEach(t => syncOne(t.id)); }
  function bindFrameEvents(){
    if (doc.documentElement.dataset.mobileStepperBound === '1') return;
    doc.documentElement.dataset.mobileStepperBound = '1';
    doc.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('.settingsStepperBtn') : null;
      if (!btn) return;
      const input = $(btn.dataset.targetInput || '');
      if (!input) return;
      e.preventDefault();
      stepInputValue(input, btn.dataset.stepperAction === 'dec' ? -1 : 1);
    });
    TARGETS.forEach(({ id }) => {
      const input = $(id);
      if (!input) return;
      ['input','change'].forEach(type => input.addEventListener(type, () => syncOne(id)));
      if (id === 'ratioCPText') return;
    });
    $('dietMode')?.addEventListener('change', syncAll);
    $('compromiseSelect')?.addEventListener('change', () => global.requestAnimationFrame(syncAll));
    $('carbGoal')?.addEventListener('change', () => global.requestAnimationFrame(syncAll));
    $('carbGuardEnabled')?.addEventListener('change', () => global.requestAnimationFrame(syncAll));
    $('lowCarbEnabled')?.addEventListener('change', () => global.requestAnimationFrame(syncAll));
    $('lowCarbLevel')?.addEventListener('change', () => global.requestAnimationFrame(syncAll));
    if (mql.addEventListener) mql.addEventListener('change', syncAll);
    else if (mql.addListener) mql.addListener(syncAll);
  }
  function observeState(){
    if (doc.documentElement.dataset.mobileStepperObserved === '1') return;
    doc.documentElement.dataset.mobileStepperObserved = '1';
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations){
        const target = m.target;
        if (target && target.id && TARGETS.some(t => t.id === target.id || (target.id === 'ratioCPText' && t.id === 'ratioCP'))) {
          syncOne(target.id === 'ratioCPText' ? 'ratioCP' : target.id);
        }
      }
      global.requestAnimationFrame(syncAll);
    });
    ['protPerKg','fatFloorGPerKg','ratioCP','ratioCPText','carbCapGPerKg','lowCarbStep','carbGuardBox','lowCarbBox'].forEach(id => {
      const el = $(id);
      if (el) mo.observe(el, { attributes:true, attributeFilter:['class','style','disabled','min','max','step','value'] });
    });
  }
  function init(){
    TARGETS.forEach(t => ensureFrame(t.id));
    bindFrameEvents();
    observeState();
    syncAll();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})(window);
