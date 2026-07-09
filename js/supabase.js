const SUPABASE_URL = 'https://cvqhrbeophtkersnpsxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sEhwuKxRQodMSWCBaiQamg_wuFqqxwm';

window.db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

function parseJsonField(value, fallback){
  if(Array.isArray(value)) return value;
  if(!value) return fallback;
  if(typeof value === 'string'){
    try { return JSON.parse(value); }
    catch { return fallback; }
  }
  return fallback;
}

function normalizeRecipe(row){
  return {
    id: row.id,
    name: row.name || row.nombre || '',
    ytUrl: row.ytUrl || row.yt_url || row.youtube_url || '',
    ytId: row.ytId || row.yt_id || row.youtube_id || '',
    cals: parseInt(row.cals ?? row.calorias ?? row.calories) || 0,
    porciones: parseInt(row.porciones ?? row.portions) || 2,
    ingredientes: parseJsonField(row.ingredientes ?? row.ingredients, []),
    pasos: parseJsonField(row.pasos ?? row.steps, []),
  };
}

function normalizePromo(row){
  return {
    id: row.id,
    super: row.super || row.store || row.supermercado || 'coto',
    banco: row.banco || row.bank || '',
    desc: row.desc || row.description || row.descripcion || '',
    disc: parseInt(row.disc ?? row.discount ?? row.descuento) || 0,
    dias: row.dias || row.days || '',
    vigencia: row.vigencia || row.valid_until || row.validity || '',
  };
}

function normalizeUser(row){
  return {
    personas: 2,
    status: 'activo',
    plan: 'mensual',
    ...row,
    personas: row.personas || row.people || 2,
  };
}

async function fetchSupabaseTable(table, mapper){
  if(!window.db) return null;
  const { data, error } = await window.db.from(table).select('*');
  if(error){
    console.warn(`No se pudo cargar ${table} desde Supabase`, error);
    return null;
  }
  return (data || []).map(mapper);
}

async function loadSupabaseData(){
  const [remoteRecipes, remotePromos, remoteUsers] = await Promise.all([
    fetchSupabaseTable('recipes', normalizeRecipe),
    fetchSupabaseTable('promos', normalizePromo),
    fetchSupabaseTable('users', normalizeUser),
  ]);

  if(remoteRecipes?.length){
    recipes = remoteRecipes;
    localStorage.setItem('tc_recipes', JSON.stringify(recipes));
  }

  if(remotePromos?.length){
    promos = remotePromos;
    localStorage.setItem('tc_promos', JSON.stringify(promos));
  }

  if(remoteUsers?.length){
    saveUsers(remoteUsers);
  }
}

async function upsertSupabaseUser(user){
  if(!window.db || !user?.email) return;
  const data = {
    id: user.id || uid(),
    name: user.name || '',
    apellido: user.apellido || '',
    email: user.email,
    password: user.password || '',
    wapp: user.wapp || '',
    plan: user.plan || 'mensual',
    city: user.city || '',
    banco: user.banco || '',
    personas: user.personas || 2,
    status: user.status || 'activo',
    joined: user.joined || new Date().toLocaleDateString('es-AR'),
  };

  const { error } = await window.db
    .from('users')
    .upsert(data, { onConflict: 'id' });

  if(error){
    console.warn('No se pudo guardar el usuario en Supabase', error);
    throw error;
  }
}
