// Visual color themes for decorative leaf accents
const LEAF_THEMES = [
  { core: '#a855f7', tip: '#fbbf24', glow: 'rgba(168, 85, 247, 0.95)' },
  { core: '#38bdf8', tip: '#a855f7', glow: 'rgba(56, 189, 248, 0.95)' },
  { core: '#10b981', tip: '#fde047', glow: 'rgba(16, 185, 129, 0.95)' },
  { core: '#ec4899', tip: '#fbbf24', glow: 'rgba(236, 72, 153, 0.95)' },
  { core: '#f59e0b', tip: '#fef08a', glow: 'rgba(245, 158, 11, 0.95)' }
];

// Caches and waiter queues for static leaf snapshots and active leaf video canvases
let cachedStaticLeafUrl = null;
let staticLeafBuilding = false;
const staticLeafWaiters = [];
const activeLeafPlayers = {};

// Oracle manifestation cache so ordinary renders do not reroll 80/20 selection
let cachedOracleTabId = null;
let cachedOracleSnapshot = null;
let cachedOracleHtml = null;

function isReducedMotionPreferred() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function syncDecorativeSmilMotion(container) {
  const reduced = isReducedMotionPreferred();
  const root = container || document;
  root.querySelectorAll('svg').forEach(svg => {
    try {
      if (reduced && typeof svg.pauseAnimations === 'function') {
        svg.pauseAnimations();
      } else if (!reduced && typeof svg.unpauseAnimations === 'function') {
        svg.unpauseAnimations();
      }
    } catch (err) {}
  });
}

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

function flushStaticLeafWaiters(url) {
  staticLeafBuilding = false;
  while (staticLeafWaiters.length) {
    const waiter = staticLeafWaiters.shift();
    if (typeof waiter === 'function') {
      try { waiter(url); } catch (err) {}
    }
  }
}

function getStaticLeafSnapshot(cb) {
  if (cachedStaticLeafUrl) {
    if (typeof cb === 'function') cb(cachedStaticLeafUrl);
    return;
  }
  if (typeof cb === 'function') staticLeafWaiters.push(cb);
  if (staticLeafBuilding) return;
  staticLeafBuilding = true;

  const vid = document.createElement('video');
  vid.src = './wallpapers/Leaf-active.mp4';
  vid.muted = true;
  vid.playsInline = true;

  const cleanup = () => {
    vid.removeEventListener('loadeddata', onLoaded);
    vid.removeEventListener('seeked', onSeeked);
    vid.removeEventListener('error', onError);
    vid.removeAttribute('src');
    vid.load();
  };

  const onError = () => {
    cleanup();
    flushStaticLeafWaiters(null);
  };

  const onLoaded = () => {
    try {
      vid.currentTime = 0.12;
    } catch (err) {
      onError();
    }
  };

  const onSeeked = () => {
    try {
      const w = Math.max(vid.videoWidth || 360, 360);
      const h = Math.max(vid.videoHeight || 360, 360);
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const ctx = off.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(vid, 0, 0, w, h);
      keyAlphaFrame(ctx, w, h);
      cachedStaticLeafUrl = off.toDataURL('image/png');
      cleanup();
      flushStaticLeafWaiters(cachedStaticLeafUrl);
    } catch (err) {
      onError();
    }
  };

  vid.addEventListener('loadeddata', onLoaded, { once: true });
  vid.addEventListener('seeked', onSeeked, { once: true });
  vid.addEventListener('error', onError, { once: true });
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

function toArcaneRoman(num) {
  const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let n = Math.max(1, num);
  let out = '';
  for (const [val, sym] of map) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out;
}

function createRunicPageSeal(pageIndex, isActive) {
  const SVG_NS = 'http://' + 'www.w3.org' + '/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'rune-page-svg' + (isActive ? ' active' : ''));
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = '48px';
  svg.style.height = '48px';
  svg.style.overflow = 'visible';
  svg.style.filter = isActive
    ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.9)) drop-shadow(0 0 16px rgba(129, 140, 248, 0.65))'
    : 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.85))';

  const uid = `pgSeal_${pageIndex}_${Math.random().toString(36).slice(2, 6)}`;
  const roman = toArcaneRoman(pageIndex + 1);

  const outerStroke = isActive ? '#38bdf8' : 'rgba(251, 191, 36, 0.42)';
  const innerStroke = isActive ? '#a5f3fc' : 'rgba(148, 163, 184, 0.35)';
  const glyphFill   = isActive ? '#e0f2fe' : 'rgba(251, 191, 36, 0.48)';
  const starStroke  = isActive ? 'rgba(56, 189, 248, 0.55)' : 'rgba(251, 191, 36, 0.2)';
  const numFill     = isActive ? '#ffffff' : '#94a3b8';

  svg.innerHTML = `
    <defs>
      <path id="${uid}" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
      <radialGradient id="${uid}_core" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="${isActive ? '#0284c7' : '#1e293b'}" stop-opacity="${isActive ? '0.95' : '0.92'}" />
        <stop offset="100%" stop-color="${isActive ? '#082f49' : '#090d16'}" stop-opacity="0.98" />
      </radialGradient>
    </defs>

    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="${isActive ? '16s' : '60s'}" repeatCount="indefinite" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="${outerStroke}" stroke-width="${isActive ? '2.2' : '1.4'}" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="${innerStroke}" stroke-width="1.2" stroke-dasharray="3 4" />
      <text fill="${glyphFill}" font-size="8.2" font-weight="700" letter-spacing="2.4">
        <textPath href="#${uid}" startOffset="0%">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ • </textPath>
      </text>
    </g>

    <g>
      <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="${isActive ? '12s' : '48s'}" repeatCount="indefinite" />
      <polygon points="50,15 80,67 20,67" fill="none" stroke="${starStroke}" stroke-width="1.3" />
      <polygon points="50,85 80,33 20,33" fill="none" stroke="${starStroke}" stroke-width="1.3" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="${outerStroke}" stroke-width="1.2" stroke-dasharray="6 3" />
    </g>

    <circle cx="50" cy="50" r="22" fill="url(#${uid}_core)" stroke="${innerStroke}" stroke-width="${isActive ? '2' : '1.3'}" />
    <text x="50" y="56" text-anchor="middle" fill="${numFill}" font-family="Cinzel, Georgia, serif" font-size="17" font-weight="800">${roman}</text>
  `;
  return svg;
}

function createRunicArrowSvg(direction, isDisabled) {
  const SVG_NS = 'http://' + 'www.w3.org' + '/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 30');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = '36px';
  svg.style.height = '22px';
  svg.style.overflow = 'visible';
  svg.style.transform = direction === 'down' ? 'rotate(180deg)' : 'none';
  svg.style.filter = isDisabled
    ? 'none'
    : 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.7)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.85))';

  const wingStroke = isDisabled ? 'rgba(148, 163, 184, 0.35)' : '#38bdf8';
  const goldAccent = isDisabled ? 'rgba(251, 191, 36, 0.25)' : '#fbbf24';
  const gemFill    = isDisabled ? '#1e293b' : '#e0f2fe';

  svg.innerHTML = `
    <path d="M 6,23 L 24,5 L 42,23 L 34,23 L 24,13 L 14,23 Z"
          fill="rgba(8, 47, 73, 0.85)" stroke="${wingStroke}" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M 3,25 L 11,17 M 45,25 L 37,17" stroke="${goldAccent}" stroke-width="1.4" stroke-linecap="round" />
    <line x1="24" y1="14" x2="24" y2="27" stroke="${goldAccent}" stroke-width="1.4" stroke-linecap="round" />
    <polygon points="24,16 28,21 24,26 20,21" fill="${gemFill}" stroke="${wingStroke}" stroke-width="1.2" />
  `;
  return svg;
}

function renderLeafRail(railId, totalItems, pageSize, currentPage, onSelect, maxVisible = 3) {
  const rail = document.getElementById(railId);
  if (!rail) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  clearEl(rail);

  const triggerPageTurn = (targetPage) => {
    if (targetPage === currentPage || targetPage < 0 || targetPage >= totalPages) return;
    const wrap = rail.parentElement ? rail.parentElement.querySelector('.table-wrap') : null;
    if (wrap && !isReducedMotionPreferred()) {
      wrap.classList.remove('bifrost-page-flip');
      void wrap.offsetWidth;
      wrap.classList.add('bifrost-page-flip');
    }
    onSelect(targetPage);
  };

  const prevBtn = makeEl('button', 'rune-nav-btn');
  prevBtn.type = 'button';
  prevBtn.title = `Previous Page (${currentPage + 1} of ${totalPages})`;
  prevBtn.disabled = currentPage <= 0;
  prevBtn.appendChild(createRunicArrowSvg('up', prevBtn.disabled));
  prevBtn.onclick = () => triggerPageTurn(currentPage - 1);
  rail.appendChild(prevBtn);

  let winStart = Math.max(0, currentPage - 1);
  let winEnd = Math.min(totalPages, winStart + maxVisible);
  if (winEnd - winStart < maxVisible) {
    winStart = Math.max(0, winEnd - maxVisible);
  }

  const spine = makeEl('div', 'rune-ley-spine');
  for (let p = winStart; p < winEnd; p++) {
    const isActive = p === currentPage;
    const nodeBtn = makeEl('button', 'leaf-btn' + (isActive ? ' active' : ''));
    nodeBtn.type = 'button';
    nodeBtn.title = `Page ${p + 1} of ${totalPages}`;
    nodeBtn.onclick = () => triggerPageTurn(p);
    nodeBtn.appendChild(createRunicPageSeal(p, isActive));
    spine.appendChild(nodeBtn);
  }
  rail.appendChild(spine);

  const nextBtn = makeEl('button', 'rune-nav-btn');
  nextBtn.type = 'button';
  nextBtn.title = `Next Page (${currentPage + 1} of ${totalPages})`;
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.appendChild(createRunicArrowSvg('down', nextBtn.disabled));
  nextBtn.onclick = () => triggerPageTurn(currentPage + 1);
  rail.appendChild(nextBtn);
}

function makeMonthButton(t, activeId) {
  const btn = makeEl('button', 'month-btn' + (t.id === activeId ? ' active' : ''));
  btn.type = 'button';
  btn.onclick = () => {
    casePage = 0; qaPage = 0; editingCaseIdx = null; editingQaIdx = null; expandedRemarkIdx = null;
    state.activeTabId = t.id;
    saveState();
    render();
    shiftArcaneRelic({ forceRefresh: true });
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
  archivedTabs.forEach(t => {
    const row = makeEl('div', 'archive-row');
    const btn = makeMonthButton(t, tab.id);
    const delBtn = makeEl('button', 'archive-del-btn', '✕');
    delBtn.type = 'button';
    delBtn.title = `Delete ${t.name}`;
    delBtn.onclick = (e) => {
      e.stopPropagation();
      const modal = document.getElementById('banishModal');
      const nameEl = document.getElementById('banishTargetName');
      const confirmBtn = document.getElementById('confirmBanishBtn');
      const cancelBtn = document.getElementById('cancelBanishBtn');

      nameEl.textContent = `"${t.name}"`;
      modal.classList.remove('hidden');

      const closeModal = () => {
        modal.classList.add('hidden');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.onclick = null;
      };

      confirmBtn.onclick = () => {
        state.tabs = state.tabs.filter(x => x.id !== t.id);
        if (state.activeTabId === t.id) {
          const fallback = state.tabs.find(x => !x.archived) || state.tabs[0];
          if (fallback) state.activeTabId = fallback.id;
        }
        closeModal();
        saveState();
        render();
        shiftArcaneRelic({ forceRefresh: true });
      };

      cancelBtn.onclick = closeModal;
      modal.onclick = (ev) => { if (ev.target === modal) closeModal(); };
    };

    row.appendChild(btn);
    row.appendChild(delBtn);
    archivedList.appendChild(row);
  });

  const isDrawerOpen = state.archivesExpanded && archivedTabs.length > 0;
  document.getElementById('archiveCount').textContent = archivedTabs.length;
  document.getElementById('archiveArrow').textContent = state.archivesExpanded ? '▾' : '▸';
  archivedList.classList.toggle('collapsed', !isDrawerOpen);
  document.querySelector('aside').classList.toggle('archives-open', isDrawerOpen);

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
      sub: m.forfeited
        ? 'Forfeited (CSAT <75%)'
        : m.penalty > 0
          ? `${[m.ahtPenalty ? '-€50 AHT' : '', m.rrPenalty ? '-€25 RR' : ''].filter(Boolean).join(' & ')} | RR: ${m.rrPct !== null ? m.rrPct.toFixed(0) + '%' : 'Void'}`
          : `RR: ${m.rrPct !== null ? m.rrPct.toFixed(0) + '%' : 'Void'} • Max: €300`,
      color: (m.forfeited || m.penalty > 0) ? 'txt-red' : 'txt-green'
    },
    csat: {
      title: 'CSAT Score',
      value: m.csatPct !== null ? `${m.csatPct.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.csatBonus} (Target 94%+)`,
      color: m.csatPct === null ? '' : m.csatPct >= 94 ? 'txt-green' : 'txt-red'
    },
    aht: {
      title: 'Average AHT',
      value: m.avgAht !== null ? `${m.avgAht.toFixed(1)}m` : '—',
      sub: m.avgAht !== null && m.avgAht > 32 ? 'Over 32m (-€50)' : 'Limit: 32.0 mins max',
      color: m.avgAht === null ? 'txt-sky' : m.avgAht > 32 ? 'txt-red' : 'txt-green'
    },
    quality: {
      title: 'Quality Score (QA)',
      value: m.avgQual !== null ? `${m.avgQual.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.qualBonus} (${tab.qaAudits.length} monits)`,
      color: m.avgQual === null ? '' : m.avgQual >= 90 ? 'txt-green' : 'txt-red'
    },
    crt: {
      title: 'CRT NE Rate',
      value: m.crtPct !== null ? `${m.crtPct.toFixed(1)}%` : '—',
      sub: `Bonus: +€${m.crtBonus} (Target 94%+)`,
      color: m.crtPct === null ? '' : m.crtPct >= 94 ? 'txt-green' : 'txt-red'
    }
  };

  const shortTitles = {
    bonus: 'BONUS POOL',
    csat: 'CSAT',
    aht: 'AVG AHT',
    quality: 'SQS MONIT',
    crt: 'CRT NE'
  };

  const auraPalettes = {
    'txt-green': { outer: '#10b981', inner: '#fbbf24', glyph: '#fde047', coreTop: '#064e3b', glow: 'rgba(16, 185, 129, 0.55)' },
    'txt-red':   { outer: '#ef4444', inner: '#fca5a5', glyph: '#fecaca', coreTop: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.65)' },
    'txt-amber': { outer: '#f59e0b', inner: '#fde68a', glyph: '#fef08a', coreTop: '#78350f', glow: 'rgba(245, 158, 11, 0.55)' },
    default:     { outer: '#38bdf8', inner: '#a5f3fc', glyph: '#e0f2fe', coreTop: '#0c4a6e', glow: 'rgba(56, 189, 248, 0.48)' }
  };

  const SVG_NS = 'http://' + 'www.w3.org' + '/2000/svg';
  const kpiGrid = document.getElementById('kpiGrid');
  clearEl(kpiGrid);

  state.kpiOrder.forEach((key, idx) => {
    const c = cardsData[key];
    const pal = auraPalettes[c.color] || auraPalettes.default;
    const uid = `kpiOrb_${key}_${Math.random().toString(36).slice(2, 6)}`;

    const card = makeEl('div', 'kpi-card kpi-orb' + (c.color === 'txt-red' ? ' orb-alert' : ''));
    card.dataset.kpi = key;
    card.draggable = true;
    card.style.setProperty('--orb-glow', pal.glow);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 180 180');
    svg.setAttribute('class', 'kpi-orb-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs>
        <path id="${uid}_path" d="M 90,90 m -74,0 a 74,74 0 1,1 148,0 a 74,74 0 1,1 -148,0" />
        <radialGradient id="${uid}_bg" cx="50%" cy="32%" r="65%">
          <stop offset="0%" stop-color="${pal.coreTop}" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#090d16" stop-opacity="0.96" />
        </radialGradient>
      </defs>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="44s" repeatCount="indefinite" />
        <circle cx="90" cy="90" r="86" fill="none" stroke="${pal.outer}" stroke-width="1.5" stroke-opacity="0.75" />
        <circle cx="90" cy="90" r="68" fill="none" stroke="${pal.inner}" stroke-width="1" stroke-dasharray="3 5" stroke-opacity="0.55" />
        <text fill="${pal.glyph}" fill-opacity="0.82" font-size="8.4" font-weight="700" letter-spacing="3.2">
          <textPath href="#${uid}_path" startOffset="0%">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ • </textPath>
        </text>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 90 90" to="0 90 90" dur="32s" repeatCount="indefinite" />
        <polygon points="90,24 147,123 33,123" fill="none" stroke="${pal.outer}" stroke-width="1" stroke-opacity="0.32" />
        <polygon points="90,156 147,57 33,57" fill="none" stroke="${pal.outer}" stroke-width="1" stroke-opacity="0.32" />
      </g>
      <circle cx="90" cy="90" r="61" fill="url(#${uid}_bg)" stroke="${pal.inner}" stroke-width="1.4" stroke-opacity="0.75" />
    `;
    card.appendChild(svg);

    const orbSigils = {
      bonus: m.forfeited ? '✦ FORFEITED ✦' : `✦ RR ${m.rrPct !== null ? m.rrPct.toFixed(0) + '%' : 'VOID'} ✦`,
      csat: `✦ +€${m.csatBonus} ✦`,
      aht: m.avgAht !== null && m.avgAht > 32 ? '✦ -€50 PENALTY ✦' : '✦ ≤ 32.0M ✦',
      quality: `✦ +€${m.qualBonus} • ${tab.qaAudits.length}M ✦`,
      crt: `✦ +€${m.crtBonus} ✦`
    };
    card.title = `${c.title}: ${c.value} (${c.sub}) — Drag to reorder`;

    const core = makeEl('div', 'kpi-orb-core');
    core.appendChild(makeEl('span', 'grip orb-grip', '⋮⋮'));
    core.appendChild(makeEl('div', 'kpi-top', shortTitles[key] || c.title));
    core.appendChild(makeEl('div', 'kpi-value ' + c.color, c.value));
    core.appendChild(makeEl('div', 'kpi-sub orb-sigil', orbSigils[key] || ''));
    card.appendChild(core);

    kpiGrid.appendChild(card);

    if (idx < state.kpiOrder.length - 1) {
      const nextCard = cardsData[state.kpiOrder[idx + 1]];
      const isDoom = c.color === 'txt-red' || nextCard.color === 'txt-red';
      const isBounty = !isDoom && (c.color === 'txt-green' && nextCard.color === 'txt-green');
      const stateClass = isDoom ? 'conduit-doom' : isBounty ? 'conduit-bounty' : 'conduit-cyan';

      const wispCore  = isDoom ? '#fff1f2' : isBounty ? '#fefce8' : '#f0f9ff';
      const wispGlow  = isDoom ? '#fb7185' : isBounty ? '#10b981' : '#38bdf8';
      const mistTone  = isDoom ? '#f43f5e' : isBounty ? '#fbbf24' : '#818cf8';
      const fId       = `wispGlow_${idx}_${Math.random().toString(36).slice(2, 6)}`;

      const bridge = makeEl('div', `kpi-conduit ${stateClass}`);
      bridge.setAttribute('aria-hidden', 'true');

      const bSvg = document.createElementNS(SVG_NS, 'svg');
      bSvg.setAttribute('viewBox', '0 0 120 76');
      bSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      bSvg.setAttribute('class', 'conduit-svg');
      bSvg.innerHTML = `
        <defs>
          <filter id="${fId}" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.5" result="blurWide" />
            <feGaussianBlur stdDeviation="1.6" result="blurTight" />
            <feMerge>
              <feMergeNode in="blurWide" />
              <feMergeNode in="blurTight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path id="${fId}_wave1" d="M 4,42 C 34,12 86,62 116,32" />
          <path id="${fId}_wave2" d="M 6,28 C 40,60 80,14 114,46" />
        </defs>

        <use href="#${fId}_wave1" fill="none" stroke="${wispGlow}" stroke-width="3.6" stroke-opacity="0.52" stroke-linecap="round" filter="url(#${fId})" />
        <use href="#${fId}_wave2" fill="none" stroke="${mistTone}" stroke-width="2.6" stroke-opacity="0.45" stroke-linecap="round" filter="url(#${fId})" />

        <use href="#${fId}_wave1" fill="none" stroke="${wispCore}" stroke-width="1.5" stroke-opacity="0.78"
             stroke-dasharray="14 26" stroke-linecap="round" filter="url(#${fId})">
          <animate attributeName="stroke-dashoffset" from="${isDoom ? '0' : '80'}" to="${isDoom ? '80' : '0'}"
                   dur="${isDoom ? '1.8s' : '3.2s'}" repeatCount="indefinite" />
        </use>

        <g filter="url(#${fId})">
          <g>
            <animateMotion dur="${isDoom ? '3.2s' : '4.8s'}" repeatCount="indefinite">
              <mpath href="#${fId}_wave1" />
            </animateMotion>
            <circle r="6.5" fill="${wispGlow}" opacity="0.38" />
            <circle r="3.2" fill="${wispCore}">
              <animate attributeName="opacity" values="0.15;1;0.9;0.15" dur="${isDoom ? '3.2s' : '4.8s'}" repeatCount="indefinite" />
            </circle>
          </g>

          <g>
            <animateMotion dur="${isDoom ? '3.9s' : '5.8s'}" begin="1.3s" repeatCount="indefinite">
              <mpath href="#${fId}_wave2" />
            </animateMotion>
            <circle r="5.5" fill="${mistTone}" opacity="0.35" />
            <circle r="2.6" fill="${wispCore}">
              <animate attributeName="opacity" values="0.15;0.95;0.85;0.15" dur="${isDoom ? '3.9s' : '5.8s'}" begin="1.3s" repeatCount="indefinite" />
            </circle>
          </g>

          <path d="M 38,15 L 39.5,19.5 L 44,21 L 39.5,22.5 L 38,27 L 36.5,22.5 L 32,21 L 36.5,19.5 Z" fill="${wispCore}">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2.6s" repeatCount="indefinite" />
          </path>
          <path d="M 82,49 L 83.2,52.8 L 87,54 L 83.2,55.2 L 82,59 L 80.8,55.2 L 77,54 L 80.8,52.8 Z" fill="${mistTone}">
            <animate attributeName="opacity" values="0.25;0.95;0.25" dur="3.1s" begin="1.1s" repeatCount="indefinite" />
          </path>
          <circle cx="60" cy="36" r="2.2" fill="${wispCore}">
            <animate attributeName="cy" values="39;31;39" dur="3.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;1;0.3" dur="3.6s" repeatCount="indefinite" />
          </circle>
        </g>
      `;
      bridge.appendChild(bSvg);
      kpiGrid.appendChild(bridge);
    }
  });
}

function renderCaseTable(tab) {
  const totalPages = Math.max(1, Math.ceil(tab.cases.length / CASE_PAGE_SIZE));
  if (casePage >= totalPages) casePage = Math.max(0, totalPages - 1);

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
      const selCsat = buildSelect(['Bounty', 'Doomed', 'Void'], c.csat);
      const selCrt = buildSelect(['Bounty', 'Doomed', 'Void'], c.crt);
      const selRr = buildSelect(['Bounty', 'Doomed', 'Void'], c.rr);

      const tdAct = makeEl('td', 'text-right');
      const grp = makeEl('div', 'action-group');
      const saveBtn = makeEl('button', 'btn-save', '✓'); saveBtn.type = 'button';
      saveBtn.onclick = () => {
        tab.cases.splice(globalIdx, 1, {
          id: inId.value.trim() || c.id, client: inClient.value.trim() || '—',
          aht: parseFloat(inAht.value) || 0, csat: selCsat.value, crt: selCrt.value, rr: selRr.value, remark: c.remark || ''
        });
        editingCaseIdx = null; saveState(); render(); shiftArcaneRelic();
      };
      const cancelBtn = makeEl('button', 'btn-icon', '✕'); cancelBtn.type = 'button';
      cancelBtn.onclick = () => { editingCaseIdx = null; render(); };
      grp.appendChild(saveBtn); grp.appendChild(cancelBtn); tdAct.appendChild(grp);

      [inId, inClient, inAht, selCsat, selCrt, selRr].forEach(el => { const td = makeEl('td'); td.appendChild(el); tr.appendChild(td); });
      tr.appendChild(tdAct);
    } else {
      const tdId = makeEl('td', '', c.id); tdId.style.fontWeight = '700';
      const tdClient = makeEl('td', '', c.client || '—');
      const tdAht = makeEl('td', c.aht > 32 ? 'txt-red' : '', `${c.aht}m`);
      const tdCsat = makeEl('td');
      const tagClass = c.csat === 'Bounty' ? 'tag-pos' : c.csat === 'Doomed' ? 'tag-neg' : 'tag-neu';
      tdCsat.appendChild(makeEl('span', 'status-tag ' + tagClass, c.csat));
      const tdCrt = makeEl('td', '', c.crt);
      const tdTri = makeEl('td', '', c.rr);

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
        delBtn.onclick = () => { tab.cases.splice(globalIdx, 1); saveState(); render(); shiftArcaneRelic(); };
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
  if (qaPage >= totalPages) qaPage = Math.max(0, totalPages - 1);

  renderLeafRail('qaLeafRail', tab.qaAudits.length, QA_PAGE_SIZE, qaPage, p => {
    qaPage = p; editingQaIdx = null; render();
  }, 2);

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
        editingQaIdx = null; saveState(); render(); shiftArcaneRelic();
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
        delBtn.onclick = () => { tab.qaAudits.splice(globalIdx, 1); saveState(); render(); shiftArcaneRelic(); };
        grp.appendChild(editBtn); grp.appendChild(delBtn); tdAct.appendChild(grp);
      }
      [tdId, tdAud, tdScore, tdAct].forEach(td => tr.appendChild(td));
    }
    qaBody.appendChild(tr);
  });
}

function forgeProceduralSeal() {
  if (window.CaseFlowOracle && typeof window.CaseFlowOracle.forgeProceduralSeal === 'function') {
    return window.CaseFlowOracle.forgeProceduralSeal();
  }
  return '<div class="arcane-manifestation"></div>';
}

function forgeLiveProphecy(options) {
  const tab = getActiveTab();
  const m = computeMetrics(tab);
  if (window.CaseFlowOracle && typeof window.CaseFlowOracle.forgeLiveProphecy === 'function') {
    return window.CaseFlowOracle.forgeLiveProphecy(Object.assign({ tab, metrics: m }, options || {}));
  }
  return '“The scroll rests quiet.”';
}

let cleanScrollDataUrl = null;
let cleanScrollFailed = false;
let cleanScrollLoading = false;
const scrollWaiters = [];

function flushScrollWaiters(url) {
  cleanScrollLoading = false;
  while (scrollWaiters.length) {
    const waiter = scrollWaiters.shift();
    if (typeof waiter === 'function') {
      try { waiter(url); } catch (err) {}
    }
  }
}

function getCleanScrollUrl(cb) {
  if (cleanScrollDataUrl) {
    if (typeof cb === 'function') cb(cleanScrollDataUrl);
    return;
  }
  if (cleanScrollFailed) {
    if (typeof cb === 'function') cb(null);
    return;
  }
  if (typeof cb === 'function') scrollWaiters.push(cb);
  if (cleanScrollLoading) return;
  cleanScrollLoading = true;

  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || 400;
      c.height = img.naturalHeight || 600;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, c.width, c.height);

      const frame = ctx.getImageData(0, 0, c.width, c.height);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max - min;
        if (max > 175 && sat < 24) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(frame, 0, 0);
      cleanScrollDataUrl = c.toDataURL('image/png');
      cleanScrollFailed = false;
      flushScrollWaiters(cleanScrollDataUrl);
    } catch (err) {
      cleanScrollFailed = true;
      flushScrollWaiters(null);
    }
  };
  img.onerror = () => {
    cleanScrollFailed = true;
    flushScrollWaiters(null);
  };
  img.src = './wallpapers/scroll.png';
}

function buildOracleSnapshotKey(tab, m) {
  const analysis = (window.CaseFlowOracle && typeof window.CaseFlowOracle.analyzePerformance === 'function')
    ? window.CaseFlowOracle.analyzePerformance(tab, m)
    : null;
  if (analysis && analysis.snapshot) return analysis.snapshot;
  return JSON.stringify({
    c: (tab && tab.cases && tab.cases.length) || 0,
    q: (tab && tab.qaAudits && tab.qaAudits.length) || 0,
    csat: m ? m.csatPct : null,
    crt: m ? m.crtPct : null,
    rr: m ? m.rrPct : null,
    aht: m ? m.avgAht : null,
    qual: m ? m.avgQual : null,
    bonus: m ? m.totalBonus : 0,
    forfeited: Boolean(m && m.forfeited)
  });
}

function attachScrollBackground(host) {
  const imgEl = host.querySelector('.scroll-art-bg');
  getCleanScrollUrl(url => {
    if (!imgEl || !imgEl.isConnected) return;
    if (url) {
      imgEl.src = url;
      imgEl.classList.remove('hidden');
      host.classList.remove('scroll-art-fallback');
    } else {
      imgEl.removeAttribute('src');
      imgEl.classList.add('hidden');
      host.classList.add('scroll-art-fallback');
    }
  });
}

// 80/20 selection: 80% written prophecy/commentary, 20% procedural magic seal, cached until state or forced refresh changes
function shiftArcaneRelic(options) {
  const opts = options || {};
  const host = document.getElementById('oracleDisplay');
  if (!host) return;

  const tab = getActiveTab();
  const m = computeMetrics(tab);
  const tabId = tab ? String(tab.id || tab.name || '') : 'none';
  const snapKey = buildOracleSnapshotKey(tab, m);
  const stateChanged = tabId !== cachedOracleTabId || snapKey !== cachedOracleSnapshot;

  if (!opts.forceRefresh && !stateChanged && cachedOracleHtml) {
    if (!host.querySelector('.scroll-content-layer')) {
      host.innerHTML = `<img class="scroll-art-bg" alt="" /><div class="scroll-content-layer">${cachedOracleHtml}</div>`;
      attachScrollBackground(host);
    }
    syncDecorativeSmilMotion(host);
    return;
  }

  if (!isReducedMotionPreferred()) {
    host.style.animation = 'none';
    void host.offsetWidth;
    host.style.animation = '';
  } else {
    host.style.animation = 'none';
  }

  const showRemark = Math.random() < 0.8;
  const innerHtml = showRemark
    ? forgeLiveProphecy(Object.assign({ tab, metrics: m }, opts))
    : forgeProceduralSeal();

  cachedOracleTabId = tabId;
  cachedOracleSnapshot = snapKey;
  cachedOracleHtml = innerHtml;

  host.innerHTML = `
    <img class="scroll-art-bg" alt="" />
    <div class="scroll-content-layer">${innerHtml}</div>`;

  attachScrollBackground(host);
  syncDecorativeSmilMotion(host);
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
  shiftArcaneRelic();
  syncDecorativeSmilMotion(document);
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
      grid.appendChild(makeEl('div', '', `RR: ${c.rr}`));
      card.appendChild(header); card.appendChild(grid);
      if (c.remark) card.appendChild(makeEl('div', 'search-hit-remark', `💬 Remarks: ${c.remark}`));
      container.appendChild(card);
    });
  }
  document.getElementById('searchModal').classList.remove('hidden');
}

function reorderListByTarget(list, itemId, targetId) {
  if (!Array.isArray(list) || !itemId || !targetId || itemId === targetId) return false;
  const from = list.indexOf(itemId);
  const to = list.indexOf(targetId);
  if (from === -1 || to === -1) return false;
  const [moved] = list.splice(from, 1);
  const insertAt = from < to ? to - 1 : to;
  list.splice(insertAt, 0, moved);
  return true;
}

function clearDragClasses() {
  document.querySelectorAll('.kpi-card.drag-over, .kpi-card.dragging').forEach(el => {
    el.classList.remove('drag-over', 'dragging');
  });
  document.querySelectorAll('.workspace-panel.drag-over, .workspace-panel.dragging').forEach(el => {
    el.classList.remove('drag-over', 'dragging');
  });
}

function bindDragAndDrop() {
  document.querySelectorAll('.kpi-card').forEach(card => {
    if (card.dataset.dndBound === '1') return;
    card.dataset.dndBound = '1';

    card.addEventListener('dragstart', e => {
      draggedKpiKey = card.dataset.kpi;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedKpiKey || ''); } catch (err) {}
      }
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      draggedKpiKey = null;
      clearDragClasses();
    });

    card.addEventListener('dragover', e => {
      if (!draggedKpiKey) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (card.dataset.kpi !== draggedKpiKey) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', e => {
      e.preventDefault();
      const sourceKey = draggedKpiKey;
      const targetKey = card.dataset.kpi;
      draggedKpiKey = null;
      clearDragClasses();
      if (sourceKey && targetKey && sourceKey !== targetKey && reorderListByTarget(state.kpiOrder, sourceKey, targetKey)) {
        saveState();
        render();
      }
    });
  });

  document.querySelectorAll('.workspace-panel').forEach(panel => {
    if (panel.dataset.dndBound === '1') return;
    panel.dataset.dndBound = '1';

    panel.addEventListener('pointerdown', e => {
      const handle = e.target && e.target.closest ? e.target.closest('.grip, .panel-header') : null;
      panel.dataset.dragArmed = handle ? '1' : '0';
    });

    panel.addEventListener('dragstart', e => {
      const targetPanel = e.target && e.target.closest ? e.target.closest('.workspace-panel') : null;
      if (targetPanel !== panel) return;
      if (panel.dataset.dragArmed !== '1') {
        e.preventDefault();
        return;
      }
      draggedPanelId = panel.id;
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', draggedPanelId || ''); } catch (err) {}
      }
      panel.classList.add('dragging');
    });

    panel.addEventListener('dragend', () => {
      panel.dataset.dragArmed = '0';
      draggedPanelId = null;
      clearDragClasses();
    });

    panel.addEventListener('dragover', e => {
      if (!draggedPanelId) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (panel.id !== draggedPanelId) {
        panel.classList.add('drag-over');
      }
    });

    panel.addEventListener('dragleave', () => {
      panel.classList.remove('drag-over');
    });

    panel.addEventListener('drop', e => {
      e.preventDefault();
      const sourceId = draggedPanelId;
      const targetId = panel.id;
      panel.dataset.dragArmed = '0';
      draggedPanelId = null;
      clearDragClasses();
      if (sourceId && targetId && sourceId !== targetId && reorderListByTarget(state.panelOrder, sourceId, targetId)) {
        saveState();
        render();
      }
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
      rr: document.getElementById('rrInput').value,
      remark: ''
    });
    casePage = 0; e.target.reset(); saveState(); render(); shiftArcaneRelic({ forceRefresh: true });
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
    qaPage = 0; e.target.reset(); saveState(); render(); shiftArcaneRelic({ forceRefresh: true });
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
  document.getElementById('startDateInput').addEventListener('change', e => { const tab = getActiveTab(); if (!tab.archived) { tab.startDate = e.target.value; saveState(); render(); shiftArcaneRelic({ forceRefresh: true }); } });
  document.getElementById('endDateInput').addEventListener('change', e => { const tab = getActiveTab(); if (!tab.archived) { tab.endDate = e.target.value; saveState(); render(); shiftArcaneRelic({ forceRefresh: true }); } });

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
    state.activeTabId = newId; saveState(); render(); shiftArcaneRelic({ forceRefresh: true });
  });

  document.getElementById('returnActiveBtn').addEventListener('click', () => {
    const active = state.tabs.find(t => !t.archived);
    if (active) { casePage = 0; qaPage = 0; editingCaseIdx = null; editingQaIdx = null; expandedRemarkIdx = null; state.activeTabId = active.id; saveState(); render(); shiftArcaneRelic({ forceRefresh: true }); }
  });

  document.getElementById('resetLayoutBtn').addEventListener('click', () => { state.kpiOrder = ['bonus', 'csat', 'aht', 'quality', 'crt']; state.panelOrder = ['panel-forms', 'panel-tables']; saveState(); render(); });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    const headers = ['Case ID', 'Client', 'AHT', 'CSAT', 'CRT NE', 'RR', 'Remarks'];
    const rows = tab.cases.map(c => [c.id, c.client || '', c.aht, c.csat, c.crt, c.rr, `"${(c.remark || '').replace(/"/g, '""')}"`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${tab.name.replace(/\s+/g, '_')}_CaseFlow_Arcane.csv`;
    a.click();
    shiftArcaneRelic({ forceRefresh: true });
  });

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionPrefChange = () => {
      const reduced = mq.matches;
      document.querySelectorAll('.arcane-manifestation').forEach(el => {
        el.classList.toggle('reduced-motion', reduced);
      });
      syncDecorativeSmilMotion(document);
    };
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onMotionPrefChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onMotionPrefChange);
  }

  render();
  shiftArcaneRelic({ forceRefresh: true });
});
