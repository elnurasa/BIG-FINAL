// ═══════════════════════════════════════════
// ZBOD Supabase Client — Fixed & Hardened
// ═══════════════════════════════════════════

const SUPABASE_URL = 'https://kryfxbpwbwrgjwehcgyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_htmBu1ftbqlJ3G0yRFrMkg_N3WohwP7';

// -----------------------------------------------
// BUG #1 FIX: credential check was correct but
// the createClient() call overwrote window.supabase
// with the CLIENT INSTANCE, not the library.
// We now save the library ref BEFORE calling createClient.
// -----------------------------------------------
const hasCredentials =
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key');

let _supabaseClient = null;   // the actual Supabase client instance
let supabaseAvailable = false;

(function initSupabase() {
  if (!hasCredentials) {
    console.log('[ZBOD] Supabase credentials not set — using localStorage fallback.');
    return;
  }
  if (typeof window === 'undefined') return;

  // The CDN exposes the library as window.supabase (object with createClient).
  // After createClient() is called the result is a client, NOT the library.
  // We must grab the library ref before anything overwrites window.supabase.
  const lib = window.supabase;
  if (!lib || typeof lib.createClient !== 'function') {
    console.warn('[ZBOD] Supabase JS library not loaded. Check CDN script tag in index.html.');
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

// -----------------------------------------------
// BUG #2 FIX: sbConnected table key names didn't
// match the ACTUAL table names passed to sbQuery.
// sbQuery receives 'workshop_functions' and 'as_is_functions'
// but sbConnected had 'functions' and 'asIs'.
// So isSbConnected always returned false for those two tables
// and sbQuery bailed out immediately with "Supabase not available".
//
// Also removing the sbConnected circuit-breaker entirely (Bug #4).
// -----------------------------------------------

// -----------------------------------------------
// BUG #3 FIX: Every CRUD function checked:
//   if (!sb || !sb.supabaseAvailable)
// 'sb' is defined in script.js as `let sb = window.zbodSupabase`
// and is NOT in scope inside supabase.js at all.
// These guards always threw a ReferenceError or evaluated to true,
// blocking every operation.
// Fixed: use the module-local `supabaseAvailable` flag instead.
// -----------------------------------------------

// -----------------------------------------------
// BUG #4 FIX: sbQuery's catch block did:
//   sbConnected[table] = false;
// One transient 400 (e.g. UPDATE on a non-existent row)
// permanently disabled the table for the rest of the session.
// This caused the cascading "Supabase not available" failures.
// Fixed: removed the circuit-breaker entirely. Errors are logged
// and returned but never disable the table permanently.
// -----------------------------------------------

// -----------------------------------------------
// BUG #5 FIX: UPDATE without a WHERE clause.
// sbQuery('divisions', 'update', division, 'id', division.id)
// The args positional mapping was:
//   args[0] = data, args[1] = col, args[2] = val
// BUT the .eq() was only applied when args[1] was truthy.
// For UPDATE, args[0] is the payload object — always truthy —
// so the .eq() WAS being applied. However Supabase REST returns
// 400 if UPDATE matches 0 rows (row didn't exist yet).
// The catch then permanently disabled the table (Bug #4).
// Fixed: use .upsert() with onConflict:'id' instead of update+insert.
// -----------------------------------------------

// -----------------------------------------------
// BUG #6 FIX: sbSaveLandingBox and sbDeleteLandingBox used
//   sb.supabase.from(...)
// 'sb' is not in scope here AND the exported object has no
// `.supabase` sub-key — it has `supabase` at the top level.
// Fixed: use _supabaseClient directly.
// -----------------------------------------------

// -----------------------------------------------
// BUG #7 FIX: sbSyncAll, sbLoadAll and all CRUD fns
// checked `if (!sb || !sb.supabaseAvailable)` — same
// out-of-scope `sb` variable. Fixed throughout.
// -----------------------------------------------

// ═══════════════════════════════════════════
// CORE QUERY HELPER
// Uses .upsert() for insert/update — single round-trip,
// no 400 on "row not found", no circuit-breaker.
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
      // onConflict targets the PRIMARY KEY column (always 'id' for our tables)
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
    // Log but DO NOT permanently disable the table.
    console.warn(`[ZBOD] sbQuery(${table}, ${operation}) failed:`, e.message || e);
    return { data: null, error: e };
  }
}

// Convenience: upsert a single record
async function sbUpsert(table, record) {
  const { error } = await sbQuery(table, 'upsert', record);
  if (error) throw error;
}

// Convenience: delete a single record by id
async function sbDelete(table, id) {
  const { error } = await sbQuery(table, 'delete', null, 'id', id);
  if (error) throw error;
}

// Convenience: select all rows
async function sbSelectAll(table) {
  const { data, error } = await sbQuery(table, 'select', '*');
  if (error) throw error;
  return data || [];
}

// ═══════════════════════════════════════════
// AVAILABILITY GUARD (replaces the broken `sb` checks)
// ═══════════════════════════════════════════
function notAvailable(fnName) {
  console.warn(`[ZBOD] ${fnName}: Supabase not available — skipping.`);
}

// ═══════════════════════════════════════════
// DIVISIONS
// ═══════════════════════════════════════════
async function sbLoadDivisions() {
  if (!supabaseAvailable) { notAvailable('sbLoadDivisions'); return null; }
  try {
    return await sbSelectAll('divisions');
  } catch (e) {
    console.warn('[ZBOD] sbLoadDivisions failed:', e.message);
    return null;
  }
}

async function sbSaveDivision(division) {
  if (!supabaseAvailable) { notAvailable('sbSaveDivision'); return false; }
  try {
    await sbUpsert('divisions', division);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveDivision failed:', e.message);
    return false;
  }
}

async function sbDeleteDivision(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteDivision'); return false; }
  try {
    await sbDelete('divisions', id);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteDivision failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// WORKSHOPS
// ═══════════════════════════════════════════
async function sbLoadWorkshops() {
  if (!supabaseAvailable) { notAvailable('sbLoadWorkshops'); return null; }
  try {
    return await sbSelectAll('workshops');
  } catch (e) {
    console.warn('[ZBOD] sbLoadWorkshops failed:', e.message);
    return null;
  }
}

async function sbSaveWorkshop(workshop) {
  if (!supabaseAvailable) { notAvailable('sbSaveWorkshop'); return false; }
  try {
    await sbUpsert('workshops', workshop);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveWorkshop failed:', e.message);
    return false;
  }
}

async function sbDeleteWorkshop(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteWorkshop'); return false; }
  try {
    await sbDelete('workshops', id);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteWorkshop failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// WORKSHOP FUNCTIONS (TO-BE)
// ═══════════════════════════════════════════
async function sbLoadFunctions() {
  if (!supabaseAvailable) { notAvailable('sbLoadFunctions'); return null; }
  try {
    return await sbSelectAll('workshop_functions');
  } catch (e) {
    console.warn('[ZBOD] sbLoadFunctions failed:', e.message);
    return null;
  }
}

async function sbSaveFunction(fn) {
  if (!supabaseAvailable) { notAvailable('sbSaveFunction'); return false; }
  try {
    await sbUpsert('workshop_functions', fn);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveFunction failed:', e.message);
    return false;
  }
}

async function sbDeleteFunction(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteFunction'); return false; }
  try {
    await sbDelete('workshop_functions', id);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteFunction failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// AS-IS FUNCTIONS
// ═══════════════════════════════════════════
async function sbLoadAsIsFunctions() {
  if (!supabaseAvailable) { notAvailable('sbLoadAsIsFunctions'); return null; }
  try {
    return await sbSelectAll('as_is_functions');
  } catch (e) {
    console.warn('[ZBOD] sbLoadAsIsFunctions failed:', e.message);
    return null;
  }
}

async function sbSaveAsIsFunction(fn) {
  if (!supabaseAvailable) { notAvailable('sbSaveAsIsFunction'); return false; }
  try {
    await sbUpsert('as_is_functions', fn);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveAsIsFunction failed:', e.message);
    return false;
  }
}

async function sbDeleteAsIsFunction(id) {
  if (!supabaseAvailable) { notAvailable('sbDeleteAsIsFunction'); return false; }
  try {
    await sbDelete('as_is_functions', id);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteAsIsFunction failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// LANDING BOX SETTINGS
// ═══════════════════════════════════════════
async function sbLoadLandingBoxes() {
  if (!supabaseAvailable) { notAvailable('sbLoadLandingBoxes'); return null; }
  try {
    return await sbSelectAll('landing_box_settings');
  } catch (e) {
    console.warn('[ZBOD] sbLoadLandingBoxes failed:', e.message);
    return null;
  }
}

async function sbSaveLandingBox(entry) {
  if (!supabaseAvailable) { notAvailable('sbSaveLandingBox'); return false; }
  try {
    // landing_box_settings uses box_id as the unique key (not id),
    // so we use a delete-then-insert upsert pattern here.
    await _supabaseClient.from('landing_box_settings').delete().eq('box_id', entry.box_id);
    const { error } = await _supabaseClient.from('landing_box_settings').insert(entry);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSaveLandingBox failed:', e.message);
    return false;
  }
}

async function sbDeleteLandingBox(boxId) {
  if (!supabaseAvailable) { notAvailable('sbDeleteLandingBox'); return false; }
  try {
    const { error } = await _supabaseClient.from('landing_box_settings').delete().eq('box_id', boxId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbDeleteLandingBox failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// BULK SYNC
// ═══════════════════════════════════════════
async function sbSyncAll(divisions, workshops, functions, asIsFns) {
  if (!supabaseAvailable) { notAvailable('sbSyncAll'); return false; }
  try {
    const tasks = [];
    (divisions || []).forEach(d => tasks.push(sbSaveDivision(d)));
    (workshops || []).forEach(w => tasks.push(sbSaveWorkshop(w)));
    (functions || []).forEach(f => tasks.push(sbSaveFunction(f)));
    (asIsFns   || []).forEach(f => tasks.push(sbSaveAsIsFunction(f)));
    await Promise.all(tasks);
    return true;
  } catch (e) {
    console.warn('[ZBOD] sbSyncAll failed:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════
// LOAD ALL (called on app init)
// ═══════════════════════════════════════════
async function sbLoadAll() {
  if (!supabaseAvailable) { notAvailable('sbLoadAll'); return null; }
  try {
    const [divisions, workshops, functions, asIsFns] = await Promise.all([
      sbLoadDivisions(),
      sbLoadWorkshops(),
      sbLoadFunctions(),
      sbLoadAsIsFunctions(),
    ]);
    return { divisions, workshops, functions, asIsFns };
  } catch (e) {
    console.warn('[ZBOD] sbLoadAll failed:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════
// EXPORT — consumed by script.js as window.zbodSupabase
// ═══════════════════════════════════════════
window.zbodSupabase = {
  // expose the client so script.js can use supabaseAvailable check
  supabase: _supabaseClient,
  supabaseAvailable,
  // low-level helpers (kept for any external callers)
  sbQuery,
  isSbConnected: () => supabaseAvailable,
  setSbConnected: () => {},   // no-op — circuit-breaker removed
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  // CRUD
  sbLoadDivisions,
  sbSaveDivision,
  sbDeleteDivision,
  sbLoadWorkshops,
  sbSaveWorkshop,
  sbDeleteWorkshop,
  sbLoadFunctions,
  sbSaveFunction,
  sbDeleteFunction,
  sbLoadAsIsFunctions,
  sbSaveAsIsFunction,
  sbDeleteAsIsFunction,
  sbSyncAll,
  sbLoadAll,
  sbLoadLandingBoxes,
  sbSaveLandingBox,
  sbDeleteLandingBox,
};
