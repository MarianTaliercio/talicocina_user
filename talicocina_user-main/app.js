/* ======================================================
   TALI COCINA - APP.JS
   Punto de arranque del lado usuario
====================================================== */

async function bootstrapApp(){
  await loadSupabaseData();

  syncCurrentUserFromUsers();
  loadUserScopedState();
}

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
      toast('Nuevo mensaje de WhatsApp recibido');
      setTimeout(() => {
        alert('SIMULACION WhatsApp:\n\n' + msg.replace(/<[^>]+>/g,''));
      }, 400);
      localStorage.removeItem('tc_wa_notify');
    }
  }
  if(e.key === 'tc_users' && currentUser){
    const wasSynced = syncCurrentUserFromUsers();
    if(!wasSynced || currentUser.status === 'inactivo' || currentUser.plan === 'inactivo'){
      toast('Tu usuario fue actualizado por el admin');
      currentUser = null;
      localStorage.removeItem('tc_user');
      showScreen('login');
      return;
    }
    loadProfileIntoForm();
    updateProfileHero();
    renderWeek();
    if(document.getElementById('screen-perfil')?.classList.contains('on')) renderPerfil();
  }
});

window.addEventListener('load', async () => {
  await bootstrapApp();
  syncCurrentUserFromUsers();
  if(currentUser && currentUser.status !== 'inactivo' && currentUser.plan !== 'inactivo'){
    loadUserScopedState();
    loadProfileIntoForm();
    enterApp();
  } else {
    currentUser = null;
    localStorage.removeItem('tc_user');
    showScreen('login');
  }
});




// theme dark
// ── TEMA ───────────────────────────────

function setTheme(theme){

    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("tc_theme", theme);

}

function toggleTheme(){

    const current =
        document.documentElement.getAttribute("data-theme") || "light";

    const next =
        current === "dark"
            ? "light"
            : "dark";

    setTheme(next);

}

document.addEventListener("DOMContentLoaded",()=>{

    setTheme(
        localStorage.getItem("tc_theme") || "light"
    );

});
// theme dark