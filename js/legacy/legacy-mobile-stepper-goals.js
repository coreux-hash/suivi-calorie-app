(function(){
  const IDS = ['protPerKg','fatFloorGPerKg','carbCapGPerKg','ratioCP'];
  const MOBILE_QUERY = '((hover: none) or (pointer: coarse)), (max-width: 760px)';

  function $(id){ return document.getElementById(id); }
  function isMobile(){
    try { return !!window.matchMedia && window.matchMedia(MOBILE_QUERY).matches; }
    catch(e){ return (window.innerWidth || 0) <= 760; }
  }
  function isVisible(el){
    if (!el) return false;
    if (el.classList?.contains('hidden')) return false;
    if (el.hidden) return false;
    const style = window.getComputedStyle ? getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    return true;
  }
  function decimalsForStep(step){
    const s = String(step || '1');
    const i = s.indexOf('.');
    return i >= 0 ? (s.length - i - 1) : 0;
  }
  function formatValue(next, step){
    const decimals = decimalsForStep(step);
    return Number(next).toFixed(decimals).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  }
  function getStep(input){
    const n = Number(input?.step);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  function getMin(input){
    const n = Number(input?.min);
    return Number.isFinite(n) ? n : -Infinity;
  }
  function getMax(input){
    const n = Number(input?.max);
    return Number.isFinite(n) ? n : Infinity;
  }
  function toNum(v){
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function snapClamp(input, raw){
    const step = getStep(input);
    const min = getMin(input);
    const max = getMax(input);
    let next = raw;
    if (Number.isFinite(min)) next = Math.max(min, next);
    if (Number.isFinite(max)) next = Math.min(max, next);
    if (Number.isFinite(step) && step > 0) {
      const base = Number.isFinite(min) ? min : 0;
      next = Math.round((next - base) / step) * step + base;
      if (Number.isFinite(min)) next = Math.max(min, next);
      if (Number.isFinite(max)) next = Math.min(max, next);
    }
    return next;
  }
  function ensureStyle(){
    if ($('mobileStepperGoalsStyle')) return;
    const style = document.createElement('style');
    style.id = 'mobileStepperGoalsStyle';
    style.textContent = `
@media ${MOBILE_QUERY} {
  .mobile-stepper-shell{
    display:grid;
    grid-template-columns: 34px minmax(0,1fr) 34px;
    align-items:center;
    gap:.35rem;
    width:100%;
  }
  .mobile-stepper-shell.is-hidden{ display:none; }
  .mobile-stepper-shell .mobile-stepper-btn{
    appearance:none;
    -webkit-appearance:none;
    border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.06);
    color:inherit;
    border-radius:12px;
    min-height:40px;
    height:40px;
    padding:0;
    font:inherit;
    font-size:1.05rem;
    line-height:1;
  }
  .mobile-stepper-shell .mobile-stepper-btn[disabled]{
    opacity:.42;
  }
  .mobile-stepper-shell > input.mobile-stepper-input{
    min-width:0;
    width:100%;
  }
  .mobile-stepper-shell > input.mobile-stepper-input[readonly]{
    caret-color:transparent;
  }
  .mobile-stepper-shell > input.mobile-stepper-input[readonly]::-webkit-outer-spin-button,
  .mobile-stepper-shell > input.mobile-stepper-input[readonly]::-webkit-inner-spin-button{
    -webkit-appearance:none;
    margin:0;
  }
}
`;
    document.head.appendChild(style);
  }
  function dispatchUpdate(input){
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function applyStep(input, dir){
    if (!input || input.disabled || !isVisible(input)) return;
    const step = getStep(input);
    const current = toNum(input.value);
    const next = snapClamp(input, current + (dir * step));
    input.value = formatValue(next, step);
    dispatchUpdate(input);
  }
  function syncShellState(input){
    const shell = input?.closest('.mobile-stepper-shell');
    if (!shell) return;
    const buttons = shell.querySelectorAll('.mobile-stepper-btn');
    const hidden = !isVisible(input);
    shell.classList.toggle('is-hidden', hidden);
    buttons.forEach(btn => {
      btn.disabled = hidden || !!input.disabled;
    });
  }
  function enhanceInput(input){
    if (!input || input.closest('.mobile-stepper-shell')) return;
    const shell = document.createElement('div');
    shell.className = 'mobile-stepper-shell';
    shell.dataset.target = input.id;

    const dec = document.createElement('button');
    dec.type = 'button';
    dec.className = 'mobile-stepper-btn mobile-stepper-btn--dec';
    dec.setAttribute('aria-label', `Diminuer ${input.id}`);
    dec.textContent = '−';

    const inc = document.createElement('button');
    inc.type = 'button';
    inc.className = 'mobile-stepper-btn mobile-stepper-btn--inc';
    inc.setAttribute('aria-label', `Augmenter ${input.id}`);
    inc.textContent = '+';

    const parent = input.parentNode;
    if (!parent) return;
    parent.insertBefore(shell, input);
    shell.appendChild(dec);
    shell.appendChild(input);
    shell.appendChild(inc);

    input.classList.add('mobile-stepper-input');
    input.setAttribute('readonly', 'readonly');
    input.dataset.mobileStepperReadonly = '1';
    input.addEventListener('focus', () => input.blur());
    input.addEventListener('pointerdown', (e) => {
      if (!isMobile()) return;
      e.preventDefault();
      input.blur();
    });

    dec.addEventListener('click', () => applyStep(input, -1));
    inc.addEventListener('click', () => applyStep(input, +1));

    input.addEventListener('change', () => syncShellState(input));
    syncShellState(input);
  }
  function refresh(){
    if (!isMobile()) return;
    ensureStyle();
    IDS.forEach(id => {
      const input = $(id);
      if (input) enhanceInput(input);
      if (input) syncShellState(input);
    });
  }
  function init(){
    refresh();
    window.addEventListener('resize', refresh, { passive:true });
    const mo = new MutationObserver(() => refresh());
    mo.observe(document.documentElement || document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class','style','hidden','disabled'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
