// Vars
let styleElement = null;
let checkTimeInterval = null;

// Show Block and load external CSS
function applyStyles() {
  if (!styleElement) {
    fetch(chrome.runtime.getURL('styles.css'))
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then((css) => {
        if (!css) throw new Error('CSS content is empty');
        styleElement = document.createElement('style');
        styleElement.id = 'custom-css-overrider';
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
        console.log('Styles applied successfully');
      })
      .catch((error) => {
        console.error('Error applying styles:', error);
      });
  }
}

// Hide Block
function removeStyles() {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
}

// Time Range Checker
function isTimeInRange(startTime, endTime) {
  const currentDate = new Date();
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  // Check
  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
}

// Time Mode
function handleAutoMode(enabled, startTime, endTime) {
  if (checkTimeInterval) {
    clearInterval(checkTimeInterval);
    checkTimeInterval = null;
  }

  if (enabled && startTime && endTime) {
    const shouldBeEnabled = isTimeInRange(startTime, endTime);
    if (shouldBeEnabled) {
      applyStyles();
    } else {
      removeStyles();
    }

    checkTimeInterval = setInterval(() => {
      const shouldBeEnabled = isTimeInRange(startTime, endTime);
      if (shouldBeEnabled && !styleElement) {
        applyStyles();
      } else if (!shouldBeEnabled && styleElement) {
        removeStyles();
      }
    }, 60000); // Check every 60 seconcs
  }
}

// Save Config: Adjust to use the "mode" setting.
chrome.storage.local.get(['mode', 'startTime', 'endTime'], function (result) {
  const mode = result.mode || 'off';
  if (mode === 'auto' && result.startTime && result.endTime) {
    handleAutoMode(true, result.startTime, result.endTime);
  } else if (mode === 'always') {
    applyStyles();
  } else {
    removeStyles();
  }
});

// Listener: Updated to handle new "setMode" message.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('Received message:', message);

  if (message.action === 'setMode') {
    const mode = message.mode;
    if (mode === 'always') {
      removeStyles();
      setTimeout(() => {
        applyStyles();
      }, 100); // Small delay to ensure removeStyles completes
      if (checkTimeInterval) clearInterval(checkTimeInterval);
    } else if (mode === 'auto') {
      handleAutoMode(true, message.startTime, message.endTime);
    } else if (mode === 'off') {
      if (checkTimeInterval) clearInterval(checkTimeInterval);
      removeStyles();
    }
    // Send response back to confirm message was processed
    sendResponse({ success: true });
  }
  // Return true to indicate we'll send a response asynchronously
  return true;
});
