/**
 * Text Extraction Feature Manager
 * Orchestrates OCR and text panel display
 */
import { extractTextFromImage, cleanupOCR } from "./ocr.js";
import { TextPanel } from "./text-panel.js";
import { STATE } from "../../shared/state.js";
import { showToast } from "../../utils/toast.js";

export class TextExtractionManager {
  constructor(containerElement, canvasElement, isContentScript = true) {
    this.container = containerElement;
    this.canvas = canvasElement;
    this.isContentScript = isContentScript;
    this.textPanel = new TextPanel(containerElement, isContentScript);
    this.isProcessing = false;
  }

  /**
   * Start text extraction process
   * @param {HTMLCanvasElement} sourceCanvas - Canvas to extract text from
   */
  async extract(sourceCanvas) {
    if (this.isProcessing) {
      showToast("Text extraction already in progress...");
      return;
    }

    this.isProcessing = true;
    showToast("Scanning text... this may take a moment");

    try {
      const result = await extractTextFromImage(sourceCanvas);

      if (!result.text || !result.text.trim()) {
        showToast("No text found in image");
        this.isProcessing = false;
        return;
      }

      // Store in state
      STATE.setExtractedText(result.text.trim(), result.words);

      // Render text panel (pass canvas element explicitly)
      this.textPanel.render(
        result.text.trim(),
        result.words,
        this.canvas,
        () => {
          this.exit();
        },
      );

      showToast("Text extracted! Select and copy as needed.");
    } catch (error) {
      console.error("[TextExtraction]", error.message);
      showToast("OCR Error: " + (error.message || "Unknown error"));
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Exit text mode and return to normal annotation mode
   */
  exit() {
    STATE.exitTextMode();
    this.textPanel.cleanup();
    cleanupOCR();

    // Trigger a redraw to restore the annotation view
    window.dispatchEvent(
      new CustomEvent("primeshot:redraw", {
        detail: { fullRedraw: true },
      }),
    );
  }
}
