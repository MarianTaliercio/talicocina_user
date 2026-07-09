// ── WHATSAPP ──────────────────────────────
function buildWAMessage(name){
  const weekRecipes = Object.values(plan).slice(0,4)
    .map(rid => recipes.find(x => x.id === rid)?.name)
    .filter(Boolean);
  const list = weekRecipes.length
    ? weekRecipes.map(r => `• ${r}`).join('\n')
    : '• Mirá las recetas disponibles en la app';
  return `¡Hola ${name||''}! 👋\n\n🍳 *Tu menú semanal de Tali Cocina está listo*\n\nEsta semana te recomendamos:\n${list}\n\n📋 Entrá a la app para ver tu lista de compras completa con cantidades.\n\n🏦 ¡No te olvides de revisar las promos bancarias en tu zona!\n\n_Tali Cocina · @talicocina_`;
}

function buildWAPreview(msg){
  const lines = msg.split('\n')
    .map(l => l.replace(/\*(.*?)\*/g,'<strong>$1</strong>').replace(/_(.*?)_/g,'<em>$1</em>'))
    .join('<br>');
  return `<div class="wa-phone">
    <div class="wa-header"><div class="wa-avatar">🍳</div><div><div class="wa-name">Tali Cocina</div><div class="wa-status">en línea</div></div></div>
    <div class="wa-body"><div class="wa-bubble">${lines}<div class="wa-time">ahora <span class="wa-tick">✓✓</span></div></div></div>
  </div>`;
}
