# fitsyou.live — v1 Build Plan

> One sentence: **see it, try it on yourself, save it, decide.**
> Board: [fitsyou.live — v1 Build Plan](https://mojtabapeyrovis-team.monday.com/boards/5097397427)

> **Workflow rule:** after **every** task is completed, it MUST be marked done in **both** places — this PLAN.md file **and** the Monday.com board. Neither is the source of truth alone; they are kept in sync. Do not consider a task finished until both reflect it.

---

## Product Vision

fitsyou is a lightweight Chrome extension + web profile that lets users see how a clothing item from any fashion site looks on them — using their own photo — before they buy.

**Quality bar:** good enough to make a buy decision. Not studio perfect. The v1 core is one thing done well: see it on yourself. **From Wk 6** this expands into mix-and-match — collect items from any retailer (wishlist) + your own clothes (wardrobe) and compose multiple items into one try-on (fitting room) — without becoming a heavyweight styling tool.

---

## Locked Decisions

| Decision | Choice |
|---|---|
| Try-on API | GPT Image 1.5 (`gpt-image-1.5`), medium quality, 1024×1024, real-time |
| Extension | Manifest V3 + TypeScript + Preact |
| Web app | **Next.js on Vercel** (existing app, kept) — Lovable design ported in, not adopted wholesale |
| Auth + DB | Supabase (Postgres, EU West / Frankfurt) |
| Image storage | Cloudflare R2 (bucket `fitsyou-outputs`) |
| Payments | Paddle (EU VAT auto-handled) |
| Inputs | Two only: user photo + product image. No three-input pipeline. |
| Architecture | Fixed deterministic pipeline: extract → compose → save. No agentic AI, no LLM reasoning loop. |
| Playwright worker | Deferred post-launch |
| Try-on surfaces | **Both** extension popup (inline, never redirects) and fitsyou.live web app |
| Mobile capture | URL paste (Phase 1) + Web Share Target PWA (Phase 2). Native app is post-traction only. |
| Design system | Playfair Display + DM Sans + DM Mono; ink `#121212`, bone `#F5F2EC`, pink `#FF2E88` |
| Design source | Lovable export (`fitsyou-frontend`, TanStack Start) is a **design reference only**. Its UI/tokens get ported into the existing Next.js app. Backend (Wk 3–6 APIs, Supabase, R2, Paddle) is kept as-is. |

---

## Pricing

| Tier | Price | Try-ons | Corner mark | Retention | Notes |
|---|---|---|---|---|---|
| Free | €0 | 5 / month | Yes | 7 days | View in-app only; no download |
| Pro | €4.99 / month | 20 / month | Yes (branded) | Permanent | Clean logo-free download |
| Power | €9.99 / month | 100 / month | Yes (branded) | Permanent + priority | — |
| Atelier | €19.99 / month | Unlimited | Yes (branded) | Permanent + priority | Early feature access |

> **Corner mark vs watermark:** all generated images carry a discreet bottom-right corner mark ("fits*you*" in brand colours). This is brand placement for growth, not copy protection. Pro+ users can download a clean, logo-free version. No diagonal/heavy watermarks on any tier.

---

## Core User Flow

1. User installs the fitsyou Chrome extension
2. User sets up a minimal profile — one photo, body type, backdrop preference
3. User browses any fashion store as normal
4. They see an item they like → click the fitsyou extension icon
5. Extension extracts the product image from the page
6. Sends user photo + product image → GPT Image 1.5 API → 2–3 try-on variants generated
7. Try-on images + product link saved automatically to user's fitsyou profile at fitsyou.live
8. User revisits saved try-ons anytime and clicks through to buy

---

## Tech Stack

| Layer | Choice |
|---|---|
| Extension | Manifest V3 + TypeScript + Preact |
| Frontend / API | Next.js on Vercel |
| Auth + DB | Supabase (Postgres) |
| Image storage | Cloudflare R2 |
| Payments | Paddle |
| Try-on API | GPT Image 1.5 (`gpt-image-1.5`), medium quality, 1024×1024 |

---

## Priority Sites (Must Work)

1. Zara — zara.com
2. ASOS — asos.com
3. H&M — hm.com
4. Zalando — zalando.com / zalando.de / zalando.co.uk
5. Mango — mango.com

Everything else degrades gracefully to Layer 3 manual upload.

---

## Image Extraction Strategy

### Layer 1 — DOM Extraction (~60–70% of cases)
Selectors tried in order, first valid src wins:
1. `[data-main-image]`
2. `img[class*="product-image"]`
3. `img[class*="main-image"]`
4. `img[id*="main-image"]`
5. Largest visible `<img>` on page by rendered area (width × height)

Filter out: images under 200 × 200px, SVGs, icons, logos.

### Layer 2 — og:image Fallback (~15–20% of cases)
```js
document.querySelector('meta[property="og:image"]')?.getAttribute('content')
```

### Layer 3 — Manual Upload Fallback
Popup shows: *"Can't extract image automatically. Please screenshot the item and upload it."*
File input accepts: jpg, png, webp.

---

## Week-by-Week Build Plan

*Synced from [Monday.com board](https://mojtabapeyrovis-team.monday.com/boards/5097397427) on 2026-05-29.*

---

### Wk 1 · Validation Gate ✅ Complete

| Task | Effort | Status |
|---|---|---|
| Test Kling, fal.ai, gpt-image-1 on real scraped product images | Large | ✅ Done |
| Calculate cost per generation — confirm €0.02 target is viable | Medium | ✅ Done |
| Pick winning API + lock stack, provision all accounts | Small | ✅ Done |

**Outcome:** GPT Image 1.5 selected. Stack locked. All accounts provisioned before Wk 2.

---

### Wk 2 · Extension + Extraction ✅ Complete

| Task | Effort | Status | Notes |
|---|---|---|---|
| Scaffold Manifest V3 extension + GitHub repo | Small | ✅ Done | Completed 2026-05-29 |
| Build DOM extraction (Layer 1) + og:image fallback (Layer 2) | Medium | ✅ Done | Completed 2026-05-29 |
| Build manual screenshot-upload fallback (Layer 3) | Small | ✅ Done | Completed 2026-05-29 |
| Test + harden extraction across top 5 priority sites | Large | ✅ Done | All 5 sites: Layer 1 DOM. H&M uses largest-image scan (slight delay). |

#### What was built in the scaffold (2026-05-29)

**Config:**
- `tsconfig.json` — ES2020, Preact JSX (`react-jsx` + `jsxImportSource: preact`), strict mode, `"types": ["chrome"]` required for @types/chrome to resolve, path alias `@/*`
- `webpack.config.js` — 3 entry points (popup / content / background), output to `dist/`, CopyPlugin copies `extension/public/` into dist, Preact aliases for react/react-dom

**Extension public assets:**
- `extension/public/manifest.json` — MV3, permissions: activeTab + storage + scripting, 7 fashion-site match patterns, service worker: background.js
- `extension/public/popup.html` — minimal HTML shell loading popup.js, 280px wide

**TypeScript source:**
- `extension/src/popup/index.tsx` — Preact component, 5-state status machine: `idle → loading → success | error | manual`. On click: queries active tab, sends `EXTRACT_PRODUCT` message to content script, relays result to background. Manual upload file input appears on Layer 3 fallback.
- `extension/src/content/index.ts` — `chrome.runtime.onMessage` listener. Runs Layer 1 (4 DOM selectors + largest-image scan) → Layer 2 (og:image) → Layer 3 (returns `{ success: false }`). Also extracts `productTitle` (og:title → document.title → hostname fallback) and `productUrl`.
- `extension/src/background/index.ts` — Service worker. Listens for `PRODUCT_EXTRACTED` messages from popup, logs extracted data. **Placeholder for Week 3 API call.**

**Build:** `npm run build` → `dist/` with popup.js, content.js, background.js, manifest.json, popup.html. Zero TypeScript errors.

**To load in Chrome:** `chrome://extensions` → Enable Developer mode → Load unpacked → select `dist/`

#### Extraction test results (2026-05-29)

| Site | Layer hit | Notes |
|---|---|---|
| Zara | Layer 1 DOM | Direct selector match |
| ASOS | Layer 1 DOM | Direct selector match |
| H&M | Layer 1 DOM | Largest-image scan (slight delay) |
| Zalando | Layer 1 DOM | Direct selector match |
| Mango | Layer 1 DOM | Direct selector match |

---

### Wk 3 · Infrastructure + Auth ✅ Complete

| Task | Effort | Status |
|---|---|---|
| Scaffold Next.js app + deploy to Vercel | Small | ✅ Done |
| Supabase Auth + extension login flow | Medium | ✅ Done |
| Postgres schema + RLS (profiles + try_ons tables) | Medium | ✅ Done |
| Cloudflare R2 bucket setup + upload helper (lib/r2.ts) | Small | ✅ Done |
| Minimal onboarding flow (photo + body type + backdrop) | Medium | ✅ Done |
| API routes — /api/user/photo + /api/user/profile | Small | ✅ Done |
| Extension auth state + popup UI (sign in / setup / ready states) | Medium | ✅ Done |

#### Detail

**Scaffold Next.js app + deploy to Vercel**
- Next.js 14, App Router, TypeScript. Deploy to Vercel immediately — extension will call this host
- Placeholder `/` route with "fitsyou" in title
- Set up env vars: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL`, `CLOUDFLARE_R2_ENDPOINT`

**Supabase Auth + extension login flow**
- Supabase Auth, Google OAuth only — one provider, fewer edge cases
- Session handling via `@supabase/ssr`
- `/auth/extension` route: extension popup opens it in a new tab, triggers Google login, redirects back and passes session token to extension via `chrome.runtime.sendMessage`
- Extension stores token in `chrome.storage.local`, attaches as `Bearer` on all API calls

**Postgres schema (Supabase)**
```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  photo_url text,
  body_type text,           -- 'petite' | 'slim' | 'average' | 'curvy' | 'plus'
  backdrop_category text,   -- 'city' | 'cafe' | 'nature' | 'studio' | 'evening'
  try_on_count_this_month int default 0,
  subscription_tier text default 'free',
  created_at timestamptz default now()
);

create table public.try_ons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product_url text not null,
  product_title text,
  store_name text,
  product_image_url text,
  output_image_urls text[],
  backdrop_used text,
  created_at timestamptz default now(),
  expires_at timestamptz
);

create index try_ons_cache_idx on public.try_ons(user_id, product_url);
```
RLS: users can only read/write their own rows on both tables.

**Cloudflare R2 bucket setup + lib/r2.ts**
- Bucket: `fitsyou-outputs`. Folders by convention: `user-photos/` and `try-ons/`
- Enable public access — images must be displayable in extension popup and web profile
- API token with Object Read & Write. CORS rule: allow `chrome-extension://*` and Vercel domain
- Shared helper at `lib/r2.ts` using `@aws-sdk/client-s3`

**Minimal onboarding flow**
- Screen 1 `/onboarding/photo`: file input, resize to max 1024px with `sharp`, upload to R2 as `user-photos/{user_id}.jpg`, save URL to `profiles.photo_url`
- Screen 2 `/onboarding/body-type`: 5 buttons (Petite / Slim / Average / Curvy / Plus)
- Screen 3 `/onboarding/backdrop`: 5 buttons (City street / Café / Nature / Studio / Evening out)
- Route guard: authenticated users with no `photo_url` redirect to `/onboarding/photo`

**API routes**
- `POST /api/user/photo` — multipart, resize + R2 upload, update `profiles.photo_url`
- `POST /api/user/profile` — update `body_type` + `backdrop_category`
- `GET /api/user/profile` — returns full profile row (extension calls this on popup open to check onboarding state)

**Extension auth state + popup UI**
- On popup open: call `GET /api/user/profile`
- If 401 → "Sign in to fitsyou" button opens `/auth/extension` in new tab
- If no `photo_url` → "Complete setup" button opens `/onboarding/photo`
- If profile complete → disabled "Try it on" button with "Setup required" label (wired in Wk 4)

**File structure to create:**
```
fitsyou-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   ├── onboarding/
│   │   ├── photo/page.tsx
│   │   ├── body-type/page.tsx
│   │   └── backdrop/page.tsx
│   ├── auth/
│   │   ├── callback/route.ts
│   │   └── extension/page.tsx
│   └── api/
│       └── user/
│           ├── photo/route.ts
│           └── profile/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── r2.ts
├── middleware.ts
└── .env.local
```

---

### Wk 4 · Generation Pipeline + Web Profile ✅ Complete

| Task | Effort | Status |
|---|---|---|
| Build saved try-on library grid + one-click buy links | Medium | ✅ Done |
| Wire composition API — photo + product image → 2–3 variants | Large | ✅ Done |
| Build backdrop system (5 categories, random rotation) | Medium | ✅ Done |
| Cache generation results + free/paid resolution split | Small | ✅ Done |

#### Detail

**Try-on library grid**
- Grid of saved try-ons. Each card: image, product title, store name, product link, date saved
- One-click buy-through. Minimal design — clean, not polished

**Composition API (`/api/generate`)**
- Now unblocked by Wk 3 infrastructure
- User photo (from `profiles.photo_url`) + scraped product image → `gpt-image-1.5` (medium quality, 1024×1024) → 2–3 outfit composition variants
- Store outputs in R2 under `try-ons/{user_id}/`
- Single stateless API call — no orchestration, no LLM loop
- Cache lookup first: if `(user_id, product_url)` exists in `try_ons` table, return cached result

**Backdrop system**
- 5 categories: city street, café, nature, studio, evening
- User picks 1–2 at onboarding (saved in Wk 3)
- System rotates randomly within chosen category per generation so repeat try-ons feel different

**Caching**
- Cache key: `(user_id, product_url)`
- If user tries same item twice, serve cached result
- Free tier → low-res; paid tier → full-res

---

### Wk 5 · Payments + Hardening ✅ Complete

| Task | Effort | Status |
|---|---|---|
| Integrate Paddle billing + free/paid tier gating | Medium | ✅ Done |
| End-to-end flow testing + hardening on all priority sites | Medium | ✅ Done |
| Wire affiliate link tagging on saved product URLs | Small | ✅ Done |
| Full-body photo validation on upload (GPT-4o-mini vision check) | Small | ✅ Done |
| Fit check — scrape size chart, compare to user measurements, show verdict | Medium | ✅ Done |
| Dashboard card CRUD — delete try-ons, store logo, enlarge lightbox, download (paid only) | Medium | ✅ Done |

#### Detail

**Paddle:** auto-handles EU VAT (critical for European market).
- Free: 5 try-ons/mo, watermarked, 7-day retention
- Pro €4.99/mo: 20 try-ons, no watermark, permanent save
- Power €9.99/mo: 100 try-ons, priority generation

**Affiliate links:** passive, no UX change. Tag product URLs with affiliate parameters on save.
- ✅ `lib/affiliate.ts` — config-driven `tagProductUrl()` keyed by store hostname. Supports "param" (append query) and "awin" (deep-link wrap) modes. Ships with empty placeholders so URLs pass through untouched until a program goes live; flip on per store with a one-line config edit + env var (`AWIN_AFFILIATE_ID`).
- Applied on save in `/api/generate`: the stored `product_url` (used by the dashboard "Buy →" link) is tagged. Tagging is idempotent, so it also serves as the cache key. Raw URL still used for product-image fetch referer.

**Hardening:** run full flow on all 10 priority sites. Fix extraction edge cases, broken try-ons, UI bugs. Budget most of this week here — it will surface more issues than expected.

**Full-body photo validation**
- Fires in `POST /api/user/photo` before writing to R2 or Supabase
- Send the uploaded image to GPT-4o-mini: *"Does this photo show a complete full-body shot of a person from head to toe, including feet? Answer yes or no and briefly explain if no."*
- If no → return HTTP 400 with the model's reason; onboarding page shows it inline
- If yes → proceed with upload as normal
- Cost: ~$0.001 per upload, fires once per user at onboarding (not per try-on)
- No ratio pre-filter — content-based check handles any orientation or framing
- ✅ `lib/photo-validation.ts` — `validateFullBody()` calls `gpt-4o-mini` (JSON mode, `detail: "low"`). Wired into `POST /api/user/photo` for `kind === "body"` only (face close-ups exempt), after resize, before R2 upload. Returns 400 with the model's reason on failure; onboarding page already renders that inline. **Fails open** (allows upload) if `OPENAI_API_KEY` is missing or the call errors — only a clear "not full-body" verdict blocks.

**Fit check (size chart → measurements → verdict)**
- Tells the user whether an item is likely to fit *before* they buy, shown as a badge in the popup above the try-on preview: **Good fit / Borderline / Likely won't fit** (or *Fit unknown*), with a recommended size and one-line reason.
- Collects the **core-5 measurements** (height, weight, chest, waist, hips) via a new **skippable** onboarding step `/onboarding/measurements` (flow is now photo → measurements → face → backdrop) and editable fields in the dashboard `ProfilePanel`. Stored as metric ints on `profiles`; the 5 fields were added to `POST /api/user/profile`.
- ✅ `lib/fit-assessment.ts` — `assessFit()` calls `gpt-4o-mini` (JSON mode) to normalize messy chart text (cm/inch, S/M/L/numeric) and judge fit; `POST /api/fit` reads the user's measurements and returns `{ verdict, recommended_size, reason }`. **No try-on credit consumed.** **Fails open to `unknown`** on missing key/error, missing measurements (`needs_measurements: true`), or no chart found.
- Extension content script scrapes the size-chart text + available/selected sizes (per-site + generic + hidden-modal selectors, scored to pick the real table); popup calls `/api/fit` in parallel with generation and never blocks the try-on if it fails.
- **Unit system:** users pick metric (cm/kg) or imperial (in/lb) in onboarding + dashboard (`unit_system` on `profiles`). Measurements are always stored as metric ints and the comparison always runs in cm — `lib/units.ts` converts only at the UI boundary, so switching units never corrupts stored data or the verdict.
- **Credit guard:** on a `poor` verdict the popup pauses and asks "try it on anyway?" before calling `/api/generate`, so a clearly-bad match doesn't auto-spend a credit (good/borderline/unknown still generate immediately).
- ⚠️ Requires the `profiles` measurement-column + `unit_system` migration in `DEVELOPMENT.md` to be run in Supabase. Chart scraping is best-effort — size guides behind un-clicked modals degrade gracefully to "Fit unknown".

---

### Wk 6 · Mix & Match — Wishlist + Wardrobe + Fitting Room ✅ Complete

> **Flow shift:** the extension's primary action changes from instant single-item try-on to
> **Add to wishlist**. Users collect items from any retailer (Wishlist) and upload their own clothes
> (Wardrobe), then combine multiple items into **one composed try-on** in the **Fitting Room** and see
> a **buy-list** with links. This is the core mix-and-match promise.

| # | Task | Effort | Status |
|---|---|---|---|
| 1 | Data model — `wishlist_items` + `wardrobe_items` + `outfits` tables + RLS + `profiles.currency` + Realtime; `lib/garments.ts` | Medium | ✅ Done |
| 2 | Wishlist API — `POST`/`GET`/`DELETE` (affiliate-tagged, stores fit snapshot) | Medium | ✅ Done |
| 3 | Wardrobe API — `POST`/`GET`/`DELETE` (R2 image upload) + `/api/image` allow-list | Medium | ✅ Done |
| 4 | Extension rework — replace "Try this on" with "Add to wishlist"; Wishlist + Wardrobe menus; Fitting Room launcher | Large | ✅ Done |
| 5 | Dashboard tabs (Try-ons \| Wishlist \| Wardrobe \| Fitting Room) + Supabase Realtime live updates + currency selector | Large | ✅ Done |
| 6 | Multi-garment generation — `/api/outfit`, N garments in one pass, cache by item refs, write `outfits` | Large | ✅ Done |
| 7 | Fitting Room builder UI — multi-select tray, generate, render composed look | Medium | ✅ Done |
| 8 | Buy-list + currency-aware hardcoded rewards teaser | Small | ✅ Done |

#### Detail

**New data model (Supabase, RLS `user_id = auth.uid()`):**
- `wishlist_items` — `id, user_id, product_url, product_image_url, product_title, store_name, available_sizes text[], fit_verdict, recommended_size, created_at`. Fit verdict is computed once at save time (reuses `/api/fit`) and stored on the row.
- `wardrobe_items` — `id, user_id, name, category` (top/bottom/dress/outerwear/shoes/accessory)`, image_url` (R2 `wardrobe/{user_id}/{ts}.jpg`)`, created_at`.
- `outfits` — `id, user_id, name, item_refs jsonb` (ordered `[{source:'wishlist'|'wardrobe', id}]`)`, output_image_urls text[], backdrop_used, buy_list jsonb` (snapshot of retailer items)`, created_at, expires_at`.
- `profiles.currency text default 'EUR'` — drives rewards/price formatting via `Intl.NumberFormat`.
- Realtime enabled on `wishlist_items` + `wardrobe_items` so extension-saved items appear on an open dashboard without a manual refresh (refetch-on-focus fallback).

**Extension (`extension/src/popup/index.tsx`):** primary button → Add to wishlist (extract → `/api/fit` free → `POST /api/wishlist`, no credit). Two in-popup menus (Wishlist, Wardrobe) listing the user's items with thumbnails + fit badge + delete. A **Fitting Room** launcher opens `/dashboard?tab=fitting-room`. Generate/preview logic moves out of the popup to the dashboard.

**Generation (`/api/outfit`, reuses `/api/generate` helpers):** resolves selected wishlist/wardrobe items → garment images, passes body [+ face] + **all garments** to `gpt-image-1.5` `/v1/images/edits` in one pass, layered by category in `item_refs` order. 1 credit per outfit; cache key = hash of sorted `item_refs`. Buy-list = retailer (wishlist) items in the outfit, affiliate-tagged; wardrobe items shown as "from your wardrobe" (no link). Rewards teaser is hardcoded, "Coming soon", amounts in the user's currency.

**Reuses:** `/api/fit` + `lib/fit-assessment.ts`, `lib/affiliate.ts`, `lib/r2.ts`, `lib/units.ts`, `lib/supabase/auth.ts`, `app/api/user/photo` resize pattern, `TryOnCard` visual language. Migration SQL lives in `fitsyou-web-app/DEVELOPMENT.md`.

---

#### Wardrobe image preprocessing pipeline (added post-Wk 6)

Every wardrobe photo is run through a three-step pipeline **before** being stored. The pipeline lives in `lib/preprocess.ts` and is called from `POST /api/wardrobe`.

**Step 1 — Background removal**
Provider: [Replicate](https://replicate.com) — model [`lucataco/remove-bg`](https://replicate.com/lucataco/remove-bg) (wraps **BRIA-RMBG-1.4**, a state-of-the-art segmentation model tuned for clothing and objects). Cost: ~$0.003 per image. The API call is a standard Replicate prediction: the image is sent as a base64 data URI, the model returns a URL pointing to a PNG with the background set to full alpha transparency. The Replicate Node SDK (`npm install replicate`) handles polling until the prediction completes.

Env var required: `REPLICATE_API_TOKEN` (Vercel + `.env.local`). If the token is missing the step is skipped gracefully and the original image is passed through — nothing breaks, background just isn't removed.

**Step 2 — Smart crop (auto-fit to square)**
After background removal the garment sits on a transparent canvas that may have large empty borders. Sharp's `.trim({ threshold: 10 })` detects the bounding box of non-transparent pixels and removes the dead space. The app then computes a square canvas equal to the longer side of the trimmed garment × 1.20 (20% breathing room) and centers the garment on it using `.extend()`. The 20% rule adapts automatically: a tall dress gets extra horizontal air; wide-folded pants get extra vertical air — no manual tuning needed.

**Step 3 — Resize + store as PNG**
The square PNG is resized to max 1024×1024 (`fit: inside`, no upscaling) at compression level 8. Stored in R2 as `wardrobe/{user_id}/{ts}.png` (previously `.jpg`). Transparency is preserved so the try-on model receives a clean garment with no background noise.

**Classification still uses JPEG:** `classifyGarment()` flattens the PNG to a white-background JPEG before sending to `gpt-4o-mini` (cheaper, and the model reads the garment more reliably without alpha).

**Card display:** `WardrobeTab.tsx` uses `object-contain` (not `object-cover`) so the already-square transparent PNG fills the card perfectly against the bone-coloured background without any cropping.

---

### Wk 7 · Branding + Design + PWA + Launch Prep ⬜ Not Started

> **Authoritative spec:** `CLAUDE_CODE_HANDOVER_WK7_DESIGN.md` in the extension repo root, **with one decision reversed (2026-05-31):** the web app stays on **Next.js + Vercel**. Lovable's export is a *design reference*, not the deployed app — we port its UI/tokens into the existing Next.js app and keep the working Wk 3–6 backend. (Reason the handover gave for switching to Vite/Cloudflare — "Lovable outputs Vite" — only applied if we adopted Lovable's code wholesale, which we are not.) Still in force: try-on generation runs on **both** the extension popup (inline) **and** fitsyou.live (on saved items); no Tailwind in the extension.

> **Lovable design reference:** `fitsyou-frontend` repo (TanStack Start, deployed preview at `fits-you.lovable.app`). Brand kit lives in `fitsyou-web-app/branding`.

| # | Task | Effort | Status |
|---|---|---|---|
| 1 | Logo and wordmark design — wordmark, icon mark, all size exports | Medium | ✅ Done |
| 2 | Port Lovable design into existing Next.js app — all screens (landing, dashboard, wishlist, profile, onboarding, login) | Large | ✅ Done |
| 3 | ~~Switch web app stack → Vite/Cloudflare~~ **Cancelled** — keep Next.js/Vercel; port design instead | Medium | ❌ Cancelled |
| 4 | Port Lovable popup design to Preact extension (strip Tailwind, scoped CSS) | Medium | ⬜ Not Started |
| 5 | Mobile-optimise dashboard UI (responsive + touch-friendly) | Medium | ⬜ Not Started |
| 6 | Convert fitsyou.live web app to PWA | Medium | ⬜ Not Started |
| 7 | PWA icons, splash screen, and meta tags | Small | ⬜ Not Started |
| 8 | Implement Web Share Target API (share sheet receiver) | Medium | ⬜ Not Started |
| 9 | Add manual URL paste flow for mobile product capture | Small | ⬜ Not Started |
| 10 | Wire try-on generation into extension popup (generate + display + save in-popup) | Large | ⬜ Not Started |
| 11 | Wire try-on generation into web app (generate from saved wishlist items) | Medium | ⬜ Not Started |
| 12 | Submit to Chrome Web Store *(target early, review can take weeks)* | Medium | ⬜ Not Started |
| 13 | Set up analytics — instrument activation funnel | Small | ⬜ Not Started |
| 14 | Record before/after demo video for TikTok / Instagram Reel | Small | ⬜ Not Started |
| 15 | Soft launch + post first organic video | Small | ⬜ Not Started |
| 16 | Smart garment image selection — score candidates, prefer flat-lay over hero, on BOTH extension (DOM) and web link-paste (HTML + user override) | Small | ✅ Done |
| 17 | Try-on garment isolation — prompt the generator to use ONLY the target garment, ignoring model + other items in a hero-shot reference | Small | ✅ Done |
| 18 | Browserless headless-render fallback — fetch the real JS-rendered gallery (flat-lay) for SPA retailers on link-paste; activates when `BROWSERLESS_API_KEY` is set | Medium | ⬜ Code done, needs key + live verify |

#### Detail

**Brand kit (Done):** Wordmark: Playfair Display 'fits' upright + 'you' italic in shocking pink #FF2E88. Icon mark: italic 'y' in pink on ink #121212 rounded-rect. Three icon variants (dark/pink/light). Delivered: SVG wordmark (on-light + on-dark), SVG icons (3 variants), PNG exports at 16/32/48/128/192/512px, maskable icons, favicon.ico, apple-touch-icon. All assets in `fitsyou-brand-kit-assets.zip`.

**Design port (Next.js):** The full UI was designed in Lovable (TanStack Start export, `fitsyou-frontend`) and is live at `fits-you.lovable.app` as a reference. We **port that design into the existing Next.js app** rather than adopting the Lovable codebase — the Next.js app already holds the working Wk 3–6 backend (APIs, Supabase, R2, Paddle) and that's the expensive half to reproduce. Plan: lift the design tokens (`tokens.css`: Playfair Display + DM Sans + DM Mono, pink #FF2E88, ink #121212, bone #F5F2EC), add Tailwind to the Next.js app, then restyle screen by screen (landing, dashboard/try-on grid, wishlist, profile, onboarding, login). Dark-brand/light-content split: nav + hero = ink, content = bone/white. All screens mobile-responsive. Before going live, strip Lovable template cruft (the "14-day money-back guarantee", "photoreal" → "realistic", "no app to install" phrasing).

**Stack — DECISION REVERSED (2026-05-31):** We are **not** switching to Vite/Cloudflare. The Lovable export turned out to be a TanStack Start app with an empty (Lovable Cloud) backend; adopting it would mean reimplementing the entire Wk 3–6 backend as server functions — high risk for no real gain. The web app **stays on Next.js + Vercel** (keeping its working backend and Vercel auto-deploy). The Lovable repo is kept only as a design reference. The mobile/PWA layer (manifest, service worker, share target, URL paste) is built into the Next.js app instead.

**Extension popup port:** Swap React imports for Preact h/Fragment, strip all Tailwind classes, replace with scoped CSS using shared design tokens. All popup states: ready (dark header, pink CTA), generating (spinner + progress bar), result (try-on images + save confirmation). Test in Chrome at 360px width.

**Mobile + PWA:** Ensure 2-col grid, 44px touch targets, try-on works in mobile browser, buy links open in new tab. Test on iOS Safari and Android Chrome. Web manifest with name, icons, theme_color `#121212`, display: `standalone`. PWA icons from brand kit at 192×512 + maskable. Register service worker for offline shell caching. Web Share Target: `method POST`, `enctype multipart/form-data`, accepting `url` and `text` params; `/share-target` route auto-populates the add-to-wishlist flow.

**Mobile URL paste fallback:** URL paste input on dashboard; backend fetches product image server-side (same extraction pipeline as extension: DOM → og:image → fallback). Show product preview before saving.

**Try-on wiring — extension:** User clicks 'Try this on me' → extension sends user photo + scraped product image to generation endpoint → 2 try-on variants displayed inside the popup (never redirect to website) → saved to Supabase + R2. Corner mark (fitsyou wordmark) applied to every generated image.

**Try-on wiring — web app:** Saved wishlist item → 'Try this on' → same generation endpoint → results displayed inline and saved to Supabase + R2. Primary mobile try-on flow: capture on desktop via extension, generate on phone via web app.

**Chrome Web Store:** ⚠️ SCHEDULE RISK — submit as early as possible; review can take 3 days to 3 weeks. Optimize listing for: "virtual try-on", "fashion try-on", "see clothes on me".

**Analytics (PostHog or equivalent):** track installs, profile completions, first try-on completions, conversion to paid. Key metric: **cost per activated user** (install + profile + ≥1 try-on).

**Demo video:** primary acquisition channel. The wow moment (you in a Zara jacket) is inherently shareable. Keep it raw and real — not overproduced.

**Soft launch:** post the organic video. Do not run paid ads yet — wait for organic signal first. Resist every feature request.

---

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=

# Replicate (wardrobe bg removal — BRIA-RMBG-1.4 via lucataco/remove-bg)
REPLICATE_API_TOKEN=

# Browserless (headless-render fallback for link-paste flat-lay fetch; optional)
BROWSERLESS_API_KEY=
# BROWSERLESS_URL=https://production-sfo.browserless.io  # optional override

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nzchqlmkquwqzsqdlidn.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
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

## What NOT to Build Until Its Week

| Feature | Week |
|---|---|
| GPT Image 1.5 API call (/api/generate) | Wk 4 |
| Try-on library grid / web profile | Wk 4 |
| Paddle billing | Wk 5 |
| Playwright server-side worker | Post-launch |

---

*Last updated: 2026-06-04 — Tasks from Feedback (all 7) completed: (1) unonboarded-user redirect in extension popup — signed-out screen now shows "Create free account" CTA with sign-in fallback; (2) close button (×) added to popup header; (3) user face photo + email shown in identity bar below header when signed in; (4) wishlist save toast updated to "saved — close & keep browsing" making persistence explicit; (5) wishlist items now clickable to open original product URL; (6) shoe size added to onboarding measurements page + profile API + Supabase migration; (7) account email + remaining tries shown in popup identity bar.*

*Wk 7 garment-image quality work (tasks 16–18): (16) smart selection on BOTH surfaces — extension content script scores rendered images by URL + aspect ratio + DOM context; web link-paste `/api/product-fetch` collects candidates from page HTML (`lib/imageCandidates.ts`) + WishlistTab override thumbnail row. (17) try-on prompt hardened in `/api/generate` + `/api/outfit` to apply ONLY the target garment and ignore the reference model + other items — fixes confused try-ons from hero-shot references regardless of source. (18) Browserless headless-render fallback (`lib/renderPage.ts`) wired into link-paste to fetch the real JS-rendered gallery on SPA retailers (Zara, H&M) where static HTML only exposes the hero `og:image`; graceful no-op until `BROWSERLESS_API_KEY` is set — code done, needs key + live verification. Wk 6 complete. Atelier tier added (€19.99/mo, unlimited). **Stack-switch reversed:** web app stays on Next.js + Vercel; the Lovable export (`fitsyou-frontend`, TanStack Start) is a design reference whose UI/tokens get ported into the existing app. Try-on generation runs on both the extension popup and the web app. Wk 7 spec in `CLAUDE_CODE_HANDOVER_WK7_DESIGN.md` (with the stack decision overridden here).*
