/* ======================================================
   TALI COCINA - APP.JS
   Punto de arranque del lado usuario
====================================================== */

async function bootstrapApp(){
  await loadSupabaseData();
  await loadRegistrationPlans();
  currentUser = await getCurrentProfile();
  if (!currentUser) {
    const { data: { user } } = await window.db.auth.getUser();
    if (user) currentUser = await ensureUserProfile(user, user.user_metadata || {});
  }
  if (currentUser) {
    await loadProfessionalRecipes();
    localStorage.setItem('tc_user', JSON.stringify(currentUser));
    await loadUserSelections();
  }
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
});

window.addEventListener('load', async () => {
  await bootstrapApp();
  if(currentUser){
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

    const button = document.querySelector('.theme-btn');
    if (button) { button.textContent = theme === 'dark' ? '☀️' : '🌙'; button.setAttribute('aria-label', theme === 'dark' ? 'Activar modo día' : 'Activar modo noche'); }

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
