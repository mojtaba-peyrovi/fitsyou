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
