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
            if (windowId) {
                chrome.sidePanel.open({ windowId });
                setPanelOpen(windowId, true);
            }
            if (tabId !== undefined)
                chrome.tabs.remove(tabId);
        });
        return true;
    }
});
// chrome.sidePanel has no close()/isOpen() API, so "is it open" is tracked
// here ourselves (per window), kept in sync by the panel itself reporting
// SIDEPANEL_CLOSED when it tears down (see popup/index.tsx's pagehide hook).
// This must stay a plain synchronous in-memory check: chrome.sidePanel.open()
// only succeeds when called directly within the click's user-gesture chain,
// and awaiting anything (e.g. chrome.storage.session.get) before calling it
// lets that gesture go stale, so open() silently no-ops.
const openPanelWindows = new Set();
function isPanelOpen(windowId) {
    return openPanelWindows.has(windowId);
}
function setPanelOpen(windowId, open) {
    if (open)
        openPanelWindows.add(windowId);
    else
        openPanelWindows.delete(windowId);
}
// Open the side panel when the toolbar icon is clicked (no default_popup set).
chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
        setPanelOpen(tab.windowId, true);
    }
});
// PRODUCT_EXTRACTED is handled directly in the popup (see popup/index.tsx).
// OPEN_POPUP (legacy) and TOGGLE_PANEL are sent by the floating badge in the
// content script — TOGGLE_PANEL closes the panel on a second click by asking
// the panel's own script to call window.close() on itself, since that's the
// only way a side panel can close itself.
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    if (message.type === 'OPEN_POPUP') {
        const windowId = sender.tab?.windowId;
        if (windowId) {
            chrome.sidePanel.open({ windowId });
            setPanelOpen(windowId, true);
        }
    }
    else if (message.type === 'TOGGLE_PANEL') {
        const windowId = sender.tab?.windowId;
        if (windowId === undefined)
            return;
        if (isPanelOpen(windowId)) {
            chrome.runtime.sendMessage({ type: 'CLOSE_SIDEPANEL', windowId });
            setPanelOpen(windowId, false);
        }
        else {
            chrome.sidePanel.open({ windowId });
            setPanelOpen(windowId, true);
        }
    }
    else if (message.type === 'SIDEPANEL_CLOSED') {
        setPanelOpen(message.windowId, false);
    }
});

/******/ })()
;
//# sourceMappingURL=background.js.map