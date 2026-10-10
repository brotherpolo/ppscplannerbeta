/* ==========================================================================
   Adam Pollack | PPSC | Workmap - Main Application Logic (app.js)
   ========================================================================== */

const PALETTE_15 = [
  { key: 'red', name: 'Red', hex: '#ef4444', dotClass: 'bg-red-500' },
  { key: 'orange', name: 'Orange', hex: '#f97316', dotClass: 'bg-orange-500' },
  { key: 'amber', name: 'Amber', hex: '#f59e0b', dotClass: 'bg-amber-500' },
  { key: 'yellow', name: 'Yellow', hex: '#eab308', dotClass: 'bg-yellow-500' },
  { key: 'lime', name: 'Lime', hex: '#84cc16', dotClass: 'bg-lime-500' },
  { key: 'green', name: 'Green', hex: '#22c55e', dotClass: 'bg-green-500' },
  { key: 'emerald', name: 'Emerald', hex: '#10b981', dotClass: 'bg-emerald-500' },
  { key: 'teal', name: 'Teal', hex: '#14b8a6', dotClass: 'bg-teal-500' },
  { key: 'cyan', name: 'Cyan', hex: '#06b6d4', dotClass: 'bg-cyan-500' },
  { key: 'blue', name: 'Blue', hex: '#3b82f6', dotClass: 'bg-blue-500' },
  { key: 'indigo', name: 'Indigo', hex: '#6366f1', dotClass: 'bg-indigo-500' },
  { key: 'violet', name: 'Violet', hex: '#8b5cf6', dotClass: 'bg-violet-500' },
  { key: 'purple', name: 'Purple', hex: '#a855f7', dotClass: 'bg-purple-500' },
  { key: 'pink', name: 'Pink', hex: '#ec4899', dotClass: 'bg-pink-500' },
  { key: 'gray', name: 'Gray', hex: '#64748b', dotClass: 'bg-slate-500' }
];

const COLOR_HEX_MAP = PALETTE_15.reduce((acc, c) => {
  acc[c.key] = c.hex;
  return acc;
}, {});

const SVG_NS = "http://www.w3.org/2000/svg";

function isDarkTheme() {
  return state.theme === 'dark' || state.theme === 'black';
}

// id -> node lookup. Keeps the first match, same as state.nodes.find().
function getNodeMap() {
  const map = new Map();
  for (const n of state.nodes) {
    if (!map.has(n.id)) map.set(n.id, n);
  }
  return map;
}

function setToggleActive(btn, isActive) {
  if (!btn) return;
  btn.classList.toggle('bg-indigo-600', isActive);
  btn.classList.toggle('text-white', isActive);
}

function normalizeNode(n) {
  return {
    ...n,
    x: Number(n.x) || 0,
    y: Number(n.y) || 0,
    width: Number(n.width) || 0,
    height: Number(n.height) || 0,
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

function normalizeEdge(e) {
  return { ...e, directed: !!e.directed };
}

function normalizeTasks(tasks) {
  return Array.isArray(tasks) ? tasks.map(t => ({
    ...t,
    completedAt: t.completedAt || '',
    completionNotes: t.completionNotes || ''
  })) : [];
}

const SHAPES_8 = [
  { key: 'pill', name: 'Pill', icon: 'fa-capsules' },
  { key: 'rect', name: 'Rect', icon: 'fa-square' },
  { key: 'square', name: 'Square', icon: 'fa-stop' },
  { key: 'roundrect', name: 'Round', icon: 'fa-square-full' },
  { key: 'circle', name: 'Circle', icon: 'fa-circle' },
  { key: 'diamond', name: 'Diamond', icon: 'fa-gem' },
  { key: 'hexagon', name: 'Hexagon', icon: 'fa-cube' },
  { key: 'triangle', name: 'Triangle', icon: 'fa-play fa-rotate-270' }
];

const USER_AVATAR_MAP = {
  "mrnrYxtNwuV8vgru9Gr2KkJ1HzI2": "adam.jpeg",
  "b0Ji8It6eQOt0G3pvyvqrpWUF1m2": "taylor.jpg"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();
window.boardRef = db.ref("mindmap/board");

const LOCAL_STORAGE_KEY = 'mindmap_whiteboard_state_v3';
const THEME_STORAGE_KEY = 'mindmap_whiteboard_theme';

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
  { id: "e1", source: "adam", target: "se" },
  { id: "e2", source: "adam", target: "product" },
  { id: "e3", source: "adam", target: "flex" },
  { id: "e4", source: "adam", target: "rfp" },
  { id: "e5", source: "product", target: "shawn" },
  { id: "e6", source: "product", target: "albert" },
  { id: "e7", source: "product", target: "grant" },
  { id: "e8", source: "product", target: "jon" },
  { id: "e9", source: "se", target: "demo_shadows" },
  { id: "e10", source: "se", target: "se_config" },
  { id: "e11", source: "se", target: "ensogo" },
  { id: "e12", source: "se", target: "demo_prep" },
  { id: "e13", source: "se", target: "profiles" },
  { id: "e14", source: "flex", target: "templates" },
  { id: "e15", source: "flex", target: "flex_config" },
  { id: "e16", source: "flex", target: "learning" },
  { id: "e17", source: "flex", target: "demo_excl" },
  { id: "e18", source: "rfp", target: "kb" },
  { id: "e19", source: "rfp", target: "process" },
  { id: "e20", source: "rfp", target: "inventive" }
];

function loadInitialState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return {
          nodes: parsed.nodes.map(normalizeNode),
          edges: parsed.edges.map(normalizeEdge),
          tasks: normalizeTasks(parsed.tasks),
          view: parsed.view || { x: 0, y: 0, zoom: 1 },
          lastModified: parsed.lastModified || 0
        };
      }
    }
  } catch (e) {
    console.error("Local state parsing error:", e);
  }
  return {
    nodes: JSON.parse(JSON.stringify(defaultNodes)),
    edges: JSON.parse(JSON.stringify(defaultEdges)),
    tasks: [],
    view: { x: 0, y: 0, zoom: 1 },
    lastModified: 0
  };
}

const initial = loadInitialState();

const state = {
  nodes: initial.nodes,
  edges: initial.edges,
  tasks: initial.tasks,
  selectedNodeIds: new Set(),
  selectedEdgeId: null,
  mode: 'pan',
  connectSourceId: null,
  view: initial.view,
  lastModified: initial.lastModified,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  isMarquee: false,
  marqueeStart: { x: 0, y: 0 },
  isDraggingGroup: false,
  dragStartWorld: { x: 0, y: 0 },
  nodeInitialPositions: new Map(),
  selectedModalColor: 'red',
  selectedModalShape: 'pill',
  selectedModalFontSize: '',
  selectedModalBgColor: '',
  selectedModalTextColor: '',
  selectedModalBold: false,
  selectedModalItalic: false,
  selectedModalUnderline: false,
  selectedTaskNodeId: null,
  activeEditingTaskId: null,
  editingNodeId: null,
  inventoryEditingNodeId: null,
  currentPage: 'canvas',
  calendarDate: new Date(),
  modalParentNodeId: null,
  contextClickPos: null,
  clusterColorTargetRootId: null,
  theme: localStorage.getItem(THEME_STORAGE_KEY) || 'light',
  inventorySortColumn: 'label',
  inventorySortDirection: 'asc',
  taskSortColumn: 'date',
  taskSortDirection: 'asc',
  hideCompletedTasks: false
};

const historyStack = [];
const redoStack = [];
const MAX_HISTORY = 10;

function pushHistory() {
  const snapshot = JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    tasks: state.tasks
  });
  if (historyStack.length > 0 && historyStack[historyStack.length - 1] === snapshot) {
    return;
  }
  historyStack.push(snapshot);
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  }
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  if (undoBtn) undoBtn.disabled = historyStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function restoreSnapshot(snapshot) {
  const parsed = JSON.parse(snapshot);
  state.nodes = parsed.nodes;
  state.edges = parsed.edges;
  state.tasks = parsed.tasks || [];
  state.selectedNodeIds.clear();
  state.selectedEdgeId = null;

  // commitState already re-renders the active non-canvas page
  commitState(true, true);
  renderBoard();
  updateUndoRedoButtons();
}

function performUndo() {
  if (historyStack.length === 0) return;
  redoStack.push(JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    tasks: state.tasks
  }));
  restoreSnapshot(historyStack.pop());
  showToast("Undone");
}

function performRedo() {
  if (redoStack.length === 0) return;
  historyStack.push(JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    tasks: state.tasks
  }));
  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  }
  restoreSnapshot(redoStack.pop());
  showToast("Redone");
}

// Re-renders whichever list/tree page is visible, preserving its search filter.
function renderActivePage() {
  if (state.currentPage === 'hierarchy') renderHierarchyTree();
  else if (state.currentPage === 'inventory') renderInventoryList(searchQuery());
  else if (state.currentPage === 'tasks') renderTasksList(taskSearchQuery());
  else if (state.currentPage === 'calendar') renderCalendarView();
}

let isIncomingSync = false;
let toastTimeout;

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.remove('opacity-0');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('opacity-0');
  }, 2200);
}

let splashDismissed = false;
function hideSplashScreen() {
  if (splashDismissed) return;
  splashDismissed = true;
  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('fade-out');
    }, 350);
  }
}

// Label text with legacy inline formatting markers removed (plain text,
// real newlines). Used for editing; renderFormattedLabel() builds HTML from it.
function getPlainLabel(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/<span style="font-size:\s*[^;]+;">(.*?)<\/span>/gi, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<\/?u>/g, '');
}

function renderFormattedLabel(rawText) {
  if (!rawText) return '';
  return getPlainLabel(rawText)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, '<br/>');
}

function cleanClusterLabel(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/<\/?u>/g, '')
    .replace(/<span style="font-size: [^"]+;">/g, '')
    .replace(/<\/span>/g, '')
    .replace(/\n/g, ' ')
    .trim();
}

function getLocalDateTimeString(d = new Date()) {
  const pad = num => String(num).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const THEME_UI = {
  light: { icon: "fa-solid fa-sun text-amber-500 text-sm", label: "Light" },
  dark: { icon: "fa-solid fa-moon text-indigo-400 text-sm", label: "Dark" },
  black: { icon: "fa-solid fa-circle text-slate-400 text-sm", label: "Black" }
};

function applyTheme(themeName) {
  state.theme = themeName;
  localStorage.setItem(THEME_STORAGE_KEY, themeName);

  document.body.classList.remove('theme-light', 'theme-dark', 'theme-black');
  document.body.classList.add(`theme-${themeName}`);

  const themeIcon = document.getElementById('theme-toggle-icon');
  const themeText = document.getElementById('theme-toggle-text');
  const hierThemeIcon = document.getElementById('hierarchy-theme-toggle-icon');
  const hierThemeText = document.getElementById('hierarchy-theme-toggle-text');

  const themeUI = THEME_UI[themeName];
  if (themeUI) {
    if (themeIcon) themeIcon.className = themeUI.icon;
    if (themeText) themeText.textContent = themeUI.label;
    if (hierThemeIcon) hierThemeIcon.className = themeUI.icon;
    if (hierThemeText) hierThemeText.textContent = themeUI.label;
  }

  renderActivePage();
  populateParentDropdown(state.modalParentNodeId);
  populateTaskNodeDropdown(state.selectedTaskNodeId);
  renderModalColorChoices();
  renderModalBgColorChoices();
  renderModalTextColorChoices();
  renderModalShapeChoices();
  renderColorPickers();
  renderBgColorPickers();
  renderTextColorPickers();
  renderShapePickers();
}

function cycleTheme() {
  if (state.theme === 'light') {
    applyTheme('dark');
    showToast("Switched to Dark Theme");
  } else if (state.theme === 'dark') {
    applyTheme('black');
    showToast("Switched to Absolute Black");
  } else {
    applyTheme('light');
    showToast("Switched to Light Theme");
  }
}

function formatTime(timestamp) {
  const d = timestamp ? new Date(timestamp) : new Date();
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function setSaveStatus(status, timestamp = null) {
  const saveStatusDot = document.getElementById('save-status-dot');
  const saveStatusText = document.getElementById('save-status-text');
  if (!saveStatusDot || !saveStatusText) return;

  if (status === 'saving') {
    saveStatusDot.className = "w-2 h-2 rounded-full bg-amber-500 animate-pulse";
    saveStatusText.textContent = "Syncing...";
  } else if (status === 'synced') {
    saveStatusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
    const timeStr = formatTime(timestamp || state.lastModified);
    saveStatusText.textContent = `Synced ${timeStr}`;
  } else if (status === 'offline') {
    saveStatusDot.className = "w-2 h-2 rounded-full bg-slate-400";
    saveStatusText.textContent = "Offline";
  } else if (status === 'error') {
    saveStatusDot.className = "w-2 h-2 rounded-full bg-rose-500";
    saveStatusText.textContent = "Sync Error";
  }
}

function commitState(immediateCloud = true, skipHistoryPush = false) {
  if (!skipHistoryPush) {
    pushHistory();
  }

  const now = Date.now();
  state.lastModified = now;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      nodes: state.nodes,
      edges: state.edges,
      tasks: state.tasks,
      view: state.view,
      lastModified: now
    }));
  } catch (e) {
    console.error("Failed to write to localStorage:", e);
  }

  setSaveStatus('saving');

  if (window.boardRef && !isIncomingSync && auth.currentUser) {
    window.boardRef.set({
      nodes: state.nodes,
      edges: state.edges,
      tasks: state.tasks,
      lastModified: now
    }).then(() => {
      setSaveStatus('synced', now);
    }).catch(err => {
      console.error("Firebase write error:", err);
      setSaveStatus('error');
    });
  } else {
    setTimeout(() => setSaveStatus('synced', now), 100);
  }

  updateClusterCounts();
  renderActivePage();
}

function applyTransform() {
  const worldLayerEl = document.getElementById('world-layer');
  const zoomTextEl = document.getElementById('zoom-level-text');
  if (!worldLayerEl || !zoomTextEl) return;
  worldLayerEl.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.zoom})`;
  zoomTextEl.textContent = `${Math.round(state.view.zoom * 100)}%`;
}

function screenToWorld(screenX, screenY) {
  const viewportEl = document.getElementById('board-viewport');
  if (!viewportEl) return { x: 0, y: 0 };
  const rect = viewportEl.getBoundingClientRect();
  return {
    x: (screenX - rect.left - state.view.x) / state.view.zoom,
    y: (screenY - rect.top - state.view.y) / state.view.zoom
  };
}

function worldToScreen(worldX, worldY) {
  const viewportEl = document.getElementById('board-viewport');
  if (!viewportEl) return { x: 0, y: 0 };
  const rect = viewportEl.getBoundingClientRect();
  return {
    x: (worldX * state.view.zoom) + state.view.x + rect.left,
    y: (worldY * state.view.zoom) + state.view.y + rect.top
  };
}

function createCurvedPath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(30, dist * 0.12);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  const cx = (x1 + x2) / 2 + nx * curvature;
  const cy = (y1 + y2) / 2 + ny * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function openInlineEditor(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  const inlineEditorEl = document.getElementById('node-inline-editor');
  const inlineTextareaEl = document.getElementById('node-inline-textarea');
  const selectInlineFontsize = document.getElementById('select-inline-fontsize');
  const inlineUrlEl = document.getElementById('node-inline-url');
  const inlineCaptionEl = document.getElementById('node-inline-caption');
  const btnInlineBold = document.getElementById('btn-inline-bold');
  const btnInlineItalic = document.getElementById('btn-inline-italic');
  const btnInlineUnderline = document.getElementById('btn-inline-underline');

  if (!node || !inlineEditorEl || !inlineTextareaEl) return;

  state.editingNodeId = nodeId;
  // Plain text, not HTML: a textarea shows its value literally, so HTML here
  // (e.g. <br/> for line breaks) would be saved back into the label.
  inlineTextareaEl.value = getPlainLabel(node.label);
  if (selectInlineFontsize) {
    selectInlineFontsize.value = node.fontSize || '';
  }
  if (inlineUrlEl) {
    inlineUrlEl.value = node.linkUrl || '';
  }
  if (inlineCaptionEl) {
    inlineCaptionEl.value = node.linkCaption || '';
  }

  setToggleActive(btnInlineBold, !!node.isBold);
  setToggleActive(btnInlineItalic, !!node.isItalic);
  setToggleActive(btnInlineUnderline, !!node.isUnderline);

  // Position modal directly in the center of the viewport
  inlineEditorEl.style.display = 'flex';
  inlineEditorEl.style.transform = 'none';
  inlineEditorEl.style.position = 'fixed';

  const boxWidth = inlineEditorEl.offsetWidth || 310;
  const boxHeight = inlineEditorEl.offsetHeight || 450;
  
  const leftPos = Math.round((window.innerWidth - boxWidth) / 2);
  const topPos = Math.round((window.innerHeight - boxHeight) / 2);

  inlineEditorEl.style.left = `${Math.max(20, leftPos)}px`;
  inlineEditorEl.style.top = `${Math.max(20, topPos)}px`;

  const hex = COLOR_HEX_MAP[node.color] || '#3b82f6';
  inlineEditorEl.style.boxShadow = `0 18px 40px -6px rgba(0, 0, 0, 0.35), 0 0 0 2px ${hex}`;

  renderColorPickers();
  renderBgColorPickers();
  renderTextColorPickers();
  renderShapePickers();

  setTimeout(() => {
    inlineTextareaEl.focus();
    inlineTextareaEl.select();
  }, 50);
}

function closeInlineEditor(save = true) {
  const inlineEditorEl = document.getElementById('node-inline-editor');
  const inlineTextareaEl = document.getElementById('node-inline-textarea');
  const inlineUrlEl = document.getElementById('node-inline-url');
  const inlineCaptionEl = document.getElementById('node-inline-caption');
  if (!state.editingNodeId) return;

  if (save && inlineTextareaEl) {
    const node = state.nodes.find(n => n.id === state.editingNodeId);
    if (node) {
      const val = inlineTextareaEl.value.trim();
      const urlVal = inlineUrlEl ? inlineUrlEl.value.trim() : '';
      const captionVal = inlineCaptionEl ? inlineCaptionEl.value.trim() : '';
      if (val && (val !== node.label || urlVal !== node.linkUrl || captionVal !== node.linkCaption)) {
        pushHistory();
        node.label = val;
        node.linkUrl = urlVal;
        node.linkCaption = captionVal;
        commitState(true, true);
      }
    }
  }

  state.editingNodeId = null;
  if (inlineEditorEl) inlineEditorEl.style.display = 'none';
  renderBoard();
}

const POLYGON_POINTS = {
  diamond: "50,2 98,50 50,98 2,50",
  hexagon: "25,2 75,2 98,50 75,98 25,98 2,50",
  triangle: "50,2 98,98 2,98"
};

// Edge path elements from the latest renderBoard(), in render order.
const renderedEdges = [];

function renderBoard() {
  const edgesGroupEl = document.getElementById('edges-group');
  const nodesContainerEl = document.getElementById('nodes-container');
  if (!edgesGroupEl || !nodesContainerEl) return;

  const nodeMap = getNodeMap();
  const edgeFragment = document.createDocumentFragment();
  const nodeFragment = document.createDocumentFragment();

  edgesGroupEl.innerHTML = '';
  renderedEdges.length = 0;
  state.edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return;

    const pathData = createCurvedPath(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);

    const g = document.createElementNS(SVG_NS, "g");

    const hitPath = document.createElementNS(SVG_NS, "path");
    hitPath.setAttribute("d", pathData);
    hitPath.setAttribute("class", "edge-hit-area");
    hitPath.dataset.edgeId = edge.id;

    const visualPath = document.createElementNS(SVG_NS, "path");
    visualPath.setAttribute("d", pathData);
    let edgeClass = `edge-line ${state.selectedEdgeId === edge.id ? 'selected' : ''}`;
    if (edge.directed) edgeClass += ' directed';
    visualPath.setAttribute("class", edgeClass);
    visualPath.dataset.edgeId = edge.id;

    const onEdgeClick = (e) => {
      e.stopPropagation();
      deleteEdge(edge.id);
    };

    hitPath.addEventListener("click", onEdgeClick);
    visualPath.addEventListener("click", onEdgeClick);

    g.appendChild(hitPath);
    g.appendChild(visualPath);
    edgeFragment.appendChild(g);
    renderedEdges.push({ edge, hitPath, visualPath });
  });
  edgesGroupEl.appendChild(edgeFragment);

  nodesContainerEl.innerHTML = '';
  state.nodes.forEach(nodeData => {
    const nodeEl = document.createElement('div');
    nodeEl.id = `node-${nodeData.id}`;
    const shape = nodeData.shape || 'pill';
    nodeEl.className = `node node-${nodeData.color} node-shape-${shape} ${nodeData.isHub ? 'node-hub' : ''}`;

    const polygonPoints = POLYGON_POINTS[shape];
    const bgHex = nodeData.bgColor ? COLOR_HEX_MAP[nodeData.bgColor] : null;

    if (polygonPoints) {
      const polyBg = document.createElementNS(SVG_NS, "svg");
      polyBg.setAttribute("class", "node-polygon-bg");
      polyBg.setAttribute("viewBox", "0 0 100 100");
      polyBg.setAttribute("preserveAspectRatio", "none");
      const poly = document.createElementNS(SVG_NS, "polygon");
      poly.setAttribute("points", polygonPoints);
      if (bgHex) poly.style.fill = `${bgHex}FA`;
      polyBg.appendChild(poly);
      nodeEl.appendChild(polyBg);
    } else if (bgHex) {
      nodeEl.style.setProperty('--node-bg', `${bgHex}FA`);
    }

    const contentSpan = document.createElement('div');
    contentSpan.style.zIndex = '2';
    if (nodeData.fontSize) {
      contentSpan.style.fontSize = nodeData.fontSize;
    }
    if (nodeData.isBold) contentSpan.style.fontWeight = 'bold';
    if (nodeData.isItalic) contentSpan.style.fontStyle = 'italic';
    if (nodeData.isUnderline) contentSpan.style.textDecoration = 'underline';

    if (nodeData.textColor === 'black') {
      contentSpan.style.color = '#000000';
    } else if (nodeData.textColor === 'white') {
      contentSpan.style.color = '#ffffff';
    }

    if (nodeData.linkUrl) {
      const displayLabel = nodeData.linkCaption ? renderFormattedLabel(nodeData.linkCaption) : renderFormattedLabel(nodeData.label);
      contentSpan.innerHTML = `<a href="${nodeData.linkUrl}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80 flex items-center gap-1">${displayLabel} <i class="fa-solid fa-external-link-alt text-[9px]"></i></a>`;
    } else {
      contentSpan.innerHTML = renderFormattedLabel(nodeData.label);
    }
    nodeEl.appendChild(contentSpan);

    nodeEl.style.left = `${nodeData.x}px`;
    nodeEl.style.top = `${nodeData.y}px`;

    if (nodeData.width) nodeEl.style.width = `${nodeData.width}px`;
    if (nodeData.height) nodeEl.style.height = `${nodeData.height}px`;

    if (state.selectedNodeIds.has(nodeData.id)) {
      nodeEl.classList.add('selected');
    }
    if (state.connectSourceId === nodeData.id) {
      nodeEl.classList.add('connect-source');
    }

    const editBtn = document.createElement('button');
    editBtn.className = 'node-action-btn btn-edit-node';
    editBtn.title = 'Edit node properties';
    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
    ['mousedown', 'touchstart'].forEach(evt => editBtn.addEventListener(evt, (e) => e.stopPropagation()));
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openInlineEditor(nodeData.id);
    });
    nodeEl.appendChild(editBtn);

    const taskBtn = document.createElement('button');
    taskBtn.className = 'node-action-btn btn-task-node-quick';
    taskBtn.title = 'Add Task for Node';
    taskBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    ['mousedown', 'touchstart'].forEach(evt => taskBtn.addEventListener(evt, (e) => e.stopPropagation()));
    taskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskModal(nodeData.id);
    });
    nodeEl.appendChild(taskBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'node-action-btn btn-delete-node-quick';
    delBtn.title = 'Delete node';
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    ['mousedown', 'touchstart'].forEach(evt => delBtn.addEventListener(evt, (e) => e.stopPropagation()));
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNode(nodeData.id);
    });
    nodeEl.appendChild(delBtn);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'node-resize-handle';
    resizeHandle.title = 'Resize node';
    resizeHandle.innerHTML = '<i class="fa-solid fa-expand-alt"></i>';
    setupResizeEvents(resizeHandle, nodeData, nodeEl);
    nodeEl.appendChild(resizeHandle);

    setupNodeEvents(nodeEl, nodeData);
    nodeFragment.appendChild(nodeEl);
  });
  nodesContainerEl.appendChild(nodeFragment);

  updateClusterCounts();
}

// Called on every pointer move while dragging/resizing, so it reuses the
// path elements recorded by renderBoard instead of querying the DOM.
function updateEdgeCoordinates() {
  const nodeMap = getNodeMap();
  renderedEdges.forEach(({ edge, hitPath, visualPath }) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return;

    const d = createCurvedPath(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
    visualPath.setAttribute("d", d);
    hitPath.setAttribute("d", d);
  });
}

function updateSelectionVisuals() {
  state.nodes.forEach(n => {
    const el = document.getElementById(`node-${n.id}`);
    if (!el) return;
    el.classList.toggle('selected', state.selectedNodeIds.has(n.id));
    el.classList.toggle('connect-source', state.connectSourceId === n.id);
  });

  const edgesGroupEl = document.getElementById('edges-group');
  if (!edgesGroupEl) return;
  const edgeElements = edgesGroupEl.querySelectorAll('path.edge-line');
  edgeElements.forEach(line => {
    line.classList.toggle('selected', line.dataset.edgeId === state.selectedEdgeId);
  });
}

function setupResizeEvents(handleEl, nodeData, nodeEl) {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  const onPointerDown = (clientX, clientY) => {
    isResizing = true;
    startX = clientX;
    startY = clientY;
    const rect = nodeEl.getBoundingClientRect();
    startWidth = nodeData.width || rect.width;
    startHeight = nodeData.height || rect.height;
    pushHistory();
  };

  const onPointerMove = (clientX, clientY) => {
    if (!isResizing) return;
    const dx = (clientX - startX) / state.view.zoom;
    const dy = (clientY - startY) / state.view.zoom;
    const newWidth = Math.max(90, Math.round(startWidth + dx));
    const newHeight = Math.max(52, Math.round(startHeight + dy));

    nodeData.width = newWidth;
    nodeData.height = newHeight;
    nodeEl.style.width = `${newWidth}px`;
    nodeEl.style.height = `${newHeight}px`;
    updateEdgeCoordinates();
  };

  const onPointerUp = () => {
    if (!isResizing) return;
    isResizing = false;
    commitState(true, true);
  };

  handleEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onPointerDown(e.clientX, e.clientY);

    const onMouseMove = (ev) => onPointerMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      onPointerUp();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  handleEl.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const t = e.touches[0];
    onPointerDown(t.clientX, t.clientY);

    const onTouchMove = (ev) => {
      if (ev.touches.length === 1) {
        ev.preventDefault();
        onPointerMove(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };
    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      onPointerUp();
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  }, { passive: false });
}

function setupNodeEvents(nodeEl, nodeData) {
  let isMouseDown = false;
  let hasDragged = false;
  let startClientX = 0;
  let startClientY = 0;
  let lastTapTime = 0;
  const DRAG_THRESHOLD = 3;

  const handlePointerDown = (clientX, clientY, isShiftKey) => {
    if (state.editingNodeId && state.editingNodeId !== nodeData.id) {
      closeInlineEditor(true);
    }

    if (state.mode === 'connect' || state.mode === 'connect-directed') {
      handleConnectClick(nodeData.id);
      return false;
    }

    isMouseDown = true;
    hasDragged = false;
    startClientX = clientX;
    startClientY = clientY;

    if (isShiftKey) {
      state.selectedNodeIds.add(nodeData.id);
    } else if (!state.selectedNodeIds.has(nodeData.id)) {
      state.selectedNodeIds.clear();
      state.selectedNodeIds.add(nodeData.id);
    }
    state.selectedEdgeId = null;
    updateSelectionVisuals();

    const worldMouse = screenToWorld(startClientX, startClientY);
    state.dragStartWorld = { x: worldMouse.x, y: worldMouse.y };

    state.nodeInitialPositions.clear();
    const nodeMap = getNodeMap();
    state.selectedNodeIds.forEach(id => {
      const n = nodeMap.get(id);
      if (n) state.nodeInitialPositions.set(id, { x: Number(n.x), y: Number(n.y) });
    });
    return true;
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isMouseDown) return;

    const dist = Math.hypot(clientX - startClientX, clientY - startClientY);
    if (!hasDragged && dist > DRAG_THRESHOLD) {
      hasDragged = true;
      state.isDraggingGroup = true;
      pushHistory();
    }

    if (hasDragged && state.isDraggingGroup) {
      const currentWorld = screenToWorld(clientX, clientY);
      const dx = currentWorld.x - state.dragStartWorld.x;
      const dy = currentWorld.y - state.dragStartWorld.y;
      const nodeMap = getNodeMap();

      state.selectedNodeIds.forEach(id => {
        const initialPos = state.nodeInitialPositions.get(id);
        const n = nodeMap.get(id);
        if (initialPos && n) {
          n.x = Math.round(initialPos.x + dx);
          n.y = Math.round(initialPos.y + dy);
          const el = document.getElementById(`node-${n.id}`);
          if (el) {
            el.style.left = `${n.x}px`;
            el.style.top = `${n.y}px`;
          }
        }
      });

      updateEdgeCoordinates();
    }
  };

  const handlePointerUp = () => {
    if (!isMouseDown) return;
    isMouseDown = false;

    if (hasDragged) {
      state.isDraggingGroup = false;
      commitState(true, true);
    }
  };

  nodeEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.node-action-btn') || e.target.closest('.node-resize-handle') || e.target.closest('a')) return;

    e.stopPropagation();
    const continueDrag = handlePointerDown(e.clientX, e.clientY, e.shiftKey || e.ctrlKey || e.metaKey);
    if (!continueDrag) return;

    const onMouseMove = (ev) => handlePointerMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      handlePointerUp();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  nodeEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    e.preventDefault();
    openInlineEditor(nodeData.id);
  });

  nodeEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    state.selectedNodeIds.clear();
    state.selectedNodeIds.add(nodeData.id);
    state.selectedEdgeId = null;
    updateSelectionVisuals();

    state.contextClickPos = screenToWorld(e.clientX, e.clientY);
    openAddModal(nodeData.id);
  });

  nodeEl.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('.node-action-btn') || e.target.closest('.node-resize-handle') || e.target.closest('a')) return;

    e.stopPropagation();
    const touch = e.touches[0];

    const currentTime = new Date().getTime();
    const tapGap = currentTime - lastTapTime;
    if (tapGap < 300 && tapGap > 0) {
      e.preventDefault();
      openInlineEditor(nodeData.id);
      lastTapTime = 0;
      return;
    }
    lastTapTime = currentTime;

    const continueDrag = handlePointerDown(touch.clientX, touch.clientY, false);
    if (!continueDrag) return;

    const onTouchMove = (ev) => {
      if (ev.touches.length === 1) {
        ev.preventDefault();
        handlePointerMove(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      handlePointerUp();
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  }, { passive: false });
}

function handleConnectClick(nodeId) {
  if (!state.connectSourceId) {
    state.connectSourceId = nodeId;
    updateSelectionVisuals();
    showToast(state.mode === 'connect-directed' ? "Select target node for dotted flow." : "Select second node to complete link.");
  } else if (state.connectSourceId === nodeId) {
    state.connectSourceId = null;
    updateSelectionVisuals();
  } else {
    const isDirected = (state.mode === 'connect-directed');
    const exists = state.edges.some(e => 
      isDirected 
        ? (e.source === state.connectSourceId && e.target === nodeId && e.directed)
        : ((e.source === state.connectSourceId && e.target === nodeId) || (e.source === nodeId && e.target === state.connectSourceId))
    );

    if (!exists) {
      pushHistory();
      state.edges.push({
        id: "edge_" + Date.now(),
        source: state.connectSourceId,
        target: nodeId,
        directed: isDirected
      });
      commitState(true, true);
      showToast(isDirected ? "Green dotted flow created!" : "Relationship connected!");
    } else {
      showToast("Relationship already exists.");
    }

    state.connectSourceId = null;
    renderBoard();
  }
}

function deleteEdge(edgeId) {
  pushHistory();
  state.edges = state.edges.filter(e => e.id !== edgeId);
  if (state.selectedEdgeId === edgeId) state.selectedEdgeId = null;
  commitState(true, true);
  renderBoard();
  showToast("Relationship removed.");
}

function deleteNode(nodeId) {
  pushHistory();
  state.nodes = state.nodes.filter(n => n.id !== nodeId);
  state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  state.tasks = state.tasks.filter(t => t.nodeId !== nodeId);
  state.selectedNodeIds.delete(nodeId);
  if (state.editingNodeId === nodeId) {
    closeInlineEditor(false);
  }
  commitState(true, true);
  renderBoard();
  showToast("Node deleted.");
}

function deleteSelected() {
  let changed = false;
  if (state.selectedEdgeId || state.selectedNodeIds.size > 0) {
    pushHistory();
  }
  if (state.selectedEdgeId) {
    state.edges = state.edges.filter(e => e.id !== state.selectedEdgeId);
    state.selectedEdgeId = null;
    changed = true;
  }
  if (state.selectedNodeIds.size > 0) {
    const toDelete = new Set(state.selectedNodeIds);
    state.nodes = state.nodes.filter(n => !toDelete.has(n.id));
    state.edges = state.edges.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target));
    state.tasks = state.tasks.filter(t => !toDelete.has(t.nodeId));
    state.selectedNodeIds.clear();
    changed = true;
  }
  if (changed) {
    commitState(true, true);
    renderBoard();
    showToast("Selected items deleted.");
  } else {
    showToast("Nothing selected to delete.");
  }
}

function selectEntireDiagram() {
  state.selectedNodeIds.clear();
  state.nodes.forEach(n => state.selectedNodeIds.add(n.id));
  state.selectedEdgeId = null;
  updateSelectionVisuals();
  showToast(`Selected all ${state.nodes.length} nodes.`);
}

function centerDiagram() {
  const viewportEl = document.getElementById('board-viewport');
  if (!viewportEl || state.nodes.length === 0) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  state.nodes.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const rect = viewportEl.getBoundingClientRect();
  const w = rect.width || window.innerWidth - 68;
  const h = rect.height || window.innerHeight;
  state.view.x = (w / 2) - centerX * state.view.zoom;
  state.view.y = (h / 2) - centerY * state.view.zoom;
  applyTransform();
}

function getDetectedClusters() {
  const clusterMap = {};

  state.nodes.forEach(node => {
    const colorKey = node.color || 'gray';
    if (!clusterMap[colorKey]) {
      clusterMap[colorKey] = {
        id: colorKey,
        color: colorKey,
        nodes: []
      };
    }
    clusterMap[colorKey].nodes.push(node);
  });

  const nodeMap = getNodeMap();
  const undirectedTargets = new Map(); // source id -> [target ids]
  state.edges.forEach(e => {
    if (e.directed) return;
    if (!undirectedTargets.has(e.source)) undirectedTargets.set(e.source, []);
    undirectedTargets.get(e.source).push(e.target);
  });

  return Object.values(clusterMap)
    .filter(cluster => cluster.nodes.length > 0)
    .map(cluster => {
      const colorKey = cluster.color;
      const nodeIdsInCluster = new Set(cluster.nodes.map(n => n.id));
      let clusterName = null;

      if (cluster.nodes.length === 1) {
        clusterName = cleanClusterLabel(cluster.nodes[0].linkCaption || cluster.nodes[0].label);
      } else {
        const internalHub = cluster.nodes.find(n => n.isHub || (undirectedTargets.get(n.id) || []).some(t => nodeIdsInCluster.has(t)));
        if (internalHub) {
          clusterName = cleanClusterLabel(internalHub.linkCaption || internalHub.label);
        }

        if (!clusterName) {
          for (const edge of state.edges) {
            if (!edge.directed && nodeIdsInCluster.has(edge.target) && !nodeIdsInCluster.has(edge.source)) {
              const parentNode = nodeMap.get(edge.source);
              if (parentNode) {
                clusterName = cleanClusterLabel(parentNode.linkCaption || parentNode.label);
                break;
              }
            }
          }
        }
      }

      if (!clusterName) {
        clusterName = cleanClusterLabel(cluster.nodes[0].linkCaption || cluster.nodes[0].label) || colorKey;
      }

      return {
        id: colorKey,
        name: clusterName.toUpperCase(),
        color: colorKey,
        count: cluster.nodes.length,
        nodes: cluster.nodes
      };
    });
}

function selectDynamicCluster(colorKey) {
  const clusterNodes = state.nodes.filter(n => (n.color || 'gray') === colorKey);
  if (clusterNodes.length === 0) return;

  switchPage('canvas');

  state.selectedNodeIds.clear();
  clusterNodes.forEach(n => state.selectedNodeIds.add(n.id));
  state.selectedEdgeId = null;
  updateSelectionVisuals();

  setTimeout(() => {
    const viewportEl = document.getElementById('board-viewport');
    const sidebar = document.getElementById('sidebar');
    const rect = viewportEl ? viewportEl.getBoundingClientRect() : null;
    const isCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;
    const fallbackWidth = window.innerWidth - (isCollapsed ? 68 : 256);

    const width = (rect && rect.width > 0) ? rect.width : fallbackWidth;
    const height = (rect && rect.height > 0) ? rect.height : window.innerHeight;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    clusterNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const spanX = Math.max(160, maxX - minX + 220);
    const spanY = Math.max(160, maxY - minY + 220);
    const targetZoom = Math.min(1.4, Math.max(0.65, Math.min(width / spanX, height / spanY)));

    state.view.zoom = targetZoom;
    state.view.x = (width / 2) - (centerX * targetZoom);
    state.view.y = (height / 2) - (centerY * targetZoom);
    applyTransform();

    showToast(`Selected ${clusterNodes.length} nodes in ${colorKey} cluster.`);
  }, 50);
}

function focusNodeOnCanvas(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return;

  switchPage('canvas');

  state.selectedNodeIds.clear();
  state.selectedNodeIds.add(nodeId);
  updateSelectionVisuals();

  setTimeout(() => {
    const viewportEl = document.getElementById('board-viewport');
    const sidebar = document.getElementById('sidebar');
    const rect = viewportEl ? viewportEl.getBoundingClientRect() : null;
    const isCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;
    const fallbackWidth = window.innerWidth - (isCollapsed ? 68 : 256);

    const width = (rect && rect.width > 0) ? rect.width : fallbackWidth;
    const height = (rect && rect.height > 0) ? rect.height : window.innerHeight;

    state.view.zoom = 1.25;
    state.view.x = (width / 2) - (node.x * state.view.zoom);
    state.view.y = (height / 2) - (node.y * state.view.zoom);
    applyTransform();

    showToast(`Focused on ${cleanClusterLabel(node.linkCaption || node.label)}`);
  }, 50);
}

function resetView() {
  state.view.zoom = 1;
  centerDiagram();
  showToast("View centered");
}

function resetToDefaultDiagram() {
  pushHistory();
  state.nodes = JSON.parse(JSON.stringify(defaultNodes));
  state.edges = JSON.parse(JSON.stringify(defaultEdges));
  state.tasks = [];
  state.selectedNodeIds.clear();
  state.selectedEdgeId = null;
  state.connectSourceId = null;
  closeInlineEditor(false);
  commitState(true, true);
  renderBoard();
  resetView();
}

function setAppMode(mode) {
  state.mode = mode;
  state.connectSourceId = null;

  const btnSelectMode = document.getElementById('btn-select-mode');
  const btnConnectMode = document.getElementById('btn-connect-mode');
  const btnConnectDirectedMode = document.getElementById('btn-connect-directed-mode');
  const btnPanMode = document.getElementById('btn-pan-mode');
  const viewportEl = document.getElementById('board-viewport');

  [btnSelectMode, btnConnectMode, btnConnectDirectedMode, btnPanMode].forEach(btn => {
    if (!btn) return;
    btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
  });

  if (mode === 'select' && btnSelectMode) {
    btnSelectMode.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    if (viewportEl) viewportEl.style.cursor = 'default';
  } else if (mode === 'connect' && btnConnectMode) {
    btnConnectMode.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    if (viewportEl) viewportEl.style.cursor = 'crosshair';
    showToast("Connect Mode: Tap first node, then second node to connect.");
  } else if (mode === 'connect-directed' && btnConnectDirectedMode) {
    btnConnectDirectedMode.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    if (viewportEl) viewportEl.style.cursor = 'crosshair';
    showToast("Dotted Flow Mode: Tap source node, then target node for green dotted line.");
  } else if (mode === 'pan' && btnPanMode) {
    btnPanMode.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
    if (viewportEl) viewportEl.style.cursor = 'grab';
  }
  updateSelectionVisuals();
}

function exportToPNG() {
  showToast("Generating high-resolution PNG snapshot...", 2500);
  const viewportEl = document.getElementById('board-viewport');
  const svgLayerEl = document.getElementById('svg-layer');
  if (!viewportEl || state.nodes.length === 0) return;

  const prevView = { x: state.view.x, y: state.view.y, zoom: state.view.zoom };
  const prevSelected = new Set(state.selectedNodeIds);

  state.selectedNodeIds.clear();
  state.selectedEdgeId = null;
  updateSelectionVisuals();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  state.nodes.forEach(n => {
    const pad = 120;
    if (n.x - pad < minX) minX = n.x - pad;
    if (n.x + pad > maxX) maxX = n.x + pad;
    if (n.y - pad < minY) minY = n.y - pad;
    if (n.y + pad > maxY) maxY = n.y + pad;
  });

  const contentWidth = Math.ceil(maxX - minX);
  const contentHeight = Math.ceil(maxY - minY);

  state.view.zoom = 1;
  state.view.x = -minX;
  state.view.y = -minY;
  applyTransform();
  renderBoard();

  if (svgLayerEl) svgLayerEl.style.pointerEvents = 'auto';

  const originalWidth = viewportEl.style.width;
  const originalHeight = viewportEl.style.height;
  viewportEl.style.width = `${contentWidth}px`;
  viewportEl.style.height = `${contentHeight}px`;

  setTimeout(() => {
    html2canvas(viewportEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: contentWidth,
      height: contentHeight,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
      backgroundColor: getComputedStyle(viewportEl).backgroundColor || '#fbfbfa'
    }).then(canvas => {
      viewportEl.style.width = originalWidth;
      viewportEl.style.height = originalHeight;
      if (svgLayerEl) svgLayerEl.style.pointerEvents = 'none';

      state.view.x = prevView.x;
      state.view.y = prevView.y;
      state.view.zoom = prevView.zoom;
      state.selectedNodeIds = prevSelected;
      applyTransform();
      renderBoard();

      const link = document.createElement('a');
      link.download = 'Adam_Pollack_PPSC_Workmap.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast("PNG exported successfully!");
    }).catch(err => {
      console.error("PNG export error:", err);
      viewportEl.style.width = originalWidth;
      viewportEl.style.height = originalHeight;
      if (svgLayerEl) svgLayerEl.style.pointerEvents = 'none';
      state.view.x = prevView.x;
      state.view.y = prevView.y;
      state.view.zoom = prevView.zoom;
      state.selectedNodeIds = prevSelected;
      applyTransform();
      renderBoard();
      showToast("Failed to export PNG.");
    });
  }, 300);
}

const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const scriptLoadPromises = {};

function loadScriptOnce(src) {
  if (!scriptLoadPromises[src]) {
    scriptLoadPromises[src] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        delete scriptLoadPromises[src]; // allow a retry on the next click
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromises[src];
}

function exportHierarchyToPDF() {
  showToast("Generating Hierarchy PDF...", 3000);
  const container = document.getElementById('page-hierarchy');
  if (!container) return;

  const themeToggleBtn = container.querySelector('.fixed.top-4.right-4');
  if (themeToggleBtn) themeToggleBtn.style.display = 'none';

  // jsPDF is only needed here, so it's fetched on first use instead of on page load.
  loadScriptOnce(JSPDF_URL).then(() => html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: getComputedStyle(container).backgroundColor || '#ffffff'
  })).then(canvas => {
    if (themeToggleBtn) themeToggleBtn.style.display = 'block';

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST'); // lossless, compressed
    pdf.save('Adam_Pollack_PPSC_Hierarchy.pdf');
    showToast("Hierarchy PDF exported successfully!");
  }).catch(err => {
    console.error("Hierarchy PDF export error:", err);
    if (themeToggleBtn) themeToggleBtn.style.display = 'block';
    showToast("Failed to export Hierarchy PDF.");
  });
}

function createIsolatedGroup() {
  pushHistory();
  switchPage('canvas');

  const chosenColor = PALETTE_15[Math.floor(Math.random() * PALETTE_15.length)].key;

  let originX = 500;
  let originY = 500;

  if (state.nodes.length > 0) {
    let maxX = -Infinity;
    let avgY = 0;
    state.nodes.forEach(n => {
      if (n.x > maxX) maxX = n.x;
      avgY += n.y;
    });
    avgY = avgY / state.nodes.length;
    originX = Math.round(maxX + 420);
    originY = Math.round(avgY);
  }

  const timestamp = Date.now();
  const baseId = `node_${timestamp}_base`;
  const baseNode = {
    id: baseId,
    label: "New\nHub",
    x: originX,
    y: originY,
    color: "gray",
    shape: "pill",
    fontSize: '',
    bgColor: '',
    textColor: '',
    linkUrl: '',
    linkCaption: '',
    isBold: false,
    isItalic: false,
    isUnderline: false
  };

  const newNodes = [baseNode];
  const newEdges = [];

  const offsets = [
    { label: "Branch 1", dx: -160, dy: -130 },
    { label: "Branch 2", dx: 160, dy: -130 },
    { label: "Branch 3", dx: -160, dy: 130 },
    { label: "Branch 4", dx: 160, dy: 130 }
  ];

  offsets.forEach((offset, idx) => {
    const childId = `node_${timestamp}_c${idx + 1}`;
    newNodes.push({
      id: childId,
      label: offset.label,
      x: originX + offset.dx,
      y: originY + offset.dy,
      color: chosenColor,
      shape: "pill",
      fontSize: '',
      bgColor: '',
      textColor: '',
      linkUrl: '',
      linkCaption: '',
      isBold: false,
      isItalic: false,
      isUnderline: false
    });
    newEdges.push({
      id: `edge_${timestamp}_e${idx + 1}`,
      source: baseId,
      target: childId
    });
  });

  state.nodes.push(...newNodes);
  state.edges.push(...newEdges);

  state.selectedNodeIds.clear();
  newNodes.forEach(n => state.selectedNodeIds.add(n.id));
  state.selectedEdgeId = null;

  commitState(true, true);
  renderBoard();

  setTimeout(() => {
    const viewportEl = document.getElementById('board-viewport');
    const sidebar = document.getElementById('sidebar');
    const rect = viewportEl ? viewportEl.getBoundingClientRect() : null;
    const isCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;
    const width = (rect && rect.width > 0) ? rect.width : (window.innerWidth - (isCollapsed ? 68 : 256));
    const height = (rect && rect.height > 0) ? rect.height : window.innerHeight;

    state.view.zoom = 1;
    state.view.x = (width / 2) - (originX * state.view.zoom);
    state.view.y = (height / 2) - (originY * state.view.zoom);
    applyTransform();
    showToast("Created new isolated cluster!");
  }, 50);
}

function getPillMarkup(node, isDark, compact = false) {
  if (!node) return '<span class="opacity-40 italic">Unassigned</span>';
  const hex = COLOR_HEX_MAP[node.color] || '#64748b';
  const hubMarkup = node.isHub ? `<span class="text-[8px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/30 px-1 py-0.2 rounded shrink-0">Hub</span>` : '';
  
  const bgHex = node.bgColor && COLOR_HEX_MAP[node.bgColor] ? COLOR_HEX_MAP[node.bgColor] : hex;
  const bg = `${bgHex}FA`;
  const border = isDark ? `${hex}60` : `${hex}45`;
  const color = node.textColor === 'black' ? '#000000' : (node.textColor === 'white' ? '#ffffff' : (isDark ? '#ffffff' : hex));
  
  const fontStyle = compact ? 'font-size: 10px; line-height: 1.25;' : (node.fontSize ? `font-size: ${node.fontSize};` : '');
  const weightStyle = node.isBold ? `font-weight: bold;` : '';
  const italicStyle = node.isItalic ? `font-style: italic;` : '';
  const underlineStyle = node.isUnderline ? `text-decoration: underline;` : '';

  const sizeClasses = compact 
    ? "px-2.5 py-1 text-[10px] max-w-[220px]" 
    : "px-3 py-1 text-xs max-w-[260px]";

  const roundedClasses = compact ? "rounded-xl" : "rounded-full";

  return `
    <div style="background-color: ${bg}; border-color: ${border}; color: ${color}; ${fontStyle} ${weightStyle} ${italicStyle} ${underlineStyle}" class="${sizeClasses} ${roundedClasses} font-semibold border shadow-xs inline-flex items-center justify-center text-center gap-1 mx-auto w-max">
      <span class="whitespace-normal break-words text-center">${renderFormattedLabel(node.linkCaption || node.label).replace(/<br\s*\/?>/gi, ' ')}</span>
    </div>
    ${hubMarkup}
  `;
}

function getHierarchyPillMarkup(node, isDark) {
  const hex = COLOR_HEX_MAP[node.color] || '#64748b';
  const hubMarkup = node.isHub ? `<span class="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.2 rounded">Hub</span>` : '';
  
  const bgHex = node.bgColor && COLOR_HEX_MAP[node.bgColor] ? COLOR_HEX_MAP[node.bgColor] : hex;
  const bg = `${bgHex}FA`;
  const border = isDark ? `${hex}60` : `${hex}45`;
  const color = node.textColor === 'black' ? '#000000' : (node.textColor === 'white' ? '#ffffff' : (isDark ? '#ffffff' : hex));
  const fontStyle = node.fontSize ? `font-size: ${node.fontSize};` : '';
  const weightStyle = node.isBold ? `font-weight: bold;` : '';
  const italicStyle = node.isItalic ? `font-style: italic;` : '';
  const underlineStyle = node.isUnderline ? `text-decoration: underline;` : '';

  const cleanText = cleanClusterLabel(node.linkCaption || node.label);

  return `
    <div style="background-color: ${bg}; border-color: ${border}; color: ${color}; ${fontStyle} ${weightStyle} ${italicStyle} ${underlineStyle}" class="px-3 py-1 text-xs font-semibold rounded-full border shadow-xs inline-flex items-center justify-center text-center gap-1.5 mx-auto w-max max-w-[200px]">
      <span class="truncate">${cleanText}</span>
    </div>
    ${hubMarkup}
  `;
}

function populateParentDropdown(selectedId = null, filterQuery = "") {
  const dropdownItemsContainer = document.getElementById('parent-dropdown-items');
  const dropdownSelected = document.getElementById('parent-dropdown-selected');
  if (!dropdownItemsContainer || !dropdownSelected) return;

  const isDark = isDarkTheme();

  if (selectedId) {
    const found = state.nodes.find(n => n.id === selectedId);
    if (found) {
      dropdownSelected.innerHTML = getPillMarkup(found, isDark);
    } else {
      dropdownSelected.innerHTML = `<span class="opacity-60 font-medium px-2 py-0.5">None (Root Node)</span>`;
    }
  } else {
    dropdownSelected.innerHTML = `<span class="opacity-60 font-medium px-2 py-0.5">None (Root Node)</span>`;
  }

  dropdownItemsContainer.innerHTML = '';
  const query = filterQuery.toLowerCase().trim();

  if (!query || "none root node".includes(query)) {
    const noneOption = document.createElement('div');
    noneOption.className = `modal-dropdown-item p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${!selectedId ? 'font-semibold' : ''}`;
    noneOption.innerHTML = `<span class="modal-label px-1 font-medium">None (Root Node)</span>`;
    noneOption.addEventListener('click', (e) => {
      e.stopPropagation();
      selectParentOption(null);
    });
    dropdownItemsContainer.appendChild(noneOption);
  }

  const matchingNodes = state.nodes.filter(node => {
    if (!query) return true;
    const normalizedLabel = cleanClusterLabel(node.linkCaption || node.label).toLowerCase();
    return normalizedLabel.includes(query);
  });

  matchingNodes.forEach(node => {
    const opt = document.createElement('div');
    opt.className = `modal-dropdown-item p-1.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${selectedId === node.id ? 'font-semibold' : ''}`;
    opt.innerHTML = `
      <div class="flex items-center justify-center gap-1.5 w-full">
        ${getPillMarkup(node, isDark)}
      </div>
      ${selectedId === node.id ? '<i class="fa-solid fa-check text-indigo-500 text-xs mr-1 shrink-0"></i>' : ''}
    `;
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectParentOption(node.id);
    });
    dropdownItemsContainer.appendChild(opt);
  });

  if (matchingNodes.length === 0 && query && !"none root node".includes(query)) {
    const noMatch = document.createElement('div');
    noMatch.className = "p-3 text-center text-xs opacity-50 italic";
    noMatch.textContent = "No matching items found";
    dropdownItemsContainer.appendChild(noMatch);
  }
}

function selectParentOption(nodeId) {
  state.modalParentNodeId = nodeId;
  const dropdownMenu = document.getElementById('parent-dropdown-menu');

  if (nodeId) {
    const parentNode = state.nodes.find(n => n.id === nodeId);
    if (parentNode) {
      state.selectedModalColor = parentNode.color;
      state.selectedModalShape = parentNode.shape || 'pill';
      state.selectedModalFontSize = parentNode.fontSize || '';
      state.selectedModalBgColor = parentNode.bgColor || '';
      state.selectedModalTextColor = parentNode.textColor || '';
      state.selectedModalBold = !!parentNode.isBold;
      state.selectedModalItalic = !!parentNode.isItalic;
      state.selectedModalUnderline = !!parentNode.isUnderline;
      renderModalColorChoices();
      renderModalBgColorChoices();
      renderModalTextColorChoices();
      renderModalShapeChoices();
      const selectModalFontsize = document.getElementById('select-modal-fontsize');
      if (selectModalFontsize) selectModalFontsize.value = state.selectedModalFontSize;

      const btnModalBold = document.getElementById('btn-modal-bold');
      const btnModalItalic = document.getElementById('btn-modal-italic');
      const btnModalUnderline = document.getElementById('btn-modal-underline');
      setToggleActive(btnModalBold, state.selectedModalBold);
      setToggleActive(btnModalItalic, state.selectedModalItalic);
      setToggleActive(btnModalUnderline, state.selectedModalUnderline);
    }
  }

  populateParentDropdown(nodeId);
  if (dropdownMenu) dropdownMenu.classList.add('hidden');
}

function populateTaskNodeDropdown(selectedId = null, filterQuery = "") {
  const dropdownItemsContainer = document.getElementById('task-node-dropdown-items');
  const dropdownSelected = document.getElementById('task-node-dropdown-selected');
  if (!dropdownItemsContainer || !dropdownSelected) return;

  const isDark = isDarkTheme();

  if (selectedId) {
    const found = state.nodes.find(n => n.id === selectedId);
    if (found) {
      dropdownSelected.innerHTML = getPillMarkup(found, isDark);
    } else {
      dropdownSelected.innerHTML = `<span class="opacity-60 font-medium px-2 py-0.5">Select a Node...</span>`;
    }
  } else {
    dropdownSelected.innerHTML = `<span class="opacity-60 font-medium px-2 py-0.5">Select a Node...</span>`;
  }

  dropdownItemsContainer.innerHTML = '';
  const query = filterQuery.toLowerCase().trim();

  const matchingNodes = state.nodes.filter(node => {
    if (!query) return true;
    const normalizedLabel = cleanClusterLabel(node.linkCaption || node.label).toLowerCase();
    return normalizedLabel.includes(query);
  });

  matchingNodes.forEach(node => {
    const opt = document.createElement('div');
    opt.className = `modal-dropdown-item p-1.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${selectedId === node.id ? 'font-semibold' : ''}`;
    opt.innerHTML = `
      <div class="flex items-center justify-center gap-1.5 w-full">
        ${getPillMarkup(node, isDark)}
      </div>
      ${selectedId === node.id ? '<i class="fa-solid fa-check text-indigo-500 text-xs mr-1 shrink-0"></i>' : ''}
    `;
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectTaskNodeOption(node.id);
    });
    dropdownItemsContainer.appendChild(opt);
  });

  if (matchingNodes.length === 0) {
    const noMatch = document.createElement('div');
    noMatch.className = "p-3 text-center text-xs opacity-50 italic";
    noMatch.textContent = "No matching nodes found";
    dropdownItemsContainer.appendChild(noMatch);
  }
}

function selectTaskNodeOption(nodeId) {
  state.selectedTaskNodeId = nodeId;
  const dropdownMenu = document.getElementById('task-node-dropdown-menu');
  populateTaskNodeDropdown(nodeId);
  if (dropdownMenu) dropdownMenu.classList.add('hidden');
}

function openTaskModal(preselectedNodeId = null) {
  const modal = document.getElementById('task-modal');
  const modalBox = modal ? modal.querySelector('.modal-box') : null;
  const descInput = document.getElementById('task-desc-input');
  const dateInput = document.getElementById('task-date-input');
  const searchInput = document.getElementById('task-node-search-input');
  const dropdownMenu = document.getElementById('task-node-dropdown-menu');
  if (!modal || !descInput || !dateInput) return;

  if (modalBox) {
    modalBox.style.position = '';
    modalBox.style.left = '';
    modalBox.style.top = '';
    modalBox.style.transform = '';
  }

  descInput.value = '';
  dateInput.value = new Date().toISOString().split('T')[0];
  if (searchInput) searchInput.value = '';
  if (dropdownMenu) dropdownMenu.classList.add('hidden');

  const defaultNode = preselectedNodeId || (state.nodes.length > 0 ? state.nodes[0].id : null);
  state.selectedTaskNodeId = defaultNode;
  populateTaskNodeDropdown(defaultNode, '');

  modal.classList.remove('hidden');
  descInput.focus();
}

function openTaskCompletionModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.activeEditingTaskId = taskId;

  const modal = document.getElementById('task-completion-modal');
  const modalBox = modal ? modal.querySelector('.modal-box') : null;
  const nodePillContainer = document.getElementById('completion-modal-node-pill');
  const descEl = document.getElementById('completion-modal-desc');
  const checkbox = document.getElementById('completion-status-checkbox');
  const timeInput = document.getElementById('completion-time-input');
  const notesInput = document.getElementById('completion-notes-input');

  if (!modal || !descEl || !checkbox || !timeInput || !notesInput) return;

  if (modalBox) {
    modalBox.style.position = '';
    modalBox.style.left = '';
    modalBox.style.top = '';
    modalBox.style.transform = '';
  }

  const linkedNode = state.nodes.find(n => n.id === task.nodeId);
  const isDark = isDarkTheme();

  if (nodePillContainer) {
    nodePillContainer.innerHTML = getPillMarkup(linkedNode, isDark);
  }

  descEl.textContent = task.description || '';
  checkbox.checked = !!task.completed;
  notesInput.value = task.completionNotes || '';

  if (task.completedAt) {
    timeInput.value = task.completedAt;
  } else {
    timeInput.value = getLocalDateTimeString();
  }

  checkbox.onclick = () => {
    if (checkbox.checked && !timeInput.value) {
      timeInput.value = getLocalDateTimeString();
    }
  };

  modal.classList.remove('hidden');
}

function renderModalColorChoices() {
  const container = document.getElementById('color-options');
  if (!container) return;
  container.innerHTML = '';

  const isDark = isDarkTheme();

  PALETTE_15.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.color = c.key;
    btn.className = `color-choice h-8 rounded-xl border-2 flex items-center justify-center font-bold text-[11px] transition-all capitalize ${state.selectedModalColor === c.key ? 'ring-2 ring-indigo-500 scale-105' : 'hover:scale-105'}`;

    const bg = isDark ? `${c.hex}25` : `${c.hex}18`;
    const border = isDark ? `${c.hex}95` : c.hex;
    const color = isDark ? '#ffffff' : c.hex;

    btn.style.backgroundColor = bg;
    btn.style.borderColor = border;
    btn.style.color = color;
    btn.textContent = c.name;

    btn.addEventListener('click', () => {
      state.selectedModalColor = c.key;
      renderModalColorChoices();
    });

    container.appendChild(btn);
  });
}

function renderModalBgColorChoices() {
  const container = document.getElementById('bg-color-options');
  if (!container) return;
  container.innerHTML = '';

  const isDark = isDarkTheme();

  const noneBtn = document.createElement('button');
  noneBtn.type = 'button';
  noneBtn.className = `color-choice h-8 rounded-xl border-2 flex items-center justify-center font-bold text-[10px] transition-all ${!state.selectedModalBgColor ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/10 border-indigo-500 text-indigo-500' : (isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-400' : 'border-slate-200 bg-white text-slate-500')}`;
  noneBtn.textContent = 'Default';
  noneBtn.addEventListener('click', () => {
    state.selectedModalBgColor = '';
    renderModalBgColorChoices();
  });
  container.appendChild(noneBtn);

  PALETTE_15.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.bgcolor = c.key;
    btn.className = `color-choice h-8 rounded-xl border-2 flex items-center justify-center font-bold text-[11px] transition-all capitalize ${state.selectedModalBgColor === c.key ? 'ring-2 ring-indigo-500 scale-105' : 'hover:scale-105'}`;

    const bg = isDark ? `${c.hex}35` : `${c.hex}22`;
    const border = isDark ? `${c.hex}80` : `${c.hex}50`;
    const color = isDark ? '#ffffff' : c.hex;

    btn.style.backgroundColor = bg;
    btn.style.borderColor = border;
    btn.style.color = color;
    btn.textContent = c.name;

    btn.addEventListener('click', () => {
      state.selectedModalBgColor = c.key;
      renderModalBgColorChoices();
    });

    container.appendChild(btn);
  });
}

function renderModalTextColorChoices() {
  const container = document.getElementById('modal-text-color-options');
  if (!container) return;
  container.innerHTML = '';

  const options = [
    { key: '', name: 'Default' },
    { key: 'black', name: 'Black' },
    { key: 'white', name: 'White' }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = state.selectedModalTextColor === opt.key;
    btn.className = `h-7 px-3 rounded-lg border text-xs font-semibold transition-all ${
      isSelected ? 'ring-2 ring-indigo-500 bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'border-slate-300 text-slate-700'
    }`;
    btn.textContent = opt.name;
    btn.addEventListener('click', () => {
      state.selectedModalTextColor = opt.key;
      renderModalTextColorChoices();
    });
    container.appendChild(btn);
  });
}

function renderModalShapeChoices() {
  const container = document.getElementById('shape-options');
  if (!container) return;
  container.innerHTML = '';

  const isDark = isDarkTheme();

  SHAPES_8.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.shape = s.key;
    btn.className = `shape-choice h-9 rounded-xl border-2 flex flex-col items-center justify-center font-semibold text-[10px] transition-all gap-0.5 ${state.selectedModalShape === s.key ? 'ring-2 ring-indigo-500 scale-105 bg-indigo-500/10 border-indigo-500 text-indigo-600' : (isDark ? 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300')}`;

    btn.innerHTML = `
      <i class="fa-solid ${s.icon} text-xs"></i>
      <span class="truncate px-1">${s.name}</span>
    `;

    btn.addEventListener('click', () => {
      state.selectedModalShape = s.key;
      renderModalShapeChoices();
    });

    container.appendChild(btn);
  });
}

function renderColorPickers() {
  const inlineContainer = document.getElementById('inline-color-pickers');
  if (inlineContainer) {
    inlineContainer.innerHTML = '';
    const node = state.nodes.find(n => n.id === state.editingNodeId);
    PALETTE_15.forEach(c => {
      const btn = document.createElement('button');
      btn.dataset.color = c.key;
      const isSelected = node && node.color === c.key;
      btn.className = `w-5 h-5 rounded-full hover:scale-125 transition-transform border shadow-xs ${isSelected ? 'ring-2 ring-indigo-500 scale-110' : 'border-black/20'}`;
      btn.style.backgroundColor = c.hex;
      btn.title = c.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.editingNodeId) return;
        if (node) {
          pushHistory();
          node.color = c.key;
          commitState(true, true);
          openInlineEditor(node.id);
          renderBoard();
        }
      });
      inlineContainer.appendChild(btn);
    });
  }

  const clusterContainer = document.getElementById('cluster-color-popover');
  if (clusterContainer) {
    clusterContainer.innerHTML = '';
    PALETTE_15.forEach(c => {
      const btn = document.createElement('button');
      btn.dataset.color = c.key;
      btn.className = "w-6 h-6 rounded-full hover:scale-125 transition-transform border border-black/20 shadow-xs";
      btn.style.backgroundColor = c.hex;
      btn.title = c.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.clusterColorTargetRootId) {
          changeClusterColor(state.clusterColorTargetRootId, c.key);
          clusterContainer.classList.add('hidden');
          state.clusterColorTargetRootId = null;
        }
      });
      clusterContainer.appendChild(btn);
    });
  }
}

function renderBgColorPickers() {
  const inlineBgContainer = document.getElementById('inline-bg-color-pickers');
  if (inlineBgContainer) {
    inlineBgContainer.innerHTML = '';
    const node = state.nodes.find(n => n.id === state.editingNodeId);
    
    const noneBtn = document.createElement('button');
    const isNoneSelected = !node || !node.bgColor;
    noneBtn.className = `w-5 h-5 rounded-full hover:scale-125 transition-transform border flex items-center justify-center text-[9px] font-bold ${isNoneSelected ? 'ring-2 ring-indigo-500 scale-110 bg-indigo-500 text-white' : 'border-slate-400 bg-slate-200 text-slate-700'}`;
    noneBtn.title = 'Default / None';
    noneBtn.innerHTML = '✕';
    noneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.editingNodeId || !node) return;
      pushHistory();
      node.bgColor = '';
      commitState(true, true);
      openInlineEditor(node.id);
      renderBoard();
    });
    inlineBgContainer.appendChild(noneBtn);

    PALETTE_15.forEach(c => {
      const btn = document.createElement('button');
      btn.dataset.bgcolor = c.key;
      const isSelected = node && node.bgColor === c.key;
      btn.className = `w-5 h-5 rounded-full hover:scale-125 transition-transform border shadow-xs ${isSelected ? 'ring-2 ring-indigo-500 scale-110' : 'border-black/20'}`;
      btn.style.backgroundColor = c.hex;
      btn.title = c.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.editingNodeId) return;
        if (node) {
          pushHistory();
          node.bgColor = c.key;
          commitState(true, true);
          openInlineEditor(node.id);
          renderBoard();
        }
      });
      inlineBgContainer.appendChild(btn);
    });
  }
}

function renderTextColorPickers() {
  const inlineContainer = document.getElementById('inline-text-color-pickers');
  if (!inlineContainer) return;
  inlineContainer.innerHTML = '';

  const node = state.nodes.find(n => n.id === state.editingNodeId);
  const options = [
    { key: '', name: 'Default' },
    { key: 'black', name: 'Black' },
    { key: 'white', name: 'White' }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    const isSelected = node && (node.textColor || '') === opt.key;
    btn.className = `px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
      isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-700'
    }`;
    btn.textContent = opt.name;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!node) return;
      pushHistory();
      node.textColor = opt.key;
      commitState(true, true);
      openInlineEditor(node.id);
      renderBoard();
    });
    inlineContainer.appendChild(btn);
  });
}

function renderShapePickers() {
  const inlineShapeContainer = document.getElementById('inline-shape-pickers');
  if (inlineShapeContainer) {
    inlineShapeContainer.innerHTML = '';
    const node = state.nodes.find(n => n.id === state.editingNodeId);
    const isDark = isDarkTheme();
    SHAPES_8.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = node && (node.shape || 'pill') === s.key;

      btn.className = `h-7 rounded-lg border flex items-center justify-center text-[10px] font-semibold transition-all gap-1 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : (isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300')}`;
      btn.innerHTML = `<i class="fa-solid ${s.icon} text-[10px]"></i><span class="truncate">${s.name}</span>`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.editingNodeId) return;
        if (node) {
          pushHistory();
          node.shape = s.key;
          commitState(true, true);
          openInlineEditor(node.id);
          renderBoard();
        }
      });
      inlineShapeContainer.appendChild(btn);
    });
  }
}

function switchPage(pageId) {
  state.currentPage = pageId;
  state.inventoryEditingNodeId = null;
  const pageCanvas = document.getElementById('page-canvas');
  const pageHierarchy = document.getElementById('page-hierarchy');
  const pageInventory = document.getElementById('page-inventory');
  const pageTasks = document.getElementById('page-tasks');
  const pageCalendar = document.getElementById('page-calendar');

  const navCanvas = document.getElementById('nav-canvas');
  const navHierarchy = document.getElementById('nav-hierarchy');
  const navInventory = document.getElementById('nav-inventory');
  const navTasks = document.getElementById('nav-tasks');
  const navCalendar = document.getElementById('nav-calendar');

  const pages = [pageCanvas, pageHierarchy, pageInventory, pageTasks, pageCalendar];
  const navs = [navCanvas, navHierarchy, navInventory, navTasks, navCalendar];

  pages.forEach(p => { if (p) p.classList.add('hidden'); });
  navs.forEach(n => { if (n) n.classList.remove('active'); });

  if (pageId === 'canvas' && pageCanvas && navCanvas) {
    pageCanvas.classList.remove('hidden');
    navCanvas.classList.add('active');
    applyTransform();
  } else if (pageId === 'hierarchy' && pageHierarchy && navHierarchy) {
    pageHierarchy.classList.remove('hidden');
    navHierarchy.classList.add('active');
    renderHierarchyTree();
  } else if (pageId === 'inventory' && pageInventory && navInventory) {
    pageInventory.classList.remove('hidden');
    navInventory.classList.add('active');
    renderInventoryList();
  } else if (pageId === 'tasks' && pageTasks && navTasks) {
    pageTasks.classList.remove('hidden');
    navTasks.classList.add('active');
    renderTasksList();
  } else if (pageId === 'calendar' && pageCalendar && navCalendar) {
    pageCalendar.classList.remove('hidden');
    navCalendar.classList.add('active');
    renderCalendarView();
  }
}

function renderInventoryList(searchFilter = '') {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const isDark = isDarkTheme();
  const query = searchFilter.toLowerCase().trim();

  const filteredNodes = state.nodes.filter(node => {
    if (!query) return true;
    const labelText = cleanClusterLabel(node.linkCaption || node.label).toLowerCase();
    const colorText = (node.color || '').toLowerCase();
    const shapeText = (node.shape || '').toLowerCase();
    return labelText.includes(query) || colorText.includes(query) || shapeText.includes(query);
  });

  filteredNodes.sort((a, b) => {
    let valA, valB;
    if (state.inventorySortColumn === 'label') {
      valA = cleanClusterLabel(a.linkCaption || a.label).toLowerCase();
      valB = cleanClusterLabel(b.linkCaption || b.label).toLowerCase();
    } else if (state.inventorySortColumn === 'color') {
      valA = (a.color || '').toLowerCase();
      valB = (b.color || '').toLowerCase();
    } else if (state.inventorySortColumn === 'shape') {
      valA = (a.shape || 'pill').toLowerCase();
      valB = (b.shape || 'pill').toLowerCase();
    } else if (state.inventorySortColumn === 'position') {
      valA = (a.y * 10000) + a.x;
      valB = (b.y * 10000) + b.x;
    } else if (state.inventorySortColumn === 'url') {
      valA = (a.linkUrl || '').toLowerCase();
      valB = (b.linkUrl || '').toLowerCase();
    }

    if (valA < valB) return state.inventorySortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return state.inventorySortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  document.querySelectorAll('#page-inventory th[data-sort]').forEach(th => {
    const col = th.getAttribute('data-sort');
    const icon = th.querySelector('i');
    if (col === state.inventorySortColumn) {
      th.classList.add('text-indigo-500');
      if (icon) {
        icon.className = state.inventorySortDirection === 'asc' ? 'fa-solid fa-sort-up ml-1 text-indigo-500' : 'fa-solid fa-sort-down ml-1 text-indigo-500';
      }
    } else {
      th.classList.remove('text-indigo-500');
      if (icon) {
        icon.className = 'fa-solid fa-sort ml-1 opacity-50';
      }
    }
  });

  if (filteredNodes.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" class="p-6 text-center opacity-50 italic">No inventory nodes found</td>`;
    tbody.appendChild(tr);
    return;
  }

  filteredNodes.forEach(node => {
    const tr = document.createElement('tr');
    const isEditingThisRow = state.inventoryEditingNodeId === node.id;
    tr.className = isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors';

    const cleanLabel = cleanClusterLabel(node.linkCaption || node.label);
    const hex = COLOR_HEX_MAP[node.color] || '#64748b';

    if (isEditingThisRow) {
      let colorOptionsHTML = PALETTE_15.map(c => `<option value="${c.key}" ${node.color === c.key ? 'selected' : ''}>${c.name}</option>`).join('');
      let shapeOptionsHTML = SHAPES_8.map(s => `<option value="${s.key}" ${(node.shape || 'pill') === s.key ? 'selected' : ''}>${s.name}</option>`).join('');

      tr.innerHTML = `
        <td class="p-4 align-middle">
          <button class="btn-inv-save w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer" title="Save changes">
            <i class="fa-solid fa-check text-xs"></i>
          </button>
        </td>
        <td class="p-4 align-middle">
          <input type="text" class="inv-edit-label modal-input w-full rounded-lg px-2 py-1 text-xs" value="${node.label.replace(/"/g, '&quot;')}" />
        </td>
        <td class="p-4 align-middle">
          <select class="inv-edit-color modal-input rounded-lg px-2 py-1 text-xs">
            ${colorOptionsHTML}
          </select>
        </td>
        <td class="p-4 align-middle">
          <select class="inv-edit-shape modal-input rounded-lg px-2 py-1 text-xs">
            ${shapeOptionsHTML}
          </select>
        </td>
        <td class="p-4 align-middle font-mono text-[11px]">
          <div class="flex items-center gap-1">
            <span>X:</span><input type="number" class="inv-edit-x modal-input w-16 rounded px-1.5 py-0.5 text-xs" value="${node.x}" />
            <span>Y:</span><input type="number" class="inv-edit-y modal-input w-16 rounded px-1.5 py-0.5 text-xs" value="${node.y}" />
          </div>
        </td>
        <td class="p-4 align-middle">
          <input type="url" class="inv-edit-url modal-input w-full rounded-lg px-2 py-1 text-xs" value="${node.linkUrl || ''}" placeholder="https://..." />
        </td>
        <td class="p-4 text-right align-middle">
          <button class="btn-inv-cancel px-2.5 py-1 text-xs font-semibold bg-slate-500/10 hover:bg-slate-500/20 rounded-lg transition-all cursor-pointer">
            Cancel
          </button>
        </td>
      `;

      const saveBtn = tr.querySelector('.btn-inv-save');
      const cancelBtn = tr.querySelector('.btn-inv-cancel');

      saveBtn.addEventListener('click', () => {
        const newLabel = tr.querySelector('.inv-edit-label').value.trim();
        const newColor = tr.querySelector('.inv-edit-color').value;
        const newShape = tr.querySelector('.inv-edit-shape').value;
        const newX = parseInt(tr.querySelector('.inv-edit-x').value) || node.x;
        const newY = parseInt(tr.querySelector('.inv-edit-y').value) || node.y;
        const newUrl = tr.querySelector('.inv-edit-url').value.trim();

        if (!newLabel) {
          showToast("Node label cannot be empty.");
          return;
        }

        pushHistory();
        node.label = newLabel;
        node.color = newColor;
        node.shape = newShape;
        node.x = newX;
        node.y = newY;
        node.linkUrl = newUrl;

        state.inventoryEditingNodeId = null;
        commitState(true, true);
        renderBoard();
        showToast("Node updated successfully!");
      });

      cancelBtn.addEventListener('click', () => {
        state.inventoryEditingNodeId = null;
        renderInventoryList(searchQuery());
      });

    } else {
      tr.innerHTML = `
        <td class="p-4 align-middle">
          <button class="btn-inv-edit w-7 h-7 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 flex items-center justify-center transition-colors shadow-xs cursor-pointer" title="Edit row">
            <i class="fa-solid fa-pencil text-xs"></i>
          </button>
        </td>
        <td class="p-4 font-semibold align-middle">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${hex};"></span>
            <span class="truncate max-w-[200px]">${cleanLabel}</span>
            ${node.isHub ? '<span class="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.2 rounded">Hub</span>' : ''}
          </div>
        </td>
        <td class="p-4 uppercase text-[10px] font-bold opacity-80 align-middle">
          <span class="px-2 py-0.5 rounded-md" style="background-color: ${hex}25; color: ${hex};">${node.color || 'gray'}</span>
        </td>
        <td class="p-4 capitalize opacity-70 align-middle">
          ${node.shape || 'pill'}
        </td>
        <td class="p-4 font-mono text-[11px] opacity-75 align-middle">
          X: ${node.x}, Y: ${node.y}
        </td>
        <td class="p-4 truncate max-w-[180px] align-middle">
          ${node.linkUrl ? `<a href="${node.linkUrl}" target="_blank" class="text-indigo-500 underline truncate block">${node.linkUrl}</a>` : '<span class="opacity-35 italic">None</span>'}
        </td>
        <td class="p-4 text-right align-middle">
          <div class="flex items-center justify-end gap-2">
            <button class="btn-inv-add-task px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer">
              <i class="fa-solid fa-plus text-[10px]"></i> Task
            </button>
            <button class="btn-locate-node px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-crosshairs text-[11px]"></i> Locate
            </button>
          </div>
        </td>
      `;

      const editBtn = tr.querySelector('.btn-inv-edit');
      editBtn.addEventListener('click', () => {
        state.inventoryEditingNodeId = node.id;
        renderInventoryList(searchQuery());
      });

      const addTaskBtn = tr.querySelector('.btn-inv-add-task');
      addTaskBtn.addEventListener('click', () => {
        openTaskModal(node.id);
      });

      const locateBtn = tr.querySelector('.btn-locate-node');
      locateBtn.addEventListener('click', () => {
        focusNodeOnCanvas(node.id);
      });
    }

    tbody.appendChild(tr);
  });
}

function renderTasksList(searchFilter = '') {
  const tbody = document.getElementById('tasks-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const isDark = isDarkTheme();
  const query = searchFilter.toLowerCase().trim();
  const nodeMap = getNodeMap();

  const filteredTasks = state.tasks.filter(task => {
    if (state.hideCompletedTasks && task.completed) return false;

    if (!query) return true;
    const descText = (task.description || '').toLowerCase();
    const dateText = (task.dueDate || '').toLowerCase();
    const node = nodeMap.get(task.nodeId);
    const nodeText = node ? cleanClusterLabel(node.linkCaption || node.label).toLowerCase() : '';
    return descText.includes(query) || dateText.includes(query) || nodeText.includes(query);
  });

  filteredTasks.sort((a, b) => {
    let valA, valB;
    if (state.taskSortColumn === 'desc') {
      valA = (a.description || '').toLowerCase();
      valB = (b.description || '').toLowerCase();
    } else if (state.taskSortColumn === 'date') {
      valA = a.dueDate || '';
      valB = b.dueDate || '';
    } else if (state.taskSortColumn === 'node') {
      const nodeA = nodeMap.get(a.nodeId);
      const nodeB = nodeMap.get(b.nodeId);
      valA = nodeA ? cleanClusterLabel(nodeA.linkCaption || nodeA.label).toLowerCase() : '';
      valB = nodeB ? cleanClusterLabel(nodeB.linkCaption || nodeB.label).toLowerCase() : '';
    }

    if (valA < valB) return state.taskSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return state.taskSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  document.querySelectorAll('#page-tasks th[data-sort]').forEach(th => {
    const col = th.getAttribute('data-sort');
    const icon = th.querySelector('i');
    if (col === state.taskSortColumn) {
      th.classList.add('text-indigo-500');
      if (icon) {
        icon.className = state.taskSortDirection === 'asc' ? 'fa-solid fa-sort-up ml-1 text-indigo-500' : 'fa-solid fa-sort-down ml-1 text-indigo-500';
      }
    } else {
      th.classList.remove('text-indigo-500');
      if (icon) {
        icon.className = 'fa-solid fa-sort ml-1 opacity-50';
      }
    }
  });

  if (filteredTasks.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" class="p-6 text-center opacity-50 italic">${state.hideCompletedTasks ? 'No active tasks found' : 'No tasks created yet'}</td>`;
    tbody.appendChild(tr);
    return;
  }

  filteredTasks.forEach(task => {
    const tr = document.createElement('tr');
    tr.className = isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-slate-50 transition-colors';

    const linkedNode = nodeMap.get(task.nodeId);
    const pillHTML = getPillMarkup(linkedNode, isDark, true);

    tr.innerHTML = `
      <td class="p-4 text-center align-middle">
        <input type="checkbox" class="task-checkbox w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" ${task.completed ? 'checked' : ''} />
      </td>
      <td class="p-4 font-medium align-middle ${task.completed ? 'line-through opacity-50' : ''}">
        ${task.description.replace(/\n/g, '<br/>')}
      </td>
      <td class="p-4 align-middle">
        ${pillHTML}
      </td>
      <td class="p-4 font-mono text-[11px] opacity-75 align-middle">
        ${task.dueDate || 'No due date'}
      </td>
      <td class="p-4 text-right align-middle">
        <button class="btn-delete-task px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer" title="Delete Task">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;

    const checkbox = tr.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      pushHistory();
      task.completed = checkbox.checked;
      if (task.completed && !task.completedAt) {
        task.completedAt = getLocalDateTimeString();
      }
      commitState(true, true);
    });

    const deleteBtn = tr.querySelector('.btn-delete-task');
    deleteBtn.addEventListener('click', () => {
      pushHistory();
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      commitState(true, true);
      showToast("Task deleted.");
    });

    tbody.appendChild(tr);
  });
}

function renderCalendarView() {
  const gridEl = document.getElementById('calendar-grid');
  const monthYearEl = document.getElementById('calendar-month-year');
  if (!gridEl || !monthYearEl) return;

  gridEl.innerHTML = '';
  const isDark = isDarkTheme();

  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  monthYearEl.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  const nodeMap = getNodeMap();
  const taskMap = {};
  state.tasks.forEach(task => {
    if (task.dueDate) {
      if (!taskMap[task.dueDate]) taskMap[task.dueDate] = [];
      taskMap[task.dueDate].push(task);
    }
  });

  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cell = document.createElement('div');
    cell.className = "min-h-[90px] p-1.5 rounded-xl border border-transparent opacity-30 text-xs font-medium";
    cell.innerHTML = `<span>${dayNum}</span>`;
    gridEl.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const cell = document.createElement('div');
    const isToday = dateKey === todayStr;

    cell.className = `min-h-[100px] p-2 rounded-xl border flex flex-col gap-1 transition-colors cursor-pointer ${
      isToday
        ? 'border-indigo-500/80 bg-indigo-500/10 font-bold'
        : (isDark ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/50' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80')
    }`;

    cell.addEventListener('click', (e) => {
      if (e.target.closest('.btn-cal-add-task') || e.target.closest('.task-badge')) return;
      openTaskModal(null);
      const dateInput = document.getElementById('task-date-input');
      if (dateInput) dateInput.value = dateKey;
    });

    const header = document.createElement('div');
    header.className = "flex items-center justify-between text-xs";
    header.innerHTML = `
      <span class="${isToday ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]' : 'opacity-70'}">${day}</span>
      <button class="btn-cal-add-task text-[10px] opacity-40 hover:opacity-100 text-indigo-500 font-semibold transition-opacity cursor-pointer p-0.5" title="Add Task for this date">+</button>
    `;

    const addBtn = header.querySelector('.btn-cal-add-task');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskModal(null);
      const dateInput = document.getElementById('task-date-input');
      if (dateInput) dateInput.value = dateKey;
    });

    cell.appendChild(header);

    const taskList = taskMap[dateKey] || [];
    const tasksContainer = document.createElement('div');
    tasksContainer.className = "flex flex-col gap-1 overflow-y-auto max-h-[80px] no-scrollbar";

    taskList.forEach(task => {
      const linkedNode = nodeMap.get(task.nodeId);
      const hex = linkedNode ? (COLOR_HEX_MAP[linkedNode.color] || '#64748b') : '#64748b';

      const taskBadge = document.createElement('div');
      taskBadge.className = `task-badge px-1.5 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 cursor-pointer truncate ${
        task.completed ? 'line-through opacity-45' : ''
      }`;
      taskBadge.style.backgroundColor = `${hex}20`;
      taskBadge.style.borderColor = `${hex}50`;
      taskBadge.style.color = isDark ? '#ffffff' : hex;

      taskBadge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${hex};"></span>
        <span class="truncate">${task.description}</span>
      `;

      taskBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskCompletionModal(task.id);
      });

      tasksContainer.appendChild(taskBadge);
    });

    cell.appendChild(tasksContainer);
    gridEl.appendChild(cell);
  }
}

function searchQuery() {
  const searchInput = document.getElementById('inventory-search');
  return searchInput ? searchInput.value : '';
}

function taskSearchQuery() {
  const searchInput = document.getElementById('tasks-search');
  return searchInput ? searchInput.value : '';
}

function changeClusterColor(rootId, newColor) {
  pushHistory();
  const clusterNodes = state.nodes.filter(n => (n.color || 'gray') === rootId);
  if (clusterNodes.length === 0) return;

  clusterNodes.forEach(node => {
    node.color = newColor;
  });

  commitState(true, true);
  renderBoard();
  showToast(`Cluster color updated to ${newColor}!`);
}

function updateClusterCounts() {
  const clusterListEl = document.getElementById('sidebar-cluster-list');
  if (!clusterListEl) return;

  const clusters = getDetectedClusters();
  clusterListEl.innerHTML = '';

  if (clusters.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = "px-3 py-1 text-[11px] opacity-40 italic";
    emptyNotice.textContent = "No clusters yet";
    clusterListEl.appendChild(emptyNotice);
    return;
  }

  clusters.forEach(cluster => {
    const btn = document.createElement('button');
    btn.dataset.clusterKey = cluster.id;
    btn.className = "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg hover:bg-slate-500/10 transition-colors text-left cursor-pointer";

    const hex = COLOR_HEX_MAP[cluster.color] || '#64748b';

    btn.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden mr-2">
        <span style="background-color: ${hex};" class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"></span>
        <span class="font-medium truncate">${cluster.name}</span>
      </div>
      <span class="text-[11px] font-semibold opacity-60 shrink-0">${cluster.count}</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDynamicCluster(cluster.id);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      state.clusterColorTargetRootId = cluster.id;
      const popover = document.getElementById('cluster-color-popover');
      if (popover) {
        popover.style.left = `${Math.min(window.innerWidth - 220, e.clientX + 10)}px`;
        popover.style.top = `${Math.min(window.innerHeight - 120, e.clientY)}px`;
        popover.classList.remove('hidden');
      }
    });

    clusterListEl.appendChild(btn);
  });
}

function renderHierarchyTree() {
  const treeContainer = document.getElementById('tree-container');
  if (!treeContainer) return;
  treeContainer.innerHTML = '';

  const isDark = isDarkTheme();

  let primaryRoot = state.nodes.find(n => n.id === 'adam') || state.nodes.find(n => n.isHub) || state.nodes[0];
  if (!primaryRoot) return;

  const visited = new Set();
  const undirectedTargets = new Map(); // source id -> Set of target ids
  state.edges.forEach(e => {
    if (e.directed) return;
    if (!undirectedTargets.has(e.source)) undirectedTargets.set(e.source, new Set());
    undirectedTargets.get(e.source).add(e.target);
  });
  const NO_TARGETS = new Set();

  function createTreeNode(node, level = 0) {
    visited.add(node.id);

    const childEdgeTargets = undirectedTargets.get(node.id) || NO_TARGETS;

    const childNodes = state.nodes.filter(n => {
      if (!childEdgeTargets.has(n.id) || visited.has(n.id)) return false;
      return (n.color || 'gray') === (node.color || 'gray');
    });

    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = "flex flex-col gap-2";

    const itemRow = document.createElement('div');
    itemRow.className = `flex items-center justify-between p-2.5 rounded-xl border transition-all group relative ${
      isDark 
        ? 'border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/40' 
        : 'border-slate-100 hover:border-indigo-100 hover:bg-slate-50/80'
    }`;

    const leftGroup = document.createElement('div');
    leftGroup.className = "flex items-center gap-2.5 overflow-hidden";

    if (childNodes.length > 0) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = "w-6 h-6 rounded-lg opacity-60 hover:opacity-100 flex items-center justify-center text-xs transition-colors shrink-0 cursor-pointer";
      toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-down transition-transform"></i>';
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const childContainer = nodeWrapper.querySelector('.tree-branch-line');
        if (childContainer) {
          const isHidden = childContainer.classList.toggle('hidden');
          toggleBtn.querySelector('i').style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
        }
      });
      leftGroup.appendChild(toggleBtn);
    } else {
      const leafBullet = document.createElement('div');
      leafBullet.className = "w-6 h-6 flex items-center justify-center shrink-0";
      leafBullet.innerHTML = '<div class="w-1.5 h-1.5 rounded-full bg-slate-500/40"></div>';
      leftGroup.appendChild(leafBullet);
    }

    const pillContainer = document.createElement('div');
    pillContainer.className = "flex items-center justify-center";
    pillContainer.innerHTML = getHierarchyPillMarkup(node, isDark);
    leftGroup.appendChild(pillContainer);

    if (node.id === 'adam' || node.isHub) {
      const hubBadge = document.createElement('span');
      hubBadge.className = "text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-md shrink-0";
      hubBadge.textContent = node.id === 'adam' ? "Root" : "Hub";
      leftGroup.appendChild(hubBadge);
    }

    itemRow.appendChild(leftGroup);

    const actionsDesktop = document.createElement('div');
    actionsDesktop.className = "tree-actions-desktop opacity-80 group-hover:opacity-100 transition-opacity";

    const btnAddChild = document.createElement('button');
    btnAddChild.className = "px-2 py-1 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center gap-1 cursor-pointer";
    btnAddChild.title = "Add Sub-item";
    btnAddChild.innerHTML = '<i class="fa-solid fa-plus text-[11px]"></i><span>Add</span>';
    btnAddChild.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddModal(node.id);
    });
    actionsDesktop.appendChild(btnAddChild);

    const btnLocate = document.createElement('button');
    btnLocate.className = "px-2 py-1 text-xs font-medium opacity-70 hover:opacity-100 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all flex items-center gap-1 cursor-pointer";
    btnLocate.title = "Locate on Canvas";
    btnLocate.innerHTML = '<i class="fa-solid fa-crosshairs text-[11px]"></i><span>Locate</span>';
    btnLocate.addEventListener('click', (e) => {
      e.stopPropagation();
      focusNodeOnCanvas(node.id);
    });
    actionsDesktop.appendChild(btnLocate);

    const btnDeleteRow = document.createElement('button');
    btnDeleteRow.className = "px-2 py-1 text-xs font-medium opacity-50 hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer";
    btnDeleteRow.title = "Delete Item";
    btnDeleteRow.innerHTML = '<i class="fa-solid fa-trash-can text-[11px]"></i>';
    btnDeleteRow.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNode(node.id);
    });
    actionsDesktop.appendChild(btnDeleteRow);

    itemRow.appendChild(actionsDesktop);

    const actionsMobile = document.createElement('div');
    actionsMobile.className = "tree-actions-mobile";

    const dotsBtn = document.createElement('button');
    dotsBtn.className = "w-7 h-7 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors cursor-pointer";
    dotsBtn.innerHTML = '<i class="fa-solid fa-ellipsis-vertical text-xs"></i>';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = "hidden absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl border p-1.5 flex flex-col gap-1 tree-mobile-menu";

    const mobAddOpt = document.createElement('button');
    mobAddOpt.className = "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer";
    mobAddOpt.innerHTML = '<i class="fa-solid fa-plus text-[11px] w-4"></i><span>Add</span>';
    mobAddOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.add('hidden');
      openAddModal(node.id);
    });
    dropdownMenu.appendChild(mobAddOpt);

    const mobLocateOpt = document.createElement('button');
    mobLocateOpt.className = "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-80 hover:opacity-100 hover:bg-indigo-500/10 hover:text-indigo-400 flex items-center gap-2 cursor-pointer";
    mobLocateOpt.innerHTML = '<i class="fa-solid fa-crosshairs text-[11px] w-4"></i><span>Locate</span>';
    mobLocateOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.add('hidden');
      focusNodeOnCanvas(node.id);
    });
    dropdownMenu.appendChild(mobLocateOpt);

    const mobDelOpt = document.createElement('button');
    mobDelOpt.className = "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer";
    mobDelOpt.innerHTML = '<i class="fa-solid fa-trash-can text-[11px] w-4"></i><span>Delete</span>';
    mobDelOpt.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.add('hidden');
      deleteNode(node.id);
    });
    dropdownMenu.appendChild(mobDelOpt);

    dotsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.tree-mobile-menu').forEach(m => {
        if (m !== dropdownMenu) m.classList.add('hidden');
      });
      dropdownMenu.classList.toggle('hidden');
    });

    actionsMobile.appendChild(dotsBtn);
    actionsMobile.appendChild(dropdownMenu);
    itemRow.appendChild(actionsMobile);

    nodeWrapper.appendChild(itemRow);

    if (childNodes.length > 0) {
      const branchDiv = document.createElement('div');
      branchDiv.className = "tree-branch-line flex flex-col gap-2 mt-1";
      childNodes.forEach(child => {
        branchDiv.appendChild(createTreeNode(child, level + 1));
      });
      nodeWrapper.appendChild(branchDiv);
    }

    return nodeWrapper;
  }

  treeContainer.appendChild(createTreeNode(primaryRoot, 0));

  const directEdgeTargets = state.edges
    .filter(e => !e.directed && (e.source === primaryRoot.id || e.target === primaryRoot.id))
    .map(e => e.source === primaryRoot.id ? e.target : e.source);
  const directTargetSet = new Set(directEdgeTargets);

  const subClusterRoots = state.nodes.filter(n => directTargetSet.has(n.id) && !visited.has(n.id));

  subClusterRoots.forEach(clusterRoot => {
    treeContainer.appendChild(createTreeNode(clusterRoot, 0));
  });

  const orphans = state.nodes.filter(n => !visited.has(n.id));
  if (orphans.length > 0) {
    const orphanSection = document.createElement('div');
    orphanSection.className = "pt-4 border-t border-slate-500/20 flex flex-col gap-2";
    const orphanTitle = document.createElement('div');
    orphanTitle.className = "text-xs font-bold opacity-40 uppercase tracking-wider";
    orphanTitle.textContent = "Unconnected / Other Clusters";
    orphanSection.appendChild(orphanTitle);

    orphans.forEach(o => {
      if (!visited.has(o.id)) {
        orphanSection.appendChild(createTreeNode(o, 0));
      }
    });
    treeContainer.appendChild(orphanSection);
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.tree-actions-mobile')) {
    document.querySelectorAll('.tree-mobile-menu').forEach(m => m.classList.add('hidden'));
  }
  if (!e.target.closest('#cluster-color-popover')) {
    const popover = document.getElementById('cluster-color-popover');
    if (popover) popover.classList.add('hidden');
    state.clusterColorTargetRootId = null;
  }
});

function openAddModal(parentNodeId = null) {
  state.modalParentNodeId = parentNodeId;

  const modalEl = document.getElementById('add-node-modal');
  const modalBox = modalEl ? modalEl.querySelector('.modal-box') : null;
  const modalTitleEl = document.getElementById('add-modal-title');
  const labelInput = document.getElementById('node-label-input');
  const searchInput = document.getElementById('parent-search-input');
  const dropdownMenu = document.getElementById('parent-dropdown-menu');
  const selectModalFontsize = document.getElementById('select-modal-fontsize');
  const modalUrlEl = document.getElementById('node-modal-url');
  const modalCaptionEl = document.getElementById('node-modal-caption');
  const btnModalBold = document.getElementById('btn-modal-bold');
  const btnModalItalic = document.getElementById('btn-modal-italic');
  const btnModalUnderline = document.getElementById('btn-modal-underline');

  if (!modalEl || !labelInput) return;

  if (modalBox) {
    modalBox.style.position = '';
    modalBox.style.left = '';
    modalBox.style.top = '';
    modalBox.style.transform = '';
  }

  modalEl.classList.remove('hidden');

  if (searchInput) searchInput.value = '';
  if (dropdownMenu) dropdownMenu.classList.add('hidden');

  populateParentDropdown(parentNodeId, '');

  if (parentNodeId) {
    const parentNode = state.nodes.find(n => n.id === parentNodeId);
    const parentName = parentNode ? cleanClusterLabel(parentNode.linkCaption || parentNode.label) : 'Item';
    if (modalTitleEl) modalTitleEl.textContent = `Add Child to "${parentName}"`;
    state.selectedModalColor = parentNode ? parentNode.color : 'red';
    state.selectedModalShape = parentNode ? (parentNode.shape || 'pill') : 'pill';
    state.selectedModalFontSize = parentNode ? (parentNode.fontSize || '') : '';
    state.selectedModalBgColor = parentNode ? (parentNode.bgColor || '') : '';
    state.selectedModalTextColor = parentNode ? (parentNode.textColor || '') : '';
    state.selectedModalBold = parentNode ? !!parentNode.isBold : false;
    state.selectedModalItalic = parentNode ? !!parentNode.isItalic : false;
    state.selectedModalUnderline = parentNode ? !!parentNode.isUnderline : false;
  } else {
    if (modalTitleEl) modalTitleEl.textContent = 'Create New Node';
    state.selectedModalColor = 'red';
    state.selectedModalShape = 'pill';
    state.selectedModalFontSize = '';
    state.selectedModalBgColor = '';
    state.selectedModalTextColor = '';
    state.selectedModalBold = false;
    state.selectedModalItalic = false;
    state.selectedModalUnderline = false;
  }

  if (selectModalFontsize) selectModalFontsize.value = state.selectedModalFontSize;
  if (modalUrlEl) modalUrlEl.value = '';
  if (modalCaptionEl) modalCaptionEl.value = '';

  setToggleActive(btnModalBold, state.selectedModalBold);
  setToggleActive(btnModalItalic, state.selectedModalItalic);
  setToggleActive(btnModalUnderline, state.selectedModalUnderline);

  renderModalColorChoices();
  renderModalBgColorChoices();
  renderModalTextColorChoices();
  renderModalShapeChoices();

  labelInput.value = '';
  setTimeout(() => {
    labelInput.focus();
  }, 30);
}

function makeModalDraggable(modalBoxEl, handleEl) {
  handleEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    modalBoxEl.style.position = 'absolute';
    const startLeft = modalBoxEl.offsetLeft;
    const startTop = modalBoxEl.offsetTop;

    const onMouseMove = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();

      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      const w = modalBoxEl.offsetWidth;
      const h = modalBoxEl.offsetHeight;

      newLeft = Math.max(0, Math.min(window.innerWidth - w, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - h, newTop));

      modalBoxEl.style.left = `${newLeft}px`;
      modalBoxEl.style.top = `${newTop}px`;
    };

    const onMouseUp = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const viewportEl = document.getElementById('board-viewport');
  const marqueeBoxEl = document.getElementById('marquee-box');
  const modalEl = document.getElementById('add-node-modal');
  const taskModalEl = document.getElementById('task-modal');
  const completionModalEl = document.getElementById('task-completion-modal');
  const labelInput = document.getElementById('node-label-input');
  const sidebar = document.getElementById('sidebar');

  const inlineEditorEl = document.getElementById('node-inline-editor');
  const addNodeModalBox = document.querySelector('#add-node-modal .modal-box');
  const addModalHeader = document.querySelector('#add-node-modal h3')?.parentElement;
  const taskModalBox = document.querySelector('#task-modal .modal-box');
  const taskModalHeader = document.querySelector('#task-modal h3')?.parentElement;
  const completionModalBox = document.querySelector('#task-completion-modal .modal-box');
  const completionModalHeader = document.querySelector('#task-completion-modal h3')?.parentElement;

  if (inlineEditorEl) makeModalDraggable(inlineEditorEl, inlineEditorEl.querySelector('div:first-child'));
  if (addNodeModalBox && addModalHeader) makeModalDraggable(addNodeModalBox, addModalHeader);
  if (taskModalBox && taskModalHeader) makeModalDraggable(taskModalBox, taskModalHeader);
  if (completionModalBox && completionModalHeader) makeModalDraggable(completionModalBox, completionModalHeader);

  const btnSelectMode = document.getElementById('btn-select-mode');
  const btnConnectMode = document.getElementById('btn-connect-mode');
  const btnConnectDirectedMode = document.getElementById('btn-connect-directed-mode');
  const btnPanMode = document.getElementById('btn-pan-mode');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnSelectAll = document.getElementById('btn-select-all');
  const btnDeleteSelected = document.getElementById('btn-delete-selected');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnHierarchyExportPdf = document.getElementById('btn-hierarchy-export-pdf');
  const btnResetDefault = document.getElementById('btn-reset-default');
  const btnResetView = document.getElementById('btn-reset-view');
  const btnCenterDiagram = document.getElementById('btn-center-diagram');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnOpenAddModal = document.getElementById('btn-open-add-modal');
  const btnHierarchyAddRoot = document.getElementById('btn-hierarchy-add-root');
  const btnOpenTaskModal = document.getElementById('btn-open-task-modal');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const navCanvas = document.getElementById('nav-canvas');
  const navHierarchy = document.getElementById('nav-hierarchy');
  const navInventory = document.getElementById('nav-inventory');
  const navTasks = document.getElementById('nav-tasks');
  const navCalendar = document.getElementById('nav-calendar');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnConfirmAdd = document.getElementById('btn-confirm-add');
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
  const btnCancelTaskModal = document.getElementById('btn-cancel-task-modal');
  const btnConfirmTask = document.getElementById('btn-confirm-task');

  const btnCloseCompletionModal = document.getElementById('btn-close-completion-modal');
  const btnCancelCompletionModal = document.getElementById('btn-cancel-completion-modal');
  const btnSaveCompletion = document.getElementById('btn-save-completion');
  const btnDeleteCompletionTask = document.getElementById('btn-delete-completion-task');

  const btnToggleCompletedTasks = document.getElementById('btn-toggle-completed-tasks');
  const toggleCompletedTasksText = document.getElementById('toggle-completed-tasks-text');

  const btnSignOut = document.getElementById('btn-sign-out');
  const loginBtn = document.getElementById('btn-login-submit');
  const loginPassword = document.getElementById('login-password');
  const btnInlineSave = document.getElementById('btn-inline-save');
  const btnInlineDelete = document.getElementById('btn-inline-delete-node');
  const inlineTextareaEl = document.getElementById('node-inline-textarea');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnHierarchyThemeToggle = document.getElementById('btn-hierarchy-theme-toggle');

  const btnModalBold = document.getElementById('btn-modal-bold');
  const btnModalItalic = document.getElementById('btn-modal-italic');
  const btnModalUnderline = document.getElementById('btn-modal-underline');
  const selectModalFontsize = document.getElementById('select-modal-fontsize');

  if (btnToggleCompletedTasks) {
    btnToggleCompletedTasks.addEventListener('click', () => {
      state.hideCompletedTasks = !state.hideCompletedTasks;
      const icon = btnToggleCompletedTasks.querySelector('i');

      if (state.hideCompletedTasks) {
        if (toggleCompletedTasksText) toggleCompletedTasksText.textContent = 'Show Completed';
        if (icon) icon.className = 'fa-regular fa-eye text-xs';
        btnToggleCompletedTasks.classList.add('bg-indigo-500/10', 'text-indigo-600', 'border-indigo-500/30');
      } else {
        if (toggleCompletedTasksText) toggleCompletedTasksText.textContent = 'Hide Completed';
        if (icon) icon.className = 'fa-regular fa-eye-slash text-xs';
        btnToggleCompletedTasks.classList.remove('bg-indigo-500/10', 'text-indigo-600', 'border-indigo-500/30');
      }

      renderTasksList(taskSearchQuery());
    });
  }

  [
    [btnModalBold, 'selectedModalBold'],
    [btnModalItalic, 'selectedModalItalic'],
    [btnModalUnderline, 'selectedModalUnderline']
  ].forEach(([btn, key]) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      state[key] = !state[key];
      setToggleActive(btn, state[key]);
    });
  });

  if (selectModalFontsize) {
    selectModalFontsize.addEventListener('change', (e) => {
      state.selectedModalFontSize = e.target.value;
    });
  }

  const btnInlineBold = document.getElementById('btn-inline-bold');
  const btnInlineItalic = document.getElementById('btn-inline-italic');
  const btnInlineUnderline = document.getElementById('btn-inline-underline');
  const selectInlineFontsize = document.getElementById('select-inline-fontsize');

  [
    [btnInlineBold, 'isBold'],
    [btnInlineItalic, 'isItalic'],
    [btnInlineUnderline, 'isUnderline']
  ].forEach(([btn, prop]) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!state.editingNodeId) return;
      const node = state.nodes.find(n => n.id === state.editingNodeId);
      if (!node) return;
      pushHistory();
      node[prop] = !node[prop];
      setToggleActive(btn, node[prop]);
      commitState(true, true);
      renderBoard();
    });
  });

  if (selectInlineFontsize) {
    selectInlineFontsize.addEventListener('change', (e) => {
      if (state.editingNodeId) {
        const node = state.nodes.find(n => n.id === state.editingNodeId);
        if (node) {
          pushHistory();
          node.fontSize = e.target.value;
          commitState(true, true);
          renderBoard();
        }
      }
    });
  }

  if (btnUndo) btnUndo.addEventListener('click', performUndo);
  if (btnRedo) btnRedo.addEventListener('click', performRedo);
  if (btnExportPng) btnExportPng.addEventListener('click', exportToPNG);
  if (btnHierarchyExportPdf) btnHierarchyExportPdf.addEventListener('click', exportHierarchyToPDF);

  applyTheme(state.theme); // also renders all color/shape pickers
  if (btnThemeToggle) btnThemeToggle.addEventListener('click', cycleTheme);
  if (btnHierarchyThemeToggle) btnHierarchyThemeToggle.addEventListener('click', cycleTheme);

  const parentDropdownBtn = document.getElementById('parent-dropdown-btn');
  const parentDropdownMenu = document.getElementById('parent-dropdown-menu');
  const parentSearchInput = document.getElementById('parent-search-input');

  if (parentDropdownBtn && parentDropdownMenu) {
    parentDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpening = parentDropdownMenu.classList.toggle('hidden') === false;
      if (isOpening && parentSearchInput) {
        parentSearchInput.value = '';
        populateParentDropdown(state.modalParentNodeId, '');
        setTimeout(() => parentSearchInput.focus(), 60);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#parent-dropdown-container')) {
        parentDropdownMenu.classList.add('hidden');
      }
    });
  }

  if (parentSearchInput) {
    parentSearchInput.addEventListener('input', (e) => {
      populateParentDropdown(state.modalParentNodeId, e.target.value);
    });
    parentSearchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  const taskNodeDropdownBtn = document.getElementById('task-node-dropdown-btn');
  const taskNodeDropdownMenu = document.getElementById('task-node-dropdown-menu');
  const taskNodeSearchInput = document.getElementById('task-node-search-input');

  if (taskNodeDropdownBtn && taskNodeDropdownMenu) {
    taskNodeDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpening = taskNodeDropdownMenu.classList.toggle('hidden') === false;
      if (isOpening && taskNodeSearchInput) {
        taskNodeSearchInput.value = '';
        populateTaskNodeDropdown(state.selectedTaskNodeId, '');
        setTimeout(() => taskNodeSearchInput.focus(), 60);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#task-node-dropdown-container')) {
        taskNodeDropdownMenu.classList.add('hidden');
      }
    });
  }

  if (taskNodeSearchInput) {
    taskNodeSearchInput.addEventListener('input', (e) => {
      populateTaskNodeDropdown(state.selectedTaskNodeId, e.target.value);
    });
    taskNodeSearchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  const inventorySearchInput = document.getElementById('inventory-search');
  if (inventorySearchInput) {
    inventorySearchInput.addEventListener('input', (e) => {
      renderInventoryList(e.target.value);
    });
  }

  const tasksSearchInput = document.getElementById('tasks-search');
  if (tasksSearchInput) {
    tasksSearchInput.addEventListener('input', (e) => {
      renderTasksList(e.target.value);
    });
  }

  document.querySelectorAll('#page-inventory th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (state.inventorySortColumn === col) {
        state.inventorySortDirection = state.inventorySortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.inventorySortColumn = col;
        state.inventorySortDirection = 'asc';
      }
      const searchTerm = inventorySearchInput ? inventorySearchInput.value : '';
      renderInventoryList(searchTerm);
    });
  });

  document.querySelectorAll('#page-tasks th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (state.taskSortColumn === col) {
        state.taskSortDirection = state.taskSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.taskSortColumn = col;
        state.taskSortDirection = 'asc';
      }
      const searchTerm = tasksSearchInput ? tasksSearchInput.value : '';
      renderTasksList(searchTerm);
    });
  });

  if (btnSelectMode) btnSelectMode.addEventListener('click', () => setAppMode('select'));
  if (btnConnectMode) btnConnectMode.addEventListener('click', () => setAppMode('connect'));
  if (btnConnectDirectedMode) btnConnectDirectedMode.addEventListener('click', () => setAppMode('connect-directed'));
  if (btnPanMode) btnPanMode.addEventListener('click', () => setAppMode('pan'));
  if (btnSelectAll) btnSelectAll.addEventListener('click', selectEntireDiagram);
  if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', deleteSelected);
  if (btnResetDefault) btnResetDefault.addEventListener('click', resetToDefaultDiagram);
  if (btnResetView) btnResetView.addEventListener('click', resetView);
  if (btnCenterDiagram) btnCenterDiagram.addEventListener('click', centerDiagram);

  setAppMode('pan');

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      state.view.zoom = Math.min(2.5, state.view.zoom * 1.2);
      applyTransform();
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      state.view.zoom = Math.max(0.3, state.view.zoom / 1.2);
      applyTransform();
    });
  }

  if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openAddModal(null));
  if (btnHierarchyAddRoot) btnHierarchyAddRoot.addEventListener('click', () => openAddModal(null));
  if (btnOpenTaskModal) btnOpenTaskModal.addEventListener('click', () => openTaskModal(null));

  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      setTimeout(() => {
        centerDiagram();
        applyTransform();
      }, 260);
    });
  }

  if (navCanvas) navCanvas.addEventListener('click', () => switchPage('canvas'));
  if (navHierarchy) navHierarchy.addEventListener('click', () => switchPage('hierarchy'));
  if (navInventory) navInventory.addEventListener('click', () => switchPage('inventory'));
  if (navTasks) navTasks.addEventListener('click', () => switchPage('tasks'));
  if (navCalendar) navCalendar.addEventListener('click', () => switchPage('calendar'));

  const btnCalPrev = document.getElementById('btn-cal-prev');
  const btnCalNext = document.getElementById('btn-cal-next');
  const btnCalToday = document.getElementById('btn-cal-today');
  const btnCalendarOpenTask = document.getElementById('btn-calendar-open-task');

  if (btnCalPrev) {
    btnCalPrev.addEventListener('click', () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
      renderCalendarView();
    });
  }
  if (btnCalNext) {
    btnCalNext.addEventListener('click', () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
      renderCalendarView();
    });
  }
  if (btnCalToday) {
    btnCalToday.addEventListener('click', () => {
      state.calendarDate = new Date();
      renderCalendarView();
    });
  }
  if (btnCalendarOpenTask) {
    btnCalendarOpenTask.addEventListener('click', () => openTaskModal(null));
  }

  if (btnCloseModal && modalEl) btnCloseModal.addEventListener('click', () => modalEl.classList.add('hidden'));
  if (btnCancelModal && modalEl) btnCancelModal.addEventListener('click', () => modalEl.classList.add('hidden'));

  if (btnCloseTaskModal && taskModalEl) btnCloseTaskModal.addEventListener('click', () => taskModalEl.classList.add('hidden'));
  if (btnCancelTaskModal && taskModalEl) btnCancelTaskModal.addEventListener('click', () => taskModalEl.classList.add('hidden'));

  if (btnCloseCompletionModal && completionModalEl) btnCloseCompletionModal.addEventListener('click', () => completionModalEl.classList.add('hidden'));
  if (btnCancelCompletionModal && completionModalEl) btnCancelCompletionModal.addEventListener('click', () => completionModalEl.classList.add('hidden'));

  if (btnSaveCompletion) {
    btnSaveCompletion.addEventListener('click', () => {
      if (!state.activeEditingTaskId) return;

      const task = state.tasks.find(t => t.id === state.activeEditingTaskId);
      if (!task) return;

      const checkbox = document.getElementById('completion-status-checkbox');
      const timeInput = document.getElementById('completion-time-input');
      const notesInput = document.getElementById('completion-notes-input');

      pushHistory();

      task.completed = checkbox ? checkbox.checked : false;
      task.completedAt = timeInput ? timeInput.value : '';
      task.completionNotes = notesInput ? notesInput.value.trim() : '';

      commitState(true, true);
      completionModalEl.classList.add('hidden');
      state.activeEditingTaskId = null;


      showToast("Task updated!");
    });
  }

  if (btnDeleteCompletionTask) {
    btnDeleteCompletionTask.addEventListener('click', () => {
      if (!state.activeEditingTaskId) return;

      pushHistory();
      state.tasks = state.tasks.filter(t => t.id !== state.activeEditingTaskId);
      commitState(true, true);

      completionModalEl.classList.add('hidden');
      state.activeEditingTaskId = null;


      showToast("Task deleted.");
    });
  }

  if (btnConfirmTask) {
    btnConfirmTask.addEventListener('click', () => {
      const descInput = document.getElementById('task-desc-input');
      const dateInput = document.getElementById('task-date-input');
      if (!descInput || !dateInput) return;

      const desc = descInput.value.trim();
      const dueDate = dateInput.value;
      const nodeId = state.selectedTaskNodeId;

      if (!desc) {
        showToast("Please enter a task description.");
        return;
      }

      if (!nodeId) {
        showToast("Please select a linked node.");
        return;
      }

      pushHistory();
      state.tasks.push({
        id: 'task_' + Date.now(),
        description: desc,
        dueDate: dueDate,
        nodeId: nodeId,
        completed: false,
        completedAt: '',
        completionNotes: ''
      });

      commitState(true, true);
      taskModalEl.classList.add('hidden');
      showToast("Task created successfully!");
    });
  }

  if (btnConfirmAdd) {
    btnConfirmAdd.addEventListener('click', () => {
      if (!labelInput) return;
      const text = labelInput.value.trim();
      if (!text) {
        showToast("Please enter a title for the node.");
        return;
      }

      pushHistory();

      const chosenParentId = state.modalParentNodeId || null;
      let posX, posY;
      if (chosenParentId) {
        const parentNode = state.nodes.find(n => n.id === chosenParentId);
        if (state.contextClickPos) {
          posX = Math.round(state.contextClickPos.x + 80);
          posY = Math.round(state.contextClickPos.y);
          state.contextClickPos = null;
        } else if (parentNode) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 140 + Math.random() * 40;
          posX = Math.round(parentNode.x + Math.cos(angle) * distance);
          posY = Math.round(parentNode.y + Math.sin(angle) * distance);
        } else {
          const rect = viewportEl.getBoundingClientRect();
          const centerScreen = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          posX = Math.round(centerScreen.x);
          posY = Math.round(centerScreen.y);
        }
      } else {
        if (state.contextClickPos) {
          posX = Math.round(state.contextClickPos.x);
          posY = Math.round(state.contextClickPos.y);
          state.contextClickPos = null;
        } else {
          const rect = viewportEl.getBoundingClientRect();
          const centerScreen = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          posX = Math.round(centerScreen.x + (Math.random() * 40 - 20));
          posY = Math.round(centerScreen.y + (Math.random() * 40 - 20));
        }
      }

      const modalUrlEl = document.getElementById('node-modal-url');
      const modalCaptionEl = document.getElementById('node-modal-caption');
      const urlVal = modalUrlEl ? modalUrlEl.value.trim() : '';
      const captionVal = modalCaptionEl ? modalCaptionEl.value.trim() : '';

      const newNodeId = "node_" + Date.now();
      const newNode = {
        id: newNodeId,
        label: text,
        x: posX,
        y: posY,
        color: state.selectedModalColor || 'red',
        shape: state.selectedModalShape || 'pill',
        fontSize: state.selectedModalFontSize || '',
        bgColor: state.selectedModalBgColor || '',
        textColor: state.selectedModalTextColor || '',
        linkUrl: urlVal,
        linkCaption: captionVal,
        isBold: state.selectedModalBold,
        isItalic: state.selectedModalItalic,
        isUnderline: state.selectedModalUnderline
      };

      state.nodes.push(newNode);

      if (chosenParentId) {
        state.edges.push({
          id: "edge_" + Date.now(),
          source: chosenParentId,
          target: newNodeId
        });
      }

      commitState(true, true);
      if (modalEl) modalEl.classList.add('hidden');
      renderBoard();
      showToast(`Added "${text}"`);
      state.modalParentNodeId = null;
    });
  }

  if (btnInlineSave) {
    btnInlineSave.addEventListener('click', (e) => {
      e.stopPropagation();
      closeInlineEditor(true);
    });
  }

  if (btnInlineDelete) {
    btnInlineDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.editingNodeId) {
        const idToDelete = state.editingNodeId;
        closeInlineEditor(false);
        deleteNode(idToDelete);
      }
    });
  }

  if (inlineTextareaEl) {
    inlineTextareaEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        closeInlineEditor(true);
      } else if (e.key === 'Escape') {
        closeInlineEditor(false);
      }
    });
  }

  const btnCollapseTree = document.getElementById('btn-collapse-all-tree');
  if (btnCollapseTree) {
    btnCollapseTree.addEventListener('click', () => {
      document.querySelectorAll('.tree-branch-line').forEach(branch => branch.classList.add('hidden'));
      document.querySelectorAll('#tree-container .fa-chevron-down').forEach(i => i.style.transform = 'rotate(-90deg)');
    });
  }

  const btnExpandTree = document.getElementById('btn-expand-all-tree');
  if (btnExpandTree) {
    btnExpandTree.addEventListener('click', () => {
      document.querySelectorAll('.tree-branch-line').forEach(branch => branch.classList.remove('hidden'));
      document.querySelectorAll('#tree-container .fa-chevron-down').forEach(i => i.style.transform = 'rotate(0deg)');
    });
  }

  if (viewportEl) {
    viewportEl.addEventListener('mousedown', (e) => {
      if (state.editingNodeId && !e.target.closest('#node-inline-editor')) {
        closeInlineEditor(true);
      }

      if (e.button === 2) {
        return;
      }

      if (e.button === 1 || state.mode === 'pan' || (e.button === 0 && e.spaceKey)) {
        state.isPanning = true;
        state.panStart = { x: e.clientX - state.view.x, y: e.clientY - state.view.y };
        viewportEl.classList.add('panning');
        return;
      }

      if (e.button === 0 && state.mode === 'select' && !e.target.closest('.node')) {
        state.isMarquee = true;
        state.marqueeStart = { x: e.clientX, y: e.clientY };
        const rect = viewportEl.getBoundingClientRect();
        if (marqueeBoxEl) {
          marqueeBoxEl.style.left = `${e.clientX - rect.left}px`;
          marqueeBoxEl.style.top = `${e.clientY - rect.top}px`;
          marqueeBoxEl.style.width = '0px';
          marqueeBoxEl.style.height = '0px';
          marqueeBoxEl.style.display = 'block';
        }

        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          state.selectedNodeIds.clear();
          state.selectedEdgeId = null;
          updateSelectionVisuals();
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isPanning) {
        state.view.x = e.clientX - state.panStart.x;
        state.view.y = e.clientY - state.panStart.y;
        applyTransform();
        return;
      }

      if (state.isMarquee && marqueeBoxEl) {
        const rect = viewportEl.getBoundingClientRect();
        const startX = state.marqueeStart.x;
        const startY = state.marqueeStart.y;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX) - rect.left;
        const top = Math.min(startY, currentY) - rect.top;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        marqueeBoxEl.style.left = `${left}px`;
        marqueeBoxEl.style.top = `${top}px`;
        marqueeBoxEl.style.width = `${width}px`;
        marqueeBoxEl.style.height = `${height}px`;

        const minX = Math.min(startX, currentX);
        const minY = Math.min(startY, currentY);
        const { x: viewX, y: viewY, zoom } = state.view;
        state.nodes.forEach(node => {
          // Inlined worldToScreen() using the rect read above
          const screenX = (node.x * zoom) + viewX + rect.left;
          const screenY = (node.y * zoom) + viewY + rect.top;
          if (
            screenX >= minX &&
            screenX <= minX + width &&
            screenY >= minY &&
            screenY <= minY + height
          ) {
            state.selectedNodeIds.add(node.id);
          }
        });
        updateSelectionVisuals();
      }
    });

    window.addEventListener('mouseup', () => {
      if (state.isPanning) {
        state.isPanning = false;
        viewportEl.classList.remove('panning');
      }
      if (state.isMarquee) {
        state.isMarquee = false;
        if (marqueeBoxEl) marqueeBoxEl.style.display = 'none';
        if (state.selectedNodeIds.size > 0) {
          showToast(`${state.selectedNodeIds.size} nodes selected. Drag any to reposition group.`);
        }
      }
    });

    viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const oldZoom = state.view.zoom;
      let newZoom = e.deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor;
      newZoom = Math.min(Math.max(0.3, newZoom), 2.5);

      const rect = viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      state.view.x = mouseX - (mouseX - state.view.x) * (newZoom / oldZoom);
      state.view.y = mouseY - (mouseY - state.view.y) * (newZoom / oldZoom);
      state.view.zoom = newZoom;
      applyTransform();
    }, { passive: false });

    let initialTouchDistance = 0;
    let initialZoom = 1;
    let initialTouchCenter = { x: 0, y: 0 };
    let initialViewAtPinch = { x: 0, y: 0 };

    viewportEl.addEventListener('touchstart', (e) => {
      if (state.editingNodeId && !e.target.closest('#node-inline-editor')) {
        closeInlineEditor(true);
      }

      if (e.touches.length === 1) {
        if (state.mode === 'pan') {
          state.isPanning = true;
          state.panStart = { x: e.touches[0].clientX - state.view.x, y: e.touches[0].clientY - state.view.y };
        } else if (state.mode === 'select' && !e.target.closest('.node')) {
          state.selectedNodeIds.clear();
          state.selectedEdgeId = null;
          updateSelectionVisuals();
        }
      } else if (e.touches.length === 2) {
        state.isPanning = false;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialTouchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialZoom = state.view.zoom;
        initialTouchCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        initialViewAtPinch = { x: state.view.x, y: state.view.y };
      }
    }, { passive: false });

    viewportEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isPanning) {
        e.preventDefault();
        state.view.x = e.touches[0].clientX - state.panStart.x;
        state.view.y = e.touches[0].clientY - state.panStart.y;
        applyTransform();
      } else if (e.touches.length === 2 && initialTouchDistance > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        const pinchRatio = currentDistance / initialTouchDistance;
        let newZoom = Math.min(Math.max(0.3, initialZoom * pinchRatio), 2.5);

        state.view.x = currentCenter.x - (initialTouchCenter.x - initialViewAtPinch.x) * (newZoom / initialZoom) + (currentCenter.x - initialTouchCenter.x);
        state.view.y = currentCenter.y - (initialTouchCenter.y - initialViewAtPinch.y) * (newZoom / initialZoom) + (currentCenter.y - initialTouchCenter.y);
        state.view.zoom = newZoom;
        applyTransform();
      }
    }, { passive: false });

    viewportEl.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) initialTouchDistance = 0;
      if (e.touches.length === 0) state.isPanning = false;
    });

    viewportEl.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.node') || e.target.closest('.modal-box')) return;
      e.preventDefault();
      e.stopPropagation();

      state.selectedNodeIds.clear();
      state.selectedEdgeId = null;
      state.connectSourceId = null;
      updateSelectionVisuals();

      state.contextClickPos = screenToWorld(e.clientX, e.clientY);
      openAddModal(null);
    });
  }

  const activeKeys = new Set();

  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
      return;
    }

    activeKeys.add(e.code);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      performUndo();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      performRedo();
      return;
    }

    if (e.shiftKey && activeKeys.has('KeyZ') && activeKeys.has('KeyX')) {
      e.preventDefault();
      createIsolatedGroup();
      return;
    }

    if (e.shiftKey && (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
      e.preventDefault();
      const targetParent = state.selectedNodeIds.size === 1 ? Array.from(state.selectedNodeIds)[0] : null;
      openAddModal(targetParent);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectEntireDiagram();
      return;
    }

    if (e.key === 'Escape') {
      state.selectedNodeIds.clear();
      state.selectedEdgeId = null;
      state.connectSourceId = null;
      updateSelectionVisuals();
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
      return;
    }

    if (e.key.toLowerCase() === 'v') setAppMode('select');
    if (e.key.toLowerCase() === 'c') setAppMode('connect');
    if (e.key.toLowerCase() === 'a') setAppMode('connect-directed');
    if (e.key.toLowerCase() === 'h') setAppMode('pan');
  });

  window.addEventListener('keyup', (e) => {
    activeKeys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    activeKeys.clear();
  });

  function attemptLogin() {
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('btn-login-submit');
    const authErrorMsg = document.getElementById('auth-error-msg');

    if (!loginEmail || !loginPassword || !loginBtn || !authErrorMsg) return;

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    if (!email || !password) {
      authErrorMsg.textContent = "Please enter both email and password.";
      authErrorMsg.classList.remove('hidden');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing In...";
    authErrorMsg.classList.add('hidden');

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        authErrorMsg.classList.add('hidden');
      })
      .catch(err => {
        console.error("Authentication failed:", err);
        authErrorMsg.textContent = err.message;
        authErrorMsg.classList.remove('hidden');
      })
      .finally(() => {
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
      });
  }

  if (loginBtn) loginBtn.addEventListener('click', attemptLogin);
  if (loginPassword) {
    loginPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      auth.signOut().then(() => {
        location.reload();
      });
    });
  }

  renderBoard();
  applyTransform();

  requestAnimationFrame(() => {
    centerDiagram();
  });

  setTimeout(hideSplashScreen, 1500);
});

let dbSyncAttached = false;
let initialSyncDone = false;

function initDatabaseSync() {
  if (dbSyncAttached || !window.boardRef) return;
  dbSyncAttached = true;

  const connectedRef = db.ref(".info/connected");
  connectedRef.on('value', (snap) => {
    if (snap.val() === false) {
      setSaveStatus('offline');
    } else {
      setSaveStatus('synced', state.lastModified);
    }
  });

  window.boardRef.on('value', (snapshot) => {
    const cloudData = snapshot.val();
    if (cloudData && Array.isArray(cloudData.nodes) && Array.isArray(cloudData.edges)) {
      if (state.isDraggingGroup) return;

      const cloudTimestamp = cloudData.lastModified || 0;

      // Our own writes echo straight back through this listener with the same
      // timestamp and identical data; skip the redundant full re-render.
      if (initialSyncDone && cloudTimestamp === state.lastModified) {
        setSaveStatus('synced', cloudTimestamp);
        hideSplashScreen();
        return;
      }

      if (cloudTimestamp >= state.lastModified) {
        isIncomingSync = true;
        state.nodes = cloudData.nodes.map(normalizeNode);
        state.edges = cloudData.edges.map(normalizeEdge);
        state.tasks = normalizeTasks(cloudData.tasks);
        state.lastModified = cloudTimestamp;

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
            nodes: state.nodes,
            edges: state.edges,
            tasks: state.tasks,
            view: state.view,
            lastModified: state.lastModified
          }));
        } catch (e) {}

        renderBoard();
        renderActivePage();
        isIncomingSync = false;
        setSaveStatus('synced', cloudTimestamp);

        if (!initialSyncDone) {
          initialSyncDone = true;
          centerDiagram();
        }
      }
    } else {
      commitState(true);
      if (!initialSyncDone) {
        initialSyncDone = true;
        centerDiagram();
      }
    }
    hideSplashScreen();
  }, (err) => {
    console.error("Firebase sync error:", err);
    setSaveStatus('error');
    hideSplashScreen();
  });
}

auth.onAuthStateChanged((user) => {
  const authModal = document.getElementById('auth-modal');
  const userDisplayEmail = document.getElementById('user-display-email');
  const avatarContainer = document.getElementById('sidebar-user-avatar-container');

  if (user) {
    if (authModal) authModal.classList.add('hidden');
    if (userDisplayEmail) userDisplayEmail.textContent = user.email ? user.email.split('@')[0] : 'Member';
    
    if (avatarContainer) {
      const photoUrl = user.photoURL || USER_AVATAR_MAP[user.uid];
      if (photoUrl) {
        avatarContainer.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="w-full h-full object-cover" />`;
      } else {
        avatarContainer.innerHTML = `<i class="fa-solid fa-user"></i>`;
      }
    }

    initDatabaseSync();
  } else {
    if (authModal) authModal.classList.remove('hidden');
    setSaveStatus('offline');
    hideSplashScreen();
  }
});