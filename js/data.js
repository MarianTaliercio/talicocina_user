// Persistencia local únicamente para el estado visual de la lista de compras.
function userStorageId(user = currentUser) { return (user?.id || 'anon').replace(/[^a-z0-9_-]/gi, '_'); }
function userStorageKey(base, user = currentUser) { return `${base}_${userStorageId(user)}`; }
function loadUserScopedState() { checked = currentUser ? JSON.parse(localStorage.getItem(userStorageKey('tc_chk')) || '{}') : {}; }
function savePlan() { /* Las selecciones se guardan en user_recipe_selections. */ }
function saveChecked() { if (currentUser) localStorage.setItem(userStorageKey('tc_chk'), JSON.stringify(checked)); }
