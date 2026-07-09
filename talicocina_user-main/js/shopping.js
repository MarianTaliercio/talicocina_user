// ── COMPRAS ───────────────────────────────
function renderCompras(){
  loadUserScopedState();
  recipes = JSON.parse(localStorage.getItem('tc_recipes') || '[]');

  var pers = parseInt((currentUser && currentUser.personas) || 2);
  var all  = {};
  var included = [];

  Object.values(plan).forEach(function(rid){
    var r = recipes.find(function(x){ return x.id === rid; });
    if(!r) return;
    if(!included.find(function(x){ return x.id === r.id; })) included.push(r);
    if(!r.ingredientes || !r.ingredientes.length) return;
    var porciones = Math.max(1, parseInt(r.porciones) || 2);
    var factor    = pers / porciones;
    r.ingredientes.forEach(function(i){
      var nombre   = ((i.n || i.nombre   || '')).toString().trim();
      var cantidad = (i.c  || i.cantidad || '0').toString();
      var unidad   = ((i.u || i.unidad   || '')).toString().trim();
      if(!nombre) return;
      var k = nombre.toLowerCase() + '||' + unidad.toLowerCase();
      if(!all[k]) all[k] = { n: nombre, u: unidad, total: 0 };
      all[k].total += (parseFloat(cantidad) || 0) * factor;
    });
  });

  var items = Object.values(all).sort(function(a,b){ return a.n.localeCompare(b.n); });

  document.getElementById('buy-count').textContent   = items.length;
  document.getElementById('buy-sub-txt').textContent = items.length
    ? ('Para ' + pers + ' persona' + (pers!==1?'s':'') + ' \u00b7 ' + items.length + ' ingrediente' + (items.length!==1?'s':''))
    : 'Eleg\u00ed recetas para ver la lista';

  var body = document.getElementById('buy-body');
  if(!body) return;

  if(!items.length){
    body.innerHTML = '<div class="empty"><div class="empty-icon">\uD83D\uDED2</div><div class="empty-txt">Eleg\u00ed recetas en el men\u00fa semanal<br>para ver qu\u00e9 necesit\u00e1s comprar.</div></div>';
    return;
  }

  var summaryHTML = '';
  if(included.length){
    var tags = included.map(function(r){
      return '<span style="background:var(--white);border:1px solid var(--g4);border-radius:14px;padding:3px 10px;font-size:12px;color:var(--g2);font-weight:500">' + r.name + '</span>';
    }).join('');
    summaryHTML = '<div style="background:var(--g6);border-radius:var(--rs);padding:.75rem 1rem;margin-bottom:1rem;border:1px solid var(--g5)">'
      + '<div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.4rem">Recetas incluidas</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px">' + tags + '</div>'
      + '</div>';
  }

  var rowsHTML = items.map(function(i){
    var k    = i.n.toLowerCase() + '||' + i.u.toLowerCase();
    var done = checked[k] || false;
    var q    = i.total;
    var d    = q===0 ? '-' : q%1===0 ? q.toFixed(0) : q<10 ? q.toFixed(1) : Math.round(q).toString();
    var rowId = 'ingr_' + k.replace(/[^a-z0-9]/g,'_');
    var safeK = k.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<div class="ingr-item" id="' + rowId + '">'
      + '<div class="ingr-chk' + (done?' done':'') + '" onclick="togChk(\'' + safeK + '\')"></div>'
      + '<div class="ingr-name' + (done?' done':'') + '">' + i.n + '</div>'
      + '<div class="ingr-qty">' + d + (i.u ? ' <span style="font-size:11px;color:var(--ink4)">' + i.u + '</span>' : '') + '</div>'
      + '</div>';
  }).join('');

  body.innerHTML = summaryHTML + '<div class="ingr-list">' + rowsHTML + '</div>';
}

function togChk(k){
  checked[k] = !checked[k];
  saveChecked();
  var rowId = 'ingr_' + k.replace(/[^a-z0-9]/g,'_');
  var row   = document.getElementById(rowId);
  if(row){
    row.querySelector('.ingr-chk').classList.toggle('done',  !!checked[k]);
    row.querySelector('.ingr-name').classList.toggle('done', !!checked[k]);
  } else {
    renderCompras();
  }
}
