const STORAGE_KEY = 'caseflow_arcane_v4';
const WALLPAPER_KEY = 'caseflow_arcane_wp_v4';
const CASE_PAGE_SIZE = 10;

// Display 4 QA monits per page so the bottom panel never clips inside the zero-scroll 100vh desktop lock
const QA_PAGE_SIZE = 4;


const LEAF_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #06b6d4, #0284c7)',
  'linear-gradient(135deg, #84cc16, #4d7c0f)'
];

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
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
}

const initialRange = getDefaultDateRange();

// Normalize legacy values ('Positive'/'Saved' -> 'Bounty', 'Negative'/'Lost' -> 'Doomed', 'Pending'/'N/A' -> 'Void')
function normalizeOutcome(val) {
  if (val === 'Bounty' || val === 'Positive' || val === 'Saved') return 'Bounty';
  if (val === 'Doomed' || val === 'Negative' || val === 'Lost') return 'Doomed';
  return 'Void';
}

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
        { id: 'CASE-1001', client: 'Nordic Retail', aht: 24.5, csat: 'Bounty', crt: 'Bounty', rr: 'Bounty', remark: 'Same-day resolution.' },
        { id: 'CASE-1002', client: 'Veloce Tech', aht: 29.0, csat: 'Bounty', crt: 'Bounty', rr: 'Bounty', remark: '' },
        { id: 'CASE-1003', client: 'Atlas Logistics', aht: 31.0, csat: 'Bounty', crt: 'Bounty', rr: 'Bounty', remark: '' }
      ],
      qaAudits: [
        { id: 'CASE-1001', auditor: 'Sarah M.', score: 96 },
        { id: 'CASE-1002', auditor: 'David K.', score: 92 }
      ]
    }
  ]
};

let state;
try {
  state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
} catch (err) {
  state = defaultState;
}

let casePage = 0;
let qaPage = 0;
let editingCaseIdx = null;
let editingQaIdx = null;
let expandedRemarkIdx = null;

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) {}
}

function getActiveTab() {
  if (!state || !Array.isArray(state.tabs) || !state.tabs.length) {
    state = defaultState;
  }
  const found = state.tabs.find(t => t.id === state.activeTabId);
  const tab = found ? found : state.tabs.at(0);
  if (!Array.isArray(tab.cases)) tab.cases = [];
  if (!Array.isArray(tab.qaAudits)) tab.qaAudits = [];
  // Migrate older case entries from Positive/Negative/Saved/Lost/Triage to Bounty/Doomed/Void & RR
  tab.cases.forEach(c => {
    c.csat = normalizeOutcome(c.csat);
    c.crt = normalizeOutcome(c.crt);
    c.rr = normalizeOutcome(c.rr !== undefined ? c.rr : c.triage);
    delete c.triage;
  });
  return tab;
}

function computeMetrics(tab) {
  const cases = tab.cases;
  const audits = tab.qaAudits;

  // CSAT: Void excluded from both numerator & denominator
  const validCsat = cases.filter(c => c.csat === 'Bounty' || c.csat === 'Doomed');
  const posCsat = validCsat.filter(c => c.csat === 'Bounty').length;
  const csatPct = validCsat.length ? (posCsat / validCsat.length) * 100 : null;

  // CRT NE (12H): Void excluded
  const validCrt = cases.filter(c => c.crt === 'Bounty' || c.crt === 'Doomed');
  const savedCrt = validCrt.filter(c => c.crt === 'Bounty').length;
  const crtPct = validCrt.length ? (savedCrt / validCrt.length) * 100 : null;

  // RR (30 Min): Bounty / (Bounty + Doomed), Void excluded
  const validRr = cases.filter(c => c.rr === 'Bounty' || c.rr === 'Doomed');
  const savedRr = validRr.filter(c => c.rr === 'Bounty').length;
  const rrPct = validRr.length ? (savedRr / validRr.length) * 100 : null;

  // AHT: Ignore Void/empty/NaN entries
  const validAht = cases.filter(c => c.aht !== '' && c.aht !== null && typeof c.aht === 'number' && !isNaN(c.aht));
  const avgAht = validAht.length ? validAht.reduce((s, c) => s + c.aht, 0) / validAht.length : null;

  // SQS (Quality Monit): Ignore Void/empty/NaN entries
  const validQual = audits.filter(q => q.score !== '' && q.score !== null && typeof q.score === 'number' && !isNaN(q.score));
  const avgQual = validQual.length ? validQual.reduce((s, q) => s + q.score, 0) / validQual.length : null;

  // Positive Bonus Tiers (€300 Max Cap)
  let csatBonus = 0;
  if (csatPct !== null) {
    if (csatPct >= 94) csatBonus = 180;
    else if (csatPct >= 89) csatBonus = 100;
  }
  const crtBonus = (crtPct !== null && crtPct >= 94) ? 80 : 0;
  const qualBonus = (avgQual !== null && avgQual >= 90) ? 40 : 0;

  let subtotal = csatBonus + crtBonus + qualBonus;
  let ahtPenalty = 0;
  let rrPenalty = 0;
  let forfeited = false;

  // Cutoff (<75% CSAT = -100% forfeit) vs KPI Modifiers (-€50 AHT >32m, -€25 RR <84%)
  if (csatPct !== null && csatPct < 75) {
    forfeited = true;
    subtotal = 0;
  } else {
    if (avgAht !== null && avgAht > 32) ahtPenalty = 50;
    if (rrPct !== null && rrPct < 84) rrPenalty = 25;
    subtotal = Math.max(0, subtotal - ahtPenalty - rrPenalty); // Never drops below €0
  }

  return {
    csatPct, csatBonus,
    crtPct, crtBonus,
    rrPct, rrPenalty,
    avgAht, ahtPenalty,
    avgQual, qualBonus,
    penalty: ahtPenalty + rrPenalty,
    totalBonus: subtotal,
    forfeited
  };
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

function applyWallpaper(src, isVideo) {
  const imgEl = document.getElementById('bgImage');
  const vidEl = document.getElementById('bgVideo');
  if (!imgEl || !vidEl) return;
  if (!src) {
    imgEl.classList.add('hidden');
    vidEl.classList.add('hidden');
    vidEl.removeAttribute('src');
    imgEl.removeAttribute('src');
    return;
  }
  if (isVideo) {
    imgEl.classList.add('hidden');
    vidEl.src = src;
    vidEl.classList.remove('hidden');
    vidEl.play().catch(() => {});
  } else {
    vidEl.classList.add('hidden');
    imgEl.src = src;
    imgEl.classList.remove('hidden');
  }
}
