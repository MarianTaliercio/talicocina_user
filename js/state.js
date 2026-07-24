/* ══════════════════════════════════════
   TALI COCINA — APP.JS
   Lógica del lado usuario
══════════════════════════════════════ */

// ── CONSTANTES ──────────────────────────
const DAYS  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
// La base permite una selección activa por fecha.
const MEALS = ['Almuerzo', 'Cena'];
const STORES = {
  coto:        { name:'COTO',        color:'#e31e24' },
  toledo:      { name:'Toledo',      color:'#1a5ca8' },
  disco:       { name:'Disco',       color:'#e65100' },
  vital:       { name:'Vital',       color:'#2e7d2e' },
  changomas:   { name:'Changomás',   color:'#6a1b9a' },
  'la-anonima':{ name:'La Anónima',  color:'#c8960c' },
  carrefour:   { name:'Carrefour',   color:'#004a97' },
  dia:         { name:'Día%',        color:'#cc0000' },
};

// ── ESTADO ──────────────────────────────
let recipes     = JSON.parse(localStorage.getItem('tc_recipes') || 'null');
let promos      = JSON.parse(localStorage.getItem('tc_promos')  || 'null');
let plan        = {};
let checked     = {};
let currentUser = JSON.parse(localStorage.getItem('tc_user')    || 'null');
let showCals    = false;
let selectedPlan= 'mensual';
let editKey     = null;
let bankFilter  = '';
let selectedWeekDay = null;
let plannerAnchorDate = null;
