# Refonte locale cadre glucidique — audit

## Fichiers modifiés
- js/legacy/legacy-compat-ui.js
- js/legacy/legacy-shell-observers.js
- css/screens/flowviz.css

## Cartographie listeners carb identifiés
js/legacy/legacy-app-init.js:903:  $("carbGoal")?.addEventListener("change", () => {
js/legacy/legacy-app-init.js:1080:$("carbGuardEnabled")?.addEventListener("change", () => {
js/legacy/legacy-app-init.js:1084:$("lowCarbEnabled")?.addEventListener("change", () => {
js/legacy/legacy-app-init.js:1088:$("lowCarbLevel")?.addEventListener("change", () => {
js/legacy/legacy-app-init.js:1091:$("lowCarbStep")?.addEventListener("change", () => {
js/legacy/legacy-carb-patches.js:246:    $("carbGuardEnabled")?.addEventListener("change", () => applyRatioPriority("carbGuardEnabled"));
js/legacy/legacy-carb-patches.js:247:    $("lowCarbEnabled")?.addEventListener("change", () => applyRatioPriority("lowCarbEnabled"));
js/legacy/legacy-carb-patches.js:248:    $("carbGoal")?.addEventListener("change", () => applyRatioPriority("carbGoal"));
js/legacy/legacy-inline-main.js:3923:  $("carbGoal")?.addEventListener("change", () => {
js/legacy/legacy-inline-main.js:4095:$("carbGuardEnabled")?.addEventListener("change", () => {
js/legacy/legacy-inline-main.js:4099:$("lowCarbEnabled")?.addEventListener("change", () => {
js/legacy/legacy-inline-main.js:4103:$("lowCarbLevel")?.addEventListener("change", () => {
js/legacy/legacy-inline-main.js:4106:$("lowCarbStep")?.addEventListener("change", () => {
js/legacy/legacy-inline-main.js:4370:    $("carbGuardEnabled")?.addEventListener("change", () => applyRatioPriority("carbGuardEnabled"));
js/legacy/legacy-inline-main.js:4371:    $("lowCarbEnabled")?.addEventListener("change", () => applyRatioPriority("lowCarbEnabled"));
js/legacy/legacy-inline-main.js:4372:    $("carbGoal")?.addEventListener("change", () => applyRatioPriority("carbGoal"));
js/legacy/legacy-engine-compute.js:789:  $("carbGoal")?.addEventListener("change", () => {
js/legacy/legacy-engine-compute.js:961:$("carbGuardEnabled")?.addEventListener("change", () => {
js/legacy/legacy-engine-compute.js:965:$("lowCarbEnabled")?.addEventListener("change", () => {
js/legacy/legacy-engine-compute.js:969:$("lowCarbLevel")?.addEventListener("change", () => {
js/legacy/legacy-engine-compute.js:972:$("lowCarbStep")?.addEventListener("change", () => {
js/legacy/legacy-engine-compute.js:1236:    $("carbGuardEnabled")?.addEventListener("change", () => applyRatioPriority("carbGuardEnabled"));
js/legacy/legacy-engine-compute.js:1237:    $("lowCarbEnabled")?.addEventListener("change", () => applyRatioPriority("lowCarbEnabled"));
js/legacy/legacy-engine-compute.js:1238:    $("carbGoal")?.addEventListener("change", () => applyRatioPriority("carbGoal"));

## Dépendances UI carb identifiées
js/phase6/phase6-render.js:159:        safeCall(global.updateCarbGuardExplain);
js/phase6/phase6-render.js:161:        safeCall(global.syncCarbModeUI);
js/legacy/legacy-engine-compute.js:988:   - Fix repères glucidiques (updateCarbSteps) + plancher lipides
js/legacy/legacy-engine-compute.js:1039:  // 5) Repères glucidiques : remplace updateCarbSteps (mapping correct)
js/legacy/legacy-engine-compute.js:1040:  window.updateCarbSteps = function updateCarbSteps(){
js/legacy/legacy-engine-compute.js:1049:      updateCarbGuardExplain();
js/legacy/legacy-engine-compute.js:1108:    try{ applyRatioPriority('updateCarbSteps'); }catch(e){}
js/legacy/legacy-engine-compute.js:1111:    updateCarbGuardExplain();
js/legacy/legacy-inline-main.js:637:if (typeof window.syncCarbGuardsFromUI !== "function"){
js/legacy/legacy-inline-main.js:638:  window.syncCarbGuardsFromUI = function(){
js/legacy/legacy-inline-main.js:640:    updateCarbSteps(goal, false);
js/legacy/legacy-inline-main.js:641:    updateCarbGuardExplain();
js/legacy/legacy-inline-main.js:658:function updateCarbGuardExplain(...args){
js/legacy/legacy-inline-main.js:659:  return window.__LegacyCompatUI?.updateCarbGuardExplain?.(...args);
js/legacy/legacy-inline-main.js:710:function updateCarbSteps(...args){
js/legacy/legacy-inline-main.js:711:  return window.__LegacyCompatUI?.updateCarbSteps?.(...args);
js/legacy/legacy-inline-main.js:729:function populateLowCarbSteps(...args){
js/legacy/legacy-inline-main.js:730:  return window.__LegacyCompatUI?.populateLowCarbSteps?.(...args);
js/legacy/legacy-inline-main.js:735:function syncCarbModeUI(...args){
js/legacy/legacy-inline-main.js:736:  return window.__LegacyCompatUI?.syncCarbModeUI?.(...args);
js/legacy/legacy-inline-main.js:879:        if ($("carbGoal")) { updateCarbGoalOptions(false, true); ensureCarbGoalDefaultOption?.(); updateCarbSteps(); lockCarbControls(); syncCarbGuardsFromUI(); }
js/legacy/legacy-inline-main.js:4122:   - Fix repères glucidiques (updateCarbSteps) + plancher lipides
js/legacy/legacy-inline-main.js:4173:  // 5) Repères glucidiques : remplace updateCarbSteps (mapping correct)
js/legacy/legacy-inline-main.js:4174:  window.updateCarbSteps = function updateCarbSteps(){
js/legacy/legacy-inline-main.js:4183:      updateCarbGuardExplain();
js/legacy/legacy-inline-main.js:4242:    try{ applyRatioPriority('updateCarbSteps'); }catch(e){}
js/legacy/legacy-inline-main.js:4245:    updateCarbGuardExplain();
js/phase6/phase6-features.js:87:          safeCall(updateCarbSteps);
js/phase6/phase6-features.js:89:          safeCall(syncCarbGuardsFromUI);
js/phase6/phase6-features.js:99:        safeCall(updateCarbSteps);
js/phase6/phase6-features.js:108:        safeCall(syncCarbGuardsFromUI);
js/phase6/phase6-features.js:114:        safeCall(syncCarbGuardsFromUI);
js/phase6/phase6-features.js:119:        safeCall(syncCarbGuardsFromUI);
js/phase6/phase6-features.js:124:        safeCall(syncCarbGuardsFromUI);
js/phase6/phase6-features.js:167:        safeCall(syncCarbModeUI);
js/phase6/phase6-features.js:171:        safeCall(syncCarbModeUI);
js/phase6/phase6-features.js:175:        safeCall(populateLowCarbSteps);
js/legacy/legacy-core-runtime.js:637:if (typeof window.syncCarbGuardsFromUI !== "function"){
js/legacy/legacy-core-runtime.js:638:  window.syncCarbGuardsFromUI = function(){
js/legacy/legacy-core-runtime.js:640:    updateCarbSteps(goal, false);
js/legacy/legacy-core-runtime.js:641:    updateCarbGuardExplain();
js/legacy/legacy-core-runtime.js:658:function updateCarbGuardExplain(...args){
js/legacy/legacy-core-runtime.js:659:  return window.__LegacyCompatUI?.updateCarbGuardExplain?.(...args);
js/legacy/legacy-core-runtime.js:710:function updateCarbSteps(...args){
js/legacy/legacy-core-runtime.js:711:  return window.__LegacyCompatUI?.updateCarbSteps?.(...args);
js/legacy/legacy-core-runtime.js:729:function populateLowCarbSteps(...args){
js/legacy/legacy-core-runtime.js:730:  return window.__LegacyCompatUI?.populateLowCarbSteps?.(...args);
js/legacy/legacy-core-runtime.js:735:function syncCarbModeUI(...args){
js/legacy/legacy-core-runtime.js:736:  return window.__LegacyCompatUI?.syncCarbModeUI?.(...args);
js/legacy/legacy-cloud-refresh.js:21:  try { updateCarbGuardExplain(); } catch(e) {}
js/legacy/legacy-profiles-settings.js:128:        if ($("carbGoal")) { updateCarbGoalOptions(false, true); ensureCarbGoalDefaultOption?.(); updateCarbSteps(); lockCarbControls(); syncCarbGuardsFromUI(); }
js/legacy/legacy-compat-ui.js:425:  function updateCarbGuardExplain(){
js/legacy/legacy-compat-ui.js:489:  function updateCarbSteps(){
js/legacy/legacy-compat-ui.js:546:      updateCarbSteps();
js/legacy/legacy-compat-ui.js:552:      syncCarbModeUI?.();
js/legacy/legacy-compat-ui.js:553:      updateCarbGuardExplain?.();
js/legacy/legacy-compat-ui.js:588:  function populateLowCarbSteps(){
js/legacy/legacy-compat-ui.js:636:      updateCarbSteps?.();
js/legacy/legacy-compat-ui.js:639:      syncCarbGuardsFromUI?.();
js/legacy/legacy-compat-ui.js:642:    if (refreshLowCarb && carbState.lowCarbEnabled) populateLowCarbSteps();
js/legacy/legacy-compat-ui.js:658:  function syncCarbModeUI(){
js/legacy/legacy-compat-ui.js:677:    updateCarbSteps();
js/legacy/legacy-compat-ui.js:679:    if (typeof global.syncCarbGuardsFromUI === "function") global.syncCarbGuardsFromUI();
js/legacy/legacy-compat-ui.js:712:    updateCarbGuardExplain,
js/legacy/legacy-compat-ui.js:718:    updateCarbSteps,
js/legacy/legacy-compat-ui.js:723:    populateLowCarbSteps,
js/legacy/legacy-compat-ui.js:724:    syncCarbModeUI,
js/legacy/legacy-app-init.js:1112:   - Fix repères glucidiques (updateCarbSteps) + plancher lipides
js/legacy/legacy-carb-patches.js:49:  // 5) Repères glucidiques : remplace updateCarbSteps (mapping correct)
js/legacy/legacy-carb-patches.js:50:  window.updateCarbSteps = function updateCarbSteps(){
js/legacy/legacy-carb-patches.js:59:      updateCarbGuardExplain();
js/legacy/legacy-carb-patches.js:118:    try{ applyRatioPriority('updateCarbSteps'); }catch(e){}
js/legacy/legacy-carb-patches.js:121:    updateCarbGuardExplain();

## Correctif appliqué
1. Lecture d'état localisée via `readCarbFrameState()`.
2. Rendu UI localisé via `renderCarbFrameUI()`.
3. `syncCarbModeUI()` rebâti comme orchestration `lecture -> rendu`.
4. `phaseEllipsisTap` : popover `#carbGoalHelp` autorisé uniquement après intention directe sur `#carbGoal`.
5. Toute interaction `#lowCarbEnabled` / `#lowCarbLevel` / `#lowCarbStep` / `#carbGuardEnabled` / `#dietMode` / `#diabEnabled` masque et inhibe temporairement le popover `#carbGoalHelp`.
6. Spinbuttons masqués localement sur `#miniRepas_remK`, `#miniRepas_remC`, `#miniRepas_remP`, `#miniRepas_remF` sans impact fonctionnel.
