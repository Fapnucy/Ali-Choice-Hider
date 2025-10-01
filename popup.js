// Klucze zgodne z content.js
const K_ENABLED = 'aeChoiceEnabled';
const K_HIDE    = 'aeChoiceHide';

const enabledEl = document.getElementById('enabled');
const hideEl    = document.getElementById('hideMode');

// Wczytaj stan (z sensownymi domyślnymi wartościami)
chrome.storage.sync.get({ [K_ENABLED]: false, [K_HIDE]: false }, v => {
  enabledEl.checked = !!v[K_ENABLED];
  hideEl.checked    = !!v[K_HIDE];
});

// Zapisuj zmiany
enabledEl.addEventListener('change', () => {
  chrome.storage.sync.set({ [K_ENABLED]: enabledEl.checked });
});

hideEl.addEventListener('change', () => {
  chrome.storage.sync.set({ [K_HIDE]: hideEl.checked });
});
