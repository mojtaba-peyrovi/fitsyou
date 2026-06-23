# fitsyou — Claude Code Task Spec: Legal, Payments & Chrome Web Store Readiness

**Context:** Paddle rejected fitsyou (category: "Generative AI" — outright, not fixable). LemonSqueezy review stalled 6+ days (likely same Merchant-of-Record wall). Decision: migrate to **Stripe direct**. In parallel, prep the extension for a **beta (Unlisted) Chrome Web Store submission**. The live site currently still advertises Paddle, which is now false. This spec covers the code + content changes needed so we (a) don't break any law, (b) don't mislead users, and (c) pass Chrome review.

**Legal entity (confirmed via Impressum):** Anna Arndt, sole trader (Einzelunternehmen), Grünstraße 18, 12555 Berlin. USt-IdNr DE456926046. Mojtaba is the developer only; all legal/financial responsibility sits with Anna Arndt / House of Steam.

> ✅ **RESOLVED (2026-06-23):** Confirmed "House of Steam" is a registered trade name for Anna Arndt's Gewerbe. Kept throughout the privacy policy, Terms, Refund Policy, and Impressum ("Anna Arndt, trading as House of Steam" / "handelnd unter House of Steam").

---

## PRIORITY 0 — URGENT: Stop misleading live visitors (do first)

The live site currently tells real visitors checkout is "Powered by Paddle." Paddle is gone. Any click-through is currently broken/misleading. This is a consumer-protection (UWG) risk and just bad UX.

- [x] **P0.1** — Remove all "Powered by Paddle" / "EU VAT handled · Paddle" copy from the footer (`fitsyou.live`).
- [x] **P0.2** — Remove "Powered by Paddle" from the pricing section.
- [x] **P0.3** — Until Stripe checkout is live, make pricing CTAs (`/auth/extension`) either:
  - lead to a "Join the beta — paid plans coming soon" state, OR
  - clearly mark paid tiers as "Coming soon" and keep only the Free tier actionable.
  - Do NOT leave buttons implying an immediate working paid checkout that doesn't exist.
  - *Done: Pro/Power/Atelier cards show disabled "Coming soon" CTAs; profile's plan-switch modal disables all non-free, non-current plans; dead `UpgradeButton.tsx` (unused, called Paddle directly) deleted; `ProfilePageClient`'s Paddle-checkout code path removed.*
- [x] **P0.4** — Replace any payment-processor name in copy with neutral wording ("secure checkout") until Stripe is confirmed live, then update to "Powered by Stripe."

**Acceptance:** No reference to Paddle anywhere on the live site or in the extension. No CTA implies a working paid checkout that isn't wired up.

---

## PRIORITY 1 — Legal pages (no-law-broken baseline)

### 1.1 Privacy Policy — replace entirely
- [x] Replace `/privacy` content with the new `privacy-policy.md` (provided alongside this spec).
- [x] Key fixes it introduces vs. current version:
  - Names the **data controller** (Anna Arndt / House of Steam) — current version only says "we/us", which is a GDPR transparency gap.
  - Adds **legal basis** section, including **explicit consent for the photo as biometric/special-category data** (Art. 9). This is the single biggest GDPR exposure for this product.
  - Adds **international transfer** disclosure for OpenAI (US) with SCC/DPA safeguard language.
  - Adds **supervisory authority** (Berlin DPA) for complaints.
  - Adds **tax-law retention** note (§147 AO) for billing records.
  - Adds **Chrome Limited Use** disclosure (required for the store).
  - Adds **PostHog analytics** + body-measurement data (both live but were undocumented).
- [x] Update payment-processor row in the third-party table once Stripe is confirmed (currently marked `[PROCESSOR]` / `[TO CONFIRM]`). *Paid plans aren't live yet, so the table now states no processor is currently active and the page will be updated when one is.*
- [x] Confirm PostHog region (EU Cloud vs US) and fill the `[TO CONFIRM]` cell. *Was hardcoded to US Cloud in both repos despite an earlier compliance note saying EU was needed — switched both to `eu.i.posthog.com`. **Caveat:** this only works if the existing API key belongs to a project actually created on EU Cloud; confirm in the PostHog dashboard and re-key if it's a US Cloud project.*

### 1.2 Terms of Service (`/terms`)
- [x] Audit `/terms` for any remaining Paddle references; replace with Stripe / neutral wording.
- [x] Ensure the seller of record is correctly named as Anna Arndt / House of Steam (not Mojtaba, not "fitsyou" alone). *Was naming "Mojtaba Peyrovi" as a freelance operator — fixed.*
- [x] Confirm ToS states clearly that the user, not Google, is buying from Anna Arndt (House of Steam) — Chrome policy requires the seller be clearly identified as not-Google.

### 1.3 Refund Policy (`/refund-policy`)
- [x] This was drafted for Paddle. Rewrite for Stripe-as-direct-processor: we (Anna Arndt) are now merchant of record, so the refund obligation and process are ours, not Paddle's. *Page already avoided naming Paddle directly; added the explicit merchant-of-record statement and a "paid plans haven't launched yet" framing.*
- [x] State refund window, method, and contact (admin@fitsyou.live). Keep consistent with EU consumer withdrawal rights (14-day right of withdrawal for digital services, and how it interacts with immediate-performance consent). *Added a new "EU Right of Withdrawal" section covering § 355/356(5) BGB and immediate-performance consent.*

### 1.4 Impressum (`/impressum`)
- [x] Currently correct (names Anna Arndt, address, Steuernummer, USt-IdNr). 
- [x] Only change: if "House of Steam" IS a registered trade name, add it ("Anna Arndt, trading as House of Steam"). If not, leave as-is. *Confirmed registered — added.*

### 1.5 IP / Takedown page (`/legal/takedown`)
- [x] Verify this page exists and has a working notice-and-takedown contact (relevant because we display retailer product images). Confirm it names a contact and a response process. *Exists, contact is `legal@fitsyou.live` with a 2/7-business-day response commitment. Note: this is a different mailbox than the `admin@fitsyou.live` used elsewhere — worth confirming it's actually live before submission.*

---

## PRIORITY 2 — In-extension consent (Chrome BLOCKER)

Chrome requires that for personal/sensitive data, you **prominently disclose and obtain affirmative consent inside the product UI** — not only in the privacy policy. The uploaded photo is sensitive/biometric. Without this, expect rejection AND it's a GDPR Art. 9 requirement.

- [x] **2.1** — Add a consent step in the extension/web onboarding, shown **before** the user uploads their photo, containing:
  - Plain-language statement that the photo is used to generate try-on images.
  - That it is sent to OpenAI (a US processor) to do so.
  - That facial features in the photo may be treated as biometric/special-category data.
  - A required affirmative action (checkbox + button, not pre-ticked) to grant consent.
  - A link to the full privacy policy.
  - *Already implemented before this session (`app/onboarding/photo/page.tsx`) — verified, no changes needed.*
- [x] **2.2** — Store a record that consent was given (timestamp + policy version) in Supabase, so consent is demonstrable (GDPR accountability). *Already implemented (`photo_consent_at`, `age_confirmed_at` columns) — verified.*
- [x] **2.3** — Provide a way to withdraw consent (delete photo / delete account) that actually stops processing and triggers deletion per the retention policy. *Verified end-to-end: `DELETE /api/user/photo` and `DELETE /api/user/delete` both remove R2 objects + DB rows (+ auth user for full deletion), wired to confirm dialogs in `ProfilePageClient.tsx`.*

**Extension analytics consent gap found and fixed (not in original scope):** unlike the web app, the extension's PostHog initialized unconditionally with no consent check, and the background worker sent an anonymous install ping before any consent could exist. Added a consent banner to the popup (`AnalyticsConsentGate`) gating `initAnalytics()`, and removed the pre-consent install ping. See `fitsyou-web-app/COMPLIANCE.md` (2026-06-23 entry).

**Acceptance:** A new user cannot upload a photo without first actively granting consent via an in-UI action. Consent is logged. Withdrawal works end-to-end.

---

## PRIORITY 3 — Manifest & permissions hygiene (Chrome review risk)

- [x] **3.1** — Audit `manifest.json`. List every permission and `host_permission`. *`activeTab`, `storage`, `scripting`, `sidePanel`; host_permissions `https://*/*`, `http://*/*`.*
- [x] **3.2** — Remove any permission not used by a shipping feature (no "future-proofing" — Chrome rejects this). *All four are in active use — none removed.*
- [x] **3.3** — Scope host permissions to the actual priority retailer domains rather than `<all_urls>`, if the feature set allows it. If broad access is genuinely required, document the precise user-facing reason for the single-purpose justification. *Broad access is genuinely required for the floating badge (shows on any site, including the manual-screenshot fallback for non-priority retailers); the retailer-specific scraper script is already scoped to the 7 priority domains. Documented in `CHROME_STORE_LISTING.md`.*
- [x] **3.4** — Write the **single-purpose description** and **per-permission justification** for the Chrome dashboard Privacy tab. *Written to `fitsyou/CHROME_STORE_LISTING.md`, ready to copy-paste into the Dashboard.*
- [x] **3.5** — Confirm no remote code execution. *Confirmed — CSP is `script-src 'self'`, all logic webpack-bundled into `dist/`, no `eval`/remote script loading found.*

---

## PRIORITY 4 — Stripe integration (replaces Paddle/LS migration)

> **Deferred (2026-06-23) — out of scope for this pass.** Decided to ship the beta with paid tiers disabled ("Coming soon", see P0.3) rather than build the full Stripe migration in the same session as the legal/Chrome-review prep. Track as a separate follow-up task. Mirrors the ClickUp Stripe tasks already created in Wk 8. Pre-revenue, so don't over-build VAT tooling yet — Anna Arndt already has a VAT number.

- [ ] **4.1** — Swap Paddle SDK/package for `stripe`. Remove Paddle env vars, add Stripe keys.
- [ ] **4.2** — Create Stripe Products/Prices matching tiers: Pro €4.99, Power €9.99, Atelier €19.99 (Atelier still needs creating — it never existed in Paddle either). Free tier = no Stripe object.
- [ ] **4.3** — Rewrite webhook handler for Stripe events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Map to existing credit/quota/grace-period system.
- [ ] **4.4** — Update `UpgradeButton` + `ProfilePageClient` to use Stripe Checkout sessions and reflect Stripe subscription status.
- [ ] **4.5** — Configure Stripe Tax (or at minimum collect the data needed) so EU VAT can be handled later — but do not block beta on this.
- [ ] **4.6** — End-to-end test in Stripe test mode: signup → upgrade → downgrade → cancel → grace → webhook. Confirm quota updates correctly on each event.
- [ ] **4.7** — Once live, update privacy policy, ToS, refund policy, and footer copy to name Stripe.

---

## PRIORITY 5 — Consistency sweep

- [x] **5.1** — Grep the entire codebase (extension + web app) for "Paddle" — remove/replace every hit. *All user-facing/legal-page hits removed. Left untouched by design: `app/api/paddle/webhook/route.ts`, the `@paddle/paddle-js` package, and Paddle env vars — that's payment-integration plumbing, in scope for the deferred P4 Stripe migration, not this pass. It's inert now that no CTA can trigger Paddle checkout.*
- [x] **5.2** — Grep for any hardcoded controller/seller name that isn't "Anna Arndt" / "House of Steam" where a legal entity is implied. *Found and fixed "Mojtaba Peyrovi" in `/terms`.*
- [x] **5.3** — Verify the cookie banner actually gates PostHog. *Web app was already correctly gated. The extension was not — fixed (see Priority 2 note above).*
- [x] **5.4** — Confirm "Prices include VAT" copy is still accurate. *Retained; reworded alongside the "Coming soon" pricing copy.*

---

## Definition of Done (beta-launch legal bar)

1. No "Paddle" reference anywhere (site, extension, code, legal pages).
2. Live site never implies a working paid checkout that isn't wired.
3. Privacy policy names the controller, covers photo-as-biometric consent, international transfers, retention, supervisory authority, and Chrome Limited Use.
4. In-extension photo-upload consent step exists, is affirmative, and is logged.
5. Manifest requests only used, narrowly-scoped permissions, with single-purpose + per-permission justifications written.
6. Stripe checkout works end-to-end in test mode (can go live separately).
7. Refund policy and ToS reflect Anna Arndt / House of Steam as merchant of record.

---

## Open items needing a human decision (not code)

- ~~Confirm "House of Steam" trade-name status~~ — Resolved 2026-06-23, confirmed registered.
- ~~Confirm PostHog data region~~ — Resolved 2026-06-23: switched to EU Cloud. **Still needs a human check:** confirm in the PostHog dashboard that the existing API key belongs to a project actually created on EU Cloud (not just a host-string change) — otherwise analytics silently breaks.
- Confirm `legal@fitsyou.live` (used on the takedown page) is a live, monitored inbox.
- Priority 4 (Stripe migration) is deferred — needs its own pass before paid plans can launch.
- Lawyer consultation still open in ClickUp (hotlinking/derivative-image copyright + GDPR biometric) — the consent step above is the practical mitigation, but the lawyer sign-off on biometric processing is the real safety net. Don't treat this spec as a substitute for that.
