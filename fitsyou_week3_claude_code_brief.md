# fitsyou — Claude Code Brief: Week 3 (Restructured)

**Date:** 2026-05-29  
**Project:** fitsyou (fitsyou.live) — virtual try-on Chrome extension  
**Week goal:** Build the infrastructure that Week 4's generation pipeline depends on. Auth, database, image storage, and minimal onboarding — all real, nothing mocked.

---

## Context

Weeks 1 and 2 are done:
- **API winner:** gpt-image-1.5 (medium quality, 1024×1024)
- **Extraction:** All 5 priority sites (Zara, ASOS, H&M, Zalando, Mango) extract cleanly via Layer 1 DOM. The extension is working and sends a product image URL + product title.

The original Week 3 plan was to wire the generation pipeline. But that pipeline needs a `user_id`, a stored user photo, and an R2 bucket — none of which exist yet. So this week we build those foundations first. The pipeline comes next week on top of real infrastructure.

---

## Week 3 Scope — Infrastructure

### 1. Next.js app scaffold + Vercel deploy

- Create a new Next.js 14 app (App Router, TypeScript)
- Deploy to Vercel immediately — the extension will call this host
- No UI polish needed. A working `/` route with "fitsyou" in the title is enough for now
- Environment variables: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

### 2. Supabase Auth

- Use **Supabase Auth** (not Clerk — keep the stack tight)
- Enable **Google OAuth** only. No email/password for now — one provider, fewer edge cases
- Session handling via Supabase SSR helpers for Next.js (`@supabase/ssr`)
- The extension will need to authenticate the user too — implement a `/auth/extension` route that the extension popup can open in a new tab to trigger Google login, then redirect back to a page that passes the session token back to the extension via `chrome.runtime.sendMessage` or `postMessage`

### 3. Postgres schema

Run these migrations in Supabase. Keep it minimal — only what Week 4 needs to function.

```sql
-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  photo_url text,                    -- R2 URL of user's face photo
  body_type text,                    -- 'petite' | 'slim' | 'average' | 'curvy' | 'plus'
  backdrop_category text,            -- 'city' | 'cafe' | 'nature' | 'studio' | 'evening'
  try_on_count_this_month int default 0,
  subscription_tier text default 'free',  -- 'free' | 'pro'
  created_at timestamptz default now()
);

-- Try-ons table
create table public.try_ons (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product_url text not null,
  product_title text,
  store_name text,
  product_image_url text,            -- original scraped product image, stored in R2
  output_image_urls text[],          -- array of R2 URLs for the 2-3 generated variants
  backdrop_used text,
  created_at timestamptz default now(),
  expires_at timestamptz             -- null for pro, 7 days from now for free
);

-- Index for cache lookup (Week 4 will use this)
create index try_ons_cache_idx on public.try_ons(user_id, product_url);
```

Enable Row Level Security on both tables:
- `profiles`: users can only read/write their own row
- `try_ons`: users can only read/write their own rows

### 4. Cloudflare R2 bucket

- Create a bucket: `fitsyou-outputs`
- Two "folders" by convention: `user-photos/` and `try-ons/`
- Enable public access on the bucket (try-on images need to be displayable in the extension popup and web profile)
- Create an API token with Object Read & Write permissions
- Add a CORS rule allowing requests from `chrome-extension://*` and the Vercel domain

Create a shared R2 upload helper at `lib/r2.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  key: string,        // e.g. 'user-photos/{user_id}.jpg'
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,  // fitsyou-outputs
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${process.env.R2_PUBLIC_URL}/${key}`
}
```

### 5. Minimal onboarding UI

Three screens, no design polish — functional only.

**Screen 1 — Photo upload** (`/onboarding/photo`)
- Single file input, accepts image/*
- On upload: resize to max 1024px on the longer side (use `sharp`), upload to R2 as `user-photos/{user_id}.jpg`, save URL to `profiles.photo_url`
- Show a preview after upload
- One "Continue" button

**Screen 2 — Body type** (`/onboarding/body-type`)
- Five buttons: Petite / Slim / Average / Curvy / Plus
- Single select. Save to `profiles.body_type`.
- One "Continue" button

**Screen 3 — Backdrop** (`/onboarding/backdrop`)
- Five buttons with short labels: City street / Café / Nature / Studio / Evening out
- Single select. Save to `profiles.backdrop_category`.
- One "Done" button → redirect to `/dashboard` (can be a placeholder page for now)

**Route guard:** If a user is authenticated but has no `photo_url`, redirect them to `/onboarding/photo` from any protected route.

---

## API Routes to Create This Week

### `POST /api/user/photo`
Accepts multipart form data. Resizes and uploads the user's photo to R2. Updates `profiles.photo_url`. Returns the new photo URL.

### `POST /api/user/profile`
Accepts `{ body_type, backdrop_category }`. Updates the profiles row. Returns the updated profile.

### `GET /api/user/profile`
Returns the current user's profile row. The extension will call this on startup to check if onboarding is complete and to get the user's photo URL and backdrop preference for use in Week 4's generation call.

---

## Extension Changes This Week

The extension needs to know who the user is. Add:

1. **Auth state check on popup open:** Call `GET /api/user/profile`. If 401, show a "Sign in to fitsyou" button that opens `/auth/extension` in a new tab. If profile has no `photo_url`, show "Complete setup" button that opens `/onboarding/photo`.

2. **Store the session token:** After the auth flow completes, the extension stores the Supabase access token in `chrome.storage.local`. Attach it as a `Bearer` token on all API calls.

3. **No generation UI yet** — the extension popup can show a disabled "Try it on" button with "Setup required" label if profile is incomplete. The button stays disabled this week; it gets wired in Week 4.

---

## What Is Explicitly Out of Scope This Week

- The generation pipeline (`/api/generate`) — Week 4
- The saved try-on grid / web profile UI — Week 4
- Paddle payments / subscription gating — Week 5
- Watermarking — Week 5
- The try-on count enforcement — Week 5

Do not build these. If a decision needs to be made about them, leave a `// TODO Week 4:` comment and move on.

---

## End-of-Week Definition of Done

- [ ] Next.js app is live on Vercel at a real URL
- [ ] Google OAuth login works in the browser
- [ ] Google OAuth login works from the extension popup (opens tab → auth → token returned to extension)
- [ ] Extension popup correctly shows auth state: signed out / signed in but no photo / ready
- [ ] Onboarding flow completes: photo uploaded to R2, body type and backdrop saved to Postgres
- [ ] `GET /api/user/profile` returns a full profile for an authenticated user
- [ ] RLS is enabled on both tables — a user cannot read another user's data
- [ ] At least one real test user has completed onboarding end-to-end

---

## Key Decisions Already Made (Do Not Revisit)

| Decision | Choice |
|----------|--------|
| Composition API | gpt-image-1.5, medium quality, 1024×1024 |
| Auth provider | Supabase Auth, Google OAuth only |
| Database | Supabase Postgres |
| Image storage | Cloudflare R2 |
| Framework | Next.js 14, App Router, TypeScript |
| Hosting | Vercel |
| Payments (Week 5) | Paddle |

---

## File Structure to Create

```
fitsyou-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    (placeholder landing)
│   ├── dashboard/
│   │   └── page.tsx                (placeholder — "You're in. Pipeline coming Week 4.")
│   ├── onboarding/
│   │   ├── photo/page.tsx
│   │   ├── body-type/page.tsx
│   │   └── backdrop/page.tsx
│   └── auth/
│       ├── callback/route.ts       (Supabase OAuth callback handler)
│       └── extension/page.tsx      (opens OAuth, sends token back to extension)
├── api/
│   └── user/
│       ├── photo/route.ts
│       └── profile/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts               (browser client)
│   │   ├── server.ts               (server client)
│   │   └── middleware.ts
│   └── r2.ts
├── middleware.ts                    (route protection)
└── .env.local
```

---

*Brief prepared 2026-05-29. Week 4 brief will cover: `/api/generate`, gpt-image-1.5 pipeline, backdrop prompt system, R2 output storage, cache lookup, and extension try-on UI.*
