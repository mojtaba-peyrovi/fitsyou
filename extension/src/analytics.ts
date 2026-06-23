import posthog from 'posthog-js';

const KEY: string = process.env.POSTHOG_KEY ?? '';
const HOST = 'https://eu.i.posthog.com';
const CONSENT_KEY = 'fitsyou_analytics_consent';

let initialized = false;

export function initAnalytics(): void {
  if (!KEY || initialized || typeof window === 'undefined') return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false,
    persistence: 'localStorage',
  });
  initialized = true;
}

// Consent is stored per-install in chrome.storage.local (separate from the
// web app's localStorage decision, since the extension and fitsyou.live are
// different origins). null = not yet decided, so initAnalytics() must not
// be called until the user explicitly accepts.
export function getAnalyticsConsent(): Promise<boolean | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONSENT_KEY], (items) => {
      const v = items[CONSENT_KEY];
      resolve(v === true || v === false ? v : null);
    });
  });
}

export function setAnalyticsConsent(value: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CONSENT_KEY]: value }, () => resolve());
  });
}

export function clearAnalyticsConsent(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([CONSENT_KEY], () => {
      if (initialized) posthog.opt_out_capturing();
      resolve();
    });
  });
}

export function identifyUser(email: string): void {
  if (!initialized) return;
  posthog.identify(email, { email });
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, { source: 'extension', ...props });
}
