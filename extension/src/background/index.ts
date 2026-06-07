interface ExtractedProduct {
  imageUrl: string;
  productTitle: string;
  productUrl: string;
}

interface AuthTokenMessage {
  type: 'AUTH_TOKEN';
  token: string;
  refreshToken: string;
}

interface ProductExtractedMessage {
  type: 'PRODUCT_EXTRACTED';
  data: ExtractedProduct;
}

type IncomingMessage = AuthTokenMessage | ProductExtractedMessage;

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return;
  const key = process.env.POSTHOG_KEY;
  if (!key) return;
  fetch('https://us.i.posthog.com/capture/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      event: 'extension_installed',
      distinct_id: 'anonymous_install',
      properties: { source: 'extension' },
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
});

// Auth token arrives from the web app page (external sender), so it must be
// handled by onMessageExternal — onMessage only receives internal messages.
chrome.runtime.onMessageExternal.addListener((message: AuthTokenMessage, sender, sendResponse) => {
  if (message.type === 'AUTH_TOKEN') {
    chrome.storage.local.set({
      fitsyou_token: message.token,
      fitsyou_refresh_token: message.refreshToken,
    }, () => {
      sendResponse({ ok: true });
      // Auth completed in a separate tab — close it and bring the user
      // straight back into the extension so there's no manual tab juggling.
      const tabId = sender.tab?.id;
      const windowId = sender.tab?.windowId;
      if (windowId) chrome.sidePanel.open({ windowId });
      if (tabId !== undefined) chrome.tabs.remove(tabId);
    });
    return true;
  }
});

interface OpenPopupMessage {
  type: 'OPEN_POPUP';
}

type AnyMessage = IncomingMessage | OpenPopupMessage;

// Open the side panel when the toolbar icon is clicked (no default_popup set).
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// PRODUCT_EXTRACTED is handled directly in the popup (see popup/index.tsx).
// OPEN_POPUP is sent by the floating badge in the content script.
chrome.runtime.onMessage.addListener((message: AnyMessage, sender, _sendResponse) => {
  if (message.type === 'OPEN_POPUP') {
    const windowId = sender.tab?.windowId;
    if (windowId) {
      chrome.sidePanel.open({ windowId });
    }
  }
});
