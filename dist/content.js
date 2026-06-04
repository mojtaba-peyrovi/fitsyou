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
// ── Size-chart selectors (tried first, per site) ─────────────────────────────
// Size guides usually live in a modal that may or may not be in the DOM at
// extraction time. We grab whatever is present; the backend tolerates misses.
const SIZE_GUIDE_SELECTORS = {
    'zara.com': ['[class*="size-guide"]', '[class*="measurements"]', '[data-qa-id*="size"]'],
    'asos.com': ['[id*="sizeandfit"]', '[class*="size-guide"]', '[class*="sizeChart"]'],
    'hm.com': ['[class*="size-guide"]', '[data-testid*="size-guide"]', '[class*="sizeGuide"]'],
    'zalando.com': ['[class*="size-table"]', '[data-testid*="size"]', '[class*="sizeChart"]'],
    'zalando.de': ['[class*="size-table"]', '[data-testid*="size"]', '[class*="sizeChart"]'],
    'zalando.co.uk': ['[class*="size-table"]', '[data-testid*="size"]', '[class*="sizeChart"]'],
    'mango.com': ['[class*="size-guide"]', '[class*="measurements"]', '[data-testid*="size"]'],
};
// Generic containers likely to hold a size/measurement table on any site.
const GENERIC_SIZE_SELECTORS = [
    '[class*="size-guide" i]',
    '[class*="sizeguide" i]',
    '[class*="size-chart" i]',
    '[class*="sizechart" i]',
    '[class*="measurement" i]',
    '[id*="size-guide" i]',
    '[id*="sizechart" i]',
    '[data-testid*="size" i]',
];
const MAX_CHART_LEN = 4000;
function normalizeText(el) {
    return (el.innerText || el.textContent || '')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}
/** Pick the candidate whose text most looks like a size table (has digits + size words). */
function scoreSizeChart(text) {
    if (!text)
        return 0;
    const digits = (text.match(/\d/g) ?? []).length;
    const hints = /\b(size|chest|bust|waist|hip|cm|inch|inches|length|small|medium|large|XS|XL)\b/i.test(text) ? 50 : 0;
    return digits + hints;
}
function extractSizeChart() {
    const hostname = location.hostname.replace(/^www\./, '');
    const siteName = Object.keys(SIZE_GUIDE_SELECTORS).find((k) => hostname.includes(k));
    const selectors = [...(siteName ? SIZE_GUIDE_SELECTORS[siteName] : []), ...GENERIC_SIZE_SELECTORS];
    let best = null;
    for (const selector of selectors) {
        let nodes;
        try {
            nodes = document.querySelectorAll(selector);
        }
        catch {
            continue; // skip selectors a given browser rejects (e.g. case-insensitive attr)
        }
        for (const node of Array.from(nodes)) {
            const text = normalizeText(node);
            if (text.length < 20)
                continue;
            const score = scoreSizeChart(text);
            if (!best || score > best.score)
                best = { text, score };
        }
    }
    // Require some signal it's actually a size table, not a stray "size" class.
    if (best && best.score >= 50)
        return best.text.slice(0, MAX_CHART_LEN);
    return undefined;
}
// ── Size-guide trigger (button/link that opens the chart modal) ───────────────
// Most retailers hide the size guide behind a "Size guide" button; the chart is
// not in the DOM until it's clicked. We find and click that trigger, wait for
// the chart to render, then scrape it (see resolveSizeChart).
// Per-site trigger selectors tried first. Kept loose because class names are
// obfuscated; the generic text scan below is the real workhorse.
const SIZE_GUIDE_TRIGGER_SELECTORS = {
    'zara.com': ['[data-qa-action*="size-guide"]', 'button[class*="size-guide"]'],
    'asos.com': ['button[aria-label*="size guide" i]', 'a[href*="sizeguide" i]', '[id*="sizeguide" i] button'],
    'hm.com': ['button[class*="sizeGuide" i]', '[data-testid*="size-guide"]'],
    'zalando.com': ['[data-testid*="size-guide"]', 'button[class*="size-flow" i]'],
    'zalando.de': ['[data-testid*="size-guide"]', 'button[class*="size-flow" i]'],
    'zalando.co.uk': ['[data-testid*="size-guide"]', 'button[class*="size-flow" i]'],
    'mango.com': ['[data-testid*="size-guide"]', 'button[class*="size-guide" i]'],
};
// Visible label of a clickable element that opens a size guide.
const TRIGGER_TEXT = /\b(size guide|size chart|size & fit|size and fit|measurements?|size info|fit guide|size help)\b/i;
function isClickable(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}
function findSizeGuideTrigger() {
    const hostname = location.hostname.replace(/^www\./, '');
    const siteName = Object.keys(SIZE_GUIDE_TRIGGER_SELECTORS).find((k) => hostname.includes(k));
    for (const selector of siteName ? SIZE_GUIDE_TRIGGER_SELECTORS[siteName] : []) {
        let el = null;
        try {
            el = document.querySelector(selector);
        }
        catch {
            continue;
        }
        if (el && isClickable(el))
            return el;
    }
    // Generic: scan clickable elements for a size-guide label.
    for (const el of Array.from(document.querySelectorAll('button, a, [role="button"]'))) {
        const label = (el.innerText || el.textContent || '').trim();
        const aria = el.getAttribute('aria-label') ?? '';
        if (label.length > 40 && aria.length > 40)
            continue; // skip large containers
        if ((TRIGGER_TEXT.test(label) || TRIGGER_TEXT.test(aria)) && isClickable(el)) {
            return el;
        }
    }
    return null;
}
// Poll (MutationObserver + interval) for the chart to render after a click.
function waitForSizeChart(timeoutMs) {
    return new Promise((resolve) => {
        let done = false;
        const finish = (val) => {
            if (done)
                return;
            done = true;
            observer.disconnect();
            clearInterval(interval);
            clearTimeout(timer);
            resolve(val);
        };
        const tryExtract = () => {
            const chart = extractSizeChart();
            if (chart)
                finish(chart);
        };
        const observer = new MutationObserver(tryExtract);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        const interval = setInterval(tryExtract, 250);
        const timer = setTimeout(() => finish(undefined), timeoutMs);
        tryExtract();
    });
}
// Best-effort: close the modal we opened so the user's page isn't disrupted.
function closeSizeGuide() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const scopedClose = document.querySelector('[role="dialog"] [aria-label*="close" i], [class*="modal" i] [aria-label*="close" i], [class*="modal" i] button[class*="close" i]');
    scopedClose?.click();
}
// Get the chart text: inline if present, otherwise click the trigger and wait.
async function resolveSizeChart() {
    const inline = extractSizeChart();
    if (inline)
        return inline;
    const trigger = findSizeGuideTrigger();
    if (!trigger)
        return undefined; // Part 2 (Playwright fallback) handles these
    trigger.click();
    const chart = await waitForSizeChart(3000);
    closeSizeGuide();
    return chart;
}
function extractSizes() {
    const SIZE_SELECTORS = [
        '[class*="size-selector"] button',
        '[class*="size-selector"] li',
        '[data-testid*="size"] button',
        'button[class*="size" i]',
        'select[name*="size" i] option',
    ];
    const sizes = [];
    let selected;
    for (const selector of SIZE_SELECTORS) {
        let nodes;
        try {
            nodes = document.querySelectorAll(selector);
        }
        catch {
            continue;
        }
        if (nodes.length === 0)
            continue;
        for (const node of Array.from(nodes)) {
            const label = (node.textContent || '').trim();
            if (!label || label.length > 12 || sizes.includes(label))
                continue;
            sizes.push(label);
            const el = node;
            const isSelected = el.getAttribute('aria-checked') === 'true' ||
                el.getAttribute('aria-selected') === 'true' ||
                node.selected === true ||
                /\b(selected|active|checked)\b/i.test(el.className);
            if (isSelected && !selected)
                selected = label;
        }
        if (sizes.length)
            break; // first selector that yields sizes wins
    }
    return {
        availableSizes: sizes.length ? sizes.slice(0, 20) : undefined,
        selectedSize: selected,
    };
}
/**
 * Score a candidate image: higher = cleaner product shot, more suitable for
 * try-on (flat-lay, front/back on plain background). Lower = lifestyle hero.
 */
function scoreProductShot(img, src) {
    let score = 0;
    const srcLower = src.toLowerCase();
    // URL signals: penalise lifestyle/editorial, boost studio/detail shots
    if (/[_\-/](model|lifestyle|editorial|campaign|styled|outfit|mannequin)[_\-/.]/.test(srcLower))
        score -= 30;
    if (/[_\-/](flat|front|back|studio|ghost|laydown|detail|zoom|pdp)[_\-/.]/.test(srcLower))
        score += 25;
    // Numeric index in URL: _01_ is usually the hero; _02_, _03_ often cleaner
    const numMatch = srcLower.match(/[_\-]0*(\d+)[_\-.]/);
    if (numMatch) {
        const idx = parseInt(numMatch[1], 10);
        if (idx === 1)
            score -= 10;
        else if (idx === 2 || idx === 3)
            score += 10;
    }
    // Aspect ratio: square (~1:1) → flat-lay; portrait → product; landscape → banner/hero
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (nw > 0 && nh > 0) {
        const ratio = nw / nh;
        if (ratio >= 0.85 && ratio <= 1.15)
            score += 20; // square: often flat-lay
        else if (ratio >= 0.55 && ratio < 0.85)
            score += 10; // portrait: typical product
        else if (ratio > 1.3)
            score -= 20; // landscape: likely hero/banner
    }
    // DOM context: thumbnail/gallery strips contain cleaner product angles
    if (img.closest('[class*="thumb" i],[class*="gallery" i],[class*="carousel" i],[class*="swatch" i]')) {
        score += 8;
    }
    // Hero/featured containers usually hold lifestyle shots
    if (img.closest('[class*="hero" i],[class*="featured" i],[class*="main-image" i]')) {
        score -= 10;
    }
    return score;
}
/** Pick the highest-scored image from a set of candidates, deduped by src. */
function bestScored(candidates) {
    if (candidates.length === 0)
        return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].src;
}
// ── Extraction layers ─────────────────────────────────────────────────────────
function extractWithSiteSelectors() {
    const hostname = location.hostname.replace(/^www\./, '');
    const siteName = Object.keys(SITE_SELECTORS).find((k) => hostname.includes(k));
    if (!siteName)
        return null;
    const seen = new Set();
    const candidates = [];
    for (const selector of SITE_SELECTORS[siteName]) {
        for (const el of Array.from(document.querySelectorAll(selector))) {
            if (!isValidProductImage(el))
                continue;
            const src = bestSrc(el);
            if (!src || seen.has(src))
                continue;
            seen.add(src);
            candidates.push({ src, score: scoreProductShot(el, src) });
        }
    }
    return bestScored(candidates);
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
    const seen = new Set();
    const candidates = [];
    for (const selector of selectors) {
        for (const el of Array.from(document.querySelectorAll(selector))) {
            if (!isValidProductImage(el))
                continue;
            const src = bestSrc(el);
            if (!src || seen.has(src))
                continue;
            seen.add(src);
            candidates.push({ src, score: scoreProductShot(el, src) });
        }
    }
    return bestScored(candidates);
}
function extractBestScoredImage() {
    const seen = new Set();
    const candidates = [];
    for (const img of Array.from(document.querySelectorAll('img'))) {
        if (!isValidProductImage(img))
            continue;
        const src = bestSrc(img);
        if (!src || seen.has(src))
            continue;
        seen.add(src);
        // Composite score: product-shot score + area bonus (prefer larger, but score dominates)
        const rect = img.getBoundingClientRect();
        const areaNorm = Math.min(rect.width * rect.height / 400000, 1) * 5; // up to +5 for size
        candidates.push({ src, score: scoreProductShot(img, src) + areaNorm });
    }
    return bestScored(candidates);
}
function extractOgImage() {
    const el = document.querySelector('meta[property="og:image"]');
    return el?.content && isValidProductUrl(el.content) ? el.content : null;
}
function extractProductImage() {
    return (extractWithSiteSelectors() ??
        extractWithGenericSelectors() ??
        extractBestScoredImage() ??
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
    // Async: resolveSizeChart may click a "Size guide" button and wait for the
    // modal to render. Returning true keeps the message channel open until we
    // call sendResponse.
    (async () => {
        const imageUrl = extractProductImage();
        if (!imageUrl) {
            sendResponse({ success: false });
            return;
        }
        const { availableSizes, selectedSize } = extractSizes();
        const sizeChartText = await resolveSizeChart();
        sendResponse({
            success: true,
            imageUrl,
            productTitle: extractProductTitle(),
            productUrl: location.href,
            sizeChartText,
            availableSizes,
            selectedSize,
        });
    })();
    return true;
});

/******/ })()
;
//# sourceMappingURL=content.js.map