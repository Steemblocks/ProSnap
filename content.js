/**
 * PrimeShot Content Script
 * 2026 Professional Edition
 *
 * Uses dynamic imports for modular architecture
 */

// Debug mode - set to false for production
const DEBUG = false;
const log = (...args) => DEBUG && console.log("[PrimeShot]", ...args);

// --- Dynamic Module Loading ---
let STATE, CONSTANTS, ELEMENTS_CONTENT, initializeElements;
let initToast, showToast, clipboardCopy, addStyles, TextExtractionManager;
let isLoadingModules = false; // Flag to prevent race conditions

// Initialize modules
async function loadModules() {
  try {
    const stateModule = await import("./src/shared/state.js");
    STATE = stateModule.STATE;
    CONSTANTS = stateModule.CONSTANTS;
    ELEMENTS_CONTENT = stateModule.ELEMENTS_CONTENT;
    initializeElements = stateModule.initializeElements;

    const toastModule = await import("./src/utils/toast.js");
    initToast = toastModule.initToast;
    showToast = toastModule.showToast;

    const clipboardModule = await import("./src/utils/clipboard.js");
    clipboardCopy = clipboardModule.copyToClipboard;

    const domModule = await import("./src/utils/dom.js");
    addStyles = domModule.addStyles;

    const textExtractionModule =
      await import("./src/features/text-extraction/index.js");
    TextExtractionManager = textExtractionModule.TextExtractionManager;

    log("All modules loaded successfully");
    return true;
  } catch (err) {
    console.error("[Content.js] Failed to load modules:", err);
    return false;
  }
}

// --- DOM Elements (Will be initialized by modular system) ---
let elements = {};
let screenshotImage = null;
let textExtractor = null;

// --- Icons (SVGs) ---
const ICONS = {
  pen: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  line: `<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  rect: `<svg viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/></svg>`,
  circle: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  highlight: `<svg viewBox="0 0 24 24"><path d="M6 14l3 3v5h6v-5l3-3V9H6v5zm2-3h8v2.17l-2 2V20h-4v-4.83l-2-2V11zm1-9h6v2H9V2z"/></svg>`,
  blur: `<svg viewBox="0 0 24 24"><path d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-3 .5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM6 5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm15 5.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM14 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-3.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zm-11 10c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm7 7c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm0-17c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5zM10 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0 5.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm8 .5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm3 8.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM14 17c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 3.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-4-12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 8.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm4-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/></svg>`,
  text: `<svg viewBox="0 0 24 24"><path d="M5 4v3h5v12h3V7h5V4H5z"/></svg>`,
  undo: `<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>`,
  save: `<svg viewBox="0 0 24 24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
  print: `<svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  reselect: `<svg viewBox="0 0 24 24"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>`,
  fullpage: `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
  extract: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
};

// --- UI Constants ---
const COLORS = [
  "#d60000",
  "#00d605",
  "#0055d6",
  "#fff500",
  "#000000",
  "#ffffff",
];

const FONTS = [
  "Arial",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Comic Sans MS",
  "Impact",
];

const SHORTCUTS = {
  p: "pen",
  l: "line",
  a: "arrow",
  r: "rect",
  c: "circle",
  h: "highlight",
  b: "blur",
  t: "text",
  s: "select",
};

// --- Initialization ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log("Message received:", request.action);
  if (request.action === "init_screenshot") {
    // Load modules if not already loaded
    if (!STATE && !isLoadingModules) {
      isLoadingModules = true;
      loadModules().then((success) => {
        isLoadingModules = false;
        if (success) {
          init(request.dataUrl);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Failed to load modules" });
        }
      });
    } else if (isLoadingModules) {
      // Modules are currently loading, wait for them
      const checkInterval = setInterval(() => {
        if (STATE && !isLoadingModules) {
          clearInterval(checkInterval);
          init(request.dataUrl);
          sendResponse({ success: true });
        }
      }, 50);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!STATE) {
          sendResponse({ success: false, error: "Module loading timeout" });
        }
      }, 5000);
    } else {
      init(request.dataUrl);
      sendResponse({ success: true });
    }
  }
  return true; // Keep message channel open for async response
});

function init(dataUrl) {
  log("Initializing with modular architecture...");

  if (STATE.isActive) {
    log("Already active, skipping");
    return;
  }

  // 1. Initialize DOM elements using modular system
  const initResult = initializeElements(true);
  if (!initResult) {
    console.error("[Content.js] Failed to initialize elements");
    return;
  }

  // 2. Update local elements reference
  elements = ELEMENTS_CONTENT;

  // 3. Set STATE flags
  STATE.isActive = true;
  STATE.selection = null;
  STATE.annotations = [];
  STATE.mode = "select";

  // 4. Initialize toast system
  if (!initToast(ELEMENTS_CONTENT.toast)) {
    console.error("[Content.js] Failed to initialize toast");
  }

  // Load tool preferences
  chrome.storage.local.get("visibleTools", (data) => {
    STATE.visibleTools = data.visibleTools || {
      pen: true,
      line: true,
      arrow: true,
      rect: true,
      circle: true,
      highlight: true,
      blur: true,
      text: true,
    };
  });

  // 5. Load and display screenshot
  screenshotImage = new Image();
  screenshotImage.onload = () => {
    log("Screenshot image loaded");
    // Elements are already in shadow DOM from initializeElements()
    draw();
    setupEvents();
    log("Ready! Draw a rectangle to select an area.");
  };
  screenshotImage.onerror = (e) => {
    console.error("[Content.js] Failed to load screenshot image", e);
    cleanup();
  };
  screenshotImage.src = dataUrl;

  // 6. Initialize text extraction manager if not already done
  if (!textExtractor) {
    textExtractor = new TextExtractionManager(
      ELEMENTS_CONTENT.overlay,
      ELEMENTS_CONTENT.canvas,
      true, // isContentScript = true
    );
  }
}

// --- Event Handling ---
function setupEvents() {
  // Events on canvas/overlay work fine
  elements.canvas.addEventListener("mousedown", onMouseDown);
  // Global events need care.
  // 'mousemove' on window still fires, but we need to coordinate coordinates?
  // clientX/Y are viewport relative, so they work fine even with shadow DOM.
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  document.addEventListener("keydown", onKeyDown);
}

function cleanup() {
  // Remove shadow hosts (handle both old and new naming)
  const host = document.getElementById("primeshot-host");
  const shadowHost = document.getElementById("primeshot-shadow-host");
  if (host) host.remove();
  if (shadowHost) shadowHost.remove();

  // Clear element references
  if (elements.canvas) {
    elements.canvas.removeEventListener("mousedown", onMouseDown);
  }
  elements.overlay = null;
  elements.canvas = null;
  elements.ctx = null;
  elements.shadow = null;
  elements.textInput = null;

  STATE.isActive = false;
  STATE.selection = null;
  STATE.annotations = [];

  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("keydown", onKeyDown);

  // Clean up text extractor to prevent memory leaks
  if (textExtractor) {
    textExtractor.cleanup?.(); // Call cleanup if it exists
    textExtractor = null;
  }
}

// --- Helper Functions ---

/**
 * Check if a point is inside the current selection
 */
function isPointInSelection(x, y) {
  if (!STATE.selection) return false;
  const s = STATE.selection;
  return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
}

/**
 * Get canvas-relative coordinates from a mouse event
 * In content.js, we use viewport coordinates directly since canvas is fullscreen
 */
function getCanvasCoords(e) {
  // For content.js, the canvas is fullscreen and positioned at (0,0)
  // so clientX/Y are already canvas-relative
  return { x: e.clientX, y: e.clientY };
}

function onMouseDown(e) {
  STATE.startPos = { x: e.clientX, y: e.clientY };
  STATE.currentPos = { x: e.clientX, y: e.clientY };

  // Check resize handles first
  const handle = getResizeHandle(e.clientX, e.clientY);
  if (handle) {
    STATE.isResizing = true;
    STATE.resizeHandle = handle;
    hideToolbars();
    return;
  }

  // Check if Inside Selection
  const isInside = STATE.selection && isPointInSelection(e.clientX, e.clientY);

  if (isInside) {
    if (STATE.mode === "text") {
      createTextInput(e.clientX, e.clientY);
    } else if (STATE.mode === "select") {
      // MOVE SELECTION
      STATE.isMoving = true;
      STATE.dragStart = { x: e.clientX, y: e.clientY };
      STATE.initialSel = { ...STATE.selection };
      hideToolbars();
    } else {
      // DRAWING
      STATE.isDrawing = true;
      startAnnotation(e.clientX, e.clientY);
    }
  } else {
    // Outside Selection: Start new selection if we are in select mode
    if (!STATE.selection || STATE.mode === "select") {
      STATE.isSelecting = true;
      STATE.selection = { x: e.clientX, y: e.clientY, w: 0, h: 0 };
      STATE.annotations = [];
      hideToolbars();
    }
  }

  draw();
}

function onMouseMove(e) {
  const x = e.clientX;
  const y = e.clientY;
  STATE.currentPos = { x, y };

  if (STATE.isResizing && STATE.selection) {
    const s = STATE.selection;
    const h = STATE.resizeHandle;

    if (h.includes("l")) {
      const oldRight = s.x + s.w;
      s.x = x;
      s.w = oldRight - x;
    }
    if (h.includes("r")) {
      s.w = x - s.x;
    }
    if (h.includes("t")) {
      const oldBottom = s.y + s.h;
      s.y = y;
      s.h = oldBottom - y;
    }
    if (h.includes("b")) {
      s.h = y - s.y;
    }
    draw();
    return;
  }

  // Handle Moving
  if (STATE.isMoving && STATE.selection) {
    const dx = x - STATE.dragStart.x;
    const dy = y - STATE.dragStart.y;
    STATE.selection.x = STATE.initialSel.x + dx;
    STATE.selection.y = STATE.initialSel.y + dy;
    draw();
    return;
  }

  if (STATE.mode === "select" && STATE.isSelecting) {
    STATE.selection.w = x - STATE.startPos.x;
    STATE.selection.h = y - STATE.startPos.y;
    draw();
  } else if (STATE.isDrawing) {
    updateAnnotation(x, y);
    draw();
  }
}

function onMouseUp(e) {
  if (STATE.isResizing) {
    STATE.isResizing = false;
    STATE.resizeHandle = null;
    normalizeSelection();
    showToolbars();
    draw();
    return;
  }

  if (STATE.isMoving) {
    STATE.isMoving = false;
    showToolbars();
    draw();
    return;
  }

  if (STATE.isSelecting) {
    STATE.isSelecting = false;
    normalizeSelection();
    if (Math.abs(STATE.selection.w) > 10 && Math.abs(STATE.selection.h) > 10) {
      // Stay in select mode
      showToolbars();
    } else {
      STATE.selection = null;
      draw();
    }
  } else if (STATE.isDrawing) {
    STATE.isDrawing = false;
    finishAnnotation();
    draw();
  }
}

function normalizeSelection() {
  if (!STATE.selection) return;
  let { x, y, w, h } = STATE.selection;
  if (w < 0) {
    x += w;
    w = Math.abs(w);
  }
  if (h < 0) {
    y += h;
    h = Math.abs(h);
  }
  STATE.selection = { x, y, w, h };
}

function onKeyDown(e) {
  // Don't handle shortcuts if typing in text input
  if (elements.textInput && document.activeElement === elements.textInput) {
    return;
  }

  // Escape to cancel/close
  if (e.key === "Escape") {
    if (elements.textInput) {
      elements.textInput.value = "";
      elements.textInput.blur();
    } else {
      cleanup();
    }
    return;
  }

  // Ctrl+Z to undo
  if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    undo();
    draw();
    return;
  }

  // Save with Ctrl+S or Cmd+S
  if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    saveScreenshot();
    return;
  }

  // Copy with Ctrl+C or Cmd+C
  if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    copyToClipboard();
    return;
  }

  // Tool shortcuts - work anytime when not typing in text input
  const key = e.key.toLowerCase();
  if (SHORTCUTS[key]) {
    e.preventDefault();
    setMode(SHORTCUTS[key]);
    // Update toolbar buttons
    if (elements.shadow) {
      const buttons = elements.shadow.querySelectorAll(
        ".primeshot-btn[data-mode]",
      );
      buttons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === SHORTCUTS[key]);
      });
    }
  }
}

// --- Annotation System ---

function startAnnotation(x, y) {
  const type = STATE.mode;
  const color = STATE.color;
  const lw = STATE.lineWidth;

  if (type === "pen") {
    STATE.currentAnnotation = { type, color, lw, points: [{ x, y }] };
  } else if (
    type === "line" ||
    type === "arrow" ||
    type === "rect" ||
    type === "circle" ||
    type === "highlight" ||
    type === "blur"
  ) {
    STATE.currentAnnotation = {
      type,
      color,
      lw,
      start: { x, y },
      end: { x, y },
    };
  } else if (type === "text") {
    // Create text input at pos
    createTextInput(x, y);
    STATE.isDrawing = false; // Input handles itself
  }
}

function updateAnnotation(x, y) {
  if (!STATE.currentAnnotation) return;

  if (STATE.currentAnnotation.type === "pen") {
    STATE.currentAnnotation.points.push({ x, y });
  } else {
    STATE.currentAnnotation.end = { x, y };
  }
}

function finishAnnotation() {
  if (!STATE.currentAnnotation) return;

  const ann = STATE.currentAnnotation;
  let shouldSave = true;

  // Validate based on annotation type (match editor.js behavior)
  if (ann.type === "pen") {
    shouldSave = ann.points && ann.points.length > 1;
  } else if (ann.type === "line" || ann.type === "arrow") {
    const dx = ann.end.x - ann.start.x;
    const dy = ann.end.y - ann.start.y;
    shouldSave = Math.abs(dx) > 5 || Math.abs(dy) > 5;
  } else if (ann.type === "rect" || ann.type === "highlight") {
    const w = Math.abs(ann.end.x - ann.start.x);
    const h = Math.abs(ann.end.y - ann.start.y);
    shouldSave = w > 5 && h > 5;
  } else if (ann.type === "circle") {
    const rx = Math.abs(ann.end.x - ann.start.x) / 2;
    const ry = Math.abs(ann.end.y - ann.start.y) / 2;
    shouldSave = rx > 3 && ry > 3;
  } else if (ann.type === "blur") {
    const w = Math.abs(ann.end.x - ann.start.x);
    const h = Math.abs(ann.end.y - ann.start.y);
    shouldSave = w > 10 && h > 10;
  } else if (ann.type === "text") {
    shouldSave = ann.text && ann.text.trim().length > 0;
  }

  if (shouldSave) {
    STATE.annotations.push(ann);
  }
  STATE.currentAnnotation = null;
}

function undo() {
  if (STATE.annotations.length > 0) {
    STATE.annotations.pop();
    // Note: caller is responsible for calling draw()
  }
}

// --- Drawing ---

function draw() {
  try {
    const ctx = elements.ctx;
    const cvs = elements.canvas;

    // prevent errors if cleanup happened
    if (!ctx || !cvs || !screenshotImage) return;

    // Clear
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // 1. Draw Original Image (Full)
    // We strictly want to draw the image such that it fits the browser window logic.
    // The dataUrl is usually the full resolution capture.
    ctx.drawImage(screenshotImage, 0, 0, window.innerWidth, window.innerHeight);

    // 2. Draw Dim Layer
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // 3. Clear rect for selection (make it bright)
    if (STATE.selection) {
      const { x, y, w, h } = STATE.selection;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      // Redraw image inside selection to make it bright
      ctx.drawImage(
        screenshotImage,
        0,
        0,
        window.innerWidth,
        window.innerHeight,
      );

      // 4. Draw Annotations (Only visible inside selection?)
      // Standard behavior is annotations are essentially part of the image, so they should be visible anywhere?
      // But in Lightshot, they are specific to the capture.
      // Let's render ALL annotations, but they will look weird if inside dimmed area.
      // Actually, let's JUST render them. If they are outside, they are on top of dim.
      // Wait, usually you only annotate the selected area.
      // For visual clarity, let's just draw them.
      renderAnnotations(ctx);
      if (STATE.currentAnnotation)
        renderAnnotation(ctx, STATE.currentAnnotation);

      ctx.restore();

      // Draw Selection Outline
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Draw dimensions
      const dimText = `${Math.round(w)} x ${Math.round(h)}`;
      ctx.fillStyle = "#fff";
      ctx.font =
        "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "#222";
      const tm = ctx.measureText(dimText);
      ctx.fillRect(x, y - 25, tm.width + 10, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(dimText, x + 5, y - 11);

      drawHandles(ctx);
    }
  } catch (err) {
    console.error("[PrimeShot] Draw error:", err);
  }
}

function renderAnnotations(ctx) {
  STATE.annotations.forEach((ann) => renderAnnotation(ctx, ann));
}

function renderAnnotation(ctx, ann) {
  ctx.beginPath();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = ann.color;

  if (ann.type === "pen") {
    if (ann.points.length < 2) return;
    ctx.moveTo(ann.points[0].x, ann.points[0].y);
    for (let i = 1; i < ann.points.length; i++)
      ctx.lineTo(ann.points[i].x, ann.points[i].y);
    ctx.stroke();
  } else if (ann.type === "line") {
    ctx.moveTo(ann.start.x, ann.start.y);
    ctx.lineTo(ann.end.x, ann.end.y);
    ctx.stroke();
  } else if (ann.type === "arrow") {
    drawArrow(ctx, ann.start.x, ann.start.y, ann.end.x, ann.end.y);
  } else if (ann.type === "rect") {
    const w = ann.end.x - ann.start.x;
    const h = ann.end.y - ann.start.y;
    ctx.strokeRect(ann.start.x, ann.start.y, w, h);
  } else if (ann.type === "circle") {
    // Draw ellipse
    const cx = (ann.start.x + ann.end.x) / 2;
    const cy = (ann.start.y + ann.end.y) / 2;
    const rx = Math.abs(ann.end.x - ann.start.x) / 2;
    const ry = Math.abs(ann.end.y - ann.start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (ann.type === "highlight") {
    // Semi-transparent highlight
    ctx.globalAlpha = 0.4;
    const w = ann.end.x - ann.start.x;
    const h = ann.end.y - ann.start.y;
    ctx.fillRect(ann.start.x, ann.start.y, w, h);
    ctx.globalAlpha = 1.0;
  } else if (ann.type === "blur") {
    // Pixelated blur effect
    const x = Math.min(ann.start.x, ann.end.x);
    const y = Math.min(ann.start.y, ann.end.y);
    const w = Math.abs(ann.end.x - ann.start.x);
    const h = Math.abs(ann.end.y - ann.start.y);
    if (w > 0 && h > 0) {
      // Get the image data and pixelate
      try {
        const pixelSize = 10;
        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;

        for (let py = 0; py < h; py += pixelSize) {
          for (let px = 0; px < w; px += pixelSize) {
            // Get average color of pixel block
            let r = 0,
              g = 0,
              b = 0,
              count = 0;
            for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
                const i = ((py + dy) * w + (px + dx)) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
              }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);

            // Apply average to all pixels in block
            for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
                const i = ((py + dy) * w + (px + dx)) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
              }
            }
          }
        }
        ctx.putImageData(imageData, x, y);
      } catch (e) {
        // Fallback: draw a gray box if we can't access image data
        ctx.fillStyle = "#888";
        ctx.fillRect(x, y, w, h);
      }
    }
  } else if (ann.type === "text") {
    const fontSize = ann.fontSize || 20;
    const fontFamily = ann.font || "Arial";
    ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = "top";
    // Handle multi-line
    const lineHeight = fontSize * 1.2;
    const lines = ann.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], ann.x, ann.y + i * lineHeight);
    }
  }
}

function drawArrow(ctx, x1, y1, x2, y2) {
  const headLength = 15;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.lineTo(x2, y2);
  ctx.fill();
}

// --- Text Input ---
function createTextInput(x, y) {
  log("Creating text input at", x, y);

  // Remove existing text input if any
  if (elements.textInput) {
    elements.textInput.remove();
    elements.textInput = null;
  }

  const input = document.createElement("textarea");
  input.id = "primeshot-text-input";
  input.className = "primeshot-text-input";
  input.style.left = x + "px";
  input.style.top = y + "px";
  input.style.color = STATE.color;
  input.style.fontFamily = STATE.font;
  input.style.fontSize = STATE.fontSize + "px";
  input.placeholder = "Type here...";

  // Prevent event propagation to avoid triggering canvas events
  input.addEventListener("mousedown", (e) => e.stopPropagation());
  input.addEventListener("click", (e) => e.stopPropagation());

  input.addEventListener("blur", () => {
    // Small delay to prevent immediate blur on creation
    setTimeout(() => confirmText(input, x, y), 50);
  });

  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // Prevent global keydown handler
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = ""; // Clear and cancel
      input.blur();
    }
  });

  // Append to overlay (which is in Shadow DOM)
  elements.overlay.appendChild(input);

  // Focus with a small delay to ensure DOM is ready
  setTimeout(() => {
    input.focus();
    log("Text input focused");
  }, 10);

  elements.textInput = input;
}

function confirmText(input, x, y) {
  // Prevent double-processing
  if (!input || !input.parentNode) return;

  const text = input.value.trim();
  if (text) {
    STATE.annotations.push({
      type: "text",
      text: text,
      color: STATE.color,
      font: STATE.font,
      fontSize: STATE.fontSize,
      x: x,
      y: y,
      lw: 1,
    });
    log("Text annotation added:", text);
    draw();
  }

  input.remove();
  elements.textInput = null;
}

// --- Selection Actions ---
function selectFullPage() {
  // Select entire visible viewport
  const padding = 5; // Small padding from edges
  STATE.selection = {
    x: padding,
    y: padding,
    w: window.innerWidth - padding * 2,
    h: window.innerHeight - padding * 2,
  };
  STATE.mode = "pen";
  STATE.annotations = [];
  hideToolbars();
  showToolbars();
  draw();
}

function startReselect() {
  // Clear current selection and switch to select mode
  STATE.selection = null;
  STATE.mode = "select";
  STATE.annotations = [];
  hideToolbars();
  draw();
}

// --- Toolbars ---
function showToolbars() {
  hideToolbars();

  const { x, y, w, h } = STATE.selection;
  const gap = 10;

  // Vertical Toolbar (Tools) - Right side of selection
  elements.toolbarVert = document.createElement("div");
  elements.toolbarVert.className =
    "primeshot-toolbar primeshot-toolbar-vertical";

  // Smart Positioning: Vertical
  // Default Right -> Flip Left if overflow -> Fit Inside/Right if both fail
  const vWidth = 100;
  const vHeight = 400; // Estimate
  let vLeft = x + w + gap;

  if (vLeft + vWidth > window.innerWidth) {
    vLeft = x - vWidth - gap;
    if (vLeft < 0) {
      vLeft = window.innerWidth - vWidth - gap;
    }
  }

  // Vertical Y: Default Top -> Flip Up if overflow bottom
  let vTop = y;
  if (vTop < 0) vTop = gap;
  if (vTop + vHeight > window.innerHeight) {
    vTop = window.innerHeight - vHeight - gap;
    if (vTop < 0) vTop = gap;
  }

  // Final Safety Clamp
  vLeft = Math.max(gap, Math.min(vLeft, window.innerWidth - vWidth - gap));
  vTop = Math.max(gap, Math.min(vTop, window.innerHeight - vHeight - gap));

  elements.toolbarVert.style.left = vLeft + "px";
  elements.toolbarVert.style.top = vTop + "px";

  // Tool buttons in grid layout
  const allTools = [
    { id: "pen", icon: ICONS.pen, title: "Pen (P)" },
    { id: "line", icon: ICONS.line, title: "Line (L)" },
    { id: "arrow", icon: ICONS.arrow, title: "Arrow (A)" },
    { id: "rect", icon: ICONS.rect, title: "Rectangle (R)" },
    { id: "circle", icon: ICONS.circle, title: "Circle (C)" },
    { id: "highlight", icon: ICONS.highlight, title: "Highlight (H)" },
    { id: "blur", icon: ICONS.blur, title: "Blur (B)" },
    { id: "text", icon: ICONS.text, title: "Text (T)" },
  ];

  const tools = STATE.visibleTools
    ? allTools.filter((t) => STATE.visibleTools[t.id])
    : allTools;

  const toolGrid = document.createElement("div");
  toolGrid.className = "primeshot-tool-grid";

  tools.forEach((t) => {
    const btn = createBtn(t.icon, () => setMode(t.id), t.id === STATE.mode);
    btn.dataset.mode = t.id;
    btn.title = t.title || t.id.charAt(0).toUpperCase() + t.id.slice(1);
    toolGrid.appendChild(btn);
  });
  elements.toolbarVert.appendChild(toolGrid);

  // Divider & Color Picker...
  const div = document.createElement("div");
  div.className = "primeshot-divider";
  elements.toolbarVert.appendChild(div);

  const colorContainer = document.createElement("div");
  colorContainer.className = "primeshot-color-picker";
  COLORS.forEach((c) => {
    const dot = document.createElement("div");
    dot.className = "primeshot-color-dot";
    dot.style.backgroundColor = c;
    if (c === STATE.color) dot.classList.add("active");
    dot.addEventListener("click", () => setColor(c, dot));
    colorContainer.appendChild(dot);
  });

  // Custom Color...
  const customColorWrapper = document.createElement("div");
  customColorWrapper.className = "primeshot-custom-color";
  customColorWrapper.title = "Pick custom color";
  const customColorInput = document.createElement("input");
  customColorInput.type = "color";
  customColorInput.className = "primeshot-color-input";
  customColorInput.value = STATE.color;
  customColorInput.addEventListener("input", (e) => {
    STATE.color = e.target.value;
    if (elements.shadow) {
      const dots = elements.shadow.querySelectorAll(".primeshot-color-dot");
      dots.forEach((d) => d.classList.remove("active"));
    }
    if (elements.textInput) elements.textInput.style.color = STATE.color;
  });
  customColorInput.addEventListener("mousedown", (e) => e.stopPropagation());
  customColorInput.addEventListener("click", (e) => e.stopPropagation());
  customColorWrapper.appendChild(customColorInput);
  colorContainer.appendChild(customColorWrapper);
  elements.toolbarVert.appendChild(colorContainer);

  // Font Picker...
  elements.toolbarVert.appendChild(div.cloneNode());
  const fontContainer = document.createElement("div");
  fontContainer.className = "primeshot-font-picker";
  const fontSelect = document.createElement("select");
  fontSelect.className = "primeshot-font-select";
  fontSelect.title = "Select Font";
  FONTS.forEach((f) => {
    const option = document.createElement("option");
    option.value = f;
    option.textContent = f;
    option.style.fontFamily = f;
    if (f === STATE.font) option.selected = true;
    fontSelect.appendChild(option);
  });
  fontSelect.addEventListener("change", (e) => {
    STATE.font = e.target.value;
    if (elements.textInput) elements.textInput.style.fontFamily = STATE.font;
  });
  fontSelect.addEventListener("mousedown", (e) => e.stopPropagation());
  fontSelect.addEventListener("click", (e) => e.stopPropagation());
  fontContainer.appendChild(fontSelect);
  elements.toolbarVert.appendChild(fontContainer);

  // Line Width...
  elements.toolbarVert.appendChild(div.cloneNode());
  const lineWidthContainer = document.createElement("div");
  lineWidthContainer.className = "primeshot-line-width";
  const lineWidthLabel = document.createElement("span");
  lineWidthLabel.className = "primeshot-line-width-label";
  lineWidthLabel.textContent = "Size";
  const lineWidthSlider = document.createElement("input");
  lineWidthSlider.type = "range";
  lineWidthSlider.className = "primeshot-line-width-slider";
  lineWidthSlider.min = "1";
  lineWidthSlider.max = "20";
  lineWidthSlider.value = STATE.lineWidth;
  lineWidthSlider.title = "Line Width: " + STATE.lineWidth + "px";
  lineWidthSlider.addEventListener("input", (e) => {
    STATE.lineWidth = parseInt(e.target.value);
    lineWidthSlider.title = "Line Width: " + STATE.lineWidth + "px";
  });
  lineWidthSlider.addEventListener("mousedown", (e) => e.stopPropagation());
  lineWidthContainer.appendChild(lineWidthLabel);
  lineWidthContainer.appendChild(lineWidthSlider);
  elements.toolbarVert.appendChild(lineWidthContainer);

  // Undo
  elements.toolbarVert.appendChild(div.cloneNode());
  elements.toolbarVert.appendChild(createBtn(ICONS.undo, undo));

  // Horizontal Toolbar (Actions) - Position BELOW selection, never overlapping with vertical
  elements.toolbarHoriz = document.createElement("div");
  elements.toolbarHoriz.className =
    "primeshot-toolbar primeshot-toolbar-horizontal";

  // Smart Positioning: Horizontal
  const hWidth = 320;
  const hHeight = 50;

  // Default Right Aligned -> Shift Left if overflow
  let hLeft = x + w - hWidth;
  if (hLeft < 0) hLeft = 10;
  if (hLeft + hWidth > window.innerWidth) {
    hLeft = window.innerWidth - hWidth - gap;
  }

  // Default Bottom -> Flip Top if overflow
  let hTop = y + h + gap;
  if (hTop + hHeight > window.innerHeight) {
    hTop = y - hHeight - gap;
    if (hTop < 0) {
      hTop = window.innerHeight - hHeight - gap;
    }
  }

  // Final Safety Clamp
  hLeft = Math.max(gap, Math.min(hLeft, window.innerWidth - hWidth - gap));
  hTop = Math.max(gap, Math.min(hTop, window.innerHeight - hHeight - gap));

  elements.toolbarHoriz.style.left = hLeft + "px";
  elements.toolbarHoriz.style.top = hTop + "px";

  const actions = [
    {
      id: "extract",
      icon: ICONS.extract,
      action: () => {
        if (!STATE.selection || STATE.selection.w === 0) {
          showToast("Select an area first");
          return;
        }
        const canvas = getFinalCanvas();
        textExtractor.extract(canvas);
      },
      title: "Extract Text",
    },
    {
      id: "fullpage",
      icon: ICONS.fullpage,
      action: selectFullPage,
      title: "Full Page",
    },
    {
      id: "reselect",
      icon: ICONS.reselect,
      action: startReselect,
      title: "Reselect Area",
    },
    { id: "save", icon: ICONS.save, action: saveScreenshot, title: "Save" },
    { id: "copy", icon: ICONS.copy, action: copyScreenshot, title: "Copy" },
    { id: "print", icon: ICONS.print, action: printScreenshot, title: "Print" },
    { id: "close", icon: ICONS.close, action: cleanup, title: "Close" },
  ];

  actions.forEach((a) => {
    const btn = createBtn(a.icon, a.action);
    btn.title = a.title;
    elements.toolbarHoriz.appendChild(btn);
    if (a.id !== "close") {
      const d = document.createElement("div");
      d.className = "primeshot-divider";
      elements.toolbarHoriz.appendChild(d);
    }
  });

  elements.overlay.appendChild(elements.toolbarVert);
  elements.overlay.appendChild(elements.toolbarHoriz);
}

function hideToolbars() {
  if (elements.toolbarVert) elements.toolbarVert.remove();
  if (elements.toolbarHoriz) elements.toolbarHoriz.remove();
  elements.toolbarVert = null;
  elements.toolbarHoriz = null;
}

function createBtn(html, onClick, isActive) {
  const btn = document.createElement("button");
  btn.className = "primeshot-btn";
  if (isActive) btn.classList.add("active");

  // Use text/html parser which handles SVGs without explicit xmlns
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const svg = doc.body.firstElementChild;
  if (svg) {
    btn.appendChild(btn.ownerDocument.importNode(svg, true));
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent drawing
    onClick();
  });
  return btn;
}

function setMode(m) {
  if (STATE.mode === m) {
    STATE.mode = "select";
  } else {
    STATE.mode = m;
  }

  // Update UI active state logic
  if (elements.toolbarVert) {
    Array.from(elements.toolbarVert.querySelectorAll(".primeshot-btn")).forEach(
      (b) => {
        if (b.dataset.mode) {
          if (b.dataset.mode === STATE.mode) b.classList.add("active");
          else b.classList.remove("active");
        }
      },
    );
  }
}

function setColor(c, dotEl) {
  STATE.color = c;
  // Query within Shadow DOM instead of document
  if (elements.shadow) {
    const dots = elements.shadow.querySelectorAll(".primeshot-color-dot");
    dots.forEach((d) => d.classList.remove("active"));
  }
  dotEl.classList.add("active");

  // Update text input color if active
  if (elements.textInput) elements.textInput.style.color = c;
}

// --- Text Extraction (Modular - handled by TextExtractionManager) ---
// See: src/features/text-extraction/index.js

// --- Action Functions ---

function getFinalCanvas() {
  const { x, y, w, h } = STATE.selection;
  const dpr = window.devicePixelRatio || 1;
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = w * dpr;
  finalCanvas.height = h * dpr;
  const fCtx = finalCanvas.getContext("2d");

  // Draw the image section from the source canvas (which is already high-res)
  // Source coordinates are in pixels (x * dpr, etc)
  fCtx.drawImage(
    elements.canvas,
    x * dpr,
    y * dpr,
    w * dpr,
    h * dpr,
    0,
    0,
    w * dpr,
    h * dpr,
  );

  return finalCanvas;
}

function saveScreenshot() {
  const cvs = getFinalCanvas();
  const link = document.createElement("a");
  link.download = `screenshot_${Date.now()}.png`;
  link.href = cvs.toDataURL();
  link.click();
  showToast("Screenshot Saved!");
  setTimeout(cleanup, 1000);
}

function printScreenshot() {
  const cvs = getFinalCanvas();
  const dataUrl = cvs.toDataURL("image/png");

  // Open a new window for printing
  const printWindow = window.open("", "_blank", "width=800,height=600");

  if (!printWindow) {
    showToast("Popup blocked! Please allow popups.");
    return;
  }

  const doc = printWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Screenshot - PrimeShot</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f5f5f5;
          padding: 20px;
        }
        img {
          max-width: 100%;
          max-height: 100vh;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        @media print {
          body { background: white; padding: 0; }
          img { box-shadow: none; max-width: 100%; height: auto; }
        }
      </style>
    </head>
    <body></body>
    </html>
  `);
  doc.close();

  const img = doc.createElement("img");
  img.alt = "Screenshot";
  img.src = dataUrl;
  img.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  doc.body.appendChild(img);

  showToast("Opening print dialog...");
}

// --- Clipboard Operations (Modular - see utils/clipboard.js) ---

// Wrapper for screenshot copying (screenshot-specific, not text copying)
async function copyScreenshot() {
  try {
    // Validate selection exists and has valid dimensions
    if (
      !STATE.selection ||
      STATE.selection.w === 0 ||
      STATE.selection.h === 0
    ) {
      showToast("No selection to copy");
      return;
    }

    const cvs = getFinalCanvas();
    const blob = await new Promise((resolve, reject) => {
      cvs.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      }, "image/png");
    });
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    showToast("Copied to Clipboard!");
    setTimeout(cleanup, 1000);
  } catch (err) {
    console.error("Clipboard error:", err);
    showToast("Failed to copy. Check permissions.");
  }
}

// --- Resizing ---
const HANDLE_SIZE = 10;
function getHandleRects(s) {
  const { x, y, w, h } = s;
  const hw = HANDLE_SIZE / 2;
  return [
    { id: "tl", x: x - hw, y: y - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
    { id: "tm", x: x + w / 2 - hw, y: y - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
    { id: "tr", x: x + w - hw, y: y - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
    { id: "ml", x: x - hw, y: y + h / 2 - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
    {
      id: "mr",
      x: x + w - hw,
      y: y + h / 2 - hw,
      w: HANDLE_SIZE,
      h: HANDLE_SIZE,
    },
    { id: "bl", x: x - hw, y: y + h - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
    {
      id: "bm",
      x: x + w / 2 - hw,
      y: y + h - hw,
      w: HANDLE_SIZE,
      h: HANDLE_SIZE,
    },
    { id: "br", x: x + w - hw, y: y + h - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
  ];
}

function drawHandles(ctx) {
  if (!STATE.selection) return;
  const handles = getHandleRects(STATE.selection);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  handles.forEach((h) => {
    ctx.fillRect(h.x, h.y, h.w, h.h);
    ctx.strokeRect(h.x, h.y, h.w, h.h);
  });
}

function getResizeHandle(mx, my) {
  if (!STATE.selection) return null;
  const handles = getHandleRects(STATE.selection);
  for (const h of handles) {
    if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
      return h.id;
    }
  }
  return null;
}
