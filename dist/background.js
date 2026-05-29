/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*******************************************!*\
  !*** ./extension/src/background/index.ts ***!
  \*******************************************/

// Auth token arrives from the web app page (external sender), so it must be
// handled by onMessageExternal — onMessage only receives internal messages.
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
    if (message.type === 'AUTH_TOKEN') {
        chrome.storage.local.set({
            fitsyou_token: message.token,
            fitsyou_refresh_token: message.refreshToken,
        }, () => {
            sendResponse({ ok: true });
        });
        return true;
    }
});
// PRODUCT_EXTRACTED is now handled directly in the popup (see popup/index.tsx).
// Background only needs to receive and store the auth token from the web app.
chrome.runtime.onMessage.addListener((_message, _sender, _sendResponse) => {
    // reserved for future use
});

/******/ })()
;
//# sourceMappingURL=background.js.map