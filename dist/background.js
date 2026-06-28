/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*******************************************!*\
  !*** ./extension/src/background/index.ts ***!
  \*******************************************/

// No analytics consent exists yet at install time (the popup hasn't been
// opened, so the consent banner hasn't been shown) — sending an event here
// unconditionally would collect data before any consent decision, so this
// install ping is intentionally not sent. The popup's own
// 'sidepanel_opened' capture (gated on consent) is the first analytics event.
// Auth token arrives from the web app page (external sender), so it must be
// handled by onMessageExternal — onMessage only receives internal messages.
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
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
            if (windowId)
                chrome.sidePanel.open({ windowId });
            if (tabId !== undefined)
                chrome.tabs.remove(tabId);
        });
        return true;
    }
});
// Open the side panel when the toolbar icon is clicked (no default_popup set).
chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
// PRODUCT_EXTRACTED is handled directly in the popup (see popup/index.tsx).
// OPEN_POPUP is sent by the floating badge in the content script.
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    if (message.type === 'OPEN_POPUP') {
        const windowId = sender.tab?.windowId;
        if (windowId) {
            chrome.sidePanel.open({ windowId });
        }
    }
});

/******/ })()
;
//# sourceMappingURL=background.js.map