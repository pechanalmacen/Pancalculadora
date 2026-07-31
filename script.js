let counts = { dulce: 0, torta: 0 };
let llevaBolsa = false;
let molidoTipo = 0;
let selectedQuickPay = null;

// Precios Base por defecto o guardados en localStorage
let basePrices = JSON.parse(localStorage.getItem('pan_base_prices')) || {
  dulce: 7,
  torta: 4,
  bolsa: 1,
  molidoMedio: 15,
  molidoKilo: 30
};

let temporadaItems = JSON.parse(localStorage.getItem('pan_temporada_v2')) || [
  { id: 1, name: '🥮Pan de Muerto', price: 25, count: 0 },
  { id: 2, name: '🍩Rosca de Reyes', price: 200, count: 0 }
];

let salesHistory = JSON.parse(localStorage.getItem('pan_sales_history_v2')) || [];

function updatePriceLabels() {
  document.getElementById('display-price-dulce').innerText = `$${basePrices.dulce.toFixed(2)} c/u`;
  document.getElementById('display-price-torta').innerText = `$${basePrices.torta.toFixed(2)} c/u`;
  document.getElementById('display-label-bolsa').innerText = `🛍️Bolsa (+$${basePrices.bolsa.toFixed(2)})`;
  document.getElementById('molido-medio').innerText = `1/2 Kilo ($${basePrices.molidoMedio})`;
  document.getElementById('molido-kilo').innerText = `1 Kilo ($${basePrices.molidoKilo})`;
}

function openPricesModal() {
  document.getElementById('edit-price-dulce').value = basePrices.dulce;
  document.getElementById('edit-price-torta').value = basePrices.torta;
  document.getElementById('edit-price-bolsa').value = basePrices.bolsa;
  document.getElementById('edit-price-molido-medio').value = basePrices.molidoMedio;
  document.getElementById('edit-price-molido-kilo').value = basePrices.molidoKilo;
  
  document.getElementById('prices-modal').classList.add('active');
}

function closePricesModal() {
  document.getElementById('prices-modal').classList.remove('active');
}

function saveBasePrices() {
  basePrices.dulce = parseFloat(document.getElementById('edit-price-dulce').value) || 0;
  basePrices.torta = parseFloat(document.getElementById('edit-price-torta').value) || 0;
  basePrices.bolsa = parseFloat(document.getElementById('edit-price-bolsa').value) || 0;
  basePrices.molidoMedio = parseFloat(document.getElementById('edit-price-molido-medio').value) || 0;
  basePrices.molidoKilo = parseFloat(document.getElementById('edit-price-molido-kilo').value) || 0;

  localStorage.setItem('pan_base_prices', JSON.stringify(basePrices));
  updatePriceLabels();
  calculateTotal();
  closePricesModal();
  showToast('⚙️ Precios actualizados');
}

function adjustCount(type, delta) {
  counts[type] = Math.max(0, (parseInt(counts[type]) || 0) + delta);
  document.getElementById(`count-${type}`).value = counts[type];
  calculateTotal();
}

function onInputCount(type) {
  const val = parseInt(document.getElementById(`count-${type}`).value);
  counts[type] = isNaN(val) || val < 0 ? 0 : val;
  calculateTotal();
}

function adjustTempCount(id, delta) {
  const item = temporadaItems.find(i => i.id === id);
  if (item) {
    item.count = Math.max(0, (parseInt(item.count) || 0) + delta);
    const input = document.getElementById(`count-temp-${id}`);
    if (input) input.value = item.count;
    calculateTotal();
  }
}

function onInputTempCount(id) {
  const item = temporadaItems.find(i => i.id === id);
  if (item) {
    const val = parseInt(document.getElementById(`count-temp-${id}`).value);
    item.count = isNaN(val) || val < 0 ? 0 : val;
    calculateTotal();
  }
}

function setBolsa(val) {
  llevaBolsa = val;
  document.getElementById('bolsa-no').classList.toggle('active', !val);
  document.getElementById('bolsa-si').classList.toggle('active', val);
  calculateTotal();
}

function setMolido(pType, tipo) {
  molidoTipo = tipo;
  document.getElementById('molido-0').classList.toggle('active', tipo === 0);
  document.getElementById('molido-medio').classList.toggle('active', tipo === 'medio');
  document.getElementById('molido-kilo').classList.toggle('active', tipo === 'kilo');
  calculateTotal();
}

function renderTemporada() {
  const container = document.getElementById('temporada-container');
  container.innerHTML = '';

  temporadaItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="item-row">
        <div class="item-info">
          <div class="item-title">${item.name} <button class="btn-delete" onclick="deleteTemporadaItem(${item.id})">✕</button></div>
          <div class="item-price">$${item.price.toFixed(2)} c/u</div>
        </div>
        <div class="counter">
          <button class="btn-counter" onclick="adjustTempCount(${item.id}, -1)">-</button>
          <input type="number" id="count-temp-${item.id}" class="count-input" value="${item.count}" min="0" oninput="onInputTempCount(${item.id})" onfocus="this.select()">
          <button class="btn-counter" onclick="adjustTempCount(${item.id}, 1)">+</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  saveTemporadaState();
  calculateTotal();
}

function addTemporadaItem() {
  const nameInput = document.getElementById('new-temp-name');
  const priceInput = document.getElementById('new-temp-price');
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);

  if (name && !isNaN(price) && price > 0) {
    temporadaItems.push({ id: Date.now(), name: name, price: price, count: 0 });
    nameInput.value = '';
    priceInput.value = '';
    renderTemporada();
  }
}

function deleteTemporadaItem(id) {
  temporadaItems = temporadaItems.filter(i => i.id !== id);
  renderTemporada();
}

function saveTemporadaState() {
  const toSave = temporadaItems.map(i => ({ id: i.id, name: i.name, price: i.price, count: 0 }));
  localStorage.setItem('pan_temporada_v2', JSON.stringify(toSave));
}

function calculateTotal() {
  let total = 0;
  total += counts.dulce * basePrices.dulce;
  total += counts.torta * basePrices.torta;
  if (llevaBolsa) total += basePrices.bolsa;
  
  if (molidoTipo === 'medio') total += basePrices.molidoMedio;
  if (molidoTipo === 'kilo') total += basePrices.molidoKilo;

  temporadaItems.forEach(item => {
    total += (parseInt(item.count) || 0) * item.price;
  });

  document.getElementById('total-display').innerText = `$${total.toFixed(2)}`;
  calculateChange();
}

function setQuickPay(amount) {
  selectedQuickPay = amount;
  document.getElementById('pago-input').value = amount;
  
  const buttons = document.querySelectorAll('.btn-pay-quick');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.innerText === `$${amount}`);
  });

  calculateChange();
}

function onCustomPayInput() {
  selectedQuickPay = null;
  document.querySelectorAll('.btn-pay-quick').forEach(b => b.classList.remove('active'));
  calculateChange();
}

function calculateChange() {
  const totalStr = document.getElementById('total-display').innerText.replace('$', '');
  const total = parseFloat(totalStr) || 0;
  const pago = parseFloat(document.getElementById('pago-input').value) || 0;

  const cambioDisplay = document.getElementById('cambio-display');

  if (pago >= total && total > 0) {
    const cambio = pago - total;
    cambioDisplay.innerText = `Cambio: $${cambio.toFixed(2)}`;
    cambioDisplay.style.color = 'var(--success)';
  } else if (pago < total && pago > 0) {
    cambioDisplay.innerText = `Falta $${(total - pago).toFixed(2)}`;
    cambioDisplay.style.color = 'var(--danger)';
  } else {
    cambioDisplay.innerText = `$0.00`;
    cambioDisplay.style.color = '#94a3b8';
  }
}

function getCurrentSaleDetails() {
  const totalStr = document.getElementById('total-display').innerText.replace('$', '');
  const total = parseFloat(totalStr) || 0;

  let items = [];
  if (counts.dulce > 0) items.push({ name: `Pan de Dulce ($${basePrices.dulce})`, qty: counts.dulce, subtotal: counts.dulce * basePrices.dulce });
  if (counts.torta > 0) items.push({ name: `Pan de Torta ($${basePrices.torta})`, qty: counts.torta, subtotal: counts.torta * basePrices.torta });
  if (llevaBolsa) items.push({ name: 'Bolsa', qty: 1, subtotal: basePrices.bolsa });
  if (molidoTipo === 'medio') items.push({ name: 'Pan Molido 1/2kg', qty: 1, subtotal: basePrices.molidoMedio });
  if (molidoTipo === 'kilo') items.push({ name: 'Pan Molido 1kg', qty: 1, subtotal: basePrices.molidoKilo });

  temporadaItems.forEach(item => {
    if (item.count > 0) {
      items.push({ name: item.name, qty: item.count, subtotal: item.count * item.price });
    }
  });

  return { total, items, timestamp: new Date().toISOString() };
}

function saveSale() {
  const sale = getCurrentSaleDetails();

  if (sale.total <= 0) {
    showToast('⚠️ No hay nada seleccionado para cobrar');
    return;
  }

  salesHistory.push(sale);
  localStorage.setItem('pan_sales_history_v2', JSON.stringify(salesHistory));

  showToast(`✅ Venta de $${sale.total.toFixed(2)} guardada`);
  resetSale();
}

function resetSale() {
  counts.dulce = 0;
  counts.torta = 0;
  document.getElementById('count-dulce').value = '0';
  document.getElementById('count-torta').value = '0';

  setBolsa(false);
  setMolido(0, 0);

  temporadaItems.forEach(i => i.count = 0);
  document.getElementById('pago-input').value = '';
  selectedQuickPay = null;
  document.querySelectorAll('.btn-pay-quick').forEach(b => b.classList.remove('active'));

  renderTemporada();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function openSummaryModal() {
  const modal = document.getElementById('summary-modal');
  const sumCount = document.getElementById('sum-count');
  const sumTotal = document.getElementById('sum-total');
  const breakdownContainer = document.getElementById('summary-breakdown');

  let grandTotal = 0;
  let totalSalesCount = salesHistory.length;
  let breakdown = {};

  salesHistory.forEach(sale => {
    grandTotal += sale.total;
    sale.items.forEach(item => {
      if (!breakdown[item.name]) breakdown[item.name] = { qty: 0, money: 0 };
      breakdown[item.name].qty += item.qty;
      breakdown[item.name].money += item.subtotal;
    });
  });

  sumCount.innerText = totalSalesCount;
  sumTotal.innerText = `$${grandTotal.toFixed(2)}`;

  breakdownContainer.innerHTML = '';
  if (Object.keys(breakdown).length === 0) {
    breakdownContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 10px;">Aún no hay ventas guardadas hoy.</div>';
  } else {
    for (const [name, data] of Object.entries(breakdown)) {
      const row = document.createElement('div');
      row.className = 'summary-item-row';
      row.innerHTML = `<span><strong>${data.qty}x</strong> ${name}</span><span>$${data.money.toFixed(2)}</span>`;
      breakdownContainer.appendChild(row);
    }
  }

  modal.classList.add('active');
}

function closeSummaryModal() {
  document.getElementById('summary-modal').classList.remove('active');
}

function generateSummaryText() {
  let grandTotal = 0;
  let breakdown = {};

  salesHistory.forEach(sale => {
    grandTotal += sale.total;
    sale.items.forEach(item => {
      if (!breakdown[item.name]) breakdown[item.name] = 0;
      breakdown[item.name] += item.qty;
    });
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  let text = `🍞 *RESUMEN DE VENTAS - PANADERÍA*\n📅 ${dateStr}\n\n`;
  text += `💰 *Total Ganado:* $${grandTotal.toFixed(2)}\n`;
  text += `🧾 *Ventas Realizadas:* ${salesHistory.length}\n\n`;
  text += `*Desglose de productos vendidos:*\n`;

  if (Object.keys(breakdown).length === 0) {
    text += `- Ninguna venta registrada.\n`;
  } else {
    for (const [name, qty] of Object.entries(breakdown)) {
      text += `• ${name}: ${qty} pza(s)\n`;
    }
  }

  return text;
}

async function shareSummary() {
  const summaryText = generateSummaryText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Resumen de Ventas - Panadería',
        text: summaryText
      });
    } catch (err) {
      console.log('Compartir cancelado');
    }
  } else {
    navigator.clipboard.writeText(summaryText);
    alert('📋 Resumen copiado al portapapeles. Puedes pegarlo en WhatsApp o cualquier red social.');
  }
}

function clearSalesHistory() {
  if (confirm('¿Estás seguro de que deseas reiniciar el contador de ventas del día? Se borrará el historial actual.')) {
    salesHistory = [];
    localStorage.removeItem('pan_sales_history_v2');
    openSummaryModal();
    showToast('Historial reiniciado');
  }
}

updatePriceLabels();
renderTemporada();