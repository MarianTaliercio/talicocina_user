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
  if(u.password)    document.getElementById('pf-password').value    = u.password;
  updateProfileHero();
  const repetir = currentUser?.repetir_comidas !== false;

  setRepeatMeals(repetir, false);
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
  updateAvatar();
  const p = currentUser?.plan || 'mensual';
  document.getElementById('subs-label').textContent = `Plan ${p === 'anual' ? 'Anual' : 'Mensual'} activo`;
  const next = new Date();
  next.setMonth(next.getMonth() + (p === 'anual' ? 12 : 1));
  document.getElementById('subs-sub').textContent = `Próximo vencimiento: ${next.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}`;
}

async function saveProfile(){

  const updated = {
    name: document.getElementById('pf-name').value.trim(),
    apellido: document.getElementById('pf-apellido').value.trim(),
    email: document.getElementById('pf-email').value.trim(),
    wapp: document.getElementById('pf-wapp').value.trim(),
    city: document.getElementById('pf-city').value.trim(),
    personas: document.getElementById('pf-personas').value,
    banco: document.getElementById('pf-banco').value,
    password: document.getElementById('pf-password').value,
    repetir_comidas: currentUser.repetir_comidas,
    avatar: currentUser.avatar
  };
  document.getElementById("bottom-avatar").src =
    "img/avatars/" + (currentUser.avatar || "chef1.png");
  const { error } = await window.db
    .from('users')
    .update(updated)
    .eq('id', currentUser.id);

  if(error){
    console.error(error);
    toast('Error al guardar perfil');
    return;
  }

  currentUser = {
    ...currentUser,
    ...updated
  };

  localStorage.setItem(
    'tc_user',
    JSON.stringify(currentUser)
  );
  await upsertSupabaseUser(currentUser);
  updateAvatar();
  updateProfileHero();

  toast('Perfil guardado ✓');
}

function togChip(el){ el.classList.toggle('on'); }
function togChipSingle(el, grpId){
  document.querySelectorAll(`#${grpId} .chip`).forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}


// Repetir comida
function setRepeatMeals(valor, guardar = true){

  document.getElementById('repeat-si').classList.toggle('on', valor);
  document.getElementById('repeat-no').classList.toggle('on', !valor);

  currentUser.repetir_comidas = valor;

  if(guardar){
    updateProfileHero();
  }
}

// Avatars
function updateAvatar(){

    const img=document.getElementById("profile-avatar");

    if(!img) return;

    const avatar=currentUser?.avatar || "chef1.png";

    img.src="img/avatars/"+avatar;

}
const avatars = [
    "chef1.png",
    "chef2.png",
    "chef3.png",
    "chef4.png",
];

function openAvatarPicker(){

    const grid=document.getElementById("avatar-grid");

    grid.innerHTML=avatars.map(a=>`

        <img
            class="avatar-option ${currentUser.avatar===a?'on':''}"
            src="img/avatars/${a}"
            onclick="selectAvatar('${a}')">

    `).join("");

    openMo("mo-avatar");

}
function selectAvatar(name){

    currentUser.avatar=name;

    updateAvatar();

    closeMo("mo-avatar");

}