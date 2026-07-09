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
