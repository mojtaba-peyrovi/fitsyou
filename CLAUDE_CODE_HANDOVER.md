# fitsyou — Claude Code Handover Document
# Week 2, Task 1: Scaffold Manifest V3 Extension + GitHub Repo

---

## What We Are Building

fitsyou is a lightweight Chrome extension + web profile that lets users see how a clothing item they find on any fashion site looks on them — using their own photo — before they buy.

One sentence: **see it, try it on yourself, save it, decide.**

Quality bar: good enough to make a buy decision. Not studio perfect. Not a wardrobe manager. Not a styling tool. One thing done well.

---

## The Core User Flow

1. User installs the fitsyou Chrome extension
2. User sets up a minimal profile — one photo of themselves, body type, backdrop preference
3. User browses any fashion store as normal
4. They see an item they like → click the fitsyou extension icon
5. Extension extracts the product image from the page
6. Sends user photo + product image → GPT Image 1.5 API → 2–3 try-on variants generated
7. Try-on images + product link saved automatically to user's fitsyou profile at fitsyou.live
8. User revisits saved try-ons anytime and clicks through to buy

---

## Locked Decisions — Do Not Reopen

- **Try-on API:** GPT Image 1.5 (`gpt-image-1.5`), standard quality, real-time (not Batch)
- **Extension:** Manifest V3, TypeScript, Preact
- **Web app:** Next.js on Vercel (built in Week 4)
- **Auth + DB:** Supabase (Postgres)
- **Image storage:** Cloudflare R2
- **Payments:** Paddle (EU VAT handled automatically)
- **No Playwright server-side worker** — deferred post-launch
- **No three-input pipeline** — only two inputs: user photo + product image
- **No agentic AI, no LLM reasoning loop** — fixed deterministic pipeline: extract → compose → save

---

## Pricing Model (Caps-Based)

- Free tier: 5 try-ons/month, watermarked, saved for 7 days
- Pro tier (€4.99/mo): 20 try-ons/month, no watermark, permanent save
- Power tier (€9.99/mo): 100 try-ons/month, no watermark, permanent save, priority generation

---

## Tech Stack

| Layer | Choice |
|---|---|
| Extension | Manifest V3 + TypeScript + Preact |
| Frontend/API | Next.js on Vercel |
| Auth + DB | Supabase (Postgres) |
| Image storage | Cloudflare R2 |
| Payments | Paddle |
| Try-on API | GPT Image 1.5 |

---

## Current Repo State

- GitHub repo: `fitsyou` (private)
- npm initialized, 136 packages installed
- Dependencies installed: `preact`, `typescript`, `webpack`, `webpack-cli`, `ts-loader`, `copy-webpack-plugin`, `@types/chrome`
- Folders created: `extension/src`, `extension/public`
- **NOT yet created:** `tsconfig.json`, `webpack.config.js`, `manifest.json`, any source files

---

## Week 2 Task 1 — What Needs to Be Built

### 1. `tsconfig.json` (root)
- Target: ES2020
- JSX: preact/compat
- Strict mode on
- Path alias: `@/*` → `./extension/src/*`

### 2. `webpack.config.js` (root)
- Three entry points: `popup`, `content`, `background`
- Output to `/dist`
- Copy `extension/public` to dist via CopyPlugin
- Preact aliases for react/react-dom

### 3. `extension/public/manifest.json`
- Manifest V3
- Name: fitsyou
- Permissions: `activeTab`, `storage`, `scripting`
- Action: popup → `popup.html`
- Content script: runs on all fashion priority sites
- Background: service worker

### 4. `extension/public/popup.html`
- Minimal shell that loads `popup.js`

### 5. `extension/src/popup/index.tsx`
- Single button UI in Preact
- Button text: "Try this on"
- On click: sends message to content script to extract product image
- Shows loading state while extracting
- Shows success/error feedback

### 6. `extension/src/content/index.ts`
- Listens for message from popup
- Layer 1: DOM extraction — find main product image
  - Look for: `img[class*="product"]`, largest visible `<img>` on page, `[data-main-image]`, `[id*="main-image"]`
- Layer 2: og:image meta tag fallback
- Layer 3: if both fail, send message back to popup to trigger manual upload UI
- Also extracts product title: `og:title` → `document.title` → `"Saved item from " + location.hostname`
- Returns: `{ imageUrl, productTitle, productUrl }`

### 7. `extension/src/background/index.ts`
- Service worker
- Listens for messages from content script
- Captures current tab URL (always reliable)
- Placeholder for future API call to fitsyou backend

### 8. `package.json` scripts
```json
"scripts": {
  "build": "webpack --config webpack.config.js",
  "watch": "webpack --config webpack.config.js --watch",
  "build:prod": "webpack --config webpack.config.js --mode production"
}
```

---

## Priority Sites for Extraction (Must Work)

1. Zara (zara.com)
2. ASOS (asos.com)
3. H&M (hm.com)
4. Zalando (zalando.com / zalando.de etc.)
5. Mango (mango.com)

Everything else degrades gracefully to Layer 3 manual upload.

---

## Image Extraction Strategy Details

### Layer 1 — DOM Extraction (~60-70% of cases)
Try these selectors in order, pick the first match with a valid src:
1. `[data-main-image]`
2. `img[class*="product-image"]`
3. `img[class*="main-image"]`
4. `img[id*="main-image"]`
5. Largest visible `<img>` on page by rendered dimensions (width × height)

Filter out: images under 200px in either dimension, icons, logos, SVGs.

### Layer 2 — og:image Fallback (~15-20% of cases)
```javascript
document.querySelector('meta[property="og:image"]')?.getAttribute('content')
```

### Layer 3 — Manual Upload Fallback
If both layers fail, popup shows: "Can't extract image automatically. Please screenshot the item and upload it."
File input accepts: jpg, png, webp.

---

## What NOT to Build in Week 2

- Do NOT wire the GPT Image 1.5 API yet (Week 3)
- Do NOT build the web profile (Week 4)
- Do NOT build auth or database schema (Week 4)
- Do NOT add Paddle integration (Week 5)
- Do NOT build Playwright server-side worker (deferred post-launch)

---

## Environment Variables (for reference, not needed yet in Week 2)

```
# OpenAI
OPENAI_API_KEY=

# Supabase
SUPABASE_URL=https://nzchqlmkquwqzsqdlidn.supabase.co
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=fitsyou-outputs
CLOUDFLARE_R2_PUBLIC_URL=
CLOUDFLARE_R2_ENDPOINT=

# Paddle
PADDLE_CLIENT_TOKEN=
PADDLE_API_KEY=
PADDLE_PRICE_ID_PRO=
PADDLE_PRICE_ID_POWER=
PADDLE_WEBHOOK_SECRET=
```

---

## Definition of Done for Week 2 Task 1

- [ ] `tsconfig.json` and `webpack.config.js` created and working
- [ ] `npm run build` completes without errors
- [ ] Extension loads in Chrome via `chrome://extensions` → Load unpacked → `/dist`
- [ ] Popup opens when extension icon is clicked
- [ ] "Try this on" button is visible in popup
- [ ] Clicking button triggers content script
- [ ] Content script successfully extracts product image on Zara and ASOS
- [ ] Product URL and title are captured alongside the image
- [ ] Manual upload fallback UI appears when extraction fails
- [ ] No console errors on load

---

*This is a living handover document. Update it after each week as decisions are made.*
