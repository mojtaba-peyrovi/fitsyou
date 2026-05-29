/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*******************************************!*\
  !*** ./extension/src/background/index.ts ***!
  \*******************************************/

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'PRODUCT_EXTRACTED')
        return;
    const data = message.data;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        const productUrl = tab?.url ?? data.productUrl;
        console.log('[fitsyou] Product extracted:', {
            imageUrl: data.imageUrl,
            productTitle: data.productTitle,
            productUrl,
        });
        // TODO (Week 3): POST to fitsyou backend API
        sendResponse({ ok: true });
    });
    return true; // keep message channel open for async response
});

/******/ })()
;
//# sourceMappingURL=background.js.map