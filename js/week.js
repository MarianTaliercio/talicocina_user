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
      const r   = plan[key] ? recipes.find(x => x.id === plan[key]) : null;
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

function delMeal(key){
  delete plan[key];
  savePlan();
  renderWeek();
}

// ── ELEGIR RECETA ─────────────────────────
function openPick(day, meal){
  editKey = `${day}|${meal}`;
  document.getElementById('mo-pick-title').textContent = `${day} · ${meal}`;
  const grid = document.getElementById('mo-pick-grid');
  if(!recipes.length){
    grid.innerHTML = `<div class="empty"><div class="empty-icon">📝</div><div class="empty-txt">Sin recetas aún.<br>El admin no cargó recetas todavía.</div></div>`;
  } else {
    grid.innerHTML = recipes.map(r => {
      const ytOk = r.ytId && r.ytId.length === 11;
      const img  = ytOk
        ? `<img class="pick-thumb" src="https://img.youtube.com/vi/${r.ytId}/mqdefault.jpg" loading="lazy" onerror="this.outerHTML='<div class=\\'pick-ph\\'>🍽</div>'">`
        : `<div class="pick-ph">🍽</div>`;
      return `<div class="pick-card${plan[editKey] === r.id ? ' on' : ''}" onclick="pickR('${r.id}')">
        ${img}
        <div class="pick-name">${r.name}</div>
        ${r.cals ? `<div class="pick-kcal">${r.cals} kcal</div>` : ''}
      </div>`;
    }).join('');
  }
  openMo('mo-pick');
}

function pickR(id){
  plan[editKey] = id;
  savePlan();
  closeMo('mo-pick');
  renderWeek();
  toast('Receta agregada ✓');
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
async function comidaguardada() {
  toast('Comida Guardada ✓')
  
}