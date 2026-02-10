// PrimeShot Popup Script

document.getElementById("captureBtn").addEventListener("click", async () => {
  try {
    // Get current tab first (before window.close())
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) {
      console.error("PrimeShot: No active tab found");
      return;
    }

    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
    });

    // Save screenshot to storage and open the editor in a new tab
    await chrome.storage.local.set({ pendingScreenshot: dataUrl });
    await chrome.tabs.create({
      url: chrome.runtime.getURL("editor.html"),
    });

    // Close popup after everything succeeds
    window.close();
  } catch (err) {
    console.error("PrimeShot: Failed to capture screenshot", err);
    // Show error to user (popup is still open since we didn't close it)
    const btn = document.getElementById("captureBtn");
    const originalText = btn.textContent;
    btn.textContent = "Error! Try again";
    btn.style.background = "#dc2626";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = "";
    }, 2000);
  }
});

// Rate link - opens Chrome Web Store
document.getElementById("rateLink")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: "https://chrome.google.com/webstore", // Replace with real ID later
  });
});
