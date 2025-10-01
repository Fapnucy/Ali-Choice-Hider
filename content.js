// AliExpress Choice Hider — final z usuwaniem pustych miejsc
// Szuka WYŁĄCZNIE obrazka .../154x64.png (badge "Choice")
// Dwa tryby: wyszarzanie / ukrywanie (usuwanie całych komórek z DOM)

const K_ENABLED = 'aeChoiceEnabled';
const K_HIDE    = 'aeChoiceHide';

const CHOICE_IMG_EXACT = /\/154x64\.png(?:$|\?)/i;

// Selektory pojedynczych kart
const CARD_SELECTORS = [
  '#card-list .card-out-wrapper',
  '#card-list .search-item-card',
];

// CSS (wyszarzanie + ukrywanie fallback)
(function injectStyle() {
  if (document.getElementById('_ae_choice_style')) return;
  const s = document.createElement('style');
  s.id = '_ae_choice_style';
  const selGrey = CARD_SELECTORS.map(sel => `${sel}[data-ae-choice-grey="1"]`).join(', ');
  const selHide = CARD_SELECTORS.map(sel => `${sel}[data-ae-choice-hidden="1"]`).join(', ');
  s.textContent = `
    ${selGrey} {
      filter: grayscale(100%);
      opacity: .35;
      outline: 2px dashed rgba(255,165,0,.6);
      outline-offset: 2px;
      transition: filter .2s, opacity .2s;
    }
    ${selHide} {
      display: none !important;
    }
  `;
  document.head.appendChild(s);
})();

let stateLoaded = false;
let enabled  = false;
let hideMode = false;
let mo = null;

// Najbliższa karta od obrazka
function closestCard(node) {
  let n = node;
  for (let i = 0; n && i < 10; i++, n = n.parentElement) {
    if (!n.matches) continue;
    for (const sel of CARD_SELECTORS) {
      if (n.matches(sel)) return n;
    }
  }
  return null;
}

// Znajdź „komórkę” siatki (#card-list > child)
function findListCell(node) {
  const list = document.getElementById('card-list');
  if (!list) return node;
  let n = node;
  for (let i = 0; n && i < 20; i++, n = n.parentElement) {
    if (n.parentElement === list) return n;
  }
  return node; // fallback
}

// Czyść wszystkie style
function clearAll() {
  document.querySelectorAll(CARD_SELECTORS.join(',')).forEach(card => {
    card.removeAttribute('data-ae-choice-grey');
    card.removeAttribute('data-ae-choice-hidden');
  });
}

function process() {
  if (!stateLoaded) return;
  clearAll();
  if (!enabled) return;

  // Znajdź wszystkie obrazki Choice i zbierz ich karty
  const toMark = new Set();
  document.querySelectorAll('img').forEach(img => {
    const src = (img.currentSrc || img.src || '').toLowerCase();
    if (!CHOICE_IMG_EXACT.test(src)) return;
    const card = closestCard(img);
    if (card) toMark.add(card);
  });

  // Wyszarzaj albo usuwaj
  if (hideMode) {
    toMark.forEach(card => {
      const cell = findListCell(card);
      if (cell && cell.isConnected) cell.remove();
    });
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  } else {
    toMark.forEach(card => {
      card.removeAttribute('data-ae-choice-hidden');
      card.setAttribute('data-ae-choice-grey', '1');
    });
  }
}

function attachObserver() {
  if (mo) return;
  mo = new MutationObserver(() => process());
  mo.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });
}
function detachObserver() { if (mo) { mo.disconnect(); mo = null; } }

function applyState({ enabled: en, hideMode: hm }) {
  enabled  = !!en;
  hideMode = !!hm;
  if (enabled) attachObserver(); else detachObserver();
  process();
}

// Start — wczytaj ustawienia
chrome.storage.sync.get([K_ENABLED, K_HIDE], v => {
  stateLoaded = true;
  applyState({ enabled: !!v[K_ENABLED], hideMode: !!v[K_HIDE] });
});
chrome.storage.onChanged.addListener(ch => {
  if (!stateLoaded) return;
  const next = { enabled, hideMode };
  if (ch[K_ENABLED]) next.enabled  = !!ch[K_ENABLED].newValue;
  if (ch[K_HIDE])    next.hideMode = !!ch[K_HIDE].newValue;
  applyState(next);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', process, { once: true });
} else {
  process();
}
