;(function(global){
  'use strict';

  function $(id){ return global.document ? global.document.getElementById(id) : null; }

  function isoToday(){ return new Date().toISOString().slice(0,10); }

  function phase6CompatRenderHistoryPanels(dateStr){
    const selected = (typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : (($('dayDate') && $('dayDate').value) || isoToday()));
    const d = String(dateStr || selected || isoToday()).slice(0,10);
    const month = (($('histMonth') && $('histMonth').value) || d.slice(0,7));
    const phase6 = global.__Phase6;
    if (phase6 && phase6.Contracts && phase6.Contracts.require) {
      return phase6.Contracts.require('CoreBoundaryPort','renderHistoryPanels')(d, { month, source:'legacy-storage-days' });
    }
    return global.renderDaysHistory();
  }

  function phase6CompatRenderHistory(dateStr){
    const selected = (typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : (($('dayDate') && $('dayDate').value) || isoToday()));
    const d = String(dateStr || selected || isoToday()).slice(0,10);
    const month = (($('histMonth') && $('histMonth').value) || d.slice(0,7));
    const phase6 = global.__Phase6;
    if (phase6 && phase6.Contracts && phase6.Contracts.require) {
      return phase6.Contracts.require('LegacyBoundaryPort','renderHistory')(d, { month, source:'legacy-storage-days' });
    }
    try { return global.historyV2_render(month, d); } catch(e) { return undefined; }
  }

  function phase6CompatSaveProfileSettings(){
    const phase6 = global.__Phase6;
    if (phase6 && phase6.Contracts && phase6.Contracts.require) {
      return phase6.Contracts.require('CoreBoundaryPort','saveProfileSettings')({ source:'legacy-storage-days' });
    }
    return global.saveProfileSettings();
  }

  function loadDays() {
    try { return JSON.parse(global.localStorage.getItem(global.DAYS_KEY()) || '[]'); }
    catch (_) { return []; }
  }

  function saveDays(days) { global.localStorage.setItem(global.DAYS_KEY(), JSON.stringify(days)); }

  function getDay(dateStr) { return loadDays().find(d => d.date === dateStr) || null; }

  function upsertDay(dayObj) {
    const days = loadDays();
    const idx = days.findIndex(d => d.date === dayObj.date);
    if (idx >= 0) days[idx] = dayObj; else days.push(dayObj);
    saveDays(days);
    phase6CompatRenderHistoryPanels((dayObj && dayObj.date) || (typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null) || (($('dayDate') && $('dayDate').value) || isoToday()));
    if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
  }

  function deleteDay(dateStr) {
    let days = loadDays();
    days = days.filter(d => d.date !== dateStr);
    saveDays(days);
    phase6CompatRenderHistoryPanels(dateStr || (typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null) || (($('dayDate') && $('dayDate').value) || isoToday()));
    if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
  }

  function deleteAllDays() {
    saveDays([]);
    phase6CompatRenderHistoryPanels((typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null) || (($('dayDate') && $('dayDate').value) || isoToday()));
    if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
  }

  function exportDays() {
    const payload = {
      version: 6,
      exportedAt: new Date().toISOString(),
      profile: global.getActiveProfile(),
      days: loadDays()
    };
    const box = $('daysJsonBox');
    if (box) box.value = JSON.stringify(payload, null, 2);
  }

  function importDays() {
    const box = $('daysJsonBox');
    const text = box ? box.value.trim() : '';
    if (!text) return;
    let payload;
    try { payload = JSON.parse(text); } catch (_) { global.alert('JSON invalide'); return; }
    if (!payload || !Array.isArray(payload.days)) { global.alert('Format attendu: {days:[...]}.'); return; }
    const existing = loadDays();
    const map = new Map(existing.map(d => [d.date, d]));
    for (const d of payload.days) {
      if (!d.date) continue;
      map.set(d.date, d);
    }
    saveDays(Array.from(map.values()));
    phase6CompatRenderHistoryPanels((typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null) || (($('dayDate') && $('dayDate').value) || isoToday()));
    if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
  }

  function clearDays() {
    global.localStorage.removeItem(global.DAYS_KEY());
    phase6CompatRenderHistoryPanels((typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null) || (($('dayDate') && $('dayDate').value) || isoToday()));
    if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
  }

  global.phase6CompatRenderHistoryPanels = phase6CompatRenderHistoryPanels;
  global.phase6CompatRenderHistory = phase6CompatRenderHistory;
  global.phase6CompatSaveProfileSettings = phase6CompatSaveProfileSettings;
  global.loadDays = loadDays;
  global.saveDays = saveDays;
  global.getDay = getDay;
  global.upsertDay = upsertDay;
  global.deleteDay = deleteDay;
  global.deleteAllDays = deleteAllDays;
  global.exportDays = exportDays;
  global.importDays = importDays;
  global.clearDays = clearDays;

  global.__LegacyStorageDays = {
    phase6CompatRenderHistoryPanels,
    phase6CompatRenderHistory,
    phase6CompatSaveProfileSettings,
    loadDays, saveDays, getDay, upsertDay, deleteDay, deleteAllDays, exportDays, importDays, clearDays
  };
})(window);
