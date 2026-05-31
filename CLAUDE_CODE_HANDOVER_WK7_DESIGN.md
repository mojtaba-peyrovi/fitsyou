# CLAUDE_CODE_HANDOVER — Week 7: Design System, Stack Switch, Mobile/PWA

**Project:** fitsyou.live
**Scope:** Week 7 of the v1 build plan — production-grade design for web app + extension, stack switch to Vite/Cloudflare, and the mobile/PWA layer.
**Status:** Planning complete. Brand identity finalised. Ready for implementation.
**Monday board:** `5097397427` (group: "Wk 7 · PWA + Mobile Share Sheet")
**Brand kit:** `fitsyou-brand-kit-assets.zip` (SVGs + PNGs at all sizes) — drop into repo root as `brand/`

---

## 0. Purpose of This Document

This is the authoritative spec for Week 7. It captures decisions made in planning that override anything contradictory in earlier docs (notably the original `idea.md`, which still lists Next.js/Vercel). Where this document and `idea.md` disagree, **this document wins.**

Read this fully before writing any code. Do not re-introduce Next.js, Vercel, or Tailwind-in-extension.

---

## 1. Architecture Decisions Locked This Session

These are non-negotiable for v1. They resulted from explicit discussion and supersede prior assumptions.

### 1.1 Where the "magic" happens — both surfaces

The try-on generation must happen **in the moment, on both surfaces**:

- **Extension popup (desktop):** detect product → try-on runs *inside the popup* (or an expanded side panel). **Never** redirect to the website to perform the try-on. A tab switch at the decision moment kills the core value proposition.
- **fitsyou.live (desktop + mobile):** full try-on capability on any *already-saved* item, because the product image is already stored in R2 — no re-scraping needed.

The earlier model (extension = wishlist only, website = fitting room) is **rejected**. The friction was in the wrong place.

### 1.2 Capture vs. consumption model

| Action | Desktop | Mobile |
|---|---|---|
| Detect product on retailer page | ✅ Extension | ❌ Not possible (no mobile extensions) |
| Run try-on | ✅ Extension popup | ✅ fitsyou.live (on saved items) |
| Save to wishlist | ✅ Extension | ✅ fitsyou.live |
| Review & compare try-ons | ✅ fitsyou.live | ✅ fitsyou.live |
| Click through to buy | ✅ fitsyou.live | ✅ fitsyou.live |

**The only thing mobile genuinely cannot do is the initial product capture from a live retailer page.** Everything else — including generating try-ons on saved items — works on mobile via fitsyou.live.

### 1.4 Dual-surface generation + automatic sync

Try-on generation is wired into BOTH surfaces:

- **Extension popup:** user clicks "Try this on me" → extension calls the generation endpoint with user photo (from Supabase profile) + scraped product image → receives 2 variants → displays results **inside the popup** → saves to Supabase + R2.
- **Web app (desktop + mobile):** user sees a saved wishlist item → taps "Try this on" → same generation endpoint called with user photo + already-stored product image from R2 → results displayed inline → saved to Supabase + R2.

**Sync is automatic and requires no special mechanism.** Both surfaces write to the same Supabase database and the same R2 bucket. A try-on generated in the extension popup appears on the web app dashboard immediately on next load (or via real-time Supabase subscription if implemented). A try-on generated on mobile via the web app appears in the user's profile when they next open fitsyou.live on desktop. One database, one image store, zero sync logic.

Every generated image gets the corner mark applied (see §7.3).

### 1.5 Mobile capture roadmap

- **Phase 1 (this week, v1):** Manual URL paste in the mobile web app. Backend fetches the product image server-side using the same extraction pipeline as the extension.
- **Phase 2 (this week, v1):** PWA + Web Share Target API. User taps the native share button on a product page → selects fitsyou → URL is received and processed. No app store needed.
- **Phase 3 (post-traction, NOT this week):** Native iOS/Android app with a real share extension. Only built if metrics justify it.

---

## 2. Stack Switch — Next.js/Vercel → Vite React + Cloudflare Pages

**This is a hard change. Remove Next.js and Vercel entirely.**

### Why
- Lovable (the design tool we're using) outputs **Vite + React**, not Next.js. Porting to Next.js would be wasted effort.
- The fitsyou.live profile/dashboard sits behind auth → SEO is irrelevant → SSR provides no benefit.
- The landing page is already deployed separately on Cloudflare Pages.
- We already use Cloudflare (R2, Pages, Registrar). Dropping Vercel simplifies infra to a single provider and removes a dangling account.
- No extra cost: Cloudflare Pages free tier covers this.

### Implementation steps
1. Remove Next.js + Vercel from repo, dependencies, and any config (`next.config.js`, `vercel.json`, Vercel project).
2. Initialise the app as **Vite + React** (or export directly from Lovable as the project base).
3. Connect the GitHub repo (`fitsyou`) to **Cloudflare Pages**:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Configure environment variables in the Cloudflare Pages dashboard:
   - Supabase URL + publishable/secret keys
   - Cloudflare R2 S3-compatible credentials
   - Paddle: `PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_PRICE_ID_PRO`, `PADDLE_PRICE_ID_POWER`
   - OpenAI API key (GPT Image 1.5)
5. Verify Supabase auth redirect URLs are updated to the fitsyou.live domain (not a Vercel preview URL).

> Note: Supabase region is EU West / Frankfurt. Keep all data-handling EU-compliant.

---

## 3. Design System (Single Source of Truth)

A shared token set drives **both** the web app and the extension popup. Implement once, import everywhere.

### 3.1 Direction
Editorial fashion meets practical utility. **Shocking pink (#FF2E88) accent on a dark-brand / light-content split.** Dark surfaces (ink #121212) for brand chrome — nav bar, hero bands, extension header. Light surfaces (bone #F5F2EC, white #FFFFFF) for content — dashboard grid, cards, profile. The pink accent ties both worlds together. It should feel like it belongs next to a fashion retailer's site, not next to Linear/Notion. Think Schiaparelli energy — bold, confident, scroll-stopping — tuned for TikTok/Reels shareability.

### 3.2 Color tokens

| Token | Value | Use |
|---|---|---|
| `--color-pink` | `#FF2E88` | Primary accent — "you" in wordmark, CTAs, highlights, corner mark |
| `--color-pink-dark` | `#D1246E` | Text-on-light accent — store tags, headings on bone/white surfaces |
| `--color-pink-light` | `#FFE0ED` | Soft highlights, badges, notification backgrounds |
| `--color-ink` | `#121212` | Dark brand surfaces — nav bar, hero, extension header, primary text |
| `--color-bone` | `#F5F2EC` | Content background — dashboard, profile, light surfaces |
| `--color-surface` | `#FFFFFF` | Cards, inputs, content containers |
| `--color-muted` | `#9A9690` | Secondary text |
| `--color-faint` | `#C4C0BA` | Hints, faint borders, disabled states |
| `--color-border` | `rgba(18,18,18,0.10)` | Default borders on light surfaces |

The split model: **dark for brand moments** (nav, hero, extension chrome), **light for content** (dashboard grid, cards, photography). Pink appears as accent on both.

### 3.3 Typography

| Role | Font | Notes |
|---|---|---|
| Logo / display / headings | **Playfair Display** (serif) | Italic available for accent |
| UI / body | **DM Sans** (weights 300–500) | All interface text |
| Metadata / labels / prices | **DM Mono** | Store tags, prices, uppercase micro-labels |

Load via Google Fonts. No Arial/Inter/Roboto/system fonts.

### 3.4 Shared token file
Create one `tokens.css` (CSS custom properties) imported by:
- the Vite React web app, and
- the Preact extension popup.

This is what keeps the two surfaces visually identical. Do **not** maintain two separate palettes.

---

## 4. Web App (Vite React) — Screens to Build

Designed in Lovable, exported, integrated into the repo. All screens **mobile-responsive from the start** (the web app is the full mobile experience).

1. **Dashboard / try-on grid** — editorial grid of saved try-ons. Each card: try-on image, store name (DM Mono, pink-dark accent `#D1246E`), product title, price, buy link, backdrop label. Mix of wide + narrow cards. On mobile → 2 columns, tap-friendly. Dark nav bar (`#121212`) with pink wordmark. Light bone (`#F5F2EC`) content area.
2. **Wishlist** — saved items not yet tried on; each has a "try this on" action that runs generation from the stored product URL/image.
3. **Profile / settings** — photo update, body type, backdrop preference, subscription management (Paddle).
4. **Onboarding** — minimal: one photo, body type, backdrop preference. No quiz, no persona system.
5. **Share-target landing route** (`/share-target`) — see §6.2.
6. **Manual URL paste flow** — see §6.1.

### Mobile UI requirements
- Try-on grid → 2-col on mobile.
- Minimum 44px touch targets.
- Try-on generation works in mobile browser.
- Buy links open retailer in a new tab.
- Test on iOS Safari and Android Chrome.

---

## 5. Chrome Extension Popup (Preact)

### 5.1 Stack constraints
- Manifest V3 + TypeScript + **Preact** + Webpack (already scaffolded).
- **Do NOT use Tailwind in the extension.** Tailwind's bundle bloats the extension. Use scoped CSS from the shared `tokens.css`.

### 5.2 Porting workflow (Lovable → Preact)
The popup is designed in Lovable as a constrained **360px-wide** mockup, then ported:
1. Swap React imports for Preact (`import { h, Fragment } from 'preact'`; ensure `jsxFactory`/`jsxFragment` or the automatic Preact JSX runtime is configured).
2. **Strip all Tailwind classes.**
3. Replace with scoped CSS referencing the shared design tokens (ink `#121212`, pink `#FF2E88`, bone `#F5F2EC`, Playfair Display + DM Sans + DM Mono).
4. Preact is ~100% React-API-compatible, so component logic transfers as-is in most cases.

### 5.3 Popup states (all must be implemented)
- **Ready:** header (dark `#121212` bg, pink logo + tries remaining), detected-product card (store tag in `#D1246E`, title, "product image found" confidence), backdrop selector chips, "Try this on me" CTA (pink `#FF2E88` button).
- **Generating:** spinner + progress bar (pink accent), "Composing your try-on…", "usually takes 8–15 seconds".
- **Result:** try-on image(s) with corner mark, save-to-profile confirmation, link to view on fitsyou.live.

### 5.4 Constraints
- Width: 360px. Target height ≤ ~580px, avoid scrolling where possible.
- 2 variants generated per try-on, saved automatically to the user's profile.

---

## 6. Mobile / PWA Layer

### 6.1 Manual URL paste (Phase 1 fallback)
- Add a URL input field to the mobile dashboard.
- User pastes any product URL.
- Backend fetches the product image **server-side** using the same layered extraction pipeline as the extension (DOM → `og:image` → manual upload fallback).
- Show a product preview before saving.

### 6.2 PWA conversion
- Add `manifest.json`: `name`, icons, `theme_color` (`#121212`), `background_color` (`#F5F2EC`), `display: standalone`.
- Register a service worker for offline shell caching.
- Deploy updated manifest to Cloudflare Pages.
- Test install prompt on Android Chrome and iOS Safari "Add to Home Screen".

### 6.3 Web Share Target API (Phase 2)
- Add `share_target` to the manifest: `method: POST`, `enctype: multipart/form-data`, accepting `url` and `text` params.
- Build the `/share-target` route in the Vite React app: read the incoming URL, auto-populate the add-to-wishlist flow, redirect to dashboard.
- Test via the Chrome share sheet on Android.

### 6.4 PWA assets
- Icons at 192×192, 512×512, plus a maskable variant.
- `apple-touch-icon` meta tags.
- `theme_color` / `background_color` matching brand.
- Test splash screen on iOS and Android home-screen install.
- (These consume the final logo assets — see §7.)

---

## 7. Logo / Wordmark — FINALISED

### 7.1 Wordmark
- Font: **Playfair Display**
- "fits" — upright (regular 400), colour matches the surface contrast (ink on light, bone on dark)
- "you" — **italic**, always **#FF2E88 shocking pink**
- Always **lowercase**. Never title case, never all-caps.
- The two-tone split is the brand — never render in a single colour.

### 7.2 Icon mark — the italic "y"
- Playfair Display italic "y" in pink (#FF2E88) on an ink (#121212) rounded-rectangle background.
- Three variants exist: dark (primary), pink (accent — pink bg, white y), light (bone bg, dark y).
- Works at all sizes: 512px (app store) → 16px (favicon).
- All PNG exports are pre-generated in the brand kit zip.

### 7.3 Wordmark on photography (corner mark)
Every generated try-on image carries a discreet **corner mark** (bottom-right):
- "fits" in white (90% opacity), "you" in pink (#FF2E88).
- On dark photography, pink lightens slightly to #FF5DA0.
- Font size: ~2–3% of image height.
- **This is NOT a watermark for protection** — it's brand placement for growth.
- Free and paid images both carry the corner mark.
- Pro users get an additional perk: download a **clean, logo-free** version.

The conversion driver is the **try-on quota** (5 free/month), not the corner mark. Free users who screenshot and share are distributing branded marketing assets for free — this is a feature, not a leak.

### 7.4 Delivered assets (in `fitsyou-brand-kit-assets.zip`)

**SVGs:**
- `svg/wordmark-on-light.svg` — dark "fits" + pink "you" for light backgrounds
- `svg/wordmark-on-dark.svg` — bone "fits" + pink "you" for dark backgrounds
- `svg/icon-dark.svg` — primary icon (ink bg, pink y)
- `svg/icon-pink.svg` — accent icon (pink bg, white y)
- `svg/icon-light.svg` — light icon (bone bg, ink y)

**PNGs (all three icon variants at each size):**
- 16, 32, 48, 128, 192, 512px
- `icon-maskable-192.png`, `icon-maskable-512.png` (PWA safe-zone padded)
- `favicon.ico` (multi-size: 16+32+48)
- `apple-touch-icon.png` (180px)

> The logo is DONE. Use the assets from the zip. Do not redesign or reinterpret.

---

## 8. Recommended Build Sequence (within Week 7)

1. **Logo + wordmark** — ✅ DONE. Assets in `fitsyou-brand-kit-assets.zip`. Drop into repo as `brand/`.
2. **Stack switch** — Next.js/Vercel → Vite React + Cloudflare Pages.
3. **Lovable web app design** — all screens, built on the confirmed brand + tokens (shocking pink + ink + bone).
4. **Port Lovable popup → Preact** — extension UI, Tailwind stripped, scoped CSS with shared tokens.
5. **PWA conversion** — manifest + service worker (uses logo icons from `brand/png/`).
6. **Mobile optimisation + Web Share Target** — responsive polish + share sheet receiver.
7. **Manual URL paste + PWA icons/meta** — final wiring.

---

## 9. Explicitly OUT of Scope (do not build)

- Native iOS/Android app (Phase 3, post-traction only).
- Mobile product capture from a *live* retailer page (impossible without a native app; covered by URL paste + share sheet instead).
- Tailwind inside the extension popup.
- Next.js / Vercel anything.
- Diagonal or heavy watermarks on free-tier images (the corner mark is for branding, not protection — see §7.3).
- Image download for free-tier users (download is a Pro perk; free users view in-app only).
- Any feature that does not make the try-on better, cheaper, or faster (core product principle remains in force).

---

## 10. Locked Technical Context (reference)

- **Try-on API:** GPT Image 1.5 (only)
- **Extension:** Manifest V3 + TypeScript + Preact + Webpack
- **Web app:** Vite + React → Cloudflare Pages *(changed from Next.js/Vercel)*
- **Auth & DB:** Supabase (EU West / Frankfurt)
- **Image storage:** Cloudflare R2 (bucket `fitsyou-outputs`)
- **Payments:** Paddle (Pro €4.99/mo, Power €9.99/mo, Atelier €19.99/mo)
- **Pricing:** Free 5/mo, Pro 20/mo, Power 100/mo, Atelier unlimited
- **Domain/brand:** fitsyou.live
- **Repo:** GitHub `fitsyou` (private)

---

*End of handover. Build in the sequence above. Where this conflicts with `idea.md`, this document is authoritative.*
