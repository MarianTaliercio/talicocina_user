/* ══════════════════════════════════════
   TALI COCINA — ADMIN.JS
   Lógica del panel administrador
══════════════════════════════════════ */

// ── CONSTANTES ──────────────────────────
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

const VIEW_META = {
  dashboard:       { title:'Dashboard',             sub:'Resumen general' },
  recetas:         { title:'Recetas',               sub:'Gestión de recetas' },
  importar:        { title:'Importar JSON',          sub:'Carga masiva de recetas' },
  usuarios:        { title:'Usuarios',              sub:'Gestión de usuarios registrados' },
  suscripciones:   { title:'Suscripciones',         sub:'Estado de pagos y planes' },
  promos:          { title:'Promos bancarias',       sub:'Descuentos por banco y supermercado' },
  notificaciones:  { title:'Notificaciones WhatsApp',sub:'Envíos automáticos al publicar recetas' },
};

// ── ESTADO ──────────────────────────────
let recipes   = JSON.parse(localStorage.getItem('tc_recipes') || 'null');
let promos    = JSON.parse(localStorage.getItem('tc_promos')  || 'null');
let users     = JSON.parse(localStorage.getItem('tc_users')   || 'null');
let waHistory = JSON.parse(localStorage.getItem('tc_wa_hist') || '[]');

let editRid = null, editPid = null, editUid = null;
let ingrTags = [], pasosTags = [];

// Inicializar demo data
if(!recipes) initDemoRecipes();
if(!promos)  initDemoPromos();
if(!users)   initDemoUsers();

// ── HELPERS ──────────────────────────────
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function uid()      { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function getYTId(url){ const m=(url||'').match(/(?:youtu\.be\/|[?&]v=|embed\/)([A-Za-z0-9_-]{11})/); return m?m[1]:null; }

// ── DEMO DATA ────────────────────────────
function initDemoRecipes(){
  recipes = [
    { id:'r1', name:'Milanesas napolitanas', ytUrl:'', ytId:'', cals:540, porciones:2,
      ingredientes:[{n:'Carne milanesa',c:'500',u:'g'},{n:'Huevos',c:'2',u:'unidades'},{n:'Pan rallado',c:'100',u:'g'},{n:'Tomate',c:'2',u:'unidades'},{n:'Mozzarella',c:'200',u:'g'}],
      pasos:['Batir los huevos.','Pasar la carne por huevo y pan rallado.','Freír hasta dorar.','Gratinar con toppings a 200°C.'] },
    { id:'r2', name:'Fideos al tuco casero', ytUrl:'', ytId:'', cals:480, porciones:4,
      ingredientes:[{n:'Fideos',c:'400',u:'g'},{n:'Carne picada',c:'300',u:'g'},{n:'Tomate triturado',c:'400',u:'g'},{n:'Cebolla',c:'1',u:'unidades'}],
      pasos:['Rehogar cebolla.','Agregar carne.','Añadir tomate y cocinar 20 min.','Servir con fideos.'] },
    { id:'r3', name:'Pollo al limón y romero', ytUrl:'', ytId:'', cals:380, porciones:2,
      ingredientes:[{n:'Pollo (muslos)',c:'600',u:'g'},{n:'Limón',c:'1',u:'unidades'},{n:'Papa',c:'4',u:'unidades'}],
      pasos:['Marinar 30 min.','Hornear a 200°C por 45 min.'] },
  ];
  save('tc_recipes', recipes);
}

function initDemoPromos(){
  promos = [
    {id:'p1',super:'coto',     banco:'Banco Nación',   desc:'25% OFF con débito',             disc:25,dias:'Martes',       vigencia:'Hasta 31/05'},
    {id:'p2',super:'toledo',   banco:'Santander',      desc:'30% OFF en el total',            disc:30,dias:'Jueves',       vigencia:'Hasta 15/06'},
    {id:'p3',super:'disco',    banco:'HSBC',           desc:'20% descuento 2do turno',        disc:20,dias:'Lun a Vie',    vigencia:'Hasta 31/05'},
    {id:'p4',super:'vital',    banco:'Banco Provincia',desc:'25% OFF débito todos los días',  disc:25,dias:'Todos los días',vigencia:'Hasta 30/06'},
    {id:'p5',super:'changomas',banco:'Mercado Pago',   desc:'10% cashback sin tope',          disc:10,dias:'Todos los días',vigencia:'Hasta 30/05'},
  ];
  save('tc_promos', promos);
}

function initDemoUsers(){
  const now   = new Date();
  const addMon = (d,n) => { const x=new Date(d); x.setMonth(x.getMonth()+n); return x.toLocaleDateString('es-AR'); };
  users = [
    {id:'u1',name:'María',   apellido:'García',   email:'maria@demo.com', wapp:'+54 9 223 444-5678',plan:'mensual',city:'Mar del Plata',banco:'Santander',  joined:now.toLocaleDateString('es-AR'),nextBill:addMon(now,1), status:'activo'},
    {id:'u2',name:'Carlos',  apellido:'López',    email:'carlos@demo.com',wapp:'+54 9 223 111-2222',plan:'anual',  city:'Mar del Plata',banco:'Galicia',    joined:addMon(now,-2),                nextBill:addMon(now,10),status:'activo'},
    {id:'u3',name:'Ana',     apellido:'Rodríguez',email:'ana@demo.com',   wapp:'+54 9 223 333-4444',plan:'mensual',city:'Balcarce',     banco:'BBVA',       joined:addMon(now,-1),                nextBill:addMon(now,0), status:'activo'},
    {id:'u4',name:'Lucas',   apellido:'Martínez', email:'lucas@demo.com', wapp:'+54 9 223 555-6666',plan:'inactivo',city:'Mar del Plata',banco:'',          joined:addMon(now,-3),                nextBill:'—',           status:'inactivo'},
  ];
  save('tc_users', users);
}

// ── AUTH ──────────────────────────────────
function adminLogin(){
  const u   = document.getElementById('adm-user').value.trim();
  const p   = document.getElementById('adm-pass').value;
  const btn = document.getElementById('adm-login-btn');
  btn.innerHTML = '<span class="spinner"></span> Ingresando…';
  btn.disabled  = true;
  setTimeout(() => {
    if(u === 'admin' && p === 'tali2025'){
      sessionStorage.setItem('tc_admin_auth','1');
      document.getElementById('admin-login-screen').style.display = 'none';
      document.getElementById('admin-panel').style.display        = 'block';
      initAdmin();
    } else {
      toast('Usuario o contraseña incorrectos');
    }
    btn.textContent = 'Ingresar al panel';
    btn.disabled    = false;
  }, 700);
}

function adminLogout(){
  if(!confirm('¿Cerrar sesión?')) return;
  sessionStorage.removeItem('tc_admin_auth');
  document.getElementById('admin-panel').style.display        = 'none';
  document.getElementById('admin-login-screen').style.display = 'block';
  document.getElementById('adm-user').value = '';
  document.getElementById('adm-pass').value = '';
  closeSidebar();
  toast('Sesión cerrada');
}

// ── SIDEBAR MOBILE ────────────────────────
function toggleSidebar(){
  const open = document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('on', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function closeSidebar(){
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('on');
  document.body.style.overflow = '';
}
window.addEventListener('resize', () => { if(window.innerWidth > 768) closeSidebar(); });

// ── NAVEGACIÓN ────────────────────────────
function goView(name, el){
  document.querySelectorAll('.view').forEach(v   => v.classList.remove('on'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  document.getElementById('view-'+name).classList.add('on');
  if(el) el.classList.add('on');
  const m = VIEW_META[name] || {};
  document.getElementById('topbar-title').textContent = m.title || name;
  document.getElementById('topbar-sub').textContent   = m.sub   || '';
  if(window.innerWidth <= 768) closeSidebar();
  // Renderizar según sección
  if(name === 'recetas')        renderRecipeTable();
  if(name === 'usuarios')       renderUsersTable();
  if(name === 'suscripciones')  renderSubs();
  if(name === 'promos')         renderPromoTable();
  if(name === 'notificaciones') renderNotificaciones();
  if(name === 'dashboard')      renderDashboard();
}

function aTab(el, section){
  document.querySelectorAll('.atab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  ['ar','ai','ap'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById(section).style.display = 'block';
  if(section === 'ap') renderAdminPromos();
}

// ── INIT ──────────────────────────────────
function initAdmin(){
  updateBadges();
  renderDashboard();
  renderWAPreview();
}
function updateBadges(){
  document.getElementById('nb-recetas').textContent  = recipes.length;
  document.getElementById('nb-usuarios').textContent = users.length;
  document.getElementById('nb-promos').textContent   = promos.length;
}

// ── DASHBOARD ────────────────────────────
function renderDashboard(){
  const active  = users.filter(u => u.status === 'activo').length;
  const mensual = users.filter(u => u.plan   === 'mensual').length;
  const anual   = users.filter(u => u.plan   === 'anual').length;
  const mrr     = mensual * 1990 + anual * Math.round(16900/12);

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon">🍽</div><div class="stat-n">${recipes.length}</div><div class="stat-label">Recetas cargadas</div></div>
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-n">${active}</div><div class="stat-label">Usuarios activos</div><div class="stat-trend up">↑ ${users.length} registrados total</div></div>
    <div class="stat-card"><div class="stat-icon">💳</div><div class="stat-n">${mensual+anual}</div><div class="stat-label">Suscriptores</div><div class="stat-trend up">${anual} anuales · ${mensual} mensuales</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-n">$${mrr.toLocaleString('es-AR')}</div><div class="stat-label">Ingreso mensual estimado</div></div>
  `;

  document.getElementById('dash-recipes').innerHTML = recipes.slice(0,4).map(r => `
    <div style="display:flex;align-items:center;gap:10px;padding:.6rem 0;border-bottom:1px solid var(--line)">
      <div style="width:36px;height:36px;border-radius:8px;background:var(--g5);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">🍽</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</div>
        <div style="font-size:11px;color:var(--ink3)">${(r.ingredientes||[]).length} ingredientes${r.cals?' · '+r.cals+' kcal':''}</div>
      </div>
    </div>`).join('') || '<div class="empty"><div class="empty-icon">🍽</div><p>Sin recetas</p></div>';

  document.getElementById('dash-users').innerHTML = users.slice(0,4).map(u => `
    <div style="display:flex;align-items:center;gap:10px;padding:.6rem 0;border-bottom:1px solid var(--line)">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--g4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:var(--g1);flex-shrink:0">${(u.name||'U').slice(0,2).toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;color:var(--ink)">${u.name} ${u.apellido}</div>
        <div style="font-size:11px;color:var(--ink3)">${u.email}</div>
      </div>
      <span class="badge ${u.status==='activo'?'badge-green':'badge-red'}">${u.plan}</span>
    </div>`).join('') || '<div class="empty"><p>Sin usuarios</p></div>';
}

// ── RECETAS ───────────────────────────────
function renderRecipeTable(){
  const q = (document.getElementById('recipe-search')?.value || '').toLowerCase();
  const filtered = recipes.filter(r => !q || r.name.toLowerCase().includes(q));
  document.getElementById('recipes-count-lbl').textContent = `${filtered.length} receta${filtered.length!==1?'s':''} cargada${filtered.length!==1?'s':''}`;
  document.getElementById('recipe-tbody').innerHTML = filtered.map(r => {
    const ytOk = r.ytId && r.ytId.length === 11;
    return `<tr>
      <td>${ytOk?`<img class="td-thumb" src="https://img.youtube.com/vi/${r.ytId}/mqdefault.jpg" loading="lazy">`:`<div class="td-ph">🍽</div>`}</td>
      <td class="td-name">${r.name}</td>
      <td>${r.cals?`<span class="badge badge-amber">${r.cals} kcal</span>`:'—'}</td>
      <td><span class="badge badge-green">${(r.ingredientes||[]).length} ingr.</span></td>
      <td>${(r.pasos||[]).length} paso${(r.pasos||[]).length!==1?'s':''}</td>
      <td>${ytOk?`<a href="${r.ytUrl}" target="_blank" style="font-size:12px;color:#cc0000">▶ YouTube</a>`:'<span style="color:var(--ink4)">—</span>'}</td>
      <td><div style="display:flex;gap:5px">
        <button class="btn-icon btn-e" onclick="openRecipeForm('${r.id}')">✏️</button>
        <button class="btn-icon btn-d" onclick="delRecipe('${r.id}')">🗑</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--ink4)">Sin recetas. Agregá la primera.</td></tr>`;
}

function delRecipe(id){
  if(!confirm('¿Eliminar esta receta?')) return;
  recipes = recipes.filter(r => r.id !== id);
  save('tc_recipes', recipes);
  renderRecipeTable(); updateBadges(); renderDashboard();
  toast('Receta eliminada');
}

function openRecipeForm(id){
  editRid = id; ingrTags = []; pasosTags = [];
  ['rf-name','rf-yt','rf-cals'].forEach(fid => document.getElementById(fid).value = '');
  document.getElementById('rf-porciones').value = '2';
  document.getElementById('rf-yt-prev').innerHTML = '';
  document.getElementById('mo-recipe-title').textContent = id ? 'Editar receta' : 'Nueva receta';
  renderTagsUI('ingr'); renderTagsUI('pasos');
  if(id){
    const r = recipes.find(x => x.id === id); if(!r) return;
    document.getElementById('rf-name').value     = r.name     || '';
    document.getElementById('rf-yt').value       = r.ytUrl    || '';
    document.getElementById('rf-cals').value     = r.cals     || '';
    document.getElementById('rf-porciones').value= r.porciones|| 2;
    ingrTags  = [...(r.ingredientes||[]).map(i => ({...i}))];
    pasosTags = [...(r.pasos||[])];
    renderTagsUI('ingr'); renderTagsUI('pasos');
    if(r.ytId && r.ytId.length === 11) showYTPrev(r.ytId);
  }
  openMo('mo-recipe');
}

// ── TAG INPUTS ────────────────────────────
function handleTag(e, type){
  if(e.key === 'Enter'){
    e.preventDefault();
    const val = e.target.value.trim(); if(!val) return;
    if(type === 'ingr'){
      const p = val.split(',').map(s => s.trim());
      ingrTags.push({ n:p[0]||val, c:p[1]||'1', u:p[2]||'u' });
    } else {
      pasosTags.push(val);
    }
    e.target.value = '';
    renderTagsUI(type);
  } else if(e.key === 'Backspace' && !e.target.value){
    if(type === 'ingr'  && ingrTags.length)  { ingrTags.pop();  renderTagsUI('ingr'); }
    if(type === 'pasos' && pasosTags.length) { pasosTags.pop(); renderTagsUI('pasos'); }
  }
}

function renderTagsUI(type){
  const isIngr = type === 'ingr';
  const wrap   = document.getElementById(type+'-wrap');
  const inp    = document.getElementById(type+'-inp');
  if(!wrap) return;
  wrap.querySelectorAll('.tag').forEach(t => t.remove());
  const arr = isIngr ? ingrTags : pasosTags;
  arr.forEach((t,i) => {
    const div = document.createElement('div');
    div.className = `tag ${isIngr ? 'tag-green' : 'tag-blue'}`;
    div.innerHTML = isIngr
      ? `${t.n} <span style="opacity:.65">${t.c} ${t.u}</span><button onclick="rmTag('${type}',${i})">×</button>`
      : `<span style="opacity:.6;margin-right:3px">${i+1}.</span>${t.length>50?t.slice(0,50)+'…':t}<button onclick="rmTag('${type}',${i})">×</button>`;
    wrap.insertBefore(div, inp);
  });
}

function rmTag(type, i){
  if(type === 'ingr') ingrTags.splice(i,1);
  else pasosTags.splice(i,1);
  renderTagsUI(type);
}

function prevYT(url){
  const id = getYTId(url);
  if(id) showYTPrev(id);
  else document.getElementById('rf-yt-prev').innerHTML = '';
}
function showYTPrev(id){
  document.getElementById('rf-yt-prev').innerHTML = `<div class="yt-prev"><img src="https://img.youtube.com/vi/${id}/mqdefault.jpg"><div class="yt-prev-lbl">Vista previa del thumbnail</div></div>`;
}

function saveRecipe(){
  const name = document.getElementById('rf-name').value.trim();
  if(!name){ toast('Escribí el nombre de la receta'); return; }
  const rawIngr = document.getElementById('ingr-inp').value.trim();
  if(rawIngr){ const p=rawIngr.split(',').map(s=>s.trim()); ingrTags.push({n:p[0],c:p[1]||'1',u:p[2]||'u'}); }
  const rawPaso = document.getElementById('pasos-inp').value.trim();
  if(rawPaso) pasosTags.push(rawPaso);
  const ytUrl = document.getElementById('rf-yt').value.trim();
  const ytId  = getYTId(ytUrl) || '';
  const data  = {
    name, ytUrl, ytId,
    cals:     parseInt(document.getElementById('rf-cals').value)     || 0,
    porciones:parseInt(document.getElementById('rf-porciones').value)|| 2,
    ingredientes: [...ingrTags],
    pasos:        [...pasosTags],
  };
  if(editRid){
    const idx = recipes.findIndex(r => r.id === editRid);
    if(idx >= 0) recipes[idx] = { ...recipes[idx], ...data };
  } else {
    recipes.push({ id:uid(), ...data });
  }
  save('tc_recipes', recipes);
  closeMo('mo-recipe'); renderRecipeTable(); updateBadges(); renderDashboard();
  toast(editRid ? 'Receta actualizada ✓' : 'Receta guardada ✓');
  if(!editRid) suggestWANotify();
}

function suggestWANotify(){
  setTimeout(() => {
    if(confirm('¿Querés enviar la notificación de WhatsApp a los usuarios ahora?')){
      goView('notificaciones', document.getElementById('ni-notificaciones'));
    }
  }, 400);
}

// ── IMPORTAR JSON ─────────────────────────
function importJSON(){
  let raw = document.getElementById('json-import-area').value.trim();
  if(!raw){ toast('Pegá el JSON primero'); return; }
  const btn      = document.getElementById('import-btn');
  const prog     = document.getElementById('import-prog');
  const progWrap = document.getElementById('import-prog-wrap');
  const res      = document.getElementById('import-result');
  btn.disabled   = true;
  btn.innerHTML  = '<span class="spinner"></span> Importando…';
  progWrap.style.display = 'block';
  prog.style.width       = '0%';
  try {
    raw = raw.replace(/```json|```/g,'').trim();
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) throw new Error('El JSON debe ser un array []');
    let added = 0, errs = 0;
    arr.forEach((item, idx) => {
      setTimeout(() => { prog.style.width = Math.round((idx+1)/arr.length*100)+'%'; }, idx*30);
      if(!item.name){ errs++; return; }
      const ytId = getYTId(item.ytUrl||'') || '';
      recipes.push({
        id:uid(), name:item.name, ytUrl:item.ytUrl||'', ytId,
        cals:     parseInt(item.cals)     || 0,
        porciones:parseInt(item.porciones)|| 2,
        ingredientes: Array.isArray(item.ingredientes) ? item.ingredientes : [],
        pasos:        Array.isArray(item.pasos)        ? item.pasos        : [],
      });
      added++;
    });
    setTimeout(() => {
      save('tc_recipes', recipes);
      btn.textContent        = 'Importar recetas';
      btn.disabled           = false;
      progWrap.style.display = 'none';
      res.textContent = `✓ ${added} receta${added!==1?'s':''} importada${added!==1?'s':''}${errs?` · ${errs} con errores`:''}`;
      document.getElementById('json-import-area').value = '';
      updateBadges(); renderDashboard();
      toast(`${added} recetas importadas ✓`);
      if(added > 0) suggestWANotify();
    }, arr.length*30+200);
  } catch(err){
    btn.textContent        = 'Importar recetas';
    btn.disabled           = false;
    progWrap.style.display = 'none';
    toast('Error en el JSON: ' + err.message);
  }
}

function loadJSONDemo(){
  document.getElementById('json-import-area').value = JSON.stringify([
    { name:'Tarta de espinaca', ytUrl:'', cals:320, porciones:6,
      ingredientes:[{n:'Espinaca',c:'500',u:'g'},{n:'Huevos',c:'3',u:'unidades'},{n:'Queso crema',c:'200',u:'g'},{n:'Tapas de tarta',c:'2',u:'unidades'}],
      pasos:['Blanquear la espinaca.','Mezclar con huevos y queso.','Rellenar la tarta.','Hornear 35 min a 180°C.'] },
    { name:'Cazuela de lentejas', ytUrl:'', cals:290, porciones:4,
      ingredientes:[{n:'Lentejas',c:'300',u:'g'},{n:'Chorizo colorado',c:'200',u:'g'},{n:'Zanahoria',c:'2',u:'unidades'},{n:'Papa',c:'3',u:'unidades'}],
      pasos:['Remojar lentejas 1 hora.','Rehogar chorizo y verduras.','Agregar lentejas con agua.','Cocinar 40 minutos.'] },
    { name:'Bifes a la criolla', ytUrl:'', cals:450, porciones:2,
      ingredientes:[{n:'Bifes de cuadril',c:'400',u:'g'},{n:'Tomate',c:'3',u:'unidades'},{n:'Morrón',c:'1',u:'unidades'},{n:'Cebolla',c:'1',u:'unidades'}],
      pasos:['Sellar los bifes en sartén caliente.','Agregar verduras cortadas.','Cocinar tapado 20 min a fuego bajo.'] },
  ], null, 2);
}

// ── USUARIOS ──────────────────────────────
function renderUsersTable(){
  const q = (document.getElementById('user-search')?.value || '').toLowerCase();
  const filtered = users.filter(u => !q || (u.name+u.apellido+u.email).toLowerCase().includes(q));
  document.getElementById('users-count-lbl').textContent = `${filtered.length} usuario${filtered.length!==1?'s':''}`;
  document.getElementById('users-body').innerHTML = `<div>` + filtered.map(u => `
    <div class="user-row">
      <div class="user-avatar">${(u.name||'U').slice(0,2).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${u.name} ${u.apellido}</div>
        <div class="user-meta">${u.email} · 📱 ${u.wapp||'—'} · 📍 ${u.city||'—'}</div>
      </div>
      <span class="badge ${u.plan==='anual'?'badge-purple':u.plan==='mensual'?'badge-green':'badge-red'}">${u.plan}</span>
      <span class="badge ${u.status==='activo'?'badge-green':'badge-red'}" style="margin-left:4px">${u.status}</span>
      <div class="user-actions">
        <button class="btn-icon btn-e" onclick="openUserForm('${u.id}')">✏️</button>
        <button class="btn-icon btn-d" onclick="delUser('${u.id}')">🗑</button>
      </div>
    </div>`).join('') + `</div>`;
}

function openUserForm(id){
  editUid = id;
  ['uf-name','uf-apellido','uf-email','uf-wapp','uf-city'].forEach(fid => document.getElementById(fid).value = '');
  document.getElementById('uf-plan').value = 'mensual';
  document.getElementById('mo-user-title').textContent = id ? 'Editar usuario' : 'Nuevo usuario';
  if(id){
    const u = users.find(x => x.id === id); if(!u) return;
    document.getElementById('uf-name').value     = u.name     || '';
    document.getElementById('uf-apellido').value = u.apellido || '';
    document.getElementById('uf-email').value    = u.email    || '';
    document.getElementById('uf-wapp').value     = u.wapp     || '';
    document.getElementById('uf-plan').value     = u.plan     || 'mensual';
    document.getElementById('uf-city').value     = u.city     || '';
  }
  openMo('mo-user');
}

function saveUser(){
  const email = document.getElementById('uf-email').value.trim();
  if(!email){ toast('Escribí el email'); return; }
  const now  = new Date();
  const data = {
    name:     document.getElementById('uf-name').value.trim(),
    apellido: document.getElementById('uf-apellido').value.trim(),
    email,
    wapp:     document.getElementById('uf-wapp').value.trim(),
    plan:     document.getElementById('uf-plan').value,
    city:     document.getElementById('uf-city').value.trim(),
    status:   'activo',
    joined:   now.toLocaleDateString('es-AR'),
  };
  if(editUid){
    const idx = users.findIndex(u => u.id === editUid);
    if(idx >= 0) users[idx] = { ...users[idx], ...data };
  } else {
    users.push({ id:uid(), ...data });
  }
  save('tc_users', users);
  closeMo('mo-user'); renderUsersTable(); updateBadges(); renderDashboard();
  toast(editUid ? 'Usuario actualizado ✓' : 'Usuario agregado ✓');
}

function delUser(id){
  if(!confirm('¿Eliminar este usuario?')) return;
  users = users.filter(u => u.id !== id);
  save('tc_users', users);
  renderUsersTable(); updateBadges(); renderDashboard();
  toast('Usuario eliminado');
}

// ── SUSCRIPCIONES ─────────────────────────
function renderSubs(){
  const activos = users.filter(u => u.status === 'activo').length;
  const mensual = users.filter(u => u.plan   === 'mensual').length;
  const anual   = users.filter(u => u.plan   === 'anual').length;
  const mrr     = mensual * 1990 + anual * Math.round(16900/12);
  document.getElementById('subs-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-n">${activos}</div><div class="stat-label">Suscriptores activos</div></div>
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-n">$${mrr.toLocaleString('es-AR')}</div><div class="stat-label">MRR estimado</div></div>
    <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-n">${anual?Math.round(anual/(activos||1)*100):0}%</div><div class="stat-label">Tasa plan anual</div></div>
  `;
  document.getElementById('subs-tbody').innerHTML = users.map(u => {
    const monto = u.plan==='mensual'?'$1.990 / mes':u.plan==='anual'?'$16.900 / año':'—';
    return `<tr>
      <td class="td-name">${u.name} ${u.apellido}<br><span style="font-size:11px;color:var(--ink3)">${u.email}</span></td>
      <td><span class="badge ${u.plan==='anual'?'badge-purple':'badge-green'}">${u.plan}</span></td>
      <td><span class="badge ${u.status==='activo'?'badge-green':'badge-red'}">${u.status}</span></td>
      <td style="font-size:12px">${u.joined||'—'}</td>
      <td style="font-size:12px">${u.nextBill||'—'}</td>
      <td style="font-size:13px;font-weight:500">${monto}</td>
    </tr>`;
  }).join('');
}

// ── PROMOS ────────────────────────────────
function renderPromoTable(){
  document.getElementById('promo-tbody').innerHTML = promos.map(p => {
    const s = STORES[p.super] || { name:p.super, color:'#555' };
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:30px;height:30px;border-radius:6px;background:${s.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:white">${s.name.slice(0,4)}</div>
        ${s.name}
      </div></td>
      <td><span class="badge badge-blue">${p.banco}</span></td>
      <td style="max-width:220px">${p.desc}</td>
      <td>${p.disc?`<span style="font-weight:700;color:var(--red)">-${p.disc}%</span>`:'—'}</td>
      <td style="font-size:12px">${p.dias||'—'}</td>
      <td style="font-size:12px">${p.vigencia||'—'}</td>
      <td><div style="display:flex;gap:5px">
        <button class="btn-icon btn-e" onclick="openPromoForm('${p.id}')">✏️</button>
        <button class="btn-icon btn-d" onclick="delPromo('${p.id}')">🗑</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--ink4)">Sin promos. Agregá la primera.</td></tr>`;
}

function renderAdminPromos(){
  document.getElementById('admin-promo-list').innerHTML = promos.map(p => {
    const s = STORES[p.super] || { name:p.super, color:'#555' };
    return `<div class="promo-adm">
      <div class="promo-adm-row">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;color:var(--ink2);margin-bottom:2px">${s.name}</div>
          <div class="promo-adm-txt">${p.desc}</div>
          ${p.dias?`<div style="font-size:11px;color:var(--ink3)">${p.dias}${p.vigencia?' · '+p.vigencia:''}</div>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="promo-adm-bank">${p.banco}</div>
          ${p.disc?`<div class="promo-adm-disc">-${p.disc}%</div>`:''}
          <button class="btn-icon btn-e" onclick="openPromoForm('${p.id}')">✏️</button>
          <button class="btn-icon btn-d" onclick="delPromo('${p.id}')">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="empty"><div class="empty-icon">🏦</div><p>Sin promos. Agregá la primera.</p></div>';
}

function openPromoForm(id){
  editPid = id;
  ['pf-desc','pf-disc','pf-dias','pf-vigencia'].forEach(fid => document.getElementById(fid).value = '');
  document.getElementById('mo-promo-title').textContent = id ? 'Editar promo' : 'Nueva promo';
  if(id){
    const p = promos.find(x => x.id === id); if(!p) return;
    document.getElementById('pf-super').value    = p.super    || 'coto';
    document.getElementById('pf-banco').value    = p.banco    || '';
    document.getElementById('pf-desc').value     = p.desc     || '';
    document.getElementById('pf-disc').value     = p.disc     || '';
    document.getElementById('pf-dias').value     = p.dias     || '';
    document.getElementById('pf-vigencia').value = p.vigencia || '';
  }
  openMo('mo-promo');
}

function savePromo(){
  const desc = document.getElementById('pf-desc').value.trim();
  if(!desc){ toast('Escribí la descripción'); return; }
  const data = {
    super:    document.getElementById('pf-super').value,
    banco:    document.getElementById('pf-banco').value,
    desc,
    disc:     parseInt(document.getElementById('pf-disc').value)     || 0,
    dias:     document.getElementById('pf-dias').value.trim(),
    vigencia: document.getElementById('pf-vigencia').value.trim(),
  };
  if(editPid){
    const idx = promos.findIndex(p => p.id === editPid);
    if(idx >= 0) promos[idx] = { ...promos[idx], ...data };
  } else {
    promos.push({ id:uid(), ...data });
  }
  save('tc_promos', promos);
  closeMo('mo-promo'); renderPromoTable(); renderAdminPromos(); updateBadges();
  toast(editPid ? 'Promo actualizada ✓' : 'Promo guardada ✓');
}

function delPromo(id){
  if(!confirm('¿Eliminar esta promo?')) return;
  promos = promos.filter(p => p.id !== id);
  save('tc_promos', promos);
  renderPromoTable(); renderAdminPromos(); updateBadges();
  toast('Promo eliminada');
}

// ── NOTIFICACIONES WA ─────────────────────
function buildWAMsg(customMsg){
  const dest        = document.getElementById('wa-dest')?.value || 'all';
  const targetUsers = dest === 'all'
    ? users.filter(u => u.status === 'activo')
    : users.filter(u => u.status === 'activo' && u.plan === dest);
  const weekRecipes = recipes.slice(-4).map(r => r.name);
  const list        = weekRecipes.length ? weekRecipes.map(r => `• ${r}`).join('\n') : '• Mirá las novedades en la app';
  const base        = customMsg ||
    `¡Hola! 👋\n\n🍳 *Tu menú semanal de Tali Cocina está listo*\n\nEsta semana te recomendamos:\n${list}\n\n📋 Entrá a la app para ver tu lista de compras con cantidades.\n🏦 ¡Revisá las promos bancarias de tu zona!\n\n_Tali Cocina · @talicocina_`;
  return { msg:base, count:targetUsers.length };
}

function renderWAPreview(){
  const custom      = document.getElementById('wa-custom')?.value || '';
  const { msg, count } = buildWAMsg(custom);
  const lines       = msg.split('\n')
    .map(l => l.replace(/\*(.*?)\*/g,'<strong>$1</strong>').replace(/_(.*?)_/g,'<em>$1</em>'))
    .join('<br>');
  document.getElementById('wa-preview-box').innerHTML = `
    <div class="wa-phone">
      <div class="wa-header"><div class="wa-avatar">🍳</div><div><div class="wa-hname">Tali Cocina</div><div class="wa-hstatus">en línea</div></div></div>
      <div class="wa-body"><div class="wa-bubble">${lines}<div class="wa-meta"><span class="wa-time">ahora</span><span class="wa-tick">✓✓</span></div></div></div>
    </div>
    <p style="text-align:center;font-size:12px;color:var(--ink3);margin-top:.5rem">Se enviará a <strong>${count}</strong> usuario${count!==1?'s':''}</p>`;
}

function renderNotificaciones(){
  renderWAPreview();
  document.getElementById('wa-history').innerHTML = waHistory.length
    ? waHistory.slice().reverse().map(h => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:.6rem 0;border-bottom:1px solid var(--line)">
          <div style="font-size:18px">📱</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500;color:var(--ink)">${h.label}</div>
            <div style="font-size:11px;color:var(--ink3)">${h.date} · ${h.count} destinatarios</div>
          </div>
          <span class="badge badge-green">Enviado</span>
        </div>`).join('')
    : `<div class="empty"><div class="empty-icon">📭</div><p>Sin envíos aún</p></div>`;

  const total = waHistory.reduce((acc,h) => acc + h.count, 0);
  document.getElementById('wa-stats').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--rs)"><div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--g2)">${waHistory.length}</div><div style="font-size:12px;color:var(--ink3)">Envíos realizados</div></div>
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--rs)"><div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--g2)">${total}</div><div style="font-size:12px;color:var(--ink3)">Mensajes enviados</div></div>
    </div>`;
}

document.addEventListener('input', e => {
  if(e.target.id === 'wa-custom' || e.target.id === 'wa-dest') renderWAPreview();
});

function sendWANotification(){
  const btn    = document.getElementById('wa-send-btn');
  const res    = document.getElementById('wa-result');
  const custom = document.getElementById('wa-custom').value;
  const { msg, count } = buildWAMsg(custom);
  if(!count){ toast('No hay usuarios activos para notificar'); return; }
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Enviando…';
  setTimeout(() => {
    localStorage.setItem('tc_wa_notify', JSON.stringify({ trigger:true, msg, ts:Date.now() }));
    const entry = {
      id:uid(), label:custom ? 'Mensaje personalizado' : 'Recetas semanales',
      date:new Date().toLocaleString('es-AR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
      count, msg,
    };
    waHistory.push(entry);
    save('tc_wa_hist', waHistory);
    btn.disabled  = false;
    btn.innerHTML = '📱 Enviar notificación por WhatsApp';
    res.innerHTML = `✅ Notificación enviada a <strong>${count}</strong> usuario${count!==1?'s':''}`;
    renderNotificaciones();
    toast(`📱 Notificación enviada a ${count} usuarios ✓`);
    setTimeout(() => res.textContent = '', 4000);
  }, 1800);
}
function exportBackup() {
  const data = {
    recipes: JSON.parse(localStorage.getItem('tc_recipes') || '[]'),
    promos: JSON.parse(localStorage.getItem('tc_promos') || '[]'),
    users: JSON.parse(localStorage.getItem('tc_users') || '[]'),
    fecha: new Date().toISOString()
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tali-backup.json';
  a.click();
}
// ── MODALES / TOAST ───────────────────────
function openMo(id)      { document.getElementById(id).classList.add('on'); }
function closeMo(id, e)  { if(!e || e.target.id === id) document.getElementById(id).classList.remove('on'); }
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
}

// ── INICIO ────────────────────────────────
if(sessionStorage.getItem('tc_admin_auth') === '1'){
  document.getElementById('admin-login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display        = 'block';
  initAdmin();
}
