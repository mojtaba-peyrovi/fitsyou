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
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PRODUCT_EXTRACTED') {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            const productUrl = tab?.url ?? message.data.productUrl;
            console.log('[fitsyou] Product extracted:', {
                imageUrl: message.data.imageUrl,
                productTitle: message.data.productTitle,
                productUrl,
            });
            // TODO (Week 4): POST to /api/generate
            sendResponse({ ok: true });
        });
        return true;
    }
});

/******/ })()
;
//# sourceMappingURL=background.js.map