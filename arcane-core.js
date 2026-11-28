// Storage keys and pagination defaults for CaseFlow Arcane
const STORAGE_KEY = 'caseflow_arcane_v4';
const WALLPAPER_KEY = 'caseflow_arcane_wp_v4';
const CASE_PAGE_SIZE = 5;
const QA_PAGE_SIZE = 3;

// Active table page and inline edit/remark state
let casePage = 0;
let qaPage = 0;
let editingCaseIdx = null;
let editingQaIdx = null;
let expandedRemarkIdx = null;

// Lightweight module registry for optional extensions
const CaseFlowModules = {
  registry: {},
  register(name, mod) {
    if (name && mod) this.registry[name] = mod;
  },
  get(name) {
    return this.registry[name] || null;
  }
};

// Format a month and year label relative to the current calendar month
function getCurrentMonthLabel(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Compute default first-to-last day date range for the current month
function getDefaultDateRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
}

// Standardize legacy outcome labels into Bounty, Doomed, or Void
function normalizeOutcome(val) {
  if (val === 'Bounty' || val === 'Doomed' || val === 'Void') return val;
  if (val === 'Yes' || val === 'Met') return 'Bounty';
  if (val === 'No' || val === 'Not Met') return 'Doomed';
  return 'Void';
}

// Build initial application state with a single active monthly chronicle
function createInitialState() {
  const range = getDefaultDateRange();
  const activeId = 'tab-' + Date.now();
  return {
    activeTabId: activeId,
    archivesExpanded: false,
    kpiOrder: ['bonus', 'csat', 'aht', 'quality', 'crt'],
    panelOrder: ['panel-forms', 'panel-tables'],
    tabs: [{
      id: activeId,
      name: getCurrentMonthLabel(0),
      startDate: range.start,
      endDate: range.end,
      archived: false,
      cases: [],
      qaAudits: []
    }]
  };
}

// Load and normalize saved state from localStorage, falling back cleanly on error
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tabs) || !parsed.tabs.length) return createInitialState();
    // Normalize case and audit collections across all saved tabs
    parsed.tabs.forEach(t => {
      if (!Array.isArray(t.cases)) t.cases = [];
      if (!Array.isArray(t.qaAudits)) t.qaAudits = [];
      t.cases.forEach(c => {
        if (!c.client) c.client = '—';
        c.csat = normalizeOutcome(c.csat);
        c.crt = normalizeOutcome(c.crt);
        c.rr = normalizeOutcome(c.rr);
        if (typeof c.remark !== 'string') c.remark = '';
      });
    });
    // Restore valid layout ordering arrays or fall back to defaults
    if (!parsed.kpiOrder || !Array.isArray(parsed.kpiOrder) || parsed.kpiOrder.length !== 5) {
      parsed.kpiOrder = ['bonus', 'csat', 'aht', 'quality', 'crt'];
    }
    if (!parsed.panelOrder || !Array.isArray(parsed.panelOrder) || parsed.panelOrder.length !== 2) {
      parsed.panelOrder = ['panel-forms', 'panel-tables'];
    }
    if (typeof parsed.archivesExpanded !== 'boolean') parsed.archivesExpanded = false;
    return parsed;
  } catch (e) {
    return createInitialState();
  }
}

let state = loadState();

// Persist current state to localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Return the selected tab or the first available tab as a fallback
function getActiveTab() {
  return state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
}

// Calculate KPI rates, bonuses, penalties, forfeiture, and final payout (protected financial rules)
function computeMetrics(tab) {
  const cases = tab.cases || [];
  const audits = tab.qaAudits || [];

  // Exclude Void outcomes from CSAT, CRT NE, and RR denominators
  const csatValid = cases.filter(c => c.csat === 'Bounty' || c.csat === 'Doomed');
  const csatPct = csatValid.length ? (csatValid.filter(c => c.csat === 'Bounty').length / csatValid.length) * 100 : null;

  const crtValid = cases.filter(c => c.crt === 'Bounty' || c.crt === 'Doomed');
  const crtPct = crtValid.length ? (crtValid.filter(c => c.crt === 'Bounty').length / crtValid.length) * 100 : null;

  const rrValid = cases.filter(c => c.rr === 'Bounty' || c.rr === 'Doomed');
  const rrPct = rrValid.length ? (rrValid.filter(c => c.rr === 'Bounty').length / rrValid.length) * 100 : null;

  // Average AHT across all logged cases and average QA score across all logged audits
  const avgAht = cases.length ? cases.reduce((sum, c) => sum + (parseFloat(c.aht) || 0), 0) / cases.length : null;
  const avgQual = audits.length ? audits.reduce((sum, q) => sum + (parseFloat(q.score) || 0), 0) / audits.length : null;

  // Positive bonus tiers
  let csatBonus = 0;
  if (csatPct !== null) {
    if (csatPct >= 94) csatBonus = 180;
    else if (csatPct >= 89) csatBonus = 100;
  }

  const crtBonus = (crtPct !== null && crtPct >= 94) ? 80 : 0;
  const qualBonus = (avgQual !== null && avgQual >= 90) ? 40 : 0;

  // Penalty deductions
  const ahtPenalty = (avgAht !== null && avgAht > 32) ? 50 : 0;
  const rrPenalty = (rrPct !== null && rrPct < 84) ? 25 : 0;
  const penalty = ahtPenalty + rrPenalty;

  // CSAT below 75% forfeits all bonus payout; otherwise deduct penalties from positive subtotal
  const forfeited = csatPct !== null && csatPct < 75;
  const positiveSubtotal = csatBonus + crtBonus + qualBonus;
  const totalBonus = forfeited ? 0 : Math.max(0, positiveSubtotal - penalty);

  return { csatPct, crtPct, rrPct, avgAht, avgQual, csatBonus, crtBonus, qualBonus, ahtPenalty, rrPenalty, penalty, forfeited, totalBonus };
}

// Create a DOM element with optional CSS class and text content
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

// Remove all child nodes from a DOM element
function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Apply or clear a video or image wallpaper in the background layer
function applyWallpaper(src, isVideo) {
  const vid = document.getElementById('bgVideo');
  const img = document.getElementById('bgImage');
  if (!vid || !img) return;

  if (!src) {
    vid.pause(); vid.removeAttribute('src'); vid.classList.add('hidden');
    img.removeAttribute('src'); img.classList.add('hidden');
    return;
  }

  if (isVideo) {
    img.removeAttribute('src'); img.classList.add('hidden');
    vid.src = src; vid.classList.remove('hidden'); vid.load(); vid.play().catch(() => {});
  } else {
    vid.pause(); vid.removeAttribute('src'); vid.classList.add('hidden');
    img.src = src; img.classList.remove('hidden');
  }
}

window.CaseFlowModules = CaseFlowModules;