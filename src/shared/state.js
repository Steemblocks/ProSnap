/**
 * Global state management for PrimeShot
 * Centralized state object shared across all modules
 */

// Debug mode - set to false for production
export const DEBUG = false;
export const log = (...args) => DEBUG && console.log("[State]", ...args);

export const STATE = {
  // Screenshot and selection
  screenshotData: null,
  selection: { x: 0, y: 0, w: 0, h: 0 },

  // Drawing and annotation
  isDrawing: false,
  mode: "pen", // pen, line, arrow, rect, circle, highlight, blur, text
  color: "#ff0000",
  lineWidth: 2,
  font: "Arial",
  fontSize: 20,
  fillShape: false,
  annotations: [],

  // Text extraction
  extractedText: null,
  extractedWords: [],
  isTextMode: false,

  // UI state
  toolbarVisible: true,
  colorPickerVisible: false,

  // Canvas references (set by main script)
  canvas: null,
  ctx: null,

  reset() {
    this.isDrawing = false;
    this.annotations = [];
  },

  addAnnotation(annotation) {
    this.annotations.push(annotation);
  },

  clearAnnotations() {
    this.annotations = [];
  },

  setSelection(x, y, w, h) {
    this.selection = { x, y, w, h };
  },

  setExtractedText(text, words) {
    this.extractedText = text;
    this.extractedWords = words;
    this.isTextMode = true;
  },

  exitTextMode() {
    this.isTextMode = false;
    this.extractedText = null;
    this.extractedWords = [];
  },
};

/**
 * Constants used throughout the extension
 */
export const CONSTANTS = {
  // Tool modes
  TOOLS: {
    PEN: "pen",
    LINE: "line",
    ARROW: "arrow",
    RECT: "rect",
    CIRCLE: "circle",
    HIGHLIGHT: "highlight",
    BLUR: "blur",
    TEXT: "text",
  },

  // Colors
  COLORS: [
    "#ff0000", // red
    "#00ff00", // green
    "#0000ff", // blue
    "#ffff00", // yellow
    "#ff00ff", // magenta
    "#00ffff", // cyan
    "#ffffff", // white
    "#000000", // black
  ],

  // OCR settings
  OCR: {
    TIMEOUT: 120000, // 2 minutes
    WORKER_URL: "https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js",
    SANDBOX_HTML: "ocr-sandbox.html",
  },

  // UI settings
  UI: {
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 200,
  },

  // DPI and scaling
  DPI_SCALE: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
};

/**
 * Element references for content.js (Shadow DOM)
 */
export const ELEMENTS_CONTENT = {
  shadowRoot: null,
  shadow: null,
  overlay: null,
  canvas: null,
  toast: null,
};

/**
 * Element references for editor.js (Direct DOM)
 */
export const ELEMENTS_EDITOR = {
  overlay: null,
  canvas: null,
  toast: null,
};

/**
 * Initialize DOM elements for content script
 * IMPORTANT: Call BEFORE using any modules
 *
 * @param {Boolean} isContentScript - true for content.js, false for editor.js
 * @param {Object} options - Additional configuration
 * @returns {Object} References to created elements
 */
export function initializeElements(isContentScript = true, options = {}) {
  if (isContentScript) {
    // Content script uses Shadow DOM
    // Check if already initialized
    const existingHost = document.getElementById("primeshot-shadow-host");
    if (existingHost && ELEMENTS_CONTENT.shadowRoot) {
      log("Shadow DOM already initialized, reusing existing elements");
      return ELEMENTS_CONTENT;
    }

    const host = document.createElement("div");
    host.id = "primeshot-shadow-host";
    document.body.appendChild(host);

    ELEMENTS_CONTENT.shadowRoot = host.attachShadow({ mode: "open" });
    ELEMENTS_CONTENT.shadow = ELEMENTS_CONTENT.shadowRoot;

    const overlay = document.createElement("div");
    overlay.id = "primeshot-overlay";
    overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;";
    ELEMENTS_CONTENT.shadowRoot.appendChild(overlay);
    ELEMENTS_CONTENT.overlay = overlay;

    const canvas = document.createElement("canvas");
    canvas.id = "primeshot-canvas";
    overlay.appendChild(canvas);
    ELEMENTS_CONTENT.canvas = canvas;

    const toast = document.createElement("div");
    toast.id = "primeshot-toast";
    toast.style.cssText =
      "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e1e1e;color:#fff;padding:8px 16px;border-radius:4px;font-size:14px;pointer-events:none;opacity:0;transition:opacity 0.3s;z-index:2147483650;";
    ELEMENTS_CONTENT.shadowRoot.appendChild(toast);
    ELEMENTS_CONTENT.toast = toast;

    log("Shadow DOM elements initialized");
    return ELEMENTS_CONTENT;
  } else {
    // Editor uses direct DOM
    const overlay = document.getElementById("overlay");
    const canvas = document.getElementById("canvas");
    const toast = document.getElementById("toast");

    if (!overlay || !canvas || !toast) {
      console.error(
        "[State] Missing required editor elements: overlay, canvas, or toast",
      );
      return null;
    }

    ELEMENTS_EDITOR.overlay = overlay;
    ELEMENTS_EDITOR.canvas = canvas;
    ELEMENTS_EDITOR.toast = toast;

    log("Editor elements initialized");
    return ELEMENTS_EDITOR;
  }
}
