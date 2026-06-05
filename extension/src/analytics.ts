import posthog from 'posthog-js';

const KEY: string = process.env.POSTHOG_KEY ?? '';
const HOST = 'https://us.i.posthog.com';

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

export function identifyUser(email: string): void {
  if (!initialized) return;
  posthog.identify(email, { email });
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, { source: 'extension', ...props });
}
