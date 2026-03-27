document.addEventListener('DOMContentLoaded', () => {
  const wordInput = document.getElementById('wordInput');
  const addButton = document.getElementById('addButton');
  const wordList = document.getElementById('wordList');
  const enableToggle = document.getElementById('enableToggle');
  const status = document.getElementById('status');

  // Load saved state
  chrome.storage.local.get(['words', 'enabled'], (data) => {
    const words = data.words || [];
    const enabled = data.enabled !== undefined ? data.enabled : true;
    
    enableToggle.checked = enabled;
    renderWords(words);
    
    if (enabled) {
      status.textContent = 'Highlighting active';
    } else {
      status.textContent = 'Highlighting paused';
      status.style.color = '#ef4444';
    }
  });

  // Toggle switch
  enableToggle.addEventListener('change', () => {
    const isEnabled = enableToggle.checked;
    chrome.storage.local.set({ enabled: isEnabled }, () => {
      status.textContent = isEnabled ? 'Highlighting active' : 'Highlighting paused';
      status.style.color = isEnabled ? '#64748b' : '#ef4444';
      
      // Notify content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled: isEnabled }).catch(() => {});
        });
      });
    });
  });

  // Add word
  addButton.addEventListener('click', () => {
    const word = wordInput.value.trim();
    if (word) {
      chrome.storage.local.get(['words'], (data) => {
        const words = data.words || [];
        if (!words.includes(word)) {
          words.push(word);
          chrome.storage.local.set({ words }, () => {
            renderWords(words);
            wordInput.value = '';
            notifyUpdate();
          });
        }
      });
    }
  });

  // Enter key support
  wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addButton.click();
  });

  function renderWords(words) {
    wordList.innerHTML = '';
    words.forEach((word, index) => {
      const li = document.createElement('li');
      li.className = 'word-item';
      li.innerHTML = `
        <span class="word-text">${word}</span>
        <button class="delete-btn" data-index="${index}">×</button>
      `;
      wordList.appendChild(li);
    });

    // Delete functionality
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        chrome.storage.local.get(['words'], (data) => {
          const words = data.words || [];
          words.splice(index, 1);
          chrome.storage.local.set({ words }, () => {
            renderWords(words);
            notifyUpdate();
          });
        });
      });
    });
  }

  function notifyUpdate() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: 'UPDATE' }).catch(() => {});
      });
    });
  }
});
