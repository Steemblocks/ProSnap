// Background service worker for PrimeShot

// Note: When a popup is defined in manifest, onClicked doesn't fire.
// However, the keyboard shortcut (_execute_action) will still trigger this.
// The popup.js handles the click, this handles the keyboard shortcut.

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    try {
      await captureCurrentTab();
    } catch (err) {
      console.error("Command handler error:", err);
    }
  }
});

// Also listen for direct messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture") {
    captureCurrentTab()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  // Clean up stored screenshot after editor loads
  if (request.action === "editor_loaded") {
    chrome.storage.local.remove("pendingScreenshot");
    sendResponse({ success: true });
    return true;
  }
});

async function captureCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    console.warn("No active tab found");
    return;
  }

  try {
    // Capture the visible tab - this works on ALL pages including chrome://
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
    });

    // Check if we can inject into this tab
    const canInject =
      tab.url &&
      (tab.url.startsWith("http://") ||
        tab.url.startsWith("https://") ||
        tab.url.startsWith("file://"));

    if (canInject) {
      // Try to send message to existing content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "init_screenshot",
          dataUrl: dataUrl,
        });
      } catch (err) {
        // Content script might not be loaded yet, inject it
        try {
          // Inject the content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"],
          });

          // Wait a moment for the script to initialize
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Retry sending the message
          await chrome.tabs.sendMessage(tab.id, {
            action: "init_screenshot",
            dataUrl: dataUrl,
          });
        } catch (injectErr) {
          console.error(
            "Failed to inject, opening editor...",
            injectErr.message,
          );
          openStandaloneEditor(dataUrl);
        }
      }
    } else {
      // Cannot inject into this page (chrome://, edge://, etc.)
      // Open standalone editor in a new tab
      openStandaloneEditor(dataUrl);
    }
  } catch (captureErr) {
    console.error("Failed to capture screenshot:", captureErr.message);
  }
}

// Open a standalone screenshot editor in a new tab
function openStandaloneEditor(dataUrl) {
  // Store the screenshot data temporarily
  chrome.storage.local.set({ pendingScreenshot: dataUrl }, () => {
    // Open the editor HTML page
    chrome.tabs.create({
      url: chrome.runtime.getURL("editor.html"),
    });
  });
}
