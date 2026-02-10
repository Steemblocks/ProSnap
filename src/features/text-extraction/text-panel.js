/**
 * Text Panel UI module
 * Renders and manages the text extraction panel
 */
import { showToast } from "../../utils/toast.js";
import { copyToClipboard } from "../../utils/clipboard.js";
import { STATE } from "../../shared/state.js";

export class TextPanel {
  constructor(containerElement, isContentScript = true) {
    this.container = containerElement;
    this.isContentScript = isContentScript;
    this.elements = {
      header: null,
      panel: null,
      textArea: null,
      exitBtn: null,
      overlayLayer: null,
    };
  }

  /**
   * Render text panel with extracted text
   * @param {string} fullText - Complete extracted text
   * @param {Array} words - Word objects with bounding box info
   * @param {HTMLCanvasElement} canvasElement - Canvas element to hide (optional)
   * @param {Function} onExit - Callback when exiting text mode
   */
  render(fullText, words = [], canvasElement = null, onExit = () => {}) {
    this.cleanup();

    // Hide canvas if provided
    if (canvasElement) {
      canvasElement.style.display = "none";
      this.elements.canvas = canvasElement;
    } else if (this.isContentScript) {
      // Fallback: try to find canvas in container
      const foundCanvas = this.container.querySelector("canvas");
      if (foundCanvas) {
        foundCanvas.style.display = "none";
        this.elements.canvas = foundCanvas;
      }
    }

    // Create header
    this.elements.header = document.createElement("div");
    this.elements.header.className = this.isContentScript
      ? "primeshot-text-mode-header"
      : "text-mode-header";

    const copyAllBtn = document.createElement("button");
    copyAllBtn.className = this.isContentScript
      ? "primeshot-copy-all-btn"
      : "copy-all-btn";
    copyAllBtn.textContent = "Copy all text";
    copyAllBtn.addEventListener("click", () => {
      copyToClipboard(fullText);
    });

    const title = document.createElement("div");
    title.className = this.isContentScript
      ? "primeshot-text-header-title"
      : "text-header-title";
    title.textContent = "Text Detection";

    this.elements.header.appendChild(copyAllBtn);
    this.elements.header.appendChild(title);
    this.container.appendChild(this.elements.header);

    // Create text panel
    this.elements.panel = document.createElement("div");
    this.elements.panel.className = this.isContentScript
      ? "primeshot-text-panel"
      : "text-panel";

    const controls = this._createControls();
    this.elements.textArea = document.createElement("textarea");
    this.elements.textArea.className = this.isContentScript
      ? "primeshot-text-area"
      : "text-area";
    this.elements.textArea.value = fullText;
    this.elements.textArea.readOnly = false;
    this.elements.textArea.spellcheck = false;

    this.elements.panel.appendChild(controls);
    this.elements.panel.appendChild(this.elements.textArea);
    this.container.appendChild(this.elements.panel);

    // Render word boxes as subtle background highlights
    if (words && words.length > 0) {
      this._renderWordHighlights(words);
    }

    // Create exit button
    this.elements.exitBtn = document.createElement("button");
    this.elements.exitBtn.className = this.isContentScript
      ? "primeshot-text-mode-exit"
      : "text-mode-exit";
    this.elements.exitBtn.textContent = "Exit Text Mode";
    this.elements.exitBtn.addEventListener("click", () => {
      this.cleanup();
      onExit();
    });
    this.container.appendChild(this.elements.exitBtn);
  }

  _createControls() {
    const controls = document.createElement("div");
    controls.className = this.isContentScript
      ? "primeshot-text-controls"
      : "text-controls";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.className = this.isContentScript
      ? "primeshot-text-btn"
      : "text-btn";
    selectAllBtn.textContent = "Select All (Ctrl+A)";
    selectAllBtn.addEventListener("click", () => {
      this.elements.textArea.select();
    });

    const copyBtn = document.createElement("button");
    copyBtn.className = this.isContentScript
      ? "primeshot-text-btn"
      : "text-btn";
    copyBtn.textContent = "Copy Selected (Ctrl+C)";
    copyBtn.addEventListener("click", () => {
      const textArea = this.elements.textArea;
      const hasSelection = textArea.selectionStart < textArea.selectionEnd;

      if (hasSelection) {
        // Copy only selected text
        const selected = textArea.value.substring(
          textArea.selectionStart,
          textArea.selectionEnd,
        );
        copyToClipboard(selected);
      } else {
        // No selection - copy all text
        copyToClipboard(textArea.value);
      }
    });

    controls.appendChild(selectAllBtn);
    controls.appendChild(copyBtn);
    return controls;
  }

  _renderWordHighlights(words) {
    const container = document.createElement("div");
    container.className = this.isContentScript
      ? "primeshot-text-overlay-layer"
      : "text-overlay-layer";

    const sel = STATE.selection || { x: 0, y: 0 };
    const dpr = window.devicePixelRatio || 1;

    words.forEach((w) => {
      const el = document.createElement("div");
      el.className = this.isContentScript
        ? "primeshot-text-word-box"
        : "text-word-box";
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
      el.style.pointerEvents = "none";

      container.appendChild(el);
    });

    this.container.appendChild(container);
    this.elements.overlayLayer = container;
  }

  cleanup() {
    if (this.elements.header) this.elements.header.remove();
    if (this.elements.panel) this.elements.panel.remove();
    if (this.elements.exitBtn) this.elements.exitBtn.remove();
    if (this.elements.overlayLayer) this.elements.overlayLayer.remove();
    if (this.elements.canvas) {
      this.elements.canvas.style.display = "block";
    }
    this.elements = {
      header: null,
      panel: null,
      textArea: null,
      exitBtn: null,
      overlayLayer: null,
    };
  }
}
