/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!****************************************!*\
  !*** ./extension/src/content/index.ts ***!
  \****************************************/

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Return the best src from an img element: currentSrc > data-src > src */
function bestSrc(img) {
    const candidates = [
        img.currentSrc,
        img.getAttribute('data-src'),
        img.getAttribute('data-lazy-src'),
        img.getAttribute('data-original'),
        img.src,
    ];
    for (const src of candidates) {
        if (src && !src.startsWith('data:') && !src.startsWith('blob:') && src.trim() !== '') {
            return src;
        }
    }
    return null;
}
const NON_PRODUCT_PATTERNS = /\/(logo|icon|banner|sprite|ads?|placeholder|pixel|tracking|badge)\b/i;
function isValidProductUrl(src) {
    if (!src)
        return false;
    if (src.startsWith('data:') || src.startsWith('blob:'))
        return false;
    if (NON_PRODUCT_PATTERNS.test(src))
        return false;
    return true;
}
function isValidProductImage(img) {
    const src = bestSrc(img);
    if (!src || !isValidProductUrl(src))
        return false;
    const rect = img.getBoundingClientRect();
    // Must be large enough AND either visible or in a product gallery (off-screen carousels)
    if (rect.width < 200 || rect.height < 200)
        return false;
    // Reject images that are actually 1×1 placeholders rendered at a large size
    if (img.naturalWidth > 0 && img.naturalWidth < 10)
        return false;
    if (img.naturalHeight > 0 && img.naturalHeight < 10)
        return false;
    return true;
}
// ── Site-specific selectors (tried first) ────────────────────────────────────
// Using structural/attribute selectors that survive CSS class obfuscation.
const SITE_SELECTORS = {
    'zara.com': [
        'img[class*="media-image__image"]',
        '[data-qa-action="open-image-zoom"] img',
        'img[class*="product-media"]',
    ],
    'asos.com': [
        'img[data-auto-id="thumbnailImage"]',
        'img[class*="ProductImage"]',
        '#product-hero img',
    ],
    'hm.com': [
        'img[class*="ProductImage"]',
        '[data-testid="pdpMainImage"] img',
        'img[class*="product-detail"]',
    ],
    'zalando.com': [
        'img[class*="cat_dynimage"]',
        'img[data-testid="image"]',
        'img[class*="w-full"][class*="h-full"]',
    ],
    'zalando.de': [
        'img[class*="cat_dynimage"]',
        'img[data-testid="image"]',
        'img[class*="w-full"][class*="h-full"]',
    ],
    'zalando.co.uk': [
        'img[class*="cat_dynimage"]',
        'img[data-testid="image"]',
        'img[class*="w-full"][class*="h-full"]',
    ],
    'mango.com': [
        'img[class*="product-main"]',
        'img[class*="photo-zoom"]',
        '[data-testid="product-image"] img',
        'img[class*="product-detail"]',
    ],
};
// ── Extraction layers ─────────────────────────────────────────────────────────
function extractWithSiteSelectors() {
    const hostname = location.hostname.replace(/^www\./, '');
    const siteName = Object.keys(SITE_SELECTORS).find((k) => hostname.includes(k));
    if (!siteName)
        return null;
    for (const selector of SITE_SELECTORS[siteName]) {
        const el = document.querySelector(selector);
        if (el && isValidProductImage(el)) {
            const src = bestSrc(el);
            if (src)
                return src;
        }
    }
    return null;
}
function extractWithGenericSelectors() {
    const selectors = [
        '[data-main-image]',
        'img[class*="product-image"]',
        'img[class*="main-image"]',
        'img[id*="main-image"]',
        'img[class*="ProductImage"]',
        'img[class*="hero-image"]',
        'img[data-testid*="product"]',
        '[data-testid*="product"] img',
    ];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && isValidProductImage(el)) {
            const src = bestSrc(el);
            if (src)
                return src;
        }
    }
    return null;
}
function extractLargestImage() {
    let best = null;
    for (const img of Array.from(document.querySelectorAll('img'))) {
        if (!isValidProductImage(img))
            continue;
        const src = bestSrc(img);
        if (!src)
            continue;
        const rect = img.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (!best || area > best.area) {
            best = { src, area };
        }
    }
    return best?.src ?? null;
}
function extractOgImage() {
    const el = document.querySelector('meta[property="og:image"]');
    return el?.content && isValidProductUrl(el.content) ? el.content : null;
}
function extractProductImage() {
    return (extractWithSiteSelectors() ??
        extractWithGenericSelectors() ??
        extractLargestImage() ??
        extractOgImage());
}
function extractProductTitle() {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content)
        return ogTitle.content;
    if (document.title)
        return document.title;
    return `Saved item from ${location.hostname}`;
}
// ── Message listener ──────────────────────────────────────────────────────────
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