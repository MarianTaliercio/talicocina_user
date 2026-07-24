let favoriteRecipeIds = new Set();
let pantryItemKeys = new Set();
let userNotifications = [];
let patientRecommendations = [];
let recipeFeedback = [];
let recipePickerMode = 'compatible';

function experienceKey(value) {
  return String(value || '').trim().toLocaleLowerCase('es-AR');
}

async function loadExperienceData() {
  if (!currentUser || !window.db) return;
  const [favorites, pantry, notifications, recommendations, feedback] = await Promise.all([
    window.db.from('user_recipe_favorites').select('recipe_id').eq('user_id', currentUser.id),
    window.db.from('user_pantry_items').select('item_key').eq('user_id', currentUser.id),
    window.db.from('user_notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(30),
    window.db.rpc('get_patient_recommendations'),
    window.db.from('user_recipe_feedback').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(40)
  ]);
  if (!favorites.error) favoriteRecipeIds = new Set((favorites.data || []).map(item => item.recipe_id));
  if (!pantry.error) pantryItemKeys = new Set((pantry.data || []).map(item => item.item_key));
  if (!notifications.error) userNotifications = notifications.data || [];
  if (!recommendations.error) patientRecommendations = recommendations.data || [];
  if (!feedback.error) recipeFeedback = feedback.data || [];
  buildExperienceUI();
  updateNotificationBadge();
}

function foodProfileStatus(recipe) {
  const allergies = (currentUser?.allergies || []).map(experienceKey).filter(Boolean);
  const allergens = (recipe?.allergens || []).map(experienceKey);
  const conflicts = allergies.filter(item => allergens.includes(item));
  const preferences = (currentUser?.dietary_preferences || []).map(experienceKey)
    .filter(item => item && item !== 'omnívoro' && item !== 'omnivoro');
  const tags = (recipe?.dietaryTags || []).map(experienceKey);
  const missing = preferences.filter(item => !tags.includes(item));
  return { safe: !conflicts.length, compatible: !conflicts.length && !missing.length, conflicts, missing };
}

async function toggleFavorite(recipeId) {
  if (!currentUser) return;
  if (favoriteRecipeIds.has(recipeId)) {
    const { error } = await window.db.from('user_recipe_favorites').delete().eq('user_id', currentUser.id).eq('recipe_id', recipeId);
    if (error) return toast(error.message);
    favoriteRecipeIds.delete(recipeId);
    toast('Receta eliminada de favoritos');
  } else {
    const { error } = await window.db.from('user_recipe_favorites').insert({ user_id: currentUser.id, recipe_id: recipeId });
    if (error) return toast(error.message);
    favoriteRecipeIds.add(recipeId);
    toast('Receta guardada en favoritos');
  }
  decorateRecipeDetail(recipeId);
  enhanceRecipePicker();
  renderExperienceProfile();
}

function recommendedItem(recipeId) {
  return patientRecommendations.find(item => item.recipe_id === recipeId);
}

function decorateRecipeDetail(recipeId) {
  const body = document.getElementById('mo-detail-body');
  const recipe = recipes.find(item => item.id === recipeId) || allRecipes.find(item => item.id === recipeId);
  if (!body || !recipe) return;
  body.querySelectorAll('.experience-recipe-tools').forEach(item => item.remove());
  const status = foodProfileStatus(recipe);
  const recommendation = recommendedItem(recipeId);
  const tools = document.createElement('div');
  tools.className = 'experience-recipe-tools';
  tools.innerHTML = `
    <div class="food-safety ${status.safe ? 'safe' : 'danger'}">
      <strong>${status.safe ? '✓ Apta según tus alergias' : '⚠ Contiene: ' + status.conflicts.join(', ')}</strong>
      <span>${status.compatible ? 'También coincide con tus preferencias.' : status.missing.length ? 'No coincide con: ' + status.missing.join(', ') : 'Revisá siempre el envase de los ingredientes.'}</span>
    </div>
    ${recommendation ? `<div class="professional-note"><strong>Recomendación de tu nutricionista</strong><span>${recommendation.note || 'Esta receta fue elegida especialmente para vos.'}${recommendation.recommended_date ? ` · ${new Date(`${recommendation.recommended_date}T12:00:00`).toLocaleDateString('es-AR')}` : ''}</span></div>` : ''}
    <div class="experience-action-row">
      <button class="btn btn-outline" type="button" onclick="toggleFavorite('${recipeId}')">${favoriteRecipeIds.has(recipeId) ? '♥ Guardada' : '♡ Guardar favorita'}</button>
      <button class="btn btn-outline" type="button" onclick="showRecipeFeedback('${recipeId}')">¿La preparaste?</button>
    </div>
    <div class="recipe-feedback-box" id="recipe-feedback-box-${recipeId}">
      <span>Contanos cómo te fue:</span>
      <button type="button" onclick="saveRecipeFeedback('${recipeId}','liked')">😍 Me gustó</button>
      <button type="button" onclick="saveRecipeFeedback('${recipeId}','disliked')">😕 No me gustó</button>
      <button type="button" onclick="saveRecipeFeedback('${recipeId}','not_prepared')">⏳ No la preparé</button>
    </div>`;
  const title = body.querySelector('.modal-title');
  title?.insertAdjacentElement('afterend', tools);
}

function showRecipeFeedback(recipeId) {
  document.getElementById(`recipe-feedback-box-${recipeId}`)?.classList.toggle('on');
}

async function saveRecipeFeedback(recipeId, outcome) {
  const scheduledDate = Object.entries(plan).find(([, value]) => recipeIdForPlanValue(value) === recipeId);
  const payload = { user_id: currentUser.id, recipe_id: recipeId, scheduled_date: scheduledDate ? selectionDateForKey(scheduledDate[0]) : new Date().toISOString().slice(0, 10), outcome };
  const { data, error } = await window.db.from('user_recipe_feedback').upsert(payload, { onConflict: 'user_id,recipe_id,scheduled_date' }).select().single();
  if (error) return toast(error.message);
  recipeFeedback = [data, ...recipeFeedback.filter(item => item.id !== data.id)];
  toast('Gracias, guardamos tu respuesta');
  renderExperienceProfile();
}

function enhanceRecipePicker() {
  const grid = document.getElementById('mo-pick-grid');
  if (!grid || !grid.children.length) return;
  let controls = document.getElementById('recipe-picker-tools');
  if (!controls) {
    controls = document.createElement('div');
    controls.id = 'recipe-picker-tools';
    controls.innerHTML = `<input class="form-input" id="recipe-picker-search" type="search" placeholder="Buscar receta o ingrediente…" oninput="filterRecipePicker()">
      <div class="picker-filter-row">
        <button type="button" class="chip on" data-picker-mode="compatible" onclick="setRecipePickerMode('compatible',this)">Aptas para mí</button>
        <button type="button" class="chip" data-picker-mode="favorites" onclick="setRecipePickerMode('favorites',this)">Favoritas</button>
        <button type="button" class="chip" data-picker-mode="recommended" onclick="setRecipePickerMode('recommended',this)">De mi nutricionista</button>
        <button type="button" class="chip" data-picker-mode="all" onclick="setRecipePickerMode('all',this)">Todas</button>
      </div>`;
    grid.parentElement.insertBefore(controls, grid);
  }
  [...grid.querySelectorAll('.pick-card')].forEach(card => {
    const match = card.getAttribute('onclick')?.match(/pickR\('([^']+)'\)/);
    const recipe = match ? (allRecipes.find(item => item.id === match[1]) || recipes.find(item => item.id === match[1])) : null;
    if (!recipe) return;
    card.dataset.recipeId = recipe.id;
    card.dataset.search = experienceKey(`${recipe.name} ${(recipe.ingredientes || []).map(item => item.n).join(' ')} ${(recipe.dietaryTags || []).join(' ')}`);
    if (!card.querySelector('.pick-flags')) {
      const status = foodProfileStatus(recipe);
      card.insertAdjacentHTML('beforeend', `<div class="pick-flags">${favoriteRecipeIds.has(recipe.id) ? '<span>♥ Favorita</span>' : ''}${recommendedItem(recipe.id) ? '<span>Profesional</span>' : ''}${!status.safe ? '<span class="danger">⚠ Alérgeno</span>' : ''}</div>`);
    }
  });
  filterRecipePicker();
}

function setRecipePickerMode(mode, button) {
  recipePickerMode = mode;
  document.querySelectorAll('[data-picker-mode]').forEach(item => item.classList.toggle('on', item === button));
  filterRecipePicker();
}

function filterRecipePicker() {
  const query = experienceKey(document.getElementById('recipe-picker-search')?.value);
  document.querySelectorAll('#mo-pick-grid .pick-card').forEach(card => {
    const id = card.dataset.recipeId;
    const recipe = allRecipes.find(item => item.id === id) || recipes.find(item => item.id === id);
    const status = foodProfileStatus(recipe);
    const modeMatch = recipePickerMode === 'all'
      || (recipePickerMode === 'compatible' && status.compatible)
      || (recipePickerMode === 'favorites' && favoriteRecipeIds.has(id))
      || (recipePickerMode === 'recommended' && !!recommendedItem(id));
    card.style.display = modeMatch && (!query || card.dataset.search.includes(query)) ? '' : 'none';
  });
}

function shoppingCategory(name) {
  const value = experienceKey(name);
  if (/pollo|carne|cerdo|pescado|merluza|atún/.test(value)) return 'Carnicería y pollería';
  if (/tomate|papa|cebolla|zanahoria|lechuga|espinaca|zapallo|fruta|limón|ajo|morron|morrón/.test(value)) return 'Verdulería';
  if (/leche|queso|yogur|manteca|crema|huevo/.test(value)) return 'Lácteos y frescos';
  if (/pan|tortilla|masa/.test(value)) return 'Panadería';
  return 'Almacén';
}

function enhanceShoppingList() {
  const body = document.getElementById('buy-body');
  if (!body || !body.querySelector('.ingr-list')) return;
  let toolbar = document.getElementById('shopping-tools');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'shopping-tools';
    toolbar.className = 'shopping-tools';
    toolbar.innerHTML = `<button class="btn btn-outline" onclick="shareShoppingList()">Compartir lista</button><span>Marcá “Ya tengo” para excluir productos.</span>`;
    body.parentElement.insertBefore(toolbar, body);
  }
  const list = body.querySelector('.ingr-list');
  const rows = [...list.querySelectorAll('.ingr-item')];
  const groups = {};
  rows.forEach(row => {
    const name = row.querySelector('.ingr-name')?.textContent.trim() || '';
    const quantity = row.querySelector('.ingr-qty')?.textContent.trim() || '';
    const key = experienceKey(`${name}||${quantity.replace(/[0-9.,]/g, '').trim()}`);
    const category = shoppingCategory(name);
    row.dataset.itemKey = key;
    row.dataset.category = category;
    if (!row.querySelector('.pantry-button')) row.insertAdjacentHTML('beforeend', `<button class="pantry-button ${pantryItemKeys.has(key) ? 'on' : ''}" onclick="togglePantryItem(event,'${encodeURIComponent(key)}','${encodeURIComponent(name)}','${encodeURIComponent(category)}')">${pantryItemKeys.has(key) ? 'En casa' : 'Ya tengo'}</button>`);
    row.classList.toggle('pantry-owned', pantryItemKeys.has(key));
    (groups[category] ||= []).push(row);
  });
  list.innerHTML = '';
  Object.entries(groups).forEach(([category, categoryRows]) => {
    const section = document.createElement('section');
    section.className = 'shopping-category';
    section.innerHTML = `<h3>${category}<span>${categoryRows.filter(row => !row.classList.contains('pantry-owned')).length} por comprar</span></h3>`;
    categoryRows.forEach(row => section.appendChild(row));
    list.appendChild(section);
  });
}

async function togglePantryItem(event, encodedKey, encodedName, encodedCategory) {
  event.stopPropagation();
  const key = decodeURIComponent(encodedKey);
  if (pantryItemKeys.has(key)) {
    const { error } = await window.db.from('user_pantry_items').delete().eq('user_id', currentUser.id).eq('item_key', key);
    if (error) return toast(error.message);
    pantryItemKeys.delete(key);
  } else {
    const { error } = await window.db.from('user_pantry_items').upsert({ user_id: currentUser.id, item_key: key, name: decodeURIComponent(encodedName), category: decodeURIComponent(encodedCategory) });
    if (error) return toast(error.message);
    pantryItemKeys.add(key);
  }
  renderCompras();
}

function shareShoppingList() {
  const sections = [...document.querySelectorAll('.shopping-category')].map(section => {
    const items = [...section.querySelectorAll('.ingr-item:not(.pantry-owned)')].map(row => `☐ ${row.querySelector('.ingr-name')?.textContent.trim()} — ${row.querySelector('.ingr-qty')?.textContent.trim()}`);
    return items.length ? `*${section.querySelector('h3')?.childNodes[0].textContent.trim()}*\n${items.join('\n')}` : '';
  }).filter(Boolean);
  const text = `🛒 *Lista de compras Tali Cocina*\n\n${sections.join('\n\n')}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function computedNotifications() {
  const items = [];
  const chosen = Object.values(plan).filter(Boolean).length;
  if (chosen < 4) items.push({ id: 'menu', title: 'Completá tu semana', body: `Tenés ${chosen} comidas elegidas. Sumá algunas más para generar una compra completa.`, notification_type: 'planner' });
  const today = new Date(); const weekday = today.getDay() || 7;
  const validPromos = (promos || []).filter(promo => !promo.weekdays?.length || promo.weekdays.includes(weekday));
  if (validPromos.length) items.push({ id: 'promos', title: 'Beneficios disponibles hoy', body: `${validPromos.length} promociones coinciden con el día de hoy.`, notification_type: 'promotion' });
  if (patientRecommendations.length) items.push({ id: 'professional', title: 'Recetas de tu nutricionista', body: `Tenés ${patientRecommendations.length} recomendaciones personalizadas.`, notification_type: 'professional' });
  return items;
}

function enhanceWeekPlanner() {
  const body = document.getElementById('week-body');
  if (!body || document.getElementById('week-quick-tools')) return;
  const tools = document.createElement('div');
  tools.id = 'week-quick-tools';
  tools.className = 'week-quick-tools';
  tools.innerHTML = `<button class="btn btn-outline" onclick="copyPreviousWeek()">↻ Repetir semana anterior</button><button class="btn btn-outline" onclick="openPick('${selectedWeekDay || DAYS[0]}','Almuerzo')">🔎 Buscar por ingrediente</button>`;
  body.insertBefore(tools, body.firstChild);
}

async function copyPreviousWeek() {
  if (!currentUser) return;
  const currentStart = getWeekStart();
  const previousStart = new Date(currentStart); previousStart.setDate(previousStart.getDate() - 7);
  const previousEnd = new Date(previousStart); previousEnd.setDate(previousEnd.getDate() + 6);
  const { data, error } = await window.db.from('user_recipe_selections')
    .select('scheduled_date,meal_type,recipe_id,weekly_menu_recipes(recipe_id)')
    .eq('user_id', currentUser.id)
    .gte('scheduled_date', previousStart.toISOString().slice(0, 10))
    .lte('scheduled_date', previousEnd.toISOString().slice(0, 10))
    .neq('status', 'cancelled');
  if (error) return toast(error.message);
  if (!data?.length) return toast('La semana anterior no tiene comidas para copiar.');
  let copied = 0;
  for (const item of data) {
    const sourceDate = new Date(`${item.scheduled_date}T12:00:00`);
    const targetDate = new Date(sourceDate); targetDate.setDate(targetDate.getDate() + 7);
    const dayIndex = targetDate.getDay() || 7;
    const key = `${DAYS[dayIndex - 1]}|${item.meal_type === 'dinner' ? 'Cena' : 'Almuerzo'}`;
    const recipeId = item.recipe_id || item.weekly_menu_recipes?.recipe_id;
    if (!recipeId) continue;
    try { plan[key] = await saveRecipeSelection(key, recipeId); copied++; } catch (copyError) { console.warn(copyError); }
  }
  savePlan();
  renderWeek();
  updateNotificationBadge();
  toast(`${copied} comidas copiadas de la semana anterior`);
}

function openNotifications() {
  const panel = document.getElementById('experience-notifications');
  const items = [...computedNotifications(), ...userNotifications];
  panel.innerHTML = `<div class="notification-head"><strong>Notificaciones</strong><button onclick="closeExperiencePanel()">×</button></div>${items.map(item => `<article><span>${item.notification_type === 'promotion' ? '🏷️' : item.notification_type === 'professional' ? '🧑‍⚕️' : '🍽️'}</span><div><strong>${item.title}</strong><p>${item.body}</p></div></article>`).join('') || '<div class="empty-txt">No tenés novedades.</div>'}`;
  panel.classList.add('on');
}

function closeExperiencePanel() { document.getElementById('experience-notifications')?.classList.remove('on'); }
function updateNotificationBadge() {
  const count = computedNotifications().length + userNotifications.filter(item => !item.read_at).length;
  const badge = document.getElementById('experience-notification-count');
  if (badge) { badge.textContent = count; badge.style.display = count ? '' : 'none'; }
}

function showOnboarding() {
  document.getElementById('experience-onboarding')?.classList.add('on');
  setOnboardingStep(0);
}
function setOnboardingStep(index) {
  document.querySelectorAll('.onboarding-step').forEach((step, position) => step.classList.toggle('on', position === index));
  document.querySelectorAll('.onboarding-dot').forEach((dot, position) => dot.classList.toggle('on', position === index));
}
async function finishOnboarding() {
  document.getElementById('experience-onboarding')?.classList.remove('on');
  currentUser.onboarding_completed = true;
  localStorage.setItem('tc_user', JSON.stringify(currentUser));
  await window.db.from('users').update({ onboarding_completed: true }).eq('id', currentUser.id);
}

function renderExperienceProfile() {
  const page = document.querySelector('#screen-perfil .page');
  if (!page) return;
  let section = document.getElementById('experience-profile-summary');
  if (!section) {
    section = document.createElement('div');
    section.id = 'experience-profile-summary';
    section.className = 'card experience-profile-summary';
    const saveButton = page.querySelector('button[onclick="saveProfile()"]');
    page.insertBefore(section, saveButton);
  }
  const favorites = (allRecipes.length ? allRecipes : recipes).filter(item => favoriteRecipeIds.has(item.id));
  const recent = recipeFeedback.slice(0, 3);
  section.innerHTML = `<div class="experience-profile-head"><strong>Mi actividad</strong><button class="btn btn-outline" onclick="showOnboarding()">Ver guía</button></div>
    <div class="experience-profile-grid"><div><span>Favoritas</span><strong>${favorites.length}</strong></div><div><span>Respuestas</span><strong>${recipeFeedback.length}</strong></div><div><span>Recomendadas</span><strong>${patientRecommendations.length}</strong></div></div>
    ${favorites.length ? `<div class="mini-recipe-list">${favorites.slice(0, 4).map(item => `<button onclick="openDetail('${item.id}')">♥ ${item.name}</button>`).join('')}</div>` : '<p class="form-hint">Guardá recetas para encontrarlas rápidamente.</p>'}
    ${recent.length ? `<div class="recent-feedback">${recent.map(item => `<span>${({ liked:'😍', disliked:'😕', not_prepared:'⏳', prepared:'✓' })[item.outcome] || '✓'} ${(allRecipes.find(recipe => recipe.id === item.recipe_id) || {}).name || 'Receta'}</span>`).join('')}</div>` : ''}`;
}

function renderSmartPromos() {
  promos = JSON.parse(localStorage.getItem('tc_promos') || '[]');
  const preferredBank = document.getElementById('pf-banco')?.value || '';
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekday = today.getDay() || 7;
  const filtered = (bankFilter ? promos.filter(promo => promo.banco === bankFilter) : promos)
    .filter(promo => (!promo.validFrom || promo.validFrom <= todayIso) && (!promo.validTo || promo.validTo >= todayIso))
    .sort((left, right) => {
      const score = promo => (promo.banco === preferredBank ? 4 : 0) + (!promo.weekdays?.length || promo.weekdays.includes(weekday) ? 2 : 0);
      return score(right) - score(left) || Number(right.disc || 0) - Number(left.disc || 0);
    });
  const body = document.getElementById('promos-body');
  if (!body) return;
  if (!filtered.length) {
    body.innerHTML = '<div class="empty"><div class="empty-icon">🏦</div><div class="empty-txt">No hay promociones vigentes para este filtro.</div></div>';
    return;
  }
  const groups = {};
  filtered.forEach(promo => (groups[promo.super] ||= []).push(promo));
  body.innerHTML = Object.entries(groups).map(([store, items]) => `<div class="super-card">
    <div class="super-head"><div class="store-logo">${store.slice(0, 2).toUpperCase()}</div><div class="store-nm">${store}</div></div>
    ${items.map(promo => `<div class="promo-item ${promo.banco === preferredBank ? 'preferred-promo' : ''}">
      <div class="promo-bank">${promo.banco}</div>
      <div style="flex:1"><div class="promo-txt">${promo.desc}</div><div class="promo-days">${promo.dias || 'Todos los días'}${promo.vigencia ? ` · ${promo.vigencia}` : ''}</div><button class="promo-report" onclick="reportPromotion('${promo.id}')">Reportar información incorrecta</button></div>
      <div>${promo.banco === preferredBank ? '<div class="promo-match">Tu banco</div>' : ''}${promo.disc ? `<div class="promo-disc">-${promo.disc}%</div>` : ''}</div>
    </div>`).join('')}
  </div>`).join('');
}

async function reportPromotion(promotionId) {
  const { error } = await window.db.from('promotion_reports').insert({ promotion_id: promotionId, user_id: currentUser?.id, reason: 'incorrect', comment: 'Reportada desde la aplicación' });
  toast(error ? error.message : 'Gracias. La promoción quedó marcada para revisión.');
}

function buildExperienceUI() {
  if (document.getElementById('experience-notifications')) { renderExperienceProfile(); return; }
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="experience-notifications" id="experience-notifications"></aside>
    <div class="modal-overlay experience-onboarding" id="experience-onboarding">
      <div class="modal-sheet onboarding-card">
        <div class="onboarding-step on"><div class="onboarding-icon">📅</div><h2>Armá tu semana</h2><p>Elegí almuerzo y cena. Tali calcula automáticamente ingredientes y cantidades.</p><button class="btn btn-primary btn-full" onclick="setOnboardingStep(1)">Siguiente</button></div>
        <div class="onboarding-step"><div class="onboarding-icon">🛡️</div><h2>Recetas seguras</h2><p>Usamos tus alergias y preferencias para destacar las opciones compatibles.</p><button class="btn btn-primary btn-full" onclick="setOnboardingStep(2)">Siguiente</button></div>
        <div class="onboarding-step"><div class="onboarding-icon">🛒</div><h2>Comprá sin repetir</h2><p>La lista agrupa productos por rubro y te permite marcar lo que ya tenés.</p><button class="btn btn-primary btn-full" onclick="setOnboardingStep(3)">Siguiente</button></div>
        <div class="onboarding-step"><div class="onboarding-icon">🧑‍⚕️</div><h2>Acompañamiento</h2><p>Vas a ver las recetas personalizadas y podrás contarle a tu nutricionista cómo te fue.</p><button class="btn btn-primary btn-full" onclick="finishOnboarding()">Empezar</button></div>
        <div class="onboarding-dots">${[0,1,2,3].map(index => `<button class="onboarding-dot" onclick="setOnboardingStep(${index})" aria-label="Paso ${index + 1}"></button>`).join('')}</div>
      </div>
    </div>`);
  const nav = document.querySelector('.nav-user');
  nav?.insertAdjacentHTML('afterbegin', `<button class="notification-button" onclick="openNotifications()" aria-label="Notificaciones">🔔<span id="experience-notification-count"></span></button>`);
  renderExperienceProfile();
  if (currentUser && !currentUser.onboarding_completed) window.setTimeout(showOnboarding, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const originalOpenPick = window.openPick;
  window.openPick = function (...args) { originalOpenPick(...args); window.setTimeout(enhanceRecipePicker, 0); };
  const originalOpenDetail = window.openDetail;
  window.openDetail = function (recipeId) { originalOpenDetail(recipeId); decorateRecipeDetail(recipeId); };
  const originalRenderCompras = window.renderCompras;
  window.renderCompras = function (...args) { originalRenderCompras(...args); enhanceShoppingList(); };
  const originalRenderPerfil = window.renderPerfil;
  window.renderPerfil = function (...args) { originalRenderPerfil(...args); renderExperienceProfile(); };
  const originalRenderWeek = window.renderWeek;
  window.renderWeek = function (...args) { originalRenderWeek(...args); enhanceWeekPlanner(); updateNotificationBadge(); };
  window.renderPromos = renderSmartPromos;
});
