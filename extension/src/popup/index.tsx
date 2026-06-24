import { render, createContext } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';
import {
  initAnalytics, identifyUser, capture,
  getAnalyticsConsent, setAnalyticsConsent, clearAnalyticsConsent,
} from '../analytics';

const API_BASE = 'https://fitsyou.live';

// ─── Brand tokens — v3 "Soft Cool Stone" ─────────────────────────────────────
const C = {
  pink:    '#FF2E88',
  berry:   '#C41E63',
  blush:   '#F8D7E4',
  ink:     '#161616',
  mist:    '#EEF1EE',
  cloud:   '#FAFBFA',
  stone:   '#D8DEDB',
  ash:     '#9FA8A3',
  slate:   '#5D6560',
  border:  'rgba(22,22,22,0.14)',
  // backward-compat aliases (updated to v3 values)
  pinkDark:  '#C41E63',
  pinkLight: '#F8D7E4',
  bone:      '#EEF1EE',
  surface:   '#FAFBFA',
  muted:     '#5D6560',
  faint:     '#9FA8A3',
};
const SERIF = "'Playfair Display', Georgia, serif";
const SANS  = "'Archivo', system-ui, sans-serif";
const MONO  = "'Archivo', system-ui, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type PopupState = 'checking' | 'signed-out' | 'needs-setup' | 'idle' | 'manual';
type TabKey = 'tryons' | 'wishlist' | 'wardrobe' | 'fitting-room';

interface ExtractResult {
  success: boolean;
  imageUrl?: string;
  productTitle?: string;
  price?: string | null;
  productUrl?: string;
  sizeChartText?: string;
  availableSizes?: string[];
  selectedSize?: string;
}

type FitVerdict = 'good' | 'borderline' | 'poor' | 'unknown';

interface FitResult {
  verdict: FitVerdict;
  recommended_size: string | null;
  reason: string;
  needs_measurements?: boolean;
}

interface Profile {
  photo_url: string | null;
  face_url?: string | null;
  email?: string | null;
  try_on_count_this_month?: number;
  subscription_tier?: string;
  extension_installed?: boolean;
}

interface WishlistItem {
  id: string;
  product_url: string;
  product_image_url: string | null;
  product_title: string | null;
  store_name: string | null;
  price: string | null;
  fit_verdict: FitVerdict | null;
  recommended_size: string | null;
}

interface WardrobeItem {
  id: string;
  name: string | null;
  category: string | null;
  image_url: string;
}

interface OutfitItemRef { label: string; store: string | null; url: string | null; image: string | null; price?: string | null; }

interface TryOnItem {
  id: string;
  product_title: string | null;
  store_name: string | null;
  product_image_url: string | null;
  output_image_urls: string[];
  created_at: string;
  outfit_items?: OutfitItemRef[] | null;
}

interface ItemRef { source: 'wishlist' | 'wardrobe'; id: string; }

// ─── Utilities ───────────────────────────────────────────────────────────────
function faviconUrl(productUrl: string): string {
  try {
    const { hostname } = new URL(productUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch { return ''; }
}
const SUPPORTED_RETAILER_DOMAINS = [
  'zara.com', 'asos.com', 'hm.com',
  'zalando.com', 'zalando.de', 'zalando.co.uk', 'mango.com',
];
function isRetailerUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return SUPPORTED_RETAILER_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch { return false; }
}

function storeName(url: string): string {
  try {
    const parts = new URL(url).hostname.split('.');
    const ccSld = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'ne', 'me']);
    const sld = parts[parts.length - 2];
    return (ccSld.has(sld) && parts.length >= 3 ? parts[parts.length - 3] : sld) ?? '';
  } catch { return ''; }
}

const R2_PREFIXES = ['wardrobe/', 'try-ons/', 'user-photos/', 'user-faces/', 'product-images/'];
function authKeyFor(src: string): string | null {
  try {
    const key = new URL(src).pathname.replace(/^\//, '');
    return R2_PREFIXES.some((p) => key.startsWith(p)) ? key : null;
  } catch { return null; }
}

async function getToken(): Promise<string | undefined> {
  return new Promise((resolve) =>
    chrome.storage.local.get(['fitsyou_token'], (items) =>
      resolve(items['fitsyou_token'] as string | undefined)
    )
  );
}

async function getRefreshToken(): Promise<string | undefined> {
  return new Promise((resolve) =>
    chrome.storage.local.get(['fitsyou_refresh_token'], (items) =>
      resolve(items['fitsyou_refresh_token'] as string | undefined)
    )
  );
}

function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  return new Promise((resolve) =>
    chrome.storage.local.set(
      { fitsyou_token: accessToken, fitsyou_refresh_token: refreshToken },
      resolve
    )
  );
}

function clearTokens(): Promise<void> {
  return new Promise((resolve) =>
    chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token'], resolve)
  );
}

// Supabase access tokens are short-lived (~1hr). Without this, every request
// made after expiry — including the image fetches behind AuthImg — silently
// 401s and the UI shows blank/placeholder content with no visible error.
// In-flight refreshes are deduped so concurrent 401s (e.g. a screen full of
// AuthImg thumbnails expiring at once) only trigger one network call.
let refreshInFlight: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const r = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!r.ok) return null;
      const data = (await r.json()) as { access_token: string; refresh_token: string };
      await setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch { return null; }
  })();
  try { return await refreshInFlight; } finally { refreshInFlight = null; }
}

// Drop-in replacement for `fetch` against API_BASE that refreshes the access
// token and retries once on a 401, instead of letting the request fail
// silently. `token` is the caller's best-known token (may already be stale);
// the latest token from storage is re-read on retry in case another call
// refreshed it first.
async function authedFetch(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (tk: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${tk}` },
  });
  const first = await fetch(`${API_BASE}${path}`, withAuth(token));
  if (first.status !== 401) return first;

  const refreshed = await refreshAccessToken();
  if (!refreshed) { await clearTokens(); return first; }
  return fetch(`${API_BASE}${path}`, withAuth(refreshed));
}

async function apiGet<T>(token: string, path: string): Promise<T[]> {
  try {
    const r = await authedFetch(token, path);
    if (!r.ok) return [];
    const j = (await r.json()) as { items?: T[] };
    return j.items ?? [];
  } catch { return []; }
}

async function apiPost(token: string, path: string, body: unknown): Promise<{ ok: boolean; data?: unknown; error?: string; code?: string }> {
  try {
    const r = await authedFetch(token, path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (data as { error?: string }).error ?? `Error ${r.status}`, code: (data as { code?: string }).code };
    return { ok: true, data };
  } catch { return { ok: false, error: 'Network error — please try again.' }; }
}

const TIER_LIMITS: Record<string, number> = { free: 5, pro: 20, power: 100, atelier: Infinity };

function toSentenceCase(s: string): string {
  const t = s.trim();
  if (!t) return t;
  // Only normalize if the string is mostly uppercase (store like Zara uses ALL CAPS)
  const upper = t.replace(/[^a-zA-Z]/g, '');
  const ratio = upper.length > 0 ? (upper.split('').filter((c) => c === c.toUpperCase()).length / upper.length) : 0;
  if (ratio < 0.7) return t; // already mixed case — leave it alone
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

const FIT_BADGE: Record<FitVerdict, { label: string; bg: string; fg: string }> = {
  good:      { label: 'Good fit',   bg: '#dcfce7', fg: '#166534' },
  borderline:{ label: 'Borderline', bg: '#fef9c3', fg: '#854d0e' },
  poor:      { label: "Won't fit",  bg: '#fee2e2', fg: '#991b1b' },
  unknown:   { label: 'Fit unknown',bg: C.pinkLight, fg: C.pinkDark },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function UploadSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function BulkUploadSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="14" rx="2" />
      <path d="M6 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" />
      <polyline points="10 14 10 10 14 10" />
      <line x1="10" y1="10" x2="6" y2="14" />
    </svg>
  );
}

function AuthImg({ src, token, alt, style }: { src: string | null; token: string; alt: string; style: preact.JSX.CSSProperties }) {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    if (!src) { setResolved(null); return; }
    const key = authKeyFor(src);
    if (!key) { setResolved(src); return; }
    authedFetch(token, `/api/image?key=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => { if (blob) { revoke = URL.createObjectURL(blob); setResolved(revoke); } })
      .catch(() => setResolved(null));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [src, token]);
  if (!resolved) return <div style={{ ...style, background: C.faint }} />;
  return <img src={resolved} alt={alt} style={style} />;
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${size > 20 ? 3 : 2}px solid ${C.pinkLight}`, borderTopColor: C.pink,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

function StoreTag({ name }: { name: string }) {
  return <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.pinkDark }}>{name}</div>;
}

function Toast({ msg, type, onDismiss }: { msg: string; type: 'success' | 'error'; onDismiss?: () => void }) {
  return (
    <div style={{
      background: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#166534' : '#991b1b',
      borderRadius: '0', padding: '8px 12px', fontSize: '12px',
      fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '6px',
    }}>
      <span style={{ flexShrink: 0 }}>{type === 'success' ? '✓' : '!'}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{msg}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', lineHeight: 1, opacity: 0.6, flexShrink: 0, color: 'inherit' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Fitting Room (inline in popup) ──────────────────────────────────────────
function FittingRoom({
  wishlist, wardrobe, token, onOpenDashboard, onTryOnSaved,
}: {
  wishlist: WishlistItem[];
  wardrobe: WardrobeItem[];
  token: string;
  onOpenDashboard: () => void;
  onTryOnSaved: () => void;
}) {
  const [selected, setSelected] = useState<ItemRef[]>([]);
  const [phase, setPhase]       = useState<'idle' | 'generating' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults]   = useState<string[]>([]);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const generatingRef  = useRef(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [photoConsentShown, setPhotoConsentShown] = useState(false);
  const [photoConsentPhotoAgreed, setPhotoConsentPhotoAgreed] = useState(false);
  const [photoConsentAgeAgreed, setPhotoConsentAgeAgreed] = useState(false);

  // Restore canvas state from storage on mount (survives popup close/reopen)
  useEffect(() => {
    chrome.storage.local.get('fitsyou_canvas', (data) => {
      const s = data['fitsyou_canvas'] as { selected?: ItemRef[]; results?: string[] } | undefined;
      if (s?.results?.length) {
        setSelected(s.selected ?? []);
        setResults(s.results);
        setPhase('done');
      } else if (s?.selected?.length) {
        setSelected(s.selected);
      }
      setCanvasReady(true);
    });
    // Check if photo consent has already been given
    getPhotoConsent().then((consented) => {
      if (!consented) setPhotoConsentShown(true);
    });
  }, []);

  // Persist canvas state whenever selected items or results change
  useEffect(() => {
    if (!canvasReady) return;
    if (selected.length === 0 && results.length === 0) {
      chrome.storage.local.remove('fitsyou_canvas');
    } else {
      chrome.storage.local.set({ fitsyou_canvas: { selected, results } });
    }
  }, [canvasReady, selected, results]);

  function clearCanvas() {
    generatingRef.current = false;
    setSelected([]); setPhase('idle'); setProgress(0);
    setResults([]); setSaved(false); setError('');
    chrome.storage.local.remove('fitsyou_canvas');
  }

  const isSelected = (ref: ItemRef) => selected.some((s) => s.source === ref.source && s.id === ref.id);

  function toggle(ref: ItemRef) {
    setResults([]); setSaved(false); setError('');
    setSelected((prev) =>
      prev.some((s) => s.source === ref.source && s.id === ref.id)
        ? prev.filter((s) => !(s.source === ref.source && s.id === ref.id))
        : [...prev, ref]
    );
  }

  async function handlePhotoConsentAccept() {
    if (!photoConsentPhotoAgreed || !photoConsentAgeAgreed) return;
    setPhotoConsentShown(false);
    await setPhotoConsent(true);
    // Log consent to backend
    const tk = (await getToken()) ?? token;
    await apiPost(tk, '/api/user/photo-consent', {
      source: 'extension',
      timestamp: new Date().toISOString(),
    }).catch(() => {}); // non-blocking
  }

  async function generate() {
    if (selected.length === 0) return;
    const consented = await getPhotoConsent();
    if (!consented) {
      setPhotoConsentShown(true);
      return;
    }
    setPhase('generating');
    setProgress(0); setError(''); setResults([]); setSaved(false);
    generatingRef.current = true;

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(88, (elapsed / 25000) * 100));
      if (generatingRef.current) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const tk = (await getToken()) ?? token;
    const res = await apiPost(tk, '/api/outfit', { item_refs: selected });
    generatingRef.current = false;
    setProgress(100);

    if (!res.ok) {
      setError(res.error ?? 'Generation failed');
      setPhase('idle');
      return;
    }
    const urls = ((res.data as { output_image_urls?: string[] }).output_image_urls) ?? [];
    setResults(urls);
    setPhase('done');
    capture('tryon_generated', { item_count: selected.length });
  }

  async function saveToTryOns() {
    if (results.length === 0) return;
    const tk = (await getToken()) ?? token;
    const outfitItems = selected.map((ref) => {
      if (ref.source === 'wishlist') {
        const w = wishlist.find((w) => w.id === ref.id);
        return {
          label: w?.product_title ?? 'Item',
          store: w?.store_name ?? null,
          url: w?.product_url ?? null,
          image: w?.product_image_url ?? null,
          price: w?.price ?? null,
        };
      } else {
        const w = wardrobe.find((w) => w.id === ref.id);
        return {
          label: w?.name ?? 'Wardrobe item',
          store: null,
          url: null,
          image: w?.image_url ?? null,
          price: null,
        };
      }
    });
    const firstWithUrl = outfitItems.find((i) => i.url);
    const res = await apiPost(tk, '/api/try-ons', {
      output_image_urls: results,
      product_title: outfitItems.map((i) => i.label).join(', '),
      product_url: firstWithUrl?.url ?? null,
      store_name: firstWithUrl?.store ?? null,
      outfit_items: outfitItems,
    });
    if (res.ok) { setSaved(true); chrome.storage.local.remove('fitsyou_canvas'); onTryOnSaved(); capture('tryon_saved'); }
    else setError(res.error ?? 'Save failed');
  }

  // Item card for the picker
  function ItemCard({ item, source }: { item: WishlistItem | WardrobeItem; source: 'wishlist' | 'wardrobe' }) {
    const ref: ItemRef = { source, id: item.id };
    const on = isSelected(ref);
    const imgSrc = source === 'wishlist' ? (item as WishlistItem).product_image_url : (item as WardrobeItem).image_url;
    const rawLabel = source === 'wishlist' ? (item as WishlistItem).product_title : (item as WardrobeItem).name;
    const label = rawLabel ? toSentenceCase(rawLabel) : rawLabel;
    const sub   = source === 'wishlist' ? (item as WishlistItem).store_name : (item as WardrobeItem).category;
    return (
      <button
        key={item.id}
        onClick={() => toggle(ref)}
        style={{
          width: '68px', flexShrink: 0, background: C.surface,
          border: `${on ? 1.5 : 0.5}px solid ${on ? C.pink : C.border}`,
          borderRadius: '0', overflow: 'hidden', cursor: 'pointer',
          textAlign: 'left', padding: 0, position: 'relative',
        }}
      >
        <AuthImg
          src={imgSrc} token={token} alt={label ?? 'Item'}
          style={{ width: '68px', height: '100px', objectFit: 'contain', background: C.bone, display: 'block' }}
        />
        {on && (
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: C.pink, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700,
          }}>✓</div>
        )}
        <div style={{ padding: '5px 6px 6px' }}>
          {sub && <StoreTag name={sub} />}
          <div style={{ fontSize: '10px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
            {label ?? 'Item'}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Photo consent modal */}
      {photoConsentShown && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(22,22,22,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ width: '320px', background: C.surface, padding: '20px', boxSizing: 'border-box', borderRadius: '0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink, marginBottom: '12px' }}>
              How we use your photo
            </div>
            <div style={{ fontSize: '12px', color: C.ink, opacity: 0.85, marginBottom: '14px', lineHeight: 1.6 }}>
              Your full-body photo is sent to <strong>OpenAI</strong> (US-based) to generate try-on images. Your photo is <strong>never</strong> used to train AI models — we have a contractual guarantee with OpenAI.
            </div>
            <div style={{ fontSize: '11px', color: C.muted, marginBottom: '14px', lineHeight: 1.5 }}>
              After setup, you can choose to anonymize your face in try-ons from your profile settings.
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={photoConsentPhotoAgreed}
                onChange={(e) => setPhotoConsentPhotoAgreed((e.target as HTMLInputElement).checked)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '11px', color: C.ink, lineHeight: 1.5 }}>
                I consent to fitsyou sending my photo to OpenAI for try-on generation. See{' '}
                <a
                  href="https://fitsyou.live/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: C.pinkDark, textDecoration: 'underline' }}
                >
                  Privacy Policy
                </a>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={photoConsentAgeAgreed}
                onChange={(e) => setPhotoConsentAgeAgreed((e.target as HTMLInputElement).checked)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span style={{ fontSize: '11px', color: C.ink, lineHeight: 1.5 }}>
                I confirm I am <strong>18 years of age or older</strong>
              </span>
            </label>
            <button
              onClick={handlePhotoConsentAccept}
              disabled={!photoConsentPhotoAgreed || !photoConsentAgeAgreed}
              style={{
                ...btnPink,
                opacity: (!photoConsentPhotoAgreed || !photoConsentAgeAgreed) ? 0.5 : 1,
                cursor: (!photoConsentPhotoAgreed || !photoConsentAgeAgreed) ? 'not-allowed' : 'pointer',
                padding: '10px 14px', fontSize: '11px', marginBottom: '8px',
              }}
            >
              Accept & continue
            </button>
            <button
              onClick={() => setPhotoConsentShown(false)}
              style={{ ...btnGhost, padding: '10px 14px', fontSize: '11px', color: C.ink, borderColor: C.border }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mirror */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.ink, fontFamily: MONO, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Mirror
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(selected.length > 0 || results.length > 0) && (
              <button
                onClick={clearCanvas}
                style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', fontFamily: MONO, fontSize: '10px', color: C.muted, textDecoration: 'underline' }}
              >
                Clear
              </button>
            )}
            <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>
              {selected.length} item{selected.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Big square canvas */}
        <div style={{
          position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden',
          background: 'linear-gradient(155deg, #EEF1EE 0%, #D8DEDB 52%, #9FA8A3 100%)',
          boxShadow: 'inset 0 0 48px rgba(22,22,22,0.06)',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* State: result, ready, or empty */}
            {phase === 'done' && results.length > 0 ? (
              results.length === 1 ? (
                <AuthImg
                  src={results[0]} token={token} alt="Generated outfit"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                  {results.map((url, i) => (
                    <AuthImg key={i} src={url} token={token} alt={`Look ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ))}
                </div>
              )
            ) : selected.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '0 28px' }}>
                <div style={{ fontSize: '40px', opacity: 0.5 }}>🪞</div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: C.slate, lineHeight: 1.5 }}>
                  Pick pieces from your wishlist or wardrobe to start building your look.
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '0 28px' }}>
                <div style={{ fontSize: '40px' }}>🎨</div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: C.slate, lineHeight: 1.5 }}>
                  Ready when you are — hit Generate to see it on you.
                </div>
              </div>
            )}

            {/* fitsyou watermark on result */}
            {phase === 'done' && results.length > 0 && (
              <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '11px', color: '#fff', opacity: 0.92, textShadow: '0 1px 3px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                <span style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.01em' }}>fits</span><em style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: C.pink, fontSize: '1.05em' }}>you</em>
              </div>
            )}

            {/* Selected chips overlay (while staging) */}
            {selected.length > 0 && !(phase === 'done' && results.length > 0) && phase !== 'generating' && (
              <div style={{ position: 'absolute', left: '8px', right: '8px', bottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selected.map((ref) => {
                  const item = ref.source === 'wishlist'
                    ? wishlist.find((w) => w.id === ref.id)
                    : wardrobe.find((w) => w.id === ref.id);
                  const rawLabel = item
                    ? (ref.source === 'wishlist' ? (item as WishlistItem).product_title : (item as WardrobeItem).name)
                    : null;
                  const label = rawLabel ? toSentenceCase(rawLabel) : (rawLabel ?? ref.id.slice(0, 6));
                  return (
                    <span
                      key={`${ref.source}:${ref.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 8px 3px 10px', borderRadius: '100px',
                        background: 'rgba(18,18,18,0.82)', color: C.bone,
                        fontSize: '11px', maxWidth: '150px',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label ?? 'Item'}</span>
                      <button
                        onClick={() => toggle(ref)}
                        style={{ background: 'none', border: 'none', padding: '0 0 0 2px', cursor: 'pointer', color: C.faint, fontSize: '13px', lineHeight: 1, flexShrink: 0 }}
                      >×</button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Generating progress overlay */}
            {phase === 'generating' && (
              <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: C.ink }}>Generating…</span>
                  <span style={{ fontFamily: MONO, fontSize: '10px', color: C.ink }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ background: 'rgba(18,18,18,0.18)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.pink, width: `${progress}%`, transition: 'width 0.3s ease', borderRadius: '4px' }} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '0', padding: '9px 12px', fontSize: '12px', lineHeight: 1.4 }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      {phase !== 'generating' && (
        <button
          onClick={phase === 'done' ? clearCanvas : generate}
          disabled={phase !== 'done' && selected.length === 0}
          style={{
            ...(phase === 'done' ? btnGhost : btnPink),
            opacity: (phase !== 'done' && selected.length === 0) ? 0.4 : 1,
            cursor: (phase !== 'done' && selected.length === 0) ? 'not-allowed' : 'pointer',
            color: phase === 'done' ? C.ink : undefined,
            borderColor: phase === 'done' ? C.border : undefined,
          }}
        >
          {phase === 'done' ? '✕ Clear Mirror' : '✦ Generate the look'}
        </button>
      )}

      {phase === 'done' && results.length > 0 && (
        <button
          onClick={saved ? undefined : saveToTryOns}
          disabled={saved}
          style={{
            ...btnGhost,
            color: saved ? '#166534' : C.pinkDark,
            borderColor: saved ? '#166534' : C.pink,
            opacity: saved ? 0.7 : 1,
          }}
        >
          {saved ? '✓ Saved to Try-ons' : '♡ Save to Try-ons'}
        </button>
      )}

      {/* Wishlist picker */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '8px' }}>
          From your wishlist
        </div>
        {wishlist.length === 0 ? (
          <div style={{ fontSize: '12px', color: C.muted }}>No wishlist items yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {wishlist.map((item) => <ItemCard key={item.id} item={item} source="wishlist" />)}
          </div>
        )}
      </div>

      {/* Wardrobe picker */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '8px' }}>
          From your wardrobe
        </div>
        {wardrobe.length === 0 ? (
          <div style={{ fontSize: '12px', color: C.muted }}>No wardrobe items yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {wardrobe.map((item) => <ItemCard key={item.id} item={item} source="wardrobe" />)}
          </div>
        )}
      </div>

      <button onClick={onOpenDashboard} style={{ ...btnGhost, marginTop: '4px' }}>
        Open full Fitting Room →
      </button>

    </div>
  );
}

// ─── Photo consent helper ─────────────────────────────────────────────────────
async function getPhotoConsent(): Promise<boolean> {
  return new Promise((resolve) =>
    chrome.storage.local.get(['fitsyou_photo_consent'], (items) =>
      resolve((items['fitsyou_photo_consent'] as boolean) ?? false)
    )
  );
}

async function setPhotoConsent(value: boolean): Promise<void> {
  return new Promise((resolve) =>
    chrome.storage.local.set({ fitsyou_photo_consent: value }, resolve)
  );
}

// ─── Analytics consent gate ───────────────────────────────────────────────────
// Mirrors the web app's cookie banner, but stored separately in
// chrome.storage.local since the extension is a different origin. PostHog is
// never initialized until the user explicitly accepts here.
const AnalyticsConsentContext = createContext<{ consent: boolean | null; resetConsent: () => void }>({
  consent: null,
  resetConsent: () => {},
});

function AnalyticsConsentGate({ children }: { children: preact.ComponentChildren }) {
  const [consent, setConsentState] = useState<boolean | null | 'loading'>('loading');

  useEffect(() => {
    getAnalyticsConsent().then((v) => {
      setConsentState(v);
      if (v === true) initAnalytics();
    });
  }, []);

  function decide(value: boolean) {
    setAnalyticsConsent(value).then(() => {
      setConsentState(value);
      if (value) initAnalytics();
    });
  }

  function resetConsent() {
    clearAnalyticsConsent().then(() => setConsentState(null));
  }

  if (consent === 'loading') return null;

  return (
    <AnalyticsConsentContext.Provider value={{ consent, resetConsent }}>
      {consent === null && (
        <div style={{ background: C.surface, borderBottom: `0.5px solid ${C.border}`, padding: '12px 14px', fontSize: '11px', color: C.ink, lineHeight: 1.5 }}>
          <div style={{ marginBottom: '8px' }}>
            fitsyou uses privacy-preserving analytics (PostHog) to understand how the extension is used. No photos or browsing history are included.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => decide(true)} style={{ ...btnPink, flex: 1, padding: '8px 10px', fontSize: '10px' }}>Accept analytics</button>
            <button onClick={() => decide(false)} style={{ ...btnGhost, flex: 1, padding: '8px 10px', fontSize: '10px' }}>Essential only</button>
          </div>
        </div>
      )}
      {children}
    </AnalyticsConsentContext.Provider>
  );
}

// ─── Main popup ───────────────────────────────────────────────────────────────
function Popup() {
  const { resetConsent: resetAnalyticsConsent } = useContext(AnalyticsConsentContext);
  const [status, setStatus]           = useState<PopupState>('checking');
  const [tab, setTab]                 = useState<TabKey>('wishlist');
  const [token, setToken]             = useState('');
  const [triesLeft, setTriesLeft]     = useState<number | null>(null);
  const [userEmail, setUserEmail]     = useState('');
  const [userFaceUrl, setUserFaceUrl] = useState<string | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  // Lists
  const [wishlist, setWishlist]       = useState<WishlistItem[]>([]);
  const [wardrobe, setWardrobe]       = useState<WardrobeItem[]>([]);
  const [tryOns, setTryOns]           = useState<TryOnItem[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  // Action bar state (save-to-wishlist)
  const [saveState, setSaveState]     = useState<'idle' | 'working'>('idle');
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error'; persistent?: boolean } | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState('');

  // Try-on lightbox
  const [lightbox, setLightbox] = useState<{ src: string; token: string } | null>(null);

  // Confirm dialog for poor-fit wishlist saves
  const [fitConfirm, setFitConfirm] = useState<{ ext: ExtractResult; tabUrl: string; tk: string; fitResult: FitResult } | null>(null);

  // Back-to-top
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const onScroll = () => setShowBackToTop(el.scrollTop > 60);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [status]); // re-attach when idle panel mounts

  // Reset scroll + button when tab changes
  useEffect(() => {
    setShowBackToTop(false);
    tabScrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  // Wardrobe upload state
  const [wardrobeUploading, setWardrobeUploading]         = useState(false);
  const [wardrobeBulkProgress, setWardrobeBulkProgress]   = useState<{ current: number; total: number } | null>(null);
  const wardrobeSingleInput = useRef<HTMLInputElement>(null);
  const wardrobeBulkInput   = useRef<HTMLInputElement>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success', persistent = false) {
    setToast({ msg, type, persistent });
    if (!persistent) setTimeout(() => setToast(null), 3000);
  }

  async function checkAuth() {
    const tk = await getToken();
    if (!tk) { setStatus('signed-out'); return; }
    setToken(tk);
    try {
      const r = await authedFetch(tk, '/api/user/profile');
      if (r.status === 401) {
        await clearTokens();
        setStatus('signed-out'); return;
      }
      const profile: Profile | null = await r.json();
      if (profile?.try_on_count_this_month !== undefined) {
        const tier = profile.subscription_tier ?? 'free';
        setSubscriptionTier(tier);
        const limit = TIER_LIMITS[tier] ?? 5;
        setTriesLeft(Math.max(0, limit - (profile.try_on_count_this_month ?? 0)));
      }
      if (profile?.email) { setUserEmail(profile.email); identifyUser(profile.email); }
      if (profile?.face_url !== undefined) setUserFaceUrl(profile.face_url ?? null);
      if (profile?.photo_url !== undefined) setUserPhotoUrl(profile.photo_url ?? null);
      const isReady = !!profile?.photo_url;
      setStatus(isReady ? 'idle' : 'needs-setup');

      // Phone home on first idle — marks the "Install extension" checklist step on the web app
      if (isReady && profile?.extension_installed === false) {
        fetch(`${API_BASE}/api/user/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
          body: JSON.stringify({ extension_installed: true }),
        }).catch(() => {});
      }
    } catch { setStatus('signed-out'); }
  }

  useEffect(() => {
    checkAuth();
    const onChange = (changes: { [k: string]: chrome.storage.StorageChange }) => {
      if ('fitsyou_token' in changes) checkAuth();
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const panelOpenedRef = useRef(false);
  useEffect(() => {
    if (status === 'idle' && !panelOpenedRef.current) {
      panelOpenedRef.current = true;
      capture('sidepanel_opened');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'idle' && token && !listsLoaded) loadLists(token);
  }, [status, token, listsLoaded]);

  async function loadLists(tk: string) {
    const [w, c, to] = await Promise.all([
      apiGet<WishlistItem>(tk, '/api/wishlist'),
      apiGet<WardrobeItem>(tk, '/api/wardrobe'),
      apiGet<TryOnItem>(tk, '/api/try-ons'),
    ]);
    setWishlist(w);
    setWardrobe(c);
    setTryOns(to);
    setListsLoaded(true);
  }

  function openTab(path: string) {
    const url = new URL(`${API_BASE}${path}`);
    url.searchParams.set('extensionId', chrome.runtime.id);
    chrome.tabs.create({ url: url.toString() });
  }

  async function extractProduct(): Promise<{ result: ExtractResult | null; tabUrl: string }> {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = t?.url ?? '';
    setCurrentTabUrl(tabUrl);
    if (!t?.id) return { result: null, tabUrl };
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(t.id!, { type: 'EXTRACT_PRODUCT' }, (r: ExtractResult | undefined) => {
        if (chrome.runtime.lastError || !r) { resolve({ result: null, tabUrl }); return; }
        resolve({ result: r, tabUrl });
      });
    });
  }

  // ── Save this item (action bar) ───────────────────────────────────────────
  async function handleSaveItem() {
    if (saveState === 'working') return;
    setSaveState('working');

    const { result: ext, tabUrl } = await extractProduct();
    if (!ext) {
      setSaveState('idle');
      if (!isRetailerUrl(tabUrl)) {
        showToast('fitsyou works on fashion sites: Zara, ASOS, H&M, Zalando & Mango. Visit a product page to add items.', 'error');
      } else {
        showToast('Refresh the page, then try again.', 'error');
      }
      return;
    }
    if (!ext.success || !ext.imageUrl) {
      setSaveState('idle');
      setStatus('manual');
      return;
    }

    const tk = (await getToken()) ?? token;
    if (!tk) { setSaveState('idle'); setStatus('signed-out'); return; }

    // Fit check (free, no credit)
    let fitResult: FitResult | null = null;
    try {
      const fr = await authedFetch(tk, '/api/fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_title: ext.productTitle ?? null,
          size_chart_text: ext.sizeChartText,
          available_sizes: ext.availableSizes,
          selected_size: ext.selectedSize,
        }),
      });
      if (fr.ok) fitResult = await fr.json() as FitResult;
    } catch { /* non-blocking */ }

    // Sizing explicitly doesn't match — confirm with the user before saving
    if (fitResult?.verdict === 'poor') {
      setSaveState('idle');
      setFitConfirm({ ext, tabUrl, tk, fitResult });
      return;
    }

    await saveWishlistItem(ext, tabUrl, tk, fitResult);
  }

  async function saveWishlistItem(ext: ExtractResult, tabUrl: string, tk: string, fitResult: FitResult | null) {
    setSaveState('working');
    const normalizedTitle = ext.productTitle ? toSentenceCase(ext.productTitle) : null;
    const res = await apiPost(tk, '/api/wishlist', {
      product_url: tabUrl,
      product_image_url: ext.imageUrl,
      product_title: normalizedTitle,
      store_name: storeName(tabUrl),
      price: ext.price ?? null,
      available_sizes: ext.availableSizes,
      fit_verdict: fitResult?.verdict ?? null,
      recommended_size: fitResult?.recommended_size ?? null,
    });

    setSaveState('idle');
    if (!res.ok) {
      showToast(res.error ?? 'Save failed', 'error', res.code === 'gender_conflict');
      return;
    }

    const name = normalizedTitle ? `"${normalizedTitle}"` : 'Item';
    const fitMsg = fitResult && fitResult.verdict !== 'unknown' ? ` · ${FIT_BADGE[fitResult.verdict].label}` : '';
    showToast(`${name} saved${fitMsg} — close & keep browsing`);
    capture('wishlist_item_saved', { store: storeName(tabUrl), fit_verdict: fitResult?.verdict ?? null });
    setListsLoaded(false);
    setTab('wishlist');
  }

  // ── Delete wishlist item ─────────────────────────────────────────────────
  async function handleWishlistDelete(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (!confirm('Remove this item from your wishlist?')) return;
    const tk = (await getToken()) ?? token;
    if (!tk) return;
    const res = await authedFetch(tk, `/api/wishlist/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setWishlist((prev) => prev.filter((w) => w.id !== id));
    } else {
      showToast('Could not remove item', 'error');
    }
  }

  // ── Manual upload fallback ────────────────────────────────────────────────
  async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }

    const form = new FormData();
    form.append('file', file);
    try {
      const up = await authedFetch(tk, '/api/upload-product-image', { method: 'POST', body: form });
      if (!up.ok) throw new Error();
      const { url } = (await up.json()) as { url: string };
      const pUrl = currentTabUrl || `manual-upload-${Date.now()}`;
      const res = await apiPost(tk, '/api/wishlist', {
        product_url: pUrl, product_image_url: url,
        store_name: currentTabUrl ? storeName(currentTabUrl) : undefined,
      });
      if (!res.ok) { showToast(res.error ?? 'Save failed', 'error'); }
      else { showToast('Item saved to wishlist'); setListsLoaded(false); setTab('wishlist'); }
    } catch { showToast('Failed to upload image', 'error'); }
    setStatus('idle');
  }

  // ── Wardrobe upload helpers ───────────────────────────────────────────────
  async function uploadWardrobeFile(tk: string, file: File): Promise<{ ok: true; item: WardrobeItem } | { ok: false; error: string; code: 'duplicate' | 'too_large' | 'failed' }> {
    if (file.size > 4 * 1024 * 1024) {
      return { ok: false, error: `"${file.name}" exceeds 4 MB — try a smaller image.`, code: 'too_large' };
    }
    const form = new FormData();
    form.append('image', file);
    try {
      const r = await authedFetch(tk, '/api/wardrobe', { method: 'POST', body: form });
      const data = await r.json().catch(() => ({})) as { item?: WardrobeItem; error?: string };
      if (!r.ok) {
        const msg = data.error ?? `Error ${r.status}`;
        return { ok: false, error: msg, code: r.status === 409 ? 'duplicate' : r.status === 413 ? 'too_large' : 'failed' };
      }
      return { ok: true, item: data.item! };
    } catch {
      return { ok: false, error: 'Network error — please try again.', code: 'failed' };
    }
  }

  async function handleWardrobeSingle(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }
    setWardrobeUploading(true);
    const result = await uploadWardrobeFile(tk, file);
    setWardrobeUploading(false);
    if (wardrobeSingleInput.current) wardrobeSingleInput.current.value = '';
    if (result.ok) {
      setWardrobe((prev) => [result.item, ...prev]);
      showToast(`${result.item.name ?? 'Item'} added to wardrobe`);
    } else {
      showToast(result.error, 'error');
    }
  }

  async function handleWardrobeBulk(files: FileList | null) {
    if (!files || files.length === 0) return;
    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }
    const arr = Array.from(files);
    setWardrobeUploading(true);
    setWardrobeBulkProgress({ current: 0, total: arr.length });
    let added = 0; let skipped = 0; let failed = 0;
    for (let i = 0; i < arr.length; i++) {
      setWardrobeBulkProgress({ current: i + 1, total: arr.length });
      const result = await uploadWardrobeFile(tk, arr[i]);
      if (result.ok) { setWardrobe((prev) => [result.item, ...prev]); added++; }
      else if (result.code === 'duplicate') skipped++;
      else failed++;
    }
    setWardrobeUploading(false);
    setWardrobeBulkProgress(null);
    if (wardrobeBulkInput.current) wardrobeBulkInput.current.value = '';

    if (!skipped && !failed) {
      showToast(`${added} item${added !== 1 ? 's' : ''} added to wardrobe`);
    } else if (added === 0 && failed === 0) {
      showToast(arr.length === 1 ? 'Already in your wardrobe' : `All ${arr.length} already in your wardrobe`, 'error');
    } else {
      const parts: string[] = [];
      if (skipped) parts.push(`${skipped} duplicate${skipped !== 1 ? 's' : ''}`);
      if (failed) parts.push(`${failed} failed`);
      showToast(`${added} of ${arr.length} added — ${parts.join(' · ')}`, added > 0 ? 'success' : 'error');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '360px', fontFamily: SANS, background: C.bone, color: C.ink, position: 'relative' }}>

      {/* ── Try-on lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(22,22,22,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '320px', maxHeight: '320px' }}
          >
            <AuthImg
              src={lightbox.src} token={lightbox.token} alt="Try-on"
              style={{ width: '320px', height: '320px', objectFit: 'contain', display: 'block' }}
            />
            {/* Watermark */}
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '13px', color: '#fff', opacity: 0.95, textShadow: '0 1px 4px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
              <span style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.01em' }}>fits</span><em style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: C.pink, fontSize: '1.1em' }}>you</em>
            </div>
            {/* Close button */}
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: '-12px', right: '-12px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: C.ink, color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '16px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>
      )}

      {/* ── Poor-fit confirm dialog ── */}
      {fitConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(22,22,22,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ width: '300px', background: C.bone, padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink, marginBottom: '8px' }}>
              {FIT_BADGE.poor.label}
            </div>
            <div style={{ fontSize: '12px', color: C.ink, opacity: 0.85, marginBottom: '16px', lineHeight: 1.5 }}>
              {fitConfirm.fitResult.reason || 'This size doesn’t match your measurements.'} Add it to your wishlist anyway?
            </div>
            <button
              style={btnPink}
              onClick={() => {
                const { ext, tabUrl, tk, fitResult } = fitConfirm;
                setFitConfirm(null);
                saveWishlistItem(ext, tabUrl, tk, fitResult);
              }}
            >Add anyway</button>
            <button
              style={{ ...btnGhost, marginTop: '8px' }}
              onClick={() => setFitConfirm(null)}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.ink, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '22px', lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>fits</span><em style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: C.pink, fontSize: '1.05em' }}>you</em>
        </div>
        <button
          onClick={() => window.close()}
          title="Close"
          style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: C.muted, fontSize: '18px', lineHeight: 1 }}
        >×</button>
      </div>

      {/* User identity bar — shown when signed in */}
      {status === 'idle' && (
        <div style={{ background: C.ink, borderTop: `0.5px solid rgba(255,255,255,0.08)`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(userFaceUrl ?? userPhotoUrl) ? (
            <AuthImg
              src={userFaceUrl ?? userPhotoUrl} token={token} alt="You"
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          )}
          <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {userEmail}
          </div>
          <button
            onClick={resetAnalyticsConsent}
            title="Change analytics preference"
            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: C.muted, fontSize: '12px', lineHeight: 1, flexShrink: 0 }}
          >🍪</button>
          <div style={{
            fontFamily: MONO, fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: '100px', flexShrink: 0,
            background: subscriptionTier === 'free' ? 'rgba(255,255,255,0.08)' : C.pink,
            color: subscriptionTier === 'free' ? C.muted : C.surface,
          }}>
            {subscriptionTier}
          </div>
          {triesLeft !== null && (
            <div style={{ fontFamily: MONO, fontSize: '10px', color: C.pink, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
              {triesLeft} tries left
            </div>
          )}
        </div>
      )}

      {/* ── Auth screens ── */}
      {status === 'checking' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Spinner size={28} />
        </div>
      )}

      {status === 'signed-out' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: '22px', marginBottom: '8px' }}>
            Try clothes on<br />before you buy
          </div>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '20px', lineHeight: 1.5 }}>
            Create a free account on fitsyou.live first, then come back to use the extension.
          </p>
          <button onClick={() => openTab('/auth/extension')} style={btnPink}>Create free account</button>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '10px', lineHeight: 1.4 }}>
            Already have an account?{' '}
            <button
              onClick={() => openTab('/auth/extension')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.pinkDark, fontFamily: SANS, fontSize: '11px', textDecoration: 'underline' }}
            >
              Sign in →
            </button>
          </p>
        </div>
      )}

      {status === 'needs-setup' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: '20px', marginBottom: '8px' }}>Almost ready</div>
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '20px', lineHeight: 1.5 }}>
            Upload your photo once and start trying on clothes from any store.
          </p>
          <button onClick={() => openTab('/onboarding/photo')} style={btnPink}>Complete setup</button>
        </div>
      )}

      {/* ── Manual upload ── */}
      {status === 'manual' && (
        <div style={{ padding: '16px' }}>
          <div style={{ background: C.surface, borderRadius: '0', padding: '14px', marginBottom: '12px', border: `0.5px solid ${C.border}` }}>
            <div style={{ fontFamily: SERIF, fontSize: '16px', marginBottom: '5px' }}>Can't detect image</div>
            <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>Screenshot the item and upload it to add it to your wishlist.</p>
          </div>
          <label style={{ display: 'block', border: `1.5px dashed ${C.pink}`, borderRadius: '0', padding: '18px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>📷</div>
            <div style={{ fontSize: '12px', color: C.pinkDark, fontWeight: 600 }}>Tap to upload screenshot</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setStatus('idle')} style={btnInk}>← Back</button>
        </div>
      )}

      {/* ── Main UI ── */}
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '520px', position: 'relative' }}>
          {/* Action bar */}
          <div style={{ background: C.ink, borderBottom: `0.5px solid rgba(255,255,255,0.08)`, padding: '10px 16px' }}>
            <button
              onClick={handleSaveItem}
              disabled={saveState === 'working'}
              style={{
                width: '100%', padding: '9px 14px',
                background: saveState === 'working' ? 'rgba(255,255,255,0.08)' : C.pink,
                color: '#fff', border: 'none', borderRadius: 0,
                fontSize: '11px', fontWeight: 700, cursor: saveState === 'working' ? 'default' : 'pointer',
                fontFamily: SANS, letterSpacing: '0.14em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {saveState === 'working' ? (
                <><Spinner size={14} /> Saving…</>
              ) : (
                '+ Save this item to wishlist'
              )}
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div style={{ padding: '8px 16px 0' }}>
              <Toast msg={toast.msg} type={toast.type} onDismiss={toast.persistent ? () => setToast(null) : undefined} />
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            {(['wishlist', 'fitting-room', 'wardrobe', 'tryons'] as TabKey[]).map((k) => {
              const labels: Record<TabKey, string> = {
                tryons:         tryOns.length  ? `Try-ons (${tryOns.length})` : 'Try-ons',
                wishlist:       wishlist.length ? `Wishlist (${wishlist.length})` : 'Wishlist',
                wardrobe:       wardrobe.length ? `Wardrobe (${wardrobe.length})` : 'Wardrobe',
                'fitting-room': 'Fitting Room',
              };
              const active = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} style={{
                  flex: 1, padding: '9px 4px',
                  fontSize: '9px', fontWeight: active ? 600 : 400,
                  color: active ? C.pink : C.muted,
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${active ? C.pink : 'transparent'}`,
                  marginBottom: '-1px', cursor: 'pointer',
                  fontFamily: MONO, letterSpacing: '0.04em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {labels[k]}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div
            ref={tabScrollRef}
            style={{ padding: '14px 16px 16px', flex: 1, overflowY: 'auto', minHeight: 0 }}
          >

            {/* ── Try-ons tab ── */}
            {tab === 'tryons' && (
              !listsLoaded ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              ) : tryOns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👗</div>
                  <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>No try-ons yet</div>
                  <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>
                    Build an outfit in the Fitting Room to see it here.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {tryOns.slice(0, 8).map((item) => (
                      <div key={item.id} style={{ background: C.surface, borderRadius: '0', border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
                        {item.output_image_urls?.[0] ? (
                          <button
                            onClick={() => setLightbox({ src: item.output_image_urls[0], token })}
                            style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in' }}
                          >
                            <div style={{ position: 'relative', paddingBottom: '100%', height: 0, overflow: 'hidden' }}>
                              <AuthImg
                                src={item.output_image_urls[0]} token={token}
                                alt={item.product_title ?? 'Try-on'}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', objectFit: 'cover', display: 'block' }}
                              />
                              <div style={{ position: 'absolute', bottom: '5px', right: '7px', fontSize: '9px', color: '#fff', opacity: 0.9, display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                                <span style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.01em' }}>fits</span><em style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, color: C.pink, fontSize: '1.05em' }}>you</em>
                              </div>
                            </div>
                          </button>
                        ) : (
                          <div style={{ paddingBottom: '100%', background: C.bone }} />
                        )}
                        {(() => {
                          const seen = new Set<string>();
                          const hosts = (item.outfit_items ?? [])
                            .filter(oi => oi.url)
                            .map(oi => { try { return new URL(oi.url!).hostname; } catch { return null; } })
                            .filter((h): h is string => !!h && !seen.has(h) && !!seen.add(h))
                            .slice(0, 5);
                          return hosts.length ? (
                            <div style={{ padding: '5px 6px 7px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {hosts.map((host, i) => (
                                <img
                                  key={i}
                                  src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt=""
                                  style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }}
                                />
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => openTab('/dashboard?tab=tryons')} style={{ ...btnGhost, marginTop: '12px', width: '100%' }}>
                    View all on dashboard →
                  </button>
                </div>
              )
            )}

            {/* ── Wishlist tab ── */}
            {tab === 'wishlist' && (
              !listsLoaded ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              ) : wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>♡</div>
                  <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>Nothing saved yet</div>
                  <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>
                    Browse a fashion store and hit "Save this item to wishlist" above.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => item.product_url && chrome.tabs.create({ url: item.product_url })}
                      style={{ background: C.surface, borderRadius: '0', padding: '10px', border: `0.5px solid ${C.border}`, display: 'flex', gap: '10px', alignItems: 'center', cursor: item.product_url ? 'pointer' : 'default' }}
                    >
                      <AuthImg
                        src={item.product_image_url} token={token} alt={item.product_title ?? 'Item'}
                        style={{ width: '56px', height: '80px', borderRadius: '0', objectFit: 'contain', background: C.bone, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.product_url && (
                          <img
                            src={faviconUrl(item.product_url)} alt={item.store_name ?? ''}
                            style={{ width: '16px', height: '16px', objectFit: 'contain', display: 'block', marginBottom: '3px' }}
                          />
                        )}
                        <div style={{ fontSize: '12px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                          {item.product_title ? toSentenceCase(item.product_title) : 'Untitled item'}
                        </div>
                        {item.price && (
                          <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{item.price}</div>
                        )}
                        {item.fit_verdict && item.fit_verdict !== 'unknown' && (
                          <div style={{ fontSize: '10px', color: (FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).fg, marginTop: '2px' }}>
                            {(FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).label}
                            {item.recommended_size ? ` · ${item.recommended_size}` : ''}
                          </div>
                        )}
                        {item.product_url && (
                          <div style={{ fontSize: '10px', color: C.faint, marginTop: '2px' }}>Tap to open →</div>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleWishlistDelete(item.id, e as unknown as MouseEvent)}
                        title="Remove"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.faint, fontSize: '14px', lineHeight: 1, padding: '4px', flexShrink: 0, alignSelf: 'flex-start' }}
                      >✕</button>
                    </div>
                  ))}
                  <button onClick={() => setTab('fitting-room')} style={{ ...btnPink, marginTop: '4px' }}>
                    Build an outfit in Fitting Room →
                  </button>
                </div>
              )
            )}

            {/* ── Wardrobe tab ── */}
            {tab === 'wardrobe' && (
              !listsLoaded ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              ) : (
                <div>
                  {/* Upload row — always visible */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      disabled={wardrobeUploading}
                      onClick={() => wardrobeSingleInput.current?.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '5px', padding: '12px 8px',
                        border: `1.5px dashed ${C.border}`, background: wardrobeUploading && !wardrobeBulkProgress ? C.stone : C.surface,
                        cursor: wardrobeUploading ? 'default' : 'pointer', opacity: wardrobeUploading ? 0.7 : 1,
                      }}
                    >
                      {wardrobeUploading && !wardrobeBulkProgress ? (
                        <>
                          <Spinner size={16} />
                          <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>Analysing…</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: C.muted }}><UploadSvg /></span>
                          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 600, color: C.ink, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Single Upload</span>
                          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.muted }}>one photo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={wardrobeUploading}
                      onClick={() => wardrobeBulkInput.current?.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '5px', padding: '12px 8px',
                        border: `1.5px dashed ${C.border}`, background: wardrobeBulkProgress ? C.stone : C.surface,
                        cursor: wardrobeUploading ? 'default' : 'pointer', opacity: wardrobeUploading ? 0.7 : 1,
                      }}
                    >
                      {wardrobeBulkProgress ? (
                        <>
                          <Spinner size={16} />
                          <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>{wardrobeBulkProgress.current} / {wardrobeBulkProgress.total}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: C.muted }}><BulkUploadSvg /></span>
                          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 600, color: C.ink, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bulk Upload</span>
                          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.muted }}>multiple photos</span>
                        </>
                      )}
                    </button>

                    <input
                      ref={wardrobeSingleInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => handleWardrobeSingle((e.target as HTMLInputElement).files)}
                    />
                    <input
                      ref={wardrobeBulkInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleWardrobeBulk((e.target as HTMLInputElement).files)}
                    />
                  </div>

                  {wardrobe.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>👕</div>
                      <div style={{ fontFamily: SERIF, fontSize: '15px', marginBottom: '4px' }}>No wardrobe items yet</div>
                      <p style={{ fontSize: '11px', color: C.muted, lineHeight: 1.5, marginBottom: '12px' }}>
                        Upload photos of clothes you own — mix them with wishlist items in the Fitting Room.
                      </p>
                      <button onClick={() => openTab('/dashboard?tab=wardrobe')} style={{ ...btnGhost, fontSize: '10px' }}>Open on dashboard →</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {wardrobe.map((item) => (
                          <div key={item.id} style={{ background: C.surface, borderRadius: '0', border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
                            <AuthImg
                              src={item.image_url} token={token} alt={item.name ?? 'Item'}
                              style={{ width: '100%', height: '110px', objectFit: 'contain', background: C.bone, display: 'block' }}
                            />
                            <div style={{ padding: '6px 8px 8px' }}>
                              {item.category && <StoreTag name={item.category} />}
                              <div style={{ fontSize: '11px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                {item.name ?? 'Untitled'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setTab('fitting-room')} style={{ ...btnGhost, marginTop: '12px', width: '100%' }}>
                        Go to Fitting Room →
                      </button>
                    </>
                  )}
                </div>
              )
            )}

            {/* ── Fitting Room tab ── */}
            <div style={{ display: tab === 'fitting-room' ? 'block' : 'none' }}>
              {!listsLoaded ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              ) : (
                <FittingRoom
                  wishlist={wishlist}
                  wardrobe={wardrobe}
                  token={token}
                  onOpenDashboard={() => openTab('/dashboard?tab=fitting-room')}
                  onTryOnSaved={() => setListsLoaded(false)}
                />
              )}
            </div>


          </div>

          {/* Back to top — outside scroll container, absolute to the idle panel */}
          {showBackToTop && tab !== 'fitting-room' && (
            <button
              onClick={() => tabScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                position: 'absolute', bottom: '18px', right: '18px',
                width: '30px', height: '30px', borderRadius: '50%',
                background: C.ink, color: '#fff', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
                zIndex: 200, pointerEvents: 'auto',
                animation: 'fadeSlideUp 0.18s ease both',
              }}
              title="Back to top"
            >↑</button>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const btnPink: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 16px',
  background: C.pink, color: '#fff', border: 'none', borderRadius: 0,
  fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
  letterSpacing: '0.14em', textTransform: 'uppercase',
};

const btnInk: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 16px',
  background: C.ink, color: '#fff', border: 'none', borderRadius: 0,
  fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: SANS,
  letterSpacing: '0.14em', textTransform: 'uppercase',
};

const btnGhost: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 16px',
  background: 'transparent', color: C.berry,
  border: `1px solid ${C.pink}`, borderRadius: 0,
  fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
  letterSpacing: '0.10em', textTransform: 'uppercase',
};

render(
  <AnalyticsConsentGate>
    <Popup />
  </AnalyticsConsentGate>,
  document.getElementById('app')!
);
