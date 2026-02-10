// PrimeShot Standalone Editor Script
// Matches the inline content.js editor behavior

// Debug mode - set to false for production
const DEBUG = false;
const log = (...args) => DEBUG && console.log("[Editor]", ...args);

// --- State ---
const STATE = {
  mode: "select", // select, pen, line, arrow, rect, circle, highlight, blur, text
  isActive: false, // Editor is active
  isSelecting: false,
  isDrawing: false,
  isDraggingText: false, // For dragging text annotations
  draggedTextIndex: -1, // Index of text being dragged
  dragOffset: { x: 0, y: 0 }, // Offset from text origin to mouse
  selection: null, // {x, y, w, h}
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
  color: "#d60000",
  lineWidth: 3,
  font: "Arial",
  fontSize: 20,
  stepCounter: 1,
  backgroundMode: false,
  annotations: [],
  visibleTools: {
    select: true,
    pen: true,
    line: true,
    arrow: true,
    rect: true,
    circle: true,
    step: true,
    highlight: true,
    blur: true,
    text: true,
  },
};
window.STATE = STATE;

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

// Keyboard shortcuts
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
  n: "step",
};

const ICONS = {
  pen: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  line: `<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  rect: `<svg viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/></svg>`,
  circle: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  highlight: `<svg viewBox="0 0 24 24"><path d="M6 14l3 3v5h6v-5l3-3V9H6v5zm2-3h8v2.17l-2 2V20h-4v-4.83l-2-2V11zm1-9h6v2H9V2z"/></svg>`,
  blur: `<svg viewBox="0 0 24 24"><path d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm12 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/></svg>`,
  text: `<svg viewBox="0 0 24 24"><path d="M5 4v3h5v12h3V7h5V4H5z"/></svg>`,
  extract: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
  undo: `<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>`,
  save: `<svg viewBox="0 0 24 24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
  print: `<svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  reselect: `<svg viewBox="0 0 24 24"><path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>`,
  fullpage: `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
  step: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><text x="12" y="16" font-size="12" text-anchor="middle" fill="#000" font-weight="bold">1</text></svg>`,
  beautify: `<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75-2.75-2.75 2.75 2.75 2.75 2.75-2.75z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.91l-.37-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.37 2.54c-.59.21-1.13.53-1.62.91l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.91l.37 2.54c.04.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.37-2.54c.59-.21 1.13-.53 1.62-.91l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.08-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
};
window.ICONS = ICONS;

// --- Registry for Extensibility ---
window.TOOL_REGISTRY = [
  { id: "pen", icon: ICONS.pen, title: "Pen (P)" },
  { id: "line", icon: ICONS.line, title: "Line (L)" },
  { id: "arrow", icon: ICONS.arrow, title: "Arrow (A)" },
  { id: "rect", icon: ICONS.rect, title: "Rectangle (R)" },
  { id: "circle", icon: ICONS.circle, title: "Circle (C)" },
  { id: "highlight", icon: ICONS.highlight, title: "Highlight (H)" },
  { id: "blur", icon: ICONS.blur, title: "Blur (B)" },
  { id: "text", icon: ICONS.text, title: "Text (T)" },
  { id: "step", icon: ICONS.step, title: "Step Counter (N)" },
];
window.TOOLS = window.TOOLS || {}; // Initialize TOOLS registry if not already done by tool modules
window.RENDERER_REGISTRY = {};
window.TOOL_ON_ACTIVATE = {}; // New hook for tool activation UI (e.g. popups)

let elements = {
  overlay: null,
  canvas: null,
  ctx: null,
  toolbarVert: null,
  toolbarHoriz: null,
  textInput: null,
  toast: null,
};

let screenshotImage = null;

// --- Initialize ---
document.addEventListener("DOMContentLoaded", async () => {
  const data = await chrome.storage.local.get([
    "pendingScreenshot",
    "visibleTools",
  ]);

  if (data.visibleTools) {
    // Merge saved config with defaults to ensure new tools appear
    STATE.visibleTools = { ...STATE.visibleTools, ...data.visibleTools };
  }

  injectSettingsStyles();

  if (!data.pendingScreenshot) {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("no-screenshot").style.display = "block";
    return;
  }

  screenshotImage = new Image();
  screenshotImage.onload = () => {
    init();
    chrome.storage.local.remove("pendingScreenshot");
  };
  screenshotImage.src = data.pendingScreenshot;
});

function init() {
  elements.overlay = document.getElementById("overlay");
  elements.canvas = document.getElementById("canvas");
  elements.ctx = elements.canvas.getContext("2d", { willReadFrequently: true });
  elements.toast = document.getElementById("toast");

  // Set canvas to IMAGE size (1:1 mapping)
  const dpr = window.devicePixelRatio || 1;
  const w = screenshotImage.naturalWidth;
  const h = screenshotImage.naturalHeight;

  elements.canvas.width = w;
  elements.canvas.height = h;
  elements.canvas.style.width = w / dpr + "px";
  elements.canvas.style.height = h / dpr + "px";
  elements.ctx.scale(dpr, dpr);

  // Enable scrolling for large images
  elements.overlay.style.overflow = "auto";
  elements.overlay.style.display = "flex";
  elements.overlay.style.justifyContent = "center";
  elements.overlay.style.alignItems = "start"; // Start so top is visible
  elements.overlay.style.background = "#111";
  // Important: Remove fixed cursor style to allow scrolling interactions if needed
  // But we want tools...
  // For scrolling, user can scroll on body?
  document.body.style.overflow = "auto";

  draw();
  setupEvents();
}

// --- Drawing ---
function draw(hideUI = false) {
  try {
    const ctx = elements.ctx;
    if (!ctx || !elements.canvas || !screenshotImage) {
      return; // Canvas not ready
    }

    const dpr = window.devicePixelRatio || 1;
    const w = elements.canvas.width / dpr;
    const h = elements.canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Draw screenshot
    ctx.drawImage(screenshotImage, 0, 0, w, h);

    // Draw dim overlay only if UI is visible
    if (!hideUI) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, w, h);
    }

    // If we have a selection
    if (STATE.selection) {
      const { x, y, w: sw, h: sh } = STATE.selection;

      // If UI is visible, we need to redraw the selection area brightly to "cut through" the dim
      if (!hideUI) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, sw, sh);
        ctx.clip();
        ctx.drawImage(screenshotImage, 0, 0, w, h);
        ctx.restore();
      }

      // Render annotations (Always)
      renderAnnotations(ctx);

      // Draw borders and handles ONLY if UI is visible
      if (!hideUI) {
        // Draw selection border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, sw, sh);
        ctx.setLineDash([]);

        // Draw dimension label
        drawDimensions(ctx, x, y, sw, sh);

        // Draw resize handles
        drawHandles(ctx, x, y, sw, sh);
      }
    }

    // Draw current annotation being created
    if (STATE.isDrawing && STATE.mode !== "select") {
      drawCurrentAnnotation(ctx);
    }
  } catch (err) {
    console.error("[Editor] Draw error:", err);
  }
}

function drawDimensions(ctx, x, y, w, h) {
  const text = `${Math.round(Math.abs(w))}×${Math.round(Math.abs(h))}`;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  const metrics = ctx.measureText(text);
  ctx.fillRect(x, y - 22, metrics.width + 12, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + 6, y - 8);
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

function drawHandles(ctx, x, y, w, h) {
  const handles = getHandleRects({ x, y, w, h });
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#333";
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

function findTextAnnotationIndex(mx, my) {
  const ctx = elements.ctx;
  if (!ctx) return -1;

  // Search in reverse (topmost first)
  for (let i = STATE.annotations.length - 1; i >= 0; i--) {
    const ann = STATE.annotations[i];
    if (ann.type === "text") {
      const fontSize = ann.fontSize || 20;
      ctx.font = `${fontSize}px "${ann.font || "Arial"}", sans-serif`;
      const lines = ann.text.split("\n");

      let maxWidth = 0;
      lines.forEach((l) => {
        const m = ctx.measureText(l);
        if (m.width > maxWidth) maxWidth = m.width;
      });
      const totalHeight = lines.length * fontSize * 1.2;

      // Simple box hit test
      if (
        mx >= ann.x &&
        mx <= ann.x + maxWidth &&
        my >= ann.y &&
        my <= ann.y + totalHeight
      ) {
        return i;
      }
    }
  }
  return -1;
}

function renderAnnotations(ctx) {
  STATE.annotations.forEach((ann) => {
    // Use tool module if available
    if (window.TOOLS && window.TOOLS[ann.type]) {
      window.TOOLS[ann.type].render(ctx, ann);
    } else if (window.RENDERER_REGISTRY[ann.type]) {
      // Custom Renderer from Feature Modules
      window.RENDERER_REGISTRY[ann.type](ctx, ann);
    }
    // If tool not found, skip rendering
  });
}

function drawCurrentAnnotation(ctx) {
  // Use tool module to render preview if available
  if (window.TOOLS && window.TOOLS[STATE.mode]) {
    window.TOOLS[STATE.mode].renderPreview(ctx, STATE);
  }
}

// --- Helper Functions ---

/**
 * Get canvas-relative coordinates from a mouse event
 * Accounts for canvas position, scroll, and device pixel ratio
 */
function getCanvasCoords(e) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

// --- Events ---
function setupEvents() {
  elements.canvas.addEventListener("mousedown", onMouseDown);
  elements.canvas.addEventListener("mousemove", onMouseMove);
  elements.canvas.addEventListener("mouseup", onMouseUp);

  // Double-click to edit text annotations
  elements.canvas.addEventListener("dblclick", (e) => {
    const coords = getCanvasCoords(e);
    const x = coords.x;
    const y = coords.y;

    const hit = findTextAnnotationIndex(x, y);
    if (hit !== -1) {
      const ann = STATE.annotations[hit];
      createTextInput(ann.x, ann.y, ann, hit);
    }
  });

  document.addEventListener("keydown", (e) => {
    // Don't handle shortcuts if typing
    if (elements.textInput) {
      if (e.key === "Escape") {
        // Cancel the text input using the proper method
        if (elements.textInput.cancel) {
          elements.textInput.cancel();
        }
      }
      return;
    }

    if (e.key === "Escape") {
      window.close();
      return;
    }

    if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
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
      copySelectedText();
      return;
    }

    // Tool shortcuts - work anytime when not typing in text input
    const key = e.key.toLowerCase();
    if (SHORTCUTS[key]) {
      e.preventDefault();
      setMode(SHORTCUTS[key]);
    }
  });
}

function onMouseDown(e) {
  const coords = getCanvasCoords(e);
  const x = coords.x;
  const y = coords.y;

  // Check resize handles first
  const handle = getResizeHandle(x, y);
  if (handle) {
    STATE.isResizing = true;
    STATE.resizeHandle = handle;
    hideToolbars();
    return;
  }

  // Check if Inside Selection
  const sel = STATE.selection;
  const isInside =
    sel && x >= sel.x && x <= sel.x + sel.w && y >= sel.y && y <= sel.y + sel.h;

  if (isInside) {
    // Text Mode - check for text hit first
    if (STATE.mode === "text") {
      const hit = findTextAnnotationIndex(x, y);
      if (hit !== -1) {
        const ann = STATE.annotations[hit];
        // Ctrl+click to delete
        if (e.ctrlKey) {
          STATE.annotations.splice(hit, 1);
          draw();
          return;
        }
        // Single click to start dragging (double-click handled separately for editing)
        STATE.isDraggingText = true;
        STATE.draggedTextIndex = hit;
        STATE.dragOffset = {
          x: x - ann.x,
          y: y - ann.y,
        };
        hideToolbars();
        draw();
        return;
      }
      // Click on empty space - create new text
      createTextInput(x, y);
    } else if (STATE.mode === "select") {
      const hit = findTextAnnotationIndex(x, y);
      if (hit !== -1) {
        const ann = STATE.annotations[hit];
        // Ctrl+click to delete text annotation
        if (e.ctrlKey) {
          STATE.annotations.splice(hit, 1);
          draw();
          return;
        }
        // Single click to drag text (double-click handled separately for editing)
        STATE.isDraggingText = true;
        STATE.draggedTextIndex = hit;
        STATE.dragOffset = {
          x: x - ann.x,
          y: y - ann.y,
        };
        hideToolbars();
        draw();
        return;
      }
      // Move Selection
      STATE.isMoving = true;
      STATE.dragStart = { x, y };
      STATE.initialSel = { ...sel };
      hideToolbars();
    } else if (STATE.mode === "step") {
      // Step Tool
      STATE.annotations.push({
        type: "step",
        x,
        y,
        number: STATE.stepCounter,
        color: STATE.color,
        size: 24,
      });
      STATE.stepCounter++;
      draw();
    } else if (window.TOOL_HANDLERS && window.TOOL_HANDLERS[STATE.mode]) {
      // Delegate to custom tool handler
      window.TOOL_HANDLERS[STATE.mode](x, y, STATE);
      draw();
      return;
    } else {
      // DRAWING (Pen, Line, etc.)
      STATE.isDrawing = true;
      STATE.startPos = { x, y };
      STATE.currentPos = { x, y };

      // Use tool module to create annotation if available
      if (window.TOOLS && window.TOOLS[STATE.mode]) {
        STATE.currentAnnotation = window.TOOLS[STATE.mode].create(
          x,
          y,
          STATE.color,
          STATE.lineWidth,
        );
      }
    }
  } else {
    // Outside Selection - Check for text annotations to edit
    const hit = findTextAnnotationIndex(x, y);
    if (hit !== -1) {
      const ann = STATE.annotations[hit];
      // Ctrl+click to delete
      if (e.ctrlKey) {
        STATE.annotations.splice(hit, 1);
        draw();
        return;
      }
      // Regular click to edit
      createTextInput(ann.x, ann.y, ann, hit);
      return;
    }
    // If we are in select mode, start new selection (clears everything)
    if (!sel || STATE.mode === "select") {
      STATE.isSelecting = true;
      STATE.startPos = { x, y };
      STATE.selection = { x, y, w: 0, h: 0 };
      STATE.annotations = [];
      hideToolbars();
    }
    // If in drawing mode, ignore outside clicks (prevent accidental loss of work)
  }

  draw();
}

function onMouseMove(e) {
  const coords = getCanvasCoords(e);
  const x = coords.x;
  const y = coords.y;

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

  // Handle Text Dragging
  if (STATE.isDraggingText && STATE.draggedTextIndex !== -1) {
    const ann = STATE.annotations[STATE.draggedTextIndex];
    if (ann) {
      ann.x = x - STATE.dragOffset.x;
      ann.y = y - STATE.dragOffset.y;
      draw();
    }
    return;
  }

  if (STATE.isSelecting) {
    STATE.selection.w = x - STATE.startPos.x;
    STATE.selection.h = y - STATE.startPos.y;
    draw();
  } else if (STATE.isDrawing) {
    STATE.currentPos = { x, y };

    // Update annotation based on tool type
    if (STATE.currentAnnotation && window.TOOLS && window.TOOLS[STATE.mode]) {
      const tool = window.TOOLS[STATE.mode];
      if (tool.addPoint) {
        // Pen tool - add point to array
        tool.addPoint(STATE.currentAnnotation, x, y);
      } else if (tool.update) {
        // Other tools - update end position
        const updated = tool.update(x, y);
        STATE.currentAnnotation.end = updated;
      }
    }

    draw();
  } else {
    // Show move cursor when hovering over text
    const hit = findTextAnnotationIndex(x, y);
    if (hit !== -1) {
      elements.canvas.style.cursor = "move";
    } else {
      elements.canvas.style.cursor = "";
    }
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

  // Handle Text Dragging End
  if (STATE.isDraggingText) {
    STATE.isDraggingText = false;
    STATE.draggedTextIndex = -1;
    STATE.dragOffset = { x: 0, y: 0 };
    showToolbars();
    draw();
    return;
  }

  if (STATE.isSelecting) {
    STATE.isSelecting = false;
    normalizeSelection();

    if (
      STATE.selection &&
      Math.abs(STATE.selection.w) > 20 &&
      Math.abs(STATE.selection.h) > 20
    ) {
      // Stay in 'select' mode to allow resizing/moving
      showToolbars();
    } else {
      STATE.selection = null;
    }
    draw();
  } else if (STATE.isDrawing) {
    STATE.isDrawing = false;

    if (STATE.currentAnnotation && window.TOOLS && window.TOOLS[STATE.mode]) {
      if (window.TOOLS[STATE.mode].shouldSave(STATE.currentAnnotation)) {
        STATE.annotations.push(STATE.currentAnnotation);
      }
      STATE.currentAnnotation = null;
    }

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

// --- Selection Actions ---
function selectFullPage() {
  const padding = 5;
  const dpr = window.devicePixelRatio || 1;
  const w = elements.canvas.width / dpr;
  const h = elements.canvas.height / dpr;

  STATE.selection = {
    x: padding,
    y: padding,
    w: w - padding * 2,
    h: h - padding * 2,
  };
  STATE.mode = "pen";
  STATE.annotations = [];
  hideToolbars();
  showToolbars();
  draw();
}

function startReselect() {
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

  // Dimensions estimates (since elements aren't rendered yet)
  const vWidth = 100;
  const vHeight = 600; // Increased to accommodate Stamps
  const hWidth = 320;
  const hHeight = 50;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // --- Vertical Toolbar (Tools) ---
  elements.toolbarVert = document.createElement("div");
  elements.toolbarVert.className = "toolbar toolbar-vertical";

  // Logic: Default Right -> Flip Left if overflow -> Fit Inside if both fail
  let vLeft = x + w + gap;
  if (vLeft + vWidth > screenW) {
    vLeft = x - vWidth - gap;
    if (vLeft < 0) {
      vLeft = screenW - vWidth - gap; // Force fit on screen right
    }
  }

  // Logic: Default Top-aligned -> Shift up if overflow bottom
  let vTop = y;
  // If top of selection is offscreen (not expected but safe check)
  if (vTop < 0) vTop = gap;
  // If bottom of toolbar goes offscreen
  if (vTop + vHeight > screenH) {
    vTop = screenH - vHeight - gap;
    if (vTop < 0) vTop = gap; // Force fit top
  }

  // Final Safety Clamp
  vLeft = Math.max(gap, Math.min(vLeft, screenW - vWidth - gap));
  vTop = Math.max(gap, Math.min(vTop, screenH - vHeight - gap));

  elements.toolbarVert.style.left = vLeft + "px";
  elements.toolbarVert.style.top = vTop + "px";

  // Tool buttons in grid layout
  const allTools = window.TOOL_REGISTRY;

  // Filter active tools (default to true if not in config)
  const tools = allTools.filter((t) => STATE.visibleTools[t.id] !== false);

  const toolGrid = document.createElement("div");
  toolGrid.className = "tool-grid";

  tools.forEach((t) => {
    const btn = createBtn(t.icon, () => setMode(t.id), t.id === STATE.mode);
    btn.dataset.mode = t.id;
    btn.title = t.title || t.id;
    toolGrid.appendChild(btn);
  });

  elements.toolbarVert.appendChild(toolGrid);
  elements.toolbarVert.appendChild(createDivider());

  // Color picker
  const colorContainer = document.createElement("div");
  colorContainer.className = "color-picker";
  COLORS.forEach((c) => {
    const dot = document.createElement("div");
    dot.className = "color-dot" + (c === STATE.color ? " active" : "");
    dot.style.backgroundColor = c;
    dot.addEventListener("click", () => setColor(c, dot));
    colorContainer.appendChild(dot);
  });

  // Custom color
  const customWrapper = document.createElement("div");
  customWrapper.className = "custom-color";
  const customInput = document.createElement("input");
  customInput.type = "color";
  customInput.value = STATE.color;
  customInput.addEventListener("input", (e) => {
    STATE.color = e.target.value;
    document
      .querySelectorAll(".color-dot")
      .forEach((d) => d.classList.remove("active"));
  });
  customWrapper.appendChild(customInput);
  colorContainer.appendChild(customWrapper);

  elements.toolbarVert.appendChild(colorContainer);
  elements.toolbarVert.appendChild(createDivider());

  // Font picker
  const fontContainer = document.createElement("div");
  fontContainer.className = "font-picker";
  const fontSelect = document.createElement("select");
  fontSelect.className = "font-select";
  FONTS.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    if (f === STATE.font) opt.selected = true;
    fontSelect.appendChild(opt);
  });
  fontSelect.addEventListener("change", (e) => {
    STATE.font = e.target.value;
  });
  fontContainer.appendChild(fontSelect);
  elements.toolbarVert.appendChild(fontContainer);
  elements.toolbarVert.appendChild(createDivider());

  // Bottom Row: Undo + Settings (Side-by-side)
  const bottomRow = document.createElement("div");
  bottomRow.style.display = "flex";
  bottomRow.style.gap = "4px";
  bottomRow.style.marginTop = "4px";

  const undoBtn = createBtn(ICONS.undo, undo);
  undoBtn.title = "Undo (Ctrl+Z)";
  undoBtn.style.flex = "1";

  const settingsBtn = createBtn(ICONS.settings, openSettings);
  settingsBtn.title = "Customize Toolbar";
  settingsBtn.style.flex = "1";

  bottomRow.appendChild(undoBtn);
  bottomRow.appendChild(settingsBtn);

  elements.toolbarVert.appendChild(bottomRow);

  // --- Horizontal Toolbar (Actions) ---
  elements.toolbarHoriz = document.createElement("div");
  elements.toolbarHoriz.className = "toolbar toolbar-horizontal";

  // Logic: Default Right Aligned -> Shift Left if overflow
  let hLeft = x + w - hWidth;
  if (hLeft < 0) hLeft = 10;
  if (hLeft + hWidth > screenW) {
    hLeft = screenW - hWidth - gap;
  }

  // Logic: Default Bottom -> Flip Top if overflow
  let hTop = y + h + gap;
  if (hTop + hHeight > screenH) {
    hTop = y - hHeight - gap;
    if (hTop < 0) {
      hTop = screenH - hHeight - gap; // Force fit bottom
    }
  }

  // Final Safety Clamp
  hLeft = Math.max(gap, Math.min(hLeft, screenW - hWidth - gap));
  hTop = Math.max(gap, Math.min(hTop, screenH - hHeight - gap));

  elements.toolbarHoriz.style.left = hLeft + "px";
  elements.toolbarHoriz.style.top = hTop + "px";

  const actions = [
    { icon: ICONS.extract, action: extractText, title: "Extract Text" },
    { icon: ICONS.fullpage, action: selectFullPage, title: "Full Page" },
    { icon: ICONS.reselect, action: startReselect, title: "Reselect Area" },
    {
      icon: ICONS.beautify,
      action: () => {
        STATE.backgroundMode = !STATE.backgroundMode;
        showToast(
          STATE.backgroundMode ? "Beautify Mode: ON" : "Beautify Mode: OFF",
        );
        showToolbars();
      },
      title: "Beautify (Background Frame)",
      isActive: STATE.backgroundMode,
    },
    { icon: ICONS.save, action: saveScreenshot, title: "Save" },
    { icon: ICONS.copy, action: copyToClipboard, title: "Copy" },
    { icon: ICONS.print, action: printScreenshot, title: "Print" },
    { icon: ICONS.close, action: () => window.close(), title: "Close" },
  ];

  actions.forEach((a, i) => {
    const btn = createBtn(a.icon, a.action, a.isActive);
    btn.title = a.title;
    elements.toolbarHoriz.appendChild(btn);
    if (i < actions.length - 1) {
      elements.toolbarHoriz.appendChild(createDivider());
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
  btn.className = "btn" + (isActive ? " active" : "");

  // Use text/html parser which handles SVGs without explicit xmlns
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const svg = doc.body.firstElementChild;
  if (svg) {
    btn.appendChild(btn.ownerDocument.importNode(svg, true));
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function createDivider() {
  const div = document.createElement("div");
  div.className = "divider";
  return div;
}

function setMode(mode) {
  if (STATE.mode === mode) {
    // Toggle off -> go back to select mode
    STATE.mode = "select";
  } else {
    STATE.mode = mode;
  }

  document.querySelectorAll(".btn[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === STATE.mode);
  });

  // Trigger Tool Activation Hook
  if (window.TOOL_ON_ACTIVATE && window.TOOL_ON_ACTIVATE[STATE.mode]) {
    window.TOOL_ON_ACTIVATE[STATE.mode]();
  }
}

function setColor(c, dotEl) {
  STATE.color = c;
  document
    .querySelectorAll(".color-dot")
    .forEach((d) => d.classList.remove("active"));
  dotEl.classList.add("active");
}

function undo() {
  if (elements.textInput) {
    // If text input is open, Undo should cancel it first
    if (elements.textInput.wrapper.parentNode) {
      elements.textInput.wrapper.remove();
    }
    elements.textInput = null;
    return;
  }

  if (STATE.annotations.length > 0) {
    const popped = STATE.annotations.pop();
    if (popped.type === "step") {
      STATE.stepCounter = Math.max(1, STATE.stepCounter - 1);
    }
    draw();
  }
}

// --- Text Input ---
// Simple resizable text box - drag border to resize font
function createTextInput(x, y, existing = null, editIndex = -1) {
  // Close any existing text input
  if (elements.textInput) {
    if (elements.textInput.finish) {
      elements.textInput.finish();
    } else if (elements.textInput.wrapper) {
      elements.textInput.wrapper.remove();
    }
    elements.textInput = null;
  }

  // Setup initial values - use toolbar's current settings
  let fontSize = existing ? existing.fontSize : STATE.fontSize;
  let currentColor = existing ? existing.color : STATE.color;
  let currentFont = existing ? existing.font : STATE.font;
  const text = existing ? existing.text : "";

  // If editing existing, remove it temporarily
  if (existing && editIndex !== -1) {
    STATE.annotations.splice(editIndex, 1);
    draw();
  }

  if (existing) {
    x = existing.x;
    y = existing.y;
  }

  // Initial box dimensions - wide enough for placeholder on one line
  let boxWidth = existing ? Math.max(200, text.length * fontSize * 0.6) : 200;
  let boxHeight = fontSize + 20;

  // Create the simple text box wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "simple-text-box";
  Object.assign(wrapper.style, {
    position: "absolute",
    left: x + "px",
    top: y + "px",
    width: boxWidth + "px",
    minWidth: "60px",
    minHeight: "30px",
    zIndex: "2000",
    background: "rgba(255, 255, 255, 0.95)",
    border: "2px dashed " + currentColor,
    borderRadius: "3px",
    boxSizing: "border-box",
    cursor: "text",
  });

  // The text input - styled to look natural
  const input = document.createElement("textarea");
  input.className = "simple-text-input";
  Object.assign(input.style, {
    width: "100%",
    height: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: currentColor,
    fontFamily: `"${currentFont}", sans-serif`,
    fontSize: fontSize + "px",
    fontWeight: "normal",
    lineHeight: "1.2",
    padding: "6px 8px",
    resize: "none",
    overflow: "hidden",
    boxSizing: "border-box",
  });
  input.placeholder = "Type here...";
  input.value = text;

  // Resize handle (bottom-right corner)
  const resizeHandle = document.createElement("div");
  Object.assign(resizeHandle.style, {
    position: "absolute",
    right: "-4px",
    bottom: "-4px",
    width: "12px",
    height: "12px",
    background: currentColor,
    borderRadius: "2px",
    cursor: "nwse-resize",
    zIndex: "10",
  });

  wrapper.appendChild(input);
  wrapper.appendChild(resizeHandle);

  // Resize state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startWidth = boxWidth;
  let startHeight = boxHeight;
  let startFontSize = fontSize;

  // Handle resizing - dragging changes font size
  resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    startWidth = wrapper.offsetWidth;
    startHeight = wrapper.offsetHeight;
    startFontSize = fontSize;

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeUp);
  });

  const onResizeMove = (e) => {
    if (!isResizing) return;

    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;

    // Calculate new dimensions
    const newWidth = Math.max(60, startWidth + dx);
    const newHeight = Math.max(30, startHeight + dy);

    // Adjust font size based on resize (use diagonal for smoother scaling)
    const scale = Math.sqrt(
      (newWidth * newHeight) / (startWidth * startHeight),
    );
    fontSize = Math.max(10, Math.min(72, Math.round(startFontSize * scale)));

    // Update wrapper size
    wrapper.style.width = newWidth + "px";
    wrapper.style.height = newHeight + "px";

    // Update input font size
    input.style.fontSize = fontSize + "px";
  };

  const onResizeUp = () => {
    isResizing = false;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeUp);
  };

  // Dragging to move the box
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let wrapperStartX = x;
  let wrapperStartY = y;

  wrapper.addEventListener("mousedown", (e) => {
    // Only start drag if clicking on border area (not the input)
    if (e.target === wrapper) {
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      wrapperStartX = parseInt(wrapper.style.left) || x;
      wrapperStartY = parseInt(wrapper.style.top) || y;

      document.addEventListener("mousemove", onDragMove);
      document.addEventListener("mouseup", onDragUp);
    }
  });

  const onDragMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    wrapper.style.left = wrapperStartX + dx + "px";
    wrapper.style.top = wrapperStartY + dy + "px";
  };

  const onDragUp = () => {
    isDragging = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragUp);
  };

  // Cancel function
  const cancel = () => {
    // Restore original annotation if editing
    if (existing && editIndex !== -1) {
      STATE.annotations.splice(editIndex, 0, existing);
      draw();
    }
    wrapper.remove();
    elements.textInput = null;
  };

  // Finish function - save the text
  const finish = () => {
    const trimmedText = input.value.trim();

    if (trimmedText) {
      // Get final position
      const finalX = parseInt(wrapper.style.left) || x;
      const finalY = parseInt(wrapper.style.top) || y;

      // Create annotation using toolbar's current font if not editing
      const annotation = {
        type: "text",
        text: trimmedText,
        color: currentColor,
        font: currentFont,
        fontSize: Math.round(fontSize),
        x: finalX,
        y: finalY,
      };

      // Add or update annotation
      if (editIndex !== -1) {
        STATE.annotations.splice(editIndex, 0, annotation);
      } else {
        STATE.annotations.push(annotation);
      }
      STATE.fontSize = Math.round(fontSize);
      draw();
    }

    wrapper.remove();
    elements.textInput = null;
  };

  // Auto-resize height based on content
  const autoResize = () => {
    // Temporarily set height to auto to measure
    input.style.height = "auto";
    const newHeight = Math.max(fontSize + 16, input.scrollHeight);
    input.style.height = "100%";
    wrapper.style.height = newHeight + "px";

    // Also adjust width based on content
    const lines = input.value.split("\n");
    const maxLineLength = Math.max(...lines.map((l) => l.length), 8);
    const newWidth = Math.max(
      60,
      Math.min(500, maxLineLength * fontSize * 0.65 + 20),
    );
    wrapper.style.width = newWidth + "px";
  };

  input.addEventListener("input", autoResize);

  // Keyboard shortcuts
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      finish();
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Single Enter to confirm (Shift+Enter for new line)
      e.preventDefault();
      finish();
    }
  });

  // Click outside to confirm
  const onClickOutside = (e) => {
    if (!wrapper.contains(e.target)) {
      finish();
      document.removeEventListener("mousedown", onClickOutside);
    }
  };

  // Delay adding click outside listener to prevent immediate trigger
  setTimeout(() => {
    document.addEventListener("mousedown", onClickOutside);
  }, 100);

  // Prevent canvas events from triggering
  wrapper.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  elements.overlay.appendChild(wrapper);

  // Focus and select text
  setTimeout(() => {
    input.focus();
    if (text) {
      input.select();
    }
    autoResize();
  }, 10);

  elements.textInput = { wrapper, input, finish, cancel };
}

// --- Actions ---
function getFinalCanvas() {
  let { x, y, w, h } = STATE.selection;
  if (h < 0) {
    y += h;
    h = Math.abs(h);
  }
  const dpr = window.devicePixelRatio || 1;

  // Temporarily hide UI (handles, dimming) to capture clean image
  draw(true);

  const finalCanvas = document.createElement("canvas");
  // Round to avoid sub-pixel stretching
  const rw = Math.round(w * dpr);
  const rh = Math.round(h * dpr);

  finalCanvas.width = rw;
  finalCanvas.height = rh;
  const fCtx = finalCanvas.getContext("2d");

  // Mapping:
  // Source Canvas (Backing Store): elements.canvas
  // Source x,y,w,h: x*dpr, y*dpr, w*dpr, h*dpr (Backing Store coords)
  const rx = Math.round(x * dpr);
  const ry = Math.round(y * dpr);

  fCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);

  // Restore UI
  draw(false);

  return finalCanvas;
}

function extractText() {
  showToast("Preparing text extraction...");

  let frame = document.getElementById("ocr-frame");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "ocr-frame";
    frame.src = chrome.runtime.getURL("ocr-sandbox.html");
    frame.style.display = "none";
    document.body.appendChild(frame);

    // Wait for load
    frame.onload = () => sendOcrRequest(frame);
  } else {
    sendOcrRequest(frame);
  }
}

function sendOcrRequest(frame) {
  if (!frame || !frame.contentWindow) {
    showToast("OCR initializing... please try again.");
    return;
  }

  showToast("Scanning text... this may take a moment");
  const cvs = getFinalCanvas();
  const dataUrl = cvs.toDataURL("image/png");

  let completed = false;
  const timeout = setTimeout(() => {
    if (!completed) {
      window.removeEventListener("message", listener);
      completed = true;
      showToast("OCR timeout - please try again");
    }
  }, 120000); // 2 minute timeout

  const listener = (event) => {
    if (event.data && event.data.success !== undefined) {
      if (!completed) {
        clearTimeout(timeout);
        window.removeEventListener("message", listener);
        completed = true;

        if (event.data.success) {
          const { text, words } = event.data;
          log("OCR Success, words:", words ? words.length : 0);
          if (text && text.trim()) {
            renderTextOverlay(text.trim(), words);
            showToast("Text extracted! Select and copy as needed.");
          } else {
            showToast("No text found in image");
          }
        } else {
          console.error("OCR Error:", event.data.error);
          showToast("OCR Error: " + (event.data.error || "Unknown error"));
        }
      }
    }
  };

  window.addEventListener("message", listener);
  log("Sending OCR request to frame...");
  try {
    frame.contentWindow.postMessage({ action: "ocr", image: dataUrl }, "*");
  } catch (err) {
    clearTimeout(timeout);
    window.removeEventListener("message", listener);
    console.error("Editor: Failed to send message:", err);
    showToast("Failed to send OCR request");
  }
}

function renderTextOverlay(fullText, words) {
  // Clean up any existing text UI
  const existing = document.getElementById("text-overlay-layer");
  if (existing) existing.remove();
  const existingHeader = document
    .getElementById("overlay")
    .querySelector(".text-mode-header");
  if (existingHeader) existingHeader.remove();
  const existingExit = document
    .getElementById("overlay")
    .querySelector(".text-mode-exit");
  if (existingExit) existingExit.remove();
  const existingPanel = document
    .getElementById("overlay")
    .querySelector(".text-panel");
  if (existingPanel) existingPanel.remove();

  // Hide the screenshot canvas to avoid doubled text visual
  const canvas = document.getElementById("canvas");
  canvas.style.display = "none";

  // Header with Copy All Text button
  const header = document.createElement("div");
  header.className = "text-mode-header";

  const copyAllBtn = document.createElement("button");
  copyAllBtn.className = "copy-all-btn";
  copyAllBtn.textContent = "Copy all text";
  copyAllBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        showToast(`Copied all text (${fullText.length} characters)`);
      })
      .catch((err) => {
        console.error("Copy failed:", err);
        showToast("Failed to copy text");
      });
  });

  const title = document.createElement("div");
  title.className = "text-header-title";
  title.textContent = "Text Detection";

  header.appendChild(copyAllBtn);
  header.appendChild(title);
  document.getElementById("overlay").appendChild(header);

  // Create text panel with proper formatting
  const panel = document.createElement("div");
  panel.className = "text-panel";

  const textArea = document.createElement("textarea");
  textArea.className = "text-area";
  textArea.value = fullText;
  textArea.readOnly = false;
  textArea.spellcheck = false;

  const controls = document.createElement("div");
  controls.className = "text-controls";

  const selectAllBtn = document.createElement("button");
  selectAllBtn.className = "text-btn";
  selectAllBtn.textContent = "Select All (Ctrl+A)";
  selectAllBtn.addEventListener("click", () => {
    textArea.select();
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "text-btn";
  copyBtn.textContent = "Copy Selected (Ctrl+C)";
  copyBtn.addEventListener("click", () => {
    if (textArea.selectionStart < textArea.selectionEnd) {
      const selected = textArea.value.substring(
        textArea.selectionStart,
        textArea.selectionEnd,
      );
      navigator.clipboard.writeText(selected).then(() => {
        showToast(`Copied ${selected.length} characters`);
      });
    } else {
      textArea.select();
      document.execCommand("copy");
      showToast(`Copied all text (${fullText.length} characters)`);
    }
  });

  controls.appendChild(selectAllBtn);
  controls.appendChild(copyBtn);
  panel.appendChild(controls);
  panel.appendChild(textArea);

  document.getElementById("overlay").appendChild(panel);

  // Render word boxes as highlights (optional - can be toggled)
  if (words && words.length > 0) {
    const container = document.createElement("div");
    container.id = "text-overlay-layer";
    const sel = STATE.selection || { x: 0, y: 0 };
    const dpr = window.devicePixelRatio || 1;

    words.forEach((w) => {
      const el = document.createElement("div");
      el.className = "text-word-box";
      el.textContent = w.text;
      el.title = `"${w.text}"`;

      const x = w.bbox.x0 / dpr + sel.x;
      const y = w.bbox.y0 / dpr + sel.y;
      const width = (w.bbox.x1 - w.bbox.x0) / dpr;
      const height = (w.bbox.y1 - w.bbox.y0) / dpr;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.lineHeight = `${height}px`;
      el.style.fontSize = `${Math.min(height * 0.7, 14)}px`;
      el.style.pointerEvents = "none"; // Don't interfere with text area

      container.appendChild(el);
    });

    document.getElementById("overlay").appendChild(container);
  }

  // Exit button
  const exitBtn = document.createElement("button");
  exitBtn.className = "text-mode-exit";
  exitBtn.textContent = "Exit Text Mode";
  exitBtn.addEventListener("click", () => {
    header.remove();
    panel.remove();
    exitBtn.remove();
    const overlay = document.getElementById("text-overlay-layer");
    if (overlay) overlay.remove();
    canvas.style.display = "block";
    draw();
  });
  document.getElementById("overlay").appendChild(exitBtn);
}

function copySelectedText() {
  const selection = window.getSelection();
  if (selection.toString().length > 0) {
    navigator.clipboard
      .writeText(selection.toString())
      .then(() => {
        showToast(`Copied: "${selection.toString().substring(0, 50)}..."`);
      })
      .catch((err) => {
        console.error("Copy failed:", err);
        showToast("Failed to copy text");
      });
  } else {
    showToast("Select text first");
  }
}

function applyBackground(originalCanvas) {
  const dpr = window.devicePixelRatio || 1;
  const padding = 60 * dpr;
  const w = originalCanvas.width;
  const h = originalCanvas.height;

  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = w + padding * 2;
  bgCanvas.height = h + padding * 2;
  const ctx = bgCanvas.getContext("2d");

  // Gradient
  const grad = ctx.createLinearGradient(0, 0, bgCanvas.width, bgCanvas.height);
  // Nice colorful gradient
  grad.addColorStop(0, "#FFDEE9");
  grad.addColorStop(1, "#B5FFFC");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.translate(padding, padding);
  ctx.drawImage(originalCanvas, 0, 0);
  ctx.restore();

  return bgCanvas;
}

function saveScreenshot() {
  let cvs = getFinalCanvas();
  if (STATE.backgroundMode) {
    cvs = applyBackground(cvs);
  }
  const link = document.createElement("a");
  link.download = `primeshot_${Date.now()}.png`;
  link.href = cvs.toDataURL("image/png");
  link.click();
  showToast("Screenshot Saved!");
  setTimeout(() => window.close(), 1000);
}

async function copyToClipboard() {
  // Validate selection exists and has valid dimensions
  if (!STATE.selection || STATE.selection.w === 0 || STATE.selection.h === 0) {
    showToast("No selection to copy");
    return;
  }

  let cvs = getFinalCanvas();
  if (STATE.backgroundMode) {
    cvs = applyBackground(cvs);
  }
  try {
    const blob = await new Promise((resolve, reject) => {
      cvs.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    });

    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    showToast("Copied to Clipboard!");
    setTimeout(() => window.close(), 1000);
  } catch (err) {
    console.error("Copy error:", err);
    showToast("Failed to copy. Check permissions.");
  }
}

function printScreenshot() {
  let cvs = getFinalCanvas();
  if (STATE.backgroundMode) {
    cvs = applyBackground(cvs);
  }
  const dataUrl = cvs.toDataURL("image/png");
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
      <title>Print Screenshot</title>
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
        img { max-width: 100%; max-height: 100vh; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        @media print { body { background: white; } img { box-shadow: none; } }
      </style>
    </head>
    <body></body>
    </html>
  `);
  doc.close();

  const img = doc.createElement("img");
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

function showToast(msg) {
  if (!elements.toast) return;
  elements.toast.textContent = msg;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast?.classList.remove("show"), 2000);
}

// --- Settings / Customization ---
function injectSettingsStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .settings-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1e1e1e;
      color: #fff;
      padding: 24px;
      border-radius: 12px;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border: 1px solid #333;
      min-width: 300px;
      font-family: system-ui, sans-serif;
    }
    .settings-modal h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
    }
    .settings-row {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .settings-row label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 16px;
    }
    .settings-row input {
      margin-right: 12px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #0066ff;
    }
    .settings-modal button {
      background: #0066ff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      width: 100%;
      margin-top: 20px;
    }
    .settings-modal button:hover {
      background: #0052cc;
    }
    .settings-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);
}

function openSettings() {
  if (document.getElementById("settings-modal")) return;

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "settings-backdrop";
  backdrop.className = "settings-overlay";
  backdrop.onclick = closeSettings;
  document.body.appendChild(backdrop);

  const modal = document.createElement("div");
  modal.id = "settings-modal";
  modal.className = "settings-modal";

  const title = document.createElement("h3");
  title.textContent = "Customize Toolbar";
  modal.appendChild(title);

  const list = document.createElement("div");
  const toolNames = {
    pen: "Pen",
    line: "Line",
    arrow: "Arrow",
    rect: "Rectangle",
    circle: "Circle",
    highlight: "Highlight",
    blur: "Blur",
    text: "Text",
  };

  Object.keys(toolNames).forEach((key) => {
    const row = document.createElement("div");
    row.className = "settings-row";

    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = STATE.visibleTools[key];

    cb.addEventListener("change", (e) => {
      STATE.visibleTools[key] = e.target.checked;
      chrome.storage.local.set({ visibleTools: STATE.visibleTools });
      // Refresh toolbar immediately
      showToolbars();
    });

    label.appendChild(cb);
    label.appendChild(document.createTextNode(toolNames[key]));

    row.appendChild(label);
    list.appendChild(row);
  });
  modal.appendChild(list);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Done";
  closeBtn.onclick = closeSettings;
  modal.appendChild(closeBtn);

  document.body.appendChild(modal);
}

function closeSettings() {
  const modal = document.getElementById("settings-modal");
  const backdrop = document.getElementById("settings-backdrop");
  if (modal) modal.remove();
  if (backdrop) backdrop.remove();
}
