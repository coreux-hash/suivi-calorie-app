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

  function activeProfileId() {
    return (typeof global.getActiveProfile === 'function' ? global.getActiveProfile() : null) || 'default';
  }

  function selectedDateStr() {
    return (typeof global.getSelectedDate === 'function' ? global.getSelectedDate() : null)
      || (($('dayDate') && $('dayDate').value) || isoToday());
  }

  /* Statut persistant affiché dans le bloc de transfert (aria-live).
     Complète les boîtes de dialogue, qui disparaissent au clic. */
  function setTransferStatus(message, tone) {
    const el = $('daysTransferStatus');
    if (!el) return;
    el.textContent = String(message || '');
    if (tone) el.setAttribute('data-tone', tone);
    else el.removeAttribute('data-tone');
  }

  /* Snapshot complet du profil actif : réglages + journées.
     On délègue à buildLocalSnapshot() (déjà utilisé par la synchro cloud) pour
     n'avoir qu'une seule définition de « ce qui constitue une sauvegarde ». */
  function buildExportSnapshot() {
    const profileId = activeProfileId();
    let snapshot = null;
    if (typeof global.buildLocalSnapshot === 'function') {
      try { snapshot = global.buildLocalSnapshot(profileId); } catch (_) { snapshot = null; }
    }
    if (!snapshot) {
      snapshot = {
        schemaVersion: 1,
        profileId,
        settings: null,
        days: loadDays(),
        updatedAt: new Date().toISOString()
      };
    }
    /* Champs conservés pour rester lisible par les anciens imports {version, profile, days}. */
    snapshot.version = 6;
    snapshot.profile = profileId;
    snapshot.exportedAt = new Date().toISOString();
    return snapshot;
  }

  function exportDays() {
    const box = $('daysJsonBox');
    if (!box) return;
    box.value = JSON.stringify(buildExportSnapshot(), null, 2);
    const adv = $('daysJsonAdvanced');
    if (adv) { try { adv.open = true; } catch (_) {} }
    setTransferStatus('Sauvegarde affichée dans la zone JSON. Tu peux la copier manuellement.', null);
  }

  /* Import non destructif.
     Règles : aucune journée locale n'est supprimée ; en cas de même date, la
     version portant le updatedAt le plus récent gagne et les repas sont
     fusionnés par id. Cette logique n'est pas réécrite ici : elle est
     déléguée à mergeSnapshots(), déjà utilisée par la synchro cloud. */
  function importDaysFromText(text) {
    const raw = String(text || '').trim();
    if (!raw) return false;

    let payload;
    try { payload = JSON.parse(raw); }
    catch (_) { global.alert('JSON invalide.'); return false; }

    if (!payload || !Array.isArray(payload.days)) {
      global.alert('Format attendu : { "days": [ ... ] }.');
      return false;
    }

    if (typeof global.mergeSnapshots !== 'function') {
      global.alert(
        "Fusion indisponible : le module de synchronisation n'est pas chargé.\n" +
        "Import annulé pour éviter toute perte de données."
      );
      return false;
    }

    const profileId = activeProfileId();
    const incomingProfile = payload.profileId || payload.profile || null;

    if (incomingProfile && String(incomingProfile) !== String(profileId)) {
      const okProfile = global.confirm(
        'Ce JSON provient du profil « ' + incomingProfile + ' ».\n' +
        'Le profil actif est « ' + profileId + ' ».\n\n' +
        'Importer quand même dans « ' + profileId + ' » ?'
      );
      if (!okProfile) return false;
    }

    const localSnap = (typeof global.buildLocalSnapshot === 'function')
      ? global.buildLocalSnapshot(profileId)
      : { schemaVersion: 1, profileId, settings: null, days: loadDays(), updatedAt: new Date().toISOString() };

    const incomingSnap = {
      schemaVersion: 1,
      profileId,
      settings: payload.settings || null,
      days: payload.days,
      updatedAt: payload.updatedAt || payload.exportedAt || new Date().toISOString()
    };

    /* Aperçu calculé avant toute écriture. */
    const localDays = Array.isArray(localSnap.days) ? localSnap.days : [];
    const byDate = new Map();
    for (const d of localDays) if (d && d.date) byDate.set(d.date, d);

    let added = 0, updated = 0, kept = 0, ignored = 0;
    for (const d of incomingSnap.days) {
      if (!d || !d.date) { ignored++; continue; }
      const cur = byDate.get(d.date);
      if (!cur) { added++; continue; }
      if (String(d.updatedAt || '') > String(cur.updatedAt || '')) updated++; else kept++;
    }

    const lAt = (localSnap.settings && localSnap.settings.updatedAt) ? String(localSnap.settings.updatedAt) : '';
    const cAt = (incomingSnap.settings && incomingSnap.settings.updatedAt) ? String(incomingSnap.settings.updatedAt) : '';
    const settingsIncoming = !!incomingSnap.settings && cAt > lAt;

    const lines = [
      'Import dans le profil « ' + profileId + ' »',
      '',
      '• ' + added + ' journée(s) ajoutée(s)',
      '• ' + updated + ' journée(s) mise(s) à jour (version la plus récente conservée)',
      '• ' + kept + ' journée(s) locale(s) conservée(s), déjà plus récentes'
    ];
    if (ignored) lines.push('• ' + ignored + ' entrée(s) ignorée(s), sans date');
    lines.push('• Réglages : ' + (settingsIncoming ? 'remplacés par ceux du JSON, plus récents' : 'conservés (locaux)'));
    lines.push('', 'Aucune journée locale ne sera supprimée.', '', "Confirmer l'import ?");

    if (!global.confirm(lines.join('\n'))) {
      setTransferStatus('Import annulé. Aucune donnée modifiée.', 'warn');
      return false;
    }

    let merged;
    try { merged = global.mergeSnapshots(localSnap, incomingSnap); }
    catch (e) { global.alert('Fusion impossible : ' + ((e && e.message) ? e.message : e)); return false; }

    if (!merged || !Array.isArray(merged.days)) {
      global.alert('Fusion impossible : résultat invalide. Rien n’a été modifié.');
      return false;
    }

    if (typeof global.writeSnapshotToLocal === 'function') global.writeSnapshotToLocal(merged);
    else saveDays(merged.days);

    const dateStr = selectedDateStr();

    /* Journées seules : on garde exactement la chaîne de rafraîchissement historique.
       Réglages importés : on réutilise la chaîne post-fusion du cloud, qui recharge
       aussi les champs de réglages. */
    if (settingsIncoming && typeof global.cloudRefreshAfterMerge === 'function') {
      try { global.cloudRefreshAfterMerge({ dateStr }); }
      catch (_) {
        phase6CompatRenderHistoryPanels(dateStr);
        if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
      }
    } else {
      phase6CompatRenderHistoryPanels(dateStr);
      if (typeof global.refreshDaySelect === 'function') global.refreshDaySelect();
    }

    const resume = added + ' ajoutée(s), ' + updated + ' mise(s) à jour, ' + kept + ' conservée(s)'
      + (settingsIncoming ? ', réglages mis à jour' : '');

    setTransferStatus('Import réussi — ' + resume + '. Tes données sont enregistrées : tu peux fermer cette fenêtre.', 'ok');

    global.alert(
      'Import réussi.\n' +
      resume + '.\n\n' +
      'Tes données sont enregistrées. Tu peux fermer cette fenêtre.'
    );
    return true;
  }

  function importDays() {
    const box = $('daysJsonBox');
    const text = box ? String(box.value || '').trim() : '';
    if (!text) {
      const adv = $('daysJsonAdvanced');
      if (adv) { try { adv.open = true; } catch (_) {} }
      if (box) { try { box.focus(); } catch (_) {} }
      setTransferStatus("La zone JSON est vide. Colle d'abord le JSON reçu, puis relance l'import. Pour un fichier, utilise « Importer un fichier… ».", 'warn');
      return false;
    }
    return importDaysFromText(text);
  }

  /* ---- Confort de transfert : presse-papier et fichier ---- */

  function copyDaysJson() {
    const box = $('daysJsonBox');
    if (!box) return;
    if (!box.value.trim()) exportDays();
    const text = box.value;

    const fallback = function () {
      try { box.focus(); box.select(); } catch (_) {}
      global.alert("Copie automatique refusée par le navigateur.\nLe texte est sélectionné : utilise Ctrl/Cmd + C.");
    };

    try {
      const clip = global.navigator && global.navigator.clipboard;
      if (clip && typeof clip.writeText === 'function') {
        clip.writeText(text)
          .then(function () {
            setTransferStatus('Sauvegarde copiée dans le presse-papier. Colle-la sur l’autre appareil, dans la zone JSON.', 'ok');
            global.alert('JSON copié dans le presse-papier.');
          })
          .catch(fallback);
        return;
      }
    } catch (_) {}
    fallback();
  }

  function downloadDaysJson() {
    const snapshot = buildExportSnapshot();
    const text = JSON.stringify(snapshot, null, 2);
    const box = $('daysJsonBox');
    if (box) box.value = text;

    try {
      const blob = new global.Blob([text], { type: 'application/json' });
      const url = global.URL.createObjectURL(blob);
      const a = global.document.createElement('a');
      a.href = url;
      a.download = 'nutriapp-' + snapshot.profileId + '-' + isoToday() + '.json';
      global.document.body.appendChild(a);
      a.click();
      global.document.body.removeChild(a);
      global.setTimeout(function () { try { global.URL.revokeObjectURL(url); } catch (_) {} }, 0);
      setTransferStatus('Fichier de sauvegarde téléchargé. Transfère-le sur l’autre appareil, puis utilise « Importer un fichier… ».', 'ok');
    } catch (_) {
      setTransferStatus("Téléchargement bloqué par le navigateur. Utilise « Copier », puis colle le JSON sur l'autre appareil.", 'warn');
      global.alert("Téléchargement impossible sur ce navigateur.\nUtilise « Copier » puis colle le JSON sur l'autre appareil.");
    }
  }

  function importDaysFromFile(file) {
    if (!file) return;
    let reader;
    try { reader = new global.FileReader(); }
    catch (_) { global.alert('Lecture de fichier non disponible sur ce navigateur.'); return; }

    reader.onload = function () {
      const text = String(reader.result || '');
      const box = $('daysJsonBox');
      if (box) box.value = text;
      importDaysFromText(text);
    };
    reader.onerror = function () { global.alert('Lecture du fichier impossible.'); };
    reader.readAsText(file);
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
  global.buildExportSnapshot = buildExportSnapshot;
  global.importDaysFromText = importDaysFromText;
  global.copyDaysJson = copyDaysJson;
  global.downloadDaysJson = downloadDaysJson;
  global.importDaysFromFile = importDaysFromFile;

  global.__LegacyStorageDays = {
    phase6CompatRenderHistoryPanels,
    phase6CompatRenderHistory,
    phase6CompatSaveProfileSettings,
    loadDays, saveDays, getDay, upsertDay, deleteDay, deleteAllDays, exportDays, importDays, clearDays
  };
})(window);
