// ═══════════════════════════════════════════════════════════════
// ZBOD Supabase Client — v3 Final
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://kryfxbpwbwrgjwehcgyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_htmBu1ftbqlJ3G0yRFrMkg_N3WohwP7';

const hasCredentials =
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key');

let _supabaseClient = null;
let supabaseAvailable = false;

(function initSupabase() {
  if (!hasCredentials) {
    console.log('[ZBOD] Supabase credentials not set — using localStorage fallback.');
    return;
  }
  if (typeof window === 'undefined') return;
  const lib = window.supabase;
  if (!lib || typeof lib.createClient !== 'function') {
    console.warn('[ZBOD] Supabase JS library not loaded.');
    return;
  }
  try {
    _supabaseClient = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseAvailable = true;
    console.log('[ZBOD] Supabase connected ✓');
  } catch (e) {
    console.warn('[ZBOD] Supabase createClient() failed:', e);
  }
})();

// ═══════════════════════════════════════════
// CORE QUERY HELPER
// ═══════════════════════════════════════════
async function sbQuery(table, operation, payload, eqCol, eqVal) {
  if (!_supabaseClient || !supabaseAvailable) {
    return { data: null, error: new Error('Supabase client not initialised') };
  }
  try {
    let q = _supabaseClient.from(table);
    if (operation === 'select') {
      q = q.select(payload || '*');
    } else if (operation === 'upsert') {
      q = q.upsert(payload, { onConflict: 'id' });
    } else if (operation === 'delete') {
      q = q.delete().eq(eqCol, eqVal);
    } else {
      return { data: null, error: new Error(`Unknown operation: ${operation}`) };
    }
    const result = await q;
    if (result.error) throw result.error;
    return result;
  } catch (e) {
    // NO circuit-breaker — log only, never disable the table
    console.warn(`[ZBOD] sbQuery(${table}, ${operation}) failed:`, e.message || e);
    return { data: null, error: e };
  }
}

async function sbUpsert(table, record) {
  const { error } = await sbQuery(table, 'upsert', record);
  if (error) throw error;
}

async function sbDeleteById(table, id) {
  const { error } = await sbQuery(table, 'delete', null, 'id', id);
  if (error) throw error;
}

async function sbSelectAll(table) {
  const { data, error } = await sbQuery(table, 'select', '*');
  if (error) throw error;
  return data || [];
}

function notAvailable(fnName) {
  console.warn(`[ZBOD] ${fnName}: Supabase not available — skipping.`);
}

// ═══════════════════════════════════════════
// DIVISIONS
// ═══════════════════════════════════════════
async function sbLoadDivisions() {
  if (!supabaseAvailable) { notAvailable('sbLoadDivisions'); return null; }
  try { return await sbSelectAll('divisions'); }
  catch (e) { console.warn('[ZBOD] sbLoadDivisions failed:', e.message); return null; }
}

async function sbSaveDivision(division) {
  if (!supabaseAvailable) { notAvailable('sbSaveDivision'); return false; }
  try { await sbUpsert('divisions', division); return true; }
  catch (e) { console.warn('[ZBOD] sbSaveDivision failed:', e.message); return false; }
}

async function sbDeleteDivision(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteDivision'); return false; }
  try { await sbDeleteById('divisions', id); return true; }
  catch (e) { console.warn('[ZBOD] sbDeleteDivision failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// WORKSHOPS
// ═══════════════════════════════════════════
async function sbLoadWorkshops() {
  if (!supabaseAvailable) { notAvailable('sbLoadWorkshops'); return null; }
  try { return await sbSelectAll('workshops'); }
  catch (e) { console.warn('[ZBOD] sbLoadWorkshops failed:', e.message); return null; }
}

async function sbSaveWorkshop(workshop) {
  if (!supabaseAvailable) { notAvailable('sbSaveWorkshop'); return false; }
  try { await sbUpsert('workshops', workshop); return true; }
  catch (e) { console.warn('[ZBOD] sbSaveWorkshop failed:', e.message); return false; }
}

async function sbDeleteWorkshop(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteWorkshop'); return false; }
  try { await sbDeleteById('workshops', id); return true; }
  catch (e) { console.warn('[ZBOD] sbDeleteWorkshop failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// WORKSHOP FUNCTIONS (TO-BE)
// ═══════════════════════════════════════════
async function sbLoadFunctions() {
  if (!supabaseAvailable) { notAvailable('sbLoadFunctions'); return null; }
  try { return await sbSelectAll('workshop_functions'); }
  catch (e) { console.warn('[ZBOD] sbLoadFunctions failed:', e.message); return null; }
}

async function sbSaveFunction(fn) {
  if (!supabaseAvailable) { notAvailable('sbSaveFunction'); return false; }
  try { await sbUpsert('workshop_functions', fn); return true; }
  catch (e) { console.warn('[ZBOD] sbSaveFunction failed:', e.message); return false; }
}

async function sbDeleteFunction(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteFunction'); return false; }
  try { await sbDeleteById('workshop_functions', id); return true; }
  catch (e) { console.warn('[ZBOD] sbDeleteFunction failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// AS-IS FUNCTIONS
// ═══════════════════════════════════════════
async function sbLoadAsIsFunctions() {
  if (!supabaseAvailable) { notAvailable('sbLoadAsIsFunctions'); return null; }
  try { return await sbSelectAll('as_is_functions'); }
  catch (e) { console.warn('[ZBOD] sbLoadAsIsFunctions failed:', e.message); return null; }
}

async function sbSaveAsIsFunction(fn) {
  if (!supabaseAvailable) { notAvailable('sbSaveAsIsFunction'); return false; }
  try { await sbUpsert('as_is_functions', fn); return true; }
  catch (e) { console.warn('[ZBOD] sbSaveAsIsFunction failed:', e.message); return false; }
}

async function sbDeleteAsIsFunction(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteAsIsFunction'); return false; }
  try { await sbDeleteById('as_is_functions', id); return true; }
  catch (e) { console.warn('[ZBOD] sbDeleteAsIsFunction failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// LANDING BOX SETTINGS
// ═══════════════════════════════════════════
async function sbLoadLandingBoxes() {
  if (!supabaseAvailable) { notAvailable('sbLoadLandingBoxes'); return null; }
  try { return await sbSelectAll('landing_box_settings'); }
  catch (e) { console.warn('[ZBOD] sbLoadLandingBoxes failed:', e.message); return null; }
}

async function sbSaveLandingBox(entry) {
  if (!supabaseAvailable) { notAvailable('sbSaveLandingBox'); return false; }
  try {
    await _supabaseClient.from('landing_box_settings').delete().eq('box_id', entry.box_id);
    const { error } = await _supabaseClient.from('landing_box_settings').insert(entry);
    if (error) throw error;
    return true;
  } catch (e) { console.warn('[ZBOD] sbSaveLandingBox failed:', e.message); return false; }
}

async function sbDeleteLandingBox(boxId) {
  if (!supabaseAvailable) { notAvailable('sbDeleteLandingBox'); return false; }
  try {
    const { error } = await _supabaseClient.from('landing_box_settings').delete().eq('box_id', boxId);
    if (error) throw error;
    return true;
  } catch (e) { console.warn('[ZBOD] sbDeleteLandingBox failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// BULK SYNC — used by migration helper
// ═══════════════════════════════════════════
async function sbSyncAll(divisions, workshops, functions, asIsFns) {
  if (!supabaseAvailable) { notAvailable('sbSyncAll'); return false; }
  try {
    // divisions MUST be persisted before workshops and as_is_functions
    // because of FK constraints. Run sequentially, not in parallel.
    for (const d of (divisions || [])) await sbSaveDivision(d);
    for (const w of (workshops || [])) await sbSaveWorkshop(w);
    for (const f of (functions || [])) await sbSaveFunction(f);
    for (const f of (asIsFns || [])) await sbSaveAsIsFunction(f);
    return true;
  } catch (e) { console.warn('[ZBOD] sbSyncAll failed:', e.message); return false; }
}

// ═══════════════════════════════════════════
// LOAD ALL (called on app init)
// ═══════════════════════════════════════════
async function sbLoadAll() {
  if (!supabaseAvailable) { notAvailable('sbLoadAll'); return null; }
  try {
    const [divisions, workshops, functions, asIsFns, metrics, keyFindings] = await Promise.all([
      sbLoadDivisions(),
      sbLoadWorkshops(),
      sbLoadFunctions(),
      sbLoadAsIsFunctions(),
      sbLoadMetrics(),
      sbLoadKeyFindings(),
    ]);

    return { divisions, workshops, functions, asIsFns, metrics, keyFindings };
  } catch (e) {
    console.warn('[ZBOD] sbLoadAll failed:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════
// DIVISION METRICS
// ═══════════════════════════════════════════
async function sbLoadMetrics() {
  if (!supabaseAvailable) { notAvailable('sbLoadMetrics'); return null; }
  try { return await sbSelectAll('division_metrics'); }
  catch (e) { console.warn('[ZBOD] sbLoadMetrics failed:', e.message); return null; }
}

async function sbSaveMetrics(divisionId, metricsArray) {
  if (!supabaseAvailable) { notAvailable('sbSaveMetrics'); return false; }
  try {
    const { error } = await _supabaseClient
      .from('division_metrics')
      .upsert(
        { 
          division_id: divisionId, 
          metrics_json: JSON.stringify(metricsArray), 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'division_id' }
      );

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveMetrics failed:', e.message);
    return false;
  }
}

async function sbDeleteMetrics(divisionId) {
  if (!supabaseAvailable) { notAvailable('sbDeleteMetrics'); return false; }
  try {
    const { error } = await _supabaseClient
      .from('division_metrics')
      .delete()
      .eq('division_id', divisionId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteMetrics failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// DIVISION KEY FINDINGS
// ═══════════════════════════════════════════
async function sbLoadKeyFindings() {
  if (!supabaseAvailable) { notAvailable('sbLoadKeyFindings'); return null; }
  try { return await sbSelectAll('division_key_findings'); }
  catch (e) { console.warn('[ZBOD] sbLoadKeyFindings failed:', e.message); return null; }
}

async function sbSaveKeyFindings(divisionId, findingsArray) {
  if (!supabaseAvailable) { notAvailable('sbSaveKeyFindings'); return false; }
  try {
    const { error } = await _supabaseClient
      .from('division_key_findings')
      .upsert(
        { 
          division_id: divisionId, 
          findings_json: JSON.stringify(findingsArray), 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'division_id' }
      );

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveKeyFindings failed:', e.message);
    return false;
  }
}

async function sbDeleteKeyFindings(divisionId) {
  if (!supabaseAvailable) { notAvailable('sbDeleteKeyFindings'); return false; }
  try {
    const { error } = await _supabaseClient
      .from('division_key_findings')
      .delete()
      .eq('division_id', divisionId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteKeyFindings failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════
window.zbodSupabase = {
  supabase: _supabaseClient,
  supabaseAvailable,
  sbQuery,
  isSbConnected: () => supabaseAvailable,
  setSbConnected: () => {},
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  sbLoadDivisions, sbSaveDivision, sbDeleteDivision,
  sbLoadWorkshops, sbSaveWorkshop, sbDeleteWorkshop,
  sbLoadFunctions, sbSaveFunction, sbDeleteFunction,
  sbLoadAsIsFunctions, sbSaveAsIsFunction, sbDeleteAsIsFunction,
  sbSyncAll, sbLoadAll,
  sbLoadLandingBoxes, sbSaveLandingBox, sbDeleteLandingBox,
  sbLoadMetrics,
  sbSaveMetrics,
  sbDeleteMetrics,
  sbLoadKeyFindings,
  sbSaveKeyFindings,
  sbDeleteKeyFindings,
};
