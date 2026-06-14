// Supabase Client Configuration
// Replace these placeholder values with your actual Supabase project credentials
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Check if credentials are configured
const hasCredentials = SUPABASE_URL.includes('your-project') === false &&
                       SUPABASE_ANON_KEY.includes('your-anon-key') === false;

let supabase = null;
let supabaseAvailable = false;

if (hasCredentials && typeof window !== 'undefined') {
  try {
    // Load Supabase from CDN if available
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseAvailable = true;
      console.log('Supabase connected');
    } else {
      console.warn('Supabase JS library not loaded. Using localStorage fallback.');
      supabaseAvailable = false;
    }
  } catch (e) {
    console.warn('Supabase connection failed:', e);
    supabaseAvailable = false;
  }
} else {
  console.log('Supabase credentials not configured. Using localStorage fallback for demo mode.');
}

// Track which tables are connected
const sbConnected = {
  divisions: supabaseAvailable,
  workshops: supabaseAvailable,
  functions: supabaseAvailable,
  asIs: supabaseAvailable,
  comparisons: supabaseAvailable,
};

function setSbConnected(table, val) { sbConnected[table] = val; }
function isSbConnected(table) { return sbConnected[table] && supabaseAvailable; }

// Safe Supabase query wrapper
async function sbQuery(table, operation, ...args) {
  if (!supabase || !sbConnected[table]) return { data: null, error: new Error('Supabase not available') };
  try {
    let query = supabase.from(table);
    if (operation === 'select') query = query.select(args[0] || '*');
    else if (operation === 'insert') query = query.insert(args[0]);
    else if (operation === 'update') query = query.update(args[0]);
    else if (operation === 'delete') query = query.delete();
    if (args[1]) query = query.eq(args[1], args[2]);
    if (args[3]) query = query.eq(args[3], args[4]);
    if (args[5] === 'order') query = query.order(args[6], { ascending: args[7] });
    const result = await query;
    if (result.error) throw result.error;
    return result;
  } catch (e) {
    sbConnected[table] = false;
    return { data: null, error: e };
  }
}

// ═══════════════════════════════════════════
// DIVISIONS CRUD
// ═══════════════════════════════════════════
async function sbLoadDivisions() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const { data, error } = await sbQuery('divisions', 'select', '*');
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('sbLoadDivisions failed:', e);
    return null;
  }
}

async function sbSaveDivision(division) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    // Try update first, then insert
    const { error: updateError } = await sbQuery('divisions', 'update', division, 'id', division.id);
    if (updateError) {
      const { error: insertError } = await sbQuery('divisions', 'insert', division);
      if (insertError) throw insertError;
    }
    return true;
  } catch (e) {
    console.warn('sbSaveDivision failed:', e);
    return false;
  }
}

async function sbDeleteDivision(id) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error } = await sbQuery('divisions', 'delete', null, 'id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('sbDeleteDivision failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// WORKSHOPS CRUD
// ═══════════════════════════════════════════
async function sbLoadWorkshops() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const { data, error } = await sbQuery('workshops', 'select', '*');
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('sbLoadWorkshops failed:', e);
    return null;
  }
}

async function sbSaveWorkshop(workshop) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error: updateError } = await sbQuery('workshops', 'update', workshop, 'id', workshop.id);
    if (updateError) {
      const { error: insertError } = await sbQuery('workshops', 'insert', workshop);
      if (insertError) throw insertError;
    }
    return true;
  } catch (e) {
    console.warn('sbSaveWorkshop failed:', e);
    return false;
  }
}

async function sbDeleteWorkshop(id) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error } = await sbQuery('workshops', 'delete', null, 'id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('sbDeleteWorkshop failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// WORKSHOP FUNCTIONS CRUD
// ═══════════════════════════════════════════
async function sbLoadFunctions() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const { data, error } = await sbQuery('workshop_functions', 'select', '*');
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('sbLoadFunctions failed:', e);
    return null;
  }
}

async function sbSaveFunction(fn) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error: updateError } = await sbQuery('workshop_functions', 'update', fn, 'id', fn.id);
    if (updateError) {
      const { error: insertError } = await sbQuery('workshop_functions', 'insert', fn);
      if (insertError) throw insertError;
    }
    return true;
  } catch (e) {
    console.warn('sbSaveFunction failed:', e);
    return false;
  }
}

async function sbDeleteFunction(id) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error } = await sbQuery('workshop_functions', 'delete', null, 'id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('sbDeleteFunction failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// AS-IS FUNCTIONS CRUD
// ═══════════════════════════════════════════
async function sbLoadAsIsFunctions() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const { data, error } = await sbQuery('as_is_functions', 'select', '*');
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('sbLoadAsIsFunctions failed:', e);
    return null;
  }
}

async function sbSaveAsIsFunction(fn) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error: updateError } = await sbQuery('as_is_functions', 'update', fn, 'id', fn.id);
    if (updateError) {
      const { error: insertError } = await sbQuery('as_is_functions', 'insert', fn);
      if (insertError) throw insertError;
    }
    return true;
  } catch (e) {
    console.warn('sbSaveAsIsFunction failed:', e);
    return false;
  }
}

async function sbDeleteAsIsFunction(id) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error } = await sbQuery('as_is_functions', 'delete', null, 'id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('sbDeleteAsIsFunction failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// BULK SYNC OPERATIONS
// ═══════════════════════════════════════════
async function sbSyncAll(divisions, workshops, functions, asIsFns) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    // Sync divisions
    if (divisions && divisions.length > 0) {
      for (const d of divisions) {
        await sbSaveDivision(d);
      }
    }
    // Sync workshops
    if (workshops && workshops.length > 0) {
      for (const w of workshops) {
        await sbSaveWorkshop(w);
      }
    }
    // Sync functions
    if (functions && functions.length > 0) {
      for (const f of functions) {
        await sbSaveFunction(f);
      }
    }
    // Sync AS-IS functions
    if (asIsFns && asIsFns.length > 0) {
      for (const f of asIsFns) {
        await sbSaveAsIsFunction(f);
      }
    }
    return true;
  } catch (e) {
    console.warn('sbSyncAll failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// LANDING BOX SETTINGS CRUD
// ═══════════════════════════════════════════
async function sbLoadLandingBoxes() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const { data, error } = await sbQuery('landing_box_settings', 'select', '*');
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('sbLoadLandingBoxes failed:', e);
    return null;
  }
}

async function sbSaveLandingBox(entry) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    // Upsert by box_id
    const { error: delError } = await sb.supabase.from('landing_box_settings').delete().eq('box_id', entry.box_id);
    if (delError) console.warn('delete warning:', delError);
    const { error: insError } = await sb.supabase.from('landing_box_settings').insert(entry);
    if (insError) throw insError;
    return true;
  } catch (e) {
    console.warn('sbSaveLandingBox failed:', e);
    return false;
  }
}

async function sbDeleteLandingBox(boxId) {
  if (!sb || !sb.supabaseAvailable) return false;
  try {
    const { error } = await sb.supabase.from('landing_box_settings').delete().eq('box_id', boxId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('sbDeleteLandingBox failed:', e);
    return false;
  }
}

// ═══════════════════════════════════════════
// LOAD ALL DATA FROM SUPABASE
// ═══════════════════════════════════════════
async function sbLoadAll() {
  if (!sb || !sb.supabaseAvailable) return null;
  try {
    const [divisions, workshops, functions, asIsFns] = await Promise.all([
      sbLoadDivisions(),
      sbLoadWorkshops(),
      sbLoadFunctions(),
      sbLoadAsIsFunctions(),
    ]);
    return { divisions, workshops, functions, asIsFns };
  } catch (e) {
    console.warn('sbLoadAll failed:', e);
    return null;
  }
}

// Export for use in app.js
window.zbodSupabase = {
  supabase,
  supabaseAvailable,
  sbQuery,
  isSbConnected,
  setSbConnected,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  // Full CRUD
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
  // Landing box settings
  sbLoadLandingBoxes,
  sbSaveLandingBox,
  sbDeleteLandingBox,
};
