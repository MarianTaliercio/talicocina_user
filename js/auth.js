// ── AUTH ─────────────────────────────────
async function doLogin(){

  const btn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if(!email || !pass){
    showErr('login-error','Completá todos los campos.');
    return;
  }

  const { data: user, error } = await window.db
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if(error || !user){
    showErr('login-error','El usuario no existe.');
    return;
  }

  if((user.password || '') !== pass){
    showErr('login-error','La contraseña no es correcta.');
    return;
  }

  if(user.status === 'inactivo' || user.plan === 'inactivo'){
    showErr('login-error','Este usuario está inactivo.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  setTimeout(() => {

    currentUser = {
      personas: 2,
      ...user,
      personas: user.personas || 2
    };

    localStorage.setItem('tc_user', JSON.stringify(currentUser));

    loadUserScopedState();
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
  plan = {};
  checked = {};

  localStorage.removeItem('tc_user');

  // Ocultar navegación
  document.getElementById('topnav').style.display = 'none';
  document.getElementById('bottom-nav').style.display = 'none';

  // Limpiar navegación
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('on'));

  // Volver al primer botón del menú inferior
  document.getElementById('bn-semana')?.classList.add('on');

  // Limpiar login
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').textContent = '';

  // Mostrar pantalla de login
  showScreen('login');

  toast('Sesión cerrada');
}

function showErr(id, msg){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
function validateRegisterStep1(){

  const regName = document.getElementById('reg-name').value.trim();
  const regApellido = document.getElementById('reg-apellido').value.trim();
  const regEmail = document.getElementById('reg-email').value.trim();
  const regPass = document.getElementById('reg-pass').value;
  const regWapp = document.getElementById('reg-wapp').value.trim();
  const regCity = document.getElementById('reg-city').value.trim();

  // Campos obligatorios
  if(!regName || !regApellido || !regEmail || !regPass || !regWapp || !regCity){
    toast("Completá todos los campos.");
    return;
  }

  // Email válido (sin espacios)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if(!emailRegex.test(regEmail)){
    toast("Ingresá un correo electrónico válido.");
    return;
  }

  // Contraseña
  if (regPass.includes(" ")) {
    toast("La contraseña no puede contener espacios.");
    return;}
  if(regPass.length < 8){
    toast("La contraseña debe tener al menos 8 caracteres.");
    return;
  }

  // Todo correcto
  regStep(2);
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
  setTimeout(async () => {
    btn.disabled = false;
    document.getElementById('pay-btn-txt').textContent = 'Confirmar suscripción';
const regName = document.getElementById('reg-name').value.trim();
const regApellido = document.getElementById('reg-apellido').value.trim();
const regEmail = document.getElementById('reg-email').value.trim();
const regPass = document.getElementById('reg-pass').value;
const regWapp = document.getElementById('reg-wapp').value.trim();
const regCity = document.getElementById('reg-city').value.trim();

   const { data: existingUser } = await window.db
  .from('users')
  .select('id,email')
  .eq('email', regEmail)
  .maybeSingle();


    const data = {
      id: existingUser?.id || uid(),
      name: regName,
      apellido: regApellido,
      email: regEmail,
      password: regPass,
      plan: selectedPlan,
      wapp: regWapp,
      city: regCity,
      personas: 2,
      banco: '',
      status: 'activo',
      joined: new Date().toLocaleDateString('es-AR')
    };  
    console.log('Registrando usuario:', data);
    try { await upsertSupabaseUser(data); }
    catch(err){console.error('ERROR REGISTRO:', err);toast('Usuario guardado localmente. No se pudo sincronizar con Supabase.');}
    currentUser = data;
    localStorage.setItem('tc_user', JSON.stringify(currentUser));
    loadUserScopedState();
    loadProfileIntoForm();
    // Mostrar WA preview en modal de éxito
    const msg = buildWAMessage(currentUser.name);
    document.getElementById('wa-preview-success').innerHTML = buildWAPreview(msg);
    openMo('mo-payment-success');
  }, 2000);
}




