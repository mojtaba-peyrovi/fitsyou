# Chrome Web Store — Listing Copy & Privacy Practices Tab Content

Copy-paste source for the Developer Dashboard when submitting the beta (Unlisted) listing.
Store-scope wording is deliberately generic ("supported stores") rather than hardcoding the
retailer list — see `fitsyou-web-app/store-scope-fix-checklist.md` for the rationale. The
canonical, always-current retailer list lives at fitsyou.live/supported-stores; update that one
page when retailers are added, not this file.

## Store listing

**Short description:**
> See how clothes from your favorite stores look on you — before you buy.

**Detailed description:**
> **See it on you before you buy.**
>
> fitsyou is a browser extension that shows you how clothing items look on your own body before you commit to a purchase. Spot something you like on a supported store — click the fitsyou icon, and see a realistic preview of you wearing it, plus a sizing verdict based on your measurements and the store's own size chart.
>
> **How it works:**
> 1. Add fitsyou and set up your profile with one photo
> 2. Browse a supported fashion store as normal
> 3. Click the fitsyou icon on any product you're considering
> 4. Get a realistic try-on image and a fit recommendation in seconds
> 5. Save it to your fitsyou profile and decide with confidence
>
> See the full list of currently supported stores at fitsyou.live/supported-stores — we're adding more regularly.
>
> **Why it helps:**
> Online fashion shopping means guessing how something will actually look and fit. fitsyou removes the guesswork — so you buy less, return less, and feel sure before you check out.
>
> 5 free try-ons every month, no credit card required.
>
> Your photo is used only to generate your own try-on images and is handled under our privacy policy, available at fitsyou.live/privacy.

## Privacy practices tab

Each permission justification ties back to the single-purpose description, since Chrome
reviewers check for that link explicitly.

### Single purpose

> fitsyou's single purpose is to let a shopper preview how a clothing item will look on their own photo while browsing supported online fashion retailers, and to provide a sizing recommendation based on the retailer's size chart. The current list of supported retailers is published at fitsyou.live/supported-stores.

### Permission justifications

| Permission | Why it's needed | Ties to single purpose |
|---|---|---|
| `activeTab` | Reads the product page (image, title, price, size chart) the user is currently viewing, only when they actively click the extension icon or "Save this item" — never in the background. | The extracted product data is exactly what's needed to render the try-on preview the user asked for. |
| `storage` | Stores the user's auth/session tokens, cached wishlist/wardrobe canvas state, and the analytics-consent decision locally via `chrome.storage.local`. No browsing history is stored. | Keeps the user signed in and their in-progress outfit selections intact across popup open/close — core to the try-on workflow. |
| `scripting` | Injects the content script that extracts product image/title/price from the page DOM, and the on-page launcher badge, when the user is on a supported retailer site. | This is the mechanism that reads the product the user wants to try on. |
| `sidePanel` | Renders the extension's UI (wishlist, wardrobe, fitting room, try-ons) in Chrome's side panel instead of a popup. | The side panel **is** the product surface where try-ons happen. |
| `host_permissions` | Used to detect product pages and extract the product image on the specific retailer sites fitsyou currently supports, so a try-on can be generated. No other sites are accessed. | Scoped exactly to the retailers listed at fitsyou.live/supported-stores — no broad or `<all_urls>` grant. |

### Content script matches (informational — not a dashboard field)

Both `badge.js` (on-page launcher icon) and `content.js` (product scraper) are scoped to the
same domains — the current supported-retailer list, published at fitsyou.live/supported-stores:

- `*://*.zara.com/*`
- `*://*.asos.com/*`
- `*://*.hm.com/*`
- `*://*.zalando.com/*`, `*://*.zalando.de/*`, `*://*.zalando.co.uk/*` (Zalando, 3 regional TLDs)
- `*://*.mango.com/*`

### Remote code

No remote code is loaded. `content_security_policy.extension_pages` is `script-src 'self'`;
all extension logic is bundled at build time via webpack into `dist/`. The only runtime network
calls are data calls (fitsyou.live API, OpenAI image generation, PostHog analytics) — never
script/code fetches.

### Permissions audit (2026-06-24)

Re-audited `extension/public/manifest.json` against this doc: `host_permissions` and both
`content_scripts` entries are scoped to the 7 domains above (5 retailers) — no `https://*/*` /
`http://*/*` broad grant remains, so the badge no longer appears on non-supported sites. This
doc previously described an older broad-permission badge architecture; updated here to match
the current manifest exactly, per the store-scope-fix-checklist acceptance check (no drift
between what the listing promises and what the extension actually accesses).
