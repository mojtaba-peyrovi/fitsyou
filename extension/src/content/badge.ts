// Floating fitsyou badge — injected on every page the user visits.
// Visible only when signed in (fitsyou_token in chrome.storage.local).
// Clicking it opens the extension popup via the background service worker.

const BADGE_HOST_ID = '__fitsyou_badge__';

function buildBadge(): HTMLElement {
  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.cssText =
    'position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:2147483647;display:none';

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 24px 0 0 24px;
      background: #121212;
      border: none;
      padding: 0;
      cursor: pointer;
      box-shadow: -3px 0 16px rgba(0,0,0,0.40);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    button:hover {
      transform: translateX(-5px);
      box-shadow: -5px 0 20px rgba(0,0,0,0.50);
    }
    button:active {
      transform: translateX(-2px);
    }
    img {
      display: block;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin-right: 4px;
    }
  `;

  const btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Open fitsyou');
  btn.title = 'fitsyou — try clothes on yourself';

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('icons/icon-48.png');
  img.alt = 'fitsyou';

  btn.appendChild(img);
  btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });

  shadow.appendChild(style);
  shadow.appendChild(btn);
  return host;
}

function getBadgeHost(): HTMLElement {
  let el = document.getElementById(BADGE_HOST_ID);
  if (!el) {
    el = buildBadge();
    document.documentElement.appendChild(el);
  }
  return el;
}

function setVisible(visible: boolean): void {
  const el = document.getElementById(BADGE_HOST_ID);
  if (el) el.style.display = visible ? 'block' : 'none';
}

// Initial auth check on page load.
chrome.storage.local.get('fitsyou_token', (result) => {
  const signedIn = !!result['fitsyou_token'];
  getBadgeHost(); // ensure injected
  setVisible(signedIn);
});

// React to sign-in / sign-out without a page reload.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !('fitsyou_token' in changes)) return;
  const signedIn = !!changes['fitsyou_token'].newValue;
  getBadgeHost();
  setVisible(signedIn);
});
