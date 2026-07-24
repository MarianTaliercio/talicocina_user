window.forgotPassword = function () {
  const email = prompt('Ingresá el email con el que te registraste:');
  if (!email) return;
  window.db.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}${window.location.pathname}` })
    .then(({ error }) => toast(error ? error.message : 'Te enviamos un correo para restablecer tu contraseña.'));
};
