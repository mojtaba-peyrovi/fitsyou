# fitsyou.live — v1 Build Plan

> One sentence: **see it, try it on yourself, save it, decide.**
> Board: [fitsyou.live — v1 Build Plan](https://mojtabapeyrovis-team.monday.com/boards/5097397427)

---

## Product Vision

fitsyou is a lightweight Chrome extension + web profile that lets users see how a clothing item from any fashion site looks on them — using their own photo — before they buy.

**Quality bar:** good enough to make a buy decision. Not studio perfect. Not a wardrobe manager. Not a styling tool. One thing done well.

---

## Locked Decisions

| Decision | Choice |
|---|---|
| Try-on API | GPT Image 1.5 (`gpt-image-1.5`), medium quality, 1024×1024, real-time |
| Extension | Manifest V3 + TypeScript + Preact |
| Web app | Next.js on Vercel |
| Auth + DB | Supabase (Postgres) |
| Image storage | Cloudflare R2 |
| Payments | Paddle (EU VAT auto-handled) |
| Inputs | Two only: user photo + product image. No three-input pipeline. |
| Architecture | Fixed deterministic pipeline: extract → compose → save. No agentic AI, no LLM reasoning loop. |
| Playwright worker | Deferred post-launch |

---

## Pricing

| Tier | Price | Try-ons | Watermark | Retention |
|---|---|---|---|---|
| Free | €0 | 5 / month | Yes | 7 days |
| Pro | €4.99 / month | 20 / month | No | Permanent |
| Power | €9.99 / month | 100 / month | No | Permanent + priority |

---

## Core User Flow

1. User installs the fitsyou Chrome extension
2. User sets up a minimal profile — one photo, body type, backdrop preference
3. User browses any fashion store as normal
4. They see an item they like → click the fitsyou extension icon
5. Extension extracts the product image from the page
6. Sends user photo + product image → GPT Image 1 API → 2–3 try-on variants generated
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

**Outcome:** GPT Image 1 selected. Stack locked. All accounts provisioned before Wk 2.

---

### Wk 2 · Extension + Extraction 🔄 In Progress

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

### Wk 4 · Generation Pipeline + Web Profile 🔄 Up Next

| Task | Effort | Status |
|---|---|---|
| Build saved try-on library grid + one-click buy links | Medium | ⬜ Not Started |
| Wire composition API — photo + product image → 2–3 variants | Large | ⬜ Not Started |
| Build backdrop system (5 categories, random rotation) | Medium | ⬜ Not Started |
| Cache generation results + free/paid resolution split | Small | ⬜ Not Started |

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

### Wk 5 · Payments + Hardening ⬜ Not Started

| Task | Effort | Status |
|---|---|---|
| Integrate Paddle billing + free/paid tier gating | Medium | ⬜ Not Started |
| End-to-end flow testing + hardening on all priority sites | Medium | ⬜ Not Started |
| Wire affiliate link tagging on saved product URLs | Small | ⬜ Not Started |
| Full-body photo validation on upload (GPT-4o-mini vision check) | Small | ⬜ Not Started |

#### Detail

**Paddle:** auto-handles EU VAT (critical for European market).
- Free: 5 try-ons/mo, watermarked, 7-day retention
- Pro €4.99/mo: 20 try-ons, no watermark, permanent save
- Power €9.99/mo: 100 try-ons, priority generation

**Affiliate links:** passive, no UX change. Tag product URLs with affiliate parameters on save.

**Hardening:** run full flow on all 10 priority sites. Fix extraction edge cases, broken try-ons, UI bugs. Budget most of this week here — it will surface more issues than expected.

**Full-body photo validation**
- Fires in `POST /api/user/photo` before writing to R2 or Supabase
- Send the uploaded image to GPT-4o-mini: *"Does this photo show a complete full-body shot of a person from head to toe, including feet? Answer yes or no and briefly explain if no."*
- If no → return HTTP 400 with the model's reason; onboarding page shows it inline
- If yes → proceed with upload as normal
- Cost: ~$0.001 per upload, fires once per user at onboarding (not per try-on)
- No ratio pre-filter — content-based check handles any orientation or framing

---

### Wk 6 · Launch Prep ⬜ Not Started

| Task | Effort | Status |
|---|---|---|
| Submit to Chrome Web Store *(target Wk 5, not Wk 6)* | Medium | ⬜ Not Started |
| Record before/after demo video for TikTok / Instagram Reel | Small | ⬜ Not Started |
| Set up analytics — instrument activation funnel | Small | ⬜ Not Started |
| Soft launch + post first organic video | Small | ⬜ Not Started |

#### Detail

**Chrome Web Store:** ⚠️ SCHEDULE RISK — do this in Wk 5 if possible. Review can take 3 days to 3 weeks. Optimize listing for: "virtual try-on", "fashion try-on", "see clothes on me".

**Demo video:** primary acquisition channel. The wow moment (you in a Zara jacket) is inherently shareable. Keep it raw and real — not overproduced.

**Analytics (PostHog or equivalent):** track installs, profile completions, first try-on completions, conversion to paid.
Key metric: **cost per activated user** (install + profile + ≥1 try-on).

**Soft launch:** post the organic video. Do not run paid ads yet — wait for organic signal first. Resist every feature request. The product does one thing.

---

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=

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

*Last updated: 2026-05-29 — Wk 3 complete. Wk 4 (generation pipeline) is next.*
