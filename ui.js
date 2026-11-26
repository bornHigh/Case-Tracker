const LEAF_THEMES = [
  { core: '#a855f7', tip: '#fbbf24', glow: 'rgba(168, 85, 247, 0.95)' },
  { core: '#38bdf8', tip: '#a855f7', glow: 'rgba(56, 189, 248, 0.95)' },
  { core: '#10b981', tip: '#fde047', glow: 'rgba(16, 185, 129, 0.95)' },
  { core: '#ec4899', tip: '#fbbf24', glow: 'rgba(236, 72, 153, 0.95)' },
  { core: '#f59e0b', tip: '#fef08a', glow: 'rgba(245, 158, 11, 0.95)' }
];

let cachedStaticLeafUrl = null;
let staticLeafBuilding = false;
const staticLeafWaiters = [];
const activeLeafPlayers = {};

function keyAlphaFrame(ctx, w, h) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    const peak = Math.max(d[i], d[i + 1], d[i + 2]);
    if (peak <= 14) {
      d[i + 3] = 0;
    } else if (peak < 110) {
      const t = (peak - 14) / 96;
      d[i + 3] = Math.round(Math.pow(t, 1.35) * 255);
    } else {
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(frame, 0, 0);
}

function getStaticLeafSnapshot(cb) {
  if (cachedStaticLeafUrl) return cb(cachedStaticLeafUrl);
  staticLeafWaiters.push(cb);
  if (staticLeafBuilding) return;
  staticLeafBuilding = true;

  const vid = document.createElement('video');
  vid.src = './wallpapers/Leaf-active.mp4';
  vid.muted = true;
  vid.playsInline = true;
  vid.addEventListener('loadeddata', () => { vid.currentTime = 0.12; }, { once: true });
  vid.addEventListener('seeked', () => {
    const w = Math.max(vid.videoWidth || 360, 360);
    const h = Math.max(vid.videoHeight || 360, 360);
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(vid, 0, 0, w, h);
    keyAlphaFrame(ctx, w, h);
    cachedStaticLeafUrl = off.toDataURL('image/png');
    staticLeafBuilding = false;
    while (staticLeafWaiters.length) staticLeafWaiters.shift()(cachedStaticLeafUrl);
  }, { once: true });
}

let cachedLeafPng = null;

function getActiveLeafCanvas(railId) {
  if (activeLeafPlayers[railId]) return activeLeafPlayers[railId].canvas;
  const canvas = makeEl('canvas', 'leaf-video');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const vid = document.createElement('video');
  vid.src = './wallpapers/Leaf-active.mp4';
  vid.muted = true; vid.playsInline = true; vid.loop = true;

  const player = { canvas, vid, running: false };
  activeLeafPlayers[railId] = player;

  const loop = () => {
    if (!player.running) return;
    if (vid.readyState >= 2 && vid.videoWidth > 0) {
      if (canvas.width !== vid.videoWidth || canvas.height !== vid.videoHeight) {
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
      }
      ctx.filter = 'blur(0.45px) contrast(1.08)';
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      keyAlphaFrame(ctx, canvas.width, canvas.height);
      if (!cachedLeafPng && vid.currentTime > 0.05) {
        cachedLeafPng = canvas.toDataURL('image/png');
        document.querySelectorAll('img.leaf-static').forEach(img => { img.src = cachedLeafPng; });
      }
    }
    requestAnimationFrame(loop);
  };

  player.start = () => {
    if (vid.paused) vid.play().catch(() => {});
    if (!player.running) { player.running = true; requestAnimationFrame(loop); }
  };
  player.start();
  return canvas;
}

function renderLeafRail(railId, totalItems, pageSize, currentPage, onSelect) {
  const rail = document.getElementById(railId);
  if (!rail) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  while (rail.children.length > totalPages) rail.removeChild(rail.lastChild);

  const activeCanvas = getActiveLeafCanvas(railId);

  for (let p = 0; p < totalPages; p++) {
    const isActive = p === currentPage;
    let leaf = rail.children[p];
    if (!leaf) {
      leaf = makeEl('button', 'leaf-btn');
      leaf.type = 'button';
      rail.appendChild(leaf);
    }
    leaf.className = 'leaf-btn' + (isActive ? ' active' : '');
    leaf.onclick = () => { if (p !== currentPage) onSelect(p); };

    if (isActive) {
      if (leaf.firstChild !== activeCanvas) { clearEl(leaf); leaf.appendChild(activeCanvas); }
      activeLeafPlayers[railId].start();
    } else if (!leaf.querySelector('img.leaf-static')) {
      clearEl(leaf);
      const img = makeEl('img', 'leaf-video leaf-static');
      img.alt = `Page ${p + 1}`;
      if (cachedLeafPng) img.src = cachedLeafPng;
      leaf.appendChild(img);
    }
  }
}

function makeMonthButton(t, activeId) {
  const btn = makeEl('button', 'month-btn' + (t.id === activeId ? ' active' : ''));
  btn.type = 'button';
  btn.onclick = () => {
    casePage = 0; qaPage = 0; editingCaseIdx = null; editingQaIdx = null; expandedRemarkIdx = null;
    state.activeTabId = t.id;
    saveState();
    render();
  };

  const left = makeEl('div');
  const title = makeEl('div', '', t.name);
  title.style.fontWeight = '600';
  const sub = makeEl('div', '', `${t.startDate || ''} to ${t.endDate || ''}`);
  sub.style.fontSize = '10px';
  sub.style.opacity = '0.85';
  left.appendChild(title);
  left.appendChild(sub);

  const badge = makeEl('span', 'badge ' + (t.archived ? 'badge-archived' : 'badge-active'), t.archived ? 'Archived' : 'Active');
  btn.appendChild(left);
  btn.appendChild(badge);
  return btn;
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
    bonus: { title: 'Real-Time Bonus Payout', value: `€${m.totalBonus}`, sub: m.forfeited ? 'Forfeited (CSAT <75%)' : m.penalty > 0 ? '-€50 AHT penalty' : 'Max Pool: €300', color: m.forfeited ? 'txt-red' : 'txt-green' },
    csat: { title: 'CSAT Score', value: m.csatPct !== null ? `${m.csatPct.toFixed(1)}%` : '—', sub: `Bonus: +€${m.csatBonus} (Target 94%+)`, color: m.csatPct === null ? '' : m.csatPct >= 94 ? 'txt-green' : m.csatPct < 75 ? 'txt-red' : 'txt-amber' },
    aht: { title: 'Average AHT', value: m.avgAht !== null ? `${m.avgAht.toFixed(1)}m` : '—', sub: m.avgAht !== null && m.avgAht > 32 ? 'Over 32m (-€50)' : 'Limit: 32.0 mins max', color: m.avgAht !== null && m.avgAht > 32 ? 'txt-red' : 'txt-sky' },
    quality: { title: 'Quality Score (QA)', value: m.avgQual !== null ? `${m.avgQual.toFixed(1)}%` : '—', sub: `Bonus: +€${m.qualBonus} (${tab.qaAudits.length} monits)`, color: m.avgQual !== null && m.avgQual >= 90 ? 'txt-green' : '' },
    crt: { title: 'CRT NE Rate', value: m.crtPct !== null ? `${m.crtPct.toFixed(1)}%` : '—', sub: `Bonus: +€${m.crtBonus} (Target 94%+)`, color: m.crtPct !== null && m.crtPct >= 94 ? 'txt-green' : '' }
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
function renderCaseTable(tab) {
  const totalPages = Math.max(1, Math.ceil(tab.cases.length / CASE_PAGE_SIZE));
  if (casePage >= totalPages) casePage = totalPages - 1;

  renderLeafRail('caseLeafRail', tab.cases.length, CASE_PAGE_SIZE, casePage, p => {
    casePage = p; editingCaseIdx = null; expandedRemarkIdx = null; render();
  });

  const tbody = document.getElementById('caseTableBody');
  clearEl(tbody);

  if (!tab.cases.length) {
    const tr = makeEl('tr');
    const td = makeEl('td', 'muted-text', `No cases logged for ${tab.name} yet.`);
    td.colSpan = 7; td.style.textAlign = 'center'; td.style.padding = '24px';
    tr.appendChild(td); tbody.appendChild(tr); return;
  }

  const start = casePage * CASE_PAGE_SIZE;
  tab.cases.slice(start, start + CASE_PAGE_SIZE).forEach((c, localIdx) => {
    const globalIdx = start + localIdx;
    const tr = makeEl('tr');

    if (!tab.archived && editingCaseIdx === globalIdx) {
      const inId = makeEl('input', 'inline-input'); inId.value = c.id;
      const inClient = makeEl('input', 'inline-input'); inClient.value = c.client || '';
      const inAht = makeEl('input', 'inline-input'); inAht.type = 'number'; inAht.step = '0.1'; inAht.value = c.aht;
      const selCsat = buildSelect(['Positive', 'Negative', 'Pending'], c.csat);
      const selCrt = buildSelect(['Saved', 'Lost', 'N/A'], c.crt);
      const selTri = buildSelect(['Saved', 'Lost', 'N/A'], c.triage);

      const tdAct = makeEl('td', 'text-right');
      const grp = makeEl('div', 'action-group');
      const saveBtn = makeEl('button', 'btn-save', '✓'); saveBtn.type = 'button';
      saveBtn.onclick = () => {
        tab.cases.splice(globalIdx, 1, {
          id: inId.value.trim() || c.id, client: inClient.value.trim() || '—',
          aht: parseFloat(inAht.value) || 0, csat: selCsat.value, crt: selCrt.value, triage: selTri.value, remark: c.remark || ''
        });
        editingCaseIdx = null; saveState(); render();
      };
      const cancelBtn = makeEl('button', 'btn-icon', '✕'); cancelBtn.type = 'button';
      cancelBtn.onclick = () => { editingCaseIdx = null; render(); };
      grp.appendChild(saveBtn); grp.appendChild(cancelBtn); tdAct.appendChild(grp);

      [inId, inClient, inAht, selCsat, selCrt, selTri].forEach(el => { const td = makeEl('td'); td.appendChild(el); tr.appendChild(td); });
      tr.appendChild(tdAct);
    } else {
      const tdId = makeEl('td', '', c.id); tdId.style.fontWeight = '700';
      const tdClient = makeEl('td', '', c.client || '—');
      const tdAht = makeEl('td', c.aht > 32 ? 'txt-red' : '', `${c.aht}m`);
      const tdCsat = makeEl('td');
      const tagClass = c.csat === 'Positive' ? 'tag-pos' : c.csat === 'Negative' ? 'tag-neg' : 'tag-neu';
      tdCsat.appendChild(makeEl('span', 'status-tag ' + tagClass, c.csat));
      const tdCrt = makeEl('td', '', c.crt);
      const tdTri = makeEl('td', '', c.triage);

      const tdAct = makeEl('td', 'text-right');
      const grp = makeEl('div', 'action-group');
      const hasNote = c.remark && c.remark.trim().length > 0;
      const noteBtn = makeEl('button', 'btn-icon' + (hasNote ? ' has-note' : ''), '💬');
      noteBtn.type = 'button';
      noteBtn.onclick = () => { expandedRemarkIdx = (expandedRemarkIdx === globalIdx) ? null : globalIdx; render(); };
      grp.appendChild(noteBtn);

      if (!tab.archived) {
        const editBtn = makeEl('button', 'btn-icon', '✏️'); editBtn.type = 'button';
        editBtn.onclick = () => { editingCaseIdx = globalIdx; render(); };
        const delBtn = makeEl('button', 'btn-del', '✕'); delBtn.type = 'button';
        delBtn.onclick = () => { tab.cases.splice(globalIdx, 1); saveState(); render(); };
        grp.appendChild(editBtn); grp.appendChild(delBtn);
      }
      tdAct.appendChild(grp);
      [tdId, tdClient, tdAht, tdCsat, tdCrt, tdTri, tdAct].forEach(td => tr.appendChild(td));
    }
    tbody.appendChild(tr);

    if (expandedRemarkIdx === globalIdx) {
      const rTr = makeEl('tr', 'remark-drawer-row');
      const rTd = makeEl('td'); rTd.colSpan = 7;
      const box = makeEl('div', 'remark-drawer-box');
      const area = makeEl('textarea'); area.placeholder = 'Write case remarks here...'; area.value = c.remark || ''; area.disabled = tab.archived;
      box.appendChild(area);
      if (!tab.archived) {
        const saveNoteBtn = makeEl('button', 'btn-primary btn-xs', 'Save Note'); saveNoteBtn.type = 'button';
        saveNoteBtn.onclick = () => { c.remark = area.value.trim(); saveState(); render(); };
        box.appendChild(saveNoteBtn);
      }
      rTd.appendChild(box); rTr.appendChild(rTd); tbody.appendChild(rTr);
    }
  });
}

function renderQaTable(tab) {
  document.getElementById('qaCountLabel').textContent = `${tab.qaAudits.length} monits logged`;
  const totalPages = Math.max(1, Math.ceil(tab.qaAudits.length / QA_PAGE_SIZE));
  if (qaPage >= totalPages) qaPage = totalPages - 1;

  renderLeafRail('qaLeafRail', tab.qaAudits.length, QA_PAGE_SIZE, qaPage, p => {
    qaPage = p; editingQaIdx = null; render();
  });

  const qaBody = document.getElementById('qaTableBody');
  clearEl(qaBody);

  if (!tab.qaAudits.length) {
    const tr = makeEl('tr');
    const td = makeEl('td', 'muted-text', 'No QA monits logged yet.');
    td.colSpan = 4; td.style.textAlign = 'center'; td.style.padding = '20px';
    tr.appendChild(td); qaBody.appendChild(tr); return;
  }

  const start = qaPage * QA_PAGE_SIZE;
  tab.qaAudits.slice(start, start + QA_PAGE_SIZE).forEach((q, localIdx) => {
    const globalIdx = start + localIdx;
    const tr = makeEl('tr');

    if (!tab.archived && editingQaIdx === globalIdx) {
      const inId = makeEl('input', 'inline-input'); inId.value = q.id;
      const inAud = makeEl('input', 'inline-input'); inAud.value = q.auditor;
      const inScore = makeEl('input', 'inline-input'); inScore.type = 'number'; inScore.step = '0.1'; inScore.value = q.score;

      const tdAct = makeEl('td', 'text-right');
      const grp = makeEl('div', 'action-group');
      const saveBtn = makeEl('button', 'btn-save', '✓'); saveBtn.type = 'button';
      saveBtn.onclick = () => {
        tab.qaAudits.splice(globalIdx, 1, { id: inId.value.trim() || q.id, auditor: inAud.value.trim() || q.auditor, score: parseFloat(inScore.value) || 0 });
        editingQaIdx = null; saveState(); render();
      };
      const cancelBtn = makeEl('button', 'btn-icon', '✕'); cancelBtn.type = 'button';
      cancelBtn.onclick = () => { editingQaIdx = null; render(); };
      grp.appendChild(saveBtn); grp.appendChild(cancelBtn); tdAct.appendChild(grp);

      [inId, inAud, inScore].forEach(el => { const td = makeEl('td'); td.appendChild(el); tr.appendChild(td); });
      tr.appendChild(tdAct);
    } else {
      const tdId = makeEl('td', '', q.id); tdId.style.fontWeight = '700';
      const tdAud = makeEl('td', '', q.auditor);
      const tdScore = makeEl('td', q.score >= 90 ? 'txt-green' : 'txt-amber', `${q.score}%`);
      const tdAct = makeEl('td', 'text-right');

      if (tab.archived) {
        tdAct.appendChild(makeEl('span', 'muted-text', 'Locked'));
      } else {
        const grp = makeEl('div', 'action-group');
        const editBtn = makeEl('button', 'btn-icon', '✏️'); editBtn.type = 'button';
        editBtn.onclick = () => { editingQaIdx = globalIdx; render(); };
        const delBtn = makeEl('button', 'btn-del', '✕'); delBtn.type = 'button';
        delBtn.onclick = () => { tab.qaAudits.splice(globalIdx, 1); saveState(); render(); };
        grp.appendChild(editBtn); grp.appendChild(delBtn); tdAct.appendChild(grp);
      }
      [tdId, tdAud, tdScore, tdAct].forEach(td => tr.appendChild(td));
    }
    qaBody.appendChild(tr);
  });
}
function render() {
  const tab = getActiveTab();
  const m = computeMetrics(tab);
  renderSidebarAndCards(tab, m);
  const panelsContainer = document.getElementById('panelsContainer');
  state.panelOrder.forEach(id => { const el = document.getElementById(id); if (el) panelsContainer.appendChild(el); });
  renderCaseTable(tab);
  renderQaTable(tab);
  bindDragAndDrop();
}

function openSearchModal(query) {
  const q = query.trim().toLowerCase();
  if (!q) return;
  const tab = getActiveTab();
  const matches = tab.cases.filter(c => (c.id && c.id.toLowerCase().includes(q)) || (c.client && c.client.toLowerCase().includes(q)));
  const container = document.getElementById('searchResultsBody');
  clearEl(container);

  if (!matches.length) {
    container.appendChild(makeEl('p', 'muted-text', `No matching cases found for "${query}".`));
  } else {
    matches.forEach(c => {
      const card = makeEl('div', 'search-hit-card');
      const header = makeEl('div', 'panel-header'); header.style.marginBottom = '4px';
      header.appendChild(makeEl('strong', '', `${c.id} — ${c.client || 'No Client'}`));
      header.appendChild(makeEl('span', 'pill', c.csat));
      const grid = makeEl('div', 'search-hit-grid');
      grid.appendChild(makeEl('div', '', `AHT: ${c.aht} mins`));
      grid.appendChild(makeEl('div', '', `CRT NE: ${c.crt}`));
      grid.appendChild(makeEl('div', '', `Triage: ${c.triage}`));
      card.appendChild(header); card.appendChild(grid);
      if (c.remark) card.appendChild(makeEl('div', 'search-hit-remark', `💬 Remarks: ${c.remark}`));
      container.appendChild(card);
    });
  }
  document.getElementById('searchModal').classList.remove('hidden');
}

function bindDragAndDrop() {
  let draggedKpi = null;
  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('dragstart', () => { draggedKpi = card.dataset.kpi; card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault(); card.classList.remove('drag-over');
      const targetKpi = card.dataset.kpi;
      if (draggedKpi && draggedKpi !== targetKpi) {
        const from = state.kpiOrder.indexOf(draggedKpi);
        const to = state.kpiOrder.indexOf(targetKpi);
        state.kpiOrder.splice(from, 1); state.kpiOrder.splice(to, 0, draggedKpi);
        saveState(); render();
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
      e.preventDefault(); panel.classList.remove('drag-over');
      if (draggedPanel && draggedPanel !== panel.id) { state.panelOrder.reverse(); saveState(); render(); }
    });
  });
}

async function loadRepoWallpapers() {
  const grid = document.getElementById('repoWallpaperGrid');
  if (!grid) return;
  clearEl(grid);
  grid.appendChild(makeEl('p', 'muted-text', 'Loading wallpapers...'));

  try {
    const res = await fetch('./wallpapers/list.json?t=' + Date.now());
    if (!res.ok) throw new Error('list.json not found');
    const filenames = await res.json();
    const media = filenames.filter(name => /\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(name));

    clearEl(grid);
    if (!media.length) {
      grid.appendChild(makeEl('p', 'muted-text', 'No images or videos listed in wallpapers/list.json yet.'));
      return;
    }

    media.forEach(fileName => {
      const isVideo = /\.(mp4|webm)$/i.test(fileName);
      const liveUrl = `./wallpapers/${encodeURIComponent(fileName)}`;

      const card = makeEl('button', 'wp-card');
      card.type = 'button';

      if (isVideo) {
        const vid = makeEl('video', 'wp-thumb');
        vid.src = liveUrl;
        vid.muted = true;
        vid.loop = true;
        vid.autoplay = true;
        vid.playsInline = true;
        card.appendChild(vid);
      } else {
        const img = makeEl('img', 'wp-thumb');
        img.src = liveUrl;
        img.alt = fileName;
        card.appendChild(img);
      }

      card.appendChild(makeEl('div', 'wp-label', (isVideo ? '🎬 ' : '🖼️ ') + fileName));
      card.onclick = () => {
        applyWallpaper(liveUrl, isVideo);
        try { localStorage.setItem(WALLPAPER_KEY, JSON.stringify({ src: liveUrl, isVideo })); } catch (err) {}
        document.getElementById('wallpaperModal').classList.add('hidden');
      };
      grid.appendChild(card);
    });
  } catch (err) {
    clearEl(grid);
    grid.appendChild(makeEl('p', 'muted-text', 'Create wallpapers/list.json with your filenames (e.g. ["bg.jpg"]).'));
  }
}


document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedWp = JSON.parse(localStorage.getItem(WALLPAPER_KEY) || 'null');
    if (savedWp && savedWp.src) applyWallpaper(savedWp.src, savedWp.isVideo);
  } catch (err) {}

  document.getElementById('caseForm').addEventListener('submit', e => {
    e.preventDefault();
    const tab = getActiveTab();
    if (tab.archived) return;
    tab.cases.unshift({
      id: document.getElementById('caseId').value.trim(),
      client: document.getElementById('clientNameInput').value.trim(),
      aht: parseFloat(document.getElementById('ahtInput').value) || 0,
      csat: document.getElementById('csatInput').value,
      crt: document.getElementById('crtInput').value,
      triage: document.getElementById('triageInput').value,
      remark: ''
    });
    casePage = 0; e.target.reset(); saveState(); render();
  });

  document.getElementById('qaForm').addEventListener('submit', e => {
    e.preventDefault();
    const tab = getActiveTab();
    if (tab.archived) return;
    tab.qaAudits.unshift({
      id: document.getElementById('qaCaseId').value.trim(),
      auditor: document.getElementById('qaAuditorInput').value.trim(),
      score: parseFloat(document.getElementById('qaScoreInput').value) || 0
    });
    qaPage = 0; e.target.reset(); saveState(); render();
  });

  const searchInput = document.getElementById('caseSearchInput');
  document.getElementById('caseSearchBtn').addEventListener('click', () => openSearchModal(searchInput.value));
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openSearchModal(searchInput.value); } });
  document.getElementById('closeSearchModalBtn').addEventListener('click', () => document.getElementById('searchModal').classList.add('hidden'));

    document.getElementById('wallpaperBtn').addEventListener('click', () => {
    document.getElementById('wallpaperModal').classList.remove('hidden');
    loadRepoWallpapers();
  });
  document.getElementById('refreshWallpapersBtn').addEventListener('click', loadRepoWallpapers);
  document.getElementById('closeWallpaperModalBtn').addEventListener('click', () => {
    document.getElementById('wallpaperModal').classList.add('hidden');
  });
  document.getElementById('clearWallpaperBtn').addEventListener('click', () => {
    applyWallpaper(null, false);
    try { localStorage.removeItem(WALLPAPER_KEY); } catch (err) {}
    document.getElementById('wallpaperModal').classList.add('hidden');
  });


  document.getElementById('toggleArchivesBtn').addEventListener('click', () => { state.archivesExpanded = !state.archivesExpanded; saveState(); render(); });
  document.getElementById('startDateInput').addEventListener('change', e => { const tab = getActiveTab(); if (!tab.archived) { tab.startDate = e.target.value; saveState(); render(); } });
  document.getElementById('endDateInput').addEventListener('change', e => { const tab = getActiveTab(); if (!tab.archived) { tab.endDate = e.target.value; saveState(); render(); } });

  document.getElementById('archiveBtn').addEventListener('click', () => {
    const current = getActiveTab();
    if (current.archived) return;
    const nextName = prompt('Enter name for the new monthly tab:', getCurrentMonthLabel(state.tabs.length));
    if (!nextName) return;
    const range = getDefaultDateRange();
    const customStart = prompt('Start Date (YYYY-MM-DD):', range.start) || range.start;
    const customEnd = prompt('End Date (YYYY-MM-DD):', range.end) || range.end;
    current.archived = true;
    casePage = 0; qaPage = 0; editingCaseIdx = null; editingQaIdx = null; expandedRemarkIdx = null;
    const newId = 'tab-' + Date.now();
    state.tabs.unshift({ id: newId, name: nextName.trim(), startDate: customStart.trim(), endDate: customEnd.trim(), archived: false, cases: [], qaAudits: [] });
    state.activeTabId = newId; saveState(); render();
  });

  document.getElementById('returnActiveBtn').addEventListener('click', () => {
    const active = state.tabs.find(t => !t.archived);
    if (active) { casePage = 0; qaPage = 0; editingCaseIdx = null; editingQaIdx = null; expandedRemarkIdx = null; state.activeTabId = active.id; saveState(); render(); }
  });

  document.getElementById('resetLayoutBtn').addEventListener('click', () => { state.kpiOrder = ['bonus', 'csat', 'aht', 'quality', 'crt']; state.panelOrder = ['panel-forms', 'panel-tables']; saveState(); render(); });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    const headers = ['Case ID', 'Client', 'AHT', 'CSAT', 'CRT NE', 'Triage', 'Remarks'];
    const rows = tab.cases.map(c => [c.id, c.client || '', c.aht, c.csat, c.crt, c.triage, `"${(c.remark || '').replace(/"/g, '""')}"`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${tab.name.replace(/\s+/g, '_')}_CaseFlow_Arcane.csv`;
    a.click();
  });

  render();
});
