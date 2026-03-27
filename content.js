(function() {
  let savedWords = [];
  let isEnabled = true;

  // Initialize
  chrome.storage.local.get(['words', 'enabled'], (data) => {
    savedWords = data.words || [];
    isEnabled = data.enabled !== undefined ? data.enabled : true;
    if (isEnabled) {
      highlightAll();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE') {
      chrome.storage.local.get(['words'], (data) => {
        savedWords = data.words || [];
        if (isEnabled) {
          refreshHighlights();
        }
      });
    } else if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
      if (isEnabled) {
        highlightAll();
      } else {
        removeHighlights();
      }
    }
  });

  function highlightAll() {
    if (savedWords.length === 0) return;
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement.classList.contains('wh-highlight') || 
              ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(node.parentElement.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }

    nodes.forEach(textNode => {
      let text = textNode.nodeValue;
      let hasMatch = false;
      
      // Sort words by length descending to match longer phrases first
      const sortedWords = [...savedWords].sort((a, b) => b.length - a.length);
      
      // Escape special characters for regex
      const escapedWords = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');

      if (regex.test(text)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        text.replace(regex, (match, p1, offset) => {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
          const span = document.createElement('span');
          span.className = 'wh-highlight';
          span.textContent = match;
          fragment.appendChild(span);
          lastIndex = offset + match.length;
        });
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }

  function removeHighlights() {
    const highlights = document.querySelectorAll('.wh-highlight');
    highlights.forEach(span => {
      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });
    // Simple normalization to merge adjacent text nodes
    document.body.normalize();
  }

  function refreshHighlights() {
    removeHighlights();
    highlightAll();
  }
})();
