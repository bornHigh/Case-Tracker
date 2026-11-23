const STORAGE_KEY = 'pulse_kpi_final_v1';

function getCurrentMonthLabel(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function getDefaultDateRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
  };
}

const initialRange = getDefaultDateRange();

const defaultState = {
  activeTabId: 'tab-1',
  kpiOrder: ['bonus', 'csat', 'aht', 'quality', 'crt'],
  panelOrder: ['panel-entry', 'panel-table'],
  tabs: [
    {
      id: 'tab-1',
      name: getCurrentMonthLabel(0),
      startDate: initialRange.start,
      endDate: initialRange.end,
      archived: false,
      cases: [
        { id: 'CASE-1001', aht: 24.5, csat: 'Positive', crt: 'Saved', triage: 'Saved', quality: 95 },
        { id: 'CASE-1002', aht: 29.0, csat: 'Positive', crt: 'Saved', triage: 'Saved', quality: 92 },
        { id: 'CASE-1003', aht: 31.0, csat: 'Positive', crt: 'Saved', triage: 'Saved', quality: 94 }
      ]
    }
  ]
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveTab() {
  const found = state.tabs.find(t => t.id === state.activeTabId);
  return found ? found : state.tabs.at(0);
}

function computeMetrics(cases) {
  const validCsat = cases.filter(c => c.csat === 'Positive' || c.csat === 'Negative');
  const posCsat = validCsat.filter(c => c.csat === 'Positive').length;
  const csatPct = validCsat.length ? (posCsat / validCsat.length) * 100 : null;

  const validCrt = cases.filter(c => c.crt === 'Saved' || c.crt === 'Lost');
  const savedCrt = validCrt.filter(c => c.crt === 'Saved').length;
  const crtPct = validCrt.length ? (savedCrt / validCrt.length) * 100 : null;

  const validAht = cases.filter(c => typeof c.aht === 'number' && !isNaN(c.aht));
  const avgAht = validAht.length ? validAht.reduce((s, c) => s + c.aht, 0) / validAht.length : null;

  const validQual = cases.filter(c => typeof c.quality === 'number' && !isNaN(c.quality));
  const avgQual = validQual.length ? validQual.reduce((s, c) => s + c.quality, 0) / validQual.length : null;

  let csatBonus = 0;
  if (csatPct !== null) {
    if (csatPct >= 94) csatBonus = 180;
    else if (csatPct >= 89) csatBonus = 100;
  }

  const crtBonus = (crtPct !== null && crtPct >= 94) ? 80 : 0;
  const qualBonus = (avgQual !== null && avgQual >= 90) ? 40 : 0;

  let subtotal = csatBonus + crtBonus + qualBonus;
  let penalty = 0;
  let forfeited = false;

  if (csatPct !== null && csatPct < 75) {
    forfeited = true;
    subtotal = 0;
  } else if (avgAht !== null && avgAht > 32) {
    penalty = 50;
    subtotal = Math.max(0, subtotal - penalty);
  }

  return { csatPct, csatBonus, crtPct, crtBonus, avgAht, penalty, avgQual, qualBonus, totalBonus: subtotal, forfeited };
}

function clearEl(el) {
  while (el && el.firstChild) el.removeChild(el.firstChild);
}

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function render() {
  const tab = getActiveTab();
  const m = computeMetrics(tab.cases);

  const monthList = document.getElementById('monthTabsList');
  clearEl(monthList);
  state.tabs.forEach(t => {
    const btn = makeEl('button', 'month-btn' + (t.id === tab.id ? ' active' : ''));
    btn.type = 'button';
    btn.onclick = () => { state.activeTabId = t.id; saveState(); render(); };

    const left = makeEl('div');
    const title = makeEl('div', '', t.name);
    title.style.fontWeight = '600';
    const sub = makeEl('div', '', `${t.startDate || ''} to ${t.endDate || ''}`);
    sub.style.fontSize = '10px';
    sub.style.opacity = '0.8';
    left.appendChild(title);
    left.appendChild(sub);

    const badge = makeEl('span', 'badge ' + (t.archived ? 'badge-archived' : 'badge-active'), t.archived ? 'Archived' : 'Active');
    btn.appendChild(left);
    btn.appendChild(badge);
    monthList.appendChild(btn);
  });

  document.getElementById('periodTitle').textContent = tab.name;
  const startInput = document.getElementById('startDateInput');
  const endInput = document.getElementById('endDateInput');
  startInput.value = tab.startDate || '';
  endInput.value = tab.endDate || '';
  startInput.disabled = tab.archived;
  endInput.disabled = tab.archived;

  document.getElementById('activeMonthBadge').textContent = tab.name;
  document.getElementById('archivedBanner').classList.toggle('show', tab.archived);
  document.getElementById('submitCaseBtn').disabled = tab.archived;
  document.getElementById('archiveBtn').disabled = tab.archived;

  const cardsData = {
    bonus: {
      title: 'Real-Time Bonus Payout',
      value: `€${m.totalBonus}`,
      sub: m.forfeited ? 'Forfeited (CSAT below 75%)' : m.penalty > 0 ? '-€50 AHT penalty applied' : 'Max Pool: €300',
      color: m.forfeited ? 'txt-red' : 'txt-green'
    },
    csat: {
      title: 'CSAT Score',
      value: m.csatPct !== null ? `${m.csatPct.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.csatBonus} (Target 94%+)`,
      color: m.csatPct === null ? '' : m.csatPct >= 94 ? 'txt-green' : m.csatPct < 75 ? 'txt-red' : 'txt-amber'
    },
    aht: {
      title: 'Average AHT',
      value: m.avgAht !== null ? `${m.avgAht.toFixed(1)}m` : '—',
      sub: m.avgAht !== null && m.avgAht > 32 ? 'Over 32m (-€50)' : 'Limit: 32.0 mins max',
      color: m.avgAht !== null && m.avgAht > 32 ? 'txt-red' : 'txt-sky'
    },
    quality: {
      title: 'Quality Score',
      value: m.avgQual !== null ? `${m.avgQual.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.qualBonus} (Target 90%+)`,
      color: m.avgQual !== null && m.avgQual >= 90 ? 'txt-green' : ''
    },
    crt: {
      title: 'CRT NE Rate',
      value: m.crtPct !== null ? `${m.crtPct.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.crtBonus} (Target 94%+)`,
      color: m.crtPct !== null && m.crtPct >= 94 ? 'txt-green' : ''
    }
  };

  const kpiGrid = document.getElementById('kpiGrid');
  clearEl(kpiGrid);
  state.kpiOrder.forEach(key => {
    const c = cardsData[key];
    const card = makeEl('div', 'kpi-card');
    card.dataset.kpi = key;
    card.draggable = true;

    const top = makeEl('div', 'kpi-top');
    top.appendChild(makeEl('span', '', c.title));
    top.appendChild(makeEl('span', 'grip', '⋮⋮'));

    card.appendChild(top);
    card.appendChild(makeEl('div', 'kpi-value ' + c.color, c.value));
    card.appendChild(makeEl('div', 'kpi-sub', c.sub));
    kpiGrid.appendChild(card);
  });

  const panelsContainer = document.getElementById('panelsContainer');
  state.panelOrder.forEach(id => {
    const el = document.getElementById(id);
    if (el) panelsContainer.appendChild(el);
  });

  document.getElementById('caseCountLabel').textContent = `${tab.cases.length} cases logged`;
  const tbody = document.getElementById('caseTableBody');
  clearEl(tbody);

  if (!tab.cases.length) {
    const tr = makeEl('tr');
    const td = makeEl('td', '', `No cases logged for ${tab.name} yet.`);
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '28px';
    td.style.color = 'var(--text-muted)';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    tab.cases.forEach((c, idx) => {
      const tr = makeEl('tr');
      const tdId = makeEl('td', '', c.id);
      tdId.style.fontWeight = '600';
      const tdAht = makeEl('td', c.aht > 32 ? 'txt-red' : '', `${c.aht}m`);
      const tdCsat = makeEl('td');
      const tagClass = c.csat === 'Positive' ? 'tag-pos' : c.csat === 'Negative' ? 'tag-neg' : 'tag-neu';
      tdCsat.appendChild(makeEl('span', 'status-tag ' + tagClass, c.csat));
      const tdCrt = makeEl('td', '', c.crt);
      const tdTriage = makeEl('td', '', c.triage);
      const tdQual = makeEl('td', '', c.quality !== null ? `${c.quality}%` : '—');
      const tdAct = makeEl('td', 'text-right');
      if (tab.archived) {
        tdAct.appendChild(makeEl('span', 'muted-text', 'Locked'));
      } else {
        const delBtn = makeEl('button', 'btn-del', 'Remove');
        delBtn.type = 'button';
        delBtn.onclick = () => { tab.cases.splice(idx, 1); saveState(); render(); };
        tdAct.appendChild(delBtn);
      }
      tr.appendChild(tdId);
      tr.appendChild(tdAht);
      tr.appendChild(tdCsat);
      tr.appendChild(tdCrt);
      tr.appendChild(tdTriage);
      tr.appendChild(tdQual);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });
  }
  bindDragAndDrop();
}
function bindDragAndDrop() {
  let draggedKpi = null;
  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('dragstart', () => { draggedKpi = card.dataset.kpi; card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetKpi = card.dataset.kpi;
      if (draggedKpi && draggedKpi !== targetKpi) {
        const from = state.kpiOrder.indexOf(draggedKpi);
        const to = state.kpiOrder.indexOf(targetKpi);
        state.kpiOrder.splice(from, 1);
        state.kpiOrder.splice(to, 0, draggedKpi);
        saveState();
        render();
      }
    });
  });

  let draggedPanel = null;
  document.querySelectorAll('.workspace-panel').forEach(panel => {
    panel.addEventListener('dragstart', e => { if (e.target !== panel) return; draggedPanel = panel.id; panel.classList.add('dragging'); });
    panel.addEventListener('dragend', () => panel.classList.remove('dragging'));
    panel.addEventListener('dragover', e => { e.preventDefault(); panel.classList.add('drag-over'); });
    panel.addEventListener('dragleave', () => panel.classList.remove('drag-over'));
    panel.addEventListener('drop', e => {
      e.preventDefault();
      panel.classList.remove('drag-over');
      if (draggedPanel && draggedPanel !== panel.id) {
        state.panelOrder.reverse();
        saveState();
        render();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('caseForm').addEventListener('submit', e => {
    e.preventDefault();
    const tab = getActiveTab();
    if (tab.archived) return;
    const qualRaw = document.getElementById('qualityInput').value;
    tab.cases.unshift({
      id: document.getElementById('caseId').value.trim(),
      aht: parseFloat(document.getElementById('ahtInput').value),
      csat: document.getElementById('csatInput').value,
      crt: document.getElementById('crtInput').value,
      triage: document.getElementById('triageInput').value,
      quality: qualRaw === '' ? null : parseFloat(qualRaw)
    });
    e.target.reset();
    saveState();
    render();
  });

  document.getElementById('startDateInput').addEventListener('change', e => {
    const tab = getActiveTab();
    if (!tab.archived) { tab.startDate = e.target.value; saveState(); render(); }
  });

  document.getElementById('endDateInput').addEventListener('change', e => {
    const tab = getActiveTab();
    if (!tab.archived) { tab.endDate = e.target.value; saveState(); render(); }
  });

  document.getElementById('archiveBtn').addEventListener('click', () => {
    const current = getActiveTab();
    if (current.archived) return;
    const nextName = prompt('Enter name for the new monthly tab:', getCurrentMonthLabel(state.tabs.length));
    if (!nextName) return;
    const range = getDefaultDateRange();
    const customStart = prompt('Start Date (YYYY-MM-DD):', range.start) || range.start;
    const customEnd = prompt('End Date (YYYY-MM-DD):', range.end) || range.end;
    current.archived = true;
    const newId = 'tab-' + Date.now();
    state.tabs.unshift({
      id: newId,
      name: nextName.trim(),
      startDate: customStart.trim(),
      endDate: customEnd.trim(),
      archived: false,
      cases: []
    });
    state.activeTabId = newId;
    saveState();
    render();
  });

  document.getElementById('returnActiveBtn').addEventListener('click', () => {
    const active = state.tabs.find(t => !t.archived);
    if (active) { state.activeTabId = active.id; saveState(); render(); }
  });

  document.getElementById('resetLayoutBtn').addEventListener('click', () => {
    state.kpiOrder = ['bonus', 'csat', 'aht', 'quality', 'crt'];
    state.panelOrder = ['panel-entry', 'panel-table'];
    saveState();
    render();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    const headers = ['Case ID', 'AHT', 'CSAT', 'CRT NE', 'Triage', 'Quality'];
    const rows = tab.cases.map(c => [c.id, c.aht, c.csat, c.crt, c.triage, c.quality ?? '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab.name.replace(/\s+/g, '_')}_KPI_Log.csv`;
    a.click();
  });

  render();
});
