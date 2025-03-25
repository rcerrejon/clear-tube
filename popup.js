document.addEventListener('DOMContentLoaded', function () {
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const startTime = document.getElementById('start-time');
  const endTime = document.getElementById('end-time');
  const saveButton = document.getElementById('save-times');
  const statusEl = document.getElementById('status');
  const timeRangeContainer = document.getElementById('time-range-container');
  const aboutBtn = document.getElementById('about-btn');

  // About Listener
  aboutBtn.addEventListener('click', function () {
    window.location.href = 'about.html';
  });

  // Load saved config (mode and times)
  chrome.storage.local.get(['mode', 'startTime', 'endTime'], function (result) {
    const mode = result.mode || 'off';
    modeRadios.forEach((radio) => {
      radio.checked = radio.value === mode;
    });

    if (mode === 'auto') {
      timeRangeContainer.style.display = 'block';
    } else {
      timeRangeContainer.style.display = 'none';
    }

    if (result.startTime) {
      startTime.value = result.startTime;
    }
    if (result.endTime) {
      endTime.value = result.endTime;
    }
  });

  // Listener for radio button change
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', function () {
      if (this.checked) {
        const selectedMode = this.value;
        chrome.storage.local.set({ mode: selectedMode }, () => {
          console.log('Mode saved:', selectedMode);
          timeRangeContainer.style.display = selectedMode === 'auto' ? 'block' : 'none';

          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0]?.id) {
              console.error('No active tab found');
              return;
            }

            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: 'setMode',
                mode: selectedMode,
                startTime: startTime.value,
                endTime: endTime.value,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error:', chrome.runtime.lastError);
                  return;
                }
                console.log('Mode change response:', response);
              },
            );
          });
        });
      }
    });
  });

  // Listener Save Config (for time update)
  saveButton.addEventListener('click', function () {
    // Validator: check that start is before end when in auto mode.
    if (startTime.value >= endTime.value) {
      statusEl.textContent = 'Error: The start time must be before the end time';
      statusEl.style.color = 'red';
      return;
    }
    chrome.storage.local.set(
      {
        startTime: startTime.value,
        endTime: endTime.value,
      },
      function () {
        statusEl.textContent = 'Time saved correctly';
        statusEl.style.color = 'green';
        setTimeout(() => {
          statusEl.textContent = '';
        }, 3000);
        // If auto mode, send updated timing info.
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        if (selectedMode === 'auto') {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'setMode',
              mode: 'auto',
              startTime: startTime.value,
              endTime: endTime.value,
            });
          });
        }
      },
    );
  });
});
