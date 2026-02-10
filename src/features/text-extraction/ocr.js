/**
 * OCR (Optical Character Recognition) module
 * Handles communication with OCR sandbox for text extraction
 */
import { CONSTANTS } from "../../shared/state.js";
import { showToast } from "../../utils/toast.js";

// Debug mode - set to false for production
const DEBUG = false;
const log = (...args) => DEBUG && console.log("[OCR]", ...args);

let ocrFrame = null;

export function initOCR() {
  // Frame will be created on first use
}

function ensureOCRFrame() {
  if (ocrFrame && ocrFrame.parentElement) {
    return ocrFrame;
  }

  ocrFrame = document.createElement("iframe");
  ocrFrame.id = "primeshot-ocr-frame";

  // Get sandbox URL with error handling
  let sandboxUrl;
  try {
    sandboxUrl = chrome.runtime.getURL(CONSTANTS.OCR.SANDBOX_HTML);
  } catch (error) {
    console.error("[OCR] Failed to get sandbox URL:", error);
    throw new Error("Cannot access OCR sandbox URL: " + error.message);
  }

  ocrFrame.src = sandboxUrl;
  ocrFrame.style.display = "none";
  document.body.appendChild(ocrFrame);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error("[OCR] Frame load timeout");
      reject(new Error("OCR frame failed to load within 10 seconds"));
    }, 10000);

    ocrFrame.onload = () => {
      clearTimeout(timeout);
      log("Frame loaded successfully");
      resolve(ocrFrame);
    };

    ocrFrame.onerror = () => {
      clearTimeout(timeout);
      console.error("[OCR] Frame load error");
      reject(new Error("Failed to load OCR sandbox frame"));
    };
  });
}

/**
 * Extract text from image canvas
 * @param {HTMLCanvasElement} canvas - Canvas with image to extract text from
 * @returns {Promise<{text: string, words: Array}>} Extracted text and word data
 */
export async function extractTextFromImage(canvas) {
  try {
    const frame = await ensureOCRFrame();

    if (!frame.contentWindow) {
      throw new Error("OCR frame contentWindow not available");
    }

    const dataUrl = canvas.toDataURL("image/png");

    return new Promise((resolve, reject) => {
      let completed = false;

      const timeout = setTimeout(() => {
        if (!completed) {
          window.removeEventListener("message", listener);
          completed = true;
          reject(new Error("OCR timeout - request took too long"));
        }
      }, CONSTANTS.OCR.TIMEOUT);

      const listener = (event) => {
        if (event.data && event.data.success !== undefined) {
          if (!completed) {
            clearTimeout(timeout);
            window.removeEventListener("message", listener);
            completed = true;

            if (event.data.success) {
              log("Success:", event.data.words?.length || 0, "words");
              resolve({
                text: event.data.text || "",
                words: event.data.words || [],
              });
            } else {
              reject(new Error(event.data.error || "Unknown OCR error"));
            }
          }
        }
      };

      window.addEventListener("message", listener);

      log("Sending OCR request...");
      frame.contentWindow.postMessage({ action: "ocr", image: dataUrl }, "*");
    });
  } catch (error) {
    console.error("[OCR] Error:", error.message);
    throw error;
  }
}

/**
 * Cleanup OCR resources
 */
export function cleanupOCR() {
  if (ocrFrame && ocrFrame.parentElement) {
    ocrFrame.remove();
    ocrFrame = null;
  }
}
