chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['words', 'enabled'], (data) => {
    if (data.words === undefined) {
      chrome.storage.local.set({ words: [] });
    }
    if (data.enabled === undefined) {
      chrome.storage.local.set({ enabled: true });
    }
  });
  console.log('Word Highlighter extension installed');
});
