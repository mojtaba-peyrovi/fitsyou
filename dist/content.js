/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!****************************************!*\
  !*** ./extension/src/content/index.ts ***!
  \****************************************/

function extractProductImage() {
    // Layer 1: targeted DOM selectors
    const layer1Selectors = [
        '[data-main-image]',
        'img[class*="product-image"]',
        'img[class*="main-image"]',
        'img[id*="main-image"]',
    ];
    for (const selector of layer1Selectors) {
        const el = document.querySelector(selector);
        if (el && isValidImage(el))
            return el.src;
    }
    // Layer 1 fallback: largest visible img on the page
    const largest = findLargestImage();
    if (largest)
        return largest;
    // Layer 2: og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content)
        return ogImage.content;
    return null;
}
function isValidImage(img) {
    if (!img.src || img.src.endsWith('.svg'))
        return false;
    const rect = img.getBoundingClientRect();
    return rect.width >= 200 && rect.height >= 200;
}
function findLargestImage() {
    let best = null;
    let bestArea = 0;
    for (const img of Array.from(document.querySelectorAll('img'))) {
        if (!img.src || img.src.endsWith('.svg'))
            continue;
        const rect = img.getBoundingClientRect();
        if (rect.width < 200 || rect.height < 200)
            continue;
        const area = rect.width * rect.height;
        if (area > bestArea) {
            bestArea = area;
            best = img;
        }
    }
    return best?.src ?? null;
}
function extractProductTitle() {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content)
        return ogTitle.content;
    if (document.title)
        return document.title;
    return `Saved item from ${location.hostname}`;
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'EXTRACT_PRODUCT')
        return;
    const imageUrl = extractProductImage();
    if (!imageUrl) {
        sendResponse({ success: false });
        return;
    }
    sendResponse({
        success: true,
        imageUrl,
        productTitle: extractProductTitle(),
        productUrl: location.href,
    });
});

/******/ })()
;
//# sourceMappingURL=content.js.map