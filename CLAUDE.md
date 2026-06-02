# fitsyou — Claude Code Instructions

## Week 7 authoritative spec

`CLAUDE_CODE_HANDOVER_WK7_DESIGN.md` in this repo root is the Week 7 spec, **with one decision reversed (2026-05-31) — see PLAN.md, which is now authoritative on the stack:**
- **Web app stays on Next.js + Vercel.** Do NOT switch to Vite/Cloudflare and do NOT adopt the Lovable codebase. The existing `fitsyou-web-app` (Next.js) holds the working Wk 3–6 backend (APIs, Supabase, R2, Paddle) and is kept.
- The Lovable export (`fitsyou-frontend`, TanStack Start, preview at `fits-you.lovable.app`) is a **design reference only**. Port its UI + design tokens into the Next.js app, screen by screen.
- Try-on generation runs inline in the **extension popup** (never redirects) AND on the **web app** (on saved items).
- No Tailwind inside the extension popup — use scoped CSS with shared design tokens. (Tailwind in the Next.js web app is fine.)
- Brand assets live in `fitsyou-web-app/branding`. Do not redesign or reinterpret.

## Monday.com sync (automatic, no prompt needed)

The Monday.com board for this project is at:
**https://mojtabapeyrovis-team.monday.com/boards/5097397427**

**Any time PLAN.md is updated — for any reason — the corresponding Monday.com board items must be updated in the same response, without being asked.**

This includes:
- Marking tasks Done when work is confirmed complete
- Adding new board items when new tasks are added to PLAN.md
- Updating item notes/descriptions when task detail changes
- Reflecting any scope, status, or week assignment changes

The rule from PLAN.md applies here too: **neither PLAN.md nor the Monday board is the source of truth alone — they are always kept in sync.**

## Plan sync rule (from PLAN.md)

After every task is completed, it MUST be marked done in **both** PLAN.md **and** the Monday.com board. Do not consider a task finished until both reflect it.

## Tool / API / MCP documentation rule

Any new external tool, API, MCP server, or third-party service introduced by the agent and approved by the owner **must be documented immediately** — in the same response where it is first used — across all three places:

1. **README.md** (in the relevant repo) — what it does, how it is wired up, required env vars
2. **CLAUDE.md** (in the relevant repo) — one-line entry in the External services section below
3. **Monday.com board** — add a board item or update the relevant task notes

This rule applies retroactively: if a session ends without documenting a new tool, the next session must document it before doing anything else.

## External services (fitsyou-web-app)

| Service | Purpose | Env vars |
|---|---|---|
| Supabase | Auth, Postgres DB, Row-Level Security | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |
| Cloudflare R2 | Object storage for user photos & try-on outputs | `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` |
| Paddle | Payments & subscriptions | `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` |
| OpenAI | GPT-4o-mini vision for full-body photo validation | `OPENAI_API_KEY` |
| Replicate | Background removal for garment images | `REPLICATE_API_TOKEN` |
| Resend | Transactional email (signup confirmation, etc.) | Configured via Supabase SMTP settings — host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key |
| OpenStreetMap Nominatim | Free city autocomplete in onboarding backdrop step | No API key — public endpoint `nominatim.openstreetmap.org` |
| Playwright | Responsive screenshot testing (dev only) | None — `scripts/shots*.mjs`, run locally |
