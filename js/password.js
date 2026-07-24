window.forgotPassword = function () {
  const recoveryEmail = document.getElementById('recovery-email');
  const loginEmail = document.getElementById('login-email')?.value.trim() || '';
  const status = document.getElementById('recovery-status');
  if (recoveryEmail) recoveryEmail.value = loginEmail;
  if (status) {
    status.className = 'recovery-status';
    status.textContent = '';
  }
  openMo('mo-password-recovery');
  window.setTimeout(() => recoveryEmail?.focus(), 250);
};

window.requestPasswordRecovery = function () {
  const email = document.getElementById('recovery-email')?.value.trim() || '';
  const status = document.getElementById('recovery-status');
  if (!status) return;
  status.className = 'recovery-status on';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.classList.add('error');
    status.textContent = 'Ingresá un correo electrónico válido.';
    return;
  }

  status.textContent = 'La recuperación por correo todavía no está habilitada. No se envió ningún mensaje. Cuando se configure, este botón enviará un enlace para crear una contraseña nueva.';
};
