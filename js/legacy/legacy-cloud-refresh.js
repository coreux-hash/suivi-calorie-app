/* =====================================================================
   legacy-cloud-refresh.js
   Post-merge / refresh queue extracted from cloud sync flows.
   Keeps historical global compatibility while centralizing the UI refresh
   chain that follows cloud pull/sync merges.
   ===================================================================== */

function cloudRefreshAfterMerge(options = {}){
  const dateStr = String(options.dateStr || (typeof getSelectedDate === 'function' ? getSelectedDate() : '')) || '';
  if (!dateStr) return { dateStr:'', refreshed:false };

  try {
    window.__Phase6?.Contracts?.require?.('LegacyBridges', 'loadProfileSettings')?.();
  } catch(e) {}

  try {
    window.__Phase6?.Contracts?.require?.('LegacyBridges', 'updateDiabetesVisibility')?.();
  } catch(e) {}

  try { lockMacroControls(($('dietMode')?.value || '') === 'none' || ($('dietMode')?.value || '') === ''); } catch(e) {}
  try { window.normalizeDietPresetInputs?.($('dietMode')?.value || 'none'); } catch(e) {}
  try { updateCarbGuardExplain(); } catch(e) {}
  try { updateFatFloorUI(); } catch(e) {}
  try { refreshDaySelect(); } catch(e) {}
  try { phase6CompatRenderHistoryPanels(dateStr); } catch(e) {}
  try { renderMealsTable(dateStr); } catch(e) {}
  try { updateBodyCompUI(dateStr); } catch(e) {}
  try { compute(true); } catch(e) {}

  return { dateStr, refreshed:true };
}
