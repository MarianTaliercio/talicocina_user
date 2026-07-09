// ── PROMOS ────────────────────────────────
function renderBankFilter(){
  const banks = ['Todos', ...new Set(promos.map(p => p.banco))];
  document.getElementById('bank-filter').innerHTML = banks.map((b,i) =>
    `<div class="bchip${(!bankFilter&&i===0)||b===bankFilter?' on':''}" onclick="filterBank('${b==='Todos'?'':b}',this)">${b}</div>`
  ).join('');
}

function filterBank(b, el){
  bankFilter = b;
  document.querySelectorAll('.bchip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  renderPromos();
}

function renderPromos(){
  promos = JSON.parse(localStorage.getItem('tc_promos') || '[]');
  const filtered = bankFilter ? promos.filter(p => p.banco === bankFilter) : promos;
  const byStore  = {};
  filtered.forEach(p => { if(!byStore[p.super]) byStore[p.super]=[]; byStore[p.super].push(p); });
  const body = document.getElementById('promos-body');
  if(!filtered.length){
    body.innerHTML = `<div class="empty"><div class="empty-icon">🏦</div><div class="empty-txt">No hay promos para el banco seleccionado.</div></div>`;
    return;
  }
  body.innerHTML = Object.entries(byStore).map(([sid,ps]) => {
    const s     = STORES[sid] || { name:sid, color:'#555' };
    const items = ps.map(p => `<div class="promo-item">
      <div class="promo-bank">${p.banco}</div>
      <div style="flex:1">
        <div class="promo-txt">${p.desc}</div>
        ${p.dias ? `<div class="promo-days">${p.dias}${p.vigencia?' · '+p.vigencia:''}</div>` : ''}
      </div>
      ${p.disc ? `<div class="promo-disc">-${p.disc}%</div>` : ''}
    </div>`).join('');
    return `<div class="super-card">
      <div class="super-head">
        <div class="store-logo" style="background:${s.color}">${s.name}</div>
        <div><div class="store-nm">${s.name}</div></div>
      </div>
      ${items}
    </div>`;
  }).join('');
}
