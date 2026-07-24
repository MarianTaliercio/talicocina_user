function loadProfileIntoForm() {
  const u = currentUser || {}; ['name','apellido','email','city','personas'].forEach(field => { const el = document.getElementById(`pf-${field}`); if (el) el.value = u[field] || ''; });
  const whatsapp = document.getElementById('pf-wapp'); if (whatsapp) whatsapp.value = u.whatsapp || '';
  const repeat = currentUser?.repetir_comidas === true; setRepeatMeals(repeat, false); updateProfileHero();
}
function updateProfileHero() { const name = document.getElementById('pf-name')?.value.trim() || ''; const apellido = document.getElementById('pf-apellido')?.value.trim() || ''; const city = document.getElementById('pf-city')?.value.trim() || ''; document.getElementById('profile-hero-name').textContent = `${name} ${apellido}`.trim() || 'Tu perfil'; document.getElementById('profile-hero-city').textContent = city ? `📍 ${city}` : ''; document.getElementById('nav-avatar').textContent = (name || 'U').slice(0,2).toUpperCase(); }
async function renderPerfil() {
  loadProfileIntoForm();
  const { data } = await window.db.from('subscriptions').select('status,current_period_end,plans(name)').eq('user_id', currentUser.id).in('status', ['pending','active','past_due','paused']).maybeSingle();
  document.getElementById('subs-label').textContent = data?.plans?.name ? `Plan ${data.plans.name}` : 'Sin suscripción activa';
  document.getElementById('subs-sub').textContent = data?.current_period_end ? `Próximo vencimiento: ${new Date(data.current_period_end).toLocaleDateString('es-AR')}` : '';
}
async function saveProfile() {
  const updated = { name: document.getElementById('pf-name').value.trim(), apellido: document.getElementById('pf-apellido').value.trim(), city: document.getElementById('pf-city').value.trim(), whatsapp: document.getElementById('pf-wapp').value.trim(), personas: Number(document.getElementById('pf-personas').value) || 1, repetir_comidas: !!currentUser.repetir_comidas };
  const { data, error } = await window.db.from('users').update(updated).eq('id', currentUser.id).select().single();
  if (error) return toast('Error al guardar perfil');
  try { await saveUserBank(currentUser.id, document.getElementById('pf-banco')?.value || ''); } catch (bankError) { console.warn(bankError); }
  currentUser = data; localStorage.setItem('tc_user', JSON.stringify(currentUser)); updateProfileHero(); toast('Perfil guardado ✓');
}
function togChip(el) { el.classList.toggle('on'); }
function togChipSingle(el, grpId) { document.querySelectorAll(`#${grpId} .chip`).forEach(chip => chip.classList.remove('on')); el.classList.add('on'); }
function setRepeatMeals(value, save = true) { document.getElementById('repeat-si').classList.toggle('on', value); document.getElementById('repeat-no').classList.toggle('on', !value); if (currentUser) currentUser.repetir_comidas = value; if (save) updateProfileHero(); }

function profileInitials(name, apellido) {
  return `${name || ''} ${apellido || ''}`.trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

function updateProfileProgress() {
  const fields = ['pf-name', 'pf-apellido', 'pf-email', 'pf-wapp', 'pf-city', 'pf-personas'];
  const completed = fields.filter(id => document.getElementById(id)?.value.trim()).length + (safeAvatar(currentUser?.avatar) ? 1 : 0);
  const percent = Math.round((completed / (fields.length + 1)) * 100);
  document.getElementById('pct-fill').style.width = `${percent}%`;
  document.getElementById('pct-txt').textContent = `${percent}% completado`;
}

function updateProfileHero() {
  const name = document.getElementById('pf-name')?.value.trim() || '';
  const apellido = document.getElementById('pf-apellido')?.value.trim() || '';
  const city = document.getElementById('pf-city')?.value.trim() || '';
  document.getElementById('profile-hero-name').textContent = `${name} ${apellido}`.trim() || 'Tu perfil';
  document.getElementById('profile-hero-city').textContent = city ? `Ciudad: ${city}` : 'Sin ciudad';
  const initials = profileInitials(name, apellido);
  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('profile-avatar').textContent = initials;
  updateProfileProgress();
}

async function saveProfile() {
  const updated = {
    name: document.getElementById('pf-name').value.trim(),
    apellido: document.getElementById('pf-apellido').value.trim(),
    city: document.getElementById('pf-city').value.trim(),
    whatsapp: document.getElementById('pf-wapp').value.trim(),
    personas: Number(document.getElementById('pf-personas').value) || 1,
    repetir_comidas: !!currentUser.repetir_comidas
  };
  const { data, error } = await window.db.from('users').update(updated).eq('id', currentUser.id).select().single();
  if (error) return toast(`Error al guardar perfil: ${error.message}`);
  const email = document.getElementById('pf-email').value.trim();
  const password = document.getElementById('pf-password').value;
  if (email && email !== currentUser.email) {
    const { error: emailError } = await window.db.auth.updateUser({ email });
    if (emailError) return toast(`Perfil guardado, pero no se actualizo el email: ${emailError.message}`);
    data.email = email;
  }
  if (password) {
    const { error: passwordError } = await window.db.auth.updateUser({ password });
    if (passwordError) return toast(`Perfil guardado, pero no se actualizo la contrasena: ${passwordError.message}`);
    document.getElementById('pf-password').value = '';
  }
  try { await saveUserBank(currentUser.id, document.getElementById('pf-banco')?.value || ''); } catch (bankError) { console.warn(bankError); }
  currentUser = data;
  localStorage.setItem('tc_user', JSON.stringify(currentUser));
  updateProfileHero();
  toast('Perfil guardado');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#screen-perfil input, #screen-perfil select').forEach(element => {
    element.addEventListener('input', updateProfileHero);
    element.addEventListener('change', updateProfileHero);
  });
});

const AVAILABLE_AVATARS = [
  'img/avatars/chef1.png', 'img/avatars/chef2.png',
  'img/avatars/chef3.png', 'img/avatars/chef4.png'
];
const DEFAULT_AVATAR = AVAILABLE_AVATARS[0];

function safeAvatar(value) {
  return AVAILABLE_AVATARS.includes(value) ? value : '';
}

function paintAvatar() {
  const avatar = safeAvatar(currentUser?.avatar) || DEFAULT_AVATAR;
  const name = document.getElementById('pf-name')?.value.trim() || currentUser?.name || '';
  const apellido = document.getElementById('pf-apellido')?.value.trim() || currentUser?.apellido || '';
  const initials = profileInitials(name, apellido);
  ['profile-avatar', 'nav-avatar', 'bnav-profile-avatar'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = avatar ? `<img src="${avatar}" alt="Avatar de ${name || 'usuario'}">` : initials;
  });
  document.querySelectorAll('.avatar-option').forEach(option => option.classList.toggle('selected', option.dataset.avatar === avatar));
}

function chooseAvatar(avatar) {
  currentUser = { ...(currentUser || {}), avatar: safeAvatar(avatar) };
  paintAvatar();
  updateProfileProgress();
}

function updateRepeatPreference() {
  const enabled = currentUser?.repetir_comidas === true;
  const text = document.getElementById('repeat-preference-sub');
  if (text) text.textContent = enabled ? 'Podremos sugerirte platos que ya te gustaron.' : 'Priorizaremos recetas diferentes cada semana.';
}

function setRepeatMeals(value, save = true) {
  document.getElementById('repeat-si')?.classList.toggle('on', value);
  document.getElementById('repeat-no')?.classList.toggle('on', !value);
  if (currentUser) currentUser.repetir_comidas = value;
  updateRepeatPreference();
  if (save) updateProfileHero();
}

function updateProfileHero() {
  const name = document.getElementById('pf-name')?.value.trim() || '';
  const apellido = document.getElementById('pf-apellido')?.value.trim() || '';
  const city = document.getElementById('pf-city')?.value.trim() || '';
  document.getElementById('profile-hero-name').textContent = `${name} ${apellido}`.trim() || 'Tu perfil';
  document.getElementById('profile-hero-city').textContent = city ? `Ciudad: ${city}` : 'Sin ciudad';
  paintAvatar();
  updateProfileProgress();
}

function loadProfileIntoForm() {
  const user = currentUser || {};
  ['name', 'apellido', 'email', 'city', 'personas'].forEach(field => {
    const element = document.getElementById(`pf-${field}`);
    if (element) element.value = user[field] || '';
  });
  const whatsapp = document.getElementById('pf-wapp');
  if (whatsapp) whatsapp.value = user.whatsapp || '';
  setRepeatMeals(user.repetir_comidas === true, false);
  updateProfileHero();
}

async function saveProfile() {
  const updated = {
    name: document.getElementById('pf-name').value.trim(),
    apellido: document.getElementById('pf-apellido').value.trim(),
    city: document.getElementById('pf-city').value.trim(),
    whatsapp: document.getElementById('pf-wapp').value.trim(),
    personas: Number(document.getElementById('pf-personas').value) || 1,
    repetir_comidas: !!currentUser.repetir_comidas,
    avatar: safeAvatar(currentUser.avatar) || null
  };
  const { data, error } = await window.db.from('users').update(updated).eq('id', currentUser.id).select().single();
  if (error) return toast(`Error al guardar perfil: ${error.message}`);
  const email = document.getElementById('pf-email').value.trim();
  const password = document.getElementById('pf-password').value;
  if (email && email !== currentUser.email) {
    const { error: emailError } = await window.db.auth.updateUser({ email });
    if (emailError) return toast(`Perfil guardado, pero no se actualizo el email: ${emailError.message}`);
    data.email = email;
  }
  if (password) {
    const { error: passwordError } = await window.db.auth.updateUser({ password });
    if (passwordError) return toast(`Perfil guardado, pero no se actualizo la contrasena: ${passwordError.message}`);
    document.getElementById('pf-password').value = '';
  }
  try { await saveUserBank(currentUser.id, document.getElementById('pf-banco')?.value || ''); } catch (bankError) { console.warn(bankError); }
  currentUser = data;
  localStorage.setItem('tc_user', JSON.stringify(currentUser));
  updateProfileHero();
  toast('Perfil y avatar guardados');
}

document.addEventListener('DOMContentLoaded', () => {
  const repeat = document.getElementById('repeat-chips');
  if (!repeat) return;
  repeat.className = 'repeat-preference';
  repeat.innerHTML = '<div class="repeat-preference-icon">&#8635;</div><div class="repeat-preference-copy"><div class="repeat-preference-title">Repetir comidas favoritas</div><div class="repeat-preference-sub" id="repeat-preference-sub"></div></div><div class="repeat-switch"><button type="button" id="repeat-si" onclick="setRepeatMeals(true)">Si</button><button type="button" id="repeat-no" onclick="setRepeatMeals(false)">No</button></div>';
  setRepeatMeals(currentUser?.repetir_comidas === true, false);
});
