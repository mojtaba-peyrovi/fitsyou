interface ExtractResult {
  success: boolean;
  imageUrl?: string;
  productTitle?: string;
  productUrl?: string;
}

function extractProductImage(): string | null {
  // Layer 1: targeted DOM selectors
  const layer1Selectors = [
    '[data-main-image]',
    'img[class*="product-image"]',
    'img[class*="main-image"]',
    'img[id*="main-image"]',
  ];

  for (const selector of layer1Selectors) {
    const el = document.querySelector<HTMLImageElement>(selector);
    if (el && isValidImage(el)) return el.src;
  }

  // Layer 1 fallback: largest visible img on the page
  const largest = findLargestImage();
  if (largest) return largest;

  // Layer 2: og:image meta tag
  const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  if (ogImage?.content) return ogImage.content;

  return null;
}

function isValidImage(img: HTMLImageElement): boolean {
  if (!img.src || img.src.endsWith('.svg')) return false;
  const rect = img.getBoundingClientRect();
  return rect.width >= 200 && rect.height >= 200;
}

function findLargestImage(): string | null {
  let best: HTMLImageElement | null = null;
  let bestArea = 0;

  for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('img'))) {
    if (!img.src || img.src.endsWith('.svg')) continue;
    const rect = img.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 200) continue;
    const area = rect.width * rect.height;
    if (area > bestArea) {
      bestArea = area;
      best = img;
    }
  }

  return best?.src ?? null;
}

function extractProductTitle(): string {
  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (ogTitle?.content) return ogTitle.content;
  if (document.title) return document.title;
  return `Saved item from ${location.hostname}`;
}

chrome.runtime.onMessage.addListener((message: { type: string }, _sender: chrome.runtime.MessageSender, sendResponse: (response: ExtractResult) => void) => {
  if (message.type !== 'EXTRACT_PRODUCT') return;

  const imageUrl = extractProductImage();

  if (!imageUrl) {
    sendResponse({ success: false } satisfies ExtractResult);
    return;
  }

  sendResponse({
    success: true,
    imageUrl,
    productTitle: extractProductTitle(),
    productUrl: location.href,
  } satisfies ExtractResult);
});
