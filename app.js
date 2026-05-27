/* ══════════════════════════════════════
   TALI COCINA — APP.JS
   Lógica del lado usuario
══════════════════════════════════════ */

// ── CONSTANTES ──────────────────────────
const DAYS  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MEALS = ['Almuerzo','Cena'];
const STORES = {
  coto:        { name:'COTO',        color:'#e31e24' },
  toledo:      { name:'Toledo',      color:'#1a5ca8' },
  disco:       { name:'Disco',       color:'#e65100' },
  vital:       { name:'Vital',       color:'#2e7d2e' },
  changomas:   { name:'Changomás',   color:'#6a1b9a' },
  'la-anonima':{ name:'La Anónima',  color:'#c8960c' },
  carrefour:   { name:'Carrefour',   color:'#004a97' },
  dia:         { name:'Día%',        color:'#cc0000' },
};

// ── ESTADO ──────────────────────────────
let recipes     = JSON.parse(localStorage.getItem('tc_recipes') || 'null');
let promos      = JSON.parse(localStorage.getItem('tc_promos')  || 'null');
let plan        = JSON.parse(localStorage.getItem('tc_plan')    || '{}');
let checked     = JSON.parse(localStorage.getItem('tc_chk')     || '{}');
let currentUser = JSON.parse(localStorage.getItem('tc_user')    || 'null');
let showCals    = false;
let selectedPlan= 'mensual';
let editKey     = null;
let bankFilter  = '';

// Inicializar demo data si no existe
if(!recipes) initDemoRecipes();
if(!promos)  initDemoPromos();

// ── DEMO DATA ────────────────────────────
function initDemoRecipes(){
  recipes = [
    { id:'r1', name:'Milanesas napolitanas', ytUrl:'', ytId:'', cals:540, porciones:2,
      ingredientes:[
        {n:'Carne milanesa',c:'500',u:'g'},{n:'Huevos',c:'2',u:'unidades'},
        {n:'Pan rallado',c:'100',u:'g'},{n:'Tomate',c:'2',u:'unidades'},
        {n:'Mozzarella',c:'200',u:'g'},{n:'Jamón cocido',c:'100',u:'g'}
      ],
      pasos:['Batir los huevos en un plato hondo.','Pasar la carne por huevo y pan rallado.','Freír en aceite caliente hasta dorar.','Colocar toppings y gratinar a 200°C por 10 min.']
    },
    { id:'r2', name:'Fideos al tuco casero', ytUrl:'', ytId:'', cals:480, porciones:4,
      ingredientes:[
        {n:'Fideos',c:'400',u:'g'},{n:'Carne picada',c:'300',u:'g'},
        {n:'Tomate triturado',c:'400',u:'g'},{n:'Cebolla',c:'1',u:'unidades'},{n:'Ajo',c:'2',u:'dientes'}
      ],
      pasos:['Rehogar cebolla y ajo en aceite.','Agregar carne picada y cocinar 5 min.','Incorporar tomate y cocinar 20 min a fuego bajo.','Servir con fideos cocidos al dente.']
    },
    { id:'r3', name:'Pollo al limón y romero', ytUrl:'', ytId:'', cals:380, porciones:2,
      ingredientes:[
        {n:'Pollo (muslos)',c:'600',u:'g'},{n:'Limón',c:'1',u:'unidades'},
        {n:'Ajo',c:'3',u:'dientes'},{n:'Papa',c:'4',u:'unidades'}
      ],
      pasos:['Marinar pollo con limón, ajo y romero 30 min.','Colocar en asadera con papas.','Hornear a 200°C por 45 min.']
    },
    { id:'r4', name:'Revuelto gramajo', ytUrl:'', ytId:'', cals:360, porciones:2,
      ingredientes:[
        {n:'Huevos',c:'4',u:'unidades'},{n:'Papas fritas finas',c:'200',u:'g'},{n:'Jamón cocido',c:'150',u:'g'}
      ],
      pasos:['Freír papas en tiritas, reservar.','Saltear jamón en tiras.','Agregar huevos batidos y revolver.','Incorporar papas al final.']
    },
    { id:'r5', name:'Sopa de verduras', ytUrl:'', ytId:'', cals:180, porciones:4,
      ingredientes:[
        {n:'Zanahoria',c:'2',u:'unidades'},{n:'Papa',c:'3',u:'unidades'},
        {n:'Caldo de verdura',c:'1',u:'litro'},{n:'Apio',c:'2',u:'ramas'}
      ],
      pasos:['Cortar todas las verduras en cubos.','Llevar a hervor con el caldo.','Cocinar 25 minutos hasta tiernizar.','Salpimentar y servir.']
    },
    { id:'r6', name:'Ensalada César', ytUrl:'', ytId:'', cals:280, porciones:2,
      ingredientes:[
        {n:'Lechuga',c:'1',u:'unidades'},{n:'Pollo cocido',c:'200',u:'g'},
        {n:'Pan tostado',c:'2',u:'rebanadas'},{n:'Parmesano',c:'50',u:'g'}
      ],
      pasos:['Lavar y cortar la lechuga.','Agregar pollo desmenuzado.','Incorporar crutones y parmesano.','Aliñar con aderezo césar.']
    },
  ];
  localStorage.setItem('tc_recipes', JSON.stringify(recipes));
}

function initDemoPromos(){
  promos = [
    {id:'p1',super:'coto',      banco:'Banco Nación',   desc:'25% OFF con débito',              disc:25, dias:'Martes',         vigencia:'Hasta 31/05'},
    {id:'p2',super:'coto',      banco:'BBVA',           desc:'15% de reintegro tope $2.000',    disc:15, dias:'Todos los días',  vigencia:'Hasta 30/05'},
    {id:'p3',super:'toledo',    banco:'Santander',      desc:'30% OFF en el total de la compra',disc:30, dias:'Jueves',         vigencia:'Hasta 15/06'},
    {id:'p4',super:'toledo',    banco:'Galicia',        desc:'20% OFF en almacén y carnes',     disc:20, dias:'Miércoles',      vigencia:'Hasta 31/05'},
    {id:'p5',super:'disco',     banco:'HSBC',           desc:'20% de descuento 2do turno',      disc:20, dias:'Lun a Vie',      vigencia:'Hasta 31/05'},
    {id:'p6',super:'vital',     banco:'Banco Provincia',desc:'25% OFF con débito todos los días',disc:25,dias:'Todos los días', vigencia:'Hasta 30/06'},
    {id:'p7',super:'changomas', banco:'Mercado Pago',   desc:'10% de cashback sin tope',        disc:10, dias:'Todos los días', vigencia:'Hasta 30/05'},
    {id:'p8',super:'la-anonima',banco:'Macro',          desc:'20% OFF con crédito los viernes', disc:20, dias:'Viernes',       vigencia:'Hasta 30/05'},
    {id:'p9',super:'carrefour', banco:'MODO',           desc:'15% OFF pagando con MODO',        disc:15, dias:'Todos los días', vigencia:'Hasta 31/05'},
  ];
  localStorage.setItem('tc_promos', JSON.stringify(promos));
}

// ── AUTH ─────────────────────────────────
function doLogin(){
  const btn   = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if(!email || !pass){ showErr('login-error','Completá todos los campos.'); return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  setTimeout(() => {
    currentUser = { name:'María', apellido:'García', email, plan:'mensual', wapp:'+54 9 223 444-5678', city:'Mar del Plata', personas:2, banco:'Santander' };
    localStorage.setItem('tc_user', JSON.stringify(currentUser));
    loadProfileIntoForm();
    enterApp();
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }, 900);
}

function doLogout(){
  if(!confirm('¿Cerrar sesión?')) return;
  // Limpiar estado
  currentUser = null;
  plan        = {};
  checked     = {};
  localStorage.removeItem('tc_user');
  localStorage.removeItem('tc_plan');
  localStorage.removeItem('tc_chk');
  // Ocultar nav
  document.getElementById('topnav').style.display    = 'none';
  document.getElementById('bottom-nav').style.display= 'none';
  // Resetear nav links
  document.querySelectorAll('.nav-link').forEach(l  => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('on'));
  // Resetear formulario login
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  // Ir a login
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.getElementById('screen-login').classList.add('on');
  toast('Sesión cerrada');
}

function showErr(id, msg){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── REGISTRO ─────────────────────────────
function regStep(n){
  [1,2,3].forEach(i => {
    document.getElementById('reg-step-'+i).style.display = i === n ? 'block' : 'none';
  });
  const dots = document.querySelectorAll('#reg-steps .step-dot');
  dots.forEach((d,i) => {
    d.classList.remove('on','done');
    if(i < n-1) d.classList.add('done');
    else if(i === n-1) d.classList.add('on');
  });
}

function selectPlan(p){
  selectedPlan = p;
  document.getElementById('plan-mensual').classList.toggle('selected', p === 'mensual');
  document.getElementById('plan-anual').classList.toggle('selected',   p === 'anual');
}

// ── TARJETA DE CRÉDITO ────────────────────
function formatCC(el){
  let v = el.value.replace(/\D/g,'').slice(0,16);
  el.value = v.replace(/(.{4})/g,'$1 ').trim();
  const display = v.padEnd(16,'•').replace(/(.{4})/g,'$1 ').trim();
  document.getElementById('cc-display').textContent = display;
  const b = v.startsWith('4')?'🔵 VISA': v.startsWith('5')?'🔴 MC': v.startsWith('3')?'🟢 AMEX':'💳';
  document.getElementById('cc-brand').textContent = b;
}
function formatExp(el){
  let v = el.value.replace(/\D/g,'');
  if(v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
  el.value = v;
  document.getElementById('cc-exp-display').textContent = v || 'MM/AA';
}

function doPayment(){
  const num  = document.getElementById('cc-number').value.replace(/\s/g,'');
  const name = document.getElementById('cc-name').value.trim();
  const exp  = document.getElementById('cc-exp').value;
  const cvv  = document.getElementById('cc-cvv').value;
  if(num.length < 16 || !name || exp.length < 5 || cvv.length < 3){
    toast('Completá todos los datos de la tarjeta'); return;
  }
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  document.getElementById('pay-btn-txt').innerHTML = '<span class="spinner"></span> Procesando…';
  setTimeout(() => {
    btn.disabled = false;
    document.getElementById('pay-btn-txt').textContent = 'Confirmar suscripción';
    const regName  = document.getElementById('reg-name').value    || 'Usuario';
    const regEmail = document.getElementById('reg-email').value   || 'usuario@demo.com';
    const regWapp  = document.getElementById('reg-wapp').value    || '+54 9 223 000-0000';
    const regCity  = document.getElementById('reg-city').value    || 'Mar del Plata';
    currentUser = { name:regName, apellido:document.getElementById('reg-apellido').value||'', email:regEmail, plan:selectedPlan, wapp:regWapp, city:regCity, personas:2, banco:'' };
    localStorage.setItem('tc_user', JSON.stringify(currentUser));
    loadProfileIntoForm();
    // Mostrar WA preview en modal de éxito
    const msg = buildWAMessage(currentUser.name);
    document.getElementById('wa-preview-success').innerHTML = buildWAPreview(msg);
    openMo('mo-payment-success');
  }, 2000);
}

// ── APP INIT ──────────────────────────────
function enterApp(){
  if(!currentUser) return;
  const isMobile = window.innerWidth <= 600;
  document.getElementById('topnav').style.display     = isMobile ? 'none'  : 'block';
  document.getElementById('bottom-nav').style.display = isMobile ? 'flex'  : 'none';
  document.getElementById('nav-avatar').textContent   = (currentUser.name||'U').slice(0,2).toUpperCase();
  document.getElementById('nav-plan-badge').textContent = (currentUser.plan === 'anual') ? 'Anual' : 'Mensual';
  updateWeekDateLabel();
  renderWeek();
  renderBankFilter();
  document.getElementById('promo-city-lbl').textContent = `Supermercados en ${currentUser.city||'tu ciudad'} · Esta semana`;
  showScreen('semana');
  // Escuchar resize para cambiar nav
  window.addEventListener('resize', () => {
    const m = window.innerWidth <= 600;
    document.getElementById('topnav').style.display     = m ? 'none'  : 'block';
    document.getElementById('bottom-nav').style.display = m ? 'flex'  : 'none';
  }, { passive:true });
}

function setBottomNav(activeId){
  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('on'));
  document.getElementById(activeId)?.classList.add('on');
}

// ── NAVEGACIÓN ────────────────────────────
function showScreen(name, tabEl){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('on');
  if(tabEl) tabEl.classList.add('active');
  // Sincronizar topnav
  const tabMap = { semana:0, compras:1, promos:2, perfil:3 };
  const links  = document.querySelectorAll('.nav-link');
  if(tabMap[name] !== undefined) links[tabMap[name]]?.classList.add('active');
  // Renderizar según sección
  if(name === 'compras') renderCompras();
  if(name === 'promos')  { renderBankFilter(); renderPromos(); }
  if(name === 'perfil')  renderPerfil();
  if(name === 'semana')  renderWeek();
}

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
  plan    = JSON.parse(localStorage.getItem('tc_plan')    || '{}');
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
    return `<div class="day-block">
      <div class="day-head">
        <div class="day-name">${day}</div>
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
  localStorage.setItem('tc_plan', JSON.stringify(plan));
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
  localStorage.setItem('tc_plan', JSON.stringify(plan));
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

// ── COMPRAS ───────────────────────────────
function renderCompras(){
  plan    = JSON.parse(localStorage.getItem('tc_plan')    || '{}');
  recipes = JSON.parse(localStorage.getItem('tc_recipes') || '[]');

  var pers = parseInt((currentUser && currentUser.personas) || 2);
  var all  = {};
  var included = [];

  Object.values(plan).forEach(function(rid){
    var r = recipes.find(function(x){ return x.id === rid; });
    if(!r) return;
    if(!included.find(function(x){ return x.id === r.id; })) included.push(r);
    if(!r.ingredientes || !r.ingredientes.length) return;
    var porciones = Math.max(1, parseInt(r.porciones) || 2);
    var factor    = pers / porciones;
    r.ingredientes.forEach(function(i){
      var nombre   = ((i.n || i.nombre   || '')).toString().trim();
      var cantidad = (i.c  || i.cantidad || '0').toString();
      var unidad   = ((i.u || i.unidad   || '')).toString().trim();
      if(!nombre) return;
      var k = nombre.toLowerCase() + '||' + unidad.toLowerCase();
      if(!all[k]) all[k] = { n: nombre, u: unidad, total: 0 };
      all[k].total += (parseFloat(cantidad) || 0) * factor;
    });
  });

  var items = Object.values(all).sort(function(a,b){ return a.n.localeCompare(b.n); });

  document.getElementById('buy-count').textContent   = items.length;
  document.getElementById('buy-sub-txt').textContent = items.length
    ? ('Para ' + pers + ' persona' + (pers!==1?'s':'') + ' \u00b7 ' + items.length + ' ingrediente' + (items.length!==1?'s':''))
    : 'Eleg\u00ed recetas para ver la lista';

  var body = document.getElementById('buy-body');
  if(!body) return;

  if(!items.length){
    body.innerHTML = '<div class="empty"><div class="empty-icon">\uD83D\uDED2</div><div class="empty-txt">Eleg\u00ed recetas en el men\u00fa semanal<br>para ver qu\u00e9 necesit\u00e1s comprar.</div></div>';
    return;
  }

  var summaryHTML = '';
  if(included.length){
    var tags = included.map(function(r){
      return '<span style="background:var(--white);border:1px solid var(--g4);border-radius:14px;padding:3px 10px;font-size:12px;color:var(--g2);font-weight:500">' + r.name + '</span>';
    }).join('');
    summaryHTML = '<div style="background:var(--g6);border-radius:var(--rs);padding:.75rem 1rem;margin-bottom:1rem;border:1px solid var(--g5)">'
      + '<div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.4rem">Recetas incluidas</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px">' + tags + '</div>'
      + '</div>';
  }

  var rowsHTML = items.map(function(i){
    var k    = i.n.toLowerCase() + '||' + i.u.toLowerCase();
    var done = checked[k] || false;
    var q    = i.total;
    var d    = q===0 ? '-' : q%1===0 ? q.toFixed(0) : q<10 ? q.toFixed(1) : Math.round(q).toString();
    var rowId = 'ingr_' + k.replace(/[^a-z0-9]/g,'_');
    var safeK = k.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<div class="ingr-item" id="' + rowId + '">'
      + '<div class="ingr-chk' + (done?' done':'') + '" onclick="togChk(\'' + safeK + '\')"></div>'
      + '<div class="ingr-name' + (done?' done':'') + '">' + i.n + '</div>'
      + '<div class="ingr-qty">' + d + (i.u ? ' <span style="font-size:11px;color:var(--ink4)">' + i.u + '</span>' : '') + '</div>'
      + '</div>';
  }).join('');

  body.innerHTML = summaryHTML + '<div class="ingr-list">' + rowsHTML + '</div>';
}

function togChk(k){
  checked[k] = !checked[k];
  localStorage.setItem('tc_chk', JSON.stringify(checked));
  var rowId = 'ingr_' + k.replace(/[^a-z0-9]/g,'_');
  var row   = document.getElementById(rowId);
  if(row){
    row.querySelector('.ingr-chk').classList.toggle('done',  !!checked[k]);
    row.querySelector('.ingr-name').classList.toggle('done', !!checked[k]);
  } else {
    renderCompras();
  }
}




// ── PROMOS ────────────────────────────────
function renderBankFilter(){
  const banks = ['Todos', ...new Set(promos.map(p => p.banco))];
  document.getElementById('bank-filter').innerHTML = banks.map((b,i) =>
    `<div class="bchip${(!bankFilter&&i===0)||b===bankFilter?' on':''}" onclick="filterBank('${b==='Todos'?'':b}',this)">${b}</div>`
  ).join('');
}

function filterBank(b, el){
  bankFilter = b;
  document.querySelectorAll('.bchip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  renderPromos();
}

function renderPromos(){
  promos = JSON.parse(localStorage.getItem('tc_promos') || '[]');
  const filtered = bankFilter ? promos.filter(p => p.banco === bankFilter) : promos;
  const byStore  = {};
  filtered.forEach(p => { if(!byStore[p.super]) byStore[p.super]=[]; byStore[p.super].push(p); });
  const body = document.getElementById('promos-body');
  if(!filtered.length){
    body.innerHTML = `<div class="empty"><div class="empty-icon">🏦</div><div class="empty-txt">No hay promos para el banco seleccionado.</div></div>`;
    return;
  }
  body.innerHTML = Object.entries(byStore).map(([sid,ps]) => {
    const s     = STORES[sid] || { name:sid, color:'#555' };
    const items = ps.map(p => `<div class="promo-item">
      <div class="promo-bank">${p.banco}</div>
      <div style="flex:1">
        <div class="promo-txt">${p.desc}</div>
        ${p.dias ? `<div class="promo-days">${p.dias}${p.vigencia?' · '+p.vigencia:''}</div>` : ''}
      </div>
      ${p.disc ? `<div class="promo-disc">-${p.disc}%</div>` : ''}
    </div>`).join('');
    return `<div class="super-card">
      <div class="super-head">
        <div class="store-logo" style="background:${s.color}">${s.name}</div>
        <div><div class="store-nm">${s.name}</div></div>
      </div>
      ${items}
    </div>`;
  }).join('');
}

// ── PERFIL ────────────────────────────────
function loadProfileIntoForm(){
  const u = currentUser || {};
  if(u.name)     document.getElementById('pf-name').value     = u.name;
  if(u.apellido) document.getElementById('pf-apellido').value = u.apellido;
  if(u.email)    document.getElementById('pf-email').value    = u.email;
  if(u.wapp)     document.getElementById('pf-wapp').value     = u.wapp;
  if(u.city)     document.getElementById('pf-city').value     = u.city;
  if(u.personas) document.getElementById('pf-personas').value = u.personas;
  if(u.banco)    document.getElementById('pf-banco').value    = u.banco;
  updateProfileHero();
}

function updateProfileHero(){
  const n  = document.getElementById('pf-name')?.value.trim() || '';
  const ap = document.getElementById('pf-apellido')?.value.trim() || '';
  const c  = document.getElementById('pf-city')?.value.trim() || '';
  document.getElementById('profile-hero-name').textContent = n ? `${n} ${ap}`.trim() : 'Tu perfil';
  if(c) document.getElementById('profile-hero-city').textContent = '📍 ' + c;
  const pct = calcProfilePct();
  document.getElementById('pct-fill').style.width = pct + '%';
  document.getElementById('pct-txt').textContent  = `${pct}% completado`;
  document.getElementById('nav-avatar').textContent = (n||'U').slice(0,2).toUpperCase();
}

function calcProfilePct(){
  let d = 0;
  if(document.getElementById('pf-name')?.value.trim()) d++;
  if(document.getElementById('pf-city')?.value.trim()) d++;
  if(document.getElementById('pf-personas')?.value)    d++;
  if(document.getElementById('pf-banco')?.value)       d++;
  if(document.querySelectorAll('#pref-chips .chip.on').length) d++;
  return Math.round(d / 5 * 100);
}

function renderPerfil(){
  loadProfileIntoForm();
  const p = currentUser?.plan || 'mensual';
  document.getElementById('subs-label').textContent = `Plan ${p === 'anual' ? 'Anual' : 'Mensual'} activo`;
  const next = new Date();
  next.setMonth(next.getMonth() + (p === 'anual' ? 12 : 1));
  document.getElementById('subs-sub').textContent = `Próximo vencimiento: ${next.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}`;
}

function saveProfile(){
  const updated = {
    ...currentUser,
    name:     document.getElementById('pf-name').value.trim(),
    apellido: document.getElementById('pf-apellido').value.trim(),
    email:    document.getElementById('pf-email').value.trim(),
    wapp:     document.getElementById('pf-wapp').value.trim(),
    city:     document.getElementById('pf-city').value.trim(),
    personas: document.getElementById('pf-personas').value,
    banco:    document.getElementById('pf-banco').value,
  };
  currentUser = updated;
  localStorage.setItem('tc_user', JSON.stringify(updated));
  updateProfileHero();
  toast('Perfil guardado ✓');
}

function togChip(el){ el.classList.toggle('on'); }
function togChipSingle(el, grpId){
  document.querySelectorAll(`#${grpId} .chip`).forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}

// ── WHATSAPP ──────────────────────────────
function buildWAMessage(name){
  const weekRecipes = Object.values(plan).slice(0,4)
    .map(rid => recipes.find(x => x.id === rid)?.name)
    .filter(Boolean);
  const list = weekRecipes.length
    ? weekRecipes.map(r => `• ${r}`).join('\n')
    : '• Mirá las recetas disponibles en la app';
  return `¡Hola ${name||''}! 👋\n\n🍳 *Tu menú semanal de Tali Cocina está listo*\n\nEsta semana te recomendamos:\n${list}\n\n📋 Entrá a la app para ver tu lista de compras completa con cantidades.\n\n🏦 ¡No te olvides de revisar las promos bancarias en tu zona!\n\n_Tali Cocina · @talicocina_`;
}

function buildWAPreview(msg){
  const lines = msg.split('\n')
    .map(l => l.replace(/\*(.*?)\*/g,'<strong>$1</strong>').replace(/_(.*?)_/g,'<em>$1</em>'))
    .join('<br>');
  return `<div class="wa-phone">
    <div class="wa-header"><div class="wa-avatar">🍳</div><div><div class="wa-name">Tali Cocina</div><div class="wa-status">en línea</div></div></div>
    <div class="wa-body"><div class="wa-bubble">${lines}<div class="wa-time">ahora <span class="wa-tick">✓✓</span></div></div></div>
  </div>`;
}

// ── MODALES ───────────────────────────────
function openMo(id){  document.getElementById(id).classList.add('on'); }
function closeMo(id, e){
  if(!e || e.target.id === id) document.getElementById(id).classList.remove('on');
}

// ── TOAST ─────────────────────────────────
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2500);
}

// ── STORAGE SYNC (recibe cambios del admin) ──
window.addEventListener('storage', e => {
  if(e.key === 'tc_recipes'){
    recipes = JSON.parse(e.newValue || '[]');
    renderWeek();
  }
  if(e.key === 'tc_promos'){
    promos = JSON.parse(e.newValue || '[]');
    renderBankFilter();
    renderPromos();
  }
  if(e.key === 'tc_wa_notify'){
    const d = JSON.parse(e.newValue || '{}');
    if(d.trigger && currentUser){
      const msg = buildWAMessage(currentUser.name);
      toast('📱 Nuevo mensaje de WhatsApp recibido');
      setTimeout(() => {
        alert('📱 SIMULACIÓN WhatsApp:\n\n' + msg.replace(/<[^>]+>/g,''));
      }, 400);
      localStorage.removeItem('tc_wa_notify');
    }
  }
});

// ── INICIO ────────────────────────────────
window.addEventListener('load', () => {
  if(currentUser){
    loadProfileIntoForm();
    enterApp();
  } else {
    showScreen('login');
  }
});
