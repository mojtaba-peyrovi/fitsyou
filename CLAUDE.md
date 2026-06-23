# fitsyou — Claude Code Instructions

## Week 7 authoritative spec

`CLAUDE_CODE_HANDOVER_WK7_DESIGN.md` in this repo root is the Week 7 spec, **with one decision reversed (2026-05-31) — see PLAN.md, which is now authoritative on the stack:**
- **Web app stays on Next.js + Vercel.** Do NOT switch to Vite/Cloudflare and do NOT adopt the Lovable codebase. The existing `fitsyou-web-app` (Next.js) holds the working Wk 3–6 backend (APIs, Supabase, R2, Paddle) and is kept.
- The Lovable export (`fitsyou-frontend`, TanStack Start, preview at `fits-you.lovable.app`) is a **design reference only**. Port its UI + design tokens into the Next.js app, screen by screen.
- Try-on generation runs inline in the **extension popup** (never redirects) AND on the **web app** (on saved items).
- No Tailwind inside the extension popup — use scoped CSS with shared design tokens. (Tailwind in the Next.js web app is fine.)
- Brand assets live in `fitsyou-web-app/branding`. Do not redesign or reinterpret.

## ClickUp sync (automatic, no prompt needed)

The ClickUp folder for this project is at:
**https://app.clickup.com/90121823189/v/o/f/901211743712** (folder "fitsyou.live - v1 Build Plan", workspace 90121823189, space 90127948628 "Team Space")

**Any time PLAN.md is updated — for any reason — the corresponding ClickUp tasks must be updated in the same response, without being asked.**

This includes:
- Marking tasks Done when work is confirmed complete
- Adding new tasks when new work is added to PLAN.md
- Updating task descriptions when task detail changes
- Reflecting any scope, status, or week assignment changes (lists in the folder mirror week assignments, e.g. "Wk 8", plus "Bug Fixes" and "Backlog")

The rule from PLAN.md applies here too: **neither PLAN.md nor ClickUp is the source of truth alone — they are always kept in sync.**

## Plan sync rule (from PLAN.md)

After every task is completed, it MUST be marked done in **both** PLAN.md **and** ClickUp. Do not consider a task finished until both reflect it.

## Tool / API / MCP documentation rule

Any new external tool, API, MCP server, or third-party service introduced by the agent and approved by the owner **must be documented immediately** — in the same response where it is first used — across all three places:

1. **README.md** (in the relevant repo) — what it does, how it is wired up, required env vars
2. **CLAUDE.md** (in the relevant repo) — one-line entry in the External services section below
3. **ClickUp** — add a task or update the relevant task notes

This rule applies retroactively: if a session ends without documenting a new tool, the next session must document it before doing anything else.

## External services (fitsyou-web-app)

| Service | Purpose | Env vars |
|---|---|---|
| Supabase | Auth, Postgres DB, Row-Level Security | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |
| Cloudflare R2 | Object storage for user photos & try-on outputs | `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` |
| Paddle | Payments & subscriptions — **deprecated, account rejected by Paddle; no live checkout.** All paid-tier CTAs are disabled ("Coming soon") site-wide as of 2026-06-23 pending migration to Stripe direct (see PLAN.md). Webhook route and SDK left in place but inert until that migration. | `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` |
| OpenAI | GPT-4o-mini vision for full-body photo validation | `OPENAI_API_KEY` |
| Replicate | Background removal for garment images | `REPLICATE_API_TOKEN` |
| Browserless | Headless-Chrome render fallback for web link-paste — fetches the JS-rendered product gallery (flat-lay) on SPA retailers (Zara, H&M) where static HTML only exposes the hero `og:image` | `BROWSERLESS_API_KEY`, optional `BROWSERLESS_URL` |
| Resend | Transactional email (signup confirmation, etc.) | Configured via Supabase SMTP settings — host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key |
| City autocomplete dataset | Static world-cities JSON (`app/data/cities.json`, ~28.7k cities, pop ≥ 15k) with server-side prefix search for onboarding backdrop step. Replaced Nominatim, which ranked by full-address relevance and missed obvious cities (e.g. Berlin) on partial queries | No API key — `npm run data:cities` regenerates from `world-cities-json` devDependency |
| Playwright | Responsive screenshot testing (dev only) | None — `scripts/shots*.mjs`, run locally |
| PostHog | Product analytics — activation funnel (install, sidepanel open, wishlist save, try-on generate/save). Extension gates init on an in-popup consent banner (chrome.storage.local key `fitsyou_analytics_consent`, see `extension/src/analytics.ts` / `extension/src/popup/index.tsx`), mirroring the web app's cookie-banner gate | `POSTHOG_KEY` in `.env` (extension); `NEXT_PUBLIC_POSTHOG_KEY` in `.env.local` (web app); host `https://eu.i.posthog.com` (EU Cloud, switched 2026-06-23 — **requires a PostHog project created on EU Cloud; replace the key if it belongs to a US Cloud project**) |
