async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;
  if (!email || !password) return showErr('login-error', 'Completá todos los campos.');
  const button = document.getElementById('login-btn'); button.disabled = true; button.innerHTML = '<span class="spinner"></span>';
  const { data, error } = await window.db.auth.signInWithPassword({ email, password });
  button.disabled = false; button.textContent = 'Ingresar';
  if (error || !data.user) return showErr('login-error', error?.code === 'email_not_confirmed' ? 'Confirmá el email de registro antes de ingresar.' : (error?.message || 'Email o contraseña incorrectos.'));
  try {
    currentUser = await getCurrentProfile() || await ensureUserProfile(data.user, data.user.user_metadata || {});
    await applySelectedPlan(data.user.user_metadata?.selectedPlan || '');
    await redeemReferralForCurrentUser(data.user.user_metadata?.referralCode || '');
    await loadAvailableBanks(); await loadProfessionalRecipes(); localStorage.setItem('tc_user', JSON.stringify(currentUser)); await loadUserSelections(); loadProfileIntoForm(); enterApp();
  } catch (profileError) { console.error(profileError); showErr('login-error', `No se pudo cargar tu perfil: ${profileError.message || 'revisá las políticas RLS'}`); }
}
function showLoginForm() { document.getElementById('login-welcome-panel')?.classList.add('hidden'); }
async function doLogout() { if (!confirm('¿Cerrar sesión?')) return; await window.db.auth.signOut(); currentUser = null; plan = {}; checked = {}; localStorage.removeItem('tc_user'); showScreen('login'); toast('Sesión cerrada'); }
function showErr(id, message) { const element = document.getElementById(id); element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 5000); }
async function redeemReferralForCurrentUser(code) {
  if (!code) return;
  const { data, error } = await window.db.rpc('redeem_referral_code', { input_code: code });
  if (error) { console.warn('No se pudo aplicar el codigo', error.message); return; }
  if (data?.applied) toast(`Codigo aplicado: plan Premium por ${data.owner}`);
}
async function applySelectedPlan(selected) {
  const planName = { gratuito: 'Gratuito', mensual: 'Plus', anual: 'Premium' }[selected];
  if (!planName) return;
  const { error } = await window.db.rpc('assign_signup_plan', { plan_name_input: planName });
  if (error) console.warn('No se pudo asignar el plan', error.message);
}

async function validateRegisterStep1() {
  const fields = ['reg-name', 'reg-apellido', 'reg-email', 'reg-pass', 'reg-wapp', 'reg-city'];
  if (fields.some(id => !document.getElementById(id).value.trim())) return toast('Completa todos los campos.');
  if (!await validateCityInput('reg-city')) return toast('Elegí una ciudad válida de la lista.');
  const email = document.getElementById('reg-email').value.trim(); const password = document.getElementById('reg-pass').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Ingresa un email valido.');
  if (password.includes(' ') || password.length < 8) return toast('La contrasena debe tener al menos 8 caracteres y no incluir espacios.');
  const code = document.getElementById('reg-ref-code')?.value.trim().toUpperCase() || '';
  const source = document.getElementById('reg-ref-source')?.value || '';
  if (source && !code) return toast('Ingresa el codigo del profesional o beneficio.');
  if (code && !source) return toast('Elegí Profesional o Beneficio para usar el código.');
  if (code) {
    const { data, error } = await window.db.rpc('validate_referral_code', { input_code: code });
    if (error) { invalidateReferralBenefit(); return toast('No se pudo validar el código.'); }
    if (!data?.valid) { invalidateReferralBenefit(); return toast(data?.message || 'El código no es válido.'); }
    applyReferralBenefit(data);
    toast(`Código válido: ${data.owner}. Descuento aplicado a Premium.`);
  } else {
    invalidateReferralBenefit();
  }
  regStep(2);
}
function validateRegisterStep1Legacy() {
  const fields = ['reg-name', 'reg-apellido', 'reg-email', 'reg-pass', 'reg-wapp', 'reg-city'];
  if (fields.some(id => !document.getElementById(id).value.trim())) return toast('Completá todos los campos.');
  const email = document.getElementById('reg-email').value.trim(); const password = document.getElementById('reg-pass').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Ingresá un correo electrónico válido.');
  if (password.includes(' ') || password.length < 8) return toast('La contraseña debe tener al menos 8 caracteres y no incluir espacios.');
  regStep(2);
}
function regStep(number) { [1,2,3,4].forEach(step => document.getElementById(`reg-step-${step}`).style.display = step === number ? 'block' : 'none'); document.querySelectorAll('#reg-steps .step-dot').forEach((dot, index) => dot.className = `step-dot${index < number - 1 ? ' done' : index === number - 1 ? ' on' : ''}`); }
function selectPlan(planName) {
  if (referralValidated && planName !== 'anual') return toast('Con este código el beneficio se aplica únicamente al plan Premium.');
  selectedPlan = planName; document.getElementById('plan-gratuito').classList.toggle('selected', planName === 'gratuito'); document.getElementById('plan-mensual').classList.toggle('selected', planName === 'mensual'); document.getElementById('plan-anual').classList.toggle('selected', planName === 'anual');
}

function applyReferralBenefit(data) {
  referralValidated = true;
  referralDiscount = Math.min(100, Math.max(0, Number(data.discount_percentage) || 0));
  const original = Number(registrationPlanPrices.Premium || 0);
  referralFinalPrice = Math.round(original * (1 - referralDiscount / 100) * 100) / 100;
  selectPlan('anual');
  document.getElementById('plan-gratuito').classList.add('locked');
  document.getElementById('plan-mensual').classList.add('locked');
  const price = document.querySelector('#plan-anual .plan-price');
  const currency = price?.dataset.currency || 'ARS';
  if (price) price.innerHTML = `<span class="old-plan-price">${currency} ${original.toLocaleString('es-AR')}</span><span class="discounted-plan-price">${currency} ${referralFinalPrice.toLocaleString('es-AR')}</span>`;
  const note = document.getElementById('referral-price-note');
  if (note) note.textContent = `${referralDiscount}% de descuento con tu código · Exclusivo para Premium`;
}

function invalidateReferralBenefit() {
  referralValidated = false; referralDiscount = 0; referralFinalPrice = null;
  document.getElementById('plan-gratuito')?.classList.remove('locked');
  document.getElementById('plan-mensual')?.classList.remove('locked');
  const price = document.querySelector('#plan-anual .plan-price');
  const original = Number(registrationPlanPrices.Premium || 0);
  const currency = price?.dataset.currency || 'ARS';
  if (price && original) price.textContent = `${currency} ${original.toLocaleString('es-AR')}`;
  const note = document.getElementById('referral-price-note'); if (note) note.textContent = '';
}

function handleReferralSourceChange() {
  if (!document.getElementById('reg-ref-source').value) document.getElementById('reg-ref-code').value = '';
  invalidateReferralBenefit();
}
function formatCC(element) { const value = element.value.replace(/\D/g, '').slice(0, 16); element.value = value.replace(/(.{4})/g, '$1 ').trim(); document.getElementById('cc-display').textContent = value.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim(); }
function formatExp(element) { let value = element.value.replace(/\D/g, ''); if (value.length >= 2) value = `${value.slice(0,2)}/${value.slice(2,4)}`; element.value = value; document.getElementById('cc-exp-display').textContent = value || 'MM/AA'; }
async function doPayment() {
  const referralSource = document.getElementById('reg-ref-source')?.value || '';
  const typedReferralCode = document.getElementById('reg-ref-code')?.value.trim().toUpperCase() || '';
  if (referralSource) {
    const { data: referralData, error: referralError } = await window.db.rpc('validate_referral_code', { input_code: typedReferralCode });
    if (referralError || !referralData?.valid) return toast(referralData?.message || 'El código ya no es válido.');
    applyReferralBenefit(referralData);
    if (selectedPlan !== 'anual') return toast('Este código sólo puede utilizarse con el plan Premium.');
  }
  const isFree = selectedPlan === 'gratuito' || (referralValidated && referralFinalPrice === 0);
  const required = isFree ? [] : ['cc-number', 'cc-name', 'cc-exp', 'cc-cvv'];
  if (required.some(id => !document.getElementById(id).value.trim())) return toast('Completá los datos de pago.');
  if (!await validateCityInput('reg-city')) return toast('Elegí una ciudad válida de la lista.');
  const referralCode = referralSource ? (document.getElementById('reg-ref-code')?.value.trim().toUpperCase() || '') : '';
  const values = { name: document.getElementById('reg-name').value.trim(), apellido: document.getElementById('reg-apellido').value.trim(), email: document.getElementById('reg-email').value.trim(), password: document.getElementById('reg-pass').value, whatsapp: document.getElementById('reg-wapp').value.trim(), city: document.getElementById('reg-city').value.trim(), personas: 2, allergies: selectedProfileChips('reg-allergies'), dietary_preferences: selectedProfileChips('reg-preferences'), selectedPlan, referralCode, referralSource };
  localStorage.setItem('tc_pending_profile', JSON.stringify({ name: values.name, apellido: values.apellido, email: values.email, whatsapp: values.whatsapp, city: values.city, personas: values.personas, allergies: values.allergies, dietary_preferences: values.dietary_preferences, repetir_comidas: false, selectedPlan: values.selectedPlan, referralCode: values.referralCode, referralSource: values.referralSource }));
  const { data, error } = await window.db.auth.signUp({
    email: values.email, password: values.password,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      data: { name: values.name, apellido: values.apellido, whatsapp: values.whatsapp, city: values.city, personas: values.personas, allergies: values.allergies, dietary_preferences: values.dietary_preferences, repetir_comidas: false, selectedPlan: values.selectedPlan, referralCode: values.referralCode, referralSource: values.referralSource }
    }
  });
  if (error || !data.user) {
    console.error('Error de registro:', error);
    const message = error?.code === 'over_email_send_rate_limit' || error?.status === 429 ? 'Supabase limitó temporalmente los emails de registro. Esperá y revisá Authentication → Rate Limits.' : (error?.message || 'No se pudo crear la cuenta.');
    return toast(message);
  }
  if (!data.session) { toast('Cuenta creada. Confirmá el email que te enviamos y luego iniciá sesión.'); showScreen('login'); return; }
  try { currentUser = await ensureUserProfile(data.user, values); await applySelectedPlan(values.selectedPlan); await redeemReferralForCurrentUser(values.referralCode); await loadProfessionalRecipes(); localStorage.setItem('tc_user', JSON.stringify(currentUser)); await loadUserSelections(); openMo('mo-payment-success'); }
  catch (profileError) { console.error(profileError); toast(`La cuenta fue creada, pero no se pudo guardar el perfil: ${profileError.message || 'revisá las políticas RLS'}`); }
}

async function resendConfirmationEmail() {
  const email = document.getElementById('login-email').value.trim() || document.getElementById('reg-email').value.trim();
  if (!email) return showErr('login-error', 'IngresÃ¡ tu email para reenviar la confirmaciÃ³n.');
  const { error } = await window.db.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` } });
  if (error) return showErr('login-error', error.message || 'No se pudo reenviar el correo.');
  showErr('login-error', 'Te enviamos un nuevo correo de confirmaciÃ³n. RevisÃ¡ Spam tambiÃ©n.');
}

document.addEventListener('DOMContentLoaded', () => {
  return;
  const body = document.querySelector('#screen-login .auth-body');
  if (!body) return;
  const footer = document.createElement('div');
  footer.className = 'auth-footer';
  footer.innerHTML = '';
  body.appendChild(footer);
});
