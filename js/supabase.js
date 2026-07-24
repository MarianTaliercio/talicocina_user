const SUPABASE_URL = 'https://cvqhrbeophtkersnpsxr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sEhwuKxRQodMSWCBaiQamg_wuFqqxwm';

window.db = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
let foodProfileOptions = [];
let availableBanks = [];

async function loadFoodProfileOptions() {
  const { data, error } = await window.db.from('food_profile_options').select('category,name,is_active,sort_order').eq('is_active', true).order('sort_order').order('name');
  if (error) { console.warn('No se pudieron cargar opciones alimentarias', error); return; }
  foodProfileOptions = data || [];
  if (typeof renderFoodProfileOptions === 'function') renderFoodProfileOptions();
  if (typeof renderRegistrationFoodOptions === 'function') renderRegistrationFoodOptions();
}

async function loadAvailableBanks() {
  const { data, error } = await window.db.from('banks').select('id,name').eq('is_active', true).order('name');
  if (error) { console.warn('No se pudieron cargar bancos', error); return; }
  availableBanks = data || [];
  let selectedName = '';
  if (currentUser) {
    const { data: primary } = await window.db.from('user_banks').select('banks(name)').eq('user_id', currentUser.id).eq('is_primary', true).maybeSingle();
    selectedName = primary?.banks?.name || '';
  }
  const select = document.getElementById('pf-banco');
  if (select) {
    select.innerHTML = '<option value="">Sin preferencia</option>' + availableBanks.map(bank => `<option value="${bank.name}">${bank.name}</option>`).join('');
    select.value = selectedName;
  }
}

function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { return JSON.parse(value); } catch (_) {} }
  return fallback;
}

function normalizeRecipe(row) {
  return {
    id: row.id, name: row.name || '', ytUrl: row.youtube_url || '', ytId: row.youtube_id || '',
    cals: Number(row.calories) || 0, porciones: Number(row.servings) || 1, durationMinutes: Number(row.duration_minutes) || 0,
    ingredientes: parseJsonField(row.ingredients), pasos: parseJsonField(row.steps),
    allergens: parseJsonField(row.allergens), dietaryTags: parseJsonField(row.dietary_tags), isActive: row.is_active !== false
  };
}

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function normalizePromo(row) {
  const weekdays = (row.promotion_weekdays || []).map(item => item.weekday).sort((a, b) => a - b);
  return {
    id: row.id, name: row.name, super: row.supermarkets?.name || 'Sin supermercado',
    banco: row.banks?.name || 'Todos los medios de pago', desc: row.description || row.name,
    disc: Number(row.discount_percentage) || 0, dias: weekdays.length ? weekdays.map(day => WEEKDAY_NAMES[day - 1]).join(', ') : 'Todos los días',
    vigencia: `${formatDate(row.valid_from)} al ${formatDate(row.valid_to)}`,
    bankId: row.bank_id, supermarketId: row.supermarket_id, validFrom: row.valid_from, validTo: row.valid_to,
    discountCap: row.discount_cap, minimumPurchase: row.minimum_purchase, weekdays
  };
}
function formatDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-AR') : ''; }

async function fetchSupabaseTable(table, mapper, query = '*') {
  if (!window.db) return null;
  const { data, error } = await window.db.from(table).select(query);
  if (error) { console.warn(`No se pudo cargar ${table}`, error); return null; }
  return (data || []).map(mapper);
}

async function loadSupabaseData() {
  const [remoteRecipes, remotePromos] = await Promise.all([
    fetchSupabaseTable('recipes', normalizeRecipe, '*'),
    fetchSupabaseTable('promotions', normalizePromo, '*, banks(name), supermarkets(name), promotion_weekdays(weekday)')
  ]);
  if (remoteRecipes !== null) { allRecipes = remoteRecipes.filter(recipe => recipe.isActive); recipes = [...allRecipes]; localStorage.setItem('tc_recipes', JSON.stringify(recipes)); }
  if (remotePromos !== null) { promos = remotePromos; localStorage.setItem('tc_promos', JSON.stringify(promos)); }
}

async function loadRegistrationPlans() {
  const { data, error } = await window.db.from('plans').select('name,price,currency,billing_interval,is_active').eq('is_active', true);
  if (error) { console.warn('No se pudieron cargar los planes', error); return; }
  const cards = { Gratuito: 'plan-gratuito', Plus: 'plan-mensual', Premium: 'plan-anual' };
  (data || []).forEach(plan => {
    registrationPlanPrices[plan.name] = Number(plan.price || 0);
    const card = document.getElementById(cards[plan.name]);
    if (!card) return;
    card.querySelector('.plan-name').textContent = plan.name;
    card.querySelector('.plan-price').textContent = `${plan.currency || 'ARS'} ${Number(plan.price || 0).toLocaleString('es-AR')}`;
    card.querySelector('.plan-price').dataset.currency = plan.currency || 'ARS';
    const interval = { monthly: 'por mes', quarterly: 'por trimestre', yearly: 'por año' }[plan.billing_interval] || '';
    card.querySelector('.plan-per').textContent = interval;
  });
}

async function getCurrentProfile() {
  const { data: { user } } = await window.db.auth.getUser();
  if (!user) return null;
  const { data, error } = await window.db.from('users').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, whatsapp: data.whatsapp || '' } : null;
}

async function ensureUserProfile(authUser, values = {}) {
  const profile = { id: authUser.id, email: authUser.email, name: values.name || '', apellido: values.apellido || '', whatsapp: values.whatsapp || '', city: values.city || '', personas: Number(values.personas) || 1, repetir_comidas: values.repetir_comidas ?? false };
  const { data, error } = await window.db.from('users').upsert(profile, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

async function getOrCreateBankId(name) {
  if (!name) return null;
  const { data: found, error: findError } = await window.db.from('banks').select('id').ilike('name', name).maybeSingle();
  if (findError) throw findError;
  if (found) return found.id;
  const { data, error } = await window.db.from('banks').insert({ name }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function saveUserBank(userId, bankName) {
  const bankId = await getOrCreateBankId(bankName);
  const { error: clearError } = await window.db.from('user_banks').update({ is_primary: false }).eq('user_id', userId).eq('is_primary', true);
  if (clearError) throw clearError;
  if (!bankId) return;
  const { error } = await window.db.from('user_banks').upsert({ user_id: userId, bank_id: bankId, is_primary: true }, { onConflict: 'user_id,bank_id' });
  if (error) throw error;
}

async function loadUserSelections() {
  if (!currentUser) return;
  const monday = getWeekStart();
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const { data, error } = await window.db.from('user_recipe_selections')
    .select('id, scheduled_date, meal_type, weekly_menu_recipe_id, weekly_menu_recipes(recipe_id)')
    .eq('user_id', currentUser.id).gte('scheduled_date', monday.toISOString().slice(0, 10)).lte('scheduled_date', sunday.toISOString().slice(0, 10)).neq('status', 'cancelled');
  if (error) { console.warn('No se pudieron cargar las selecciones', error); return; }
  plan = {};
  (data || []).forEach(selection => {
    const day = new Date(`${selection.scheduled_date}T00:00:00`).getDay() || 7;
    plan[`${WEEKDAY_NAMES[day - 1]}|${selection.meal_type === 'dinner' ? 'Cena' : 'Almuerzo'}`] = { id: selection.id, recipeId: selection.weekly_menu_recipes?.recipe_id, menuRecipeId: selection.weekly_menu_recipe_id };
  });
}
function getWeekStart() { const date = plannerAnchorDate ? new Date(`${plannerAnchorDate}T12:00:00`) : new Date(); const day = date.getDay() || 7; date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - day + 1); return date; }
function selectionDateForKey(key) { const date = getWeekStart(); date.setDate(date.getDate() + WEEKDAY_NAMES.indexOf(key.split('|')[0])); return date.toISOString().slice(0, 10); }
function recipeIdForPlanValue(value) { return typeof value === 'string' ? value : value?.recipeId; }
async function saveRecipeSelection(key, recipeId) {
  const scheduledDate = selectionDateForKey(key);
  const mealType = key.endsWith('|Cena') ? 'dinner' : 'lunch';
  const { data: menu, error: menuError } = await window.db.from('weekly_menus').select('id').eq('status', 'published').lte('week_start', scheduledDate).gte('week_end', scheduledDate).maybeSingle();
  if (menuError || !menu) throw new Error('No hay un menú publicado para esta semana.');
  const { data: menuRecipe, error: recipeError } = await window.db.from('weekly_menu_recipes').select('id').eq('weekly_menu_id', menu.id).eq('recipe_id', recipeId).eq('is_available', true).maybeSingle();
  if (recipeError || !menuRecipe) throw new Error('Esta receta no está disponible en el menú semanal.');
  const payload = { user_id: currentUser.id, weekly_menu_recipe_id: menuRecipe.id, scheduled_date: scheduledDate, meal_type: mealType, servings: Number(currentUser.personas) || 1, status: 'selected' };
  const { data: existing, error: existingError } = await window.db.from('user_recipe_selections').select('id').eq('user_id', currentUser.id).eq('scheduled_date', scheduledDate).eq('meal_type', mealType).neq('status', 'cancelled').maybeSingle();
  if (existingError) throw existingError;
  const query = existing ? window.db.from('user_recipe_selections').update(payload).eq('id', existing.id) : window.db.from('user_recipe_selections').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return { id: data.id, recipeId, menuRecipeId: menuRecipe.id };
}
async function cancelRecipeSelection(key) { if (!plan[key]?.id) return; const { error } = await window.db.from('user_recipe_selections').update({ status: 'cancelled' }).eq('id', plan[key].id); if (error) throw error; }

async function loadUserSelections() {
  if (!currentUser) return;
  const monday = getWeekStart(); const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const { data, error } = await window.db.from('user_recipe_selections').select('id, scheduled_date, meal_type, recipe_id, weekly_menu_recipe_id, weekly_menu_recipes(recipe_id)').eq('user_id', currentUser.id).gte('scheduled_date', monday.toISOString().slice(0, 10)).lte('scheduled_date', sunday.toISOString().slice(0, 10)).neq('status', 'cancelled');
  if (error) { console.warn('No se pudieron cargar las selecciones', error); return; }
  plan = {};
  (data || []).forEach(selection => { const day = new Date(`${selection.scheduled_date}T12:00:00`).getDay() || 7; const recipeId = selection.recipe_id || selection.weekly_menu_recipes?.recipe_id; plan[`${WEEKDAY_NAMES[day - 1]}|${selection.meal_type === 'dinner' ? 'Cena' : 'Almuerzo'}`] = { id: selection.id, recipeId, menuRecipeId: selection.weekly_menu_recipe_id }; });
}

async function saveRecipeSelection(key, recipeId) {
  const scheduledDate = selectionDateForKey(key); const mealType = key.endsWith('|Cena') ? 'dinner' : 'lunch';
  const payload = { user_id: currentUser.id, recipe_id: recipeId, weekly_menu_recipe_id: null, scheduled_date: scheduledDate, meal_type: mealType, servings: Number(currentUser.personas) || 1, status: 'selected' };
  const { data: existing, error: existingError } = await window.db.from('user_recipe_selections').select('id').eq('user_id', currentUser.id).eq('scheduled_date', scheduledDate).eq('meal_type', mealType).neq('status', 'cancelled').maybeSingle();
  if (existingError) throw existingError;
  const query = existing ? window.db.from('user_recipe_selections').update(payload).eq('id', existing.id) : window.db.from('user_recipe_selections').insert(payload);
  const { data, error } = await query.select().single(); if (error) throw error;
  return { id: data.id, recipeId, menuRecipeId: null };
}

async function loadProfessionalRecipes() {
  if (!currentUser) return;
  if (!allRecipes.length) allRecipes = [...(recipes || [])];
  const { data: catalog, error } = await window.db.rpc('get_my_professional_catalog');
  if (error) {
    console.warn('No se pudo cargar el catálogo profesional', error);
    recipes = [...allRecipes];
    return;
  }
  const hasProfessional = !!catalog?.has_professional;
  currentUser.hasProfessionalCatalog = hasProfessional;
  currentUser.professionalName = catalog?.professional_name || '';
  const mode = currentUser.recipe_catalog_mode || (hasProfessional ? 'professional' : 'all');
  if (!hasProfessional || mode === 'all') {
    recipes = [...allRecipes];
  } else {
    const assignedIds = new Set(catalog?.recipe_ids || []);
    recipes = allRecipes.filter(recipe => assignedIds.has(recipe.id));
  }
  localStorage.setItem('tc_recipes', JSON.stringify(recipes));
}

async function ensureUserProfile(authUser, values = {}) {
  let pending = {};
  try { pending = JSON.parse(localStorage.getItem('tc_pending_profile') || '{}'); } catch (_) {}
  const source = { ...pending, ...(authUser.user_metadata || {}), ...values };
  const profile = {
    id: authUser.id,
    email: authUser.email,
    name: source.name || '',
    apellido: source.apellido || '',
    whatsapp: source.whatsapp || '',
    city: source.city || '',
    personas: Number(source.personas) || 1,
    repetir_comidas: source.repetir_comidas ?? false
    ,allergies: Array.isArray(source.allergies) ? source.allergies : []
    ,dietary_preferences: Array.isArray(source.dietary_preferences) ? source.dietary_preferences : []
  };
  const { data, error } = await window.db.from('users').upsert(profile, { onConflict: 'id' }).select().single();
  if (error) throw error;
  localStorage.removeItem('tc_pending_profile');
  return data;
}
