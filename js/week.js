// ── SEMANA ────────────────────────────────
function updateWeekDateLabel(){
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - now.getDay() + 1);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toLocaleDateString('es-AR', { day:'numeric', month:'long' });
  document.getElementById('week-date-label').textContent = `Semana del ${fmt(mon)} al ${fmt(sun)}`;
}

function renderWeek(){
  // Leer frescos desde localStorage
  loadUserScopedState();
  recipes = JSON.parse(localStorage.getItem('tc_recipes') || '[]');

  let totalCal = 0, count = 0;
  const body = document.getElementById('week-body');
  body.innerHTML = DAYS.map(day => {
    let dayCal = 0;
    const rows = MEALS.map(mt => {
      const key = `${day}|${mt}`;
      const r   = plan[key] ? recipes.find(x => x.id === recipeIdForPlanValue(plan[key])) : null;
      if(r){ dayCal += r.cals||0; totalCal += r.cals||0; count++; }
      let content;
      if(r){
        const ytOk = r.ytId && r.ytId.length === 11;
        const img  = ytOk
          ? `<img class="meal-thumb" src="https://img.youtube.com/vi/${r.ytId}/mqdefault.jpg" loading="lazy" onerror="this.outerHTML='<div class=\\'meal-ph\\'>🍽</div>'">`
          : `<div class="meal-ph">🍽</div>`;
        content = `${img}<div class="meal-info">
          <div class="meal-name">${r.name}</div>
          ${showCals && r.cals ? `<div class="meal-kcal-txt">${r.cals} kcal</div>` : ''}
        </div>`;
      } else {
        content = `<div class="meal-empty">Tap para elegir</div>`;
      }
      const actions = r
        ? `<div class="meal-actions">
             <div class="meal-btn meal-btn-eye" onclick="event.stopPropagation();openDetail('${r.id}')">👁</div>
             <div class="meal-btn meal-btn-del" onclick="event.stopPropagation();delMeal('${key}')">✕</div>
           </div>`
        : `<div class="meal-btn meal-btn-add" onclick="event.stopPropagation();openPick('${day}','${mt}')">+</div>`;
      return `<div class="meal-row" onclick="openPick('${day}','${mt}')">
        <div class="meal-type">${mt}</div>
        ${content}
        ${actions}
      </div>`;
    }).join('');
    // cambiar color dia
    const today = new Date().toLocaleDateString('es-AR', { weekday:'long' });
    const dayLower = day.toLowerCase();
    const isToday = dayLower === today;

    return `<div class="day-block ${isToday ? 'today' : ''}">
      <div class="day-head">
        <div class="day-name">
          ${day}
          ${isToday ? '<span class="today-label">HOY</span>' : ''}
        </div>
        ${showCals && dayCal ? `<div class="day-kcal">${dayCal} kcal</div>` : ''}
      </div>
      ${rows}
    </div>`;
  }).join('');

  document.getElementById('stat-count').textContent    = count;
  document.getElementById('stat-cals').textContent     = totalCal.toLocaleString('es-AR');
  document.getElementById('stat-cals-pill').style.display = showCals ? '' : 'none';
}

function toggleCals(on){ showCals = on; renderWeek(); }

let mealReminderTimer = null;
function selectWeekDay(day) { selectedWeekDay = day; renderWeek(); }
async function selectPlannerDate(value) { plannerAnchorDate = value || null; selectedWeekDay = null; await loadUserSelections(); renderWeek(); }
function mealTypeInfo(meal) { return meal === 'Cena' ? { icon: '🌙', time: '20:30', action: 'Cambiar cena' } : { icon: '☀️', time: '11:30', action: 'Cambiar almuerzo' }; }

async function delMeal(key){
  try {
    await cancelRecipeSelection(key);
    delete plan[key]; savePlan(); renderWeek();
  } catch(error) { console.error(error); toast(error.message || 'No se pudo eliminar la selección'); }
}

// ── ELEGIR RECETA ─────────────────────────
function openPick(day, meal){
  editKey = `${day}|${meal}`;
  document.getElementById('mo-pick-title').textContent = `${day} · ${meal}`;
  const grid = document.getElementById('mo-pick-grid');

  if(!recipes.length){
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📝</div>
        <div class="empty-txt">
          Sin recetas aún.<br>
          El admin no cargó recetas todavía.
        </div>
      </div>`;
  } else {

    // ¿Permitir repetir comidas?
    const permitirRepetidas = currentUser?.repetir_comidas ?? true;

    // Si no se permiten repetidas, ocultar las que ya están usadas
    const recetasDisponibles = permitirRepetidas
      ? recipes
      : recipes.filter(r => {
          // Mantener visible la receta que ya está en esta casilla
          if(recipeIdForPlanValue(plan[editKey]) === r.id) return true;

          // Ocultar recetas ya usadas en otra comida
          return !Object.values(plan).map(recipeIdForPlanValue).includes(r.id);
        });

    if(!recetasDisponibles.length){
      grid.innerHTML = `
        <div class="empty">
          <div class="empty-icon">🍽️</div>
          <div class="empty-txt">
            No quedan recetas disponibles.<br>
            Activá "Permitir repetir comidas" o agregá más recetas.
          </div>
        </div>`;
    } else {

      grid.innerHTML = recetasDisponibles.map(r => {
        const ytOk = r.ytId && r.ytId.length === 11;
        const img = ytOk
          ? `<img class="pick-thumb" src="https://img.youtube.com/vi/${r.ytId}/mqdefault.jpg" loading="lazy" onerror="this.outerHTML='<div class=\\'pick-ph\\'>🍽</div>'">`
          : `<div class="pick-ph">🍽</div>`;

        return `
          <div class="pick-card${recipeIdForPlanValue(plan[editKey]) === r.id ? ' on' : ''}" onclick="pickR('${r.id}')">
            ${img}
            <div class="pick-name">${r.name}</div>
            ${r.cals ? `<div class="pick-kcal">${r.cals} kcal</div>` : ''}
            <button class="pick-preview" onclick="event.stopPropagation();openDetail('${r.id}')">Ver ingredientes y pasos</button>
          </div>
        `;
      }).join('');
    }
  }

  openMo('mo-pick');
}

async function pickR(id){

  const permitirRepetidas = currentUser?.repetir_comidas ?? true;

  if(!permitirRepetidas){

    const yaUsada = Object.entries(plan).some(([key, receta]) =>
      key !== editKey && recipeIdForPlanValue(receta) === id
    );

    if(yaUsada){
      toast('Esa comida ya fue elegida esta semana');
      return;
    }
  }

  try {
    plan[editKey] = await saveRecipeSelection(editKey, id);
    savePlan(); closeMo('mo-pick'); renderWeek(); toast('Receta agregada ✓');
  } catch(error) { console.error(error); toast(error.message || 'No se pudo guardar la selección'); }
}

// ── DETALLE RECETA ────────────────────────
function openDetail(rid){
  const r = recipes.find(x => x.id === rid);
  if(!r) return;
  const pers    = parseInt(currentUser?.personas || 2);
  const factor  = pers / parseInt(r.porciones || 2);
  const ytOk    = r.ytId && r.ytId.length === 11;
  const hero    = ytOk
    ? `<img class="detail-img" src="https://img.youtube.com/vi/${r.ytId}/hqdefault.jpg" onerror="this.outerHTML='<div class=\\'detail-ph\\'>🍳</div>'">`
    : `<div class="detail-ph">🍳</div>`;
  const ytBtn   = ytOk ? `<a class="yt-btn" href="${r.ytUrl}" target="_blank">▶ Ver en YouTube</a>` : '';
  const ingrs   = (r.ingredientes||[]).map(i => {
    let q = (parseFloat(i.c)||0) * factor;
    let d = q % 1 === 0 ? q.toFixed(0) : (q < 10 ? q.toFixed(1) : Math.round(q).toString());
    return `<div class="ingr-item" style="padding:.4rem 0">
      <div class="ingr-chk"></div>
      <div class="ingr-name">${i.n}</div>
      <div class="ingr-qty">${d} ${i.u}</div>
    </div>`;
  }).join('');
  const steps   = (r.pasos||[]).map((p,i) =>
    `<div class="step-item"><div class="step-num">${i+1}</div><div class="step-txt">${p}</div></div>`
  ).join('');
  document.getElementById('mo-detail-body').innerHTML = `
    ${hero}
    <div class="modal-title">${r.name}</div>
    ${ytBtn}
    ${r.cals ? `<p style="font-size:13px;color:var(--ink3);margin-bottom:1rem">🔥 ${r.cals} kcal por porción · rinde ${r.porciones||2} porciones</p>` : ''}
    ${ingrs ? `<div style="font-size:12px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .4rem">Ingredientes (para ${pers} persona${pers!==1?'s':''})</div>${ingrs}` : ''}
    ${steps ? `<div style="font-size:12px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .75rem">Preparación</div>${steps}` : ''}
  `;
  openMo('mo-detail');
}



// Guardar recetas
function renderWeek() {
  loadUserScopedState();
  recipes = JSON.parse(localStorage.getItem('tc_recipes') || '[]');
  const todayIndex = new Date().getDay() || 7;
  if (!selectedWeekDay) selectedWeekDay = DAYS[todayIndex - 1];
  const date = getWeekStart();
  const dayIndex = DAYS.indexOf(selectedWeekDay);
  date.setDate(date.getDate() + dayIndex);
  const dateLabel = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const tabs = DAYS.map((day, index) => { const itemDate = getWeekStart(); itemDate.setDate(itemDate.getDate() + index); return `<button class="week-day-tab ${day === selectedWeekDay ? 'selected' : ''}" onclick="selectWeekDay('${day}')"><span>${day.slice(0, 3)}</span><strong>${itemDate.getDate()}</strong></button>`; }).join('');
  const cards = MEALS.map(meal => {
    const key = `${selectedWeekDay}|${meal}`; const recipe = plan[key] ? recipes.find(item => item.id === recipeIdForPlanValue(plan[key])) : null; const type = mealTypeInfo(meal);
    const image = recipe?.ytId ? `<img class="meal-feature-image" src="https://img.youtube.com/vi/${recipe.ytId}/hqdefault.jpg" alt="${recipe.name}" loading="lazy">` : '<div class="meal-feature-placeholder">🍽</div>';
    const text = recipe ? `${recipe.ingredientes?.length || 0} ingredientes para tu menú` : 'Elegí una receta para este momento del día';
    return `<section class="meal-feature-card ${recipe ? '' : 'empty'}"><div class="meal-feature-label"><span>${type.icon} ${meal}</span><time>${type.time}</time></div>${image}<div class="meal-feature-body"><div class="meal-feature-title">${recipe?.name || `Todavía no elegiste ${meal.toLowerCase()}`}</div><div class="meal-feature-description">${text}</div><button class="meal-feature-action" onclick="openPick('${selectedWeekDay}','${meal}')">${recipe ? type.action : `Elegir ${meal.toLowerCase()}`}</button></div></section>`;
  }).join('');
  document.getElementById('week-body').innerHTML = `<div class="planner-date-row"><label for="planner-date">Elegí la semana</label><input id="planner-date" type="date" value="${plannerAnchorDate || new Date().toISOString().slice(0, 10)}" onchange="selectPlannerDate(this.value)"></div><div class="week-day-selector">${tabs}</div><div class="week-mobile-date">${dateLabel}</div><div class="meal-feature-list">${cards}</div><button class="meal-reminder-button" onclick="enableMealReminders()">🔔 Activar recordatorios: 11:30 y 20:30</button><div class="tali-suggestion">✨ <span><strong>Sugerencia de Tali</strong><br>Elegí tus dos comidas para tener tu día organizado.</span></div>`;
  document.getElementById('stat-count').textContent = MEALS.filter(meal => plan[`${selectedWeekDay}|${meal}`]).length;
  document.getElementById('stat-cals-pill').style.display = 'none';
  scheduleMealReminders();
}

async function enableMealReminders() {
  if (!('Notification' in window)) return toast('Tu navegador no admite notificaciones.');
  const permission = await Notification.requestPermission();
  if (permission === 'granted') { scheduleMealReminders(); toast('Recordatorios activados'); } else toast('Necesitamos permiso para recordarte las comidas.');
}

function scheduleMealReminders() {
  if (mealReminderTimer) clearTimeout(mealReminderTimer);
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const upcoming = [{ meal: 'Almuerzo', hour: 11, minute: 30 }, { meal: 'Cena', hour: 20, minute: 30 }].map(item => { const time = new Date(); time.setHours(item.hour, item.minute, 0, 0); if (time <= now) time.setDate(time.getDate() + 1); return { ...item, time }; }).sort((a, b) => a.time - b.time)[0];
  mealReminderTimer = setTimeout(() => { new Notification(`Tali Cocina · ${upcoming.meal}`, { body: `Es hora de ${upcoming.meal.toLowerCase()}. Mirá tu comida elegida.` }); scheduleMealReminders(); }, upcoming.time - now);
}

async function comidaguardada() {
  toast('Comida Guardada ✓')
  
}
