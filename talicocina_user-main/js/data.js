// ── DEMO DATA ────────────────────────────
function initDemoRecipes(){
  recipes = [
    { id:'r1', name:'Milanesas napolitanas', ytUrl:'', ytId:'', cals:540, porciones:2,
      ingredientes:[
        {n:'Carne milanesa',c:'500',u:'g'},{n:'Huevos',c:'2',u:'unidades'},
        {n:'Pan rallado',c:'100',u:'g'},{n:'Tomate',c:'2',u:'unidades'},
        {n:'Mozzarella',c:'200',u:'g'},{n:'Jamón cocido',c:'100',u:'g'}
      ],
      pasos:['Batir los huevos en un plato hondo.','Pasar la carne por huevo y pan rallado.','Freír en aceite caliente hasta dorar.','Colocar toppings y gratinar a 200°C por 10 min.']
    },
    { id:'r2', name:'Fideos al tuco casero', ytUrl:'', ytId:'', cals:480, porciones:4,
      ingredientes:[
        {n:'Fideos',c:'400',u:'g'},{n:'Carne picada',c:'300',u:'g'},
        {n:'Tomate triturado',c:'400',u:'g'},{n:'Cebolla',c:'1',u:'unidades'},{n:'Ajo',c:'2',u:'dientes'}
      ],
      pasos:['Rehogar cebolla y ajo en aceite.','Agregar carne picada y cocinar 5 min.','Incorporar tomate y cocinar 20 min a fuego bajo.','Servir con fideos cocidos al dente.']
    },
    { id:'r3', name:'Pollo al limón y romero', ytUrl:'', ytId:'', cals:380, porciones:2,
      ingredientes:[
        {n:'Pollo (muslos)',c:'600',u:'g'},{n:'Limón',c:'1',u:'unidades'},
        {n:'Ajo',c:'3',u:'dientes'},{n:'Papa',c:'4',u:'unidades'}
      ],
      pasos:['Marinar pollo con limón, ajo y romero 30 min.','Colocar en asadera con papas.','Hornear a 200°C por 45 min.']
    },
    { id:'r4', name:'Revuelto gramajo', ytUrl:'', ytId:'', cals:360, porciones:2,
      ingredientes:[
        {n:'Huevos',c:'4',u:'unidades'},{n:'Papas fritas finas',c:'200',u:'g'},{n:'Jamón cocido',c:'150',u:'g'}
      ],
      pasos:['Freír papas en tiritas, reservar.','Saltear jamón en tiras.','Agregar huevos batidos y revolver.','Incorporar papas al final.']
    },
    { id:'r5', name:'Sopa de verduras', ytUrl:'', ytId:'', cals:180, porciones:4,
      ingredientes:[
        {n:'Zanahoria',c:'2',u:'unidades'},{n:'Papa',c:'3',u:'unidades'},
        {n:'Caldo de verdura',c:'1',u:'litro'},{n:'Apio',c:'2',u:'ramas'}
      ],
      pasos:['Cortar todas las verduras en cubos.','Llevar a hervor con el caldo.','Cocinar 25 minutos hasta tiernizar.','Salpimentar y servir.']
    },
    { id:'r6', name:'Ensalada César', ytUrl:'', ytId:'', cals:280, porciones:2,
      ingredientes:[
        {n:'Lechuga',c:'1',u:'unidades'},{n:'Pollo cocido',c:'200',u:'g'},
        {n:'Pan tostado',c:'2',u:'rebanadas'},{n:'Parmesano',c:'50',u:'g'}
      ],
      pasos:['Lavar y cortar la lechuga.','Agregar pollo desmenuzado.','Incorporar crutones y parmesano.','Aliñar con aderezo césar.']
    },
  ];
  async function loadRecipes(){
  const { data, error } = await supabase
    .from('recipes')
    .select('*');

  if(error){
    console.error(error);
    return;
  }

  recipes = data;
  renderRecipes();
}
}

function initDemoPromos(){
  promos = [
    {id:'p1',super:'coto',      banco:'Banco Nación',   desc:'25% OFF con débito',              disc:25, dias:'Martes',         vigencia:'Hasta 31/05'},
    {id:'p2',super:'coto',      banco:'BBVA',           desc:'15% de reintegro tope $2.000',    disc:15, dias:'Todos los días',  vigencia:'Hasta 30/05'},
    {id:'p3',super:'toledo',    banco:'Santander',      desc:'30% OFF en el total de la compra',disc:30, dias:'Jueves',         vigencia:'Hasta 15/06'},
    {id:'p4',super:'toledo',    banco:'Galicia',        desc:'20% OFF en almacén y carnes',     disc:20, dias:'Miércoles',      vigencia:'Hasta 31/05'},
    {id:'p5',super:'disco',     banco:'HSBC',           desc:'20% de descuento 2do turno',      disc:20, dias:'Lun a Vie',      vigencia:'Hasta 31/05'},
    {id:'p6',super:'vital',     banco:'Banco Provincia',desc:'25% OFF con débito todos los días',disc:25,dias:'Todos los días', vigencia:'Hasta 30/06'},
    {id:'p7',super:'changomas', banco:'Mercado Pago',   desc:'10% de cashback sin tope',        disc:10, dias:'Todos los días', vigencia:'Hasta 30/05'},
    {id:'p8',super:'la-anonima',banco:'Macro',          desc:'20% OFF con crédito los viernes', disc:20, dias:'Viernes',       vigencia:'Hasta 30/05'},
    {id:'p9',super:'carrefour', banco:'MODO',           desc:'15% OFF pagando con MODO',        disc:15, dias:'Todos los días', vigencia:'Hasta 31/05'},
  ];
  localStorage.setItem('tc_promos', JSON.stringify(promos));
}

function getUsers(){
  return JSON.parse(localStorage.getItem('tc_users') || '[]');
}

function saveUsers(list){
  localStorage.setItem('tc_users', JSON.stringify(list));
}

// function ensureDemoUsers(){
//   const existing = getUsers();
//   if(existing.length) return;
//   const now = new Date();
//   const addMon = (d,n) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x.toLocaleDateString('es-AR'); };
//   saveUsers([
//     {id:'u1',name:'MarÃ­a',apellido:'GarcÃ­a',email:'maria@demo.com',password:'maria123',wapp:'+54 9 223 444-5678',plan:'mensual',city:'Mar del Plata',banco:'Santander',personas:2,joined:now.toLocaleDateString('es-AR'),nextBill:addMon(now,1),status:'activo'},
//     {id:'u2',name:'Carlos',apellido:'LÃ³pez',email:'carlos@demo.com',password:'carlos123',wapp:'+54 9 223 111-2222',plan:'anual',city:'Mar del Plata',banco:'Galicia',personas:2,joined:addMon(now,-2),nextBill:addMon(now,10),status:'activo'},
//     {id:'u3',name:'Ana',apellido:'RodrÃ­guez',email:'ana@demo.com',password:'ana123',wapp:'+54 9 223 333-4444',plan:'mensual',city:'Balcarce',banco:'BBVA',personas:2,joined:addMon(now,-1),nextBill:addMon(now,0),status:'activo'},
//     {id:'u4',name:'Lucas',apellido:'MartÃ­nez',email:'lucas@demo.com',password:'lucas123',wapp:'+54 9 223 555-6666',plan:'inactivo',city:'Mar del Plata',banco:'',personas:2,joined:addMon(now,-3),nextBill:'â€”',status:'inactivo'},
//   ]);
// }

function normalizeEmail(email){
  return (email || '').trim().toLowerCase();
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function userStorageId(user = currentUser){
  return (user?.id || normalizeEmail(user?.email) || 'anon').replace(/[^a-z0-9_-]/gi, '_');
}

function userStorageKey(base, user = currentUser){
  return `${base}_${userStorageId(user)}`;
}

function loadUserScopedState(){
  plan = currentUser ? JSON.parse(localStorage.getItem(userStorageKey('tc_plan')) || '{}') : {};
  checked = currentUser ? JSON.parse(localStorage.getItem(userStorageKey('tc_chk')) || '{}') : {};
}

function savePlan(){
  if(currentUser) localStorage.setItem(userStorageKey('tc_plan'), JSON.stringify(plan));
}

function saveChecked(){
  if(currentUser) localStorage.setItem(userStorageKey('tc_chk'), JSON.stringify(checked));
}

function syncCurrentUserFromUsers(){
  if(!currentUser) return false;
  const latest = getUsers().find(u => u.id === currentUser.id || normalizeEmail(u.email) === normalizeEmail(currentUser.email));
  if(!latest){
    currentUser = null;
    localStorage.removeItem('tc_user');
    return false;
  }
  currentUser = { personas:2, ...latest, personas:latest.personas || currentUser.personas || 2 };
  localStorage.setItem('tc_user', JSON.stringify(currentUser));
  return true;
}
