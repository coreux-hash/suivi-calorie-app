/* Extracted from legacy-engine-compute.js — compromise UI */
(function(){
  function _esc(s){
    try{ return (typeof escapeHtml === "function") ? escapeHtml(String(s)) : String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
    catch{ return String(s); }
  }
  function byId(id){ return document.getElementById(id); }

  const BUILTIN_COMPROMISE_APPLY_MAP = {
    eq_global: {
      dietMode: 'maintain',
      carbGoal: 'maintain_active',
      protRecommendedMin: 1.6,
      protRecommendedMax: 1.9,
      fatFloorGPerKg: 1.0,
      fatRecommendedMin: 1.0,
      fatRecommendedMax: 1.0,
      lowCarbEnabled: false
    },
    simple_maintain: {
      dietMode: 'maintain',
      carbGoal: 'maintain_active',
      protRecommendedMin: 1.6,
      protRecommendedMax: 1.9,
      fatFloorGPerKg: 1.0,
      fatRecommendedMin: 1.0,
      fatRecommendedMax: 1.0,
      lowCarbEnabled: true,
      lowCarbLevel: 'moderate'
    },
    recomp: {
      dietMode: 'recomp',
      carbGoal: 'recomp',
      protRecommendedMin: 1.8,
      protRecommendedMax: 2.2,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 0.9,
      lowCarbEnabled: false
    },
    simple_recomp: {
      dietMode: 'recomp',
      carbGoal: 'maintain_active',
      protRecommendedMin: 1.8,
      protRecommendedMax: 2.2,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 0.9,
      lowCarbEnabled: false
    },
    gly_satiety: {
      dietMode: 'recomp',
      carbGoal: 'recomp',
      protRecommendedMin: 1.8,
      protRecommendedMax: 2.2,
      fatFloorGPerKg: 1.0,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 1.0,
      lowCarbEnabled: true,
      lowCarbLevel: 'moderate'
    },
    protect_cut: {
      dietMode: 'recomp',
      carbGoal: 'recomp',
      protPerKg: 2.0,
      protRecommendedMin: 2.0,
      protRecommendedMax: 2.3,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 0.9,
      lowCarbEnabled: false
    },
    recovery: {
      dietMode: 'cut_standard',
      carbGoal: 'dry_sport',
      protRecommendedMin: 1.8,
      protRecommendedMax: 2.2,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 1.0,
      lowCarbEnabled: false
    },
    cut_sport: {
      dietMode: 'cut_standard',
      carbGoal: 'dry_sport',
      protPerKg: 2.0,
      protRecommendedMin: 2.0,
      protRecommendedMax: 2.3,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 0.9,
      lowCarbEnabled: true,
      lowCarbLevel: 'moderate'
    },
    cut_fast: {
      dietMode: 'cut_aggressive',
      carbGoal: 'dry_strict',
      protRecommendedMin: 2.2,
      protRecommendedMax: 2.6,
      fatFloorGPerKg: 0.8,
      fatRecommendedMin: 0.8,
      fatRecommendedMax: 0.8,
      lowCarbEnabled: false
    },
    endurance_volume: {
      dietMode: 'endurance',
      carbGoal: 'endurance_volume',
      protRecommendedMin: 1.6,
      protRecommendedMax: 2.0,
      fatFloorGPerKg: 1.0,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 1.1,
      lowCarbEnabled: false
    },
    endurance_comp: {
      dietMode: 'endurance',
      carbGoal: 'carb_loading',
      protRecommendedMin: 1.6,
      protRecommendedMax: 1.8,
      fatFloorGPerKg: 0.9,
      fatRecommendedMin: 0.9,
      fatRecommendedMax: 0.9,
      lowCarbEnabled: false
    }
  };

  



  const CUSTOM_COMPROMISES_KEY_VERSION = 'v1';
  const CUSTOM_CREATE_OPTION_VALUE = '__create_custom__';

  function getActiveProfileId(){
    try { return localStorage.getItem('secheapp.activeProfile.v1') || byId('profileSelect')?.value || 'default'; }
    catch { return byId('profileSelect')?.value || 'default'; }
  }

  function customCompromisesKeyFor(profileId){
    return `secheapp.${String(profileId || 'default')}.customCompromises.${CUSTOM_COMPROMISES_KEY_VERSION}`;
  }

  function readStoredCustomCompromises(profileId){
    try {
      const raw = localStorage.getItem(customCompromisesKeyFor(profileId));
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function writeStoredCustomCompromises(profileId, list){
    try { localStorage.setItem(customCompromisesKeyFor(profileId), JSON.stringify(Array.isArray(list) ? list : [])); }
    catch {}
  }

  function sanitizeCustomName(name){
    return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  }

  function slugifyCustomName(name){
    return sanitizeCustomName(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'compromis';
  }

  function normalizeCustomEntry(entry){
    if (!entry || typeof entry !== 'object') return null;
    const name = sanitizeCustomName(entry.name || entry.label || 'Compromis personnalisé');
    const snapshot = entry.snapshot || entry.mapping || {};
    const id = String(entry.id || `custom__${slugifyCustomName(name)}`);
    return {
      id,
      name,
      snapshot: {
        dietMode: String(snapshot.dietMode || ''),
        carbGoal: String(snapshot.carbGoal || ''),
        fatFloorGPerKg: Number(snapshot.fatFloorGPerKg || 0),
        lowCarbEnabled: !!snapshot.lowCarbEnabled,
        lowCarbLevel: String(snapshot.lowCarbLevel || '')
      }
    };
  }

  function getCustomCompromises(){
    return readStoredCustomCompromises(getActiveProfileId()).map(normalizeCustomEntry).filter(Boolean);
  }

  function buildCustomApplyMap(){
    const out = {};
    getCustomCompromises().forEach((entry) => { out[entry.id] = Object.assign({}, entry.snapshot); });
    return out;
  }

  function getApplyMap(){
    return Object.assign({}, BUILTIN_COMPROMISE_APPLY_MAP, buildCustomApplyMap());
  }

  function buildCustomDataMap(){
    const out = {};
    getCustomCompromises().forEach((entry) => {
      const s = entry.snapshot || {};
      const carbLbl = carbGoalLabel(s.carbGoal || '');
      const dietLbl = dietPresetLabel(s.dietMode || '');
      const lowCarbLbl = s.lowCarbEnabled ? `activée${s.lowCarbLevel ? ' (' + _esc(s.lowCarbLevel) + ')' : ''}` : 'désactivée';
      out[entry.id] = {
        title: `Compromis personnalisé · ${entry.name}`,
        phase: 'Personnalisé (Expert)',
        objectif: ['Rejouer exactement tes réglages actuels', 'Conserver un preset personnel réutilisable'],
        compromis: ['La cohérence dépend du snapshot sauvegardé', 'Aucune logique libre au-delà des champs autorisés'],
        macros: { c:'—', p:'—', f:'—' },
        ajust: ['Basé sur les réglages présents au moment de l’enregistrement', 'À rééditer en créant un nouveau compromis si besoin'],
        appLines: [
          `Type de régime : ${dietLbl}`,
          `Repères glucides : ${carbLbl}`,
          `Plancher lipides : ${Number.isFinite(Number(s.fatFloorGPerKg)) ? Number(s.fatFloorGPerKg).toFixed(1) : '—'} g/kg`,
          `Option low-carb : ${lowCarbLbl}`
        ],
        plus:['Disponible uniquement en mode Expert.', 'Ce compromis reste un mapping, pas une logique métier supplémentaire.'],
        isCustom: true,
        customId: entry.id,
        customName: entry.name
      };
    });
    return out;
  }

  function getDataMap(){
    return Object.assign({}, BUILTIN_COMPROMISE_DATA, buildCustomDataMap());
  }

  function ensureCustomOptionGroup(sel){
    if (!sel) return null;
    let group = sel.querySelector('optgroup[data-compromise-custom-group="1"]');
    if (!group) {
      group = document.createElement('optgroup');
      group.label = 'Compromis personnalisés';
      group.setAttribute('data-compromise-custom-group','1');
      sel.appendChild(group);
    }
    return group;
  }

  function rebuildCustomOptions(sel, options = {}){
    if (!sel) return;
    const current = options.preferredValue != null ? String(options.preferredValue || '') : String(sel.value || '');
    const customGroup = ensureCustomOptionGroup(sel);
    customGroup.innerHTML = '';
    getCustomCompromises().forEach((entry) => {
      const opt = document.createElement('option');
      opt.value = entry.id;
      opt.textContent = `★ ${entry.name}`;
      customGroup.appendChild(opt);
    });

    let createOpt = sel.querySelector(`option[value="${CUSTOM_CREATE_OPTION_VALUE}"]`);
    if (!createOpt) {
      createOpt = document.createElement('option');
      createOpt.value = CUSTOM_CREATE_OPTION_VALUE;
      createOpt.textContent = '+ Créer un compromis personnalisé';
      sel.appendChild(createOpt);
    }

    const pending = String(sel.dataset.pendingCompromiseId || '');
    const target = current || pending;
    if (target && sel.querySelector(`option[value="${CSS.escape(target)}"]`)) {
      sel.value = target;
      sel.dataset.pendingCompromiseId = '';
    }
  }

  function reloadCustomCompromises(options = {}){
    const sel = byId('compromiseSelect');
    if (!sel) return '';
    rebuildCustomOptions(sel, options);
    return sel.value || '';
  }

  function createCustomCompromiseFromCurrentState(){
    const useMode = normalizeUseMode(byId('useMode')?.value || 'simple');
    const sel = byId('compromiseSelect');
    if (!sel) return '';
    if (useMode !== 'expert') return '';
    const rawName = window.prompt('Nom du compromis personnalisé', 'Mon compromis');
    if (rawName == null) return '';
    const name = sanitizeCustomName(rawName);
    if (!name) return '';

    const profileId = getActiveProfileId();
    const list = getCustomCompromises();
    let baseId = `custom__${slugifyCustomName(name)}`;
    let nextId = baseId;
    let idx = 2;
    const used = new Set(list.map(x => x.id));
    while (used.has(nextId) || Object.prototype.hasOwnProperty.call(BUILTIN_COMPROMISE_APPLY_MAP, nextId)) {
      nextId = `${baseId}-${idx++}`;
    }

    const entry = { id: nextId, name, snapshot: readCurrentCompromiseSignature() };
    list.push(entry);
    writeStoredCustomCompromises(profileId, list);
    reloadCustomCompromises({ preferredValue: nextId });
    return nextId;
  }

  function deleteCustomCompromise(customId){
    const id = String(customId || '');
    if (!id) return false;
    const profileId = getActiveProfileId();
    const list = getCustomCompromises();
    const target = list.find(x => String(x.id || '') === id);
    if (!target) return false;
    const ok = window.confirm(`Supprimer le compromis personnalisé « ${target.name} » ?`);
    if (!ok) return false;
    const nextList = list.filter(x => String(x.id || '') !== id);
    writeStoredCustomCompromises(profileId, nextList);
    const sel = byId('compromiseSelect');
    if (sel && String(sel.value || '') === id) {
      sel.value = '';
      sel.dataset.pendingCompromiseId = '';
    }
    reloadCustomCompromises({ preferredValue: '' });
    return true;
  }

  const COMPROMISE_MODE_ACCESS = {
    simple: ['eq_global','simple_maintain','recomp','cut_sport','endurance_volume'],
    sport: ['recomp','protect_cut','recovery','cut_sport','cut_fast','endurance_volume','endurance_comp'],
    expert: Object.keys(BUILTIN_COMPROMISE_APPLY_MAP)
  };

  function normalizeUseMode(mode){
    return (mode === 'sport' || mode === 'expert') ? mode : 'simple';
  }

  function getAllowedCompromiseIdsForMode(mode){
    const m = normalizeUseMode(mode);
    const base = (COMPROMISE_MODE_ACCESS[m] || []).slice();
    if (m === 'expert') {
      return base.concat(getCustomCompromises().map(x => x.id));
    }
    return base;
  }


  function readCurrentCompromiseSignature(){
    return {
      dietMode: byId('dietMode')?.value || '',
      carbGoal: byId('carbGoal')?.value || '',
      protPerKg: Number(byId('protPerKg')?.value || 0),
      fatFloorGPerKg: Number(byId('fatFloorGPerKg')?.value || 0),
      lowCarbEnabled: !!byId('lowCarbEnabled')?.checked,
      lowCarbLevel: byId('lowCarbLevel')?.value || ''
    };
  }

  function withinRecommended(value, min, max, epsilon = 0.001){
    const v = Number(value);
    if (!Number.isFinite(v)) return false;
    const hasMin = Number.isFinite(Number(min));
    const hasMax = Number.isFinite(Number(max));
    if (hasMin && v < Number(min) - epsilon) return false;
    if (hasMax && v > Number(max) + epsilon) return false;
    return true;
  }

  function compromiseMatchesCurrent(key){
    const cfg = getApplyMap()[String(key || '')];
    if (!cfg) return false;
    const cur = readCurrentCompromiseSignature();
    if ((cfg.dietMode || '') !== cur.dietMode) return false;
    if ((cfg.carbGoal || '') !== cur.carbGoal) return false;

    const hasProtRec = Number.isFinite(Number(cfg.protRecommendedMin)) || Number.isFinite(Number(cfg.protRecommendedMax));
    if (hasProtRec) {
      if (!withinRecommended(cur.protPerKg, cfg.protRecommendedMin, cfg.protRecommendedMax)) return false;
    } else if (Number.isFinite(Number(cfg.protPerKg)) && Math.abs(Number(cfg.protPerKg) - Number(cur.protPerKg || 0)) > 0.001) return false;

    const hasFatRec = Number.isFinite(Number(cfg.fatRecommendedMin)) || Number.isFinite(Number(cfg.fatRecommendedMax));
    if (hasFatRec) {
      if (!withinRecommended(cur.fatFloorGPerKg, cfg.fatRecommendedMin, cfg.fatRecommendedMax)) return false;
    } else if (Number.isFinite(Number(cfg.fatFloorGPerKg)) && Math.abs(Number(cfg.fatFloorGPerKg) - Number(cur.fatFloorGPerKg || 0)) > 0.001) return false;

    if (typeof cfg.lowCarbEnabled === 'boolean' && !!cfg.lowCarbEnabled !== !!cur.lowCarbEnabled) return false;
    if (Object.prototype.hasOwnProperty.call(cfg, 'lowCarbLevel') && String(cfg.lowCarbLevel || '') !== String(cur.lowCarbLevel || '')) return false;
    return true;
  }

  function revalidateCurrentSelection(options = {}){
    const sel = byId('compromiseSelect');
    if (!sel) return '';
    const current = String(sel.value || '');
    if (!current || current === CUSTOM_CREATE_OPTION_VALUE) return current;
    if (!compromiseMatchesCurrent(current)) {
      sel.value = '';
    }
    if (options.refresh !== false) refresh({ openOnChange:false });
    return sel.value || '';
  }

  function findMatchingCompromiseId(preferredKey){
    const pref = String(preferredKey || '');
    if (pref && compromiseMatchesCurrent(pref)) return pref;
    const keys = Object.keys(getApplyMap());
    for (const key of keys){
      if (key === pref) continue;
      if (compromiseMatchesCurrent(key)) return key;
    }
    return '';
  }

  const BUILTIN_COMPROMISE_DATA = {
    eq_global: {
      title:"Équilibre global (base santé / stabilité)",
      phase:"Équilibrage",
      objectif:["Poids stable","Énergie régulière","Glycémie plus stable","Habitudes durables"],
      compromis:["Pas d’optimisation extrême","Progression physique modérée"],
      macros:{ c:"≈ 45–55 %", p:"≈ 18–22 %", f:"≈ 25–35 %" },
      ajust:["Journée active → glucides ↑, lipides ↓","Journée calme → glucides ↓, lipides ↑","Protéines stables"],
      appLines:[
        "Type de régime : Maintien / équilibre",
        "Repères glucides : Maintien actif (4–6 g/kg/j)",
        "Plancher lipides : 1,00 g/kg",
        "Protéines : 1,6–1,9 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["Idéal pour poser une base saine avant toute phase plus spécifique.","Convient si l’objectif principal est la régularité, pas la transformation rapide."]
    },
    simple_maintain: {
      title:"Maintien simple (routine low-carb modérée)",
      phase:"Maintien / routine",
      objectif:["Tenir sur la durée","Réduire la charge mentale","Stabiliser l’énergie et l’appétit"],
      compromis:["Intensité explosive un peu moins favorisée","Souplesse sociale légèrement réduite"],
      macros:{ c:"≈ 30–40 %", p:"≈ 20–25 %", f:"≈ 35–40 %" },
      ajust:["Repas types répétés","Glucides plus cadrés au quotidien","Ajustement hebdo plutôt que journalier"],
      appLines:[
        "Type de régime : Maintien / équilibre",
        "Repères glucides : Maintien actif (4–6 g/kg/j)",
        "Plancher lipides : 1,00 g/kg",
        "Protéines : 1,6–1,9 g/kg",
        "Option low-carb : activée"
      ],
      plus:["Utile si tu veux une base simple, plus stable et moins gourmande en décisions.","Bon choix si la régularité et la satiété priment sur la performance explosive."]
    },
    recomp: {
      title:"Recomposition modérée",
      phase:"Transition",
      objectif:["Améliorer la composition corporelle","Préserver la masse musculaire","Maintenir un niveau d’énergie stable"],
      compromis:["Progression plus progressive","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 40–50 %", p:"≈ 20–25 %", f:"≈ 25–30 %" },
      ajust:["Glucides modulés à l’entraînement","Léger déficit certains jours seulement","Priorité au rassasiant"],
      appLines:[
        "Type de régime : Recomposition (léger déficit)",
        "Repères glucides : Recomposition (4–5 g/kg/j)",
        "Plancher lipides : 0,9 g/kg",
        "Protéines : 1,8–2,2 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["Idéal si le poids stagne mais que la composition corporelle s’améliore.","Convient bien aux phases de transition ou de reprise."]
    },
    simple_recomp: {
      title:"Recomposition simple (progression lente)",
      phase:"Transition / adhérence",
      objectif:["Améliorer la composition corporelle","Préserver la masse musculaire","Maintenir un niveau d’énergie stable"],
      compromis:["Perte de gras plus progressive","Suivi alimentaire nécessaire"],
      macros:{ c:"≈ 40–50 %", p:"≈ 22–28 %", f:"≈ 25–30 %" },
      ajust:["Garder une structure simple","Ajuster surtout à la semaine","Éviter la sur-précision quotidienne"],
      appLines:[
        "Type de régime : Recomposition (léger déficit)",
        "Repères glucides : Maintien actif (4–6 g/kg/j)",
        "Plancher lipides : 0,9 g/kg",
        "Protéines : 1,8–2,2 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["Bon choix si tu veux améliorer la composition corporelle sans vivre en mode sèche.","Convient aux périodes chargées où la simplicité prime sur l’optimisation."]
    },
    gly_satiety: {
      title:"Stabilité glycémique (équilibrage satiété)",
      phase:"Équilibrage / transition",
      objectif:["Stabiliser la glycémie","Maintenir l’énergie","Augmenter la satiété"],
      compromis:["Flexibilité alimentaire réduite","Phase d’adaptation possible"],
      macros:{ c:"≈ 35–45 %", p:"≈ 20–25 %", f:"≈ 30–35 %" },
      ajust:["Glucides concentrés autour de l’effort","Fibres ↑","Lipides plutôt éloignés du post-effort"],
      appLines:[
        "Type de régime : Recomposition (léger déficit)",
        "Repères glucides : Recomposition (4–5 g/kg/j)",
        "Plancher lipides : 0,9–1,0 g/kg",
        "Protéines : 1,8–2,2 g/kg",
        "Option low-carb : activée"
      ],
      plus:["Utile si tu as souvent faim, des coups de barre ou des envies de sucre.","Convient mieux aux journées peu explosives qu’aux efforts très intenses."]
    },
    protect_cut: {
      title:"Protection musculaire (léger déficit)",
      phase:"Déficit lent / protection masse maigre",
      objectif:["Préserver la masse maigre","Améliorer la récupération","Réduire le risque de fonte musculaire"],
      compromis:["Perte de gras plus progressive","Apports énergétiques modérés","Suivi alimentaire nécessaire"],
      macros:{ c:"≈ 35–45 %", p:"≈ 25–30 %", f:"≈ 25–30 %" },
      ajust:["Protéines bien réparties sur la journée","Glucides utiles autour de l’effort","Lipides stables pour tenir la durée"],
      appLines:[
        "Type de régime : Recomposition (léger déficit)",
        "Repères glucides : Recomposition (4–5 g/kg/j)",
        "Plancher lipides : 0,9 g/kg",
        "Protéines : 2,0–2,3 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["Pertinent quand la priorité est de sécher lentement sans entamer la masse maigre.","Utile si tu veux rester entraînable tout en gardant un déficit modéré."]
    },
    recovery: {
      title:"Récupération optimisée (fatigue / volume)",
      phase:"Fatigue / volume",
      objectif:["Améliorer la récupération","Réduire la fatigue","Préserver la qualité d’entraînement"],
      compromis:["Apports énergétiques plus élevés","Progression plus progressive"],
      macros:{ c:"≈ 30–40 %", p:"≈ 25–30 %", f:"≈ 30–35 %" },
      ajust:["Glucides renforcés post-effort","Lipides légèrement plus hauts les jours OFF","Surveillance fatigue / sommeil / charge"],
      appLines:[
        "Type de régime : Standard (sportif)",
        "Repères glucides : Sèche progressive (3–4 g/kg/j)",
        "Plancher lipides : 0,9–1,0 g/kg",
        "Protéines : 1,8–2,2 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["Idéal en période de fatigue, de reprise, ou quand la récupération devient prioritaire.","Bon choix si tu veux continuer à t’entraîner sans t’écraser nerveusement."]
    },
    cut_sport: {
      title:"Sèche progressive (référence low-carb modérée)",
      phase:"Amaigrissement",
      objectif:["Perte de gras progressive","Meilleure maîtrise de l’appétit","Masse musculaire préservée"],
      compromis:["Performance intense un peu réduite","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 30–40 %", p:"≈ 25–30 %", f:"≈ 30–35 %" },
      ajust:["Glucides surtout utiles autour de l’effort","Jours OFF plus bas en glucides","Protéines hautes et stables"],
      appLines:[
        "Type de régime : Standard (sportif)",
        "Repères glucides : Sèche progressive (3–4 g/kg/j)",
        "Plancher lipides : 0,9 g/kg",
        "Protéines : 2,0–2,3 g/kg",
        "Option low-carb : activée"
      ],
      plus:["Bon compromis si tu veux sécher en gardant un cadre glucidique plus strict.","Plus tranché que récupération prioritaire, sans aller vers la sèche agressive."]
    },
    cut_fast: {
      title:"Sèche rapide (court terme)",
      phase:"Amaigrissement (court terme)",
      objectif:["Perte de gras rapide","Résultat visible à court terme"],
      compromis:["Performance en baisse","Fatigue accrue","Durée limitée"],
      macros:{ c:"≈ 25–35 %", p:"≈ 30–35 %", f:"≈ 25–30 %" },
      ajust:["Réduire le volume d’entraînement","Planifier une pause / refeed si nécessaire","Surveiller sommeil / récupération"],
      appLines:[
        "Type de régime : Agressif (court terme)",
        "Repères glucides : Sèche stricte (2–3 g/kg/j)",
        "Plancher lipides : 0,8 g/kg",
        "Protéines : 2,2–2,6 g/kg",
        "Option low-carb : activée"
      ],
      plus:["À utiliser comme un outil ponctuel, jamais comme un mode de vie.","Adapté à un objectif rapide avec une date précise."]
    },
    endurance_volume: {
      title:"Endurance optimisée (volume)",
      phase:"Performance / volume",
      objectif:["Soutenir l’endurance","Maintenir l’énergie","Soutenir la performance"],
      compromis:["Amaigrissement non prioritaire","Apports énergétiques plus élevés"],
      macros:{ c:"≈ 55–65 %", p:"≈ 15–20 %", f:"≈ 20–30 %" },
      ajust:["Apports glucidiques réguliers","Protéines stables","Lipides maintenus suffisamment hauts hors surcharge glucidique"],
      appLines:[
        "Type de régime : Endurance optimisée",
        "Repères glucides : Endurance / volume (6–8 g/kg/j)",
        "Plancher lipides : 0,9–1,1 g/kg",
        "Protéines : 1,6–2,0 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["À privilégier quand la performance et le volume priment sur l’esthétique.","Peu compatible avec un objectif d’amaigrissement rapide."]
    },
    endurance_comp: {
      title:"Performance compétition (carb-loading)",
      phase:"Performance / compétition",
      objectif:["Préparer un effort long","Maintenir l’énergie","Soutenir la performance"],
      compromis:["Fenêtre d’utilisation courte","Mise en œuvre plus technique"],
      macros:{ c:"≈ 65–75 %", p:"≈ 15–20 %", f:"≈ 15–20 %" },
      ajust:["Carb-loading sur 24–72 h","Hausse des glucides sans casser la structure du preset","Retour au mode endurance volume après la fenêtre de charge"],
      appLines:[
        "Type de régime : Endurance optimisée",
        "Repères glucides : Carb-loading (8–12 g/kg/j)",
        "Plancher lipides : 0,9 g/kg",
                "Protéines : 1,6–1,8 g/kg",
        "Option low-carb : inactive"
      ],
      plus:["À réserver aux fenêtres de préparation compétition, pas au quotidien.","Pense ce compromis comme une surcharge glycogénique courte, sans modifier la structure du preset."]
    }
  };

function dietPresetLabel(key){
  if (!key) return "—";
  // accepte "maintain / équilibre" (texte déjà prêt)
  if (key.includes("/") || key.includes(" ")) return key;
  if (typeof dietLabel === "function") return dietLabel(key);
  if (typeof DIET_PRESETS !== "undefined" && DIET_PRESETS[key]?.label) return DIET_PRESETS[key].label;
  return key;
}

function carbGoalLabel(key){
  if (!key) return "—";
  if (typeof CARB_GOALS !== "undefined" && CARB_GOALS[key]?.label) return CARB_GOALS[key].label;
  return key;
}

function fatFloorLabel(key){
  if (!key) return "—";
  if (typeof FAT_FLOORS !== "undefined" && FAT_FLOORS[key]?.note) return FAT_FLOORS[key].note; // plus humain
  if (typeof FAT_FLOORS !== "undefined" && FAT_FLOORS[key]?.min != null) return `Plancher ${FAT_FLOORS[key].min} g/kg`;
  return key;
}

function normalizeMacroPct(value){
  return String(value || '')
    .replace(/\s*≈\s*/g, '≈ ')
    .replace(/\s*%/g, ' %')
    .replace(/\s*–\s*/g, '–')
    .trim();
}

function formatMacroBalance(macros){
  const c = normalizeMacroPct(macros?.c);
  const p = normalizeMacroPct(macros?.p);
  const f = normalizeMacroPct(macros?.f);
  return `Glucides ${_esc(c)} · Protéines ${_esc(p)} · Lipides ${_esc(f)}`;
}


  function ensureSelectDeleteButton(sel){
    if (!sel) return null;
    let wrap = sel.parentElement;
    if (!wrap || wrap.getAttribute('data-compromise-select-wrap') !== '1') {
      wrap = document.createElement('div');
      wrap.setAttribute('data-compromise-select-wrap', '1');
      wrap.style.position = 'relative';
      wrap.style.display = 'block';
      wrap.style.width = '100%';
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);
    }
    if (!sel.dataset.compromiseDeletePadApplied) {
      sel.style.paddingRight = '4.2rem';
      sel.dataset.compromiseDeletePadApplied = '1';
    }
    let btn = wrap.querySelector('[data-compromise-select-delete="1"]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-compromise-select-delete', '1');
      btn.setAttribute('title', 'Supprimer ce compromis personnalisé');
      btn.setAttribute('aria-label', 'Supprimer ce compromis personnalisé');
      btn.textContent = '🗑';
      btn.style.position = 'absolute';
      btn.style.right = '2.15rem';
      btn.style.top = '50%';
      btn.style.transform = 'translateY(-50%)';
      btn.style.border = '1px solid rgba(255,255,255,.12)';
      btn.style.background = 'rgba(255,255,255,.04)';
      btn.style.color = 'inherit';
      btn.style.borderRadius = '999px';
      btn.style.padding = '.12rem .30rem';
      btn.style.fontSize = '.74rem';
      btn.style.lineHeight = '1';
      btn.style.cursor = 'pointer';
      btn.style.opacity = '.88';
      btn.style.zIndex = '3';
      btn.style.display = 'none';
      btn.style.width = 'auto';
      btn.style.minWidth = '0';
      btn.style.maxWidth = '1.65rem';
      btn.style.height = '1.35rem';
      btn.style.boxSizing = 'border-box';
      btn.style.whiteSpace = 'nowrap';
      btn.style.overflow = 'hidden';
      btn.style.textOverflow = 'clip';
      btn.style.flex = '0 0 auto';
      wrap.appendChild(btn);
    }
    return btn;
  }

  function updateSelectDeleteButton(sel){
    const btn = ensureSelectDeleteButton(sel);
    if (!btn || !sel) return;
    const value = String(sel.value || '');
    const useMode = normalizeUseMode(byId('useMode')?.value || 'simple');
    const visible = useMode === 'expert' && value.startsWith('custom__');
    btn.style.display = visible ? 'inline-flex' : 'none';
    btn.disabled = !visible;
    btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function render(c){
    const chips = Array.isArray(c.appLines)
      ? c.appLines.slice()
      : (() => {
          const out = [];
          if (c.app?.preset) out.push(`Type de régime : ${dietPresetLabel(c.app.preset)}`);
          if (Array.isArray(c.app?.carbGoals)) out.push(`Repères glucides : ${c.app.carbGoals.map(carbGoalLabel).join(", ")}`);
          if (Array.isArray(c.app?.fatFloors)) out.push(`Plancher lipides : ${c.app.fatFloors.map(fatFloorLabel).join(", ")}`);
          if (c.app?.note) out.push(c.app.note);
          return out;
        })();

    const list = (arr)=> `<ul class="muted" style="margin:.25rem 0 .25rem 1.1rem">${arr.map(x=>`<li>${_esc(x)}</li>`).join("")}</ul>`;
    const customDelete = c.isCustom && c.customId
      ? `<button type="button" data-delete-custom-compromise="${_esc(c.customId)}" title="Supprimer ce compromis personnalisé" aria-label="Supprimer ce compromis personnalisé" style="margin-left:.5rem;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;border-radius:999px;padding:.12rem .42rem;font-size:.82rem;line-height:1;cursor:pointer;opacity:.82;vertical-align:middle">🗑</button>`
      : '';

    return `
      <div style="margin-bottom:.35rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap"><div><b>${_esc(c.title)}</b> <span class="muted">— ${_esc(c.phase)}</span>${customDelete}</div></div>
      <table>
        <tbody>
          <tr><th style="width:220px">Objectif (apporte)</th><td>${list(c.objectif)}</td></tr>
          <tr><th>Compromis</th><td>${list(c.compromis)}</td></tr>
          <tr><th>Équilibre macros (%)</th>
              <td class="muted">${formatMacroBalance(c.macros)}</td></tr>
          <tr><th>Ajustement fin</th><td>${list(c.ajust)}</td></tr>
          <tr><th>Réglages appliqués par l’app</th><td class="muted">${_esc(chips.join(" · "))}</td></tr>
        </tbody>
      </table>
      <div class="muted" style="margin-top:.5rem">
        <b>👉</b> ${_esc(c.plus[0])}<br>
        <b>👉</b> ${_esc(c.plus[1])}
      </div>
    `;
  }

  function wire(){
    const sel = byId("compromiseSelect");
    const box = byId("compromiseBox");
    const summary = byId("compromiseSummary");
    const details = byId("compromiseDetails");
    if (!sel || !box) return;

    let prevKey = String(sel.value || "");

    function buildSummary(c){
      const o = Array.isArray(c.objectif) ? c.objectif.slice(0,2) : [];
      const k = Array.isArray(c.compromis) ? c.compromis.slice(0,1) : [];
      const bits = []
        .concat(o.map(x=>_esc(x)))
        .concat(k.map(x=>_esc(x)));
      return `<b>${_esc(c.phase)}</b> · ${bits.join(" · ")}`;
    }

    function buildNeutralCompromiseState(){
      const expert = normalizeUseMode(byId('useMode')?.value || 'simple') === 'expert';
      const c = {
        title: expert ? 'Créer un compromis personnalisé' : 'Aucun compromis actif',
        phase: expert ? 'Personnalisé (Expert)' : 'Compromis inactif',
        objectif: expert
          ? ['Repartir de tes réglages actuels', 'Enregistrer un compromis réutilisable pour ce profil']
          : ['Ajuster librement les réglages sans compromis actif', 'Conserver le preset courant si ses bornes sont respectées'],
        compromis: expert
          ? ['Le compromis précédent n’est plus respecté', 'Tu peux créer un compromis personnalisé à partir de l’état actuel']
          : ['Le compromis précédent n’est plus respecté', 'Tu peux continuer sans compromis ou revenir dans sa plage recommandée'],
        macros: { c:'—', p:'—', f:'—' },
        ajust: expert
          ? ['Ajuste tes réglages actuels puis choisis + Créer un compromis personnalisé', 'Aucun changement moteur supplémentaire n’est créé']
          : ['Le preset reste actif', 'Le compromis saute dès que tu sors de sa plage recommandée'],
        appLines: expert
          ? ['Compromis actif : aucun', 'Action disponible : + Créer un compromis personnalisé', 'Le preset actuel reste inchangé']
          : ['Compromis actif : aucun', 'Le preset actuel reste inchangé', 'Tu peux poursuivre les réglages manuellement'],
        plus: expert
          ? ['Tu as quitté la plage recommandée du compromis précédent.', 'Si cet état te convient, enregistre-le comme compromis personnalisé.']
          : ['Tu as quitté la plage recommandée du compromis précédent.', 'Le panneau reste ouvert pour éviter toute rupture visuelle pendant l’ajustement.']
      };
      return c;
    }

    function refresh(options = {}){
      const key = String(sel.value || "");
      const c = getDataMap()[key];
      updateSelectDeleteButton(sel);

      if (!c){
        const neutral = buildNeutralCompromiseState();
        if (summary) summary.innerHTML = '<b>Aucun compromis actif</b>.';
        box.innerHTML = render(neutral);
        prevKey = key;
        return key;
      }

      if (summary) summary.innerHTML = buildSummary(c);
      box.innerHTML = render(c);

      if (details && options.openOnChange !== false){
        if (prevKey !== key && key){
          details.open = true;
        }
      }
      prevKey = key;
      return key;
    }

    function applyModeFilter(mode, options = {}){
      reloadCustomCompromises({ preferredValue: sel.value || sel.dataset.pendingCompromiseId || '' });
      const normalizedMode = normalizeUseMode(mode);
      const allowed = new Set(getAllowedCompromiseIdsForMode(normalizedMode));
      const currentValue = String(sel.value || '');
      Array.from(sel.options || []).forEach((opt) => {
        const value = String(opt.value || '');
        if (!value) {
          opt.hidden = false;
          opt.disabled = false;
          return;
        }
        if (value === CUSTOM_CREATE_OPTION_VALUE) {
          const visible = normalizedMode === 'expert';
          opt.hidden = !visible;
          opt.disabled = !visible;
          return;
        }
        const visible = allowed.has(value);
        opt.hidden = !visible;
        opt.disabled = !visible;
      });
      const customGroup = sel.querySelector('optgroup[data-compromise-custom-group="1"]');
      if (customGroup) customGroup.hidden = normalizedMode !== 'expert';

      if (currentValue && !allowed.has(currentValue)) {
        sel.value = '';
      }

      updateSelectDeleteButton(sel);
      if (options.refresh !== false) {
        refresh({ openOnChange:false });
      }
      return sel.value || '';
    }

    function syncSelectionFromSettings(options = {}){
      const currentValue = String(sel.value || '');
      const matched = findMatchingCompromiseId(currentValue);
      const nextValue = matched || (options.keepCurrentIfUnmatched ? currentValue : '');
      if (currentValue !== String(nextValue || '')) {
        sel.value = String(nextValue || '');
      }
      return refresh({ openOnChange: options.openOnChange === true });
    }

    window.__CompromiseUI = Object.assign({}, window.__CompromiseUI || {}, {
      reloadCustomCompromises,
      createCustomCompromiseFromCurrentState,
      getCustomCompromises,
      getApplyMap,
      deleteCustomCompromise,
      refresh,
      syncSelectionFromSettings,
      findMatchingCompromiseId,
      compromiseMatchesCurrent,
      readCurrentCompromiseSignature,
      applyModeFilter,
      getAllowedCompromiseIdsForMode,
      revalidateCurrentSelection
    });

    sel.addEventListener("change", () => {
      if (String(sel.value || '') === CUSTOM_CREATE_OPTION_VALUE) return;
      refresh({ openOnChange:true });
    });
    const selectDeleteBtn = ensureSelectDeleteButton(sel);
    if (selectDeleteBtn) {
      selectDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentId = String(sel.value || '');
        if (!currentId || !currentId.startsWith('custom__')) return;
        const deleted = deleteCustomCompromise(currentId);
        if (!deleted) return;
        applyModeFilter(byId('useMode')?.value || 'simple', { refresh:false });
        refresh({ openOnChange:false });
      });
    }
    box.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('[data-delete-custom-compromise]') : null;
      if (!btn) return;
      const deleted = deleteCustomCompromise(btn.getAttribute('data-delete-custom-compromise'));
      if (!deleted) return;
      applyModeFilter(byId('useMode')?.value || 'simple', { refresh:false });
      refresh({ openOnChange:false });
    });
    reloadCustomCompromises({ preferredValue: sel.dataset.pendingCompromiseId || sel.value || '' });
    applyModeFilter(byId('useMode')?.value || 'simple', { refresh:false });
    updateSelectDeleteButton(sel);
    refresh({ openOnChange:false });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
