/**
 * ZBOD Tool - Zero Based Organizational Design
 * Landing page simplified: only Overview card retained
 */

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const state = {
  currentPage: 'landing',
  selectedDivisionId: null,
  selectedWorkshopId: null,
  selectedHistoryWorkshopId: null,
  editingDivision: false,
  editingValues: {},
  phase2Scores: {},
  phase3Values: {},
  asIsNewRows: [],
  asIsEditing: {},
  landingEditing: null,
  landingDrafts: {},
  aaaEditCardIdx: null,
  aaaCards: {},
  metricsDraft: {},
  toastId: 0,
  showRatingGuide: false,
  _divEditForm: null,
};

let orgZoomScale = 1.0;
let orgIsPanning = false;
let orgPanStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const STRUCTURE_NAMES = [
  'Azerconnect Group - Business Assurance, Risk Management and HSE Division',
  'Azerconnect Group - Business Development Division',
  'Azerconnect Group - CEO Office',
  'Azerconnect Group - Customer Operations Division',
  'Azerconnect Group - Finance',
  'Azerconnect Group - Governmental Relations and Legal Division',
  'Azerconnect Group - Human Resources',
  'Azerconnect Group - Information Security Division',
  'Azerconnect Group - Information Technologies and Core Network Division',
  'Azerconnect Group - Internal Audit.',
  'Azerconnect Group - Marketing (AZRC)',
  'Azerconnect Group - Network Technologies.',
  'Azerconnect Group - Procurement and Project Delivery Division',
  'Azerconnect Group - Sales (AZRC)',
  'Azedunet - Finance department',
  'Azedunet - HR & Administrative Services Department',
  'Azedunet - Contracts departament',
  'Azedunet - Network Support department',
  'Azedunet - Services Desk department',
  'Azedunet - System Integration department',
  'Azedunet - Technical Support department',
  'Azedunet - Technological Services & System Development department',
  'Azerfon - Sales',
  'Azerfon - Marketing',
  'Azerfon - General Management',
  'Bakcell - Sales',
  'Bakcell - Marketing',
  'Bakcell - General Marketing',
  'GoldenPay - Cash Business Division',
  'GoldenPay - Commercial Division',
  'GoldenPay - Finance Division',
  'GoldenPay - IT Division',
  'GoldenPay - Internal Control and Compliance Division',
  'GoldenPay - CEO Office',
  'GoldenPay - Operations Division',
  'Ultranet Telco Services',
  'Uninet',
  'MegaLink',
  'NYU MEDI?A.AZ',
  'Onlayn Od?m?',
  'Ravy Group',
  'Ravy Hospitality',
  'Ravy Property',
  'Texnolyuks M',
  'BBTV',
  'Azqtel',
  'Azerconnect DataSphere',
  'BTH',
  'Other'
];

const STRUCTURE_TYPES = ['Division', 'Department', 'Unit', 'Other'];

const LS = {
  divisions: 'zbod_divisions',
  workshops: 'zbod_workshops',
  functions: 'zbod_functions',
  asIs: 'zbod_as_is',
  landing: 'zbod_landing',
  metrics: 'zbod_metrics',
  keyFindings: 'zbod_key_findings',
  aaaCards: 'zbod_aaa_cards',
  aaaTitles: 'zbod_aaa_titles',
};

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
function lsGet(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error('ls write failed', e); } }
function genId() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2); }

function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatNumber(num) {
  if (num === null || num === undefined || num === '') return '';
  const n = typeof num === 'string' ? num.replace(/\s/g, '') : num;
  const val = parseFloat(n);
  if (isNaN(val)) return num;
  return val.toLocaleString('en-US').replace(/,/g, ' ');
}

function unformatNumber(str) {
  if (!str) return '';
  return String(str).replace(/\s/g, '');
}

function getStructureTypeLabel(type) {
  if (!type || type === 'Division') return 'Division';
  if (type === 'Department') return 'Department';
  if (type === 'Unit') return 'Unit';
  return 'Custom';
}

function getWorkspaceTitle(type) {
  const label = getStructureTypeLabel(type);
  return label + ' Workspace';
}

function getDataBoxTitle(type) {
  const label = getStructureTypeLabel(type);
  return label + ' Data';
}

function getManageText(type) {
  const label = getStructureTypeLabel(type);
  return `Manage ${label} data, current functions, and workshops`;
}

document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

// ═══════════════════════════════════════════
// LOCALSTORAGE DATA LAYER
// ═══════════════════════════════════════════
function getDivs() { return lsGet(LS.divisions, []); }
function addDiv(data) {
  const divs = getDivs(); const now = new Date().toISOString();
  const d = { id: genId(), ...data, created_at: now, updated_at: now };
  divs.push(d); lsSet(LS.divisions, divs);
  if (window.zbodSupabase) window.zbodSupabase.sbSaveDivision(d);
  return d;
}
function updDiv(id, updates) {
  const divs = getDivs().map(d => d.id === id ? {...d, ...updates, updated_at: new Date().toISOString()} : d);
  lsSet(LS.divisions, divs);
  const updated = divs.find(d => d.id === id);
  if (updated && window.zbodSupabase) window.zbodSupabase.sbSaveDivision(updated);
}
function delDiv(id) {
  lsSet(LS.divisions, getDivs().filter(d => d.id !== id));
  if (window.zbodSupabase) window.zbodSupabase.sbDeleteDivision(id);
}

function getWs() { return lsGet(LS.workshops, []); }
function addWs(divisionId) {
  const ws = getWs(); const now = new Date().toISOString();
  const w = { id: genId(), division_id: divisionId, status: 'draft', phase: 1, completed_at: null, created_at: now, updated_at: now };
  ws.push(w); lsSet(LS.workshops, ws);
  if (window.zbodSupabase) window.zbodSupabase.sbSaveWorkshop(w);
  return w;
}
function updWs(id, updates) {
  const workshops = getWs().map(w => w.id === id ? {...w, ...updates, updated_at: new Date().toISOString()} : w);
  lsSet(LS.workshops, workshops);
  const updated = workshops.find(w => w.id === id);
  if (updated && window.zbodSupabase) window.zbodSupabase.sbSaveWorkshop(updated);
}

function getFns() { return lsGet(LS.functions, []); }
function addFn(workshopId, num) {
  const fns = getFns(); const now = new Date().toISOString();
  const fn = { id: genId(), workshop_id: workshopId, function_number: num, proposed_function_name: '', career_level: '', function_structure_type: '', parent_id: '', strategic_justification: '', can_be_eliminated: '', can_be_automated: '', can_be_outsourced: '', justification_alert: null, question1_score: null, question2_score: null, total_score: null, zbod_decision: null, target_headcount: null, target_budget: null, total_hc: null, hc_allocation_percent: null, proposed_hc: null, total_budget: null, cost_allocation_percent: null, proposed_budget: null, manager_count: null, professional_count: null, span_of_control: null, span_alert: null, created_at: now, updated_at: now };
  fns.push(fn); lsSet(LS.functions, fns);
  if (window.zbodSupabase) window.zbodSupabase.sbSaveFunction(fn);
  return fn;
}
function updFn(id, updates) {
  const fns = getFns().map(f => f.id === id ? {...f, ...updates, updated_at: new Date().toISOString()} : f);
  lsSet(LS.functions, fns);
  const updated = fns.find(f => f.id === id);
  if (updated && window.zbodSupabase) window.zbodSupabase.sbSaveFunction(updated);
}
function delFn(id) {
  lsSet(LS.functions, getFns().filter(f => f.id !== id));
  if (window.zbodSupabase) window.zbodSupabase.sbDeleteFunction(id);
}

function getAsIs() { return lsGet(LS.asIs, []); }
function addAsIsFn(divisionId, name) {
  const ais = getAsIs(); const now = new Date().toISOString();
  const fn = { id: genId(), division_id: divisionId, function_name: name, manager_count: 0, current_employee_count: 0, current_function_hc: 0, current_budget: 0, target_headcount: null, target_budget: null, created_at: now, updated_at: now };
  ais.push(fn); lsSet(LS.asIs, ais);
  if (window.zbodSupabase) window.zbodSupabase.sbSaveAsIsFunction(fn);
  return fn;
}
function updAsIsFn(id, updates) {
  const ais = getAsIs().map(f => f.id === id ? {...f, ...updates, updated_at: new Date().toISOString()} : f);
  lsSet(LS.asIs, ais);
  const updated = ais.find(f => f.id === id);
  if (updated && window.zbodSupabase) window.zbodSupabase.sbSaveAsIsFunction(updated);
}
function delAsIsFn(id) {
  lsSet(LS.asIs, getAsIs().filter(f => f.id !== id));
  if (window.zbodSupabase) window.zbodSupabase.sbDeleteAsIsFunction(id);
}

function getMetrics() { return lsGet(LS.metrics, {}); }
function setMetrics(metrics) { lsSet(LS.metrics, metrics); }
function getAAACards() { return lsGet(LS.aaaCards, {}); }
function setAAACards(cards) { lsSet(LS.aaaCards, cards); }

// ═══════════════════════════════════════════
// SUPABASE INTEGRATION
// ═══════════════════════════════════════════
let sb = window.zbodSupabase;

async function loadFromSupabase() {
  sb = window.zbodSupabase;
  if (!sb || !sb.supabaseAvailable) {
    console.log('Supabase not available, using localStorage data');
    return;
  }
  try {
    console.log('Loading data from Supabase...');
    const data = await sb.sbLoadAll();
    if (!data) return;

    if (data.divisions && data.divisions.length > 0) {
      const localDivs = getDivs();
      const merged = [...localDivs];
      data.divisions.forEach(sd => {
        const idx = merged.findIndex(ld => ld.id === sd.id);
        if (idx >= 0) {
          const localDate = new Date(merged[idx].updated_at || 0);
          const sbDate = new Date(sd.updated_at || 0);
          if (sbDate >= localDate) merged[idx] = sd;
        } else {
          merged.push(sd);
        }
      });
      lsSet(LS.divisions, merged);
    }

    if (data.workshops && data.workshops.length > 0) {
      const localWs = getWs();
      const merged = [...localWs];
      data.workshops.forEach(sw => {
        const idx = merged.findIndex(lw => lw.id === sw.id);
        if (idx >= 0) {
          const localDate = new Date(merged[idx].updated_at || 0);
          const sbDate = new Date(sw.updated_at || 0);
          if (sbDate >= localDate) merged[idx] = sw;
        } else {
          merged.push(sw);
        }
      });
      lsSet(LS.workshops, merged);
    }

    if (data.functions && data.functions.length > 0) {
      const localFns = getFns();
      const merged = [...localFns];
      data.functions.forEach(sf => {
        const idx = merged.findIndex(lf => lf.id === sf.id);
        if (idx >= 0) {
          const localDate = new Date(merged[idx].updated_at || 0);
          const sbDate = new Date(sf.updated_at || 0);
          if (sbDate >= localDate) merged[idx] = sf;
        } else {
          merged.push(sf);
        }
      });
      lsSet(LS.functions, merged);
    }

    if (data.asIsFns && data.asIsFns.length > 0) {
      const localAsIs = getAsIs();
      const merged = [...localAsIs];
      data.asIsFns.forEach(saf => {
        const idx = merged.findIndex(lf => lf.id === saf.id);
        if (idx >= 0) {
          const localDate = new Date(merged[idx].updated_at || 0);
          const sbDate = new Date(saf.updated_at || 0);
          if (sbDate >= localDate) merged[idx] = saf;
        } else {
          merged.push(saf);
        }
      });
      lsSet(LS.asIs, merged);
    }

    console.log('Supabase data loaded and merged');
  } catch (e) {
    console.warn('Failed to load from Supabase:', e);
  }
}

// ═══════════════════════════════════════════
// BUSINESS LOGIC
// ═══════════════════════════════════════════
function computePhase1Alert(elim, auto, out) {
  if (!elim || !auto || !out) return null;
  if (elim === 'No' && auto === 'No' && out === 'No') return 'PASSED FILTER';
  if (elim === 'Yes' && auto === 'No' && out === 'No') return 'REVIEW FOR ELIMINATION';
  if (elim === 'No' && auto === 'Yes' && out === 'No') return 'REVIEW FOR AUTOMATION';
  if (elim === 'No' && auto === 'No' && out === 'Yes') return 'REVIEW FOR OUTSOURCING';
  const r = []; if (elim === 'Yes') r.push('ELIMINATION'); if (auto === 'Yes') r.push('AUTOMATION'); if (out === 'Yes') r.push('OUTSOURCING');
  return `REVIEW FOR ${r.join(' AND ')}`;
}

function computePhase2Decision(q1, q2) {
  const total = q1 + q2;
  if (total >= 9) return 'INVEST';
  if (total >= 7) return 'KEEP';
  if (total >= 5) return 'OPTIMIZE';
  return 'ELIMINATE';
}

function computePhase3(f, data) {
  const totalHC = data.total_hc !== undefined ? data.total_hc : (f.total_hc || 0);
  const hcAlloc = data.hc_allocation_percent !== undefined ? data.hc_allocation_percent : f.hc_allocation_percent;
  const totalBudget = data.total_budget !== undefined ? data.total_budget : (f.total_budget || 0);
  const costAlloc = data.cost_allocation_percent !== undefined ? data.cost_allocation_percent : f.cost_allocation_percent;
  const mgrCount = data.manager_count !== undefined ? data.manager_count : f.manager_count;
  const profCount = data.professional_count !== undefined ? data.professional_count : f.professional_count;
  const careerLevel = data.career_level || f.career_level;

  const proposedHC = totalHC && hcAlloc ? Math.round((totalHC * hcAlloc) / 100) : null;
  const proposedBudget = totalBudget && costAlloc ? Math.round((totalBudget * costAlloc) / 100) : null;
  const span = profCount && mgrCount && mgrCount > 0 ? profCount / mgrCount : null;

  let spanAlert = f.span_alert;
  if (span !== null && careerLevel) {
    let minSpan = 6, maxSpan = 12;
    if (careerLevel === 'Top Management' || careerLevel === 'Top') { minSpan = 4; maxSpan = 8; }
    else if (careerLevel === 'Senior Management' || careerLevel === 'Senior') { minSpan = 5; maxSpan = 10; }
    if (span < minSpan) spanAlert = 'Possible Over-Management';
    else if (span > maxSpan) spanAlert = 'Possible Management Overload';
    else spanAlert = 'Within Benchmark';
  }
  return { proposed_hc: proposedHC, proposed_budget: proposedBudget, span_of_control: span, span_alert: spanAlert };
}

function calculateProposedHeadcount(workshopId) {
  const fns = getFns().filter(f => f.workshop_id === workshopId);
  return fns.reduce((sum, f) => sum + (f.proposed_hc || 0), 0);
}

function calculateProposedBudget(workshopId) {
  const fns = getFns().filter(f => f.workshop_id === workshopId);
  return fns.reduce((sum, f) => sum + (f.proposed_budget || 0), 0);
}

function calculateDashboardMetrics(workshopId) {
  const ws = getWs().find(w => w.id === workshopId);
  if (!ws) return null;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return null;
  const fns = getFns().filter(f => f.workshop_id === workshopId).sort((a, b) => a.function_number - b.function_number);
  const asIsFns = getAsIs().filter(f => f.division_id === ws.division_id);

  const totalAsIsHC = asIsFns.reduce((s, f) => s + (f.current_function_hc || 0), 0);
  const totalAsIsBudget = asIsFns.reduce((s, f) => s + (f.current_budget || 0), 0);
  const totalToBeHC = calculateProposedHeadcount(workshopId);
  const totalToBeBudget = calculateProposedBudget(workshopId);

  const inc = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'INVEST');
  const kp = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'KEEP');
  const opt = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'OPTIMIZE');
  const elm = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'ELIMINATE');

  return {
    workshop: ws,
    division: div,
    functions: fns,
    asIsFunctions: asIsFns,
    totalAsIsHC,
    totalAsIsBudget,
    totalToBeHC,
    totalToBeBudget,
    targetHC: div.headcount_target || 0,
    targetBudget: div.budget_target || 0,
    investCount: inc.length,
    keepCount: kp.length,
    optimizeCount: opt.length,
    eliminateCount: elm.length,
    invest: inc,
    keep: kp,
    optimize: opt,
    eliminate: elm,
  };
}

function finalizeWorkshopCalculations(workshopId) {
  const ws = getWs().find(w => w.id === workshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === workshopId);

  fns.forEach(fn => {
    const updates = {};
    updates.total_hc = div.current_total_hc || 0;
    updates.total_budget = div.budget_target || 0;

    const merged = { ...fn, ...updates };
    const computed = computePhase3(fn, merged);

    if (computed.proposed_hc !== null && computed.proposed_hc !== fn.proposed_hc) {
      updates.proposed_hc = computed.proposed_hc;
    }
    if (computed.proposed_budget !== null && computed.proposed_budget !== fn.proposed_budget) {
      updates.proposed_budget = computed.proposed_budget;
    }
    if (computed.span_of_control !== null && computed.span_of_control !== fn.span_of_control) {
      updates.span_of_control = computed.span_of_control;
    }
    if (computed.span_alert !== null && computed.span_alert !== fn.span_alert) {
      updates.span_alert = computed.span_alert;
    }

    if (fn.hc_allocation_percent && !updates.proposed_hc && updates.total_hc) {
      updates.proposed_hc = Math.round((updates.total_hc * fn.hc_allocation_percent) / 100);
    }
    if (fn.cost_allocation_percent && !updates.proposed_budget && updates.total_budget) {
      updates.proposed_budget = Math.round((updates.total_budget * fn.cost_allocation_percent) / 100);
    }

    const hasChanges = Object.keys(updates).some(k => updates[k] !== undefined);
    if (hasChanges) {
      updFn(fn.id, updates);
    }
  });
}

function saveCompletedWorkshop(workshopId) {
  finalizeWorkshopCalculations(workshopId);
  const now = new Date().toISOString();
  updWs(workshopId, { status: 'completed', completed_at: now, phase: 3 });

  if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
    window.zbodSupabase.sbSyncAll(getDivs(), getWs(), getFns(), getAsIs());
  }
}

function loadDashboardData(workshopId) {
  return calculateDashboardMetrics(workshopId);
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function showPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
function toast(message, opts) {
  const container = document.getElementById('toast-container');
  const id = ++state.toastId;
  const type = (opts && opts.type) || 'success';
  const desc = (opts && opts.description) || '';
  const div = document.createElement('div');
  div.className = `zbod-toast zbod-toast-${type}`;
  div.innerHTML = `<div class="zbod-toast-title">${message}</div>${desc ? `<div class="zbod-toast-desc">${desc}</div>` : ''}`;
  container.appendChild(div);
  setTimeout(() => { div.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => div.remove(), 300); }, 3000);
}

// ═══════════════════════════════════════════
// SVG ICONS HELPER
// ═══════════════════════════════════════════
const ICONS = {
  arrowLeft: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  save: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  arrowRight: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  layers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  userCog: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 8v1M19 13v1M16.5 9.5l.8.8M20.7 11.7l.8.8M16.5 12.5l.8-.8M20.7 10.3l.8-.8"/></svg>',
  dollar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  hash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  userCheck: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  alertTriangle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  activity: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  gitCompare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>',
  chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="9" y1="12" x2="9.01" y2="12"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="9" y1="16" x2="9.01" y2="16"/><line x1="15" y1="16" x2="15.01" y2="16"/></svg>',
  user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  compass: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  xCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  quote: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/></svg>',
  checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  grid: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  helpCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  trendingUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  sparkles: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  move: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
  max2: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
  min2: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
};


// ═══════════════════════════════════════════
// RENDER: LANDING PAGE (SIMPLIFIED - OVERVIEW ONLY)
// ═══════════════════════════════════════════
function renderLanding() {
  const defaultContent = {
    overviewTitle: 'What is Zero-Based Organizational Design?',
    overviewText: 'Zero-Based Organizational Design (ZBOD) is a comprehensive methodology for building organizational structures from the ground up. Rather than making incremental changes to existing structures, ZBOD enables organizations to strategically rethink and redesign their entire operating model to align with business priorities.',
  };

  let content = {...defaultContent, ...lsGet(LS.landing, {})};

  function editBtn() {
    if (state.landingEditing === 'overview') {
      return `<button onclick="app.saveLanding()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelLandingEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editLanding()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function field(key, type) {
    if (state.landingEditing === 'overview') {
      const val = state.landingDrafts[key] !== undefined ? state.landingDrafts[key] : content[key];
      if (type === 'textarea') return `<textarea class="zbod-textarea" id="landing-${key}" rows="3">${val}</textarea>`;
      return `<input class="zbod-input" id="landing-${key}" value="${val}">`;
    }
    if (type === 'textarea') return `<p class="text-sm leading-relaxed" style="color:#4b5563;">${content[key]}</p>`;
    return `<h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">${content[key]}</h2>`;
  }

  // ZBOD Guideline data — structured for future Supabase integration
  const guidelineDefaults = [
    { id: 'gl1', iconKey: 'compass',  title: 'STARTING POINT',  text: 'Set the current organizational structure completely aside; redesign from zero. Primary focus: revisit and redesign the organization based on strategy and business priorities.' },
    { id: 'gl2', iconKey: 'target',   title: 'VALUE FOCUS',     text: 'Identify only functions that create measurable value. The argument "it existed before" is not valid. Remove low-value activities.' },
    { id: 'gl3', iconKey: 'userCog',  title: 'FUNCTIONS',       text: 'Design functions that add value to the business. Ask yourself: Can this function be eliminated? Can it be automated? Can it be outsourced? Only create the function if the answer to all three questions is "no" (business justification needed). Shadow support activities should be automated, outsourced, or eliminated.' },
    { id: 'gl4', iconKey: 'users',    title: 'MANAGEMENT',      text: 'Minimize the number of management layers. Do not create deputy / deputy-of-deputy structures. Target 8\u201312 direct reports per manager to ensure an effective span of control. Deploy human resources in the functions that deliver the highest business value.' },
    { id: 'gl5', iconKey: 'userCheck',title: 'PEOPLE QUALITY',  text: 'Aim to work with a small but highly talented team. Automate or outsource low-grade work. Always consider optimization targets and size the team accordingly.' },
    { id: 'gl6', iconKey: 'layers',   title: 'PROCESSES',       text: 'Eliminate or simplify manual and complex processes. Job = end-to-end accountability. Redesign processes based on newly created functions. For every process, automation, AI, and RPA should be top priorities.' },
    { id: 'gl7', iconKey: 'dollar',   title: 'COST & CAPITAL',  text: 'Every function must have a clear cost vs. value justification.' },
  ];
  const savedGuidelines = lsGet('zbod_guidelines', null);
  const guidelineData = savedGuidelines && Array.isArray(savedGuidelines) ? savedGuidelines : guidelineDefaults;

  const guidelineTitleDefault = 'ZBOD GUIDELINE';
  const guidelineTitle = lsGet('zbod_guideline_title', guidelineTitleDefault);

  function guidelineEditBtn() {
    if (state.landingEditing === 'guideline') {
      return `<button onclick="app.saveGuideline()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelGuidelineEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editGuideline()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderGuidelineItem(g, idx) {
    const iconSvg = ICONS[g.iconKey] || ICONS.target;
    if (state.landingEditing === 'guideline') {
      const draftText = state.landingDrafts[`gl_text_${idx}`] !== undefined ? state.landingDrafts[`gl_text_${idx}`] : g.text;
      const draftTitle = state.landingDrafts[`gl_title_${idx}`] !== undefined ? state.landingDrafts[`gl_title_${idx}`] : g.title;
      return `<div class="guideline-item">
        <div class="guideline-item-header">
          <div class="guideline-item-icon">${iconSvg}</div>
          <input class="zbod-input" id="gl-title-${idx}" value="${escHtml(draftTitle)}" oninput="state.landingDrafts['gl_title_${idx}']=this.value" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#0F3C76;padding:6px 10px;flex:1;">
        </div>
        <textarea class="zbod-textarea" id="gl-text-${idx}" rows="4" oninput="state.landingDrafts['gl_text_${idx}']=this.value">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="guideline-item">
      <div class="guideline-item-header">
        <div class="guideline-item-icon">${iconSvg}</div>
        <div class="guideline-item-title">${g.title}</div>
      </div>
      <div class="guideline-item-text">${g.text}</div>
    </div>`;
  }

  // Strategic Overview data — structured for future Supabase integration
  const strategicOverviewDefault = {
    title: 'STRATEGIC OVERVIEW',
    subtitle: 'When designing the structure, these points must be taken into consideration.',
    columns: ['STRATEGIC METRICS', '2025', '2026', 'TARGET', '2027'],
    rows: [
      { metric: '# of emp', c2025: '3,269', c2026: '3,878', target: '3,287', c2027: '\u2014' },
      { metric: 'People Budget', c2025: '138.9 M', c2026: '152.7 M', target: '117.1 M', c2027: '\u2014' },
      { metric: 'Company Revenue', c2025: '901.2 M', c2026: '1,000 M', target: '1,000 M', c2027: '\u2014', highlight: true },
      { metric: 'Revenue per Emp', c2025: '275.7 K', c2026: '242.3 K', target: '290.1 K', c2027: '\u2014', highlight: true },
      { metric: 'Cost per HC', c2025: '42.5 K', c2026: '35.6 K', target: '35.6 K', c2027: '\u2014' },
      { metric: 'People Budget / Revenue', c2025: '0.15', c2026: '0.15', target: '0.12', c2027: '\u2014' },
      { metric: 'EBITDA per Employee', c2025: '\u2014', c2026: '109.3 K', target: '133.8 K', c2027: '\u2014' },
      { metric: 'Procurement opt. target', c2025: '84', c2026: '80', target: '80', c2027: '\u2014' },
    ],
  };
  const savedStrategicOverview = lsGet('zbod_strategic_overview', null);
  const strategicOverview = savedStrategicOverview && typeof savedStrategicOverview === 'object' ? {...strategicOverviewDefault, ...savedStrategicOverview} : strategicOverviewDefault;

  function strategicOverviewEditBtn() {
    if (state.landingEditing === 'strategicOverview') {
      return `<button onclick="app.saveStrategicOverview()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelStrategicOverviewEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editStrategicOverview()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderStrategicOverviewTable() {
    const so = strategicOverview;
    let html = '';

    if (state.landingEditing === 'strategicOverview') {
      const draftCols = state.landingDrafts['so_cols'] !== undefined ? state.landingDrafts['so_cols'] : so.columns;
      const draftRows = state.landingDrafts['so_rows'] !== undefined ? state.landingDrafts['so_rows'] : so.rows;

      html += `<div class="strategic-table-wrap"><table class="strategic-table"><thead><tr>`;
      draftCols.forEach((col, ci) => {
        html += `<th class="${col === 'TARGET' ? 'target-col' : ''}"><input class="zbod-input" id="so-col-${ci}" value="${escHtml(col)}" oninput="state.landingDrafts['so_cols'][${ci}]=this.value" style="font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;text-align:center;padding:4px 8px;background:transparent;border:none;color:inherit;min-width:60px;"></th>`;
      });
      html += `</tr></thead><tbody>`;
      draftRows.forEach((row, ri) => {
        html += `<tr class="${row.highlight ? 'highlight-row' : ''}">`;
        html += `<td><input class="zbod-input" id="so-row-${ri}-m" value="${escHtml(row.metric)}" oninput="state.landingDrafts['so_rows'][${ri}].metric=this.value" style="text-align:left;font-weight:600;"></td>`;
        html += `<td><input class="zbod-input" id="so-row-${ri}-25" value="${escHtml(row.c2025)}" oninput="state.landingDrafts['so_rows'][${ri}].c2025=this.value"></td>`;
        html += `<td><input class="zbod-input" id="so-row-${ri}-26" value="${escHtml(row.c2026)}" oninput="state.landingDrafts['so_rows'][${ri}].c2026=this.value"></td>`;
        html += `<td class="target-col"><input class="zbod-input" id="so-row-${ri}-t" value="${escHtml(row.target)}" oninput="state.landingDrafts['so_rows'][${ri}].target=this.value" style="font-weight:700;color:#2E642C;"></td>`;
        html += `<td><input class="zbod-input" id="so-row-${ri}-27" value="${escHtml(row.c2027)}" oninput="state.landingDrafts['so_rows'][${ri}].c2027=this.value"></td>`;
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      return html;
    }

    html += `<div class="strategic-table-wrap"><table class="strategic-table"><thead><tr>`;
    so.columns.forEach(col => {
      html += `<th class="${col === 'TARGET' ? 'target-col' : ''}">${escHtml(col)}</th>`;
    });
    html += `</tr></thead><tbody>`;
    so.rows.forEach(row => {
      html += `<tr class="${row.highlight ? 'highlight-row' : ''}">`;
      html += `<td>${escHtml(row.metric)}</td>`;
      html += `<td>${escHtml(row.c2025)}</td>`;
      html += `<td>${escHtml(row.c2026)}</td>`;
      html += `<td class="target-col">${escHtml(row.target)}</td>`;
      html += `<td>${escHtml(row.c2027)}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  }

  // Problem Statement data — structured for future Supabase integration
  const problemsDefaults = [
    'Too many management layers',
    'Decentralized and duplicated functions',
    'Low span of control',
    'Low-grade employees',
    'Shadow Support Functions',
    'Complex, manual-based processes and jobs',
    'Multi-layered deputy hierarchy',
  ];
  const savedProblems = lsGet('zbod_problems', null);
  const problemsData = savedProblems && Array.isArray(savedProblems) ? savedProblems : problemsDefaults;

  // Main Questions data — structured for future Supabase integration
  const questionsDefaults = [
    { id: 'mq1', label: 'MQ1', text: "Let's assume we are building the structure from scratch. According to your vision, which business functions must be created in order to add value to the business?" },
    { id: 'mq2', label: 'MQ2', text: 'To what degree is it possible to automate or outsource the proposed function?' },
    { id: 'mq3', label: 'MQ3', text: 'Is there any function that is currently being overlooked or ignored?' },
  ];
  const savedQuestions = lsGet('zbod_questions', null);
  const questionsData = savedQuestions && Array.isArray(savedQuestions) ? savedQuestions : questionsDefaults;

  function questionsEditBtn() {
    if (state.landingEditing === 'questions') {
      return `<button onclick="app.saveQuestions()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelQuestionsEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editQuestions()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderQuestionItem(q, idx) {
    if (state.landingEditing === 'questions') {
      const draftText = state.landingDrafts[`mq_text_${idx}`] !== undefined ? state.landingDrafts[`mq_text_${idx}`] : q.text;
      const draftLabel = state.landingDrafts[`mq_label_${idx}`] !== undefined ? state.landingDrafts[`mq_label_${idx}`] : q.label;
      return `<div class="question-item">
        <div class="question-header">
          <input class="zbod-input" id="mq-label-${idx}" value="${escHtml(draftLabel)}" oninput="state.landingDrafts['mq_label_${idx}']=this.value" style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#ffffff;background:linear-gradient(135deg,#2E642C 0%,#0F3C76 100%);padding:6px 14px;border:none;border-radius:8px;letter-spacing:0.04em;width:auto;max-width:100px;text-align:center;">
        </div>
        <textarea class="zbod-textarea" id="mq-text-${idx}" rows="3" oninput="state.landingDrafts['mq_text_${idx}']=this.value">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="question-item">
      <div class="question-header">
        <span class="question-badge">${q.label}</span>
      </div>
      <div class="question-text">${escHtml(q.text)}</div>
    </div>`;
  }

  // Function Categorization Matrix data — structured for future Supabase integration
  const fcmatrixDefaults = [
    { id: 'fca', letter: 'A', score: '9\u201310', title: 'Strategic', action: 'Invest', variant: 'a' },
    { id: 'fcb', letter: 'B', score: '7\u20138', title: 'Core Operations', action: 'Keep', variant: 'b' },
    { id: 'fcc', letter: 'C', score: '5\u20136', title: 'Efficiency', action: 'Optimize / Automate', variant: 'c' },
    { id: 'fcd', letter: 'D', score: '2\u20134', title: 'Non-Core', action: 'Eliminate / Outsource', variant: 'd' },
  ];
  const savedFcmatrix = lsGet('zbod_fcmatrix', null);
  const fcmatrixData = savedFcmatrix && Array.isArray(savedFcmatrix) ? savedFcmatrix : fcmatrixDefaults;

  function fcmatrixEditBtn() {
    if (state.landingEditing === 'fcmatrix') {
      return `<button onclick="app.saveFcmatrix()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelFcmatrixEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editFcmatrix()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderFcmatrixItem(item, idx) {
    const v = item.variant || 'a';
    if (state.landingEditing === 'fcmatrix') {
      const draftScore = state.landingDrafts[`fc_score_${idx}`] !== undefined ? state.landingDrafts[`fc_score_${idx}`] : item.score;
      const draftTitle = state.landingDrafts[`fc_title_${idx}`] !== undefined ? state.landingDrafts[`fc_title_${idx}`] : item.title;
      const draftAction = state.landingDrafts[`fc_action_${idx}`] !== undefined ? state.landingDrafts[`fc_action_${idx}`] : item.action;
      return `<div class="fcmatrix-item fcmatrix-${v}">
        <input class="zbod-input" id="fc-letter-${idx}" value="${escHtml(item.letter)}" readonly style="font-family:'Montserrat',sans-serif;font-size:32px;font-weight:900;text-align:center;width:60px;padding:0;background:transparent;border:none;color:inherit;">
        <input class="zbod-input" id="fc-score-${idx}" value="${escHtml(draftScore)}" oninput="state.landingDrafts['fc_score_${idx}']=this.value" style="font-size:12px;font-weight:600;text-align:center;padding:4px 10px;width:auto;">
        <input class="zbod-input" id="fc-title-${idx}" value="${escHtml(draftTitle)}" oninput="state.landingDrafts['fc_title_${idx}']=this.value" style="font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;text-align:center;padding:6px 10px;">
        <input class="zbod-input" id="fc-action-${idx}" value="${escHtml(draftAction)}" oninput="state.landingDrafts['fc_action_${idx}']=this.value" style="font-size:12px;font-weight:600;text-align:center;padding:4px 10px;letter-spacing:0.06em;text-transform:uppercase;width:auto;">
      </div>`;
    }
    return `<div class="fcmatrix-item fcmatrix-${v}">
      <div class="fcmatrix-letter">${item.letter}</div>
      <div class="fcmatrix-score">Score: ${item.score}</div>
      <div class="fcmatrix-title">${item.title}</div>
      <div class="fcmatrix-action">${item.action}</div>
    </div>`;
  }

  // Support Functions data — structured for future Supabase integration
  const supportDefaults = [
    { id: 'sf1', iconKey: 'settings', title: 'IT Support', text: 'Manage and maintain technology infrastructure, provide technical assistance, and ensure system reliability across the organization.' },
    { id: 'sf2', iconKey: 'shield', title: 'Security & Compliance', text: 'Oversee data protection, enforce security policies, and ensure regulatory compliance to minimize risk and safeguard organizational assets.' },
    { id: 'sf3', iconKey: 'barChart', title: 'Finance & Accounting', text: 'Handle budgeting, financial reporting, payroll processing, and fiscal planning to maintain organizational financial health.' },
    { id: 'sf4', iconKey: 'users', title: 'HR Administration', text: 'Manage recruitment, employee onboarding, benefits administration, and workplace policies to support workforce needs.' },
  ];
  const savedSupport = lsGet('zbod_support', null);
  const supportData = savedSupport && Array.isArray(savedSupport) ? savedSupport : supportDefaults;

  function supportEditBtn() {
    if (state.landingEditing === 'support') {
      return `<button onclick="app.saveSupport()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelSupportEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editSupport()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderSupportItem(item, idx) {
    const iconSvg = ICONS[item.iconKey] || ICONS.settings;
    if (state.landingEditing === 'support') {
      const draftTitle = state.landingDrafts[`sf_title_${idx}`] !== undefined ? state.landingDrafts[`sf_title_${idx}`] : item.title;
      const draftText = state.landingDrafts[`sf_text_${idx}`] !== undefined ? state.landingDrafts[`sf_text_${idx}`] : item.text;
      return `<div class="support-item">
        <div class="support-icon">${iconSvg}</div>
        <input class="zbod-input" id="sf-title-${idx}" value="${escHtml(draftTitle)}" oninput="state.landingDrafts['sf_title_${idx}']=this.value" style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#0F3C76;padding:6px 10px;margin-bottom:8px;">
        <textarea class="zbod-textarea" id="sf-text-${idx}" rows="3" oninput="state.landingDrafts['sf_text_${idx}']=this.value">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="support-item">
      <div class="support-icon">${iconSvg}</div>
      <div class="support-title">${item.title}</div>
      <div class="support-text">${item.text}</div>
    </div>`;
  }

  // Quote data — structured for future Supabase integration
  const quoteDefault = "Let's put the current organizational structure aside and focus purely on the strategy. Let's think about where the business is going over the next three years and how the organization should add value to that direction. If we were designing the organization from scratch, which capabilities would be most critical for delivering the strategy? Let's work together to shape a structure that will genuinely enable the business and maximize value over the next three years.";
  const savedQuote = lsGet('zbod_quote', null);
  const quoteText = savedQuote !== null ? savedQuote : quoteDefault;

  function quoteEditBtn() {
    if (state.landingEditing === 'quote') {
      return `<button onclick="app.saveQuote()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelQuoteEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editQuote()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderQuoteText() {
    if (state.landingEditing === 'quote') {
      const draft = state.landingDrafts['quote_text'] !== undefined ? state.landingDrafts['quote_text'] : quoteText;
      return `<textarea class="zbod-textarea" id="quote-text" rows="4" oninput="state.landingDrafts['quote_text']=this.value">${escHtml(draft)}</textarea>`;
    }
    return `<p class="quote-text">"${escHtml(quoteText)}"</p>`;
  }

  // Core Principles data — structured for future Supabase integration
  const principlesDefaults = [
    'Key strategic directions for cost and process optimization',
    'Ignore the current org chart and design it from zero',
    'Automate or outsource before creation',
    'Focus on value creation',
  ];
  const savedPrinciples = lsGet('zbod_principles', null);
  const principlesData = savedPrinciples && Array.isArray(savedPrinciples) ? savedPrinciples : principlesDefaults;

  function principlesEditBtn() {
    if (state.landingEditing === 'principles') {
      return `<button onclick="app.savePrinciples()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelPrinciplesEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editPrinciples()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderPrincipleItem(text, idx) {
    if (state.landingEditing === 'principles') {
      const draftText = state.landingDrafts[`pr_text_${idx}`] !== undefined ? state.landingDrafts[`pr_text_${idx}`] : text;
      return `<div class="principle-item">
        <div class="principle-check">${ICONS.check}</div>
        <textarea class="zbod-textarea" id="pr-text-${idx}" rows="2" oninput="state.landingDrafts['pr_text_${idx}']=this.value" style="font-size:14px;color:#4b5563;flex:1;">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="principle-item">
      <div class="principle-check">${ICONS.check}</div>
      <div class="principle-text">${escHtml(text)}</div>
    </div>`;
  }

  // Strategic Questions data — structured for future Supabase integration
  const strategicDefaults = [
    { id: 'sq1', label: 'SQ1', text: 'Does this function materially contribute to business strategy and outcomes, and enable scalable, efficient value creation (e.g. revenue, productivity, customer experience, automation)?' },
    { id: 'sq2', label: 'SQ2', text: 'How critical is this function to business continuity and risk management, and what would be the impact if it were stopped today (legal, financial, regulatory, reputational, operational)?' },
  ];
  const savedStrategic = lsGet('zbod_strategic', null);
  const strategicData = savedStrategic && Array.isArray(savedStrategic) ? savedStrategic : strategicDefaults;

  function strategicEditBtn() {
    if (state.landingEditing === 'strategic') {
      return `<button onclick="app.saveStrategic()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelStrategicEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editStrategic()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderStrategicItem(s, idx) {
    if (state.landingEditing === 'strategic') {
      const draftText = state.landingDrafts[`sq_text_${idx}`] !== undefined ? state.landingDrafts[`sq_text_${idx}`] : s.text;
      const draftLabel = state.landingDrafts[`sq_label_${idx}`] !== undefined ? state.landingDrafts[`sq_label_${idx}`] : s.label;
      return `<div class="strategic-item">
        <div class="strategic-header">
          <input class="zbod-input" id="sq-label-${idx}" value="${escHtml(draftLabel)}" oninput="state.landingDrafts['sq_label_${idx}']=this.value" style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#ffffff;background:linear-gradient(135deg,#2E642C 0%,#0F3C76 100%);padding:6px 14px;border:none;border-radius:8px;letter-spacing:0.04em;width:auto;max-width:100px;text-align:center;">
        </div>
        <textarea class="zbod-textarea" id="sq-text-${idx}" rows="3" oninput="state.landingDrafts['sq_text_${idx}']=this.value">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="strategic-item">
      <div class="strategic-header">
        <span class="strategic-badge">${s.label}</span>
      </div>
      <div class="strategic-text">${escHtml(s.text)}</div>
    </div>`;
  }

  function problemsEditBtn() {
    if (state.landingEditing === 'problems') {
      return `<button onclick="app.saveProblems()" class="zbod-btn-primary" style="padding:6px 12px;font-size:11px;">${ICONS.save} Save</button>
              <button onclick="app.cancelProblemsEdit()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.x} Cancel</button>`;
    }
    return `<button onclick="app.editProblems()" class="zbod-btn-secondary" style="padding:6px 12px;font-size:11px;">${ICONS.edit} Edit</button>`;
  }

  function renderProblemItem(text, idx) {
    if (state.landingEditing === 'problems') {
      const draftText = state.landingDrafts[`pr_text_${idx}`] !== undefined ? state.landingDrafts[`pr_text_${idx}`] : text;
      return `<div class="problem-item">
        <div class="problem-bullet"></div>
        <textarea class="zbod-textarea" id="pr-text-${idx}" rows="2" oninput="state.landingDrafts['pr_text_${idx}']=this.value" style="font-size:14px;color:#374151;flex:1;">${escHtml(draftText)}</textarea>
      </div>`;
    }
    return `<div class="problem-item">
      <div class="problem-bullet"></div>
      <div class="problem-text">${escHtml(text)}</div>
    </div>`;
  }

  const html = `
    <div style="background: linear-gradient(135deg, rgba(46,100,44,0.06) 0%, rgba(15,60,118,0.04) 50%, rgba(255,255,255,0) 100%); padding: 60px 0 40px;">
      <div class="max-w-5xl mx-auto px-8 text-center">
        <div class="zbod-chip" style="margin-bottom:24px;">Azerconnect Group</div>
        <h1 style="font-family:'Montserrat',sans-serif;font-size:48px;font-weight:800;color:#111827;margin-bottom:16px;line-height:1.1;">Zero-Based<br>Organizational Design</h1>
        <p style="font-size:18px;color:#4b5563;max-width:600px;margin:0 auto 32px;">Build organizational structures from the ground up with strategic alignment, optimized resource allocation, and efficient value creation.</p>
        <button onclick="app.goToDivisions()" class="zbod-btn-primary" style="font-size:16px;padding:16px 40px;">${ICONS.sparkles} Start Workshop</button>
      </div>
    </div>
    <div class="max-w-5xl mx-auto px-8 py-12">
      <div class="zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          ${ICONS.target}
          <div class="flex-1">${field('overviewTitle', 'h2')}</div>
          <div>${editBtn()}</div>
        </div>
        ${field('overviewText', 'textarea')}
      </div>
      <div class="guideline-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.book}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">${state.landingEditing === 'guideline' && state.landingDrafts.guidelineTitle !== undefined ? state.landingDrafts.guidelineTitle : guidelineTitle}</h2></div>
          <div>${guidelineEditBtn()}</div>
        </div>
        <div class="guideline-boxes-grid">
          ${guidelineData.map((g, i) => renderGuidelineItem(g, i)).join('')}
        </div>
      </div>
      <div class="problems-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.alertTriangle}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">PROBLEM STATEMENT</h2></div>
          <div>${problemsEditBtn()}</div>
        </div>
        <div class="problems-grid">
          <div class="problems-col">
            ${problemsData.slice(0, 4).map((t, i) => renderProblemItem(t, i)).join('')}
          </div>
          <div class="problems-col">
            ${problemsData.slice(4, 7).map((t, i) => renderProblemItem(t, i + 4)).join('')}
          </div>
        </div>
      </div>
      <div class="questions-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.helpCircle}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">MAIN QUESTIONS</h2></div>
          <div>${questionsEditBtn()}</div>
        </div>
        <div class="questions-list">
          ${questionsData.map((q, i) => renderQuestionItem(q, i)).join('')}
        </div>
      </div>
      <div class="quote-wrapper zbod-card">
        <div class="quote-card-inner">
          <div style="display:flex;align-items:flex-start;gap:16px;">
            <div style="color:#2E642C;flex-shrink:0;margin-top:2px;">${ICONS.quote}</div>
            <div class="flex-1" style="display:flex;align-items:center;gap:12px;">
              <div class="flex-1">${renderQuoteText()}</div>
              <div>${quoteEditBtn()}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="strategic-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.barChart}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">STRATEGIC QUESTIONS</h2></div>
          <div>${strategicEditBtn()}</div>
        </div>
        <div class="strategic-list">
          ${strategicData.map((s, i) => renderStrategicItem(s, i)).join('')}
        </div>
      </div>
      <div class="principles-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.checkCircle}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">CORE PRINCIPLES</h2></div>
          <div>${principlesEditBtn()}</div>
        </div>
        <div class="principles-grid">
          ${principlesData.map((p, i) => renderPrincipleItem(p, i)).join('')}
        </div>
      </div>
      <div class="fcmatrix-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.grid}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">FUNCTION CATEGORIZATION MATRIX</h2></div>
          <div>${fcmatrixEditBtn()}</div>
        </div>
        <div class="fcmatrix-grid">
          ${fcmatrixData.map((item, i) => renderFcmatrixItem(item, i)).join('')}
        </div>
      </div>
      <div class="support-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          ${ICONS.heart}
          <div class="flex-1"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">SUPPORT FUNCTIONS</h2></div>
          <div>${supportEditBtn()}</div>
        </div>
        <div class="support-grid">
          ${supportData.map((s, i) => renderSupportItem(s, i)).join('')}
        </div>
      </div>
      <div class="strategic-overview-wrapper zbod-card p-6">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          ${ICONS.trendingUp}
          <div class="flex-1">
            <h2 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">${strategicOverview.title}</h2>
            <p class="strategic-overview-subtitle">${strategicOverview.subtitle}</p>
          </div>
          <div>${strategicOverviewEditBtn()}</div>
        </div>
        ${renderStrategicOverviewTable()}
      </div>
    </div>`;

  document.getElementById('landing-content').innerHTML = html;
}

// ═══════════════════════════════════════════
// RENDER: DIVISIONS/STRUCTURES PAGE
// ═══════════════════════════════════════════
function renderDivisions() {
  const divs = getDivs();
  const container = document.getElementById('divisions-content');
  if (divs.length === 0) {
    container.innerHTML = `<div class="text-center py-12"><div style="width:64px;height:64px;border-radius:16px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">${ICONS.building}</div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:20px;color:#111827;margin-bottom:8px;">No Structures Yet</h3><p style="color:#6b7280;margin-bottom:24px;">Add your first organizational structure to begin.</p><button onclick="app.showAddDivision()" class="zbod-btn-primary">${ICONS.plus} Add Structure</button></div>`;
    return;
  }
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
  divs.forEach(d => {
    const typeLabel = d.structure_type || 'Division';
    html += `<div class="zbod-card p-6 zbod-card-hover" style="cursor:pointer;" onclick="app.selectDivision('${d.id}')">
      <div style="display:flex;align-items:start;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg, rgba(46,100,44,0.1) 0%, rgba(15,52,76,0.1) 100%);display:flex;align-items:center;justify-content:center;">${ICONS.building}</div>
          <div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#111827;">${d.structure_name}</h3><p style="font-size:13px;color:#6b7280;">${typeLabel} &mdash; ${d.c_level_name}</p></div>
        </div>
        <button onclick="event.stopPropagation();app.deleteDivision('${d.id}')" style="padding:8px;border-radius:8px;color:#9ca3af;transition:all 0.2s;" onmouseover="this.style.color='#991b1b';this.style.background='rgba(180,60,60,0.1)'" onmouseout="this.style.color='#9ca3af';this.style.background='transparent'">${ICONS.trash}</button>
      </div>
      <div style="margin:16px 0;border-top:1px solid rgba(46,100,44,0.1);"></div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#6b7280;"><strong style="color:#2E642C;">${formatNumber(d.current_total_hc || 0)}</strong> HC</span>
        <span style="font-size:12px;color:#6b7280;"><strong style="color:#2E642C;">${formatNumber(d.current_total_budget || 0)}</strong> AZN</span>
        <span style="font-size:12px;color:#6b7280;"><strong style="color:#0F3C76;">${formatNumber(d.headcount_target || 0)}</strong> Target</span>
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function getDivisionFormFields() {
  return [
    { key: 'structure_name', label: 'Structure Name *', placeholder: 'Select structure name', type: 'select', options: STRUCTURE_NAMES, other: true },
    { key: 'structure_type', label: 'Structure Type *', placeholder: 'Select structure type', type: 'select', options: STRUCTURE_TYPES, other: true },
    { key: 'c_level_name', label: 'C-Level Full Name *', placeholder: 'e.g., CTO', type: 'text' },
    { key: 'current_total_hc', label: 'Current Total Headcount *', placeholder: 'e.g., 100', type: 'number' },
    { key: 'current_managers', label: 'Current Managers *', placeholder: 'e.g., 10', type: 'number' },
    { key: 'headcount_target', label: 'Headcount Target *', placeholder: 'e.g., 80', type: 'number' },
    { key: 'current_total_budget', label: 'Current Total Budget (AZN) *', placeholder: 'e.g., 500000', type: 'number' },
    { key: 'budget_target', label: 'Budget Target (AZN) *', placeholder: 'e.g., 400000', type: 'number' },
    { key: 'current_function_number', label: 'Total Functions *', placeholder: 'e.g., 12', type: 'number' },
  ];
}

function renderDivisionForm() {
  const fields = getDivisionFormFields();
  document.getElementById('division-form-fields').innerHTML = fields.map((f, idx) => {
    if (f.type === 'select') {
      let html = `<div><label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;">${f.label}</label>`;
      html += `<select class="zbod-select" id="div-${f.key}" style="max-width:100%;" onchange="app.handleDivisionSelectChange('${f.key}', this.value)"><option value="">${f.placeholder}</option>`;
      f.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
      html += `</select>`;
      html += `<input type="text" class="zbod-input mt-2 hidden" id="div-${f.key}-other" placeholder="Enter custom ${f.key.replace('_', ' ')}">`;
      html += `</div>`;
      return html;
    }
    return `<div><label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;">${f.label}</label><input type="${f.type}" class="zbod-input" id="div-${f.key}" placeholder="${f.placeholder}" oninput="if(this.type==='number'){this.dataset.rawValue=this.value;}"></div>`;
  }).join('');
}

// ═══════════════════════════════════════════
// RENDER: KEY FINDINGS (AAA Section)
// ═══════════════════════════════════════════
function renderAAA(div) {
  const cards = getAAACards()[div.id] || [];
  const editCardIdx = state.aaaEditCardIdx;

  const headerHtml = `<div class="aaa-header">
    <div class="aaa-title-wrap">
      <div class="aaa-badge">${ICONS.activity}</div>
      <span class="aaa-title">Key Findings</span>
    </div>
    <button onclick="app.addAAACard()" class="zbod-btn-primary" style="padding:6px 16px;font-size:12px;">${ICONS.plus} Add Findings</button>
  </div>`;

  let cardsHtml = '';
  if (cards.length === 0 && editCardIdx === null) {
    cardsHtml = `<p class="aaa-empty">No findings added yet.</p>`;
  } else {
    cardsHtml = `<div class="aaa-grid">${cards.map((card, idx) => {
      if (editCardIdx === idx) {
        return `<div class="aaa-insight-card aaa-insight-editing">
          <textarea class="aaa-textarea" id="aaa-card-${idx}" rows="3" placeholder="Enter finding text...">${escHtml(state.aaaCards[div.id]?.[idx] !== undefined ? state.aaaCards[div.id][idx] : card)}</textarea>
          <div class="flex gap-2 mt-2">
            <button onclick="app.saveAAACard(${idx})" class="zbod-btn-primary" style="padding:6px 14px;font-size:12px;">${ICONS.save} Save</button>
            <button onclick="app.cancelAAACardEdit()" class="zbod-btn-secondary" style="padding:6px 14px;font-size:12px;">${ICONS.x} Cancel</button>
          </div>
        </div>`;
      }
      return `<div class="aaa-insight-card" style="position:relative;">
        <button onclick="app.deleteAAACard(${idx})" class="aaa-close-btn" title="Remove">&times;</button>
        <div class="aaa-card-body">${escHtml(card)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  return `<div class="zbod-card p-6">
    <div class="aaa-section">
      ${headerHtml}
      ${cardsHtml}
    </div>
  </div>`;
}


// ═══════════════════════════════════════════
// RENDER: WORKSPACE PAGE
// ═══════════════════════════════════════════
async function renderWorkspace() {
  const div = getDivs().find(d => d.id === state.selectedDivisionId);
  if (!div) return;
  const ws = getWs().filter(w => w.division_id === div.id);
  const draftWs = ws.filter(w => w.status === 'draft');
  const completedWs = ws.filter(w => w.status === 'completed');
  const asIsFns = getAsIs().filter(f => f.division_id === div.id);
  const structureType = div.structure_type || 'Division';
  const workspaceTitle = getWorkspaceTitle(structureType);
  const dataBoxTitle = getDataBoxTitle(structureType);
  const manageText = getManageText(structureType);

  document.getElementById('workspace-header').innerHTML = `
    <div class="flex items-center gap-4">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.goToDivisions()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3">
        <div>
          <h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name}</h1>
          <p style="font-size:12px;color:#6b7280;">${structureType} &mdash; ${div.c_level_name}</p>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button class="zbod-btn-export" onclick="app.exportToExcel()">${ICONS.download} Export Excel</button>
      <button class="zbod-btn-secondary" onclick="app.goToHistory()">${ICONS.history} Previous Workshops</button>
    </div>`;

  let divDataHtml = '';
  if (state.editingDivision) {
    const ef = state._divEditForm || {};
    divDataHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${['current_total_hc','current_managers','headcount_target','current_total_budget','budget_target','current_function_number'].map(k => {
        const labels = { current_total_hc: 'Current Total Headcount', current_managers: 'Current Managers', headcount_target: 'Headcount Target', current_total_budget: 'Current Total Budget (AZN)', budget_target: 'Budget Target (AZN)', current_function_number: 'Total Functions' };
        return `<div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">${labels[k]}</label><input type="number" class="zbod-input" id="wdiv-${k}" value="${ef[k] !== undefined ? ef[k] : (div[k] || 0)}" onwheel="return false;"></div>`;
      }).join('')}</div>`;
  } else {
    divDataHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div style="padding:16px;border-radius:12px;background:rgba(46,100,44,0.04);border:1px solid rgba(46,100,44,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.users}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Current Total Headcount</span></div><p style="font-size:20px;font-weight:700;color:#111827;">${formatNumber(div.current_total_hc || 0)}</p></div>
      <div style="padding:16px;border-radius:12px;background:rgba(46,100,44,0.04);border:1px solid rgba(46,100,44,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.userCog}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Current Managers</span></div><p style="font-size:20px;font-weight:700;color:#111827;">${formatNumber(div.current_managers || 0)}</p></div>
      <div style="padding:16px;border-radius:12px;background:rgba(15,60,118,0.04);border:1px solid rgba(15,60,118,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.target}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Headcount Target</span></div><p style="font-size:20px;font-weight:700;color:#0F3C76;">${formatNumber(div.headcount_target || 0)}</p></div>
      <div style="padding:16px;border-radius:12px;background:rgba(46,100,44,0.04);border:1px solid rgba(46,100,44,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.dollar}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Current Total Budget (AZN)</span></div><p style="font-size:20px;font-weight:700;color:#111827;">${formatNumber(div.current_total_budget || 0)}</p></div>
      <div style="padding:16px;border-radius:12px;background:rgba(15,60,118,0.04);border:1px solid rgba(15,60,118,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.dollar}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Budget Target (AZN)</span></div><p style="font-size:20px;font-weight:700;color:#0F3C76;">${formatNumber(div.budget_target || 0)}</p></div>
      <div style="padding:16px;border-radius:12px;background:rgba(46,100,44,0.04);border:1px solid rgba(46,100,44,0.1);"><div class="flex items-center gap-2 mb-1">${ICONS.hash}<span style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Total Functions</span></div><p style="font-size:20px;font-weight:700;color:#111827;">${div.current_function_number || 0}</p></div>
    </div>`;
  }

  let asIsHtml = '';
  const totalAsIsHC = asIsFns.reduce((s, f) => s + (f.current_function_hc || 0), 0);
  const totalAsIsBudget = asIsFns.reduce((s, f) => s + (f.current_budget || 0), 0);

  asIsHtml += state.asIsNewRows.map((row, idx) => {
    const hc = (parseInt(row.mgr) || 0) + (parseInt(row.emp) || 0);
    return `<div class="grid grid-cols-12 gap-2 mb-2 p-3" style="border-radius:8px;background:rgba(46,100,44,0.06);border:1px solid rgba(46,100,44,0.15);align-items:center;">
      <div class="col-span-1" style="font-size:12px;font-weight:700;color:#2E642C;">${asIsFns.length + idx + 1}</div>
      <div class="col-span-3"><input class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${row.name}" onchange="app.updateAsIsNewRow('${row.id}','name',this.value)" placeholder="Function name"></div>
      <div class="col-span-2"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${row.mgr}" onchange="app.updateAsIsNewRow('${row.id}','mgr',this.value)" placeholder="0" onwheel="return false;"></div>
      <div class="col-span-2"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${row.emp}" onchange="app.updateAsIsNewRow('${row.id}','emp',this.value)" placeholder="0" onwheel="return false;"></div>
      <div class="col-span-2" style="font-size:13px;color:#111827;font-weight:600;">${formatNumber(hc)}</div>
      <div class="col-span-2 flex items-center gap-1"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${row.budget}" onchange="app.updateAsIsNewRow('${row.id}','budget',this.value)" placeholder="0" onwheel="return false;"><button onclick="app.saveAsIsNewRow('${row.id}')" style="color:#2E642C;padding:4px;">${ICONS.save}</button><button onclick="app.cancelAsIsNewRow('${row.id}')" style="color:#991b1b;padding:4px;">${ICONS.x}</button></div>
    </div>`;
  }).join('');

  if (asIsFns.length === 0 && state.asIsNewRows.length === 0) {
    asIsHtml += `<div class="text-center py-8"><div style="margin-bottom:12px;">${ICONS.fileText}</div><p style="color:#6b7280;font-size:14px;">No current functions added yet</p><p style="color:#6b7280;font-size:12px;">Add your current organizational functions here.</p></div>`;
  } else {
    asIsHtml += asIsFns.map((fn, i) => {
      const edit = state.asIsEditing[fn.id];
      if (edit) {
        const hc = (parseInt(edit.mgr) || 0) + (parseInt(edit.emp) || 0);
        return `<div class="grid grid-cols-12 gap-2 mb-2 p-3" style="border-radius:8px;background:rgba(46,100,44,0.03);border:1px solid rgba(46,100,44,0.1);align-items:center;">
          <div class="col-span-1" style="font-size:12px;font-weight:700;color:#2E642C;">${i+1}</div>
          <div class="col-span-3"><input class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${edit.name}" onchange="app.updateAsIsEdit('${fn.id}','name',this.value)"></div>
          <div class="col-span-2"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${edit.mgr}" onchange="app.updateAsIsEdit('${fn.id}','mgr',this.value)" onwheel="return false;"></div>
          <div class="col-span-2"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${edit.emp}" onchange="app.updateAsIsEdit('${fn.id}','emp',this.value)" onwheel="return false;"></div>
          <div class="col-span-2" style="font-size:13px;color:#111827;font-weight:600;">${formatNumber(hc)}</div>
          <div class="col-span-2 flex items-center gap-1"><input type="number" class="zbod-input" style="padding:6px 8px;font-size:13px;" value="${edit.budget}" onchange="app.updateAsIsEdit('${fn.id}','budget',this.value)" onwheel="return false;"><button onclick="app.saveAsIsEdit('${fn.id}')" style="color:#2E642C;padding:4px;">${ICONS.save}</button><button onclick="app.cancelAsIsEdit('${fn.id}')" style="color:#991b1b;padding:4px;">${ICONS.x}</button></div>
        </div>`;
      }
      return `<div class="grid grid-cols-12 gap-2 mb-2 p-3" style="border-radius:8px;background:rgba(46,100,44,0.03);border:1px solid rgba(46,100,44,0.1);align-items:center;">
        <div class="col-span-1" style="font-size:12px;font-weight:700;color:#2E642C;">${i+1}</div>
        <div class="col-span-3" style="font-size:13px;font-weight:600;color:#111827;">${fn.function_name}</div>
        <div class="col-span-2" style="font-size:13px;color:#0F3C76;">${formatNumber(fn.manager_count)}</div>
        <div class="col-span-2" style="font-size:13px;color:#2E642C;">${formatNumber(fn.current_employee_count)}</div>
        <div class="col-span-2" style="font-size:13px;color:#111827;font-weight:600;">${formatNumber(fn.current_function_hc)}</div>
        <div class="col-span-2 flex items-center justify-between"><span style="font-size:13px;color:#111827;">${formatNumber(fn.current_budget)}</span><div class="flex items-center gap-1"><button onclick="app.startAsIsEdit('${fn.id}')" style="color:#6b7280;padding:4px;">${ICONS.edit}</button><button onclick="app.deleteAsIs('${fn.id}')" style="color:#6b7280;padding:4px;">${ICONS.trash}</button></div></div>
      </div>`;
    }).join('');
  }

  let workshopHtml = '';
  if (draftWs.length > 0) {
    workshopHtml = `<p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#92400e;margin-bottom:8px;">${ICONS.alertTriangle} Draft Workshops &mdash; Click to Continue</p><div class="space-y-3">`;
    draftWs.forEach(w => {
      const color = w.phase === 1 ? 'rgba(146,64,14,0.1);color:#92400e' : w.phase === 2 ? 'rgba(46,100,44,0.1);color:#2E642C' : 'rgba(15,60,118,0.1);color:#0F3C76';
      workshopHtml += `<div class="zbod-card p-4 flex items-center justify-between" style="cursor:pointer;" onclick="app.resumeWorkshop('${w.id}',${w.phase})"><div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${color};">${w.phase}</div><div><p style="font-size:14px;font-weight:600;color:#111827;">Workshop in Progress</p><p style="font-size:12px;color:#6b7280;">Phase ${w.phase} of 3</p></div></div>${ICONS.chevronRight}</div>`;
    });
    workshopHtml += '</div>';
  } else {
    workshopHtml = `<div class="text-center py-8"><p style="color:#6b7280;font-size:14px;">No active workshops</p><p style="color:#6b7280;font-size:12px;">Click "New Workshop" to start.</p></div>`;
  }

  let historyHtml = '';
  if (completedWs.length === 0) {
    historyHtml = `<div class="text-center py-8"><p style="color:#6b7280;font-size:14px;">No completed workshops yet</p></div>`;
  } else {
    historyHtml = `<div class="space-y-3" style="max-height:256px;overflow-y:auto;">${completedWs.map(w => `<button onclick="app.goToHistory()" class="zbod-card p-3 flex items-center gap-3 text-left zbod-card-hover" style="width:100%;">${ICONS.calendar}<div class="flex-1"><p style="font-size:14px;color:#111827;">${new Date(w.created_at).toLocaleDateString()} ${new Date(w.created_at).toLocaleTimeString()}</p></div>${ICONS.chevronRight}</button>`).join('')}</div>`;
  }

  const defaultMetrics = [
    { id: 'm1', label: 'Management Layers', value: '', type: 'number' },
    { id: 'm2', label: 'Average Span of Control', value: '', type: 'number' },
    { id: 'm3', label: 'High Grade Employees', value: '', type: 'number' },
    { id: 'm4', label: 'Low Grade Employees', value: '', type: 'number' },
    { id: 'm5', label: 'Multi-layered Deputy Hierarchy', value: '', type: 'select', options: ['Exist', 'Do not exist', '-'] },
    { id: 'm6', label: 'Decentralized and Centralized', value: '', type: 'select', options: ['Decentralized', 'Centralized', '-'] },
    { id: 'm7', label: 'Duplicated Functions', value: '', type: 'select', options: ['Exist', 'Do not exist', '-'] },
    { id: 'm8', label: 'Shadow Support Functions', value: '', type: 'text' },
    { id: 'm9', label: 'Complex Manual Based Process and Job', value: '', type: 'text' },
    { id: 'm10', label: 'Shared Services Opportunities', value: '', type: 'text' },
    { id: 'm11', label: 'Automation & AI Opportunities (RPA)', value: '', type: 'text' },
    { id: 'm12', label: 'Outsourcing Opportunity', value: '', type: 'text' },
    { id: 'm13', label: 'HC Optimization, incl. respective employee costs \u2014 if automation or outsourcing will be realized', value: '', type: 'text' },
    { id: 'm14', label: 'HC Avoided New Hiring, incl. respective employee costs \u2014 if automation or outsourcing will be realized', value: '', type: 'text' },
  ];
  const savedMetrics = getMetrics()[div.id] || defaultMetrics;
  savedMetrics.forEach((m, i) => { if (!m.type && defaultMetrics[i]) m.type = defaultMetrics[i].type; if (!m.type) m.type = 'text'; });

  const draft = state.metricsDraft[div.id] || {};
  savedMetrics.forEach((m, idx) => { if (draft[idx] !== undefined) m.value = draft[idx]; });

  const metricIcons = {
    m1: { icon: ICONS.layers, cls: 'metric-badge' },
    m2: { icon: ICONS.users, cls: 'metric-badge' },
    m3: { icon: ICONS.user, cls: 'metric-badge-green' },
    m4: { icon: ICONS.user, cls: 'metric-badge-green' },
    m5: { icon: ICONS.gitCompare, cls: 'metric-badge' },
    m6: { icon: ICONS.building, cls: 'metric-badge-amber' },
    m7: { icon: ICONS.barChart, cls: 'metric-badge' },
    m8: { icon: ICONS.activity, cls: 'metric-badge-green' },
    m9: { icon: ICONS.fileText, cls: 'metric-badge' },
    m10: { icon: ICONS.users, cls: 'metric-badge-green' },
    m11: { icon: ICONS.userCog, cls: 'metric-badge' },
    m12: { icon: ICONS.dollar, cls: 'metric-badge-green' },
    m13: { icon: ICONS.target, cls: 'metric-badge' },
    m14: { icon: ICONS.check, cls: 'metric-badge-green' },
  };

  let metricsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
  savedMetrics.forEach((m, idx) => {
    const mi = metricIcons[m.id] || { icon: ICONS.activity, cls: 'metric-badge' };
    let inputEl = '';
    if (m.type === 'select') {
      inputEl = `<select class="metric-input-field" onchange="app.updateMetric(${idx}, this.value)"><option value="">Select...</option>${(m.options || []).map(opt => `<option value="${opt}" ${m.value === opt ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
    } else if (m.type === 'number') {
      inputEl = `<input type="number" class="metric-input-field" value="${m.value}" oninput="app.updateMetric(${idx}, this.value)" onwheel="return false;" placeholder="0">`;
    } else {
      inputEl = `<input class="metric-input-field" value="${m.value}" oninput="app.updateMetric(${idx}, this.value)" placeholder="Enter value...">`;
    }
    metricsHtml += `<div class="metric-card">
      <div class="metric-card-header">
        <div class="${mi.cls}">${mi.icon}</div>
        <span class="metric-label">${m.label}</span>
      </div>
      ${inputEl}
    </div>`;
  });
  metricsHtml += `</div><div class="mt-4"><button onclick="app.saveMetrics()" class="zbod-btn-primary" style="padding:8px 20px;font-size:13px;">${ICONS.save} Save Metrics</button></div>`;

  document.getElementById('workspace-content').innerHTML = `
    <div><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:30px;color:#111827;margin-bottom:8px;">${workspaceTitle}</h2><p style="color:#6b7280;">${manageText}</p></div>
    <div class="zbod-card p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.target}</div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${dataBoxTitle}</h3></div>
        ${state.editingDivision
          ? `<div class="flex items-center gap-2"><button onclick="app.saveDivisionData()" class="zbod-btn-primary" style="padding:8px 16px;font-size:13px;">${ICONS.save} Save</button><button onclick="app.cancelDivisionEdit()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.x} Cancel</button></div>`
          : `<button onclick="app.editDivisionData()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.edit} Edit</button>`}
      </div>
      ${divDataHtml}
    </div>
    <div class="zbod-card p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.fileText}</div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">Current Functions (AS-IS Baseline)</h3></div>
        <div class="flex items-center gap-3"><span style="font-size:12px;color:#6b7280;">${asIsFns.length} functions | Total HC: ${formatNumber(totalAsIsHC)} | Budget: ${formatNumber(totalAsIsBudget)} AZN</span><button onclick="app.addAsIsRow()" class="zbod-btn-primary" style="padding:8px 16px;font-size:13px;">${ICONS.plus} Add Function</button></div>
      </div>
      <div class="grid grid-cols-12 gap-2 mb-2 px-3" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;"><div class="col-span-1">#</div><div class="col-span-3">Function Name</div><div class="col-span-2">Manager Count</div><div class="col-span-2">Employee Count</div><div class="col-span-2">Total HC</div><div class="col-span-2">Budget (AZN)</div></div>
      ${asIsHtml}
      ${asIsFns.length > 0 || state.asIsNewRows.length > 0 ? `<div class="mt-4"><button onclick="app.saveAllAsIs()" class="zbod-btn-primary" style="padding:10px 24px;font-size:14px;">${ICONS.save} Save All Functions</button></div>` : ''}
    </div>
    <div class="zbod-card p-6">
      <div class="flex items-center gap-3 mb-4"><img src="logo.png" alt="Azerconnect" style="height:28px;width:auto;object-fit:contain;"><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#0F3C76;">AS-IS Metrics</h3></div>
      ${metricsHtml}
    </div>
    ${renderAAA(div)}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="zbod-card p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3"><div style="width:40px;height:40px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.userCheck}</div><div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">Workshop</h3><p style="font-size:12px;color:#6b7280;">TO-BE Organizational Design</p></div></div>
          <button onclick="app.showWorkshopDialog()" class="zbod-btn-primary" style="padding:8px 16px;font-size:13px;">${ICONS.plus} New Workshop</button>
        </div>
        ${workshopHtml}
      </div>
      <div class="zbod-card p-6">
        <div class="flex items-center gap-3 mb-6"><div style="width:40px;height:40px;border-radius:8px;background:rgba(15,60,118,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.history}</div><div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">Previous Workshops</h3><p style="font-size:12px;color:#6b7280;">${completedWs.length} completed workshops</p></div></div>
        ${historyHtml}
      </div>
    </div>`;
}


// ═══════════════════════════════════════════
// RENDER: WORKSHOP PHASE 1
// ═══════════════════════════════════════════
function renderPhase1() {
  const ws = getWs().find(w => w.id === state.selectedWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);

  document.getElementById('phase1-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.confirmQuitPhase()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.target}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name}</h1></div>
    </div>
    <div class="flex items-center gap-3"><span style="font-size:13px;color:#6b7280;">Phase 1 of 3</span><button onclick="app.confirmQuitPhase()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.x} Cancel</button></div>`;

  const isFnComplete = (f) => {
    return f.proposed_function_name && f.career_level && f.can_be_eliminated && f.can_be_automated && f.can_be_outsourced;
  };

  let html = `<div class="flex gap-6" style="min-height:600px;">
    <div style="width:50%;flex-shrink:0;">
      <div class="flex items-center justify-between mb-6">
        <div><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:24px;color:#111827;">Function Identification & Justification</h2><p style="font-size:14px;color:#6b7280;">Define or justify each function for the proposed organizational structure.</p></div>
        <div class="flex items-center gap-3">
          <span style="font-size:13px;color:#6b7280;">${fns.filter(isFnComplete).length} of ${fns.length} functions completed</span>
          <button onclick="app.addProposedFunction()" class="zbod-btn-primary" style="padding:8px 16px;font-size:13px;">${ICONS.plus} Add Function</button>
        </div>
      </div>
      <div class="zbod-card p-4 mb-6" style="background:rgba(15,60,118,0.04);border:1px solid rgba(15,60,118,0.15);">
        <div class="flex items-center gap-6 flex-wrap">
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;">Workplace Targets (Reference Only)</span>
          <span style="font-size:14px;color:#111827;"><strong style="color:#0F3C76;">Target HC:</strong> ${formatNumber(div.headcount_target || 0)}</span>
          <span style="font-size:14px;color:#111827;"><strong style="color:#0F3C76;">Target Budget:</strong> ${formatNumber(div.budget_target || 0)} AZN</span>
        </div>
      </div>`;

  if (fns.length === 0) {
    html += `<div class="text-center py-12"><div style="margin-bottom:12px;">${ICONS.fileText}</div><p style="color:#6b7280;">No functions added yet</p><p style="color:#6b7280;font-size:12px;">Add your first proposed function</p></div>`;
  } else {
    html += `<div class="space-y-4">`;
    fns.forEach(f => {
      const raw = state.editingValues[f.id] || {};
      const isComplete = isFnComplete(f);
      const alert = f.justification_alert;
      html += `<div class="zbod-card p-5">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:36px;height:36px;border-radius:50%;background:${isComplete ? 'linear-gradient(135deg, #2E642C 0%, #184016 100%)' : '#e5e7eb'};color:${isComplete ? '#FFF' : '#9ca3af'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${f.function_number}</div>
          <div class="flex-1"><input class="zbod-input" value="${raw.proposed_function_name !== undefined ? raw.proposed_function_name : (f.proposed_function_name || '')}" onchange="app.updatePhase1Value('${f.id}','proposed_function_name',this.value)" placeholder="Function name..." style="font-weight:600;"></div>
          ${alert ? `<div style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;${alert.includes('PASSED') ? 'background:rgba(46,100,44,0.1);color:#2E642C;' : 'background:rgba(180,60,60,0.1);color:#991b1b;'}">${alert.includes('PASSED') ? ICONS.checkCircle : ICONS.alertTriangle} ${alert}</div>` : ''}
          <button onclick="app.removeProposedFunction('${f.id}')" style="color:#9ca3af;padding:4px;">${ICONS.trash}</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Career Level *</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','career_level',this.value)"><option value="">Select level</option><option value="Top" ${(f.career_level||'')==='Top'?'selected':''}>Top</option><option value="Senior" ${(f.career_level||'')==='Senior'?'selected':''}>Senior</option><option value="Management" ${(f.career_level||'')==='Management'?'selected':''}>Management</option></select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Structure Type</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','function_structure_type',this.value)"><option value="">Select type</option><option value="Department" ${(f.function_structure_type||'')==='Department'?'selected':''}>Department</option><option value="Unit" ${(f.function_structure_type||'')==='Unit'?'selected':''}>Unit</option></select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Parent</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','parent_id',this.value)"><option value="">${div.structure_name || 'Workplace'}</option>${fns.filter(x => x.id !== f.id && x.proposed_function_name).map(x => `<option value="${x.id}" ${f.parent_id === x.id ? 'selected' : ''}>${x.proposed_function_name}</option>`).join('')}</select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Can Be Eliminated? *</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','can_be_eliminated',this.value)"><option value="">Select</option><option value="Yes" ${(f.can_be_eliminated||'')==='Yes'?'selected':''}>Yes</option><option value="No" ${(f.can_be_eliminated||'')==='No'?'selected':''}>No</option></select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Can Be Automated? *</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','can_be_automated',this.value)"><option value="">Select</option><option value="Yes" ${(f.can_be_automated||'')==='Yes'?'selected':''}>Yes</option><option value="No" ${(f.can_be_automated||'')==='No'?'selected':''}>No</option></select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Can Be Outsourced? *</label><select class="zbod-select w-full" onchange="app.updatePhase1Value('${f.id}','can_be_outsourced',this.value)"><option value="">Select</option><option value="Yes" ${(f.can_be_outsourced||'')==='Yes'?'selected':''}>Yes</option><option value="No" ${(f.can_be_outsourced||'')==='No'?'selected':''}>No</option></select></div>

          <div class="col-span-2"><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Justification</label><textarea class="zbod-textarea w-full" rows="3" onchange="app.updatePhase1Value('${f.id}','strategic_justification',this.value)" placeholder="Why this function is needed...">${raw.strategic_justification !== undefined ? raw.strategic_justification : (f.strategic_justification || '')}</textarea></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>
    <div style="width:50%;flex-shrink:0;">
      <div class="zbod-card p-4 sticky" style="top:80px;">
        <h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:16px;color:#111827;margin-bottom:16px;">Organization Chart (TO-BE)</h3>
        <div class="org-chart-container" style="padding:0;">
          ${renderOrgChart(fns, div.structure_name, div)}
        </div>
      </div>
    </div>
  </div>`;

  html += `<div class="flex justify-between mt-8 pt-6" style="border-top:1px solid rgba(46,100,44,0.1);">
    <button onclick="app.savePhase1()" class="zbod-btn-secondary" style="padding:10px 24px;">${ICONS.save} Save</button>
    <button onclick="app.goToPhase2()" class="zbod-btn-primary" style="padding:10px 24px;">Next: Business Impact ${ICONS.arrowRight}</button>
  </div>`;

  document.getElementById('phase1-content').innerHTML = html;
}

// ═══════════════════════════════════════════
// ORG CHART RENDERER
// ═══════════════════════════════════════════
function renderOrgChart(fns, workplaceName, divData) {
  if (!fns || fns.length === 0) {
    return `<div class="oc-viewport"><p style="color:#9ca3af;font-size:13px;text-align:center;padding:40px 0;">Add functions to see org chart</p></div>`;
  }

  const parentMap = {};
  const fnIds = new Set(fns.map(f => f.id));
  fns.forEach(f => {
    const pid = (f.parent_id && fnIds.has(f.parent_id)) ? f.parent_id : 'workplace';
    if (!parentMap[pid]) parentMap[pid] = [];
    parentMap[pid].push(f);
  });

  const COL_W = 190;
  const COL_GAP = 16;
  const getBadgeClass = (level) => {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l.includes('top')) return 'oc-badge-top';
    if (l.includes('senior')) return 'oc-badge-senior';
    if (l.includes('junior')) return 'oc-badge-junior';
    return 'oc-badge-mgmt';
  };

  function renderJunction(childCount) {
    if (childCount === 0) return '';
    if (childCount === 1) return `<div class="oc-junction"><div class="oc-j-col"></div></div>`;
    const totalW = childCount * COL_W + (childCount - 1) * COL_GAP;
    const lineLeft = COL_W / 2;
    const lineRight = totalW - COL_W / 2;
    let html = `<div class="oc-junction">`;
    html += `<div class="oc-conn-h" style="left:${lineLeft}px;right:${totalW - lineRight}px;"></div>`;
    for (let i = 0; i < childCount; i++) html += `<div class="oc-j-col"></div>`;
    html += `</div>`;
    return html;
  }

  function renderNodeCard(f, isRoot) {
    if (isRoot) {
      return `<div class="oc-root-card">
        <div style="font-size:15px;font-weight:700;line-height:1.4;word-break:break-word;">${workplaceName || 'Workplace'}</div>
        <div class="oc-root-badge">Root / Workplace</div>
        ${divData && divData.headcount_target ? `<div class="oc-root-hc">Target HC: ${formatNumber(divData.headcount_target)}</div>` : ''}
      </div>`;
    }
    const name = f.proposed_function_name || 'Unnamed';
    const level = f.career_level || '';
    const hc = f.proposed_hc;
    const hasChildren = (parentMap[f.id] || []).length > 0;
    return `<div class="oc-node-card">
      <div class="oc-node-name">${name}</div>
      <div class="oc-node-meta">
        ${level ? `<span class="oc-badge ${getBadgeClass(level)}">${level}</span>` : ''}
        ${hc ? `<span class="oc-hc">HC: ${hc}</span>` : ''}
      </div>
      ${hasChildren ? `<div class="oc-toggle" onclick="app.toggleOrgNode(this)">&minus;</div>` : ''}
    </div>`;
  }

  function renderBranch(f) {
    const children = parentMap[f.id] || [];
    let html = `<div class="oc-branch">`;
    html += renderNodeCard(f, false);
    if (children.length > 0) {
      html += `<div class="oc-subtree">`;
      html += `<div class="oc-conn-v"></div>`;
      html += renderJunction(children.length);
      html += `<div class="oc-children">`;
      children.forEach(child => {
        html += `<div class="oc-child-wrap"><div class="oc-conn-v"></div>`;
        html += renderBranch(child);
        html += `</div>`;
      });
      html += `</div></div>`;
    }
    html += `</div>`;
    return html;
  }

  const rootChildren = parentMap['workplace'] || [];
  if (rootChildren.length === 0) {
    return `<div class="oc-viewport"><div class="oc-canvas" id="org-canvas"><div class="oc-root">${renderNodeCard(null, true)}</div></div></div>`;
  }

  let html = `<div class="oc-viewport" onmousedown="app.startOrgPan(event)" onmousemove="app.doOrgPan(event)" onmouseup="app.endOrgPan(event)" onmouseleave="app.endOrgPan(event)">`;
  html += `<div class="oc-canvas" id="org-canvas">`;

  html += `<div class="oc-root">${renderNodeCard(null, true)}</div>`;
  html += `<div class="oc-conn-v"></div>`;

  html += `<div class="oc-subtree">`;
  html += renderJunction(rootChildren.length);
  html += `<div class="oc-children">`;
  rootChildren.forEach(child => {
    html += `<div class="oc-child-wrap"><div class="oc-conn-v"></div>`;
    html += renderBranch(child);
    html += `</div>`;
  });
  html += `</div></div>`;

  html += `</div>`;

  html += `<div class="oc-controls">`;
  html += `<button onclick="app.orgZoom(0.1)" title="Zoom In">+</button>`;
  html += `<button onclick="app.orgZoom(-0.1)" title="Zoom Out">&minus;</button>`;
  html += `<button onclick="app.orgZoomFit()" title="Fit to View" style="font-size:12px;">&#8634;</button>`;
  html += `<button onclick="app.orgZoomReset()" title="Reset">1:1</button>`;
  html += `</div>`;

  html += `</div>`;
  return html;
}

// ═══════════════════════════════════════════
// RENDER: WORKSHOP PHASE 2
// ═══════════════════════════════════════════
function renderPhase2() {
  const ws = getWs().find(w => w.id === state.selectedWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);

  document.getElementById('phase2-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.backToPhase1()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.target}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name}</h1></div>
    </div>
    <div class="flex items-center gap-3"><span style="font-size:13px;color:#6b7280;">Phase 2 of 3</span><button onclick="app.confirmQuitPhase()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.x} Cancel</button></div>`;

  const guide = state.showRatingGuide ? `<div class="zbod-card p-6 mb-8" style="background:rgba(15,60,118,0.03);border:1px solid rgba(15,60,118,0.1);">
    <div class="flex items-center justify-between mb-4"><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;color:#0F3C76;">Strategic Alignment Score Guide</h3><button onclick="app.toggleRatingGuide()" style="color:#6b7280;">${ICONS.x}</button></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0F3C76;margin-bottom:12px;">Q1</h4><p style="font-size:13px;color:#4b5563;margin-bottom:12px;">Does this function materially contribute to business strategy and outcomes, and enable scalable, efficient value creation (e.g. revenue, productivity, customer experience, automation)?</p>
      ${[['5','Direct impact on core KPIs (Revenue, Market Share, EBITDA)'], ['4','Strong support to value creation'], ['3','Moderate operational contribution'], ['2','Peripheral role'], ['1','Questionable value']].map(([s,t]) => `<div class="flex items-start gap-3 mb-3"><span style="min-width:28px;height:28px;border-radius:50%;background:rgba(15,60,118,0.1);color:#0F3C76;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${s}</span><span style="font-size:13px;color:#4b5563;">${t}</span></div>`).join('')}</div>
      <div><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0F3C76;margin-bottom:12px;">Q2</h4><p style="font-size:13px;color:#4b5563;margin-bottom:12px;">How critical is this function to business continuity and risk management, and what would be the impact if it were stopped today (legal, financial, regulatory, reputational, operational)?</p>
      ${[['5','Essential - operations/customers could not function'], ['4','Highly valuable - significantly improves performance'], ['3','Useful - adds noticeable value'], ['2','Limited support - mainly convenience'], ['1','Minimal or no support']].map(([s,t]) => `<div class="flex items-start gap-3 mb-3"><span style="min-width:28px;height:28px;border-radius:50%;background:rgba(15,60,118,0.1);color:#0F3C76;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${s}</span><span style="font-size:13px;color:#4b5563;">${t}</span></div>`).join('')}</div>
    </div>
  </div>` : '';

  let html = `<div class="mb-6 flex items-center justify-between"><div><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:24px;color:#111827;">Business Impact Evaluation</h2><p style="font-size:14px;color:#6b7280;">Score each function's contribution using the guide below.</p></div><button onclick="app.toggleRatingGuide()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.helpCircle} Score Guide</button></div>${guide}`;

  if (fns.length === 0) {
    html += `<div class="text-center py-12"><div style="margin-bottom:12px;">${ICONS.fileText}</div><p style="color:#6b7280;">No functions to evaluate</p><button onclick="app.backToPhase1()" class="zbod-btn-primary mt-4">Back to Phase 1</button></div>`;
  } else {
    html += `<div class="space-y-4">`;
    fns.forEach(f => {
      const raw = state.phase2Scores[f.id] || {};
      const hasScore = f.question1_score !== null && f.question2_score !== null;
      const total = hasScore ? (f.question1_score + f.question2_score) : 0;
      let badge = '';
      if (hasScore) {
        const decision = f.zbod_decision || computePhase2Decision(f.question1_score, f.question2_score);
        badge = `<span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${decision === 'INVEST' ? 'background:rgba(46,100,44,0.1);color:#2E642C;' : decision === 'KEEP' ? 'background:rgba(200,160,60,0.1);color:#92400e;' : decision === 'OPTIMIZE' ? 'background:rgba(15,60,118,0.1);color:#0F3C76;' : 'background:rgba(180,60,60,0.1);color:#991b1b;'}">${decision}</span>`;
      }
      html += `<div class="zbod-card p-5">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2E642C 0%,#184016 100%);color:#FFF;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${f.function_number}</div>
          <div class="flex-1"><p style="font-weight:600;color:#111827;">${f.proposed_function_name}</p><p style="font-size:12px;color:#6b7280;">${f.career_level}</p></div>
          ${badge}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Q1</label><select class="zbod-select w-full" onchange="app.updatePhase2Score('${f.id}','question1_score',this.value)"><option value="">Score</option>${[5,4,3,2,1].map(s => `<option value="${s}" ${(f.question1_score===s?'selected':'')}>${s}</option>`).join('')}</select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Q2</label><select class="zbod-select w-full" onchange="app.updatePhase2Score('${f.id}','question2_score',this.value)"><option value="">Score</option>${[5,4,3,2,1].map(s => `<option value="${s}" ${(f.question2_score===s?'selected':'')}>${s}</option>`).join('')}</select></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Total Score</label><div style="display:flex;align-items:center;gap:8px;height:42px;"><span style="font-size:24px;font-weight:800;color:#111827;">${total}</span><span style="font-size:12px;color:#6b7280;">/ 10</span></div></div>
        </div>
        ${f.justification_alert ? `<div style="margin-top:12px;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;${f.justification_alert.includes('PASSED') ? 'background:rgba(46,100,44,0.08);color:#2E642C;border:1px solid rgba(46,100,44,0.2);' : 'background:rgba(180,60,60,0.08);color:#991b1b;border:1px solid rgba(180,60,60,0.2);'}">${f.justification_alert}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="flex justify-between mt-8 pt-6" style="border-top:1px solid rgba(46,100,44,0.1);">
    <button onclick="app.savePhase2()" class="zbod-btn-secondary" style="padding:10px 24px;">${ICONS.save} Save</button>
    <div class="flex gap-3">
      <button onclick="app.backToPhase1()" class="zbod-btn-secondary" style="padding:10px 24px;">Back</button>
      <button onclick="app.goToPhase3()" class="zbod-btn-primary" style="padding:10px 24px;">Next: HC & Cost ${ICONS.arrowRight}</button>
    </div>
  </div>`;

  document.getElementById('phase2-content').innerHTML = html;
}


// ═══════════════════════════════════════════
// RENDER: WORKSHOP PHASE 3
// ═══════════════════════════════════════════
function renderPhase3() {
  const ws = getWs().find(w => w.id === state.selectedWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);

  document.getElementById('phase3-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.backToPhase2()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.target}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name}</h1></div>
    </div>
    <div class="flex items-center gap-3"><span style="font-size:13px;color:#6b7280;">Phase 3 of 3</span><button onclick="app.confirmQuitPhase()" class="zbod-btn-secondary" style="padding:8px 16px;font-size:13px;">${ICONS.x} Cancel</button></div>`;

  let html = `<div class="mb-6"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:24px;color:#111827;">Headcount & People Cost Allocation</h2><p style="font-size:14px;color:#6b7280;">Allocate headcount and budget targets.</p></div>`;

  if (fns.length === 0) {
    html += `<div class="text-center py-12"><p style="color:#6b7280;">No functions to allocate</p></div>`;
  } else {
    html += `<div class="space-y-4">`;
    fns.forEach(f => {
      const raw = state.phase3Values[f.id] || {};

      const workplaceHC = div.current_total_hc || 0;
      const workplaceBudget = div.budget_target || 0;

      const hcAlloc = raw.hc_allocation_percent !== undefined ? raw.hc_allocation_percent : f.hc_allocation_percent;
      const costAlloc = raw.cost_allocation_percent !== undefined ? raw.cost_allocation_percent : f.cost_allocation_percent;
      const mgrCount = raw.manager_count !== undefined ? raw.manager_count : f.manager_count;
      const profCount = raw.professional_count !== undefined ? raw.professional_count : f.professional_count;

      const proposedHC = workplaceHC && hcAlloc ? Math.round((workplaceHC * hcAlloc) / 100) : (f.proposed_hc || null);
      const proposedBudget = workplaceBudget && costAlloc ? Math.round((workplaceBudget * costAlloc) / 100) : (f.proposed_budget || null);
      const actualHC = (parseInt(mgrCount) || 0) + (parseInt(profCount) || 0);
      const span = profCount && mgrCount && parseInt(mgrCount) > 0 ? (parseInt(profCount) / parseInt(mgrCount)).toFixed(1) : (f.span_of_control || null);

      let spanAlert = f.span_alert;
      if (span !== null && f.career_level) {
        let minSpan = 6, maxSpan = 12;
        if (f.career_level === 'Top Management' || f.career_level === 'Top') { minSpan = 4; maxSpan = 8; }
        else if (f.career_level === 'Senior Management' || f.career_level === 'Senior') { minSpan = 5; maxSpan = 10; }
        if (span < minSpan) spanAlert = 'Possible Over-Management';
        else if (span > maxSpan) spanAlert = 'Possible Management Overload';
        else spanAlert = 'Within Benchmark';
      }

      let hcValidationAlert = '';
      if (proposedHC !== null && actualHC !== 0 && actualHC !== proposedHC) {
        hcValidationAlert = `<div style="margin-top:8px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(180,60,60,0.08);color:#991b1b;border:1px solid rgba(180,60,60,0.2);">${ICONS.alertTriangle} Manager + Professional count (${actualHC}) does not match Proposed HC (${proposedHC})</div>`;
      }

      const reviewFlags = [];
      if (f.can_be_eliminated === 'Yes') reviewFlags.push('Elimination');
      if (f.can_be_automated === 'Yes') reviewFlags.push('Automation');
      if (f.can_be_outsourced === 'Yes') reviewFlags.push('Outsourcing');
      const phase1Review = reviewFlags.length > 0
        ? 'Review for ' + (reviewFlags.length === 3 ? reviewFlags.slice(0, 2).join(', ') + ' and ' + reviewFlags[2] : reviewFlags.join(' and '))
        : '';

      const phase2Decision = f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0);

      html += `<div class="zbod-card p-5">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2E642C 0%,#184016 100%);color:#FFF;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${f.function_number}</div>
          <div class="flex-1">
            <p style="font-weight:600;color:#111827;">${f.proposed_function_name}</p>
            <p style="font-size:12px;color:#6b7280;">${f.career_level || 'No level'}</p>
          </div>
          <span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;${phase2Decision==='INVEST'?'background:rgba(46,100,44,0.1);color:#2E642C;':phase2Decision==='KEEP'?'background:rgba(200,160,60,0.1);color:#92400e;':phase2Decision==='OPTIMIZE'?'background:rgba(15,60,118,0.1);color:#0F3C76;':'background:rgba(180,60,60,0.1);color:#991b1b;'}">${phase2Decision}</span>
        </div>
        ${phase1Review ? `<div style="margin-bottom:12px;padding:8px 12px;border-radius:8px;background:rgba(180,60,60,0.08);border:1px solid rgba(180,60,60,0.2);font-size:12px;font-weight:700;color:#991b1b;display:flex;align-items:center;gap:8px;">${ICONS.alertTriangle} ${phase1Review}</div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Total HC (Workplace)</label><input type="number" class="zbod-input w-full" style="background:#f3f4f6;" value="${workplaceHC}" readonly tabindex="-1"></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">HC Allocation %</label><input type="number" class="zbod-input w-full" value="${hcAlloc || ''}" onchange="app.updatePhase3Value('${f.id}','hc_allocation_percent',this.value)" placeholder="%" onwheel="return false;"></div>
          <div style="display:flex;flex-direction:column;justify-content:center;"><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Proposed HC</label><span style="font-size:20px;font-weight:800;color:#111827;">${proposedHC !== null ? formatNumber(proposedHC) : '-'}</span></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Total Budget (Workplace)</label><input type="number" class="zbod-input w-full" style="background:#f3f4f6;" value="${workplaceBudget}" readonly tabindex="-1"></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Cost Allocation %</label><input type="number" class="zbod-input w-full" value="${costAlloc || ''}" onchange="app.updatePhase3Value('${f.id}','cost_allocation_percent',this.value)" placeholder="%" onwheel="return false;"></div>
          <div style="display:flex;flex-direction:column;justify-content:center;"><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Proposed Budget</label><span style="font-size:20px;font-weight:800;color:#111827;">${proposedBudget !== null ? formatNumber(proposedBudget) + ' AZN' : '-'}</span></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Manager Count</label><input type="number" class="zbod-input w-full" value="${mgrCount || ''}" onchange="app.updatePhase3Value('${f.id}','manager_count',this.value)" placeholder="0" onwheel="return false;"></div>
          <div><label style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:6px;display:block;">Professional / Specialist</label><input type="number" class="zbod-input w-full" value="${profCount || ''}" onchange="app.updatePhase3Value('${f.id}','professional_count',this.value)" placeholder="0" onwheel="return false;"></div>
          <div style="padding:12px;border-radius:10px;background:rgba(15,60,118,0.04);border:1px solid rgba(15,60,118,0.1);">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;">HC Allocation Check</span>
            <span style="font-size:18px;font-weight:700;color:#111827;display:block;margin-top:4px;">${actualHC} / ${proposedHC !== null ? proposedHC : '-'}</span>
            ${actualHC !== 0 && proposedHC !== null && actualHC === proposedHC ? `<span style="font-size:11px;color:#2E642C;font-weight:600;">${ICONS.checkCircle} Matches</span>` : `<span style="font-size:11px;color:#92400e;font-weight:600;">${ICONS.alertTriangle} Does not match</span>`}
          </div>
          <div style="padding:12px;border-radius:10px;background:rgba(46,100,44,0.04);border:1px solid rgba(46,100,44,0.1);">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;">Span of Control</span>
            <span style="font-size:18px;font-weight:700;color:#111827;display:block;margin-top:4px;">${span !== null ? span : '-'} ${f.career_level ? `<span style="font-size:11px;color:#6b7280;font-weight:400;">(${f.career_level})</span>` : ''}</span>
            ${spanAlert ? `<span style="font-size:11px;font-weight:600;${spanAlert==='Within Benchmark'?'color:#2E642C;':'color:#92400e;'}">${spanAlert}</span>` : ''}
          </div>
        </div>
        ${hcValidationAlert}
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="flex justify-between mt-8 pt-6" style="border-top:1px solid rgba(46,100,44,0.1);">
    <button onclick="app.savePhase3()" class="zbod-btn-secondary" style="padding:10px 24px;">${ICONS.save} Save</button>
    <div class="flex gap-3">
      <button onclick="app.backToPhase2()" class="zbod-btn-secondary" style="padding:10px 24px;">Back</button>
      <button onclick="app.goToReview()" class="zbod-btn-primary" style="padding:10px 24px;">Review & Finish ${ICONS.check}</button>
    </div>
  </div>`;

  document.getElementById('phase3-content').innerHTML = html;
}

// ═══════════════════════════════════════════
// RENDER: REVIEW PAGE
// ═══════════════════════════════════════════
function renderReview() {
  const ws = getWs().find(w => w.id === state.selectedWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);

  document.getElementById('review-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.backToPhase3()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.target}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name} &mdash; Workshop Review</h1></div>
    </div>`;

  let html = `<div class="mb-6"><h2 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:30px;color:#111827;">Workshop Summary</h2><p style="font-size:14px;color:#6b7280;">Review all data before finalizing.</p></div>`;

  const inc = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'INVEST');
  const kp = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'KEEP');
  const opt = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'OPTIMIZE');
  const elm = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'ELIMINATE');

  html += `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="zbod-card p-4" style="border-left:3px solid #2E642C;"><p style="font-size:12px;color:#6b7280;">INVEST</p><p style="font-size:28px;font-weight:800;color:#2E642C;">${inc.length}</p></div>
    <div class="zbod-card p-4" style="border-left:3px solid #92400e;"><p style="font-size:12px;color:#6b7280;">KEEP</p><p style="font-size:28px;font-weight:800;color:#92400e;">${kp.length}</p></div>
    <div class="zbod-card p-4" style="border-left:3px solid #0F334C;"><p style="font-size:12px;color:#6b7280;">OPTIMIZE</p><p style="font-size:28px;font-weight:800;color:#0F334C;">${opt.length}</p></div>
    <div class="zbod-card p-4" style="border-left:3px solid #991b1b;"><p style="font-size:12px;color:#6b7280;">ELIMINATE</p><p style="font-size:28px;font-weight:800;color:#991b1b;">${elm.length}</p></div>
  </div>`;

  const totalProposedHC = calculateProposedHeadcount(ws.id);
  const totalProposedBudget = calculateProposedBudget(ws.id);

  html += `<div class="zbod-card p-6 mb-8"><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;margin-bottom:16px;">Targets vs Proposed</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Headcount</p><div class="flex items-center gap-4"><div class="flex-1"><div style="height:8px;border-radius:4px;background:#f3f4f6;overflow:hidden;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#0F3C76,#0F334C);width:${Math.min((totalProposedHC/(div.headcount_target||1))*100,100)}%;"></div></div></div><span style="font-size:12px;color:#6b7280;">${formatNumber(totalProposedHC)} / ${formatNumber(div.headcount_target || 0)}</span></div></div>
      <div><p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Budget</p><div class="flex items-center gap-4"><div class="flex-1"><div style="height:8px;border-radius:4px;background:#f3f4f6;overflow:hidden;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#2E642C,#184016);width:${Math.min((totalProposedBudget/(div.budget_target||1))*100,100)}%;"></div></div></div><span style="font-size:12px;color:#6b7280;">${formatNumber(totalProposedBudget)} / ${formatNumber(div.budget_target || 0)}</span></div></div>
    </div>
  </div>`;

  html += `<div class="zbod-card p-6 mb-8"><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;margin-bottom:16px;">Function Details</h3>
    <div class="overflow-x-auto"><table class="zbod-table">
      <thead><tr><th>#</th><th>Function</th><th>Level</th><th>Q1</th><th>Q2</th><th>Score</th><th>Decision</th><th>HC Alloc%</th><th>Proposed HC</th><th>Budget Alloc%</th><th>Proposed Budget</th></tr></thead>
      <tbody>
        ${fns.map(f => {
          const dec = f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0);
          return `<tr><td style="font-weight:700;color:#2E642C;">${f.function_number}</td><td style="font-weight:500;">${f.proposed_function_name}</td><td>${f.career_level}</td><td>${f.question1_score || '-'}</td><td>${f.question2_score || '-'}</td><td style="font-weight:700;">${(f.question1_score || 0) + (f.question2_score || 0)}</td><td><span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;${dec==='INVEST'?'background:rgba(46,100,44,0.1);color:#2E642C;':dec==='KEEP'?'background:rgba(200,160,60,0.1);color:#92400e;':dec==='OPTIMIZE'?'background:rgba(15,60,118,0.1);color:#0F3C76;':'background:rgba(180,60,60,0.1);color:#991b1b;'}">${dec}</span></td><td>${f.hc_allocation_percent || '-'}${f.hc_allocation_percent ? '%' : ''}</td><td>${formatNumber(f.proposed_hc || 0)}</td><td>${f.cost_allocation_percent || '-'}${f.cost_allocation_percent ? '%' : ''}</td><td>${formatNumber(f.proposed_budget || 0)}</td></tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>`;

  html += `<div class="flex justify-between">
    <button onclick="app.backToPhase3()" class="zbod-btn-secondary" style="padding:14px 32px;">Back to Phase 3</button>
    <button onclick="app.finishWorkshop()" class="zbod-btn-primary" style="padding:14px 32px;">${ICONS.check} Complete Workshop</button>
  </div>`;

  document.getElementById('review-content').innerHTML = html;
}


// ═══════════════════════════════════════════
// RENDER: TRANSITION / EXECUTIVE DASHBOARD
// ═══════════════════════════════════════════
function renderTransition() {
  const ws = getWs().find(w => w.id === state.selectedWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);
  const asIsFns = getAsIs().filter(f => f.division_id === ws.division_id);

  document.getElementById('transition-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.goToWorkspace()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.checkCircle}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">Workshop Complete</h1></div>
    </div>`;

  let html = `<div class="text-center mb-8">
    <div style="display:inline-flex;width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#2E642C 0%,#184016 100%);align-items:center;justify-content:center;margin-bottom:16px;">${ICONS.checkCircle}</div>
    <h2 style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:36px;color:#111827;margin-bottom:8px;">Workshop Complete!</h2>
    <p style="font-size:16px;color:#6b7280;">Results saved. You can view the workshop anytime in the structure workspace.</p>
    <button onclick="app.goToWorkspace()" class="zbod-btn-primary mt-4" style="padding:12px 32px;">${ICONS.home} Back to Workspace</button>
  </div>`;

  const dash = buildDashboardHTML(ws, div, fns, asIsFns);
  html += dash.html;
  document.getElementById('transition-content').innerHTML = html;
  setTimeout(() => renderDashboardCharts(dash.inc, dash.kp, dash.opt, dash.elm, dash.fns), 100);
}

// ═══════════════════════════════════════════
// SHARED DASHBOARD BUILDER
// ═══════════════════════════════════════════
function buildDashboardHTML(ws, div, fns, asIsFns) {
  const metrics = calculateDashboardMetrics(ws.id);

  const inc = metrics.invest;
  const kp = metrics.keep;
  const opt = metrics.optimize;
  const elm = metrics.eliminate;

  const totalAsIsHC = metrics.totalAsIsHC;
  const totalAsIsBudget = metrics.totalAsIsBudget;
  const totalToBeHC = metrics.totalToBeHC;
  const totalToBeBudget = metrics.totalToBeBudget;

  const maxHC = Math.max(totalAsIsHC, totalToBeHC, div.headcount_target || 0, 1);
  const maxBudget = Math.max(totalAsIsBudget, totalToBeBudget, div.budget_target || 0, 1);

  let html = '';

  html += `<div class="zbod-card p-6 mb-8"><div class="flex items-center justify-between mb-6">
    <div><h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:24px;color:#111827;">AS-IS vs TO-BE Dashboard</h3><p style="font-size:14px;color:#6b7280;">Completed: ${new Date(ws.completed_at || ws.created_at).toLocaleDateString()} ${new Date(ws.completed_at || ws.created_at).toLocaleTimeString()}</p></div>
    <button onclick="app.exportToExcel()" class="zbod-btn-export">${ICONS.download} Export to Excel</button>
  </div>`;

  html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="zbod-card p-4" style="border-left:3px solid #2E642C;"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#2E642C;margin-bottom:8px;">INVEST (${inc.length})</h4><div class="space-y-1">${inc.length > 0 ? inc.map(f => `<p style="font-size:13px;color:#111827;">${f.function_number}. ${f.proposed_function_name} <span style="color:#6b7280;">(HC: ${formatNumber(f.proposed_hc || 0)}, Budget: ${formatNumber(f.proposed_budget || 0)})</span></p>`).join('') : '<p style="font-size:12px;color:#9ca3af;">None</p>'}</div></div>
    <div class="zbod-card p-4" style="border-left:3px solid #92400e;"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#92400e;margin-bottom:8px;">KEEP (${kp.length})</h4><div class="space-y-1">${kp.length > 0 ? kp.map(f => `<p style="font-size:13px;color:#111827;">${f.function_number}. ${f.proposed_function_name} <span style="color:#6b7280;">(HC: ${formatNumber(f.proposed_hc || 0)}, Budget: ${formatNumber(f.proposed_budget || 0)})</span></p>`).join('') : '<p style="font-size:12px;color:#9ca3af;">None</p>'}</div></div>
    <div class="zbod-card p-4" style="border-left:3px solid #0F334C;"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0F334C;margin-bottom:8px;">OPTIMIZE (${opt.length})</h4><div class="space-y-1">${opt.length > 0 ? opt.map(f => `<p style="font-size:13px;color:#111827;">${f.function_number}. ${f.proposed_function_name} <span style="color:#6b7280;">(HC: ${formatNumber(f.proposed_hc || 0)}, Budget: ${formatNumber(f.proposed_budget || 0)})</span></p>`).join('') : '<p style="font-size:12px;color:#9ca3af;">None</p>'}</div></div>
    <div class="zbod-card p-4" style="border-left:3px solid #991b1b;"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#991b1b;margin-bottom:8px;">ELIMINATE (${elm.length})</h4><div class="space-y-1">${elm.length > 0 ? elm.map(f => `<p style="font-size:13px;color:#111827;">${f.function_number}. ${f.proposed_function_name} <span style="color:#6b7280;">(HC: ${formatNumber(f.proposed_hc || 0)}, Budget: ${formatNumber(f.proposed_budget || 0)})</span></p>`).join('') : '<p style="font-size:12px;color:#9ca3af;">None</p>'}</div></div>
  </div>`;

  html += `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="zbod-card p-4"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:12px;text-align:center;">Decision Distribution</h4><div style="max-width:200px;margin:0 auto;"><canvas id="decisionPieChart"></canvas></div></div>
    <div class="zbod-card p-4"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:12px;text-align:center;">Headcount Distribution</h4><div style="max-width:200px;margin:0 auto;"><canvas id="hcPieChart"></canvas></div></div>
    <div class="zbod-card p-4"><h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;margin-bottom:12px;text-align:center;">Budget Distribution</h4><div style="max-width:200px;margin:0 auto;"><canvas id="budgetPieChart"></canvas></div></div>
  </div>`;

  html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="zbod-card p-6 chart-card">
      <h4 class="chart-title">Headcount Comparison</h4>
      <div class="chart-area">
        <div class="chart-bars">
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#0F3C76,#0F334C);height:${(totalAsIsHC / maxHC) * 160}px;"></div></div>
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#2E642C,#184016);height:${(totalToBeHC / maxHC) * 160}px;"></div></div>
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#92400e,#92400e66);height:${((div.headcount_target || 0) / maxHC) * 160}px;"></div></div>
        </div>
      </div>
      <div class="chart-labels">
        <div class="chart-label-col"><span class="chart-label-text">AS-IS</span><span class="chart-label-value">${formatNumber(totalAsIsHC)}</span></div>
        <div class="chart-label-col"><span class="chart-label-text">TO-BE</span><span class="chart-label-value">${formatNumber(totalToBeHC)}</span></div>
        <div class="chart-label-col"><span class="chart-label-target">Target</span><span class="chart-label-value">${formatNumber(div.headcount_target || 0)}</span></div>
      </div>
    </div>
    <div class="zbod-card p-6 chart-card">
      <h4 class="chart-title">Budget Comparison</h4>
      <div class="chart-area">
        <div class="chart-bars">
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#0F3C76,#0F334C);height:${(totalAsIsBudget / maxBudget) * 160}px;"></div></div>
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#2E642C,#184016);height:${(totalToBeBudget / maxBudget) * 160}px;"></div></div>
          <div class="chart-bar-col"><div class="chart-bar" style="background:linear-gradient(180deg,#92400e,#92400e66);height:${((div.budget_target || 0) / maxBudget) * 160}px;"></div></div>
        </div>
      </div>
      <div class="chart-labels">
        <div class="chart-label-col"><span class="chart-label-text">AS-IS</span><span class="chart-label-value">${formatNumber(totalAsIsBudget)}</span></div>
        <div class="chart-label-col"><span class="chart-label-text">TO-BE</span><span class="chart-label-value">${formatNumber(totalToBeBudget)}</span></div>
        <div class="chart-label-col"><span class="chart-label-target">Target</span><span class="chart-label-value">${formatNumber(div.budget_target || 0)}</span></div>
      </div>
    </div>
  </div>`;

  html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="zbod-card p-6"><h4 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:16px;color:#0F3C76;margin-bottom:16px;">AS-IS Org Chart</h4><div class="org-chart-container">${renderAsIsOrgChart(asIsFns)}</div></div>
    <div class="zbod-card p-6"><h4 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:16px;color:#2E642C;margin-bottom:16px;">TO-BE Org Chart</h4><div class="org-chart-container">${renderOrgChart(fns, div.structure_name, div)}</div></div>
  </div>`;

  html += `<div class="zbod-card p-6 mb-8">
    <h3 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;margin-bottom:16px;">Division Targets vs Proposed</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Headcount</p><div class="flex items-center gap-4"><div class="flex-1"><div style="height:8px;border-radius:4px;background:#f3f4f6;overflow:hidden;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#0F3C76,#0F334C);width:${Math.min((totalToBeHC/(div.headcount_target||1))*100,100)}%;"></div></div></div><span style="font-size:12px;color:#6b7280;">${formatNumber(totalToBeHC)} / ${formatNumber(div.headcount_target || 0)}</span></div></div>
      <div><p style="font-size:12px;color:#6b7280;margin-bottom:8px;">Budget</p><div class="flex items-center gap-4"><div class="flex-1"><div style="height:8px;border-radius:4px;background:#f3f4f6;overflow:hidden;"><div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#2E642C,#184016);width:${Math.min((totalToBeBudget/(div.budget_target||1))*100,100)}%;"></div></div></div><span style="font-size:12px;color:#6b7280;">${formatNumber(totalToBeBudget)} / ${formatNumber(div.budget_target || 0)}</span></div></div>
    </div>
  </div>`;

  return { html, inc, kp, opt, elm, fns };
}

function renderDashboardCharts(inc, kp, opt, elm, fns) {
  const totalF = fns.length || 1;
  const pieLabelPlugin = {
    id: 'pieLabels',
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        const total = ds.data.reduce((a, b) => a + b, 0);
        meta.data.forEach((arc, i) => {
          if (ds.data[i] === 0) return;
          const pct = ((ds.data[i] / total) * 100).toFixed(1) + '%';
          const mid = arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
          const x = arc.x + Math.cos(mid) * (arc.outerRadius * 0.6);
          const y = arc.y + Math.sin(mid) * (arc.outerRadius * 0.6);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pct, x, y);
        });
      });
    }
  };

  new Chart(document.getElementById('decisionPieChart'), {
    type: 'pie',
    plugins: [pieLabelPlugin],
    data: { labels: ['INVEST','KEEP','OPTIMIZE','ELIMINATE'], datasets: [{ data: [inc.length, kp.length, opt.length, elm.length], backgroundColor: ['#2E642C','#92400e','#0F334C','#991b1b'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw} (${((c.raw/totalF)*100).toFixed(1)}%)` } } } }
  });

  const hcData = fns.map(f => f.proposed_hc || 0).filter(v => v > 0);
  const hcLabels = fns.filter(f => (f.proposed_hc || 0) > 0).map(f => f.proposed_function_name);
  if (hcData.length > 0) {
    new Chart(document.getElementById('hcPieChart'), {
      type: 'pie',
      plugins: [pieLabelPlugin],
      data: { labels: hcLabels, datasets: [{ data: hcData, backgroundColor: ['#2E642C','#0F334C','#92400e','#0F3C76','#184016','#2E8B57','#4682B4','#DAA520'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } } } }
    });
  }

  const budgetData = fns.map(f => f.proposed_budget || 0).filter(v => v > 0);
  const budgetLabels = fns.filter(f => (f.proposed_budget || 0) > 0).map(f => f.proposed_function_name);
  if (budgetData.length > 0) {
    new Chart(document.getElementById('budgetPieChart'), {
      type: 'pie',
      plugins: [pieLabelPlugin],
      data: { labels: budgetLabels, datasets: [{ data: budgetData, backgroundColor: ['#2E642C','#0F334C','#92400e','#0F3C76','#184016','#2E8B57','#4682B4','#DAA520'] }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } } } }
    });
  }
}

function renderAsIsOrgChart(asIsFns) {
  if (!asIsFns || asIsFns.length === 0) {
    return `<p style="color:#9ca3af;font-size:13px;text-align:center;">No AS-IS functions to display</p>`;
  }
  let html = `<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">`;
  asIsFns.forEach(f => {
    html += `<div class="org-chart-node" style="min-width:120px;"><span style="font-size:12px;font-weight:600;color:#111827;">${f.function_name || 'Unnamed'}</span><span style="font-size:11px;color:#6b7280;margin-top:4px;">HC: ${formatNumber(f.current_function_hc || 0)}</span></div>`;
  });
  html += `</div>`;
  return html;
}

// ═══════════════════════════════════════════
// RENDER: HISTORY PAGE
// ═══════════════════════════════════════════
function renderHistory() {
  const div = getDivs().find(d => d.id === state.selectedDivisionId);
  if (!div) return;
  const ws = getWs().filter(w => w.division_id === div.id && w.status === 'completed').sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  document.getElementById('history-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-5xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.goToWorkspace()">${ICONS.arrowLeft}</button>
      <h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">${div.structure_name} &mdash; Previous Workshops</h1>
    </div>`;

  if (ws.length === 0) {
    document.getElementById('history-content').innerHTML = `<div class="text-center py-12"><div style="margin-bottom:12px;">${ICONS.history}</div><p style="color:#6b7280;">No completed workshops yet</p></div>`;
    return;
  }

  let html = `<div class="space-y-4">`;
  ws.forEach(w => {
    const dt = new Date(w.completed_at || w.created_at);
    const fns = getFns().filter(f => f.workshop_id === w.id);
    const totalHC = fns.reduce((s, f) => s + (f.proposed_hc || 0), 0);
    const totalBudget = fns.reduce((s, f) => s + (f.proposed_budget || 0), 0);

    html += `<div class="zbod-card p-5 flex items-center justify-between zbod-card-hover" style="cursor:pointer;" onclick="app.viewHistoryWorkshop('${w.id}')">
      <div class="flex items-center gap-4">
        <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg, rgba(46,100,44,0.1) 0%, rgba(15,52,76,0.1) 100%);display:flex;align-items:center;justify-content:center;">${ICONS.calendar}</div>
        <div>
          <h3 style="font-family:'Montserrat',sans-serif;font-weight:600;color:#111827;">Workshop #${w.id.slice(0,8)}</h3>
          <p style="font-size:13px;color:#6b7280;">${dt.toLocaleDateString()} &mdash; ${dt.toLocaleTimeString()}</p>
          <p style="font-size:11px;color:#2E642C;margin-top:4px;">${fns.length} functions | HC: ${formatNumber(totalHC)} | Budget: ${formatNumber(totalBudget)} AZN</p>
        </div>
      </div>
      ${ICONS.chevronRight}
    </div>`;
  });
  html += `</div>`;
  document.getElementById('history-content').innerHTML = html;
}

// ═══════════════════════════════════════════
// RENDER: HISTORY REVIEW PAGE
// ═══════════════════════════════════════════
function renderHistoryReview() {
  const ws = getWs().find(w => w.id === state.selectedHistoryWorkshopId);
  if (!ws) return;
  const div = getDivs().find(d => d.id === ws.division_id);
  if (!div) return;
  const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);
  const asIsFns = getAsIs().filter(f => f.division_id === ws.division_id);

  document.getElementById('history-review-header').innerHTML = `
    <div class="flex items-center gap-4 max-w-7xl mx-auto">
      <button class="zbod-btn-secondary" style="padding:10px 14px;" onclick="app.goToHistory()">${ICONS.arrowLeft}</button>
      <div class="flex items-center gap-3"><div style="width:32px;height:32px;border-radius:8px;background:rgba(46,100,44,0.1);display:flex;align-items:center;justify-content:center;">${ICONS.history}</div><h1 style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:18px;color:#111827;">Workshop from ${new Date(ws.completed_at || ws.created_at).toLocaleDateString()} ${new Date(ws.completed_at || ws.created_at).toLocaleTimeString()}</h1></div>
    </div>`;

  const dash = buildDashboardHTML(ws, div, fns, asIsFns);
  document.getElementById('history-review-content').innerHTML = dash.html;
  setTimeout(() => renderDashboardCharts(dash.inc, dash.kp, dash.opt, dash.elm, dash.fns), 100);
}


// ═══════════════════════════════════════════
// APP CONTROLLER
// ═══════════════════════════════════════════
const app = {

  // === NAVIGATION ===
  goToLanding() { showPage('landing'); renderLanding(); },
  goToDivisions() { showPage('divisions'); renderDivisions(); },
  goToWorkspace() { showPage('workspace'); renderWorkspace(); },
  goToHistory() { showPage('history'); renderHistory(); },

  selectDivision(id) { state.selectedDivisionId = id; state.editingDivision = false; state._divEditForm = null; state.asIsNewRows = []; state.asIsEditing = {}; showPage('workspace'); renderWorkspace(); },

  // === LANDING PAGE EDIT (SIMPLIFIED - OVERVIEW ONLY) ===
  editLanding() {
    const defaultContent = {
      overviewTitle: 'What is Zero-Based Organizational Design?',
      overviewText: 'Zero-Based Organizational Design (ZBOD) is a comprehensive methodology for building organizational structures from the ground up. Rather than making incremental changes to existing structures, ZBOD enables organizations to strategically rethink and redesign their entire operating model to align with business priorities.',
    };
    const content = {...defaultContent, ...lsGet(LS.landing, {})};
    state.landingEditing = 'overview';
    state.landingDrafts = { overviewTitle: content.overviewTitle, overviewText: content.overviewText };
    renderLanding();
  },

  editGuideline() {
    const guidelineDefaults = [
      { id: 'gl1', iconKey: 'compass',  title: 'STARTING POINT',  text: 'Set the current organizational structure completely aside; redesign from zero. Primary focus: revisit and redesign the organization based on strategy and business priorities.' },
      { id: 'gl2', iconKey: 'target',   title: 'VALUE FOCUS',     text: 'Identify only functions that create measurable value. The argument "it existed before" is not valid. Remove low-value activities.' },
      { id: 'gl3', iconKey: 'userCog',  title: 'FUNCTIONS',       text: 'Design functions that add value to the business. Ask yourself: Can this function be eliminated? Can it be automated? Can it be outsourced? Only create the function if the answer to all three questions is "no" (business justification needed). Shadow support activities should be automated, outsourced, or eliminated.' },
      { id: 'gl4', iconKey: 'users',    title: 'MANAGEMENT',      text: 'Minimize the number of management layers. Do not create deputy / deputy-of-deputy structures. Target 8\u201312 direct reports per manager to ensure an effective span of control. Deploy human resources in the functions that deliver the highest business value.' },
      { id: 'gl5', iconKey: 'userCheck',title: 'PEOPLE QUALITY',  text: 'Aim to work with a small but highly talented team. Automate or outsource low-grade work. Always consider optimization targets and size the team accordingly.' },
      { id: 'gl6', iconKey: 'layers',   title: 'PROCESSES',       text: 'Eliminate or simplify manual and complex processes. Job = end-to-end accountability. Redesign processes based on newly created functions. For every process, automation, AI, and RPA should be top priorities.' },
      { id: 'gl7', iconKey: 'dollar',   title: 'COST & CAPITAL',  text: 'Every function must have a clear cost vs. value justification.' },
    ];
    const savedGuidelines = lsGet('zbod_guidelines', null);
    const guidelineData = savedGuidelines && Array.isArray(savedGuidelines) ? savedGuidelines : guidelineDefaults;
    const guidelineTitle = lsGet('zbod_guideline_title', 'ZBOD GUIDELINE');
    state.landingEditing = 'guideline';
    state.landingDrafts = { guidelineTitle };
    guidelineData.forEach((g, i) => {
      state.landingDrafts[`gl_title_${i}`] = g.title;
      state.landingDrafts[`gl_text_${i}`] = g.text;
    });
    renderLanding();
  },

  saveGuideline() {
    const guidelineDefaults = [
      { id: 'gl1', iconKey: 'compass',  title: 'STARTING POINT',  text: 'Set the current organizational structure completely aside; redesign from zero. Primary focus: revisit and redesign the organization based on strategy and business priorities.' },
      { id: 'gl2', iconKey: 'target',   title: 'VALUE FOCUS',     text: 'Identify only functions that create measurable value. The argument "it existed before" is not valid. Remove low-value activities.' },
      { id: 'gl3', iconKey: 'userCog',  title: 'FUNCTIONS',       text: 'Design functions that add value to the business. Ask yourself: Can this function be eliminated? Can it be automated? Can it be outsourced? Only create the function if the answer to all three questions is "no" (business justification needed). Shadow support activities should be automated, outsourced, or eliminated.' },
      { id: 'gl4', iconKey: 'users',    title: 'MANAGEMENT',      text: 'Minimize the number of management layers. Do not create deputy / deputy-of-deputy structures. Target 8\u201312 direct reports per manager to ensure an effective span of control. Deploy human resources in the functions that deliver the highest business value.' },
      { id: 'gl5', iconKey: 'userCheck',title: 'PEOPLE QUALITY',  text: 'Aim to work with a small but highly talented team. Automate or outsource low-grade work. Always consider optimization targets and size the team accordingly.' },
      { id: 'gl6', iconKey: 'layers',   title: 'PROCESSES',       text: 'Eliminate or simplify manual and complex processes. Job = end-to-end accountability. Redesign processes based on newly created functions. For every process, automation, AI, and RPA should be top priorities.' },
      { id: 'gl7', iconKey: 'dollar',   title: 'COST & CAPITAL',  text: 'Every function must have a clear cost vs. value justification.' },
    ];
    const savedGuidelines = lsGet('zbod_guidelines', null);
    const guidelineData = savedGuidelines && Array.isArray(savedGuidelines) ? [...savedGuidelines] : guidelineDefaults;

    if (state.landingDrafts.guidelineTitle) {
      lsSet('zbod_guideline_title', state.landingDrafts.guidelineTitle);
    }
    guidelineData.forEach((g, i) => {
      if (state.landingDrafts[`gl_title_${i}`] !== undefined) g.title = state.landingDrafts[`gl_title_${i}`];
      if (state.landingDrafts[`gl_text_${i}`] !== undefined) g.text = state.landingDrafts[`gl_text_${i}`];
    });
    lsSet('zbod_guidelines', guidelineData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        guidelineData.forEach((g, i) => {
          window.zbodSupabase.sbSaveLandingBox({
            box_id: g.id,
            position_order: i + 1,
            title: g.title,
            content: g.text,
          });
        });
      } catch (e) { console.warn('Supabase guideline sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Guideline saved');
  },

  cancelGuidelineEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editProblems() {
    const problemsDefaults = [
      'Too many management layers',
      'Decentralized and duplicated functions',
      'Low span of control',
      'Low-grade employees',
      'Shadow Support Functions',
      'Complex, manual-based processes and jobs',
      'Multi-layered deputy hierarchy',
    ];
    const savedProblems = lsGet('zbod_problems', null);
    const problemsData = savedProblems && Array.isArray(savedProblems) ? savedProblems : problemsDefaults;
    state.landingEditing = 'problems';
    state.landingDrafts = {};
    problemsData.forEach((t, i) => {
      state.landingDrafts[`pr_text_${i}`] = t;
    });
    renderLanding();
  },

  saveProblems() {
    const problemsDefaults = [
      'Too many management layers',
      'Decentralized and duplicated functions',
      'Low span of control',
      'Low-grade employees',
      'Shadow Support Functions',
      'Complex, manual-based processes and jobs',
      'Multi-layered deputy hierarchy',
    ];
    const savedProblems = lsGet('zbod_problems', null);
    const problemsData = savedProblems && Array.isArray(savedProblems) ? [...savedProblems] : [...problemsDefaults];
    problemsData.forEach((t, i) => {
      if (state.landingDrafts[`pr_text_${i}`] !== undefined) problemsData[i] = state.landingDrafts[`pr_text_${i}`];
    });
    lsSet('zbod_problems', problemsData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'problems',
          position_order: 99,
          title: 'Problem Statement',
          content: JSON.stringify(problemsData),
        });
      } catch (e) { console.warn('Supabase problems sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Problem statement saved');
  },

  cancelProblemsEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editQuestions() {
    const questionsDefaults = [
      { id: 'mq1', label: 'MQ1', text: "Let's assume we are building the structure from scratch. According to your vision, which business functions must be created in order to add value to the business?" },
      { id: 'mq2', label: 'MQ2', text: 'To what degree is it possible to automate or outsource the proposed function?' },
      { id: 'mq3', label: 'MQ3', text: 'Is there any function that is currently being overlooked or ignored?' },
    ];
    const savedQuestions = lsGet('zbod_questions', null);
    const questionsData = savedQuestions && Array.isArray(savedQuestions) ? savedQuestions : questionsDefaults;
    state.landingEditing = 'questions';
    state.landingDrafts = {};
    questionsData.forEach((q, i) => {
      state.landingDrafts[`mq_label_${i}`] = q.label;
      state.landingDrafts[`mq_text_${i}`] = q.text;
    });
    renderLanding();
  },

  saveQuestions() {
    const questionsDefaults = [
      { id: 'mq1', label: 'MQ1', text: "Let's assume we are building the structure from scratch. According to your vision, which business functions must be created in order to add value to the business?" },
      { id: 'mq2', label: 'MQ2', text: 'To what degree is it possible to automate or outsource the proposed function?' },
      { id: 'mq3', label: 'MQ3', text: 'Is there any function that is currently being overlooked or ignored?' },
    ];
    const savedQuestions = lsGet('zbod_questions', null);
    const questionsData = savedQuestions && Array.isArray(savedQuestions) ? [...savedQuestions] : [...questionsDefaults];
    questionsData.forEach((q, i) => {
      if (state.landingDrafts[`mq_label_${i}`] !== undefined) q.label = state.landingDrafts[`mq_label_${i}`];
      if (state.landingDrafts[`mq_text_${i}`] !== undefined) q.text = state.landingDrafts[`mq_text_${i}`];
    });
    lsSet('zbod_questions', questionsData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        questionsData.forEach((q, i) => {
          window.zbodSupabase.sbSaveLandingBox({
            box_id: q.id,
            position_order: 200 + i,
            title: q.label,
            content: q.text,
          });
        });
      } catch (e) { console.warn('Supabase questions sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Questions saved');
  },

  cancelQuestionsEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editQuote() {
    const quoteDefault = "Let's put the current organizational structure aside and focus purely on the strategy. Let's think about where the business is going over the next three years and how the organization should add value to that direction. If we were designing the organization from scratch, which capabilities would be most critical for delivering the strategy? Let's work together to shape a structure that will genuinely enable the business and maximize value over the next three years.";
    const savedQuote = lsGet('zbod_quote', null);
    const quoteText = savedQuote !== null ? savedQuote : quoteDefault;
    state.landingEditing = 'quote';
    state.landingDrafts = { quote_text: quoteText };
    renderLanding();
  },

  saveQuote() {
    if (state.landingDrafts['quote_text'] !== undefined) {
      lsSet('zbod_quote', state.landingDrafts['quote_text']);
      if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
        try {
          window.zbodSupabase.sbSaveLandingBox({
            box_id: 'quote',
            position_order: 300,
            title: 'Strategic Quote',
            content: state.landingDrafts['quote_text'],
          });
        } catch (e) { console.warn('Supabase quote sync failed:', e); }
      }
    }
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Quote saved');
  },

  cancelQuoteEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editStrategic() {
    const strategicDefaults = [
      { id: 'sq1', label: 'SQ1', text: 'Does this function materially contribute to business strategy and outcomes, and enable scalable, efficient value creation (e.g. revenue, productivity, customer experience, automation)?' },
      { id: 'sq2', label: 'SQ2', text: 'How critical is this function to business continuity and risk management, and what would be the impact if it were stopped today (legal, financial, regulatory, reputational, operational)?' },
    ];
    const savedStrategic = lsGet('zbod_strategic', null);
    const strategicData = savedStrategic && Array.isArray(savedStrategic) ? savedStrategic : strategicDefaults;
    state.landingEditing = 'strategic';
    state.landingDrafts = {};
    strategicData.forEach((s, i) => {
      state.landingDrafts[`sq_label_${i}`] = s.label;
      state.landingDrafts[`sq_text_${i}`] = s.text;
    });
    renderLanding();
  },

  saveStrategic() {
    const strategicDefaults = [
      { id: 'sq1', label: 'SQ1', text: 'Does this function materially contribute to business strategy and outcomes, and enable scalable, efficient value creation (e.g. revenue, productivity, customer experience, automation)?' },
      { id: 'sq2', label: 'SQ2', text: 'How critical is this function to business continuity and risk management, and what would be the impact if it were stopped today (legal, financial, regulatory, reputational, operational)?' },
    ];
    const savedStrategic = lsGet('zbod_strategic', null);
    const strategicData = savedStrategic && Array.isArray(savedStrategic) ? [...savedStrategic] : [...strategicDefaults];
    strategicData.forEach((s, i) => {
      if (state.landingDrafts[`sq_label_${i}`] !== undefined) s.label = state.landingDrafts[`sq_label_${i}`];
      if (state.landingDrafts[`sq_text_${i}`] !== undefined) s.text = state.landingDrafts[`sq_text_${i}`];
    });
    lsSet('zbod_strategic', strategicData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        strategicData.forEach((s, i) => {
          window.zbodSupabase.sbSaveLandingBox({
            box_id: s.id,
            position_order: 400 + i,
            title: s.label,
            content: s.text,
          });
        });
      } catch (e) { console.warn('Supabase strategic sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Strategic questions saved');
  },

  cancelStrategicEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editFcmatrix() {
    const fcmatrixDefaults = [
      { id: 'fca', letter: 'A', score: '9\u201310', title: 'Strategic', action: 'Invest', variant: 'a' },
      { id: 'fcb', letter: 'B', score: '7\u20138', title: 'Core Operations', action: 'Keep', variant: 'b' },
      { id: 'fcc', letter: 'C', score: '5\u20136', title: 'Efficiency', action: 'Optimize / Automate', variant: 'c' },
      { id: 'fcd', letter: 'D', score: '2\u20134', title: 'Non-Core', action: 'Eliminate / Outsource', variant: 'd' },
    ];
    const savedFcmatrix = lsGet('zbod_fcmatrix', null);
    const fcmatrixData = savedFcmatrix && Array.isArray(savedFcmatrix) ? savedFcmatrix : fcmatrixDefaults;
    state.landingEditing = 'fcmatrix';
    state.landingDrafts = {};
    fcmatrixData.forEach((item, i) => {
      state.landingDrafts[`fc_score_${i}`] = item.score;
      state.landingDrafts[`fc_title_${i}`] = item.title;
      state.landingDrafts[`fc_action_${i}`] = item.action;
    });
    renderLanding();
  },

  saveFcmatrix() {
    const fcmatrixDefaults = [
      { id: 'fca', letter: 'A', score: '9\u201310', title: 'Strategic', action: 'Invest', variant: 'a' },
      { id: 'fcb', letter: 'B', score: '7\u20138', title: 'Core Operations', action: 'Keep', variant: 'b' },
      { id: 'fcc', letter: 'C', score: '5\u20136', title: 'Efficiency', action: 'Optimize / Automate', variant: 'c' },
      { id: 'fcd', letter: 'D', score: '2\u20134', title: 'Non-Core', action: 'Eliminate / Outsource', variant: 'd' },
    ];
    const savedFcmatrix = lsGet('zbod_fcmatrix', null);
    const fcmatrixData = savedFcmatrix && Array.isArray(savedFcmatrix) ? [...savedFcmatrix] : [...fcmatrixDefaults];
    fcmatrixData.forEach((item, i) => {
      if (state.landingDrafts[`fc_score_${i}`] !== undefined) item.score = state.landingDrafts[`fc_score_${i}`];
      if (state.landingDrafts[`fc_title_${i}`] !== undefined) item.title = state.landingDrafts[`fc_title_${i}`];
      if (state.landingDrafts[`fc_action_${i}`] !== undefined) item.action = state.landingDrafts[`fc_action_${i}`];
    });
    lsSet('zbod_fcmatrix', fcmatrixData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'fcmatrix',
          position_order: 600,
          title: 'Function Categorization Matrix',
          content: JSON.stringify(fcmatrixData),
        });
      } catch (e) { console.warn('Supabase fcmatrix sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Matrix saved');
  },

  cancelFcmatrixEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editSupport() {
    const supportDefaults = [
      { id: 'sf1', iconKey: 'settings', title: 'IT Support', text: 'Manage and maintain technology infrastructure, provide technical assistance, and ensure system reliability across the organization.' },
      { id: 'sf2', iconKey: 'shield', title: 'Security & Compliance', text: 'Oversee data protection, enforce security policies, and ensure regulatory compliance to minimize risk and safeguard organizational assets.' },
      { id: 'sf3', iconKey: 'barChart', title: 'Finance & Accounting', text: 'Handle budgeting, financial reporting, payroll processing, and fiscal planning to maintain organizational financial health.' },
      { id: 'sf4', iconKey: 'users', title: 'HR Administration', text: 'Manage recruitment, employee onboarding, benefits administration, and workplace policies to support workforce needs.' },
    ];
    const savedSupport = lsGet('zbod_support', null);
    const supportData = savedSupport && Array.isArray(savedSupport) ? savedSupport : supportDefaults;
    state.landingEditing = 'support';
    state.landingDrafts = {};
    supportData.forEach((s, i) => {
      state.landingDrafts[`sf_title_${i}`] = s.title;
      state.landingDrafts[`sf_text_${i}`] = s.text;
    });
    renderLanding();
  },

  saveSupport() {
    const supportDefaults = [
      { id: 'sf1', iconKey: 'settings', title: 'IT Support', text: 'Manage and maintain technology infrastructure, provide technical assistance, and ensure system reliability across the organization.' },
      { id: 'sf2', iconKey: 'shield', title: 'Security & Compliance', text: 'Oversee data protection, enforce security policies, and ensure regulatory compliance to minimize risk and safeguard organizational assets.' },
      { id: 'sf3', iconKey: 'barChart', title: 'Finance & Accounting', text: 'Handle budgeting, financial reporting, payroll processing, and fiscal planning to maintain organizational financial health.' },
      { id: 'sf4', iconKey: 'users', title: 'HR Administration', text: 'Manage recruitment, employee onboarding, benefits administration, and workplace policies to support workforce needs.' },
    ];
    const savedSupport = lsGet('zbod_support', null);
    const supportData = savedSupport && Array.isArray(savedSupport) ? [...savedSupport] : [...supportDefaults];
    supportData.forEach((s, i) => {
      if (state.landingDrafts[`sf_title_${i}`] !== undefined) s.title = state.landingDrafts[`sf_title_${i}`];
      if (state.landingDrafts[`sf_text_${i}`] !== undefined) s.text = state.landingDrafts[`sf_text_${i}`];
    });
    lsSet('zbod_support', supportData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'support',
          position_order: 700,
          title: 'Support Functions',
          content: JSON.stringify(supportData),
        });
      } catch (e) { console.warn('Supabase support sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Support functions saved');
  },

  cancelSupportEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editPrinciples() {
    const principlesDefaults = [
      'Key strategic directions for cost and process optimization',
      'Ignore the current org chart and design it from zero',
      'Automate or outsource before creation',
      'Focus on value creation',
    ];
    const savedPrinciples = lsGet('zbod_principles', null);
    const principlesData = savedPrinciples && Array.isArray(savedPrinciples) ? savedPrinciples : principlesDefaults;
    state.landingEditing = 'principles';
    state.landingDrafts = {};
    principlesData.forEach((t, i) => {
      state.landingDrafts[`pr_text_${i}`] = t;
    });
    renderLanding();
  },

  savePrinciples() {
    const principlesDefaults = [
      'Key strategic directions for cost and process optimization',
      'Ignore the current org chart and design it from zero',
      'Automate or outsource before creation',
      'Focus on value creation',
    ];
    const savedPrinciples = lsGet('zbod_principles', null);
    const principlesData = savedPrinciples && Array.isArray(savedPrinciples) ? [...savedPrinciples] : [...principlesDefaults];
    principlesData.forEach((t, i) => {
      if (state.landingDrafts[`pr_text_${i}`] !== undefined) principlesData[i] = state.landingDrafts[`pr_text_${i}`];
    });
    lsSet('zbod_principles', principlesData);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'principles',
          position_order: 500,
          title: 'Core Principles',
          content: JSON.stringify(principlesData),
        });
      } catch (e) { console.warn('Supabase principles sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Core principles saved');
  },

  cancelPrinciplesEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  editStrategicOverview() {
    const strategicOverviewDefault = {
      title: 'STRATEGIC OVERVIEW',
      subtitle: 'When designing the structure, these points must be taken into consideration.',
      columns: ['STRATEGIC METRICS', '2025', '2026', 'TARGET', '2027'],
      rows: [
        { metric: '# of emp', c2025: '3,269', c2026: '3,878', target: '3,287', c2027: '\u2014' },
        { metric: 'People Budget', c2025: '138.9 M', c2026: '152.7 M', target: '117.1 M', c2027: '\u2014' },
        { metric: 'Company Revenue', c2025: '901.2 M', c2026: '1,000 M', target: '1,000 M', c2027: '\u2014', highlight: true },
        { metric: 'Revenue per Emp', c2025: '275.7 K', c2026: '242.3 K', target: '290.1 K', c2027: '\u2014', highlight: true },
        { metric: 'Cost per HC', c2025: '42.5 K', c2026: '35.6 K', target: '35.6 K', c2027: '\u2014' },
        { metric: 'People Budget / Revenue', c2025: '0.15', c2026: '0.15', target: '0.12', c2027: '\u2014' },
        { metric: 'EBITDA per Employee', c2025: '\u2014', c2026: '109.3 K', target: '133.8 K', c2027: '\u2014' },
        { metric: 'Procurement opt. target', c2025: '84', c2026: '80', target: '80', c2027: '\u2014' },
      ],
    };
    const savedStrategicOverview = lsGet('zbod_strategic_overview', null);
    const so = savedStrategicOverview && typeof savedStrategicOverview === 'object' ? {...strategicOverviewDefault, ...savedStrategicOverview} : strategicOverviewDefault;
    state.landingEditing = 'strategicOverview';
    state.landingDrafts = {
      so_title: so.title,
      so_subtitle: so.subtitle,
      so_cols: [...so.columns],
      so_rows: so.rows.map(r => ({...r})),
    };
    renderLanding();
  },

  saveStrategicOverview() {
    const so = {};
    if (state.landingDrafts['so_title'] !== undefined) so.title = state.landingDrafts['so_title'];
    if (state.landingDrafts['so_subtitle'] !== undefined) so.subtitle = state.landingDrafts['so_subtitle'];
    if (state.landingDrafts['so_cols'] !== undefined) so.columns = state.landingDrafts['so_cols'];
    if (state.landingDrafts['so_rows'] !== undefined) so.rows = state.landingDrafts['so_rows'];
    lsSet('zbod_strategic_overview', so);

    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'strategic_overview',
          position_order: 800,
          title: so.title || 'STRATEGIC OVERVIEW',
          content: JSON.stringify(so),
        });
      } catch (e) { console.warn('Supabase strategic overview sync failed:', e); }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Strategic overview saved');
  },

  cancelStrategicOverviewEdit() {
    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
  },

  saveLanding() {
    const defaultContent = {
      overviewTitle: 'What is Zero-Based Organizational Design?',
      overviewText: 'Zero-Based Organizational Design (ZBOD) is a comprehensive methodology for building organizational structures from the ground up. Rather than making incremental changes to existing structures, ZBOD enables organizations to strategically rethink and redesign their entire operating model to align with business priorities.',
    };
    let content = {...defaultContent, ...lsGet(LS.landing, {})};

    const titleEl = document.getElementById('landing-overviewTitle');
    const textEl = document.getElementById('landing-overviewText');
    if (titleEl) content.overviewTitle = titleEl.value;
    if (textEl) content.overviewText = textEl.value;

    lsSet(LS.landing, content);

    // SYNC TO SUPABASE
    if (window.zbodSupabase && window.zbodSupabase.supabaseAvailable) {
      try {
        window.zbodSupabase.sbSaveLandingBox({
          box_id: 'overview',
          position_order: 0,
          title: content.overviewTitle,
          content: content.overviewText,
        });
      } catch (e) {
        console.warn('Supabase landing sync failed:', e);
      }
    }

    state.landingEditing = null;
    state.landingDrafts = {};
    renderLanding();
    toast('Saved');
  },

  cancelLandingEdit() { state.landingEditing = null; state.landingDrafts = {}; renderLanding(); },

  // === DIVISION / STRUCTURE CRUD ===
  showAddDivision() {
    state._addForm = {};
    document.getElementById('division-dialog').classList.remove('hidden');
    document.getElementById('division-form-errors').innerHTML = '';
    renderDivisionForm();
  },

  hideAddDivision() { document.getElementById('division-dialog').classList.add('hidden'); },

  handleDivisionSelectChange(field, value) {
    if (field === 'structure_name') {
      const other = document.getElementById('div-structure_name-other');
      if (value === 'Other') { other.classList.remove('hidden'); } else { other.classList.add('hidden'); other.value = ''; }
    }
    if (field === 'structure_type') {
      const other = document.getElementById('div-structure_type-other');
      if (value === 'Other') { other.classList.remove('hidden'); } else { other.classList.add('hidden'); other.value = ''; }
    }
  },

  submitAddDivision() {
    const fields = getDivisionFormFields();
    const data = {};
    let errors = [];
    fields.forEach(f => {
      const el = document.getElementById(`div-${f.key}`);
      let val = el ? el.value : '';
      if (f.key === 'structure_name' && val === 'Other') {
        const otherEl = document.getElementById('div-structure_name-other');
        val = otherEl ? otherEl.value : '';
      }
      if (f.key === 'structure_type' && val === 'Other') {
        const otherEl = document.getElementById('div-structure_type-other');
        val = otherEl ? otherEl.value : '';
      }
      if (f.type === 'number') val = parseFloat(val) || 0;
      data[f.key] = val;
      if (!val && val !== 0) errors.push(`${f.label} is required`);
    });
    if (errors.length > 0) { document.getElementById('division-form-errors').innerHTML = errors.join('<br>'); return; }
    addDiv(data);
    this.hideAddDivision();
    renderDivisions();
    toast('Structure added');
  },

  deleteDivision(id) { if (confirm('Delete this structure? All data will be removed.')) { delDiv(id); delAsIsByDivision(id); delWsByDivision(id); renderDivisions(); toast('Structure deleted'); } },

  editDivisionData() {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    state.editingDivision = true;
    state._divEditForm = { current_total_hc: div.current_total_hc, current_total_budget: div.current_total_budget, current_managers: div.current_managers, headcount_target: div.headcount_target, budget_target: div.budget_target, current_function_number: div.current_function_number };
    renderWorkspace();
  },

  saveDivisionData() {
    const updates = {};
    ['current_total_hc','current_total_budget','current_managers','headcount_target','budget_target','current_function_number'].forEach(k => {
      const el = document.getElementById(`wdiv-${k}`);
      updates[k] = parseFloat(el?.value) || 0;
    });
    updDiv(state.selectedDivisionId, updates);
    state.editingDivision = false;
    state._divEditForm = null;
    renderWorkspace();
    toast('Saved');
  },

  cancelDivisionEdit() { state.editingDivision = false; state._divEditForm = null; renderWorkspace(); },

  // === AS-IS FUNCTIONS ===
  addAsIsRow() {
    state.asIsNewRows.push({ id: genId(), name: '', mgr: '', emp: '', budget: '' });
    renderWorkspace();
  },

  updateAsIsNewRow(id, field, value) {
    const row = state.asIsNewRows.find(r => r.id === id);
    if (row) row[field] = value;
  },

  saveAsIsNewRow(id) {
    const row = state.asIsNewRows.find(r => r.id === id);
    if (!row) return;
    const fn = addAsIsFn(state.selectedDivisionId, row.name);
    updAsIsFn(fn.id, { manager_count: parseInt(row.mgr) || 0, current_employee_count: parseInt(row.emp) || 0, current_function_hc: (parseInt(row.mgr) || 0) + (parseInt(row.emp) || 0), current_budget: parseFloat(row.budget) || 0 });
    state.asIsNewRows = state.asIsNewRows.filter(r => r.id !== id);
    renderWorkspace();
  },

  cancelAsIsNewRow(id) { state.asIsNewRows = state.asIsNewRows.filter(r => r.id !== id); renderWorkspace(); },

  startAsIsEdit(id) {
    const fn = getAsIs().find(f => f.id === id);
    if (!fn) return;
    state.asIsEditing[id] = { name: fn.function_name, mgr: fn.manager_count, emp: fn.current_employee_count, budget: fn.current_budget };
    renderWorkspace();
  },

  updateAsIsEdit(id, field, value) { if (state.asIsEditing[id]) state.asIsEditing[id][field] = value; },

  saveAsIsEdit(id) {
    const edit = state.asIsEditing[id];
    if (!edit) return;
    updAsIsFn(id, { function_name: edit.name, manager_count: parseInt(edit.mgr) || 0, current_employee_count: parseInt(edit.emp) || 0, current_function_hc: (parseInt(edit.mgr) || 0) + (parseInt(edit.emp) || 0), current_budget: parseFloat(edit.budget) || 0 });
    delete state.asIsEditing[id];
    renderWorkspace();
  },

  cancelAsIsEdit(id) { delete state.asIsEditing[id]; renderWorkspace(); },

  deleteAsIs(id) { if (confirm('Delete this function?')) { delAsIsFn(id); renderWorkspace(); } },

  saveAllAsIs() {
    const pending = [...state.asIsNewRows];
    pending.forEach(row => {
      if (row.name) {
        const fn = addAsIsFn(state.selectedDivisionId, row.name);
        updAsIsFn(fn.id, { manager_count: parseInt(row.mgr) || 0, current_employee_count: parseInt(row.emp) || 0, current_function_hc: (parseInt(row.mgr) || 0) + (parseInt(row.emp) || 0), current_budget: parseFloat(row.budget) || 0 });
      }
    });
    state.asIsNewRows = [];

    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) { renderWorkspace(); return; }
    const asIsFns = getAsIs().filter(f => f.division_id === div.id);
    const totalHC = asIsFns.reduce((s, f) => s + (f.current_function_hc || 0), 0);
    const totalBudget = asIsFns.reduce((s, f) => s + (f.current_budget || 0), 0);

    if (totalBudget !== parseFloat(div.current_total_budget || 0)) {
      const proceed = confirm(`Budget validation failed!\n\nSum of function budgets: ${formatNumber(totalBudget)}\nCurrent total budget: ${formatNumber(div.current_total_budget || 0)}\n\nClick OK to ignore and save, or Cancel to edit.`);
      if (!proceed) { renderWorkspace(); return; }
    }
    if (totalHC !== parseFloat(div.current_total_hc || 0)) {
      const proceed = confirm(`Headcount validation failed!\n\nSum of function HC: ${formatNumber(totalHC)}\nCurrent total HC: ${formatNumber(div.current_total_hc || 0)}\n\nClick OK to ignore and save, or Cancel to edit.`);
      if (!proceed) { renderWorkspace(); return; }
    }

    renderWorkspace();
    toast('All functions saved');
  },

  // === METRICS ===
  _getDefaultMetrics() {
    return [
      { id: 'm1', label: 'Management Layers', value: '', type: 'number' },
      { id: 'm2', label: 'Average Span of Control', value: '', type: 'number' },
      { id: 'm3', label: 'High Grade Employees', value: '', type: 'number' },
      { id: 'm4', label: 'Low Grade Employees', value: '', type: 'number' },
      { id: 'm5', label: 'Multi-layered Deputy Hierarchy', value: '', type: 'select', options: ['Exist', 'Do not exist', '-'] },
      { id: 'm6', label: 'Decentralized and Centralized', value: '', type: 'select', options: ['Decentralized', 'Centralized', '-'] },
      { id: 'm7', label: 'Duplicated Functions', value: '', type: 'select', options: ['Exist', 'Do not exist', '-'] },
      { id: 'm8', label: 'Shadow Support Functions', value: '', type: 'text' },
      { id: 'm9', label: 'Complex Manual Based Process and Job', value: '', type: 'text' },
      { id: 'm10', label: 'Shared Services Opportunities', value: '', type: 'text' },
      { id: 'm11', label: 'Automation & AI Opportunities (RPA)', value: '', type: 'text' },
      { id: 'm12', label: 'Outsourcing Opportunity', value: '', type: 'text' },
      { id: 'm13', label: 'HC Optimization, incl. respective employee costs \u2014 if automation or outsourcing will be realized', value: '', type: 'text' },
      { id: 'm14', label: 'HC Avoided New Hiring, incl. respective employee costs \u2014 if automation or outsourcing will be realized', value: '', type: 'text' },
    ];
  },

  updateMetric(idx, value) {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    if (!state.metricsDraft[div.id]) state.metricsDraft[div.id] = {};
    state.metricsDraft[div.id][idx] = value;
    const allMetrics = getMetrics();
    if (!allMetrics[div.id]) allMetrics[div.id] = this._getDefaultMetrics();
    const divMetrics = allMetrics[div.id];
    if (divMetrics[idx]) divMetrics[idx].value = value;
    allMetrics[div.id] = divMetrics;
    setMetrics(allMetrics);
  },

  saveMetrics() {
    toast('Metrics saved');
  },

  deleteMetric(idx) {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    const allMetrics = getMetrics();
    if (!allMetrics[div.id]) allMetrics[div.id] = this._getDefaultMetrics();
    const divMetrics = allMetrics[div.id];
    divMetrics.splice(idx, 1);
    allMetrics[div.id] = divMetrics;
    setMetrics(allMetrics);
    renderWorkspace();
  },

  // === AAA SECTION ===
  saveAAACard(idx) {
    const el = document.getElementById(`aaa-card-${idx}`);
    if (!el) return;
    try {
      const div = getDivs().find(d => d.id === state.selectedDivisionId);
      if (!div) { toast('Error: Division not found'); return; }
      const val = el.value.trim();
      const allCards = getAAACards();
      if (!allCards[div.id]) allCards[div.id] = [];
      if (idx >= 0 && idx < allCards[div.id].length) {
        allCards[div.id][idx] = val;
      }
      setAAACards(allCards);
      state.aaaEditCardIdx = null;
      if (state.aaaCards[div.id]) delete state.aaaCards[div.id][idx];
      renderWorkspace();
      toast('Saved');
    } catch (err) {
      console.error('saveAAACard error:', err);
      toast('Save failed');
    }
  },

  addAAACard() {
    try {
      const div = getDivs().find(d => d.id === state.selectedDivisionId);
      if (!div) return;
      const allCards = getAAACards();
      if (!allCards[div.id]) allCards[div.id] = [];
      allCards[div.id].push('');
      setAAACards(allCards);
      const newIdx = allCards[div.id].length - 1;
      state.aaaEditCardIdx = newIdx;
      if (!state.aaaCards[div.id]) state.aaaCards[div.id] = {};
      state.aaaCards[div.id][newIdx] = '';
      renderWorkspace();
      setTimeout(() => { const el = document.getElementById(`aaa-card-${newIdx}`); if (el) el.focus(); }, 50);
    } catch (err) {
      console.error('addAAACard error:', err);
    }
  },

  cancelAAACardEdit() {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (div && state.aaaCards[div.id]) {
      const idx = state.aaaEditCardIdx;
      const allCards = getAAACards();
      if (idx !== null && allCards[div.id] && allCards[div.id][idx] === '') {
        allCards[div.id].splice(idx, 1);
        setAAACards(allCards);
      }
      delete state.aaaCards[div.id][idx];
    }
    state.aaaEditCardIdx = null;
    renderWorkspace();
  },

  deleteAAACard(idx) {
    if (!confirm('Delete this card?')) return;
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    const allCards = getAAACards();
    if (allCards[div.id]) {
      allCards[div.id].splice(idx, 1);
      setAAACards(allCards);
    }
    renderWorkspace();
  },

  // === WORKSHOP DIALOG ===
  showWorkshopDialog() {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    const draftWs = getWs().filter(w => w.division_id === div.id && w.status === 'draft');
    if (draftWs.length > 0) {
      document.getElementById('workshop-dialog-title').innerText = 'Workshop In Progress';
      document.getElementById('workshop-dialog-body').innerText = 'You have a draft workshop. Resume it or start new?';
      document.getElementById('workshop-dialog-buttons').innerHTML =
        `<button onclick="app.resumeWorkshop('${draftWs[0].id}',${draftWs[0].phase})" class="zbod-btn-primary" style="padding:10px 24px;">${ICONS.play} Resume</button>
         <button onclick="app.startNewWorkshop()" class="zbod-btn-secondary" style="padding:10px 24px;">${ICONS.plus} New</button>
         <button onclick="app.hideWorkshopDialog()" class="zbod-btn-secondary" style="padding:10px 24px;">Cancel</button>`;
    } else {
      document.getElementById('workshop-dialog-title').innerText = 'Start New Workshop';
      document.getElementById('workshop-dialog-body').innerText = 'This will create a new TO-BE organizational design workshop for ' + div.structure_name + '.';
      document.getElementById('workshop-dialog-buttons').innerHTML =
        `<button onclick="app.startNewWorkshop()" class="zbod-btn-primary" style="padding:10px 24px;">${ICONS.play} Start</button>
         <button onclick="app.hideWorkshopDialog()" class="zbod-btn-secondary" style="padding:10px 24px;">Cancel</button>`;
    }
    document.getElementById('workshop-dialog').classList.remove('hidden');
  },

  hideWorkshopDialog() { document.getElementById('workshop-dialog').classList.add('hidden'); },

  startNewWorkshop() {
    const ws = addWs(state.selectedDivisionId);
    state.selectedWorkshopId = ws.id;
    state.editingValues = {};
    state.phase2Scores = {};
    state.phase3Values = {};
    this.hideWorkshopDialog();
    showPage('phase1'); renderPhase1();
  },

  resumeWorkshop(id, phase) {
    state.selectedWorkshopId = id;
    state.editingValues = {};
    state.phase2Scores = {};
    state.phase3Values = {};
    this.hideWorkshopDialog();
    updWs(id, { status: 'draft' });
    if (phase === 1) { showPage('phase1'); renderPhase1(); }
    else if (phase === 2) { showPage('phase2'); renderPhase2(); }
    else if (phase === 3) { showPage('phase3'); renderPhase3(); }
  },

  confirmQuitPhase() {
    if (confirm('Quit workshop? Your progress is saved.')) { this.goToWorkspace(); }
  },

  // === PHASE 1 ===
  updatePhase1Value(fnId, field, value) {
    if (!state.editingValues[fnId]) state.editingValues[fnId] = {};
    state.editingValues[fnId][field] = value;
    const updates = {};
    if (field === 'proposed_function_name') updates.proposed_function_name = value;
    if (field === 'career_level') updates.career_level = value;
    if (field === 'function_structure_type') updates.function_structure_type = value;
    if (field === 'parent_id') updates.parent_id = value;
    if (field === 'can_be_eliminated') updates.can_be_eliminated = value;
    if (field === 'can_be_automated') updates.can_be_automated = value;
    if (field === 'can_be_outsourced') updates.can_be_outsourced = value;
    if (field === 'target_headcount') updates.target_headcount = parseFloat(value) || null;
    if (field === 'target_budget') updates.target_budget = parseFloat(value) || null;
    if (field === 'strategic_justification') updates.strategic_justification = value;
    const allFns = getFns();
    const fn = allFns.find(f => f.id === fnId);
    if (fn) {
      const elim = field === 'can_be_eliminated' ? value : (fn.can_be_eliminated || '');
      const auto = field === 'can_be_automated' ? value : (fn.can_be_automated || '');
      const out = field === 'can_be_outsourced' ? value : (fn.can_be_outsourced || '');
      if (elim && auto && out) {
        updates.justification_alert = computePhase1Alert(elim, auto, out);
      }
    }
    updFn(fnId, updates);
  },

  addProposedFunction() {
    const ws = getWs().find(w => w.id === state.selectedWorkshopId);
    if (!ws) return;
    const fns = getFns().filter(f => f.workshop_id === ws.id);
    addFn(ws.id, fns.length + 1);
    renderPhase1();
  },

  removeProposedFunction(id) {
    if (!confirm('Remove this function?')) return;
    delFn(id);
    const ws = getWs().find(w => w.id === state.selectedWorkshopId);
    if (ws) {
      const fns = getFns().filter(f => f.workshop_id === ws.id).sort((a, b) => a.function_number - b.function_number);
      fns.forEach((f, i) => { if (f.function_number !== i + 1) updFn(f.id, { function_number: i + 1 }); });
    }
    renderPhase1();
  },

  savePhase1() {
    renderPhase1();
    toast('Saved');
  },

  goToPhase2() {
    updWs(state.selectedWorkshopId, { phase: 2 });
    showPage('phase2'); renderPhase2();
  },

  // === PHASE 2 ===
  updatePhase2Score(fnId, field, value) {
    if (!state.phase2Scores[fnId]) state.phase2Scores[fnId] = {};
    state.phase2Scores[fnId][field] = parseFloat(value) || null;
    const updates = {};
    if (field === 'question1_score') updates.question1_score = parseFloat(value) || null;
    if (field === 'question2_score') updates.question2_score = parseFloat(value) || null;
    const allFns = getFns();
    const fn = allFns.find(f => f.id === fnId);
    if (fn) {
      const q1 = field === 'question1_score' ? (parseFloat(value) || 0) : (fn.question1_score || 0);
      const q2 = field === 'question2_score' ? (parseFloat(value) || 0) : (fn.question2_score || 0);
      if (q1 && q2) {
        updates.total_score = q1 + q2;
        updates.zbod_decision = computePhase2Decision(q1, q2);
      }
    }
    updFn(fnId, updates);
    renderPhase2();
  },

  toggleRatingGuide() { state.showRatingGuide = !state.showRatingGuide; renderPhase2(); },

  savePhase2() { renderPhase2(); toast('Saved'); },

  backToPhase1() { updWs(state.selectedWorkshopId, { phase: 1 }); showPage('phase1'); renderPhase1(); },
  goToPhase3() { updWs(state.selectedWorkshopId, { phase: 3 }); showPage('phase3'); renderPhase3(); },

  // === PHASE 3 ===
  updatePhase3Value(fnId, field, value) {
    if (!state.phase3Values[fnId]) state.phase3Values[fnId] = {};
    state.phase3Values[fnId][field] = parseFloat(value) || null;
    const updates = {};
    if (field === 'total_hc') updates.total_hc = parseFloat(value) || null;
    if (field === 'hc_allocation_percent') updates.hc_allocation_percent = parseFloat(value) || null;
    if (field === 'total_budget') updates.total_budget = parseFloat(value) || null;
    if (field === 'cost_allocation_percent') updates.cost_allocation_percent = parseFloat(value) || null;
    if (field === 'manager_count') updates.manager_count = parseFloat(value) || null;
    if (field === 'professional_count') updates.professional_count = parseFloat(value) || null;

    const allWs = getWs();
    const ws = allWs.find(w => w.id === state.selectedWorkshopId);
    const div = ws ? getDivs().find(d => d.id === ws.division_id) : null;

    const allFns = getFns();
    const fn = allFns.find(f => f.id === fnId);
    if (fn) {
      const merged = { ...fn, ...updates };

      if (div) {
        merged.total_hc = div.current_total_hc || 0;
        merged.total_budget = div.budget_target || 0;
      }

      const computed = computePhase3(fn, merged);
      updates.proposed_hc = computed.proposed_hc;
      updates.proposed_budget = computed.proposed_budget;
      updates.span_of_control = computed.span_of_control;
      updates.span_alert = computed.span_alert;

      if (div) {
        updates.total_hc = div.current_total_hc || 0;
        updates.total_budget = div.budget_target || 0;
      }
    }
    updFn(fnId, updates);
    renderPhase3();
  },

  savePhase3() { renderPhase3(); toast('Saved'); },

  backToPhase2() { updWs(state.selectedWorkshopId, { phase: 2 }); showPage('phase2'); renderPhase2(); },
  goToReview() { showPage('review'); renderReview(); },
  backToPhase3() { showPage('phase3'); renderPhase3(); },

  // === FINISH WORKSHOP ===
  finishWorkshop() {
    finalizeWorkshopCalculations(state.selectedWorkshopId);
    saveCompletedWorkshop(state.selectedWorkshopId);
    state.selectedHistoryWorkshopId = state.selectedWorkshopId;
    showPage('transition'); renderTransition();
    toast('Workshop completed!');
  },

  // === HISTORY ===
  viewHistoryWorkshop(id) { state.selectedHistoryWorkshopId = id; showPage('history-review'); renderHistoryReview(); },

  // === EXPORT TO EXCEL ===
  exportToExcel() {
    const div = getDivs().find(d => d.id === state.selectedDivisionId);
    if (!div) return;
    const wb = XLSX.utils.book_new();
    wb.Props = { Title: `ZBOD - ${div.structure_name}`, Subject: 'Zero-Based Organizational Design', Author: 'ZBOD Tool' };

    const wsAll = getWs().filter(w => w.division_id === div.id);
    const activeWs = wsAll.find(w => w.status === 'active');
    const completedWs = wsAll.filter(w => w.status === 'completed').sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    const targetWs = activeWs || completedWs[0] || null;
    const fns = targetWs ? getFns().filter(f => f.workshop_id === targetWs.id).sort((a, b) => a.function_number - b.function_number) : [];
    const asIsFns = getAsIs().filter(f => f.division_id === div.id);

    const totalToBeHC = targetWs ? calculateProposedHeadcount(targetWs.id) : 0;
    const totalToBeBudget = targetWs ? calculateProposedBudget(targetWs.id) : 0;

    const wsHeaders = [
      'N\u00b0', 'Function Name', 'Career Level', 'Structure Type',
      'Elimination', 'Outsourcing', 'Automation',
      'Q1', 'Q2', 'Total',
      'HC Allocation %', 'Proposed HC',
      'Cost Allocation %', 'Proposed Budget',
      'Manager Count', 'Specialist',
      'HC Allocation Check', 'Span of Control',
      'Review for...', 'Business Impact Output'
    ];
    const wsData = [wsHeaders];

    fns.forEach(f => {
      const q1 = f.question1_score || 0;
      const q2 = f.question2_score || 0;
      const total = q1 + q2;
      const dec = f.zbod_decision || computePhase2Decision(q1, q2);
      const mgr = parseInt(f.manager_count) || 0;
      const prof = parseInt(f.professional_count) || 0;
      const propHC = f.proposed_hc || 0;
      const hcCheck = (mgr + prof) === propHC && propHC > 0 ? 'OK' : (propHC > 0 ? `Mismatch (${mgr + prof} vs ${propHC})` : 'N/A');

      const flags = [];
      if (f.can_be_eliminated === 'Yes') flags.push('Elimination');
      if (f.can_be_outsourced === 'Yes') flags.push('Outsourcing');
      if (f.can_be_automated === 'Yes') flags.push('Automation');
      const reviewFor = flags.length > 0
        ? 'Review for ' + (flags.length === 3 ? flags.slice(0, 2).join(', ') + ' and ' + flags[2] : flags.join(' and '))
        : '';

      wsData.push([
        f.function_number,
        f.proposed_function_name || '',
        f.career_level || '',
        f.function_structure_type || '',
        f.can_be_eliminated || '',
        f.can_be_outsourced || '',
        f.can_be_automated || '',
        q1 || '',
        q2 || '',
        total || '',
        f.hc_allocation_percent ? f.hc_allocation_percent + '%' : '',
        f.proposed_hc || '',
        f.cost_allocation_percent ? f.cost_allocation_percent + '%' : '',
        f.proposed_budget || '',
        f.manager_count || '',
        f.professional_count || '',
        hcCheck,
        f.span_of_control || '',
        reviewFor,
        dec
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(wsData);
    if (!ws1['!cols']) ws1['!cols'] = [];
    ws1['!cols'] = wsHeaders.map(() => ({ wch: 18 }));
    ws1['!cols'][1] = { wch: 30 };
    XLSX.utils.book_append_sheet(wb, ws1, 'Workshop');

    if (targetWs && completedWs.some(w => w.id === targetWs.id)) {
      const dbData = [];
      const totalAsIsHC = asIsFns.reduce((s, f) => s + (f.current_function_hc || 0), 0);
      const totalAsIsBudget = asIsFns.reduce((s, f) => s + (f.current_budget || 0), 0);

      dbData.push(['AS-IS vs TO-BE Dashboard']);
      dbData.push(['Completed:', new Date(targetWs.completed_at).toLocaleDateString() + ' ' + new Date(targetWs.completed_at).toLocaleTimeString()]);
      dbData.push([]);
      dbData.push(['Metric', 'AS-IS', 'TO-BE', 'Target']);
      dbData.push(['Total HC', totalAsIsHC, totalToBeHC, div.headcount_target || 0]);
      dbData.push(['Total Budget (AZN)', totalAsIsBudget, totalToBeBudget, div.budget_target || 0]);
      dbData.push([]);

      const inc = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'INVEST');
      const kp = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'KEEP');
      const opt = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'OPTIMIZE');
      const elm = fns.filter(f => (f.zbod_decision || computePhase2Decision(f.question1_score || 0, f.question2_score || 0)) === 'ELIMINATE');

      dbData.push(['Decision Distribution']);
      dbData.push(['Decision', 'Count', 'Percentage', 'Functions']);
      const totalF = fns.length || 1;
      [
        ['INVEST', inc.length, ((inc.length / totalF) * 100).toFixed(1) + '%', inc.map(f => f.function_number + '. ' + f.proposed_function_name).join('; ')],
        ['KEEP', kp.length, ((kp.length / totalF) * 100).toFixed(1) + '%', kp.map(f => f.function_number + '. ' + f.proposed_function_name).join('; ')],
        ['OPTIMIZE', opt.length, ((opt.length / totalF) * 100).toFixed(1) + '%', opt.map(f => f.function_number + '. ' + f.proposed_function_name).join('; ')],
        ['ELIMINATE', elm.length, ((elm.length / totalF) * 100).toFixed(1) + '%', elm.map(f => f.function_number + '. ' + f.proposed_function_name).join('; ')],
      ].forEach(r => dbData.push(r));
      dbData.push([]);

      dbData.push(['Headcount Distribution']);
      dbData.push(['Function', 'Proposed HC']);
      fns.filter(f => (f.proposed_hc || 0) > 0).forEach(f => dbData.push([f.function_number + '. ' + f.proposed_function_name, f.proposed_hc]));
      dbData.push(['Total', totalToBeHC]);
      dbData.push([]);

      dbData.push(['Budget Distribution']);
      dbData.push(['Function', 'Proposed Budget (AZN)']);
      fns.filter(f => (f.proposed_budget || 0) > 0).forEach(f => dbData.push([f.function_number + '. ' + f.proposed_function_name, f.proposed_budget]));
      dbData.push(['Total', totalToBeBudget]);
      dbData.push([]);

      dbData.push(['Headcount Comparison']);
      dbData.push(['Category', 'Value']);
      dbData.push(['AS-IS HC', totalAsIsHC]);
      dbData.push(['TO-BE HC', totalToBeHC]);
      dbData.push(['Target HC', div.headcount_target || 0]);
      dbData.push(['Difference (TO-BE vs Target)', totalToBeHC - (div.headcount_target || 0)]);
      dbData.push([]);

      dbData.push(['Budget Comparison']);
      dbData.push(['Category', 'Value (AZN)']);
      dbData.push(['AS-IS Budget', totalAsIsBudget]);
      dbData.push(['TO-BE Budget', totalToBeBudget]);
      dbData.push(['Target Budget', div.budget_target || 0]);
      dbData.push(['Difference (TO-BE vs Target)', totalToBeBudget - (div.budget_target || 0)]);
      dbData.push([]);

      dbData.push(['Division Targets vs Proposed']);
      dbData.push(['Metric', 'Proposed', 'Target', '% of Target']);
      dbData.push(['Headcount', totalToBeHC, div.headcount_target || 0, div.headcount_target ? ((totalToBeHC / div.headcount_target) * 100).toFixed(1) + '%' : 'N/A']);
      dbData.push(['Budget (AZN)', totalToBeBudget, div.budget_target || 0, div.budget_target ? ((totalToBeBudget / div.budget_target) * 100).toFixed(1) + '%' : 'N/A']);
      dbData.push([]);

      dbData.push(['AS-IS Org Chart']);
      dbData.push(['Function Name', 'Manager Count', 'Employee Count', 'Total HC', 'Budget (AZN)']);
      if (asIsFns.length > 0) {
        asIsFns.forEach(f => dbData.push([f.function_name || 'Unnamed', f.manager_count || 0, f.current_employee_count || 0, f.current_function_hc || 0, f.current_budget || 0]));
      } else {
        dbData.push(['No AS-IS functions', '', '', '', '']);
      }
      dbData.push([]);

      dbData.push(['TO-BE Org Chart']);
      dbData.push(['N\u00b0', 'Function Name', 'Career Level', 'Parent Function', 'Proposed HC']);
      if (fns.length > 0) {
        fns.forEach(f => {
          const parentFn = fns.find(p => p.id === f.parent_id);
          dbData.push([f.function_number, f.proposed_function_name, f.career_level || '', parentFn ? parentFn.proposed_function_name : '(Root)', f.proposed_hc || 0]);
        });
      } else {
        dbData.push(['No TO-BE functions', '', '', '', '']);
      }

      const ws2 = XLSX.utils.aoa_to_sheet(dbData);
      if (!ws2['!cols']) ws2['!cols'] = [];
      ws2['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Dashboard');
    } else {
      const ws2 = XLSX.utils.aoa_to_sheet([['Dashboard data is available after workshop completion.']]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Dashboard');
    }

    XLSX.writeFile(wb, `ZBOD_${div.structure_name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Excel exported');
  },

  // === ORG CHART CONTROLS ===
  orgZoom(delta) {
    orgZoomScale = Math.max(0.3, Math.min(2.5, orgZoomScale + delta));
    const canvas = document.getElementById('org-canvas');
    if (canvas) canvas.style.transform = `scale(${orgZoomScale})`;
  },
  orgZoomReset() {
    orgZoomScale = 1.0;
    const canvas = document.getElementById('org-canvas');
    if (canvas) canvas.style.transform = 'scale(1)';
  },
  orgZoomFit() {
    const canvas = document.getElementById('org-canvas');
    const viewport = canvas?.parentElement;
    if (!canvas || !viewport) return;
    const vW = viewport.clientWidth - 48;
    const cW = canvas.scrollWidth;
    if (cW > 0) {
      orgZoomScale = Math.max(0.3, Math.min(1.0, vW / cW));
      canvas.style.transform = `scale(${orgZoomScale})`;
    }
  },
  toggleOrgNode(el) {
    const branch = el.closest('.oc-branch, .oc-child-wrap');
    if (!branch) return;
    const subtree = branch.querySelector(':scope > .oc-subtree');
    if (!subtree) return;
    const isHidden = subtree.style.display === 'none';
    subtree.style.display = isHidden ? '' : 'none';
    el.innerHTML = isHidden ? '&minus;' : '+';
    el.title = isHidden ? 'Collapse' : 'Expand';
  },
  startOrgPan(event) {
    const viewport = event.currentTarget;
    orgIsPanning = true;
    orgPanStart = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.style.cursor = 'grabbing';
  },
  doOrgPan(event) {
    if (!orgIsPanning) return;
    const viewport = event.currentTarget;
    const dx = event.clientX - orgPanStart.x;
    const dy = event.clientY - orgPanStart.y;
    viewport.scrollLeft = orgPanStart.scrollLeft - dx;
    viewport.scrollTop = orgPanStart.scrollTop - dy;
  },
  endOrgPan(event) {
    if (!orgIsPanning) return;
    orgIsPanning = false;
    event.currentTarget.style.cursor = 'grab';
  },

  // === INIT ===
  async init() {
    await loadFromSupabase();
    const h = window.location.hash.slice(1);
    if (h === 'divisions') { showPage('divisions'); renderDivisions(); }
    else { showPage('landing'); renderLanding(); }
  },
};

// ═══════════════════════════════════════════
// HELPER: Delete cascading
// ═══════════════════════════════════════════
function delAsIsByDivision(divisionId) { lsSet(LS.asIs, getAsIs().filter(f => f.division_id !== divisionId)); }
function delWsByDivision(divisionId) { lsSet(LS.workshops, getWs().filter(w => w.division_id !== divisionId)); }

// ═══════════════════════════════════════════
// GLOBAL EVENT LISTENERS
// ═══════════════════════════════════════════
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
