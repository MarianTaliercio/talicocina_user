const GEOREF_LOCALITIES_URL = 'https://apis.datos.gob.ar/georef/api/localidades';
const citySearchTimers = new WeakMap();

function normalizeCityText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es-AR');
}

function cityCanonicalName(locality) {
  return `${locality.nombre}, ${locality.provincia.nombre}`;
}

async function searchArgentineCities(value, max = 10) {
  const name = String(value || '').split(',')[0].trim();
  if (name.length < 2) return [];
  const params = new URLSearchParams({ nombre: name, campos: 'id,nombre,provincia.id,provincia.nombre', max: String(max) });
  const response = await fetch(`${GEOREF_LOCALITIES_URL}?${params}`);
  if (!response.ok) throw new Error('GeoRef no está disponible');
  const result = await response.json();
  return result.localidades || [];
}

function paintCityOptions(input, localities) {
  const list = document.getElementById(input.getAttribute('list'));
  if (!list) return;
  list.innerHTML = localities.map(locality => {
    const value = cityCanonicalName(locality).replace(/"/g, '&quot;');
    return `<option value="${value}"></option>`;
  }).join('');
}

function setupCityInput(input) {
  input.setAttribute('autocomplete', 'off');
  input.addEventListener('input', () => {
    input.dataset.cityValidated = '';
    input.setCustomValidity('');
    clearTimeout(citySearchTimers.get(input));
    citySearchTimers.set(input, setTimeout(async () => {
      try {
        const localities = await searchArgentineCities(input.value);
        paintCityOptions(input, localities);
        const exact = localities.find(locality => normalizeCityText(cityCanonicalName(locality)) === normalizeCityText(input.value));
        if (exact) input.dataset.cityValidated = cityCanonicalName(exact);
      } catch (error) {
        console.warn('No se pudieron buscar localidades', error);
      }
    }, 300));
  });
}

async function validateCityInput(inputOrId) {
  const input = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
  if (!input || !input.value.trim()) return false;
  if (normalizeCityText(input.dataset.cityValidated) === normalizeCityText(input.value)) return true;
  try {
    const localities = await searchArgentineCities(input.value, 20);
    const typed = normalizeCityText(input.value);
    const fullMatch = localities.find(locality => typed === normalizeCityText(cityCanonicalName(locality)));
    const nameMatches = localities.filter(locality => typed === normalizeCityText(locality.nombre));
    const exact = fullMatch || (nameMatches.length === 1 ? nameMatches[0] : null);
    if (!exact) {
      input.setCustomValidity('Elegí una localidad válida de la lista.');
      input.reportValidity();
      input.focus();
      return false;
    }
    const canonical = cityCanonicalName(exact);
    input.value = canonical;
    input.dataset.cityValidated = canonical;
    input.setCustomValidity('');
    return true;
  } catch (error) {
    console.warn('No se pudo validar la localidad', error);
    toast('No pudimos verificar la ciudad. Revisá tu conexión e intentá nuevamente.');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.city-input').forEach(setupCityInput);
});
