/* ==========================================================================
   Adam Pollack | PPSC | Workmap — app.js
   Data model, Firebase path and storage keys are unchanged from v0.96, so
   existing boards, tasks and sign-ins carry over as-is.
   ========================================================================== */
'use strict';

/* ---------------------------------------------------------------- constants */
const PALETTE_15 = [
  { key: 'red', name: 'Red', hex: '#ef4444' },
  { key: 'orange', name: 'Orange', hex: '#f97316' },
  { key: 'amber', name: 'Amber', hex: '#f59e0b' },
  { key: 'yellow', name: 'Yellow', hex: '#eab308' },
  { key: 'lime', name: 'Lime', hex: '#84cc16' },
  { key: 'green', name: 'Green', hex: '#22c55e' },
  { key: 'emerald', name: 'Emerald', hex: '#10b981' },
  { key: 'teal', name: 'Teal', hex: '#14b8a6' },
  { key: 'cyan', name: 'Cyan', hex: '#06b6d4' },
  { key: 'blue', name: 'Blue', hex: '#3b82f6' },
  { key: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { key: 'violet', name: 'Violet', hex: '#8b5cf6' },
  { key: 'purple', name: 'Purple', hex: '#a855f7' },
  { key: 'pink', name: 'Pink', hex: '#ec4899' },
  { key: 'gray', name: 'Gray', hex: '#64748b' }
];
const COLOR_HEX_MAP = Object.fromEntries(PALETTE_15.map(c => [c.key, c.hex]));
const colorHex = key => COLOR_HEX_MAP[key] || COLOR_HEX_MAP.gray;
const colorName = key => (PALETTE_15.find(c => c.key === key) || { name: key || 'Gray' }).name;

const SHAPES_8 = [
  { key: 'pill', name: 'Pill', svg: '<svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="18" height="10" rx="5"/></svg>' },
  { key: 'roundrect', name: 'Rounded', svg: '<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="16" height="10" rx="3"/></svg>' },
  { key: 'rect', name: 'Rectangle', svg: '<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="16" height="10" rx=".5"/></svg>' },
  { key: 'square', name: 'Square', svg: '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="11" height="11" rx=".5"/></svg>' },
  { key: 'circle', name: 'Circle', svg: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="6"/></svg>' },
  { key: 'diamond', name: 'Diamond', svg: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M7 1l6 6-6 6-6-6z"/></svg>' },
  { key: 'hexagon', name: 'Hexagon', svg: '<svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 1h8l3 6-3 6H4L1 7z"/></svg>' },
  { key: 'triangle', name: 'Triangle', svg: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M7 1.5l6 11H1z"/></svg>' }
];
const shapeName = key => (SHAPES_8.find(s => s.key === key) || SHAPES_8[0]).name;
const POLYGON_POINTS = {
  diamond: '50,1 99,50 50,99 1,50',
  hexagon: '24,1 76,1 99,50 76,99 24,99 1,50',
  triangle: '50,1 99,99 1,99'
};
const FONT_SIZES = [
  { value: '', label: 'Default' },
  { value: '11px', label: 'Small' },
  { value: '13.5px', label: 'Normal' },
  { value: '16px', label: 'Large' },
  { value: '20px', label: 'Heading' }
];

const USER_AVATAR_MAP = {
  "mrnrYxtNwuV8vgru9Gr2KkJ1HzI2": "adam.jpeg",
  "b0Ji8It6eQOt0G3pvyvqrpWUF1m2": "taylor.jpg"
};

const LOCAL_STORAGE_KEY = 'mindmap_whiteboard_state_v3';
const THEME_STORAGE_KEY = 'mindmap_whiteboard_theme';
const UI_STORAGE_KEY = 'workmap_ui_v1'; // per-browser view prefs only (never synced)
const MAX_HISTORY = 30;
const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/* -------------------------------------------------------------------- icons */
const ICONS = {
  logo: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 8l3.3 7.5M16.5 8l-3.3 7.5"/>',
  canvas: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 8l3.3 7.5M16.5 8l-3.3 7.5"/>',
  outline: '<path d="M4 6h10M8 12h12M8 18h9M4 6v12"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  tasks: '<path d="M4 7l2 2 4-4M4 17l2 2 4-4M13 7h7M13 17h7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18z" fill="currentColor"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  cursor: '<path d="M5 3l14 8-6 2-3 6z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 013 0V12M11 11V4.5a1.5 1.5 0 013 0V12M14 11.5V6a1.5 1.5 0 013 0v8a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L3.5 13a1.5 1.5 0 012.4-1.8L8 13"/>',
  connect: '<circle cx="5.5" cy="12" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/><path d="M8 12h8"/>',
  flow: '<path d="M3 12h2M8 12h2M13 12h5M15 8l4 4-4 4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  layout: '<rect x="3" y="9" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M9 12h3v-6.5h3M12 12v6.5h3"/>',
  'select-all': '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  'check-square': '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  fold: '<path d="M8 4l4 4 4-4M8 20l4-4 4 4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a10 10 0 005.4-1.6"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  'chev-down': '<path d="M6 9l6 6 6-6"/>',
  'chev-right': '<path d="M9 6l6 6-6 6"/>',
  'chev-left': '<path d="M15 6l-6 6 6 6"/>',
  parent: '<path d="M6 20V10a4 4 0 014-4h8M14 2l4 4-4 4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  file: '<path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z"/><path d="M14 3v5h5"/>',
  logout: '<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16" cy="10" r="1.2" fill="currentColor"/><path d="M12 21a2 2 0 010-4h1.5a2 2 0 002-2"/>',
  reset: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
  cluster: '<circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><path d="M6 7l4 3M18 7l-4 3M6 17l4-3M18 17l-4-3"/>'
};
function icon(name, size = 16, sw = 1.8) {
  const body = ICONS[name] || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach(el => {
    const size = Number(el.dataset.size) || (el.closest('.rail-btn') ? 19 : el.closest('.tool') ? 17 : 16);
    const tmp = document.createElement('span');
    tmp.innerHTML = icon(el.dataset.icon, size, el.closest('.rail-btn') ? 1.7 : 1.8);
    const svg = tmp.firstChild;
    if (el.id) svg.id = el.id;
    el.replaceWith(svg);
  });
}
function setIcon(elOrId, name, size = 16) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  const tmp = document.createElement('span');
  tmp.innerHTML = icon(name, size);
  const svg = tmp.firstChild;
  if (el.id) svg.id = el.id;
  el.replaceWith(svg);
}

/* ---------------------------------------------------------------- utilities */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const pad2 = n => String(n).padStart(2, '0');
const toDateKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayKey = () => toDateKey(new Date());
function parseDateKey(key) {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatShortDate(key) {
  const d = parseDateKey(key);
  if (!d) return '';
  const opts = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}
function getLocalDateTimeString(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function rafThrottle(fn) {
  let queued = false;
  return function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

// Label text with legacy inline formatting markers removed (plain text, real newlines).
function getPlainLabel(rawText) {
  if (!rawText) return '';
  return String(rawText)
    .replace(/<span style="font-size:\s*[^;]+;">(.*?)<\/span>/gi, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<\/?u>/g, '');
}
function renderFormattedLabel(rawText) {
  return esc(getPlainLabel(rawText)).replace(/\n/g, '<br/>');
}
function nodeTitle(node) {
  if (!node) return '';
  return getPlainLabel(node.linkCaption || node.label).replace(/\s*\n\s*/g, ' ').trim();
}
function safeUrl(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // block javascript: etc.
  return 'https://' + u;
}

/* ------------------------------------------------------------ firebase init */
const FIREBASE_OK = typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined';
if (FIREBASE_OK && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = FIREBASE_OK ? firebase.database() : null;
const auth = FIREBASE_OK ? firebase.auth() : null;
window.boardRef = db ? db.ref("mindmap/board") : null;

/* ------------------------------------------------------------- default data */
const defaultNodes = [
  { id: "adam", label: "Adam\nPollack", x: 420, y: 460, color: "gray", shape: "pill", isHub: true },
  { id: "product", label: "Product\nTeam", x: 800, y: 220, color: "gray", shape: "pill" },
  { id: "shawn", label: "Shawn", x: 720, y: 110, color: "red", shape: "pill" },
  { id: "albert", label: "Albert", x: 890, y: 110, color: "red", shape: "pill" },
  { id: "grant", label: "Grant", x: 730, y: 320, color: "red", shape: "pill" },
  { id: "jon", label: "Jon", x: 885, y: 290, color: "red", shape: "pill" },
  { id: "se", label: "Sales\nEngineers", x: 380, y: 240, color: "gray", shape: "pill" },
  { id: "demo_shadows", label: "Demo\nShadows", x: 340, y: 110, color: "green", shape: "pill" },
  { id: "se_config", label: "Config", x: 500, y: 145, color: "green", shape: "pill" },
  { id: "ensogo", label: "ensogo\ntraining", x: 550, y: 265, color: "green", shape: "pill" },
  { id: "demo_prep", label: "Demo\nPrep", x: 215, y: 315, color: "green", shape: "pill" },
  { id: "profiles", label: "Profiles", x: 215, y: 220, color: "green", shape: "pill" },
  { id: "flex", label: "Flex", x: 740, y: 520, color: "gray", shape: "pill" },
  { id: "templates", label: "Templates", x: 730, y: 420, color: "blue", shape: "pill" },
  { id: "flex_config", label: "Config", x: 870, y: 460, color: "blue", shape: "pill" },
  { id: "learning", label: "Learning", x: 870, y: 560, color: "blue", shape: "pill" },
  { id: "demo_excl", label: "Demo!", x: 700, y: 610, color: "blue", shape: "pill" },
  { id: "rfp", label: "RFP", x: 350, y: 730, color: "purple", shape: "pill" },
  { id: "kb", label: "knowledge\nbase", x: 495, y: 730, color: "purple", shape: "pill" },
  { id: "process", label: "Process", x: 410, y: 825, color: "purple", shape: "pill" },
  { id: "inventive", label: "Inventive", x: 240, y: 800, color: "purple", shape: "pill" }
];
const defaultEdges = [
  ["adam", "se"], ["adam", "product"], ["adam", "flex"], ["adam", "rfp"],
  ["product", "shawn"], ["product", "albert"], ["product", "grant"], ["product", "jon"],
  ["se", "demo_shadows"], ["se", "se_config"], ["se", "ensogo"], ["se", "demo_prep"], ["se", "profiles"],
  ["flex", "templates"], ["flex", "flex_config"], ["flex", "learning"], ["flex", "demo_excl"],
  ["rfp", "kb"], ["rfp", "process"], ["rfp", "inventive"]
].map(([source, target], i) => ({ id: `e${i + 1}`, source, target }));

/* -------------------------------------------------------------- normalizers */
function normalizeNode(n) {
  return {
    ...n,
    x: Number(n.x) || 0,
    y: Number(n.y) || 0,
    width: Number(n.width) || 0,
    height: Number(n.height) || 0,
    color: n.color || 'gray',
    shape: n.shape || 'pill',
    fontSize: n.fontSize || '',
    bgColor: n.bgColor || '',
    textColor: n.textColor || '',
    linkUrl: n.linkUrl || '',
    linkCaption: n.linkCaption || '',
    isBold: !!n.isBold,
    isItalic: !!n.isItalic,
    isUnderline: !!n.isUnderline
  };
}
const normalizeEdge = e => ({ ...e, directed: !!e.directed });
function normalizeTasks(tasks) {
  return Array.isArray(tasks) ? tasks.filter(Boolean).map(t => ({
    ...t,
    description: t.description || '',
    dueDate: t.dueDate || '',
    completed: !!t.completed,
    completedAt: t.completedAt || '',
    completionNotes: t.completionNotes || ''
  })) : [];
}
function blankNode(extra) {
  return normalizeNode({ id: uid('node'), label: 'New node', x: 0, y: 0, color: 'gray', shape: 'pill', ...extra });
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return {
          nodes: parsed.nodes.filter(Boolean).map(normalizeNode),
          edges: parsed.edges.filter(Boolean).map(normalizeEdge),
          tasks: normalizeTasks(parsed.tasks),
          view: parsed.view && isFinite(parsed.view.zoom) ? parsed.view : { x: 0, y: 0, zoom: 1 },
          lastModified: parsed.lastModified || 0
        };
      }
    }
  } catch (e) {
    console.error("Local state parsing error:", e);
  }
  return {
    nodes: defaultNodes.map(normalizeNode),
    edges: JSON.parse(JSON.stringify(defaultEdges)),
    tasks: [],
    view: { x: 0, y: 0, zoom: 1 },
    lastModified: 0
  };
}
function loadUiPrefs() {
  try { return JSON.parse(localStorage.getItem(UI_STORAGE_KEY)) || {}; } catch (e) { return {}; }
}

/* -------------------------------------------------------------------- state */
const initial = loadInitialState();
const uiPrefs = loadUiPrefs();
let storedTheme = 'light';
try { storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light'; } catch (e) {}

const state = {
  nodes: initial.nodes,
  edges: initial.edges,
  tasks: initial.tasks,
  view: initial.view,
  lastModified: initial.lastModified,
  rev: 0,

  selectedNodeIds: new Set(),
  selectedEdgeId: null,
  mode: 'pan',
  connectSourceId: null,
  currentPage: 'canvas',
  theme: ['light', 'dark', 'black'].includes(storedTheme) ? storedTheme : 'light',

  isPanning: false,
  spacePan: false,
  panStart: { x: 0, y: 0 },
  isMarquee: false,
  marqueeStart: { x: 0, y: 0 },
  isDraggingGroup: false,
  dragStartWorld: { x: 0, y: 0 },
  nodeInitialPositions: new Map(),
  contextClickPos: null,
  clusterColorTargetRootId: null,

  collapsed: new Set(uiPrefs.collapsed || []),
  hiddenClusters: new Set(uiPrefs.hiddenClusters || []),
  panelCollapsed: !!uiPrefs.panelCollapsed,

  outlineCollapsed: new Set(),
  outlineFilter: '',
  outlineFocusId: null,
  outlineEditingId: null,

  table: {
    sort: 'label', dir: 'asc',
    group: uiPrefs.tableGroup !== false,
    cluster: '',
    selected: new Set(),
    collapsedGroups: new Set(),
    editing: null,
    columns: Object.assign({ parent: true, shape: true, connections: true, tasks: true, link: true, position: false }, uiPrefs.tableColumns || {})
  },

  tasksGroup: uiPrefs.tasksGroup || 'date',
  calHideCompleted: !!uiPrefs.calHideCompleted,
  hideCompletedTasks: false,
  completedOpen: false,

  calendarDate: new Date(),
  calendarMode: 'month',

  taskDialog: { taskId: null, nodeId: null }
};

function saveUiPrefs() {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({
      collapsed: [...state.collapsed],
      hiddenClusters: [...state.hiddenClusters],
      panelCollapsed: state.panelCollapsed,
      tableGroup: state.table.group,
      tableColumns: state.table.columns,
      tasksGroup: state.tasksGroup,
      calHideCompleted: state.calHideCompleted
    }));
  } catch (e) {}
}

/* -------------------------------------------------------------------- graph */
// Derived structure, rebuilt lazily whenever state.rev changes.
let graphCache = null;
function markDirty() { state.rev++; }
function graph() {
  if (graphCache && graphCache.rev === state.rev) return graphCache;
  const nodeMap = new Map();
  state.nodes.forEach(n => { if (!nodeMap.has(n.id)) nodeMap.set(n.id, n); });
  const children = new Map();   // undirected source -> [targets] (edge order)
  const parent = new Map();     // target -> first undirected source
  const degree = new Map();
  state.edges.forEach(e => {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) return;
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
    if (e.directed) return;
    if (!children.has(e.source)) children.set(e.source, []);
    const list = children.get(e.source);
    if (!list.includes(e.target)) list.push(e.target);
    if (!parent.has(e.target) && e.target !== e.source) parent.set(e.target, e.source);
  });
  const tasksByNode = new Map();
  state.tasks.forEach(t => {
    if (!tasksByNode.has(t.nodeId)) tasksByNode.set(t.nodeId, []);
    tasksByNode.get(t.nodeId).push(t);
  });
  graphCache = { rev: state.rev, nodeMap, children, parent, degree, tasksByNode };
  return graphCache;
}
const getNode = id => graph().nodeMap.get(id);
const childIds = id => graph().children.get(id) || [];
const parentId = id => graph().parent.get(id) || null;

function descendantIds(id) {
  const out = [];
  const seen = new Set([id]);
  const stack = [...childIds(id)];
  while (stack.length) {
    const cur = stack.shift();
    if (seen.has(cur)) continue;
    seen.add(cur);
    out.push(cur);
    childIds(cur).forEach(c => { if (!seen.has(c)) stack.push(c); });
  }
  return out;
}
function isAncestor(maybeAncestorId, id) {
  let cur = parentId(id);
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    if (cur === maybeAncestorId) return true;
    seen.add(cur);
    cur = parentId(cur);
  }
  return false;
}
function primaryRoot() {
  return state.nodes.find(n => n.id === 'adam') || state.nodes.find(n => n.isHub) || state.nodes[0] || null;
}
// Nodes hidden on the canvas (inside a collapsed branch, or in a hidden cluster).
function hiddenNodeSet() {
  const hidden = new Set();
  state.collapsed.forEach(id => {
    if (!getNode(id)) return;
    descendantIds(id).forEach(d => hidden.add(d));
  });
  if (state.hiddenClusters.size) {
    state.nodes.forEach(n => { if (state.hiddenClusters.has(n.color || 'gray')) hidden.add(n.id); });
  }
  return hidden;
}

/* ------------------------------------------------------------------ history */
const historyStack = [];
const redoStack = [];
const snapshot = () => JSON.stringify({ nodes: state.nodes, edges: state.edges, tasks: state.tasks });

function pushHistory() {
  const snap = snapshot();
  if (historyStack.length && historyStack[historyStack.length - 1] === snap) return;
  historyStack.push(snap);
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  redoStack.length = 0;
  updateUndoRedoButtons();
}
function updateUndoRedoButtons() {
  const u = $('btn-undo'), r = $('btn-redo');
  if (u) u.disabled = historyStack.length === 0;
  if (r) r.disabled = redoStack.length === 0;
}
function restoreSnapshot(snap) {
  const parsed = JSON.parse(snap);
  state.nodes = parsed.nodes;
  state.edges = parsed.edges;
  state.tasks = parsed.tasks || [];
  const ids = new Set(state.nodes.map(n => n.id));
  state.selectedNodeIds.forEach(id => { if (!ids.has(id)) state.selectedNodeIds.delete(id); });
  state.selectedEdgeId = null;
  commitState(true);
  updateUndoRedoButtons();
}
function performUndo() {
  if (!historyStack.length) return;
  redoStack.push(snapshot());
  restoreSnapshot(historyStack.pop());
  showToast("Undone");
}
function performRedo() {
  if (!redoStack.length) return;
  historyStack.push(snapshot());
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  restoreSnapshot(redoStack.pop());
  showToast("Redone");
}

/* ------------------------------------------------------------ toast, splash */
let toastTimeout;
function showToast(msg, ms = 2200) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), ms);
}
let splashDismissed = false;
function hideSplashScreen() {
  if (splashDismissed) return;
  splashDismissed = true;
  setTimeout(() => { const s = $('splash-screen'); if (s) s.classList.add('fade-out'); }, 300);
}

/* -------------------------------------------------------------- save status */
let isIncomingSync = false;
function formatTime(ts) {
  return (ts ? new Date(ts) : new Date()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}
function setSaveStatus(status, timestamp = null) {
  const dot = $('save-status-dot'), text = $('save-status-text');
  if (!dot || !text) return;
  dot.className = 'status-dot ' + ({ saving: 'saving', synced: 'ok', offline: 'offline', error: 'error' }[status] || 'ok');
  if (status === 'saving') text.textContent = 'Syncing…';
  else if (status === 'synced') text.textContent = `Synced ${formatTime(timestamp || state.lastModified)}`;
  else if (status === 'offline') text.textContent = 'Offline';
  else if (status === 'error') text.textContent = 'Sync error';
}

/* ------------------------------------------------------------------- commit */
function persistLocal() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      nodes: state.nodes, edges: state.edges, tasks: state.tasks, view: state.view, lastModified: state.lastModified
    }));
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }
}
// Save + sync + re-render. Pass skipHistoryPush=true when pushHistory() was already called.
function commitState(skipHistoryPush = false) {
  if (!skipHistoryPush) pushHistory();
  const now = Date.now();
  state.lastModified = now;
  markDirty();
  persistLocal();
  setSaveStatus('saving');
  if (window.boardRef && !isIncomingSync && auth && auth.currentUser) {
    window.boardRef.set({ nodes: state.nodes, edges: state.edges, tasks: state.tasks, lastModified: now })
      .then(() => setSaveStatus('synced', now))
      .catch(err => { console.error("Firebase write error:", err); setSaveStatus('error'); });
  } else {
    setTimeout(() => setSaveStatus('synced', now), 100);
  }
  refreshAll();
}
// Re-render everything that shows board data.
function refreshAll() {
  pruneSelection();
  if (state.currentPage === 'canvas') renderBoard(); // other pages re-render the board on switch
  renderClusterList();
  renderActivePage();
  renderInspector();
  updateRailBadge();
}
function pruneSelection() {
  const g = graph();
  state.selectedNodeIds.forEach(id => { if (!g.nodeMap.has(id)) state.selectedNodeIds.delete(id); });
  state.table.selected.forEach(id => { if (!g.nodeMap.has(id)) state.table.selected.delete(id); });
  if (state.selectedEdgeId && !state.edges.some(e => e.id === state.selectedEdgeId)) state.selectedEdgeId = null;
  if (state.connectSourceId && !g.nodeMap.has(state.connectSourceId)) state.connectSourceId = null;
}
function renderActivePage() {
  if (state.currentPage === 'outline') renderOutline();
  else if (state.currentPage === 'table') renderTable();
  else if (state.currentPage === 'tasks') renderTasks();
  else if (state.currentPage === 'calendar') renderCalendar();
}

/* -------------------------------------------------------------------- theme */
const THEME_UI = {
  light: { icon: 'sun', label: 'Light' },
  dark: { icon: 'moon', label: 'Dark' },
  black: { icon: 'contrast', label: 'Black' }
};
function applyTheme(theme) {
  state.theme = theme;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) {}
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-black');
  document.body.classList.add(`theme-${theme}`);
  const ui = THEME_UI[theme];
  setIcon('theme-toggle-icon', ui.icon, 17);
  const btn = $('btn-theme-toggle');
  if (btn) btn.title = `Theme: ${ui.label} (click to cycle)`;
  drawMinimap();
}
function cycleTheme() {
  const next = { light: 'dark', dark: 'black', black: 'light' }[state.theme] || 'light';
  applyTheme(next);
  showToast(`${THEME_UI[next].label} theme`);
}

/* =================================================================== CANVAS */
const SVG_NS = 'http://www.w3.org/2000/svg';
let renderedEdges = [];   // [{ edge, hit, line }]
let boardHidden = new Set();

function viewportEl() { return $('board-viewport'); }
function viewportRect() {
  const el = viewportEl();
  const r = el ? el.getBoundingClientRect() : null;
  if (r && r.width > 0) return r;
  return { left: 0, top: 0, width: window.innerWidth - 56, height: window.innerHeight - 52 };
}
function screenToWorld(sx, sy) {
  const r = viewportRect();
  return { x: (sx - r.left - state.view.x) / state.view.zoom, y: (sy - r.top - state.view.y) / state.view.zoom };
}
function worldToScreen(wx, wy) {
  const r = viewportRect();
  return { x: wx * state.view.zoom + state.view.x + r.left, y: wy * state.view.zoom + state.view.y + r.top };
}
function worldToLocal(wx, wy) { // relative to the canvas section
  return { x: wx * state.view.zoom + state.view.x, y: wy * state.view.zoom + state.view.y };
}

const scheduleOverlayUpdate = rafThrottle(() => { positionQuickbar(); positionEdgeChip(); updateMinimapView(); });
let viewSaveTimer = null;
function applyTransform() {
  const world = $('world-layer');
  if (world) world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.zoom})`;
  const zt = $('zoom-level-text');
  if (zt) zt.textContent = `${Math.round(state.view.zoom * 100)}%`;
  scheduleOverlayUpdate();
  clearTimeout(viewSaveTimer);
  viewSaveTimer = setTimeout(persistLocal, 600); // remember the view locally (never synced)
}

function createCurvedPath(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const curvature = Math.min(30, dist * 0.12);
  const cx = (x1 + x2) / 2 + (-dy / dist) * curvature;
  const cy = (y1 + y2) / 2 + (dx / dist) * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}
function curveMidpoint(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const c = Math.min(30, dist * 0.12);
  const cx = (x1 + x2) / 2 + (-dy / dist) * c, cy = (y1 + y2) / 2 + (dx / dist) * c;
  return { x: 0.25 * x1 + 0.5 * cx + 0.25 * x2, y: 0.25 * y1 + 0.5 * cy + 0.25 * y2 };
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substr(0, 2), 16)}, ${parseInt(h.substr(2, 2), 16)}, ${parseInt(h.substr(4, 2), 16)}, ${a})`;
}
function hexLuminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function selectedBranch() {
  if (state.selectedNodeIds.size !== 1) return null;
  const id = [...state.selectedNodeIds][0];
  if (!childIds(id).length || state.collapsed.has(id)) return null;
  const desc = descendantIds(id).filter(d => !boardHidden.has(d));
  return desc.length ? { id, set: new Set(desc) } : null;
}

function renderBoard() {
  const edgesG = $('edges-group'), nodesC = $('nodes-container'), hullG = $('hull-group');
  if (!edgesG || !nodesC) return;
  const g = graph();
  boardHidden = hiddenNodeSet();
  const branch = selectedBranch();

  // ---- edges
  edgesG.textContent = '';
  renderedEdges = [];
  const edgeFrag = document.createDocumentFragment();
  state.edges.forEach(edge => {
    const s = g.nodeMap.get(edge.source), t = g.nodeMap.get(edge.target);
    if (!s || !t || boardHidden.has(s.id) || boardHidden.has(t.id)) return;
    const d = createCurvedPath(s.x, s.y, t.x, t.y);
    const grp = document.createElementNS(SVG_NS, 'g');
    grp.setAttribute('class', 'edge-g');
    const hit = document.createElementNS(SVG_NS, 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('class', 'edge-hit');
    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', d);
    let cls = 'edge-line';
    if (edge.directed) cls += ' directed';
    else if (branch && (edge.source === branch.id || branch.set.has(edge.source)) && branch.set.has(edge.target)) cls += ' branch';
    if (state.selectedEdgeId === edge.id) cls += ' selected';
    line.setAttribute('class', cls);
    if (edge.directed) line.setAttribute('marker-end', '');
    hit.addEventListener('mousedown', e => e.stopPropagation());
    hit.addEventListener('click', e => { e.stopPropagation(); selectEdge(edge.id); });
    hit.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    hit.addEventListener('touchend', e => { e.preventDefault(); e.stopPropagation(); selectEdge(edge.id); });
    grp.appendChild(hit);
    grp.appendChild(line);
    edgeFrag.appendChild(grp);
    renderedEdges.push({ edge, hit, line });
  });
  edgesG.appendChild(edgeFrag);
  sizeSvgLayer();

  // ---- nodes
  nodesC.textContent = '';
  const nodeFrag = document.createDocumentFragment();
  state.nodes.forEach(node => {
    if (boardHidden.has(node.id)) return;
    nodeFrag.appendChild(buildNodeEl(node, branch));
  });
  nodesC.appendChild(nodeFrag);

  // ---- hull around the selected branch
  if (hullG) {
    hullG.textContent = '';
    if (branch) drawHull(hullG, branch);
  }

  positionQuickbar();
  positionEdgeChip();
  drawMinimap();
}

function buildNodeEl(node, branch) {
  const el = document.createElement('div');
  el.id = `node-${node.id}`;
  el.dataset.id = node.id;
  const shape = SHAPES_8.some(s => s.key === node.shape) ? node.shape : 'pill';
  const kids = childIds(node.id);
  const cls = ['node', `node-shape-${shape}`, `node-${node.color || 'gray'}`];
  if (node.isHub) cls.push('is-root');
  else if (kids.length) cls.push('is-hubbish');
  if (state.selectedNodeIds.has(node.id)) cls.push('selected');
  if (state.connectSourceId === node.id) cls.push('connect-source');
  if (branch && branch.set.has(node.id)) cls.push('in-branch');
  el.className = cls.join(' ');
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.style.setProperty('--c', colorHex(node.color));
  el.style.setProperty('--border', hexToRgba(colorHex(node.color), 0.55));
  el.style.setProperty('--borderHover', hexToRgba(colorHex(node.color), 0.95));

  const bgHex = node.bgColor && COLOR_HEX_MAP[node.bgColor];
  let textColor = '';
  if (bgHex) {
    el.classList.add('has-fill');
    el.style.setProperty('--fill', bgHex);
    el.style.setProperty('--border', bgHex);
    textColor = hexLuminance(bgHex) < 0.45 ? '#ffffff' : '#17181c';
  }
  if (node.textColor === 'black') textColor = '#000000';
  else if (node.textColor === 'white') textColor = '#ffffff';
  if (textColor) el.style.color = textColor;

  if (POLYGON_POINTS[shape]) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'node-poly');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', POLYGON_POINTS[shape]);
    svg.appendChild(poly);
    el.appendChild(svg);
  }

  const dot = document.createElement('span');
  dot.className = 'ndot';
  el.appendChild(dot);

  const label = document.createElement('span');
  label.className = 'nlabel';
  if (node.fontSize) label.style.fontSize = node.fontSize;
  if (node.isBold) label.style.fontWeight = '700';
  if (node.isItalic) label.style.fontStyle = 'italic';
  if (node.isUnderline) label.style.textDecoration = 'underline';
  const href = safeUrl(node.linkUrl);
  if (href) {
    const text = renderFormattedLabel(node.linkCaption || node.label);
    label.innerHTML = `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}${icon('external', 11, 2)}</a>`;
    const a = label.firstChild;
    a.addEventListener('mousedown', e => e.stopPropagation());
    a.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  } else {
    label.innerHTML = renderFormattedLabel(node.label);
  }
  el.appendChild(label);

  if (node.width) el.style.width = `${node.width}px`;
  if (node.height) el.style.height = `${node.height}px`;
  if (node.width || node.height) el.style.maxWidth = 'none';

  if (kids.length) {
    const fold = document.createElement('button');
    const collapsed = state.collapsed.has(node.id);
    fold.className = 'fold-btn' + (collapsed ? ' collapsed' : '');
    fold.title = collapsed ? 'Expand branch (.)' : 'Collapse branch (.)';
    fold.setAttribute('aria-label', fold.title);
    fold.textContent = collapsed ? `+${descendantIds(node.id).length}` : '–';
    ['mousedown', 'touchstart', 'dblclick'].forEach(ev => fold.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
    fold.addEventListener('click', e => { e.stopPropagation(); toggleCollapse(node.id); });
    el.appendChild(fold);
  }

  const handle = document.createElement('div');
  handle.className = 'resize-handle';
  handle.title = 'Resize';
  el.appendChild(handle);
  setupResizeEvents(handle, node, el);
  setupNodeEvents(el, node);
  return el;
}

// Give the SVG layer a real box (+viewBox in world coordinates) so exports and hit-testing see all edges.
function sizeSvgLayer(box) {
  const svg = $('svg-layer');
  if (!svg) return;
  let x, y, w, h;
  if (box) ({ x, y, w, h } = box);
  else {
    const vis = state.nodes.filter(n => !boardHidden.has(n.id));
    if (!vis.length) return;
    const b = boundsOf(vis);
    const pad = 600;
    x = Math.floor(b.minX - pad); y = Math.floor(b.minY - pad);
    w = Math.ceil(b.maxX - b.minX + pad * 2); h = Math.ceil(b.maxY - b.minY + pad * 2);
  }
  svg.style.left = `${x}px`; svg.style.top = `${y}px`;
  svg.style.width = `${w}px`; svg.style.height = `${h}px`;
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  // offset via a group transform (html2canvas ignores a viewBox origin)
  ['edges-group', 'hull-group'].forEach(id => { const g = $(id); if (g) g.setAttribute('transform', `translate(${-x} ${-y})`); });
}
function drawHull(hullG, branch) {
  const ids = [branch.id, ...branch.set];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  ids.forEach(id => {
    const n = getNode(id);
    const el = $(`node-${id}`);
    if (!n || !el) return;
    const w = el.offsetWidth / 2, h = el.offsetHeight / 2;
    minX = Math.min(minX, n.x - w); maxX = Math.max(maxX, n.x + w);
    minY = Math.min(minY, n.y - h); maxY = Math.max(maxY, n.y + h);
  });
  if (!isFinite(minX)) return;
  const p = 26;
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('class', 'hull');
  rect.setAttribute('x', minX - p); rect.setAttribute('y', minY - p - 14);
  rect.setAttribute('width', maxX - minX + p * 2); rect.setAttribute('height', maxY - minY + p * 2 + 14);
  rect.setAttribute('rx', 22);
  hullG.appendChild(rect);
  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('class', 'hull-label');
  label.setAttribute('x', minX - p + 16); label.setAttribute('y', minY - p + 4);
  label.textContent = `${nodeTitle(getNode(branch.id))} · ${branch.set.size}`.toUpperCase();
  hullG.appendChild(label);
}

function updateEdgeCoordinates() {
  const g = graph();
  renderedEdges.forEach(({ edge, hit, line }) => {
    const s = g.nodeMap.get(edge.source), t = g.nodeMap.get(edge.target);
    if (!s || !t) return;
    const d = createCurvedPath(s.x, s.y, t.x, t.y);
    hit.setAttribute('d', d);
    line.setAttribute('d', d);
  });
}

// Selection-only refresh: updates classes in place (no DOM rebuild, so double-click keeps working).
function updateSelectionVisuals() {
  const branch = selectedBranch();
  document.querySelectorAll('#nodes-container .node').forEach(el => {
    const id = el.dataset.id;
    el.classList.toggle('selected', state.selectedNodeIds.has(id));
    el.classList.toggle('connect-source', state.connectSourceId === id);
    el.classList.toggle('in-branch', !!(branch && branch.set.has(id)));
  });
  renderedEdges.forEach(({ edge, line }) => {
    line.classList.toggle('branch', !edge.directed && !!branch && (edge.source === branch.id || branch.set.has(edge.source)) && branch.set.has(edge.target));
    line.classList.toggle('selected', state.selectedEdgeId === edge.id);
  });
  const hullG = $('hull-group');
  if (hullG) { hullG.textContent = ''; if (branch) drawHull(hullG, branch); }
  positionQuickbar();
  positionEdgeChip();
  renderInspector();
  renderClusterList();
}

/* ---------------------------------------------------------- canvas overlays */
function positionQuickbar() {
  const qb = $('node-quickbar');
  if (!qb) return;
  const show = state.currentPage === 'canvas' && state.selectedNodeIds.size === 1 && !state.isDraggingGroup && state.mode !== 'connect' && state.mode !== 'connect-directed';
  if (!show) { qb.hidden = true; return; }
  const id = [...state.selectedNodeIds][0];
  const n = getNode(id), el = $(`node-${id}`);
  if (!n || !el) { qb.hidden = true; return; }
  const p = worldToLocal(n.x, n.y - el.offsetHeight / 2);
  qb.hidden = false;
  qb.style.left = `${p.x}px`;
  qb.style.top = `${p.y - 12}px`;
  const hasKids = childIds(id).length > 0;
  const foldBtn = qb.querySelector('[data-qa="collapse"]');
  if (foldBtn) foldBtn.style.display = hasKids ? '' : 'none';
  const focusBtn = qb.querySelector('[data-qa="focus"]');
  if (focusBtn) focusBtn.style.display = hasKids ? '' : 'none';
}
function positionEdgeChip() {
  const chip = $('edge-chip');
  if (!chip) return;
  const edge = state.selectedEdgeId && state.edges.find(e => e.id === state.selectedEdgeId);
  const s = edge && getNode(edge.source), t = edge && getNode(edge.target);
  if (!edge || !s || !t || state.currentPage !== 'canvas') { chip.hidden = true; return; }
  const m = curveMidpoint(s.x, s.y, t.x, t.y);
  const p = worldToLocal(m.x, m.y);
  chip.hidden = false;
  chip.style.left = `${p.x}px`;
  chip.style.top = `${p.y - 26}px`;
}

/* ---------------------------------------------------------------- minimap */
let minimapXform = null;
function drawMinimap() {
  const canvas = $('minimap-canvas');
  if (!canvas || state.currentPage !== 'canvas') return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const vis = state.nodes.filter(n => !boardHidden.has(n.id));
  if (!vis.length) { minimapXform = null; updateMinimapView(); return; }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  vis.forEach(n => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y); });
  const pad = 120;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const scale = Math.min(W / (maxX - minX), H / (maxY - minY));
  const ox = (W - (maxX - minX) * scale) / 2, oy = (H - (maxY - minY) * scale) / 2;
  minimapXform = { minX, minY, scale, ox, oy, W, H };
  const css = getComputedStyle(document.body);
  ctx.strokeStyle = css.getPropertyValue('--edge').trim() || '#bbb';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  renderedEdges.forEach(({ edge }) => {
    const s = getNode(edge.source), t = getNode(edge.target);
    if (!s || !t) return;
    ctx.moveTo(ox + (s.x - minX) * scale, oy + (s.y - minY) * scale);
    ctx.lineTo(ox + (t.x - minX) * scale, oy + (t.y - minY) * scale);
  });
  ctx.stroke();
  ctx.globalAlpha = 1;
  const ink = css.getPropertyValue('--ink').trim() || '#000';
  vis.forEach(n => {
    const x = ox + (n.x - minX) * scale, y = oy + (n.y - minY) * scale;
    ctx.fillStyle = n.isHub ? ink : colorHex(n.color);
    const w = n.isHub ? 16 : 11, h = n.isHub ? 9 : 7;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 3); else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill();
  });
  updateMinimapView();
}
function updateMinimapView() {
  const box = $('minimap-view'), mm = $('minimap');
  if (!box || !mm) return;
  if (!minimapXform) { box.style.display = 'none'; return; }
  const r = viewportRect();
  const tl = { x: -state.view.x / state.view.zoom, y: -state.view.y / state.view.zoom };
  const br = { x: (r.width - state.view.x) / state.view.zoom, y: (r.height - state.view.y) / state.view.zoom };
  const { minX, minY, scale, ox, oy, W, H } = minimapXform;
  const k = mm.clientWidth / W;
  let x1 = (ox + (tl.x - minX) * scale) * k, y1 = (oy + (tl.y - minY) * scale) * k;
  let x2 = (ox + (br.x - minX) * scale) * k, y2 = (oy + (br.y - minY) * scale) * k;
  x1 = clamp(x1, 0, mm.clientWidth); x2 = clamp(x2, 0, mm.clientWidth);
  y1 = clamp(y1, 0, mm.clientHeight); y2 = clamp(y2, 0, mm.clientHeight);
  box.style.display = (x2 - x1 < 2 || y2 - y1 < 2) ? 'none' : 'block';
  box.style.left = `${x1}px`; box.style.top = `${y1}px`;
  box.style.width = `${x2 - x1}px`; box.style.height = `${y2 - y1}px`;
  void H;
}
function minimapPanTo(clientX, clientY) {
  const mm = $('minimap');
  if (!mm || !minimapXform) return;
  const rect = mm.getBoundingClientRect();
  const k = minimapXform.W / mm.clientWidth;
  const px = (clientX - rect.left) * k, py = (clientY - rect.top) * k;
  const wx = (px - minimapXform.ox) / minimapXform.scale + minimapXform.minX;
  const wy = (py - minimapXform.oy) / minimapXform.scale + minimapXform.minY;
  const r = viewportRect();
  state.view.x = r.width / 2 - wx * state.view.zoom;
  state.view.y = r.height / 2 - wy * state.view.zoom;
  applyTransform();
}

/* ------------------------------------------------------------ view helpers */
function boundsOf(nodes) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  });
  return { minX, maxX, minY, maxY };
}
function fitNodes(nodes, { minZoom = 0.3, maxZoom = 1.2, padX = 220, padY = 200 } = {}) {
  if (!nodes.length) return;
  const r = viewportRect();
  const b = boundsOf(nodes);
  const spanX = Math.max(160, b.maxX - b.minX + padX);
  const spanY = Math.max(160, b.maxY - b.minY + padY);
  const zoom = clamp(Math.min(r.width / spanX, r.height / spanY), minZoom, maxZoom);
  state.view.zoom = zoom;
  state.view.x = r.width / 2 - ((b.minX + b.maxX) / 2) * zoom;
  state.view.y = r.height / 2 - ((b.minY + b.maxY) / 2) * zoom;
  applyTransform();
}
function centerDiagram() { // keeps zoom (legacy behaviour on load)
  const vis = state.nodes.filter(n => !boardHidden.has(n.id));
  if (!vis.length) return;
  const r = viewportRect();
  const b = boundsOf(vis);
  state.view.x = r.width / 2 - ((b.minX + b.maxX) / 2) * state.view.zoom;
  state.view.y = r.height / 2 - ((b.minY + b.maxY) / 2) * state.view.zoom;
  applyTransform();
}
function fitDiagram() {
  const vis = state.nodes.filter(n => !boardHidden.has(n.id));
  fitNodes(vis, { maxZoom: 1.1 });
}
function resetZoom() {
  const r = viewportRect();
  const c = screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
  state.view.zoom = 1;
  state.view.x = r.width / 2 - c.x;
  state.view.y = r.height / 2 - c.y;
  applyTransform();
}
function zoomBy(factor) {
  const r = viewportRect();
  const mx = r.width / 2, my = r.height / 2;
  const old = state.view.zoom;
  const z = clamp(old * factor, 0.2, 2.5);
  state.view.x = mx - (mx - state.view.x) * (z / old);
  state.view.y = my - (my - state.view.y) * (z / old);
  state.view.zoom = z;
  applyTransform();
}
function ensureVisibleOnCanvas(id) {
  // expand collapsed ancestors and un-hide its cluster so the node can be shown
  let changed = false;
  let cur = parentId(id);
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    if (state.collapsed.delete(cur)) changed = true;
    cur = parentId(cur);
  }
  const n = getNode(id);
  if (n && state.hiddenClusters.delete(n.color || 'gray')) changed = true;
  if (changed) saveUiPrefs();
  return changed;
}
function focusNodeOnCanvas(nodeId, { zoom = 1.25 } = {}) {
  const node = getNode(nodeId);
  if (!node) return;
  ensureVisibleOnCanvas(nodeId);
  switchPage('canvas');
  state.selectedNodeIds = new Set([nodeId]);
  state.selectedEdgeId = null;
  requestAnimationFrame(() => {
    const r = viewportRect();
    state.view.zoom = zoom;
    state.view.x = r.width / 2 - node.x * zoom;
    state.view.y = r.height / 2 - node.y * zoom;
    applyTransform();
    renderBoard();
    renderInspector();
    renderClusterList();
  });
}
function focusBranch(id) {
  const n = getNode(id);
  if (!n) return;
  if (!childIds(id).length) { focusNodeOnCanvas(id); return; }
  ensureVisibleOnCanvas(id);
  if (state.collapsed.delete(id)) saveUiPrefs();
  switchPage('canvas');
  state.selectedNodeIds = new Set([id]);
  renderBoard();
  renderInspector();
  const ids = [id, ...descendantIds(id)];
  requestAnimationFrame(() => fitNodes(ids.map(getNode).filter(Boolean), { minZoom: 0.4, maxZoom: 1.4 }));
  showToast(`Focused on ${nodeTitle(n)}`);
}

/* ----------------------------------------------------------------- selection */
function selectNodes(ids, { additive = false } = {}) {
  if (!additive) state.selectedNodeIds.clear();
  ids.forEach(id => state.selectedNodeIds.add(id));
  state.selectedEdgeId = null;
  updateSelectionVisuals();
}
function clearSelection() {
  if (!state.selectedNodeIds.size && !state.selectedEdgeId && !state.connectSourceId) return;
  state.selectedNodeIds.clear();
  state.selectedEdgeId = null;
  state.connectSourceId = null;
  updateSelectionVisuals();
}
function selectEdge(edgeId) {
  if (state.mode === 'connect' || state.mode === 'connect-directed') return;
  state.selectedEdgeId = state.selectedEdgeId === edgeId ? null : edgeId;
  state.selectedNodeIds.clear();
  updateSelectionVisuals();
}
function selectEntireDiagram() {
  switchPage('canvas');
  const vis = state.nodes.filter(n => !boardHidden.has(n.id));
  state.selectedNodeIds = new Set(vis.map(n => n.id));
  state.selectedEdgeId = null;
  updateSelectionVisuals();
  showToast(`Selected all ${vis.length} nodes`);
}

/* ------------------------------------------------------------------- modes */
const MODE_HINTS = {
  select: '',
  pan: '',
  connect: 'Connect: click two nodes to link them · Esc to finish',
  'connect-directed': 'Dotted flow: click the source, then the target · Esc to finish'
};
function setAppMode(mode) {
  state.mode = mode;
  state.connectSourceId = null;
  document.querySelectorAll('#tool-palette [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const vp = viewportEl();
  if (vp) {
    vp.classList.toggle('mode-select', mode === 'select');
    vp.classList.toggle('mode-connect', mode === 'connect' || mode === 'connect-directed');
  }
  const hint = $('mode-hint');
  if (hint) { hint.textContent = MODE_HINTS[mode] || ''; hint.hidden = !MODE_HINTS[mode]; }
  renderBoard();
}

/* ------------------------------------------------------------ node events */
function setupNodeEvents(nodeEl, node) {
  let down = false, dragged = false, sx = 0, sy = 0, wasSelected = false, additive = false, lastTap = 0;
  const THRESH = 3;

  const onDown = (cx, cy, isAdditive) => {
    closeAllPopovers();
    if (state.mode === 'connect' || state.mode === 'connect-directed') {
      handleConnectClick(node.id);
      return false;
    }
    down = true; dragged = false; sx = cx; sy = cy; additive = isAdditive;
    wasSelected = state.selectedNodeIds.has(node.id);
    if (isAdditive) {
      state.selectedNodeIds.add(node.id);
    } else if (!wasSelected) {
      state.selectedNodeIds.clear();
      state.selectedNodeIds.add(node.id);
    }
    state.selectedEdgeId = null;
    document.querySelectorAll('.node.selected').forEach(el => { if (!state.selectedNodeIds.has(el.dataset.id)) el.classList.remove('selected'); });
    state.selectedNodeIds.forEach(id => { const el = $(`node-${id}`); if (el) el.classList.add('selected'); });
    const w = screenToWorld(cx, cy);
    state.dragStartWorld = w;
    state.nodeInitialPositions.clear();
    const g = graph();
    state.selectedNodeIds.forEach(id => {
      const n = g.nodeMap.get(id);
      if (n) state.nodeInitialPositions.set(id, { x: n.x, y: n.y });
    });
    return true;
  };
  const onMove = (cx, cy) => {
    if (!down) return;
    if (!dragged && Math.hypot(cx - sx, cy - sy) > THRESH) {
      dragged = true;
      state.isDraggingGroup = true;
      pushHistory();
      $('node-quickbar').hidden = true;
      $('hull-group').textContent = '';
    }
    if (!dragged) return;
    const w = screenToWorld(cx, cy);
    const dx = w.x - state.dragStartWorld.x, dy = w.y - state.dragStartWorld.y;
    const g = graph();
    state.selectedNodeIds.forEach(id => {
      const start = state.nodeInitialPositions.get(id), n = g.nodeMap.get(id);
      if (!start || !n) return;
      n.x = Math.round(start.x + dx);
      n.y = Math.round(start.y + dy);
      const el = $(`node-${id}`);
      if (el) { el.style.left = `${n.x}px`; el.style.top = `${n.y}px`; }
    });
    updateEdgeCoordinates();
  };
  const onUp = () => {
    if (!down) return;
    down = false;
    if (dragged) {
      state.isDraggingGroup = false;
      commitState(true);
    } else {
      if (additive && wasSelected) state.selectedNodeIds.delete(node.id);
      else if (!additive) state.selectedNodeIds = new Set([node.id]);
      updateSelectionVisuals();
    }
  };

  nodeEl.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.resize-handle, .fold-btn, a')) return;
    e.stopPropagation();
    if (!onDown(e.clientX, e.clientY, e.shiftKey || e.ctrlKey || e.metaKey)) return;
    const mm = ev => onMove(ev.clientX, ev.clientY);
    const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); onUp(); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  });
  nodeEl.addEventListener('dblclick', e => {
    if (e.target.closest('.fold-btn, a')) return;
    e.stopPropagation(); e.preventDefault();
    openNodeEditor(node.id);
  });
  nodeEl.addEventListener('contextmenu', e => {
    e.preventDefault(); e.stopPropagation();
    if (!state.selectedNodeIds.has(node.id)) {
      state.selectedNodeIds = new Set([node.id]);
      state.selectedEdgeId = null;
      updateSelectionVisuals();
    }
    state.contextClickPos = screenToWorld(e.clientX, e.clientY);
    openNodeContextMenu(node.id, e.clientX, e.clientY);
  });
  nodeEl.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('.resize-handle, .fold-btn, a')) return;
    e.stopPropagation();
    const t = e.touches[0];
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      lastTap = 0;
      openNodeEditor(node.id);
      return;
    }
    lastTap = now;
    if (!onDown(t.clientX, t.clientY, false)) return;
    const tm = ev => { if (ev.touches.length === 1) { ev.preventDefault(); onMove(ev.touches[0].clientX, ev.touches[0].clientY); } };
    // preventDefault stops the browser's emulated mouse click, which could land on the inspector sheet
    const te = ev => { if (ev.cancelable) ev.preventDefault(); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', te); onUp(); };
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te, { passive: false });
  }, { passive: false });
}

function setupResizeEvents(handle, node, nodeEl) {
  let resizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
  const onDown = (cx, cy) => {
    resizing = true; sx = cx; sy = cy;
    sw = node.width || nodeEl.offsetWidth;
    sh = node.height || nodeEl.offsetHeight;
    pushHistory();
  };
  const onMove = (cx, cy) => {
    if (!resizing) return;
    const w = Math.max(64, Math.round(sw + (cx - sx) / state.view.zoom));
    const h = Math.max(36, Math.round(sh + (cy - sy) / state.view.zoom));
    node.width = w; node.height = h;
    nodeEl.style.width = `${w}px`; nodeEl.style.height = `${h}px`; nodeEl.style.maxWidth = 'none';
    updateEdgeCoordinates();
  };
  const onUp = () => { if (!resizing) return; resizing = false; commitState(true); };
  handle.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onDown(e.clientX, e.clientY);
    const mm = ev => onMove(ev.clientX, ev.clientY);
    const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); onUp(); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  });
  handle.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    onDown(e.touches[0].clientX, e.touches[0].clientY);
    const tm = ev => { if (ev.touches.length === 1) { ev.preventDefault(); onMove(ev.touches[0].clientX, ev.touches[0].clientY); } };
    const te = () => { window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', te); onUp(); };
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te);
  }, { passive: false });
}

/* -------------------------------------------------------------- mutations */
function handleConnectClick(nodeId) {
  if (!state.connectSourceId) {
    state.connectSourceId = nodeId;
    renderBoard();
    showToast(state.mode === 'connect-directed' ? 'Now click the target node' : 'Now click the node to connect to');
  } else if (state.connectSourceId === nodeId) {
    state.connectSourceId = null;
    renderBoard();
  } else {
    const src = state.connectSourceId;
    const directed = state.mode === 'connect-directed';
    const exists = state.edges.some(e => directed
      ? (e.source === src && e.target === nodeId && e.directed)
      : (!e.directed && ((e.source === src && e.target === nodeId) || (e.source === nodeId && e.target === src))));
    state.connectSourceId = null;
    if (exists) {
      showToast('Those nodes are already connected');
      renderBoard();
      return;
    }
    pushHistory();
    state.edges.push({ id: uid('edge'), source: src, target: nodeId, directed });
    commitState(true);
    showToast(directed ? 'Dotted flow added' : 'Nodes connected');
  }
}
function deleteEdge(edgeId) {
  if (!state.edges.some(e => e.id === edgeId)) return;
  pushHistory();
  state.edges = state.edges.filter(e => e.id !== edgeId);
  if (state.selectedEdgeId === edgeId) state.selectedEdgeId = null;
  commitState(true);
  showToast('Connection removed · Ctrl+Z to undo');
}
function deleteNodes(ids) {
  const del = new Set(ids);
  if (!del.size) return;
  pushHistory();
  state.nodes = state.nodes.filter(n => !del.has(n.id));
  state.edges = state.edges.filter(e => !del.has(e.source) && !del.has(e.target));
  state.tasks = state.tasks.filter(t => !del.has(t.nodeId));
  del.forEach(id => { state.selectedNodeIds.delete(id); state.collapsed.delete(id); state.table.selected.delete(id); });
  saveUiPrefs();
  commitState(true);
  showToast(`Deleted ${del.size === 1 ? '1 node' : del.size + ' nodes'} · Ctrl+Z to undo`);
}
const deleteNode = id => deleteNodes([id]);
function deleteSelected() {
  if (state.selectedEdgeId) { deleteEdge(state.selectedEdgeId); return; }
  if (state.selectedNodeIds.size) { deleteNodes([...state.selectedNodeIds]); return; }
  showToast('Nothing selected to delete');
}

function inheritStyle(from) {
  if (!from) return { color: 'red', shape: 'pill' };
  return {
    color: from.color || 'gray', shape: from.shape || 'pill', fontSize: from.fontSize || '',
    bgColor: from.bgColor || '', textColor: from.textColor || '',
    isBold: !!from.isBold, isItalic: !!from.isItalic, isUnderline: !!from.isUnderline
  };
}
function placeChild(parent) {
  const kids = childIds(parent.id).map(getNode).filter(Boolean);
  const gp = getNode(parentId(parent.id));
  const base = gp ? Math.atan2(parent.y - gp.y, parent.x - gp.x) : -Math.PI / 2;
  const dist = 170;
  const used = kids.map(k => Math.atan2(k.y - parent.y, k.x - parent.x));
  let best = base, bestScore = -1;
  for (let i = 0; i < 24; i++) {
    const off = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 12);
    const a = base + off;
    const score = used.length ? Math.min(...used.map(u => Math.abs(Math.atan2(Math.sin(a - u), Math.cos(a - u))))) : Math.PI;
    if (gp && Math.abs(Math.atan2(Math.sin(a - base), Math.cos(a - base))) > Math.PI * 0.75) continue;
    if (score > bestScore + 0.01) { best = a; bestScore = score; }
  }
  return { x: Math.round(parent.x + Math.cos(best) * dist), y: Math.round(parent.y + Math.sin(best) * dist) };
}
function viewportCenterWorld() {
  const r = viewportRect();
  return screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
}
// Creates a node (optionally as a child), selects it and opens it for editing.
function addNode({ parentId: pid = null, pos = null, label = 'New node', edit = true, extra = {} } = {}) {
  const parent = pid ? getNode(pid) : null;
  let p = pos;
  if (!p && parent) p = placeChild(parent);
  if (!p) {
    const c = viewportCenterWorld();
    p = { x: Math.round(c.x + (Math.random() * 40 - 20)), y: Math.round(c.y + (Math.random() * 40 - 20)) };
  }
  pushHistory();
  if (parent && state.collapsed.delete(parent.id)) saveUiPrefs();
  const node = blankNode({ label, x: Math.round(p.x), y: Math.round(p.y), ...inheritStyle(parent), ...extra });
  state.nodes.push(node);
  if (parent) state.edges.push({ id: uid('edge'), source: parent.id, target: node.id, directed: false });
  state.selectedNodeIds = new Set([node.id]);
  state.selectedEdgeId = null;
  commitState(true);
  if (edit && state.currentPage === 'canvas') openNodeEditor(node.id, { selectAll: true });
  return node;
}
function addChildOfSelected() {
  if (state.selectedNodeIds.size === 1) addNode({ parentId: [...state.selectedNodeIds][0] });
  else addNode({});
}
function addSiblingOfSelected() {
  if (state.selectedNodeIds.size !== 1) { addNode({}); return; }
  const id = [...state.selectedNodeIds][0];
  const pid = parentId(id);
  if (pid) addNode({ parentId: pid });
  else { const n = getNode(id); addNode({ pos: { x: n.x + 200, y: n.y }, extra: inheritStyle(n) }); }
}
function setParent(nodeId, newParentId) {
  if (nodeId === newParentId) return false;
  if (newParentId && isAncestor(nodeId, newParentId)) { showToast("Can't move a node under its own branch"); return false; }
  state.edges = state.edges.filter(e => !(!e.directed && e.target === nodeId && e.source !== newParentId));
  if (newParentId && !state.edges.some(e => !e.directed && e.source === newParentId && e.target === nodeId)) {
    state.edges.push({ id: uid('edge'), source: newParentId, target: nodeId, directed: false });
  }
  return true;
}

function toggleCollapse(id) {
  if (!childIds(id).length) { showToast('This node has no branch to collapse'); return; }
  if (state.collapsed.has(id)) state.collapsed.delete(id);
  else {
    state.collapsed.add(id);
    const hidden = new Set(descendantIds(id));
    state.selectedNodeIds.forEach(s => { if (hidden.has(s)) state.selectedNodeIds.delete(s); });
  }
  saveUiPrefs();
  renderBoard();
  renderInspector();
}
function setAllCollapsed(collapse) {
  state.collapsed.clear();
  if (collapse) {
    state.nodes.forEach(n => { if (!n.isHub && childIds(n.id).length) state.collapsed.add(n.id); });
    const hidden = hiddenNodeSet();
    state.selectedNodeIds.forEach(s => { if (hidden.has(s)) state.selectedNodeIds.delete(s); });
  }
  saveUiPrefs();
  renderBoard();
  renderInspector();
  showToast(collapse ? 'Collapsed all branches' : 'Expanded all branches');
}

function tidyBranch(id) {
  const node = getNode(id);
  if (!node) return;
  const kids = childIds(id).map(getNode).filter(Boolean);
  if (!kids.length) { showToast('Select a node with children to tidy'); return; }
  pushHistory();
  const gp = getNode(parentId(id));
  const n = kids.length;
  const radius = 160 + Math.max(0, n - 5) * 16;
  let angles;
  if (!gp) {
    angles = kids.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n);
  } else {
    const base = Math.atan2(node.y - gp.y, node.x - gp.x);
    const spread = Math.min(Math.PI * 1.25, Math.max(Math.PI / 3, (n - 1) * 0.42));
    angles = kids.map((_, i) => n === 1 ? base : base - spread / 2 + (spread * i) / (n - 1));
  }
  kids.forEach((k, i) => {
    const nx = Math.round(node.x + Math.cos(angles[i]) * radius);
    const ny = Math.round(node.y + Math.sin(angles[i]) * radius);
    const dx = nx - k.x, dy = ny - k.y;
    [k.id, ...descendantIds(k.id)].forEach(did => {
      const d = getNode(did);
      if (d && did !== id) { d.x += dx; d.y += dy; }
    });
  });
  commitState(true);
  showToast('Branch tidied · Ctrl+Z to undo');
}

function createIsolatedGroup() {
  switchPage('canvas');
  pushHistory();
  const chosen = PALETTE_15[Math.floor(Math.random() * PALETTE_15.length)].key;
  let ox = 500, oy = 500;
  if (state.nodes.length) {
    const b = boundsOf(state.nodes);
    ox = Math.round(b.maxX + 420);
    oy = Math.round(state.nodes.reduce((s, n) => s + n.y, 0) / state.nodes.length);
  }
  const base = blankNode({ label: 'New\nHub', x: ox, y: oy, color: 'gray' });
  const fresh = [base];
  [[-160, -130], [160, -130], [-160, 130], [160, 130]].forEach(([dx, dy], i) => {
    const c = blankNode({ label: `Branch ${i + 1}`, x: ox + dx, y: oy + dy, color: chosen });
    fresh.push(c);
    state.edges.push({ id: uid('edge'), source: base.id, target: c.id, directed: false });
  });
  state.nodes.push(...fresh);
  state.selectedNodeIds = new Set(fresh.map(n => n.id));
  commitState(true);
  requestAnimationFrame(() => fitNodes(fresh, { maxZoom: 1 }));
  showToast('Created a new cluster');
}

function resetToDefaultDiagram() {
  pushHistory();
  state.nodes = defaultNodes.map(normalizeNode);
  state.edges = JSON.parse(JSON.stringify(defaultEdges));
  state.tasks = [];
  state.selectedNodeIds.clear();
  state.collapsed.clear();
  saveUiPrefs();
  commitState(true);
  state.view.zoom = 1;
  requestAnimationFrame(centerDiagram);
  showToast('Reset to the original template · Ctrl+Z to undo');
}

/* ----------------------------------------------------------------- clusters */
function getDetectedClusters() {
  const g = graph();
  const map = new Map();
  state.nodes.forEach(n => {
    const key = n.color || 'gray';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(n);
  });
  const clusters = [];
  map.forEach((nodes, key) => {
    const ids = new Set(nodes.map(n => n.id));
    let name = null;
    if (nodes.length === 1) name = nodeTitle(nodes[0]);
    else {
      const hub = nodes.find(n => n.isHub || (g.children.get(n.id) || []).some(t => ids.has(t)));
      if (hub) name = nodeTitle(hub);
      if (!name) {
        for (const e of state.edges) {
          if (!e.directed && ids.has(e.target) && !ids.has(e.source)) {
            const p = g.nodeMap.get(e.source);
            if (p) { name = nodeTitle(p); break; }
          }
        }
      }
    }
    if (!name) name = nodeTitle(nodes[0]) || colorName(key);
    clusters.push({ id: key, color: key, name, count: nodes.length, nodes });
  });
  return clusters;
}
function selectDynamicCluster(colorKey) {
  const nodes = state.nodes.filter(n => (n.color || 'gray') === colorKey);
  if (!nodes.length) return;
  if (state.hiddenClusters.delete(colorKey)) saveUiPrefs();
  switchPage('canvas');
  state.selectedNodeIds = new Set(nodes.filter(n => !hiddenNodeSet().has(n.id)).map(n => n.id));
  state.selectedEdgeId = null;
  renderBoard();
  renderInspector();
  renderClusterList();
  requestAnimationFrame(() => fitNodes(nodes, { minZoom: 0.65, maxZoom: 1.4 }));
  showToast(`Selected ${nodes.length} nodes in the ${colorName(colorKey).toLowerCase()} cluster`);
}
function changeClusterColor(fromColor, toColor) {
  const nodes = state.nodes.filter(n => (n.color || 'gray') === fromColor);
  if (!nodes.length || fromColor === toColor) return;
  pushHistory();
  nodes.forEach(n => { n.color = toColor; });
  if (state.hiddenClusters.delete(fromColor)) saveUiPrefs();
  commitState(true);
  showToast(`Cluster recolored ${colorName(toColor).toLowerCase()}`);
}
function toggleClusterHidden(colorKey) {
  if (state.hiddenClusters.has(colorKey)) state.hiddenClusters.delete(colorKey);
  else state.hiddenClusters.add(colorKey);
  saveUiPrefs();
  const hidden = hiddenNodeSet();
  state.selectedNodeIds.forEach(id => { if (hidden.has(id)) state.selectedNodeIds.delete(id); });
  renderBoard();
  renderClusterList();
  renderInspector();
}
function renderClusterList() {
  const list = $('sidebar-cluster-list');
  if (!list) return;
  const q = ($('cluster-filter') ? $('cluster-filter').value : '').toLowerCase().trim();
  const clusters = getDetectedClusters().filter(c => !q || c.name.toLowerCase().includes(q) || c.color.includes(q));
  const countEl = $('cluster-node-count');
  if (countEl) countEl.textContent = `${state.nodes.length} node${state.nodes.length === 1 ? '' : 's'}`;
  const selColors = new Set([...state.selectedNodeIds].map(id => (getNode(id) || {}).color));
  list.innerHTML = clusters.length ? clusters.map(c => {
    const hidden = state.hiddenClusters.has(c.color);
    const allSel = c.nodes.every(n => state.selectedNodeIds.has(n.id)) && selColors.size === 1;
    return `<div class="crow${hidden ? ' is-hidden' : ''}${allSel ? ' active' : ''}" data-cluster="${esc(c.color)}" role="button" tabindex="0" title="Click to select · right-click to recolor">
      <span class="dot" style="background:${colorHex(c.color)}"></span>
      <span class="crow-name">${esc(c.name)}</span>
      <span class="crow-count">${c.count}</span>
      <button class="crow-eye" data-eye="${esc(c.color)}" aria-label="${hidden ? 'Show' : 'Hide'} cluster" title="${hidden ? 'Show' : 'Hide'} on canvas">${icon(hidden ? 'eye-off' : 'eye', 15, 1.7)}</button>
    </div>`;
  }).join('') : `<div class="empty-note">${q ? 'No matching clusters' : 'No clusters yet'}</div>`;
}

/* ------------------------------------------------------------- PNG export */
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const scriptLoads = {};
function loadScriptOnce(src) {
  if (!scriptLoads[src]) {
    scriptLoads[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete scriptLoads[src]; reject(new Error(`Failed to load ${src}`)); };
      document.head.appendChild(s);
    });
  }
  return scriptLoads[src];
}
function downloadDataUrl(url, filename) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function exportToPNG() {
  switchPage('canvas');
  const vis = state.nodes.filter(n => !boardHidden.has(n.id));
  const vp = viewportEl();
  if (!vp || !vis.length) { showToast('Nothing to export'); return; }
  showToast('Preparing PNG…', 4000);
  const prevView = { ...state.view };
  const prevSel = new Set(state.selectedNodeIds);
  const prevEdge = state.selectedEdgeId;
  const b = boundsOf(vis);
  const pad = 140;
  const w = Math.ceil(b.maxX - b.minX + pad * 2), h = Math.ceil(b.maxY - b.minY + pad * 2);
  let bg = '#ffffff', edgeStyles = [];
  const restore = () => {
    document.body.classList.remove('exporting');
    vp.style.right = ''; vp.style.bottom = ''; vp.style.width = ''; vp.style.height = '';
    state.view = prevView;
    state.selectedNodeIds = prevSel;
    state.selectedEdgeId = prevEdge;
    applyTransform();
    renderBoard();
  };
  loadScriptOnce(HTML2CANVAS_URL).then(() => {
    state.selectedNodeIds = new Set();
    state.selectedEdgeId = null;
    document.body.classList.add('exporting');
    renderBoard();
    state.view = { x: -b.minX + pad, y: -b.minY + pad, zoom: 1 };
    applyTransform();
    vp.style.right = 'auto'; vp.style.bottom = 'auto';
    vp.style.width = `${w}px`; vp.style.height = `${h}px`;
    bg = getComputedStyle(document.body).getPropertyValue('--canvas').trim() || '#ffffff';
    // Edges are drawn onto the final canvas directly (html2canvas misplaces SVG), nodes come from html2canvas.
    edgeStyles = renderedEdges.map(({ edge, line }) => {
      const cs = getComputedStyle(line);
      return { d: line.getAttribute('d'), stroke: cs.stroke, width: parseFloat(cs.strokeWidth) || 1.6, dash: cs.strokeDasharray };
    });
    return new Promise(r => setTimeout(r, 120)).then(() => window.html2canvas(vp, {
      scale: 2, useCORS: true, logging: false, width: w, height: h, windowWidth: w, windowHeight: h,
      backgroundColor: null, ignoreElements: el => el.id === 'svg-layer'
    }));
  }).then(nodesCanvas => {
    const scale = 2;
    const out = document.createElement('canvas');
    out.width = nodesCanvas.width; out.height = nodesCanvas.height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.setTransform(scale, 0, 0, scale, scale * (-b.minX + pad), scale * (-b.minY + pad));
    ctx.lineCap = 'round';
    edgeStyles.forEach(es => {
      ctx.strokeStyle = es.stroke;
      ctx.lineWidth = es.width;
      ctx.setLineDash(es.dash && es.dash !== 'none' ? es.dash.split(/[ ,]+/).map(parseFloat).filter(n => !isNaN(n)) : []);
      ctx.stroke(new Path2D(es.d));
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(nodesCanvas, 0, 0);
    restore();
    downloadDataUrl(out.toDataURL('image/png'), 'Adam_Pollack_PPSC_Workmap.png');
    showToast('PNG exported');
  }).catch(err => {
    console.error('PNG export error:', err);
    restore();
    showToast('Failed to export PNG');
  });
}

/* ================================================================ INSPECTOR */
const insp = { sig: '', applyBranch: false, labelPushed: false, fieldPushed: false };

function inspectorVisible() {
  return state.currentPage === 'canvas' && state.selectedNodeIds.size > 0;
}
function renderInspector(force = false) {
  const panel = $('inspector'), body = $('inspector-body');
  if (!panel || !body) return;
  if (insp.suppress) return;
  if (!inspectorVisible()) {
    if (!panel.hidden) { panel.hidden = true; insp.sig = ''; requestAnimationFrame(scheduleOverlayUpdate); }
    return;
  }
  const ids = [...state.selectedNodeIds];
  const sig = ids.join('|') + '#' + state.rev + '#' + state.collapsed.size;
  const typing = panel.contains(document.activeElement) && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (!force && typing && insp.sig.split('#')[0] === ids.join('|')) return; // don't disturb typing
  if (!force && sig === insp.sig && !panel.hidden) return;
  insp.sig = sig;
  const wasHidden = panel.hidden;
  panel.hidden = false;
  body.innerHTML = ids.length === 1 ? nodeInspectorHTML(getNode(ids[0])) : multiInspectorHTML(ids.map(getNode).filter(Boolean));
  if (wasHidden) requestAnimationFrame(() => { if (ids.length === 1) ensureNodeVisible(ids[0]); scheduleOverlayUpdate(); });
}

function swatchRow(current, act, { none = false, noneLabel = 'None' } = {}) {
  let html = '<div class="swatches">';
  if (none) html += `<button class="sw none${!current ? ' on' : ''}" data-act="${act}" data-val="" title="${noneLabel}" aria-label="${noneLabel}">${icon('x', 11, 2.4)}</button>`;
  html += PALETTE_15.map(c => `<button class="sw${current === c.key ? ' on' : ''}" data-act="${act}" data-val="${c.key}" style="background:${c.hex}" title="${c.name}" aria-label="${c.name}${current === c.key ? ' (selected)' : ''}"></button>`).join('');
  return html + '</div>';
}
function shapeSeg(current, mixed = false) {
  return `<div class="seg-ctl" role="radiogroup" aria-label="Shape">${SHAPES_8.map(s =>
    `<button class="seg${!mixed && current === s.key ? ' active' : ''}" data-act="shape" data-val="${s.key}" title="${s.name}" aria-label="${s.name}">${s.svg}</button>`).join('')}</div>`;
}

function nodeInspectorHTML(node) {
  if (!node) return '';
  const kids = childIds(node.id);
  const desc = kids.length ? descendantIds(node.id).length : 0;
  const pid = parentId(node.id);
  const parent = pid ? getNode(pid) : null;
  const tasks = (graph().tasksByNode.get(node.id) || []).slice().sort((a, b) => (a.completed - b.completed) || String(a.dueDate || '9').localeCompare(String(b.dueDate || '9')));
  const done = tasks.filter(t => t.completed).length;
  const today = todayKey();
  const kicker = node.isHub ? 'Root' : kids.length ? `Branch · ${desc} below` : 'Node';
  const collapsed = state.collapsed.has(node.id);
  return `
    <div class="insp-head">
      <div class="insp-kicker"><span class="dot" style="background:${colorHex(node.color)}"></span>${esc(kicker)}${collapsed ? ' · collapsed' : ''}</div>
      <button class="icon-btn sm" data-act="close" aria-label="Close inspector" title="Close (Esc)">${icon('x', 15)}</button>
    </div>
    <div class="insp-scroll">
      <label class="insp-section">
        <span class="label">Label</span>
        <textarea id="insp-label" class="field insp-label-input" rows="2" placeholder="Node label">${esc(getPlainLabel(node.label))}</textarea>
      </label>

      <div class="insp-section">
        <span class="label">Parent</span>
        <button class="field picker-btn" data-act="parent">${parent ? `<span class="dot" style="background:${colorHex(parent.color)}"></span><span>${esc(nodeTitle(parent))}</span>` : '<span class="ph">None (top level)</span>'}<span class="push">${icon('chev-down', 14)}</span></button>
      </div>

      <div class="insp-section">
        <div class="insp-row-head"><span class="label">Color</span>
          ${kids.length ? `<label class="check-row" style="font-weight:400;font-size:12px;color:var(--sub)"><input type="checkbox" id="insp-apply-branch" ${insp.applyBranch ? 'checked' : ''}/>Whole branch</label>` : ''}
        </div>
        ${swatchRow(node.color, 'color')}
      </div>

      <div class="insp-section">
        <span class="label">Fill</span>
        ${swatchRow(node.bgColor, 'fill', { none: true, noneLabel: 'No fill' })}
      </div>

      <div class="insp-section">
        <span class="label">Shape</span>
        ${shapeSeg(node.shape)}
      </div>

      <div class="insp-section">
        <span class="label">Text</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <div class="seg-ctl">
            <button class="seg fmt-b" data-act="fmt" data-val="isBold" aria-pressed="${!!node.isBold}" title="Bold">B</button>
            <button class="seg fmt-i" data-act="fmt" data-val="isItalic" aria-pressed="${!!node.isItalic}" title="Italic">I</button>
            <button class="seg fmt-u" data-act="fmt" data-val="isUnderline" aria-pressed="${!!node.isUnderline}" title="Underline">U</button>
          </div>
          <select class="field select" data-act="size" aria-label="Font size" style="flex:1;height:36px">
            ${FONT_SIZES.map(f => `<option value="${f.value}"${(node.fontSize || '') === f.value ? ' selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="seg-ctl" role="radiogroup" aria-label="Text color">
          ${[['', 'Auto'], ['black', 'Black'], ['white', 'White']].map(([v, l]) => `<button class="seg${(node.textColor || '') === v ? ' active' : ''}" data-act="textcolor" data-val="${v}">${l}</button>`).join('')}
        </div>
      </div>

      <div class="insp-section">
        <span class="label">Link</span>
        <label class="input-icon">${icon('link', 14)}<input id="insp-url" class="field" placeholder="Paste a URL" value="${esc(node.linkUrl)}" /></label>
        <input id="insp-caption" class="field" placeholder="Link caption (optional)" value="${esc(node.linkCaption)}" />
      </div>

      <div class="insp-section">
        <div class="insp-row-head"><span class="label">Tasks</span><span class="mono-muted">${tasks.length ? `${done} / ${tasks.length}` : ''}</span></div>
        ${tasks.length ? `<div class="insp-tasks">${tasks.map(t => `
          <div class="insp-task${t.completed ? ' done' : ''}">
            <input type="checkbox" data-act="task-toggle" data-id="${esc(t.id)}" ${t.completed ? 'checked' : ''} aria-label="Mark complete" />
            <button class="t-desc" data-act="task-open" data-id="${esc(t.id)}" title="Open task">${esc(t.description || 'Untitled task')}</button>
            <span class="t-due${!t.completed && t.dueDate && t.dueDate < today ? ' overdue' : ''}">${esc(formatShortDate(t.dueDate))}</span>
          </div>`).join('')}</div>` : ''}
        <button class="link-btn" data-act="task-add">${icon('plus', 14, 2)}Add task</button>
      </div>

      <div class="insp-section">
        <div class="mini-list">
          <span>${icon('connect', 14)}${graph().degree.get(node.id) || 0} connection${(graph().degree.get(node.id) || 0) === 1 ? '' : 's'}</span>
          <span>${icon('target', 14)}<span class="mono-muted">X ${Math.round(node.x)} · Y ${Math.round(node.y)}</span></span>
          ${node.width || node.height ? `<span>${icon('fit', 14)}<button class="link-btn" style="height:auto" data-act="reset-size">Reset size</button></span>` : ''}
        </div>
      </div>
    </div>
    <div class="insp-foot">
      ${kids.length ? `<button class="btn" data-act="focus">${icon('target', 14)}Focus branch</button>` : `<button class="btn" data-act="add-child">${icon('plus', 14)}Add child</button>`}
      <button class="icon-btn" data-act="delete" aria-label="Delete node" title="Delete (Del)">${icon('trash', 15)}</button>
    </div>`;
}

function multiInspectorHTML(nodes) {
  const colors = new Set(nodes.map(n => n.color));
  const shapes = new Set(nodes.map(n => n.shape || 'pill'));
  const fills = new Set(nodes.map(n => n.bgColor || ''));
  const allB = nodes.every(n => n.isBold), allI = nodes.every(n => n.isItalic), allU = nodes.every(n => n.isUnderline);
  return `
    <div class="insp-head">
      <div class="insp-kicker">${icon('select-all', 14)}${nodes.length} nodes selected</div>
      <button class="icon-btn sm" data-act="close" aria-label="Clear selection" title="Clear selection (Esc)">${icon('x', 15)}</button>
    </div>
    <div class="insp-scroll">
      <div class="insp-section"><span class="label">Color</span>${swatchRow(colors.size === 1 ? [...colors][0] : null, 'color')}</div>
      <div class="insp-section"><span class="label">Fill</span>${swatchRow(fills.size === 1 ? [...fills][0] : null, 'fill', { none: true, noneLabel: 'No fill' })}</div>
      <div class="insp-section"><span class="label">Shape</span>${shapeSeg(shapes.size === 1 ? [...shapes][0] : '', shapes.size !== 1)}</div>
      <div class="insp-section"><span class="label">Text</span>
        <div class="seg-ctl" style="align-self:flex-start">
          <button class="seg fmt-b" data-act="fmt" data-val="isBold" aria-pressed="${allB}">B</button>
          <button class="seg fmt-i" data-act="fmt" data-val="isItalic" aria-pressed="${allI}">I</button>
          <button class="seg fmt-u" data-act="fmt" data-val="isUnderline" aria-pressed="${allU}">U</button>
        </div>
      </div>
      <div class="insp-section"><span class="label">Arrange</span>
        <div class="btn-row">
          <button class="btn" data-act="align-row">Align in a row</button>
          <button class="btn" data-act="align-col">Align in a column</button>
        </div>
      </div>
      <div class="insp-empty" style="padding:0">Drag any selected node to move the group. Shift-click to add or remove nodes.</div>
    </div>
    <div class="insp-foot">
      <button class="btn" data-act="fit-selection">${icon('fit', 14)}Zoom to selection</button>
      <button class="icon-btn" data-act="delete" aria-label="Delete selected" title="Delete (Del)">${icon('trash', 15)}</button>
    </div>`;
}

// Pan just enough to keep a node clear of the canvas edges and of the inspector panel.
function ensureNodeVisible(id) {
  const el = $(`node-${id}`);
  if (!el || state.currentPage !== 'canvas') return;
  const vr = viewportRect();
  let right = vr.left + vr.width, bottom = vr.top + vr.height;
  const panel = $('inspector');
  if (panel && !panel.hidden) {
    const pr = panel.getBoundingClientRect();
    if (pr.top > vr.top + 40) bottom = Math.min(bottom, pr.top);          // bottom sheet (phones)
    else if (pr.left < right - 2) right = Math.min(right, pr.left);        // overlay panel (tablets)
  }
  const r = el.getBoundingClientRect();
  const m = 40;
  let dx = 0, dy = 0;
  if (r.right > right - m) dx = (right - m) - r.right;
  if (r.left + dx < vr.left + m) dx = (vr.left + m) - r.left;
  if (r.bottom > bottom - m) dy = (bottom - m) - r.bottom;
  if (r.top + dy < vr.top + m + 30) dy = (vr.top + m + 30) - r.top;
  if (!dx && !dy) return;
  state.view.x += dx;
  state.view.y += dy;
  applyTransform();
}
function selectedNodes() { return [...state.selectedNodeIds].map(getNode).filter(Boolean); }
function targetsForStyle() {
  const nodes = selectedNodes();
  if (nodes.length === 1 && insp.applyBranch) return [nodes[0], ...descendantIds(nodes[0].id).map(getNode).filter(Boolean)];
  return nodes;
}
function updateNodeLabelDom(node) {
  const el = $(`node-${node.id}`);
  const label = el && el.querySelector('.nlabel');
  if (!label || safeUrl(node.linkUrl)) { scheduleBoardRender(); return; }
  label.innerHTML = renderFormattedLabel(node.label);
  scheduleOverlayUpdate();
}
const scheduleBoardRender = rafThrottle(() => renderBoard());

function wireInspector() {
  const body = $('inspector-body');
  body.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.tagName === 'SELECT' || btn.type === 'checkbox') return;
    const act = btn.dataset.act, val = btn.dataset.val;
    const nodes = selectedNodes();
    const one = nodes.length === 1 ? nodes[0] : null;
    switch (act) {
      case 'close': clearSelection(); break;
      case 'color': pushHistory(); targetsForStyle().forEach(n => { n.color = val; }); commitState(true); break;
      case 'fill': pushHistory(); nodes.forEach(n => { n.bgColor = val; }); commitState(true); break;
      case 'shape': pushHistory(); nodes.forEach(n => { n.shape = val; }); commitState(true); break;
      case 'textcolor': pushHistory(); nodes.forEach(n => { n.textColor = val; }); commitState(true); break;
      case 'fmt': {
        const all = nodes.every(n => n[val]);
        pushHistory(); nodes.forEach(n => { n[val] = !all; }); commitState(true); break;
      }
      case 'parent': if (one) openPicker({
        anchor: btn, current: parentId(one.id), allowNone: true, noneLabel: 'None (top level)',
        exclude: new Set([one.id, ...descendantIds(one.id)]),
        onPick: pid => { pushHistory(); if (setParent(one.id, pid)) commitState(true); else historyStack.pop(); }
      }); break;
      case 'task-add': if (one) openTaskDialog({ nodeId: one.id }); break;
      case 'task-open': openTaskDialog({ taskId: btn.dataset.id }); break;
      case 'focus': if (one) focusBranch(one.id); break;
      case 'add-child': if (one) addNode({ parentId: one.id }); break;
      case 'delete': deleteSelected(); break;
      case 'reset-size': if (one) { pushHistory(); one.width = 0; one.height = 0; commitState(true); } break;
      case 'fit-selection': fitNodes(nodes, { maxZoom: 1.4 }); break;
      case 'align-row': case 'align-col': {
        pushHistory();
        const sorted = nodes.slice().sort((a, b) => act === 'align-row' ? a.x - b.x : a.y - b.y);
        const avg = sorted.reduce((s, n) => s + (act === 'align-row' ? n.y : n.x), 0) / sorted.length;
        const start = act === 'align-row' ? sorted[0].x : sorted[0].y;
        const step = act === 'align-row' ? 170 : 80;
        sorted.forEach((n, i) => { if (act === 'align-row') { n.y = Math.round(avg); n.x = start + i * step; } else { n.x = Math.round(avg); n.y = start + i * step; } });
        commitState(true);
        break;
      }
    }
  });
  body.addEventListener('change', e => {
    const t = e.target;
    const nodes = selectedNodes();
    if (t.id === 'insp-apply-branch') { insp.applyBranch = t.checked; return; }
    if (t.dataset.act === 'size') { pushHistory(); nodes.forEach(n => { n.fontSize = t.value; }); commitState(true); return; }
    if (t.dataset.act === 'task-toggle') { toggleTaskComplete(t.dataset.id, t.checked); return; }
  });
  // text fields: live preview, single history entry, commit on blur
  body.addEventListener('focusin', e => {
    if (['insp-label', 'insp-url', 'insp-caption'].includes(e.target.id)) { insp.fieldPushed = false; insp.fieldStart = e.target.value; }
  });
  body.addEventListener('input', e => {
    const t = e.target;
    const node = selectedNodes()[0];
    if (!node || state.selectedNodeIds.size !== 1) return;
    if (!['insp-label', 'insp-url', 'insp-caption'].includes(t.id)) return;
    if (!insp.fieldPushed) { pushHistory(); insp.fieldPushed = true; }
    if (t.id === 'insp-label') { if (t.value.trim()) { node.label = t.value; updateNodeLabelDom(node); } }
    else if (t.id === 'insp-url') { node.linkUrl = t.value.trim(); scheduleBoardRender(); }
    else if (t.id === 'insp-caption') { node.linkCaption = t.value.trim(); scheduleBoardRender(); }
  });
  body.addEventListener('focusout', e => {
    const t = e.target;
    if (!['insp-label', 'insp-url', 'insp-caption'].includes(t.id)) return;
    if (t.id === 'insp-label') {
      const node = getNode(insp.sig.split('#')[0]);
      if (node && !t.value.trim()) { t.value = getPlainLabel(node.label); }
      if (node && t.value.trim()) node.label = t.value.trim();
    }
    if (insp.fieldPushed) {
      insp.fieldPushed = false;
      // Don't rebuild the inspector here: the click that caused this blur may be on one of its buttons.
      insp.suppress = true;
      try { commitState(true); } finally { insp.suppress = false; }
    }
  });
  body.addEventListener('keydown', e => {
    if (e.target.id === 'insp-label' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
    else if ((e.target.id === 'insp-url' || e.target.id === 'insp-caption') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
  });
}

function openNodeEditor(id, { selectAll = false } = {}) {
  if (!getNode(id)) return;
  if (state.currentPage !== 'canvas') switchPage('canvas');
  state.selectedNodeIds = new Set([id]);
  state.selectedEdgeId = null;
  updateSelectionVisuals();
  renderInspector(true);
  const ta = $('insp-label');
  if (ta) {
    ta.focus();
    if (selectAll) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length);
  }
}

/* ================================================================ POPOVERS */
function closeAllPopovers(except) {
  ['picker', 'menu-popover', 'cluster-color-popover'].forEach(id => { if (id !== except) { const el = $(id); if (el) el.hidden = true; } });
  if (except !== 'quick-add-suggest') { const s = $('quick-add-suggest'); if (s) s.hidden = true; }
}
function placePopover(el, x, y, anchor) {
  el.hidden = false;
  let left = x, top = y;
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    left = r.left; top = r.bottom + 6;
    if (el.offsetWidth < r.width) el.style.width = `${r.width}px`;
  }
  const w = el.offsetWidth, h = el.offsetHeight;
  if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
  if (top + h > window.innerHeight - 8) top = Math.max(8, (anchor ? anchor.getBoundingClientRect().top - h - 6 : window.innerHeight - h - 8));
  el.style.left = `${Math.max(8, left)}px`;
  el.style.top = `${Math.max(8, top)}px`;
}

// Generic menu: items = [{ label, icon, kbd, action, danger }] or 'sep' or { head }
function openMenu(items, x, y, anchor) {
  const menu = $('menu-popover');
  closeAllPopovers('menu-popover');
  menu.style.width = '';
  menu.innerHTML = items.map((it, i) => {
    if (it === 'sep') return '<div class="menu-sep"></div>';
    if (it.head) return `<div class="menu-head">${esc(it.head)}</div>`;
    return `<button role="menuitem" data-i="${i}" class="${it.danger ? 'danger-text' : ''}">${it.icon ? icon(it.icon, 15) : ''}<span>${esc(it.label)}</span>${it.kbd ? `<span class="kbd push">${esc(it.kbd)}</span>` : ''}</button>`;
  }).join('');
  menu.onclick = e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const it = items[Number(b.dataset.i)];
    menu.hidden = true;
    if (it && it.action) it.action(b);
  };
  placePopover(menu, x, y, anchor);
  const first = menu.querySelector('button');
  if (first) first.focus({ preventScroll: true });
}
function openNodeContextMenu(id, x, y) {
  const n = getNode(id);
  if (!n) return;
  const multi = state.selectedNodeIds.size > 1;
  if (multi) {
    openMenu([
      { head: `${state.selectedNodeIds.size} nodes` },
      { label: 'Change color…', icon: 'palette', action: () => openColorPopover(x, y, c => { pushHistory(); selectedNodes().forEach(s => { s.color = c; }); commitState(true); }) },
      { label: 'Zoom to selection', icon: 'fit', action: () => fitNodes(selectedNodes(), { maxZoom: 1.4 }) },
      'sep',
      { label: 'Delete selected', icon: 'trash', kbd: 'Del', danger: true, action: deleteSelected }
    ], x, y);
    return;
  }
  const kids = childIds(id).length;
  openMenu([
    { head: nodeTitle(n) },
    { label: 'Add child', icon: 'plus', kbd: 'Tab', action: () => addNode({ parentId: id }) },
    { label: 'Add sibling', icon: 'plus', kbd: '↵', action: () => { state.selectedNodeIds = new Set([id]); addSiblingOfSelected(); } },
    { label: 'Add task', icon: 'check-square', action: () => openTaskDialog({ nodeId: id }) },
    { label: 'Edit', icon: 'file', kbd: 'Dbl-click', action: () => openNodeEditor(id) },
    'sep',
    ...(kids ? [
      { label: state.collapsed.has(id) ? 'Expand branch' : 'Collapse branch', icon: 'fold', kbd: '.', action: () => toggleCollapse(id) },
      { label: 'Focus branch', icon: 'target', kbd: 'F', action: () => focusBranch(id) },
      { label: 'Tidy branch', icon: 'layout', action: () => tidyBranch(id) }
    ] : []),
    { label: 'Connect from here', icon: 'connect', action: () => { setAppMode('connect'); state.connectSourceId = id; renderBoard(); } },
    { label: 'Change color…', icon: 'palette', action: () => openColorPopover(x, y, c => { pushHistory(); n.color = c; commitState(true); }) },
    'sep',
    { label: 'Delete', icon: 'trash', kbd: 'Del', danger: true, action: () => deleteNodes([id]) }
  ], x, y);
}
function openCanvasContextMenu(x, y, worldPos) {
  openMenu([
    { label: 'Add node here', icon: 'plus', kbd: 'N', action: () => addNode({ pos: worldPos }) },
    { label: 'New cluster', icon: 'cluster', action: createIsolatedGroup },
    'sep',
    { label: 'Fit diagram', icon: 'fit', action: fitDiagram },
    { label: 'Select all', icon: 'select-all', kbd: 'Ctrl A', action: selectEntireDiagram },
    { label: 'Expand all branches', icon: 'fold', action: () => setAllCollapsed(false) }
  ], x, y);
}

function openColorPopover(x, y, onPick, anchor) {
  const pop = $('cluster-color-popover');
  closeAllPopovers('cluster-color-popover');
  pop.innerHTML = PALETTE_15.map(c => `<button data-c="${c.key}" style="background:${c.hex}" title="${c.name}" aria-label="${c.name}"></button>`).join('');
  pop.onclick = e => {
    const b = e.target.closest('button[data-c]');
    if (!b) return;
    pop.hidden = true;
    onPick(b.dataset.c);
  };
  placePopover(pop, x, y, anchor);
}

// Searchable node picker
const pickerState = { onPick: null, items: [], idx: 0, allowNone: false, noneLabel: '', exclude: null, current: null };
function openPicker({ anchor, x, y, current = null, allowNone = false, noneLabel = 'None', exclude = null, onPick }) {
  const pk = $('picker');
  closeAllPopovers('picker');
  Object.assign(pickerState, { onPick, allowNone, noneLabel, exclude, current, idx: 0 });
  $('picker-input').value = '';
  renderPickerList();
  pk.style.width = '';
  placePopover(pk, x || 0, y || 0, anchor);
  $('picker-input').focus();
}
function renderPickerList() {
  const q = $('picker-input').value.toLowerCase().trim();
  const list = $('picker-list');
  const items = [];
  if (pickerState.allowNone && (!q || pickerState.noneLabel.toLowerCase().includes(q))) items.push({ id: null, title: pickerState.noneLabel });
  state.nodes.forEach(n => {
    if (pickerState.exclude && pickerState.exclude.has(n.id)) return;
    const t = nodeTitle(n);
    if (q && !t.toLowerCase().includes(q)) return;
    const p = getNode(parentId(n.id));
    items.push({ id: n.id, title: t, color: n.color, meta: p ? nodeTitle(p) : '' });
  });
  items.sort((a, b) => (a.id === null ? -1 : b.id === null ? 1 : q ? a.title.toLowerCase().indexOf(q) - b.title.toLowerCase().indexOf(q) : 0));
  pickerState.items = items.slice(0, 200);
  pickerState.idx = clamp(pickerState.idx, 0, Math.max(0, pickerState.items.length - 1));
  list.innerHTML = pickerState.items.length ? pickerState.items.map((it, i) => `
    <button class="picker-item${i === pickerState.idx ? ' on' : ''}${it.id === pickerState.current ? ' current' : ''}" data-i="${i}" role="option">
      ${it.id === null ? `<span class="dot" style="background:transparent;border:1px dashed var(--faint)"></span>` : `<span class="dot" style="background:${colorHex(it.color)}"></span>`}
      <span class="pi-t">${esc(it.title)}</span>${it.meta ? `<span class="pi-m">${esc(it.meta)}</span>` : ''}
      ${it.id === pickerState.current ? icon('check', 14, 2) : ''}
    </button>`).join('') : '<div class="empty-note">No matching nodes</div>';
  const on = list.querySelector('.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}
function pickerChoose(i) {
  const it = pickerState.items[i];
  if (!it) return;
  $('picker').hidden = true;
  if (pickerState.onPick) pickerState.onPick(it.id);
}
function wirePopovers() {
  $('picker-input').addEventListener('input', () => { pickerState.idx = 0; renderPickerList(); });
  $('picker-input').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); pickerState.idx = Math.min(pickerState.items.length - 1, pickerState.idx + 1); renderPickerList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); pickerState.idx = Math.max(0, pickerState.idx - 1); renderPickerList(); }
    else if (e.key === 'Enter') { e.preventDefault(); pickerChoose(pickerState.idx); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); $('picker').hidden = true; }
  });
  $('picker-list').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) pickerChoose(Number(b.dataset.i)); });
  $('menu-popover').addEventListener('keydown', e => {
    const btns = [...$('menu-popover').querySelectorAll('button')];
    const i = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (btns[i + 1] || btns[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (btns[i - 1] || btns[btns.length - 1]).focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); $('menu-popover').hidden = true; }
  });
  document.addEventListener('mousedown', e => {
    if (!e.target.closest('.popover, .suggest, [data-act="parent"], #task-node-btn')) closeAllPopovers();
  });
}

/* ================================================================== OUTLINE */
function outlineStructure() {
  // Returns { main: rootNode|null, others: [rootIds] } with a full traversal order.
  const g = graph();
  const main = primaryRoot();
  const visited = new Set();
  const walk = id => {
    if (visited.has(id)) return;
    visited.add(id);
    childIds(id).forEach(walk);
  };
  if (main) walk(main.id);
  const others = [];
  state.nodes.forEach(n => {
    if (visited.has(n.id)) return;
    if (!g.parent.has(n.id) || !g.nodeMap.has(g.parent.get(n.id))) { others.push(n.id); walk(n.id); }
  });
  state.nodes.forEach(n => { if (!visited.has(n.id)) { others.push(n.id); walk(n.id); } }); // cycles
  return { main, others };
}
// Visible rows in display order (respects outline folding + cluster filter)
function outlineRowOrder() {
  const { main, others } = outlineStructure();
  const keep = outlineFilterSet();
  const rows = [];
  const seen = new Set();
  const walk = (id, depth, parent) => {
    if (seen.has(id)) return;
    seen.add(id);
    if (keep && !keep.has(id)) return;
    rows.push({ id, depth, parent });
    if (state.outlineCollapsed.has(id)) { descendantIds(id).forEach(d => seen.add(d)); return; }
    childIds(id).forEach(c => walk(c, depth + 1, id));
  };
  if (main) walk(main.id, 0, null);
  const mainCount = rows.length;
  others.forEach(id => walk(id, 0, null));
  return { rows, mainCount };
}
function outlineFilterSet() {
  if (!state.outlineFilter) return null;
  const keep = new Set();
  state.nodes.forEach(n => {
    if ((n.color || 'gray') !== state.outlineFilter) return;
    keep.add(n.id);
    let p = parentId(n.id);
    const guard = new Set();
    while (p && !guard.has(p)) { guard.add(p); keep.add(p); p = parentId(p); }
  });
  return keep;
}
function siblingsOf(id) {
  const pid = parentId(id);
  if (pid) return childIds(pid);
  const { main, others } = outlineStructure();
  return [...(main ? [main.id] : []), ...others];
}

function renderOutline() {
  const box = $('tree-container');
  if (!box) return;
  // keep an in-progress edit across re-renders (e.g. a sync arriving mid-typing)
  const editInput = box.querySelector('.oedit');
  const draft = editInput && document.activeElement === editInput ? { id: state.outlineEditingId, value: editInput.value, s: editInput.selectionStart, e: editInput.selectionEnd } : null;

  renderOutlineFilters();
  const g = graph();
  const { rows, mainCount } = outlineRowOrder();
  if (!state.outlineFocusId || !g.nodeMap.has(state.outlineFocusId)) state.outlineFocusId = rows.length ? rows[0].id : null;
  const today = todayKey();
  let html = '';
  rows.forEach((r, i) => {
    if (i === mainCount && mainCount > 0) html += '<div class="osection label">Unconnected</div>';
    else if (i === 0 && mainCount === 0 && rows.length) html += '';
    const n = g.nodeMap.get(r.id);
    const kids = childIds(r.id);
    const closed = state.outlineCollapsed.has(r.id);
    const open = (g.tasksByNode.get(r.id) || []).filter(t => !t.completed);
    const overdue = open.some(t => t.dueDate && t.dueDate < today);
    const flows = state.edges.filter(e => e.directed && e.source === r.id).map(e => g.nodeMap.get(e.target)).filter(Boolean);
    const editing = state.outlineEditingId === r.id;
    const isMainRoot = i === 0 && mainCount > 0;
    html += `<div class="orow${isMainRoot ? ' lvl0' : ''}${kids.length && !isMainRoot ? ' hubbish' : ''}" data-id="${esc(r.id)}" role="treeitem" aria-level="${r.depth + 1}" ${kids.length ? `aria-expanded="${!closed}"` : ''} tabindex="${r.id === state.outlineFocusId ? 0 : -1}" style="margin-left:${r.depth * 22}px">
      ${kids.length ? `<button class="otoggle${closed ? ' closed' : ''}" data-oact="toggle" tabindex="-1" aria-label="${closed ? 'Expand' : 'Collapse'}">${icon('chev-down', 14, 2)}</button>` : '<span class="oleaf"></span>'}
      ${isMainRoot ? '<span class="oroot-dot"></span>' : `<span class="dot" style="background:${colorHex(n.color)}"></span>`}
      ${editing ? `<input class="oedit" value="${esc(getPlainLabel(n.label).replace(/\n/g, ' ⏎ '))}" aria-label="Edit label" />` : `<span class="olabel" title="Double-click to rename">${esc(nodeTitle(n) || 'Untitled')}</span>`}
      ${kids.length ? `<span class="ocount">${closed ? '+' + descendantIds(r.id).length : kids.length}</span>` : ''}
      ${open.length ? `<span class="otasks"${overdue ? ' style="color:var(--warn);border-color:var(--warn)"' : ''}>${open.length} task${open.length === 1 ? '' : 's'}</span>` : ''}
      ${flows.slice(0, 1).map(f => `<span class="otag-flow">⇢ ${esc(nodeTitle(f))}</span>`).join('')}
      <span class="oactions">
        <button data-oact="add" tabindex="-1" title="Add child (Tab after Enter)">${icon('plus', 13, 2)}Add</button>
        <button data-oact="locate" tabindex="-1" title="Show on canvas (Ctrl+Enter)">${icon('target', 13)}Locate</button>
        <button data-oact="delete" class="danger" tabindex="-1" title="Delete (Del)" aria-label="Delete">${icon('trash', 13)}</button>
      </span>
    </div>`;
    void i;
  });
  html += `<button class="oadd" data-oact="add-root">${icon('plus', 14, 2)}Add item</button>`;
  if (!rows.length && state.outlineFilter) html = `<div class="empty-card">No nodes in this cluster.</div>` + html;
  box.innerHTML = html;

  if (state.outlineEditingId) {
    const inp = box.querySelector('.oedit');
    if (inp) {
      if (draft && draft.id === state.outlineEditingId) { inp.value = draft.value; }
      inp.focus({ preventScroll: true });
      if (draft) inp.setSelectionRange(draft.s, draft.e); else inp.select();
      inp.closest('.orow').scrollIntoView({ block: 'nearest' });
    }
  } else if (box.contains(document.activeElement) || document.activeElement === document.body) {
    focusOutlineRow(state.outlineFocusId, false);
  }
}
function renderOutlineFilters() {
  const el = $('outline-filters');
  if (!el) return;
  const clusters = getDetectedClusters().sort((a, b) => b.count - a.count);
  el.innerHTML = `<button class="chip${!state.outlineFilter ? ' active' : ''}" data-filter="">All · ${state.nodes.length}</button>` +
    clusters.map(c => `<button class="chip${state.outlineFilter === c.color ? ' active' : ''}" data-filter="${esc(c.color)}"><span class="dot" style="background:${colorHex(c.color)}"></span>${esc(c.name)}</button>`).join('');
}
function focusOutlineRow(id, scroll = true) {
  if (!id) return;
  state.outlineFocusId = id;
  const box = $('tree-container');
  box.querySelectorAll('.orow').forEach(r => { r.tabIndex = r.dataset.id === id ? 0 : -1; });
  const row = box.querySelector(`.orow[data-id="${CSS.escape(id)}"]`);
  if (row && state.currentPage === 'outline') {
    row.focus({ preventScroll: true });
    if (scroll) row.scrollIntoView({ block: 'nearest' });
  }
}
function startOutlineEdit(id) {
  state.outlineEditingId = id;
  state.outlineFocusId = id;
  renderOutline();
}
function readOutlineEdit() {
  const inp = $('tree-container').querySelector('.oedit');
  return inp ? inp.value.replace(/\s*⏎\s*/g, '\n').trim() : null;
}
// Apply the pending label edit (if any). Returns true if something changed.
function applyOutlineEdit({ commit = true } = {}) {
  const id = state.outlineEditingId;
  if (!id) return false;
  const val = readOutlineEdit();
  const n = getNode(id);
  if (!n || val === null || !val || val === getPlainLabel(n.label)) return false;
  if (commit) pushHistory();
  n.label = val;
  return true;
}
function finishOutlineEdit() {
  const changed = applyOutlineEdit();
  state.outlineEditingId = null;
  if (changed) commitState(true); else renderOutline();
}
// Create a sibling right after `afterId` (or a root if none) and start editing it.
function outlineNewSibling(afterId) {
  const pid = afterId ? parentId(afterId) : null;
  const ref = afterId ? getNode(afterId) : null;
  pushHistory();
  applyOutlineEdit({ commit: false });
  const parent = pid ? getNode(pid) : null;
  const pos = parent ? placeChild(parent) : ref ? { x: ref.x + 220, y: ref.y + 60 } : viewportCenterWorld();
  const node = blankNode({ label: 'New item', x: Math.round(pos.x), y: Math.round(pos.y), ...inheritStyle(parent || ref) });
  if (parent) {
    const edge = { id: uid('edge'), source: parent.id, target: node.id, directed: false };
    const idx = state.edges.findIndex(e => !e.directed && e.source === parent.id && e.target === afterId);
    if (idx >= 0) state.edges.splice(idx + 1, 0, edge); else state.edges.push(edge);
    const ni = state.nodes.findIndex(x => x.id === afterId);
    state.nodes.splice(ni >= 0 ? ni + 1 : state.nodes.length, 0, node);
  } else {
    const ni = afterId ? state.nodes.findIndex(x => x.id === afterId) : -1;
    state.nodes.splice(ni >= 0 ? ni + 1 : state.nodes.length, 0, node);
  }
  state.outlineEditingId = node.id;
  state.outlineFocusId = node.id;
  commitState(true);
}
function outlineAddChild(pid) {
  const parent = getNode(pid);
  if (!parent) return;
  pushHistory();
  applyOutlineEdit({ commit: false });
  const pos = placeChild(parent);
  const node = blankNode({ label: 'New item', x: pos.x, y: pos.y, ...inheritStyle(parent) });
  state.nodes.push(node);
  state.edges.push({ id: uid('edge'), source: pid, target: node.id, directed: false });
  state.outlineCollapsed.delete(pid);
  state.outlineEditingId = node.id;
  state.outlineFocusId = node.id;
  commitState(true);
}
function outlineIndent(id) {
  const sibs = siblingsOf(id);
  const i = sibs.indexOf(id);
  if (i <= 0) { showToast('Nothing above to indent under'); return; }
  const newParent = sibs[i - 1];
  pushHistory();
  applyOutlineEdit({ commit: false });
  if (!setParent(id, newParent)) { historyStack.pop(); return; }
  state.outlineCollapsed.delete(newParent);
  commitState(true);
}
function outlineOutdent(id) {
  const pid = parentId(id);
  if (!pid) { showToast('Already at the top level'); return; }
  const gp = parentId(pid);
  pushHistory();
  applyOutlineEdit({ commit: false });
  // place right after the old parent among the grandparent's children
  state.edges = state.edges.filter(e => !(!e.directed && e.target === id));
  if (gp) {
    const edge = { id: uid('edge'), source: gp, target: id, directed: false };
    const idx = state.edges.findIndex(e => !e.directed && e.source === gp && e.target === pid);
    if (idx >= 0) state.edges.splice(idx + 1, 0, edge); else state.edges.push(edge);
  }
  commitState(true);
}
function outlineMove(id, dir) {
  const pid = parentId(id);
  const sibs = siblingsOf(id);
  const i = sibs.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= sibs.length) return;
  const other = sibs[j];
  pushHistory();
  applyOutlineEdit({ commit: false });
  if (pid) {
    const a = state.edges.findIndex(e => !e.directed && e.source === pid && e.target === id);
    const b = state.edges.findIndex(e => !e.directed && e.source === pid && e.target === other);
    if (a < 0 || b < 0) { historyStack.pop(); return; }
    [state.edges[a], state.edges[b]] = [state.edges[b], state.edges[a]];
  } else {
    const a = state.nodes.findIndex(n => n.id === id), b = state.nodes.findIndex(n => n.id === other);
    [state.nodes[a], state.nodes[b]] = [state.nodes[b], state.nodes[a]];
  }
  commitState(true);
}
function wireOutline() {
  const box = $('tree-container');
  box.addEventListener('click', e => {
    const row = e.target.closest('.orow');
    const act = e.target.closest('[data-oact]');
    if (act && act.dataset.oact === 'add-root') { outlineNewSibling(null); return; }
    if (!row) return;
    const id = row.dataset.id;
    if (act) {
      e.stopPropagation();
      const a = act.dataset.oact;
      if (a === 'toggle') { state.outlineCollapsed.has(id) ? state.outlineCollapsed.delete(id) : state.outlineCollapsed.add(id); state.outlineFocusId = id; renderOutline(); }
      else if (a === 'add') outlineAddChild(id);
      else if (a === 'locate') focusNodeOnCanvas(id);
      else if (a === 'delete') { state.outlineFocusId = neighbourRow(id); deleteNodes([id]); }
      return;
    }
    if (state.outlineEditingId && state.outlineEditingId !== id) finishOutlineEdit();
    if (!e.target.closest('.oedit')) focusOutlineRow(id);
  });
  box.addEventListener('dblclick', e => {
    const row = e.target.closest('.orow');
    if (row && !e.target.closest('[data-oact]')) startOutlineEdit(row.dataset.id);
  });
  box.addEventListener('focusout', e => {
    if (e.target.classList.contains('oedit')) {
      setTimeout(() => { if (state.outlineEditingId && !box.contains(document.activeElement)) finishOutlineEdit(); }, 0);
    }
  });
  box.addEventListener('keydown', e => {
    const row = e.target.closest('.orow');
    if (!row) return;
    const id = row.dataset.id;
    const editing = e.target.classList.contains('oedit');
    const mod = e.ctrlKey || e.metaKey;
    if (editing) {
      if (e.key === 'Enter' && mod) { e.preventDefault(); finishOutlineEdit(); focusNodeOnCanvas(id); }
      else if (e.key === 'Enter') { e.preventDefault(); outlineNewSibling(id); }
      else if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? outlineOutdent(id) : outlineIndent(id); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finishOutlineEdit(); focusOutlineRow(id); }
      else if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); outlineMove(id, -1); }
      else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); outlineMove(id, 1); }
      e.stopPropagation();
      return;
    }
    const { rows } = outlineRowOrder();
    const idx = rows.findIndex(r => r.id === id);
    if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); outlineMove(id, 1); }
    else if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); outlineMove(id, -1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (rows[idx + 1]) focusOutlineRow(rows[idx + 1].id); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (rows[idx - 1]) focusOutlineRow(rows[idx - 1].id); }
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (state.outlineCollapsed.has(id)) { state.outlineCollapsed.delete(id); renderOutline(); }
      else if (rows[idx + 1] && rows[idx + 1].parent === id) focusOutlineRow(rows[idx + 1].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (childIds(id).length && !state.outlineCollapsed.has(id)) { state.outlineCollapsed.add(id); renderOutline(); }
      else if (rows[idx] && rows[idx].parent) focusOutlineRow(rows[idx].parent);
    } else if (e.key === 'Enter' && mod) { e.preventDefault(); focusNodeOnCanvas(id); }
    else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); startOutlineEdit(id); }
    else if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? outlineOutdent(id) : outlineIndent(id); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); state.outlineFocusId = neighbourRow(id); deleteNodes([id]); }
    else return;
    e.stopPropagation();
  });
  $('outline-filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    state.outlineFilter = b.dataset.filter;
    renderOutline();
  });
  $('btn-collapse-all-tree').addEventListener('click', () => {
    state.nodes.forEach(n => { if (childIds(n.id).length) state.outlineCollapsed.add(n.id); });
    const main = primaryRoot();
    if (main) state.outlineCollapsed.delete(main.id);
    renderOutline();
  });
  $('btn-expand-all-tree').addEventListener('click', () => { state.outlineCollapsed.clear(); renderOutline(); });
  $('btn-hierarchy-export-pdf').addEventListener('click', exportOutlinePDF);
}
function neighbourRow(id) {
  const { rows } = outlineRowOrder();
  const i = rows.findIndex(r => r.id === id);
  const desc = new Set(descendantIds(id));
  for (let j = i + 1; j < rows.length; j++) if (!desc.has(rows[j].id)) return rows[j].id;
  return i > 0 ? rows[i - 1].id : null;
}

function exportOutlinePDF() {
  const card = $('tree-container');
  if (!card) return;
  if (state.currentPage !== 'outline') switchPage('outline');
  showToast('Preparing PDF…', 5000);
  document.body.classList.add('exporting');
  const bg = getComputedStyle(card).backgroundColor || '#ffffff';
  Promise.all([loadScriptOnce(HTML2CANVAS_URL), loadScriptOnce(JSPDF_URL)])
    .then(() => window.html2canvas(card, { scale: 2, useCORS: true, backgroundColor: bg, windowHeight: card.scrollHeight + 200 }))
    .then(canvas => {
      document.body.classList.remove('exporting');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      pdf.save('Adam_Pollack_PPSC_Hierarchy.pdf');
      showToast('PDF exported');
    })
    .catch(err => {
      console.error('Hierarchy PDF export error:', err);
      document.body.classList.remove('exporting');
      showToast('Failed to export PDF');
    });
}

/* ==================================================================== TABLE */
const TABLE_COLUMNS = [
  { key: 'label', title: 'Node', sortable: true, always: true },
  { key: 'color', title: 'Cluster', sortable: true, always: true },
  { key: 'parent', title: 'Parent', sortable: true },
  { key: 'shape', title: 'Shape', sortable: true },
  { key: 'connections', title: 'Links', sortable: true },
  { key: 'tasks', title: 'Tasks', sortable: true },
  { key: 'link', title: 'URL', sortable: true },
  { key: 'position', title: 'Position', sortable: true }
];
function tableVisibleColumns() { return TABLE_COLUMNS.filter(c => c.always || state.table.columns[c.key]); }
function tableSortValue(n, key) {
  const g = graph();
  switch (key) {
    case 'label': return nodeTitle(n).toLowerCase();
    case 'color': return (n.color || 'gray');
    case 'parent': { const p = g.nodeMap.get(g.parent.get(n.id)); return p ? nodeTitle(p).toLowerCase() : ' '; }
    case 'shape': return n.shape || 'pill';
    case 'connections': return g.degree.get(n.id) || 0;
    case 'tasks': return (g.tasksByNode.get(n.id) || []).filter(t => !t.completed).length;
    case 'link': return (n.linkUrl || ' ').toLowerCase();
    case 'position': return n.y * 100000 + n.x;
    default: return '';
  }
}
function tableRows() {
  const q = ($('inventory-search') ? $('inventory-search').value : '').toLowerCase().trim();
  const g = graph();
  let rows = state.nodes.filter(n => {
    if (state.table.cluster && (n.color || 'gray') !== state.table.cluster) return false;
    if (!q) return true;
    const p = g.nodeMap.get(g.parent.get(n.id));
    return [nodeTitle(n), n.color, n.shape, n.linkUrl, p ? nodeTitle(p) : ''].some(v => String(v || '').toLowerCase().includes(q));
  });
  const { sort, dir } = state.table;
  const m = dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const va = tableSortValue(a, sort), vb = tableSortValue(b, sort);
    if (va < vb) return -m;
    if (va > vb) return m;
    return 0;
  });
  return rows;
}
function renderTable() {
  const head = $('table-head'), body = $('inventory-table-body');
  if (!head || !body) return;
  const cols = tableVisibleColumns();
  const rows = tableRows();
  const sel = state.table.selected;
  const allSel = rows.length > 0 && rows.every(r => sel.has(r.id));

  // cluster filter select
  const cf = $('table-cluster');
  if (cf) {
    const clusters = getDetectedClusters();
    cf.innerHTML = `<option value="">All clusters</option>` + clusters.map(c => `<option value="${esc(c.color)}"${state.table.cluster === c.color ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  }
  const gb = $('btn-table-group');
  if (gb) gb.setAttribute('aria-pressed', String(state.table.group));

  head.innerHTML = `<tr><th class="cb"><input type="checkbox" id="table-select-all" aria-label="Select all rows" ${allSel ? 'checked' : ''}></th>${cols.map(c => {
    const sorted = state.table.sort === c.key;
    return `<th class="${c.sortable ? 'sortable' : ''}${sorted ? ' sorted' : ''}" data-sort="${c.key}" ${sorted ? `aria-sort="${state.table.dir === 'asc' ? 'ascending' : 'descending'}"` : ''}>${c.title}${sorted ? (state.table.dir === 'asc' ? ' ↑' : ' ↓') : ''}</th>`;
  }).join('')}<th style="text-align:right">Actions</th></tr>`;

  const g = graph();
  const clusterNames = new Map(getDetectedClusters().map(c => [c.color, c.name]));
  const rowHtml = n => {
    const ed = state.table.editing;
    const cell = (key, content, extraCls = '') => {
      if (ed && ed.id === n.id && ed.key === key) return `<td class="editing" data-key="${key}">${cellEditor(n, key)}</td>`;
      const editable = ['label', 'color', 'shape', 'link', 'position', 'parent'].includes(key);
      return `<td class="${extraCls}${editable ? ' editable' : ''}" data-key="${key}">${content}</td>`;
    };
    const p = g.nodeMap.get(g.parent.get(n.id));
    const tasks = g.tasksByNode.get(n.id) || [];
    const open = tasks.filter(t => !t.completed).length;
    const href = safeUrl(n.linkUrl);
    const cells = cols.map(c => {
      switch (c.key) {
        case 'label': return cell('label', `<span style="display:inline-flex;align-items:center;gap:8px;max-width:100%"><span class="dot" style="background:${colorHex(n.color)}"></span><span style="overflow:hidden;text-overflow:ellipsis;font-weight:${childIds(n.id).length ? 600 : 400}">${esc(nodeTitle(n) || 'Untitled')}</span>${n.isHub ? '<span class="hub-tag">Root</span>' : ''}</span>`);
        case 'color': return cell('color', `<span class="tpill"><span class="dot" style="background:${colorHex(n.color)}"></span>${esc(colorName(n.color))}</span>`);
        case 'parent': return cell('parent', p ? esc(nodeTitle(p)) : '<span style="color:var(--faint)">—</span>', 'mono');
        case 'shape': return cell('shape', esc(shapeName(n.shape)));
        case 'connections': return `<td class="mono">${g.degree.get(n.id) || 0}</td>`;
        case 'tasks': return `<td>${tasks.length ? `<button class="tpill" data-tact="tasks" title="Open tasks">${tasks.length - open} / ${tasks.length}</button>` : '<span style="color:var(--faint)">—</span>'}</td>`;
        case 'link': return cell('link', href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(n.linkUrl)}</a>` : '<span style="color:var(--faint)">—</span>');
        case 'position': return cell('position', `X ${Math.round(n.x)}, Y ${Math.round(n.y)}`, 'mono');
        default: return '<td></td>';
      }
    }).join('');
    return `<tr class="r${sel.has(n.id) ? ' sel' : ''}" data-id="${esc(n.id)}">
      <td class="cb"><input type="checkbox" data-tact="select" ${sel.has(n.id) ? 'checked' : ''} aria-label="Select ${esc(nodeTitle(n))}"></td>
      ${cells}
      <td><div class="row-actions"><button data-tact="task">+ Task</button><button data-tact="locate">Locate</button></div></td>
    </tr>`;
  };

  let html = '';
  if (!rows.length) {
    html = `<tr><td colspan="${cols.length + 2}" style="height:80px;text-align:center;color:var(--sub)">No nodes match</td></tr>`;
  } else if (state.table.group) {
    const groups = new Map();
    rows.forEach(n => { const k = n.color || 'gray'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); });
    groups.forEach((list, key) => {
      const closed = state.table.collapsedGroups.has(key);
      html += `<tr class="g" data-group="${esc(key)}"><td colspan="${cols.length + 2}"><span style="display:inline-flex;align-items:center;gap:8px">${icon(closed ? 'chev-right' : 'chev-down', 14, 2)}<span class="dot" style="background:${colorHex(key)}"></span>${esc(clusterNames.get(key) || colorName(key))}<span class="mono-muted" style="font-weight:400">${list.length}</span></span></td></tr>`;
      if (!closed) list.forEach(n => { html += rowHtml(n); });
    });
  } else {
    rows.forEach(n => { html += rowHtml(n); });
  }
  body.innerHTML = html;

  const ed = state.table.editing;
  if (ed) {
    const inp = body.querySelector('td.editing .cell-input');
    if (inp) { inp.focus(); if (inp.select && inp.tagName !== 'SELECT') inp.select(); }
  }

  const bulk = $('bulk-bar');
  if (bulk) {
    bulk.hidden = sel.size === 0;
    $('bulk-count').textContent = `${sel.size} selected`;
  }
  const foot = $('table-footer');
  if (foot) foot.innerHTML = `<span>${rows.length === state.nodes.length ? `${state.nodes.length} nodes` : `${rows.length} of ${state.nodes.length} nodes`} · ${getDetectedClusters().length} clusters</span><span>Double-click a cell to edit · Esc to cancel</span>`;
}
function cellEditor(n, key) {
  switch (key) {
    case 'label': return `<textarea class="cell-input" rows="1" style="height:30px;padding-top:5px;resize:none">${esc(getPlainLabel(n.label))}</textarea>`;
    case 'color': return `<select class="cell-input">${PALETTE_15.map(c => `<option value="${c.key}"${n.color === c.key ? ' selected' : ''}>${c.name}</option>`).join('')}</select>`;
    case 'shape': return `<select class="cell-input">${SHAPES_8.map(s => `<option value="${s.key}"${(n.shape || 'pill') === s.key ? ' selected' : ''}>${s.name}</option>`).join('')}</select>`;
    case 'link': return `<input class="cell-input" value="${esc(n.linkUrl)}" placeholder="https://…">`;
    case 'position': return `<input class="cell-input" value="${Math.round(n.x)}, ${Math.round(n.y)}" placeholder="x, y" style="font-family:'Geist Mono',monospace">`;
    default: return '';
  }
}
function commitCellEdit(cancel = false) {
  const ed = state.table.editing;
  if (!ed) return;
  const inp = $('inventory-table-body').querySelector('td.editing .cell-input');
  state.table.editing = null;
  const n = getNode(ed.id);
  if (cancel || !inp || !n) { renderTable(); return; }
  const v = inp.value;
  const before = JSON.stringify(n);
  const next = { ...n };
  if (ed.key === 'label') { if (!v.trim()) { showToast('Label can\'t be empty'); renderTable(); return; } next.label = v.trim(); }
  else if (ed.key === 'color') next.color = v;
  else if (ed.key === 'shape') next.shape = v;
  else if (ed.key === 'link') next.linkUrl = v.trim();
  else if (ed.key === 'position') {
    const m = v.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
    if (!m) { showToast('Use the format: x, y'); renderTable(); return; }
    next.x = Math.round(Number(m[1])); next.y = Math.round(Number(m[2]));
  }
  if (JSON.stringify(next) === before) { renderTable(); return; }
  pushHistory();
  Object.assign(n, next);
  commitState(true);
}
function wireTable() {
  const body = $('inventory-table-body');
  $('table-head').addEventListener('click', e => {
    if (e.target.id === 'table-select-all') {
      const rows = tableRows();
      if (e.target.checked) rows.forEach(r => state.table.selected.add(r.id)); else rows.forEach(r => state.table.selected.delete(r.id));
      renderTable();
      return;
    }
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.table.sort === key) state.table.dir = state.table.dir === 'asc' ? 'desc' : 'asc';
    else { state.table.sort = key; state.table.dir = 'asc'; }
    renderTable();
  });
  body.addEventListener('click', e => {
    const grp = e.target.closest('tr.g');
    if (grp) {
      const k = grp.dataset.group;
      state.table.collapsedGroups.has(k) ? state.table.collapsedGroups.delete(k) : state.table.collapsedGroups.add(k);
      renderTable();
      return;
    }
    const tr = e.target.closest('tr.r');
    if (!tr) return;
    const id = tr.dataset.id;
    const act = e.target.closest('[data-tact]');
    if (!act) return;
    const a = act.dataset.tact;
    if (a === 'select') { act.checked ? state.table.selected.add(id) : state.table.selected.delete(id); renderTable(); }
    else if (a === 'task') openTaskDialog({ nodeId: id });
    else if (a === 'locate') focusNodeOnCanvas(id);
    else if (a === 'tasks') { $('tasks-search').value = nodeTitle(getNode(id)); switchPage('tasks'); }
  });
  body.addEventListener('dblclick', e => {
    const td = e.target.closest('td.editable');
    const tr = e.target.closest('tr.r');
    if (!td || !tr || e.target.closest('a')) return;
    const key = td.dataset.key, id = tr.dataset.id;
    if (key === 'parent') {
      const n = getNode(id);
      openPicker({ anchor: td, current: parentId(id), allowNone: true, noneLabel: 'None (top level)', exclude: new Set([id, ...descendantIds(id)]),
        onPick: pid => { pushHistory(); if (setParent(n.id, pid)) commitState(true); else historyStack.pop(); } });
      return;
    }
    if (state.table.editing) commitCellEdit();
    state.table.editing = { id, key };
    renderTable();
  });
  body.addEventListener('keydown', e => {
    if (!e.target.classList.contains('cell-input')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); commitCellEdit(true); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitCellEdit(); }
  });
  body.addEventListener('change', e => { if (e.target.tagName === 'SELECT' && e.target.classList.contains('cell-input')) commitCellEdit(); });
  body.addEventListener('focusout', e => {
    if (e.target.classList.contains('cell-input')) setTimeout(() => { if (state.table.editing && !body.contains(document.activeElement)) commitCellEdit(); }, 0);
  });
  $('inventory-search').addEventListener('input', renderTable);
  $('table-cluster').addEventListener('change', e => { state.table.cluster = e.target.value; renderTable(); });
  $('btn-table-group').addEventListener('click', () => { state.table.group = !state.table.group; saveUiPrefs(); renderTable(); });
  $('btn-table-columns').addEventListener('click', e => {
    const btn = e.currentTarget;
    const menu = $('menu-popover');
    closeAllPopovers('menu-popover');
    menu.innerHTML = '<div class="menu-head">Show columns</div>' + TABLE_COLUMNS.filter(c => !c.always).map(c =>
      `<label><input type="checkbox" data-col="${c.key}" ${state.table.columns[c.key] ? 'checked' : ''}>${c.title}</label>`).join('');
    menu.onclick = null;
    menu.onchange = ev => {
      const cb = ev.target.closest('[data-col]');
      if (!cb) return;
      state.table.columns[cb.dataset.col] = cb.checked;
      saveUiPrefs();
      renderTable();
    };
    placePopover(menu, 0, 0, btn);
  });
  $('bulk-bar').addEventListener('click', e => {
    const b = e.target.closest('[data-bulk]');
    if (!b) return;
    const ids = [...state.table.selected].filter(id => getNode(id));
    if (!ids.length) return;
    const a = b.dataset.bulk;
    if (a === 'color') openColorPopover(0, 0, c => { pushHistory(); ids.forEach(id => { getNode(id).color = c; }); commitState(true); showToast(`Recolored ${ids.length} nodes`); }, b);
    else if (a === 'move') {
      const exclude = new Set();
      ids.forEach(id => { exclude.add(id); descendantIds(id).forEach(d => exclude.add(d)); });
      openPicker({ anchor: b, allowNone: true, noneLabel: 'None (top level)', exclude, onPick: pid => {
        pushHistory();
        ids.forEach(id => setParent(id, pid));
        commitState(true);
        showToast(`Moved ${ids.length} nodes`);
      } });
    }
    else if (a === 'task') openTaskDialog({ nodeId: ids[0], bulkNodeIds: ids });
    else if (a === 'show') {
      ids.forEach(ensureVisibleOnCanvas);
      switchPage('canvas');
      state.selectedNodeIds = new Set(ids);
      renderBoard();
      renderInspector();
      requestAnimationFrame(() => fitNodes(ids.map(getNode), { maxZoom: 1.3 }));
    }
    else if (a === 'clear') { state.table.selected.clear(); renderTable(); }
    else if (a === 'delete') { deleteNodes(ids); state.table.selected.clear(); renderTable(); }
  });
}

/* ==================================================================== TASKS */
function addDays(key, n) { const d = parseDateKey(key) || new Date(); d.setDate(d.getDate() + n); return toDateKey(d); }
function dueLabel(key) {
  if (!key) return '';
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === addDays(t, 1)) return 'Tomorrow';
  if (key === addDays(t, -1)) return 'Yesterday';
  return formatShortDate(key);
}
function toggleTaskComplete(id, completed) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  pushHistory();
  t.completed = completed;
  if (completed && !t.completedAt) t.completedAt = getLocalDateTimeString();
  commitState(true);
}
function deleteTask(id) {
  if (!state.tasks.some(t => t.id === id)) return;
  pushHistory();
  state.tasks = state.tasks.filter(t => t.id !== id);
  commitState(true);
  showToast('Task deleted · Ctrl+Z to undo');
}
function updateRailBadge() {
  const b = $('rail-task-badge');
  if (!b) return;
  const t = todayKey();
  const n = state.tasks.filter(x => !x.completed && x.dueDate && x.dueDate <= t).length;
  b.hidden = n === 0;
  b.textContent = n > 9 ? '9+' : String(n);
  b.title = `${n} due today or overdue`;
}

function taskRowHtml(t) {
  const n = getNode(t.nodeId);
  const today = todayKey();
  const overdue = !t.completed && t.dueDate && t.dueDate < today;
  return `<div class="trow${t.completed ? ' done' : ''}" data-tid="${esc(t.id)}">
    <input type="checkbox" data-tk="toggle" ${t.completed ? 'checked' : ''} aria-label="Mark ${t.completed ? 'incomplete' : 'complete'}">
    <button class="t-text" data-tk="open" title="Open details">${esc(t.description || 'Untitled task')}${t.completionNotes ? ` <span style="color:var(--sub);font-size:12px">· ${icon('file', 12)}</span>` : ''}</button>
    ${n ? `<button class="nchip" data-tk="node" title="Show on canvas"><span class="dot" style="background:${colorHex(n.color)}"></span><span class="nm">${esc(nodeTitle(n))}</span></button>` : '<span class="nchip" style="color:var(--sub)">Unlinked</span>'}
    <span class="t-due${overdue ? ' overdue' : ''}">${esc(dueLabel(t.dueDate)) || '—'}</span>
    <button class="t-del" data-tk="delete" aria-label="Delete task" title="Delete">${icon('trash', 14)}</button>
  </div>`;
}
function renderTasks() {
  const wrap = $('tasks-groups');
  if (!wrap) return;
  const q = ($('tasks-search') ? $('tasks-search').value : '').toLowerCase().trim();
  const today = todayKey(), weekEnd = addDays(today, 6);
  const g = graph();
  const match = t => {
    if (!q) return true;
    const n = g.nodeMap.get(t.nodeId);
    return [t.description, t.dueDate, n ? nodeTitle(n) : '', t.completionNotes].some(v => String(v || '').toLowerCase().includes(q));
  };
  const all = state.tasks.filter(match);
  const open = all.filter(t => !t.completed), done = all.filter(t => t.completed);
  const byDue = (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (a.description || '').localeCompare(b.description || '');
  open.sort(byDue);
  done.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

  const overdueN = state.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
  const openN = state.tasks.filter(t => !t.completed).length;
  $('tasks-summary').textContent = `${openN} open${overdueN ? ` · ${overdueN} overdue` : ''}${state.tasks.length - openN ? ` · ${state.tasks.length - openN} done` : ''}`;
  $('toggle-completed-tasks-text').textContent = state.hideCompletedTasks ? 'Show completed' : 'Hide completed';
  $('btn-toggle-completed-tasks').setAttribute('aria-pressed', String(state.hideCompletedTasks));
  $('tasks-group').value = state.tasksGroup;

  const section = (title, list, { cls = '', dot = '' } = {}) => list.length ? `
    <div class="tsec ${cls}">${dot}${esc(title)}<span class="n">${list.length}</span></div>
    <div class="tcard">${list.map(taskRowHtml).join('')}</div>` : '';
  let html = '';
  if (!state.tasks.length) {
    html = `<div class="tcard empty-card" style="margin-top:16px">No tasks yet. Add one above, from a node's inspector, or by clicking a day on the calendar.</div>`;
  } else if (state.tasksGroup === 'date') {
    html += section('Overdue', open.filter(t => t.dueDate && t.dueDate < today), { cls: 'overdue', dot: '<span class="dot" style="background:var(--warn)"></span>' });
    html += section('Today', open.filter(t => t.dueDate === today));
    html += section('Next 7 days', open.filter(t => t.dueDate > today && t.dueDate <= weekEnd));
    html += section('Later', open.filter(t => t.dueDate > weekEnd));
    html += section('No date', open.filter(t => !t.dueDate));
  } else if (state.tasksGroup === 'cluster') {
    const names = new Map(getDetectedClusters().map(c => [c.color, c.name]));
    const groups = new Map();
    (state.hideCompletedTasks ? open : open.concat(done)).forEach(t => {
      const n = g.nodeMap.get(t.nodeId);
      const k = n ? (n.color || 'gray') : '__none';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(t);
    });
    groups.forEach((list, k) => {
      html += section(k === '__none' ? 'Unlinked' : (names.get(k) || colorName(k)), list, { dot: k === '__none' ? '' : `<span class="dot" style="background:${colorHex(k)}"></span>` });
    });
  } else {
    html += section('Open', open);
  }
  if (!state.hideCompletedTasks && state.tasksGroup !== 'cluster' && done.length) {
    const showDone = state.completedOpen || !!q;
    html += `<button class="tsec toggle${showDone ? ' open' : ''}" data-tk="completed-toggle" aria-expanded="${showDone}">${icon('chev-right', 14, 2)}Completed<span class="n">${done.length}</span></button>`;
    if (showDone) html += `<div class="tcard">${done.map(taskRowHtml).join('')}</div>`;
  }
  if (state.tasks.length && !html) html = `<div class="tcard empty-card" style="margin-top:16px">${q ? 'No tasks match your filter.' : 'All caught up.'}</div>`;
  wrap.innerHTML = html;
}

/* ---------------------------------------------------------------- quick add */
const quickAdd = { nodeId: null, suggest: [], idx: 0 };
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function parseDateToken(raw) {
  const s = String(raw || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!s) return null;
  const t = todayKey();
  if (['today', 'tod', 'now'].includes(s)) return t;
  if (['tomorrow', 'tom', 'tmr', 'tmrw'].includes(s)) return addDays(t, 1);
  if (s === 'next week') return addDays(t, 7);
  let m;
  if ((m = s.match(/^\+(\d{1,3})\s*(d|day|days)?$/)) || (m = s.match(/^(\d{1,3})\s*(d|day|days)$/))) return addDays(t, Number(m[1]));
  if ((m = s.match(/^\+?(\d{1,2})\s*(w|wk|week|weeks)$/))) return addDays(t, Number(m[1]) * 7);
  const wd = WEEKDAYS.findIndex(d => s.startsWith(d) && (s.length <= 9));
  if (wd >= 0 && /^[a-z]+$/.test(s)) {
    const now = parseDateKey(t);
    let diff = (wd - now.getDay() + 7) % 7;
    return addDays(t, diff);
  }
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return toDateKey(new Date(+m[1], +m[2] - 1, +m[3]));
  const year = new Date().getFullYear();
  const mk = (mo, d) => {
    let dt = new Date(year, mo, d);
    if (dt.getMonth() !== mo) return null;
    if (toDateKey(dt) < addDays(t, -60)) dt = new Date(year + 1, mo, d);
    return toDateKey(dt);
  };
  if ((m = s.match(/^([a-z]{3,9})\.? (\d{1,2})$/))) { const mo = MONTHS.indexOf(m[1].slice(0, 3)); if (mo >= 0) return mk(mo, +m[2]); }
  if ((m = s.match(/^(\d{1,2}) ([a-z]{3,9})$/))) { const mo = MONTHS.indexOf(m[2].slice(0, 3)); if (mo >= 0) return mk(mo, +m[1]); }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})$/))) return mk(+m[1] - 1, +m[2]);
  return null;
}
function parseQuickAdd(text) {
  let desc = text;
  let date = '';
  const hash = desc.lastIndexOf('#');
  if (hash >= 0) {
    const tok = desc.slice(hash + 1);
    const d = parseDateToken(tok);
    if (d) { date = d; desc = desc.slice(0, hash); }
  }
  return { desc: desc.replace(/\s+/g, ' ').trim(), date };
}
function currentAtToken(input) {
  const v = input.value.slice(0, input.selectionStart);
  const m = v.match(/(^|\s)@([^@#]*)$/);
  return m ? { query: m[2], start: v.length - m[2].length - 1 } : null;
}
function renderQuickAddPreview() {
  const input = $('quick-add-input');
  const prev = $('quick-add-preview');
  const { date } = parseQuickAdd(input.value);
  const n = quickAdd.nodeId ? getNode(quickAdd.nodeId) : null;
  prev.innerHTML = (n ? `<span class="nchip"><span class="dot" style="background:${colorHex(n.color)}"></span><span class="nm">${esc(nodeTitle(n))}</span><button data-qa-clear aria-label="Unlink node" style="display:flex">${icon('x', 11, 2.4)}</button></span>` : '')
    + (date ? `<span class="nchip">${icon('calendar', 12)}${esc(dueLabel(date))}</span>` : '');
}
function renderQuickSuggest() {
  const input = $('quick-add-input');
  const box = $('quick-add-suggest');
  const tok = currentAtToken(input);
  if (!tok) { box.hidden = true; quickAdd.suggest = []; return; }
  const q = tok.query.toLowerCase().trim();
  quickAdd.suggest = state.nodes.filter(n => !q || nodeTitle(n).toLowerCase().includes(q)).slice(0, 8);
  quickAdd.idx = clamp(quickAdd.idx, 0, Math.max(0, quickAdd.suggest.length - 1));
  if (!quickAdd.suggest.length) { box.innerHTML = '<div class="empty-note">No matching nodes</div>'; box.hidden = false; return; }
  box.innerHTML = quickAdd.suggest.map((n, i) => `<button data-i="${i}" class="${i === quickAdd.idx ? 'on' : ''}"><span class="dot" style="background:${colorHex(n.color)}"></span>${esc(nodeTitle(n))}</button>`).join('');
  box.hidden = false;
}
function chooseQuickSuggest(i) {
  const n = quickAdd.suggest[i];
  const input = $('quick-add-input');
  const tok = currentAtToken(input);
  if (!n || !tok) return;
  quickAdd.nodeId = n.id;
  const v = input.value;
  input.value = (v.slice(0, tok.start) + v.slice(input.selectionStart)).replace(/\s{2,}/g, ' ');
  $('quick-add-suggest').hidden = true;
  renderQuickAddPreview();
  input.focus();
}
function submitQuickAdd() {
  const input = $('quick-add-input');
  const { desc, date } = parseQuickAdd(input.value.replace(/(^|\s)@[^@#]*$/, ' '));
  if (!desc) { showToast('Type a task first'); return; }
  const nodeId = quickAdd.nodeId || (state.selectedNodeIds.size === 1 ? [...state.selectedNodeIds][0] : null);
  if (!nodeId) {
    openTaskDialog({ description: desc, date: date || '' });
    showToast('Pick the node this task belongs to');
    return;
  }
  pushHistory();
  state.tasks.push({ id: uid('task'), description: desc, dueDate: date || '', nodeId, completed: false, completedAt: '', completionNotes: '' });
  input.value = '';
  quickAdd.nodeId = null;
  renderQuickAddPreview();
  commitState(true);
  showToast('Task added');
}
function wireTasks() {
  $('tasks-groups').addEventListener('click', e => {
    const b = e.target.closest('[data-tk]');
    if (!b) return;
    const a = b.dataset.tk;
    if (a === 'completed-toggle') { state.completedOpen = !state.completedOpen; renderTasks(); return; }
    const row = b.closest('[data-tid]');
    const id = row && row.dataset.tid;
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    if (a === 'open') openTaskDialog({ taskId: id });
    else if (a === 'node') focusNodeOnCanvas(t.nodeId);
    else if (a === 'delete') deleteTask(id);
  });
  $('tasks-groups').addEventListener('change', e => {
    const b = e.target.closest('[data-tk="toggle"]');
    if (!b) return;
    toggleTaskComplete(b.closest('[data-tid]').dataset.tid, b.checked);
  });
  $('tasks-search').addEventListener('input', renderTasks);
  $('tasks-group').addEventListener('change', e => { state.tasksGroup = e.target.value; saveUiPrefs(); renderTasks(); });
  $('btn-toggle-completed-tasks').addEventListener('click', () => { state.hideCompletedTasks = !state.hideCompletedTasks; renderTasks(); });
  const input = $('quick-add-input');
  input.addEventListener('input', () => { quickAdd.idx = 0; renderQuickSuggest(); renderQuickAddPreview(); });
  input.addEventListener('keydown', e => {
    const open = !$('quick-add-suggest').hidden && quickAdd.suggest.length;
    if (open && e.key === 'ArrowDown') { e.preventDefault(); quickAdd.idx = Math.min(quickAdd.suggest.length - 1, quickAdd.idx + 1); renderQuickSuggest(); }
    else if (open && e.key === 'ArrowUp') { e.preventDefault(); quickAdd.idx = Math.max(0, quickAdd.idx - 1); renderQuickSuggest(); }
    else if (open && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); chooseQuickSuggest(quickAdd.idx); }
    else if (e.key === 'Enter') { e.preventDefault(); submitQuickAdd(); }
    else if (e.key === 'Escape') { $('quick-add-suggest').hidden = true; }
    else if (e.key === 'Backspace' && !input.value && quickAdd.nodeId) { quickAdd.nodeId = null; renderQuickAddPreview(); }
  });
  $('quick-add-suggest').addEventListener('mousedown', e => { const b = e.target.closest('[data-i]'); if (b) { e.preventDefault(); chooseQuickSuggest(Number(b.dataset.i)); } });
  $('quick-add-preview').addEventListener('click', e => { if (e.target.closest('[data-qa-clear]')) { e.preventDefault(); quickAdd.nodeId = null; renderQuickAddPreview(); } });
}

/* ================================================================= CALENDAR */
function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - x.getDay()); return x; }
function renderCalendar() {
  const grid = $('calendar-grid'), title = $('calendar-month-year');
  if (!grid || !title) return;
  const ref = state.calendarDate;
  const week = state.calendarMode === 'week';
  $('btn-cal-month').classList.toggle('active', !week);
  $('btn-cal-week').classList.toggle('active', week);
  $('btn-cal-month').setAttribute('aria-checked', String(!week));
  $('btn-cal-week').setAttribute('aria-checked', String(week));
  let start, days;
  if (week) {
    start = startOfWeek(ref);
    days = 7;
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    title.textContent = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
  } else {
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    start = startOfWeek(first);
    const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    const totalCells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
    days = totalCells;
    title.textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  grid.classList.toggle('week', week);
  const g = graph();
  const byDate = new Map();
  const hb = $('btn-cal-hide-completed');
  if (hb) { hb.setAttribute('aria-pressed', String(state.calHideCompleted)); hb.textContent = state.calHideCompleted ? 'Show completed' : 'Hide completed'; }
  state.tasks.forEach(t => { if (state.calHideCompleted && t.completed) return; if (t.dueDate) { if (!byDate.has(t.dueDate)) byDate.set(t.dueDate, []); byDate.get(t.dueDate).push(t); } });
  const today = todayKey();
  let html = '';
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = toDateKey(d);
    const muted = !week && d.getMonth() !== ref.getMonth();
    const list = (byDate.get(key) || []).slice().sort((a, b) => (a.completed - b.completed) || (a.description || '').localeCompare(b.description || ''));
    const max = week ? 99 : 4;
    html += `<div class="cal-cell${muted ? ' muted' : ''}${key === today ? ' today' : ''}" data-date="${key}" title="Add a task on ${esc(d.toLocaleDateString())}">
      <span class="cal-num">${d.getDate()}</span>
      ${list.slice(0, max).map(t => {
        const n = g.nodeMap.get(t.nodeId);
        const hex = n ? colorHex(n.color) : '#64748b';
        const overdue = !t.completed && key < today;
        return `<button class="cal-ev${t.completed ? ' done' : ''}${overdue ? ' overdue' : ''}" draggable="true" data-tid="${esc(t.id)}" style="background:${hex}1f" title="${esc((t.description || '') + (n ? ' — ' + nodeTitle(n) : ''))}"><span class="dot" style="background:${hex};width:7px;height:7px"></span><span class="ev-t">${esc(t.description || 'Untitled')}</span></button>`;
      }).join('')}
      ${list.length > max ? `<button class="cal-more" data-more="${key}">+${list.length - max} more</button>` : ''}
    </div>`;
  }
  grid.innerHTML = html;
}
function wireCalendar() {
  const grid = $('calendar-grid');
  grid.addEventListener('click', e => {
    const ev = e.target.closest('.cal-ev');
    if (ev) { openTaskDialog({ taskId: ev.dataset.tid }); return; }
    const more = e.target.closest('[data-more]');
    if (more) { state.calendarDate = parseDateKey(more.dataset.more); state.calendarMode = 'week'; renderCalendar(); return; }
    const cell = e.target.closest('.cal-cell');
    if (cell) openTaskDialog({ date: cell.dataset.date });
  });
  let dragId = null;
  grid.addEventListener('dragstart', e => {
    const ev = e.target.closest('.cal-ev');
    if (!ev) return;
    dragId = ev.dataset.tid;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {}
  });
  grid.addEventListener('dragover', e => {
    const cell = e.target.closest('.cal-cell');
    if (!cell || !dragId) return;
    e.preventDefault();
    grid.querySelectorAll('.cal-cell.drop').forEach(c => { if (c !== cell) c.classList.remove('drop'); });
    cell.classList.add('drop');
  });
  grid.addEventListener('dragleave', e => { const cell = e.target.closest('.cal-cell'); if (cell && !cell.contains(e.relatedTarget)) cell.classList.remove('drop'); });
  grid.addEventListener('drop', e => {
    const cell = e.target.closest('.cal-cell');
    grid.querySelectorAll('.cal-cell.drop').forEach(c => c.classList.remove('drop'));
    if (!cell || !dragId) return;
    e.preventDefault();
    const t = state.tasks.find(x => x.id === dragId);
    dragId = null;
    if (!t || t.dueDate === cell.dataset.date) return;
    pushHistory();
    t.dueDate = cell.dataset.date;
    commitState(true);
    showToast(`Moved to ${dueLabel(t.dueDate)}`);
  });
  grid.addEventListener('dragend', () => { dragId = null; grid.querySelectorAll('.cal-cell.drop').forEach(c => c.classList.remove('drop')); });
  const shift = dir => {
    const d = new Date(state.calendarDate);
    if (state.calendarMode === 'week') d.setDate(d.getDate() + dir * 7);
    else { d.setDate(1); d.setMonth(d.getMonth() + dir); }
    state.calendarDate = d;
    renderCalendar();
  };
  $('btn-cal-prev').addEventListener('click', () => shift(-1));
  $('btn-cal-next').addEventListener('click', () => shift(1));
  $('btn-cal-today').addEventListener('click', () => { state.calendarDate = new Date(); renderCalendar(); });
  $('btn-cal-month').addEventListener('click', () => { state.calendarMode = 'month'; renderCalendar(); });
  $('btn-cal-week').addEventListener('click', () => { state.calendarMode = 'week'; renderCalendar(); });
  $('btn-cal-hide-completed').addEventListener('click', () => { state.calHideCompleted = !state.calHideCompleted; saveUiPrefs(); renderCalendar(); });
  $('btn-calendar-open-task').addEventListener('click', () => openTaskDialog({}));
}

/* ============================================================== TASK DIALOG */
function openTaskDialog({ taskId = null, nodeId = null, date = null, description = '', bulkNodeIds = null } = {}) {
  const modal = $('task-modal');
  const task = taskId ? state.tasks.find(t => t.id === taskId) : null;
  if (taskId && !task) return;
  closeAllPopovers();
  const box = modal.querySelector('.dialog');
  box.style.left = ''; box.style.top = ''; box.style.position = '';
  state.taskDialog = {
    taskId: task ? task.id : null,
    nodeId: task ? task.nodeId : (nodeId || (state.selectedNodeIds.size === 1 ? [...state.selectedNodeIds][0] : null) || (state.nodes[0] && state.nodes[0].id) || null),
    bulkNodeIds: bulkNodeIds && bulkNodeIds.length > 1 ? bulkNodeIds : null
  };
  $('task-modal-title').textContent = task ? 'Task details' : (state.taskDialog.bulkNodeIds ? `New task for ${bulkNodeIds.length} nodes` : 'New task');
  $('task-desc-input').value = task ? task.description : description;
  $('task-date-input').value = task ? (task.dueDate || '') : (date !== null ? date : todayKey());
  $('task-completion-section').hidden = !task;
  $('btn-delete-task').hidden = !task;
  $('btn-confirm-task').textContent = task ? 'Save changes' : 'Save task';
  if (task) {
    $('completion-status-checkbox').checked = !!task.completed;
    $('completion-time-input').value = task.completedAt || getLocalDateTimeString();
    $('completion-notes-input').value = task.completionNotes || '';
    $('completion-time-wrap').hidden = !task.completed;
  }
  renderTaskNodeBtn();
  modal.hidden = false;
  $('task-desc-input').focus();
}
function renderTaskNodeBtn() {
  const btn = $('task-node-btn');
  const ids = state.taskDialog.bulkNodeIds;
  if (ids) { btn.innerHTML = `<span>${ids.length} selected nodes</span>`; btn.disabled = true; return; }
  btn.disabled = false;
  const n = state.taskDialog.nodeId ? getNode(state.taskDialog.nodeId) : null;
  btn.innerHTML = n ? `<span class="dot" style="background:${colorHex(n.color)}"></span><span style="overflow:hidden;text-overflow:ellipsis">${esc(nodeTitle(n))}</span><span class="push">${icon('chev-down', 14)}</span>` : `<span class="ph">Choose a node…</span><span class="push">${icon('chev-down', 14)}</span>`;
}
function closeTaskDialog() { $('task-modal').hidden = true; closeAllPopovers(); }
function saveTaskDialog() {
  const desc = $('task-desc-input').value.trim();
  const due = $('task-date-input').value;
  const { taskId, nodeId, bulkNodeIds } = state.taskDialog;
  if (!desc) { showToast('Please enter a task description'); $('task-desc-input').focus(); return; }
  if (!nodeId && !bulkNodeIds) { showToast('Please choose a linked node'); return; }
  pushHistory();
  if (taskId) {
    const t = state.tasks.find(x => x.id === taskId);
    if (!t) { closeTaskDialog(); return; }
    t.description = desc;
    t.dueDate = due;
    t.nodeId = nodeId;
    t.completed = $('completion-status-checkbox').checked;
    t.completedAt = t.completed ? ($('completion-time-input').value || getLocalDateTimeString()) : '';
    t.completionNotes = $('completion-notes-input').value.trim();
    closeTaskDialog();
    commitState(true);
    showToast('Task updated');
  } else {
    const targets = bulkNodeIds || [nodeId];
    targets.forEach((nid, i) => state.tasks.push({ id: uid('task'), description: desc, dueDate: due, nodeId: nid, completed: false, completedAt: '', completionNotes: '' }));
    closeTaskDialog();
    commitState(true);
    showToast(targets.length > 1 ? `Added ${targets.length} tasks` : 'Task created');
  }
}
function makeDraggable(box, handle) {
  handle.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    const r = box.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    box.style.position = 'fixed';
    box.style.left = `${r.left}px`; box.style.top = `${r.top}px`;
    const mm = ev => {
      box.style.left = `${clamp(ev.clientX - ox, 0, window.innerWidth - box.offsetWidth)}px`;
      box.style.top = `${clamp(ev.clientY - oy, 0, window.innerHeight - box.offsetHeight)}px`;
    };
    const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  });
}
function wireTaskDialog() {
  const modal = $('task-modal');
  makeDraggable(modal.querySelector('.dialog'), modal.querySelector('[data-drag-handle]'));
  $('btn-close-task-modal').addEventListener('click', closeTaskDialog);
  $('btn-cancel-task-modal').addEventListener('click', closeTaskDialog);
  $('btn-confirm-task').addEventListener('click', saveTaskDialog);
  $('btn-delete-task').addEventListener('click', () => { const id = state.taskDialog.taskId; closeTaskDialog(); deleteTask(id); });
  modal.addEventListener('mousedown', e => { if (e.target === modal) closeTaskDialog(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('picker').hidden) { e.preventDefault(); e.stopPropagation(); closeTaskDialog(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveTaskDialog(); }
  });
  $('task-node-btn').addEventListener('click', e => {
    openPicker({ anchor: e.currentTarget, current: state.taskDialog.nodeId, onPick: id => { state.taskDialog.nodeId = id; renderTaskNodeBtn(); } });
  });
  $('completion-status-checkbox').addEventListener('change', e => {
    $('completion-time-wrap').hidden = !e.target.checked;
    if (e.target.checked && !$('completion-time-input').value) $('completion-time-input').value = getLocalDateTimeString();
  });
}

/* ========================================================= COMMAND PALETTE */
const palette = { items: [], idx: 0 };
function paletteCommands() {
  const one = state.selectedNodeIds.size === 1 ? getNode([...state.selectedNodeIds][0]) : null;
  const mod = IS_MAC ? '⌘' : 'Ctrl ';
  const cmds = [
    { label: 'Add node', icon: 'plus', kbd: 'N', run: () => { switchPage('canvas'); addNode({}); } },
    one && { label: `Add child to “${nodeTitle(one)}”`, icon: 'plus', kbd: 'Tab', run: () => { switchPage('canvas'); addNode({ parentId: one.id }); } },
    { label: 'New task', icon: 'check-square', run: () => openTaskDialog({}) },
    { label: 'New cluster', icon: 'cluster', run: createIsolatedGroup },
    one && childIds(one.id).length && { label: `Focus branch: ${nodeTitle(one)}`, icon: 'target', kbd: 'F', run: () => focusBranch(one.id) },
    one && childIds(one.id).length && { label: `Tidy branch: ${nodeTitle(one)}`, icon: 'layout', run: () => tidyBranch(one.id) },
    { label: 'Collapse all branches', icon: 'fold', run: () => { switchPage('canvas'); setAllCollapsed(true); } },
    { label: 'Expand all branches', icon: 'fold', run: () => { switchPage('canvas'); setAllCollapsed(false); } },
    { label: 'Fit diagram to screen', icon: 'fit', run: () => { switchPage('canvas'); fitDiagram(); } },
    { label: 'Select all nodes', icon: 'select-all', kbd: `${mod}A`, run: selectEntireDiagram },
    { label: 'Go to Canvas', icon: 'canvas', kbd: '1', run: () => switchPage('canvas') },
    { label: 'Go to Outline', icon: 'outline', kbd: '2', run: () => switchPage('outline') },
    { label: 'Go to Table', icon: 'table', kbd: '3', run: () => switchPage('table') },
    { label: 'Go to Tasks', icon: 'tasks', kbd: '4', run: () => switchPage('tasks') },
    { label: 'Go to Calendar', icon: 'calendar', kbd: '5', run: () => switchPage('calendar') },
    { label: 'Cycle theme (light / dark / black)', icon: 'moon', run: cycleTheme },
    { label: 'Export canvas as PNG', icon: 'image', run: exportToPNG },
    { label: 'Export outline as PDF', icon: 'file', run: () => { switchPage('outline'); exportOutlinePDF(); } },
    { label: 'Download backup (.json)', icon: 'download', run: downloadBackup },
    { label: 'Toggle clusters panel', icon: 'sidebar', run: togglePanel },
    { label: 'Undo', icon: 'undo', kbd: `${mod}Z`, run: performUndo },
    { label: 'Redo', icon: 'redo', kbd: `${mod}Y`, run: performRedo },
    { label: 'Reset diagram to original template', icon: 'reset', run: () => { if (confirmReset()) resetToDefaultDiagram(); } },
    auth && auth.currentUser && { label: 'Sign out', icon: 'logout', run: signOut }
  ];
  return cmds.filter(Boolean);
}
function confirmReset() { return window.confirm('Replace the whole diagram with the original template? You can undo this.'); }
function highlight(text, q) {
  const t = esc(text);
  if (!q) return t;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return t;
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}
function openPalette(prefix = '') {
  closeAllPopovers();
  const bd = $('palette-backdrop');
  bd.hidden = false;
  const input = $('palette-input');
  input.value = prefix;
  palette.idx = 0;
  renderPalette();
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}
function closePalette() { $('palette-backdrop').hidden = true; }
function renderPalette() {
  const raw = $('palette-input').value;
  const cmdOnly = raw.trim().startsWith('>');
  const q = raw.replace(/^\s*>/, '').toLowerCase().trim();
  const groups = [];
  const g = graph();
  if (!cmdOnly && q) {
    const nodes = state.nodes
      .map(n => ({ n, t: nodeTitle(n), i: nodeTitle(n).toLowerCase().indexOf(q) }))
      .filter(x => x.i >= 0)
      .sort((a, b) => a.i - b.i || a.t.length - b.t.length)
      .slice(0, 8)
      .map(({ n, t }) => {
        const p = g.nodeMap.get(g.parent.get(n.id));
        const kids = childIds(n.id).length;
        return {
          type: 'node', id: n.id,
          html: `<span class="pico"><span class="dot" style="background:${colorHex(n.color)}"></span></span><span class="ptext">${highlight(t, q)}</span><span class="pmeta">${kids ? `Branch · ${descendantIds(n.id).length} below` : p ? `in ${esc(nodeTitle(p))}` : 'Top level'}</span>`,
          run: () => focusNodeOnCanvas(n.id),
          alt: () => focusBranch(n.id)
        };
      });
    if (nodes.length) groups.push({ title: 'Nodes', items: nodes });
    const tasks = state.tasks
      .filter(t => (t.description || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({
        type: 'task',
        html: `<span class="pico">${icon(t.completed ? 'check' : 'check-square', 15)}</span><span class="ptext"${t.completed ? ' style="text-decoration:line-through;color:var(--sub)"' : ''}>${highlight(t.description || '', q)}</span><span class="pmeta">${t.dueDate ? 'Due ' + esc(dueLabel(t.dueDate)) : ''}</span>`,
        run: () => openTaskDialog({ taskId: t.id })
      }));
    if (tasks.length) groups.push({ title: 'Tasks', items: tasks });
  }
  const cmds = paletteCommands()
    .filter(c => !q || c.label.toLowerCase().includes(q))
    .slice(0, cmdOnly || !q ? 30 : 6)
    .map(c => ({ type: 'cmd', html: `<span class="pico">${icon(c.icon, 15)}</span><span class="ptext">${highlight(c.label, q)}</span>${c.kbd ? `<span class="pmeta"><span class="kbd">${esc(c.kbd)}</span></span>` : ''}`, run: c.run }));
  if (cmds.length) groups.push({ title: cmdOnly || !q ? 'Commands' : 'Actions', items: cmds });

  palette.items = groups.flatMap(gr => gr.items);
  palette.idx = clamp(palette.idx, 0, Math.max(0, palette.items.length - 1));
  let k = 0;
  $('palette-results').innerHTML = palette.items.length ? groups.map(gr =>
    `<div class="pgrp">${gr.title}</div>` + gr.items.map(it => { const i = k++; return `<button class="pitem${i === palette.idx ? ' on' : ''}" data-i="${i}" role="option" aria-selected="${i === palette.idx}">${it.html}</button>`; }).join('')
  ).join('') : `<div class="pempty">No results for “${esc(q)}”</div>`;
  const on = $('palette-results').querySelector('.pitem.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}
function runPaletteItem(i, alt = false) {
  const it = palette.items[i];
  if (!it) return;
  closePalette();
  (alt && it.alt ? it.alt : it.run)();
}
function wirePalette() {
  const input = $('palette-input');
  input.addEventListener('input', () => { palette.idx = 0; renderPalette(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palette.idx = Math.min(palette.items.length - 1, palette.idx + 1); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palette.idx = Math.max(0, palette.idx - 1); renderPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPaletteItem(palette.idx, e.ctrlKey || e.metaKey); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePalette(); }
  });
  $('palette-results').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) runPaletteItem(Number(b.dataset.i), e.ctrlKey || e.metaKey); });
  $('palette-results').addEventListener('mousemove', e => {
    const b = e.target.closest('[data-i]');
    if (b && Number(b.dataset.i) !== palette.idx) {
      palette.idx = Number(b.dataset.i);
      $('palette-results').querySelectorAll('.pitem').forEach(x => x.classList.toggle('on', x === b));
    }
  });
  $('palette-backdrop').addEventListener('mousedown', e => { if (e.target.id === 'palette-backdrop') closePalette(); });
}

/* ==================================================================== PAGES */
const PAGE_LABELS = { canvas: 'Canvas', outline: 'Outline', table: 'Table', tasks: 'Tasks', calendar: 'Calendar' };
function switchPage(page) {
  if (!PAGE_LABELS[page]) page = 'canvas';
  if (state.currentPage === 'outline' && page !== 'outline' && state.outlineEditingId) finishOutlineEdit();
  if (state.table.editing && page !== 'table') commitCellEdit();
  const changed = state.currentPage !== page;
  state.currentPage = page;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${page}`));
  document.querySelectorAll('.rail-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === page));
  $('crumb-view').textContent = PAGE_LABELS[page];
  if (page === 'canvas') {
    renderBoard();
    applyTransform();
  } else {
    if (page === 'outline') renderOutline();
    else if (page === 'table') renderTable();
    else if (page === 'tasks') renderTasks();
    else if (page === 'calendar') renderCalendar();
  }
  renderInspector();
  positionQuickbar();
  positionEdgeChip();
  if (changed && page === 'outline') setTimeout(() => focusOutlineRow(state.outlineFocusId), 0);
}
function togglePanel() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    document.body.classList.toggle('panel-open');
  } else {
    state.panelCollapsed = !state.panelCollapsed;
    document.body.classList.toggle('panel-collapsed', state.panelCollapsed);
    saveUiPrefs();
  }
  requestAnimationFrame(() => { scheduleOverlayUpdate(); drawMinimap(); });
}
function downloadBackup() {
  const data = JSON.stringify({ nodes: state.nodes, edges: state.edges, tasks: state.tasks, lastModified: state.lastModified }, null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  downloadDataUrl(url, `workmap-backup-${todayKey()}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('Backup downloaded');
}

/* ================================================================= KEYBOARD */
const activeKeys = new Set();
function isTypingTarget(el) {
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}
function anyOverlayOpen() {
  return !$('palette-backdrop').hidden || !$('task-modal').hidden || !$('auth-modal').hidden;
}
function onGlobalKeydown(e) {
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (mod && key === 'k') { e.preventDefault(); $('palette-backdrop').hidden ? openPalette() : closePalette(); return; }
  if (e.key === 'Escape') {
    if (!$('menu-popover').hidden || !$('picker').hidden || !$('cluster-color-popover').hidden) { closeAllPopovers(); return; }
    if (document.body.classList.contains('panel-open')) document.body.classList.remove('panel-open');
  }
  if (anyOverlayOpen() || isTypingTarget(document.activeElement) || isTypingTarget(e.target)) return;
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'BUTTON' || ae.tagName === 'A') && (e.key === 'Enter' || e.key === ' ')) return; // let buttons work
  activeKeys.add(e.code);

  if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); performUndo(); return; }
  if (mod && (key === 'y' || (e.shiftKey && key === 'z'))) { e.preventDefault(); performRedo(); return; }
  if (state.currentPage === 'outline' && $('tree-container').contains(document.activeElement)) return; // outline handles its own keys
  if (!mod && !e.altKey && /^[1-5]$/.test(e.key)) { switchPage(['canvas', 'outline', 'table', 'tasks', 'calendar'][Number(e.key) - 1]); return; }
  if (state.currentPage !== 'canvas') {
    if (key === '/' ) { e.preventDefault(); const s = document.querySelector('.view.active input[type="text"]'); if (s) s.focus(); }
    return;
  }

  if (e.shiftKey && activeKeys.has('KeyZ') && activeKeys.has('KeyX')) { e.preventDefault(); createIsolatedGroup(); return; }
  if (e.shiftKey && (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd')) { e.preventDefault(); addChildOfSelected(); return; }
  if (mod && key === 'a') { e.preventDefault(); selectEntireDiagram(); return; }
  if (e.key === 'Escape') {
    if (state.mode === 'connect' || state.mode === 'connect-directed') { setAppMode('pan'); return; }
    clearSelection();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
  if (mod || e.altKey) return;
  const one = state.selectedNodeIds.size === 1 ? [...state.selectedNodeIds][0] : null;
  const focusFree = !ae || ae === document.body || viewportEl().contains(ae);
  if (e.key === 'Tab' && one && focusFree) { e.preventDefault(); addNode({ parentId: one }); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (one) addSiblingOfSelected(); return; }
  if (e.key === 'F2' && one) { e.preventDefault(); openNodeEditor(one, { selectAll: true }); return; }
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); state.spacePan = true; viewportEl().classList.add('panning'); return; }
  switch (key) {
    case 'v': setAppMode('select'); break;
    case 'h': setAppMode('pan'); break;
    case 'c': setAppMode(state.mode === 'connect' ? 'pan' : 'connect'); break;
    case 'a': setAppMode(state.mode === 'connect-directed' ? 'pan' : 'connect-directed'); break;
    case 'n': addNode({ pos: lastPointerWorld() }); break;
    case 'f': if (one) focusBranch(one); else fitDiagram(); break;
    case '.': if (one) toggleCollapse(one); break;
    case '0': resetZoom(); break;
    case '-': zoomBy(1 / 1.2); break;
    case '=': zoomBy(1.2); break;
    case 'arrowleft': case 'arrowright': case 'arrowup': case 'arrowdown': {
      if (!state.selectedNodeIds.size) return;
      e.preventDefault();
      nudgeSelection(key, e.shiftKey ? 40 : 8);
      break;
    }
  }
}
let nudgeTimer = null, nudgePushed = false;
function nudgeSelection(key, step) {
  if (!nudgePushed) { pushHistory(); nudgePushed = true; }
  const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
  const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
  selectedNodes().forEach(n => {
    n.x += dx; n.y += dy;
    const el = $(`node-${n.id}`);
    if (el) { el.style.left = `${n.x}px`; el.style.top = `${n.y}px`; }
  });
  updateEdgeCoordinates();
  scheduleOverlayUpdate();
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => { nudgePushed = false; commitState(true); }, 450);
}
let pointerWorld = null;
function lastPointerWorld() {
  if (!pointerWorld) return null;
  const r = viewportRect();
  const s = worldToScreen(pointerWorld.x, pointerWorld.y);
  if (s.x < r.left || s.y < r.top || s.x > r.left + r.width || s.y > r.top + r.height) return null;
  return pointerWorld;
}
function onGlobalKeyup(e) {
  activeKeys.delete(e.code);
  if (e.code === 'Space' && state.spacePan) {
    state.spacePan = false;
    if (!state.isPanning) viewportEl().classList.remove('panning');
  }
}

/* ============================================================ CANVAS INPUT */
function wireCanvas() {
  const vp = viewportEl();
  const marquee = $('marquee-box');
  // overflow:hidden containers can still be scrolled by focus/scrollIntoView; keep them pinned
  [vp, $('view-canvas')].forEach(el => el.addEventListener('scroll', () => { if (el.scrollLeft || el.scrollTop) { el.scrollLeft = 0; el.scrollTop = 0; } }));
  let panMoved = 0, panOrigin = null;

  vp.addEventListener('mousedown', e => {
    closeAllPopovers();
    if (document.activeElement && $('inspector').contains(document.activeElement)) document.activeElement.blur();
    if (e.button === 2) return;
    if (e.button === 1 || state.mode === 'pan' || state.spacePan || state.mode === 'connect' || state.mode === 'connect-directed') {
      e.preventDefault();
      state.isPanning = true;
      panMoved = 0;
      panOrigin = { x: e.clientX, y: e.clientY };
      state.panStart = { x: e.clientX - state.view.x, y: e.clientY - state.view.y };
      vp.classList.add('panning');
      return;
    }
    if (e.button === 0 && state.mode === 'select') {
      state.isMarquee = true;
      state.marqueeStart = { x: e.clientX, y: e.clientY };
      state.marqueeBase = (e.shiftKey || e.ctrlKey || e.metaKey) ? new Set(state.selectedNodeIds) : new Set();
      const r = vp.getBoundingClientRect();
      marquee.style.left = `${e.clientX - r.left}px`;
      marquee.style.top = `${e.clientY - r.top}px`;
      marquee.style.width = '0px';
      marquee.style.height = '0px';
      marquee.style.display = 'block';
      if (!state.marqueeBase.size) { state.selectedNodeIds.clear(); state.selectedEdgeId = null; updateSelectionVisuals(); }
    }
  });
  window.addEventListener('mousemove', e => {
    if (state.currentPage === 'canvas') pointerWorld = screenToWorld(e.clientX, e.clientY);
    if (state.isPanning) {
      panMoved = Math.max(panMoved, Math.hypot(e.clientX - panOrigin.x, e.clientY - panOrigin.y));
      state.view.x = e.clientX - state.panStart.x;
      state.view.y = e.clientY - state.panStart.y;
      applyTransform();
      return;
    }
    if (state.isMarquee) {
      const r = vp.getBoundingClientRect();
      const sx = state.marqueeStart.x, sy = state.marqueeStart.y;
      const minX = Math.min(sx, e.clientX), minY = Math.min(sy, e.clientY);
      const w = Math.abs(e.clientX - sx), h = Math.abs(e.clientY - sy);
      marquee.style.left = `${minX - r.left}px`; marquee.style.top = `${minY - r.top}px`;
      marquee.style.width = `${w}px`; marquee.style.height = `${h}px`;
      const { x: vx, y: vy, zoom } = state.view;
      const next = new Set(state.marqueeBase);
      state.nodes.forEach(n => {
        if (boardHidden.has(n.id)) return;
        const px = n.x * zoom + vx + r.left, py = n.y * zoom + vy + r.top;
        if (px >= minX && px <= minX + w && py >= minY && py <= minY + h) next.add(n.id);
      });
      if (next.size !== state.selectedNodeIds.size || [...next].some(id => !state.selectedNodeIds.has(id))) {
        state.selectedNodeIds = next;
        document.querySelectorAll('#nodes-container .node').forEach(el => el.classList.toggle('selected', next.has(el.dataset.id)));
      }
    }
  });
  window.addEventListener('mouseup', () => {
    if (state.isPanning) {
      state.isPanning = false;
      if (!state.spacePan) vp.classList.remove('panning');
      if (panMoved < 4 && state.mode !== 'connect' && state.mode !== 'connect-directed') clearSelection();
    }
    if (state.isMarquee) {
      state.isMarquee = false;
      marquee.style.display = 'none';
      updateSelectionVisuals();
      if (state.selectedNodeIds.size > 1) showToast(`${state.selectedNodeIds.size} nodes selected · drag any to move them together`);
    }
  });
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const old = state.view.zoom;
    const factor = e.ctrlKey ? Math.exp(-e.deltaY * 0.01) : (e.deltaY < 0 ? 1.1 : 1 / 1.1);
    const z = clamp(old * factor, 0.2, 2.5);
    const r = vp.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    state.view.x = mx - (mx - state.view.x) * (z / old);
    state.view.y = my - (my - state.view.y) * (z / old);
    state.view.zoom = z;
    applyTransform();
  }, { passive: false });
  vp.addEventListener('contextmenu', e => {
    if (e.target.closest('.node')) return;
    e.preventDefault();
    state.contextClickPos = screenToWorld(e.clientX, e.clientY);
    openCanvasContextMenu(e.clientX, e.clientY, state.contextClickPos);
  });
  vp.addEventListener('dblclick', e => {
    if (e.target.closest('.node')) return;
    addNode({ pos: screenToWorld(e.clientX, e.clientY) });
  });

  // touch: pan + pinch
  let pinch = null, touchMoved = 0, touchOrigin = null;
  vp.addEventListener('touchstart', e => {
    closeAllPopovers();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchMoved = 0; touchOrigin = { x: t.clientX, y: t.clientY };
      state.isPanning = true;
      state.panStart = { x: t.clientX - state.view.x, y: t.clientY - state.view.y };
    } else if (e.touches.length === 2) {
      state.isPanning = false;
      const [a, b] = e.touches;
      pinch = { d: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY), zoom: state.view.zoom, cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2, vx: state.view.x, vy: state.view.y };
    }
  }, { passive: false });
  vp.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && state.isPanning) {
      e.preventDefault();
      const t = e.touches[0];
      touchMoved = Math.max(touchMoved, Math.hypot(t.clientX - touchOrigin.x, t.clientY - touchOrigin.y));
      state.view.x = t.clientX - state.panStart.x;
      state.view.y = t.clientY - state.panStart.y;
      applyTransform();
    } else if (e.touches.length === 2 && pinch) {
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
      const z = clamp(pinch.zoom * (d / pinch.d), 0.2, 2.5);
      const r = vp.getBoundingClientRect();
      const ox = pinch.cx - r.left, oy = pinch.cy - r.top;
      state.view.x = ox - (ox - pinch.vx) * (z / pinch.zoom) + (cx - pinch.cx);
      state.view.y = oy - (oy - pinch.vy) * (z / pinch.zoom) + (cy - pinch.cy);
      state.view.zoom = z;
      applyTransform();
    }
  }, { passive: false });
  vp.addEventListener('touchend', e => {
    if (e.touches.length < 2) pinch = null;
    if (e.touches.length === 0) {
      if (state.isPanning && touchMoved < 6 && state.mode !== 'connect' && state.mode !== 'connect-directed') clearSelection();
      state.isPanning = false;
    }
  });

  // toolbar + overlays
  document.querySelectorAll('#tool-palette [data-mode]').forEach(b => b.addEventListener('click', () => setAppMode(b.dataset.mode)));
  $('btn-focus').addEventListener('click', () => { const one = [...state.selectedNodeIds][0]; if (state.selectedNodeIds.size === 1) focusBranch(one); else if (state.selectedNodeIds.size) fitNodes(selectedNodes(), { maxZoom: 1.4 }); else fitDiagram(); });
  $('btn-autolayout').addEventListener('click', () => { if (state.selectedNodeIds.size === 1) tidyBranch([...state.selectedNodeIds][0]); else showToast('Select one node with children to tidy its branch'); });
  $('btn-select-all').addEventListener('click', selectEntireDiagram);
  $('btn-open-add-modal').addEventListener('click', addChildOfSelected);
  $('btn-zoom-in').addEventListener('click', () => zoomBy(1.2));
  $('btn-zoom-out').addEventListener('click', () => zoomBy(1 / 1.2));
  $('zoom-level-text').addEventListener('click', resetZoom);
  $('btn-center-diagram').addEventListener('click', fitDiagram);
  $('edge-chip').addEventListener('click', () => { if (state.selectedEdgeId) deleteEdge(state.selectedEdgeId); });
  $('node-quickbar').addEventListener('mousedown', e => e.stopPropagation());
  $('node-quickbar').addEventListener('click', e => {
    const b = e.target.closest('[data-qa]');
    const id = [...state.selectedNodeIds][0];
    if (!b || !id) return;
    const a = b.dataset.qa;
    if (a === 'child') addNode({ parentId: id });
    else if (a === 'task') openTaskDialog({ nodeId: id });
    else if (a === 'collapse') toggleCollapse(id);
    else if (a === 'focus') focusBranch(id);
    else if (a === 'delete') deleteNodes([id]);
  });
  const mm = $('minimap');
  let mmDrag = false;
  mm.addEventListener('mousedown', e => { mmDrag = true; minimapPanTo(e.clientX, e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', e => { if (mmDrag) minimapPanTo(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { mmDrag = false; });
}

/* ================================================================== WIRING */
function wireChrome() {
  document.querySelectorAll('.rail-btn[data-view]').forEach(b => b.addEventListener('click', () => switchPage(b.dataset.view)));
  $('btn-toggle-panel').addEventListener('click', togglePanel);
  $('btn-search').addEventListener('click', () => openPalette());
  $('search-kbd').textContent = IS_MAC ? '⌘K' : 'Ctrl K';
  $('btn-undo').addEventListener('click', performUndo);
  $('btn-redo').addEventListener('click', performRedo);
  $('btn-theme-toggle').addEventListener('click', cycleTheme);
  $('btn-export').addEventListener('click', e => openMenu([
    { label: 'Canvas as PNG', icon: 'image', action: exportToPNG },
    { label: 'Outline as PDF', icon: 'file', action: () => { switchPage('outline'); exportOutlinePDF(); } },
    'sep',
    { label: 'Download backup (.json)', icon: 'download', action: downloadBackup }
  ], 0, 0, e.currentTarget));
  $('btn-user').addEventListener('click', e => {
    const u = auth && auth.currentUser;
    openMenu([
      { head: u ? (u.email || 'Signed in') : 'Not signed in' },
      { label: 'Cycle theme', icon: 'moon', action: cycleTheme },
      { label: 'Keyboard shortcuts', icon: 'help', action: showShortcuts },
      ...(u ? ['sep', { label: 'Sign out', icon: 'logout', danger: true, action: signOut }] : [])
    ], 0, 0, e.currentTarget);
  });
  // cluster panel
  $('sidebar-cluster-list').addEventListener('click', e => {
    const eye = e.target.closest('[data-eye]');
    if (eye) { e.stopPropagation(); toggleClusterHidden(eye.dataset.eye); return; }
    const row = e.target.closest('[data-cluster]');
    if (row) { selectDynamicCluster(row.dataset.cluster); if (window.matchMedia('(max-width: 900px)').matches) document.body.classList.remove('panel-open'); }
  });
  $('sidebar-cluster-list').addEventListener('keydown', e => {
    const row = e.target.closest('[data-cluster]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectDynamicCluster(row.dataset.cluster); }
  });
  $('sidebar-cluster-list').addEventListener('contextmenu', e => {
    const row = e.target.closest('[data-cluster]');
    if (!row) return;
    e.preventDefault();
    const from = row.dataset.cluster;
    state.clusterColorTargetRootId = from;
    openColorPopover(Math.min(window.innerWidth - 200, e.clientX + 10), e.clientY, to => { changeClusterColor(from, to); state.clusterColorTargetRootId = null; });
  });
  $('cluster-filter').addEventListener('input', renderClusterList);
  window.addEventListener('resize', rafThrottle(() => { scheduleOverlayUpdate(); drawMinimap(); }));
}
function showShortcuts() {
  const mod = IS_MAC ? '⌘' : 'Ctrl';
  openMenu([
    { head: 'Canvas' },
    { label: 'Add child / sibling', kbd: 'Tab / ↵' },
    { label: 'Add node at pointer', kbd: 'N' },
    { label: 'Edit selected', kbd: 'F2 · Dbl-click' },
    { label: 'Select · Pan · Connect · Flow', kbd: 'V H C A' },
    { label: 'Pan temporarily', kbd: 'Space' },
    { label: 'Focus branch · Collapse', kbd: 'F · .' },
    { label: 'Nudge selection', kbd: 'Arrows' },
    { label: 'Zoom · Reset', kbd: '- = · 0' },
    'sep',
    { head: 'Everywhere' },
    { label: 'Search & commands', kbd: `${mod} K` },
    { label: 'Undo · Redo', kbd: `${mod} Z · ${mod} Y` },
    { label: 'Switch view', kbd: '1 – 5' }
  ], window.innerWidth - 320, 60);
}

/* ============================================================ FIREBASE SYNC */
let dbSyncAttached = false;
let initialSyncDone = false;
function initDatabaseSync() {
  if (dbSyncAttached || !window.boardRef) return;
  dbSyncAttached = true;
  db.ref('.info/connected').on('value', snap => {
    if (snap.val() === false) setSaveStatus('offline');
    else setSaveStatus('synced', state.lastModified);
  });
  window.boardRef.on('value', snapshot => {
    const cloud = snapshot.val();
    if (cloud && Array.isArray(cloud.nodes) && Array.isArray(cloud.edges)) {
      if (state.isDraggingGroup) return;
      const ts = cloud.lastModified || 0;
      // our own write echoing back: identical data, skip the re-render
      if (initialSyncDone && ts === state.lastModified) { setSaveStatus('synced', ts); hideSplashScreen(); return; }
      if (ts >= state.lastModified) {
        isIncomingSync = true;
        state.nodes = cloud.nodes.filter(Boolean).map(normalizeNode);
        state.edges = cloud.edges.filter(Boolean).map(normalizeEdge);
        state.tasks = normalizeTasks(cloud.tasks);
        state.lastModified = ts;
        markDirty();
        persistLocal();
        refreshAll();
        isIncomingSync = false;
        setSaveStatus('synced', ts);
        if (!initialSyncDone) { initialSyncDone = true; centerDiagram(); }
      }
    } else {
      commitState(false);
      if (!initialSyncDone) { initialSyncDone = true; centerDiagram(); }
    }
    hideSplashScreen();
  }, err => {
    console.error('Firebase sync error:', err);
    setSaveStatus('error');
    hideSplashScreen();
  });
}

/* ===================================================================== AUTH */
function attemptLogin() {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const err = $('auth-error-msg');
  const btn = $('btn-login-submit');
  if (!email || !password) { err.textContent = 'Please enter both email and password.'; err.hidden = false; return; }
  if (!auth) { err.textContent = 'Sign-in is unavailable (Firebase failed to load).'; err.hidden = false; return; }
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  err.hidden = true;
  auth.signInWithEmailAndPassword(email, password)
    .catch(e => { console.error('Authentication failed:', e); err.textContent = e.message; err.hidden = false; })
    .finally(() => { btn.disabled = false; btn.textContent = 'Sign in'; });
}
function signOut() {
  if (!auth) return;
  auth.signOut().then(() => location.reload());
}
function setUserUI(user) {
  const av = $('sidebar-user-avatar-container');
  if (!av) return;
  const photo = user && (user.photoURL || USER_AVATAR_MAP[user.uid]);
  if (photo) av.innerHTML = `<img src="${esc(photo)}" alt="" />`;
  else if (user && user.email) av.innerHTML = `<span style="font-size:12px;font-weight:600">${esc(user.email.slice(0, 2).toUpperCase())}</span>`;
  else av.innerHTML = icon('user', 16);
  $('btn-user').title = user ? (user.email || 'Account') : 'Not signed in';
}

/* ===================================================================== INIT */
document.addEventListener('DOMContentLoaded', () => {
  hydrateIcons();
  document.body.classList.toggle('panel-collapsed', state.panelCollapsed);
  applyTheme(state.theme);
  wireChrome();
  wireCanvas();
  wireInspector();
  wirePopovers();
  wireOutline();
  wireTable();
  wireTasks();
  wireCalendar();
  wireTaskDialog();
  wirePalette();
  window.addEventListener('keydown', onGlobalKeydown);
  window.addEventListener('keyup', onGlobalKeyup);
  window.addEventListener('blur', () => { activeKeys.clear(); state.spacePan = false; });
  $('btn-login-submit').addEventListener('click', attemptLogin);
  $('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
  $('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') $('login-password').focus(); });

  setAppMode('pan');
  renderBoard();
  renderClusterList();
  updateRailBadge();
  updateUndoRedoButtons();
  applyTransform();
  requestAnimationFrame(centerDiagram);
  setTimeout(hideSplashScreen, 1500);

  if (!auth) {
    setSaveStatus('offline');
    showToast('Offline mode: Firebase could not be loaded', 4000);
    hideSplashScreen();
    return;
  }
  auth.onAuthStateChanged(user => {
    setUserUI(user);
    if (user) {
      $('auth-modal').hidden = true;
      initDatabaseSync();
    } else {
      $('auth-modal').hidden = false;
      setSaveStatus('offline');
      hideSplashScreen();
      setTimeout(() => $('login-email').focus(), 100);
    }
  });
});