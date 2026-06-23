# Chrome Web Store — Privacy Practices Tab Content

Copy-paste source for the Developer Dashboard's "Privacy practices" tab when submitting
the beta (Unlisted) listing. Each permission justification ties back to the single-purpose
description, since Chrome reviewers check for that link explicitly.

## Single purpose

> fitsyou lets a shopper preview how clothing items look on their own photo while browsing
> supported online fashion stores.

## Permission justifications

| Permission | Why it's needed | Ties to single purpose |
|---|---|---|
| `activeTab` | Reads the product page (image, title, price, size chart) the user is currently viewing, only when they actively click the extension icon or "Save this item" — never in the background. | The extracted product data is exactly what's needed to render the try-on preview the user asked for. |
| `storage` | Stores the user's auth/session tokens, cached wishlist/wardrobe canvas state, and the analytics-consent decision locally via `chrome.storage.local`. No browsing history is stored. | Keeps the user signed in and their in-progress outfit selections intact across popup open/close — core to the try-on workflow. |
| `scripting` | Injects the content script that extracts product image/title/price from the page DOM when the user requests it. | This is the mechanism that reads the product the user wants to try on. |
| `sidePanel` | Renders the extension's UI (wishlist, wardrobe, fitting room, try-ons) in Chrome's side panel instead of a popup. | The side panel **is** the product surface where try-ons happen. |
| `host_permissions` (`https://*/*`, `http://*/*`) | Two content scripts use this: (1) `badge.js`, a small floating launcher icon shown on every page so the user can open fitsyou from any site they're shopping on — including sites outside our seven priority retailers, via the manual-screenshot-upload fallback; (2) `content.js`, the retailer-specific product scraper, scoped separately to the seven supported retailer domains (see below) but declared under the same broad host permission set because Chrome's content-script matching for the badge requires it. The badge itself reads and transmits nothing — it only opens the side panel on click. | Broad badge visibility is what lets a shopper discover and use fitsyou on any fashion site, which is the single purpose above; the badge collects no data, so the broad grant doesn't expand what's actually collected. |

## Content script matches (informational — not a dashboard field)

- `badge.js` — `https://*/*`, `http://*/*` (badge only; no data read or sent until clicked)
- `content.js` — `*://*.zara.com/*`, `*://*.asos.com/*`, `*://*.hm.com/*`, `*://*.zalando.com/*`, `*://*.zalando.de/*`, `*://*.zalando.co.uk/*`, `*://*.mango.com/*`

## Remote code

No remote code is loaded. `content_security_policy.extension_pages` is `script-src 'self'`;
all extension logic is bundled at build time via webpack into `dist/`. The only runtime network
calls are data calls (fitsyou.live API, OpenAI image generation, PostHog analytics) — never
script/code fetches.

## Permissions audit (2026-06-23)

Audited `extension/public/manifest.json`. Every declared permission and host permission is used
by a shipping feature; none are unused or speculative. See `fitsyou-web-app/COMPLIANCE.md`
(2026-06-08 entry, "Chrome Web Store policy compliance") for the original manifest-vs-policy
consistency review this builds on.
