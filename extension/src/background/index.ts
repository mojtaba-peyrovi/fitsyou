interface ExtractedProduct {
  imageUrl: string;
  productTitle: string;
  productUrl: string;
}

chrome.runtime.onMessage.addListener((message: { type: string; data: ExtractedProduct }, _sender: chrome.runtime.MessageSender, sendResponse: (r: { ok: boolean }) => void) => {
  if (message.type !== 'PRODUCT_EXTRACTED') return;

  const data: ExtractedProduct = message.data;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]: chrome.tabs.Tab[]) => {
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
