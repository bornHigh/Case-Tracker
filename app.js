const STORAGE_KEY = 'caseflow_kpi_v1';

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
  archivesExpanded: true,
  kpiOrder: ['bonus', 'csat', 'aht', 'quality', 'crt'],
  panelOrder: ['panel-forms', 'panel-tables'],
  tabs: [
    {
      id: 'tab-1',
      name: getCurrentMonthLabel(0),
      startDate: initialRange.start,
      endDate: initialRange.end,
      archived: false,
      cases: [
        { id: 'CASE-1001', client: 'Nordic Retail', aht: 24.5, csat: 'Positive', crt: 'Saved', triage: 'Saved' },
        { id: 'CASE-1002', client: 'Veloce Tech', aht: 29.0, csat: 'Positive', crt: 'Saved', triage: 'Saved' },
        { id: 'CASE-1003', client: 'Atlas Logistics', aht: 31.0, csat: 'Positive', crt: 'Saved', triage: 'Saved' }
      ],
      qaAudits: [
        { id: 'CASE-1001', auditor: 'Sarah M.', score: 96 },
        { id: 'CASE-1002', auditor: 'David K.', score: 92 }
      ]
    }
  ]
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
let editingCaseIdx = null;
let editingQaIdx = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveTab() {
  const found = state.tabs.find(t => t.id === state.activeTabId);
  const tab = found ? found : state.tabs.at(0);
  if (!tab.qaAudits) tab.qaAudits = [];
  return tab;
}

function computeMetrics(tab) {
  const cases = tab.cases || [];
  const audits = tab.qaAudits || [];

  const validCsat = cases.filter(c => c.csat === 'Positive' || c.csat === 'Negative');
  const posCsat = validCsat.filter(c => c.csat === 'Positive').length;
  const csatPct = validCsat.length ? (posCsat / validCsat.length) * 100 : null;

  const validCrt = cases.filter(c => c.crt === 'Saved' || c.crt === 'Lost');
  const savedCrt = validCrt.filter(c => c.crt === 'Saved').length;
  const crtPct = validCrt.length ? (savedCrt / validCrt.length) * 100 : null;

  const validAht = cases.filter(c => typeof c.aht === 'number' && !isNaN(c.aht));
  const avgAht = validAht.length ? validAht.reduce((s, c) => s + c.aht, 0) / validAht.length : null;

  const validQual = audits.filter(q => typeof q.score === 'number' && !isNaN(q.score));
  const avgQual = validQual.length ? validQual.reduce((s, q) => s + q.score, 0) / validQual.length : null;

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
function makeMonthButton(t, activeId) {
  const btn = makeEl('button', 'month-btn' + (t.id === activeId ? ' active' : ''));
  btn.type = 'button';
  btn.onclick = () => {
    editingCaseIdx = null;
    editingQaIdx = null;
    state.activeTabId = t.id;
    saveState();
    render();
  };

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
  return btn;
}

function renderSidebarAndCards(tab, m) {
  const activeSlot = document.getElementById('activeMonthSlot');
  const archivedList = document.getElementById('archivedMonthsList');
  clearEl(activeSlot);
  clearEl(archivedList);

  const activeTabs = state.tabs.filter(t => !t.archived);
  const archivedTabs = state.tabs.filter(t => t.archived);

  activeTabs.forEach(t => activeSlot.appendChild(makeMonthButton(t, tab.id)));
  archivedTabs.forEach(t => archivedList.appendChild(makeMonthButton(t, tab.id)));

  document.getElementById('archiveCount').textContent = archivedTabs.length;
  document.getElementById('archiveArrow').textContent = state.archivesExpanded ? '▾' : '▸';
  archivedList.classList.toggle('collapsed', !state.archivesExpanded);

  document.getElementById('periodTitle').textContent = tab.name;
  const startInput = document.getElementById('startDateInput');
  const endInput = document.getElementById('endDateInput');
  startInput.value = tab.startDate || '';
  endInput.value = tab.endDate || '';
  startInput.disabled = tab.archived;
  endInput.disabled = tab.archived;

  document.getElementById('activeMonthBadge').textContent = tab.name;
  document.getElementById('qaAvgPill').textContent = m.avgQual !== null ? `Avg: ${m.avgQual.toFixed(1)}%` : 'Avg: —';
  document.getElementById('archivedBanner').classList.toggle('show', tab.archived);
  document.getElementById('submitCaseBtn').disabled = tab.archived;
  document.getElementById('submitQaBtn').disabled = tab.archived;
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
      title: 'Quality Score (QA)',
      value: m.avgQual !== null ? `${m.avgQual.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.qualBonus} (${tab.qaAudits.length} audits)`,
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
}

function buildSelect(options, currentVal) {
  const sel = makeEl('select', 'inline-input');
  options.forEach(opt => {
    const o = makeEl('option', '', opt);
    o.value = opt;
    if (opt === currentVal) o.selected = true;
    sel.appendChild(o);
  });
  return sel;
}

function renderTables(tab) {
  document.getElementById('caseCountLabel').textContent = `${tab.cases.length} cases logged`;
  const tbody = document.getElementById('caseTableBody');
  clearEl(tbody);

  if (!tab.cases.length) {
    const tr = makeEl('tr');
    const td = makeEl('td', 'muted-text', `No cases logged for ${tab.name} yet.`);
    td.colSpan = 7;
    td.style.textAlign = 'center';
    td.style.padding = '22px';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    tab.cases.forEach((c, idx) => {
      const tr = makeEl('tr');
      if (!tab.archived && editingCaseIdx === idx) {
        const inId = makeEl('input', 'inline-input'); inId.value = c.id;
        const inClient = makeEl('input', 'inline-input'); inClient.value = c.client || '';
        const inAht = makeEl('input', 'inline-input'); inAht.type = 'number'; inAht.step = '0.1'; inAht.value = c.aht;
        const selCsat = buildSelect(['Positive', 'Negative', 'Pending'], c.csat);
        const selCrt = buildSelect(['Saved', 'Lost', 'N/A'], c.crt);
        const selTri = buildSelect(['Saved', 'Lost', 'N/A'], c.triage);

        const tdAct = makeEl('td', 'text-right');
        const grp = makeEl('div', 'action-group');
        const saveBtn = makeEl('button', 'btn-save', '✓');
        saveBtn.type = 'button';
        saveBtn.onclick = () => {
          tab.cases.splice(idx, 1, {
            id: inId.value.trim() || c.id,
            client: inClient.value.trim() || '—',
            aht: parseFloat(inAht.value) || 0,
            csat: selCsat.value,
            crt: selCrt.value,
            triage: selTri.value
          });
          editingCaseIdx = null;
          saveState();
          render();
        };
        const cancelBtn = makeEl('button', 'btn-icon', '✕');
        cancelBtn.type = 'button';
        cancelBtn.onclick = () => { editingCaseIdx = null; render(); };
        grp.appendChild(saveBtn);
        grp.appendChild(cancelBtn);
        tdAct.appendChild(grp);

        [inId, inClient, inAht, selCsat, selCrt, selTri].forEach(el => {
          const td = makeEl('td'); td.appendChild(el); tr.appendChild(td);
        });
        tr.appendChild(tdAct);
      } else {
        const tdId = makeEl('td', '', c.id); tdId.style.fontWeight = '600';
        const tdClient = makeEl('td', '', c.client || '—');
        const tdAht = makeEl('td', c.aht > 32 ? 'txt-red' : '', `${c.aht}m`);
        const tdCsat = makeEl('td');
        const tagClass = c.csat === 'Positive' ? 'tag-pos' : c.csat === 'Negative' ? 'tag-neg' : 'tag-neu';
        tdCsat.appendChild(makeEl('span', 'status-tag ' + tagClass, c.csat));
        const tdCrt = makeEl('td', '', c.crt);
        const tdTri = makeEl('td', '', c.triage);

        const tdAct = makeEl('td', 'text-right');
        if (tab.archived) {
          tdAct.appendChild(makeEl('span', 'muted-text', 'Locked'));
        } else {
          const grp = makeEl('div', 'action-group');
          const editBtn = makeEl('button', 'btn-icon', '✏️');
          editBtn.type = 'button';
          editBtn.title = 'Edit Entry';
          editBtn.onclick = () => { editingCaseIdx = idx; render(); };

          const delBtn = makeEl('button', 'btn-del', 'Remove');
          delBtn.type = 'button';
          delBtn.onclick = () => { tab.cases.splice(idx, 1); saveState(); render(); };

          grp.appendChild(editBtn);
          grp.appendChild(delBtn);
          tdAct.appendChild(grp);
        }
        [tdId, tdClient, tdAht, tdCsat, tdCrt, tdTri, tdAct].forEach(td => tr.appendChild(td));
      }
      tbody.appendChild(tr);
    });
  }

  // Render QA Audits Table
  document.getElementById('qaCountLabel').textContent = `${tab.qaAudits.length} audits logged`;
  const qaBody = document.getElementById('qaTableBody');
  clearEl(qaBody);

  if (!tab.qaAudits.length) {
    const tr = makeEl('tr');
    const td = makeEl('td', 'muted-text', 'No QA audits logged yet (does not penalize bonus).');
    td.colSpan = 4;
    td.style.textAlign = 'center';
    td.style.padding = '20px';
    tr.appendChild(td);
    qaBody.appendChild(tr);
  } else {
    tab.qaAudits.forEach((q, idx) => {
      const tr = makeEl('tr');
      if (!tab.archived && editingQaIdx === idx) {
        const inId = makeEl('input', 'inline-input'); inId.value = q.id;
        const inAud = makeEl('input', 'inline-input'); inAud.value = q.auditor;
        const inScore = makeEl('input', 'inline-input'); inScore.type = 'number'; inScore.step = '0.1'; inScore.value = q.score;

        const tdAct = makeEl('td', 'text-right');
        const grp = makeEl('div', 'action-group');
        const saveBtn = makeEl('button', 'btn-save', '✓');
        saveBtn.type = 'button';
        saveBtn.onclick = () => {
          tab.qaAudits.splice(idx, 1, {
            id: inId.value.trim() || q.id,
            auditor: inAud.value.trim() || q.auditor,
            score: parseFloat(inScore.value) || 0
          });
          editingQaIdx = null;
          saveState();
          render();
        };
        const cancelBtn = makeEl('button', 'btn-icon', '✕');
        cancelBtn.type = 'button';
        cancelBtn.onclick = () => { editingQaIdx = null; render(); };
        grp.appendChild(saveBtn);
        grp.appendChild(cancelBtn);
        tdAct.appendChild(grp);

        [inId, inAud, inScore].forEach(el => {
          const td = makeEl('td'); td.appendChild(el); tr.appendChild(td);
        });
        tr.appendChild(tdAct);
} else {
const tdId = makeEl('td', '', q.id); tdId.style.fontWeight = '600';
const tdAud = makeEl('td', '', q.auditor);
const tdScore = makeEl('td', q.score >= 90 ? 'txt-green' : 'txt-amber', ${q.score}%);
const tdAct = makeEl('td', 'text-right');
if (tab.archived) {
tdAct.appendChild(makeEl('span', 'muted-text', 'Locked'));
} else {
const grp = makeEl('div', 'action-group');
const editBtn = makeEl('button', 'btn-icon', '✏️');
editBtn.type = 'button';
editBtn.onclick = () => { editingQaIdx = idx; render(); };
const delBtn = makeEl('button', 'btn-del', 'Remove');
delBtn.type = 'button';
delBtn.onclick = () => { tab.qaAudits.splice(idx, 1); saveState(); render(); };
grp.appendChild(editBtn);
grp.appendChild(delBtn);
tdAct.appendChild(grp);
}
[tdId, tdAud, tdScore, tdAct].forEach(td => tr.appendChild(td));
}
qaBody.appendChild(tr);
});
}
}
function render() {
  const tab = getActiveTab();
  const m = computeMetrics(tab);
  renderSidebarAndCards(tab, m);

  const panelsContainer = document.getElementById('panelsContainer');
  state.panelOrder.forEach(id => {
    const el = document.getElementById(id);
    if (el) panelsContainer.appendChild(el);
  });

  renderTables(tab);
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
    tab.cases.unshift({
      id: document.getElementById('caseId').value.trim(),
      client: document.getElementById('clientNameInput').value.trim(),
      aht: parseFloat(document.getElementById('ahtInput').value),
      csat: document.getElementById('csatInput').value,
      crt: document.getElementById('crtInput').value,
      triage: document.getElementById('triageInput').value
    });
    e.target.reset();
    saveState();
    render();
  });

  document.getElementById('qaForm').addEventListener('submit', e => {
    e.preventDefault();
    const tab = getActiveTab();
    if (tab.archived) return;
    tab.qaAudits.unshift({
      id: document.getElementById('qaCaseId').value.trim(),
      auditor: document.getElementById('qaAuditorInput').value.trim(),
      score: parseFloat(document.getElementById('qaScoreInput').value)
    });
    e.target.reset();
    saveState();
    render();
  });

  document.getElementById('toggleArchivesBtn').addEventListener('click', () => {
    state.archivesExpanded = !state.archivesExpanded;
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
    editingCaseIdx = null;
    editingQaIdx = null;
    const newId = 'tab-' + Date.now();
    state.tabs.unshift({
      id: newId,
      name: nextName.trim(),
      startDate: customStart.trim(),
      endDate: customEnd.trim(),
      archived: false,
      cases: [],
      qaAudits: []
    });
    state.activeTabId = newId;
    saveState();
    render();
  });

  document.getElementById('returnActiveBtn').addEventListener('click', () => {
    const active = state.tabs.find(t => !t.archived);
    if (active) {
      editingCaseIdx = null;
      editingQaIdx = null;
      state.activeTabId = active.id;
      saveState();
      render();
    }
  });

  document.getElementById('resetLayoutBtn').addEventListener('click', () => {
    state.kpiOrder = ['bonus', 'csat', 'aht', 'quality', 'crt'];
    state.panelOrder = ['panel-forms', 'panel-tables'];
    saveState();
    render();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    const headers = ['Case ID', 'Client', 'AHT', 'CSAT', 'CRT NE', 'Triage'];
    const rows = tab.cases.map(c => [c.id, c.client || '', c.aht, c.csat, c.crt, c.triage]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab.name.replace(/\s+/g, '_')}_CaseFlow_Log.csv`;
    a.click();
  });

  render();
});
