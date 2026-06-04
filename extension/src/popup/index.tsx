import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const API_BASE = 'https://fitsyou-web.vercel.app';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  pink:      '#FF2E88',
  pinkDark:  '#D1246E',
  pinkLight: '#FFE0ED',
  ink:       '#121212',
  bone:      '#F5F2EC',
  surface:   '#FFFFFF',
  muted:     '#9A9690',
  faint:     '#C4C0BA',
  border:    'rgba(18,18,18,0.10)',
};
const SERIF = "'Playfair Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";
const MONO  = "'DM Mono', monospace";

// ─── Types ────────────────────────────────────────────────────────────────────
type PopupState = 'checking' | 'signed-out' | 'needs-setup' | 'idle' | 'manual';
type TabKey = 'tryons' | 'wishlist' | 'wardrobe' | 'fitting-room';

interface ExtractResult {
  success: boolean;
  imageUrl?: string;
  productTitle?: string;
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
  fit_verdict: FitVerdict | null;
  recommended_size: string | null;
}

interface WardrobeItem {
  id: string;
  name: string | null;
  category: string | null;
  image_url: string;
}

interface TryOnItem {
  id: string;
  product_title: string | null;
  store_name: string | null;
  product_image_url: string | null;
  output_image_urls: string[];
  created_at: string;
}

interface ItemRef { source: 'wishlist' | 'wardrobe'; id: string; }

// ─── Utilities ───────────────────────────────────────────────────────────────
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

async function apiGet<T>(token: string, path: string): Promise<T[]> {
  try {
    const r = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return [];
    const j = (await r.json()) as { items?: T[] };
    return j.items ?? [];
  } catch { return []; }
}

async function apiPost(token: string, path: string, body: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (data as { error?: string }).error ?? `Error ${r.status}` };
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
function AuthImg({ src, token, alt, style }: { src: string | null; token: string; alt: string; style: preact.JSX.CSSProperties }) {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    if (!src) { setResolved(null); return; }
    const key = authKeyFor(src);
    if (!key) { setResolved(src); return; }
    fetch(`${API_BASE}/api/image?key=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } })
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

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      background: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#166534' : '#991b1b',
      borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
      fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      {type === 'success' ? '✓' : '!'} {msg}
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

  async function generate() {
    if (selected.length === 0) return;
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
        };
      } else {
        const w = wardrobe.find((w) => w.id === ref.id);
        return {
          label: w?.name ?? 'Wardrobe item',
          store: null,
          url: null,
          image: w?.image_url ?? null,
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
    if (res.ok) { setSaved(true); chrome.storage.local.remove('fitsyou_canvas'); onTryOnSaved(); }
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
          width: '80px', flexShrink: 0, background: C.surface,
          border: `${on ? 1.5 : 0.5}px solid ${on ? C.pink : C.border}`,
          borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
          textAlign: 'left', padding: 0, position: 'relative',
        }}
      >
        <AuthImg
          src={imgSrc} token={token} alt={label ?? 'Item'}
          style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block' }}
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

      {/* Canvas */}
      <div style={{
        background: 'linear-gradient(135deg, #f3ece2 0%, #e8dccb 50%, #d9c8b0 100%)',
        borderRadius: '14px', padding: '14px', minHeight: '80px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.ink, fontFamily: MONO, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Canvas
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

        {selected.length === 0 ? (
          <div style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5, textAlign: 'center', padding: '8px 0' }}>
            Pick pieces from your wishlist and wardrobe below to build a look
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                    background: 'rgba(18,18,18,0.72)', color: C.bone,
                    fontSize: '11px', maxWidth: '130px',
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

        {/* Generating progress */}
        {phase === 'generating' && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>Generating…</span>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: C.muted }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ background: 'rgba(18,18,18,0.15)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: C.pink, width: `${progress}%`, transition: 'width 0.3s ease', borderRadius: '4px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Result images */}
      {phase === 'done' && results.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: results.length === 1 ? '1fr' : '1fr 1fr',
          gap: '6px',
        }}>
          {results.map((url, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
              <AuthImg
                src={url} token={token} alt={`Look ${i + 1}`}
                style={{ width: '100%', height: results.length === 1 ? '260px' : '160px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontFamily: SERIF, fontSize: '11px', color: C.surface, opacity: 0.92, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', lineHeight: 1.4 }}>
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
          {phase === 'done' ? '✕ Clear Canvas' : '✦ Generate the look'}
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

      <button onClick={onOpenDashboard} style={{ ...btnGhost, marginTop: '-4px' }}>
        Open full Fitting Room →
      </button>

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
      <div style={{ marginBottom: '8px' }}>
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

    </div>
  );
}

// ─── Main popup ───────────────────────────────────────────────────────────────
function Popup() {
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
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState('');

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function checkAuth() {
    const tk = await getToken();
    if (!tk) { setStatus('signed-out'); return; }
    setToken(tk);
    try {
      const r = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${tk}` } });
      if (r.status === 401) {
        chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token']);
        setStatus('signed-out'); return;
      }
      const profile: Profile | null = await r.json();
      if (profile?.try_on_count_this_month !== undefined) {
        const tier = profile.subscription_tier ?? 'free';
        setSubscriptionTier(tier);
        const limit = TIER_LIMITS[tier] ?? 5;
        setTriesLeft(Math.max(0, limit - (profile.try_on_count_this_month ?? 0)));
      }
      if (profile?.email) setUserEmail(profile.email);
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
      const fr = await fetch(`${API_BASE}/api/fit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
        body: JSON.stringify({
          product_title: ext.productTitle ?? null,
          size_chart_text: ext.sizeChartText,
          available_sizes: ext.availableSizes,
          selected_size: ext.selectedSize,
        }),
      });
      if (fr.ok) fitResult = await fr.json() as FitResult;
    } catch { /* non-blocking */ }

    const normalizedTitle = ext.productTitle ? toSentenceCase(ext.productTitle) : null;
    const res = await apiPost(tk, '/api/wishlist', {
      product_url: tabUrl,
      product_image_url: ext.imageUrl,
      product_title: normalizedTitle,
      store_name: storeName(tabUrl),
      available_sizes: ext.availableSizes,
      fit_verdict: fitResult?.verdict ?? null,
      recommended_size: fitResult?.recommended_size ?? null,
    });

    setSaveState('idle');
    if (!res.ok) { showToast(res.error ?? 'Save failed', 'error'); return; }

    const name = normalizedTitle ? `"${normalizedTitle}"` : 'Item';
    const fitMsg = fitResult && fitResult.verdict !== 'unknown' ? ` · ${FIT_BADGE[fitResult.verdict].label}` : '';
    showToast(`${name} saved${fitMsg} — close & keep browsing`);
    setListsLoaded(false);
    setTab('wishlist');
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
      const up = await fetch(`${API_BASE}/api/upload-product-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${tk}` }, body: form,
      });
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '360px', fontFamily: SANS, background: C.bone, color: C.ink }}>

      {/* Header */}
      <div style={{ background: C.ink, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: SERIF, fontSize: '22px', color: C.bone, lineHeight: 1 }}>
          fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
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
          <div style={{
            fontFamily: MONO, fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
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
          <div style={{ background: C.surface, borderRadius: '10px', padding: '14px', marginBottom: '12px', border: `0.5px solid ${C.border}` }}>
            <div style={{ fontFamily: SERIF, fontSize: '16px', marginBottom: '5px' }}>Can't detect image</div>
            <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>Screenshot the item and upload it to add it to your wishlist.</p>
          </div>
          <label style={{ display: 'block', border: `1.5px dashed ${C.pink}`, borderRadius: '10px', padding: '18px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>📷</div>
            <div style={{ fontSize: '12px', color: C.pinkDark, fontWeight: 600 }}>Tap to upload screenshot</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setStatus('idle')} style={btnInk}>← Back</button>
        </div>
      )}

      {/* ── Main UI ── */}
      {status === 'idle' && (
        <div>
          {/* Action bar */}
          <div style={{ background: C.ink, borderBottom: `0.5px solid rgba(255,255,255,0.08)`, padding: '10px 16px' }}>
            <button
              onClick={handleSaveItem}
              disabled={saveState === 'working'}
              style={{
                width: '100%', padding: '9px 14px',
                background: saveState === 'working' ? 'rgba(255,255,255,0.08)' : C.pink,
                color: C.surface, border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, cursor: saveState === 'working' ? 'default' : 'pointer',
                fontFamily: SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
              <Toast msg={toast.msg} type={toast.type} />
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
          <div style={{ padding: '14px 16px 16px', maxHeight: '480px', overflowY: 'auto' }}>

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
                      <div key={item.id} style={{ background: C.surface, borderRadius: '10px', border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
                        {item.output_image_urls?.[0] ? (
                          <div style={{ position: 'relative' }}>
                            <AuthImg
                              src={item.output_image_urls[0]} token={token}
                              alt={item.product_title ?? 'Try-on'}
                              style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
                            />
                            <div style={{ position: 'absolute', bottom: '5px', right: '7px', fontFamily: SERIF, fontSize: '9px', color: C.surface, opacity: 0.9 }}>
                              fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: '130px', background: C.bone }} />
                        )}
                        <div style={{ padding: '6px 8px 8px' }}>
                          {item.store_name && <StoreTag name={item.store_name} />}
                          <div style={{ fontSize: '11px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {item.product_title ? toSentenceCase(item.product_title) : 'Try-on'}
                          </div>
                        </div>
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
                      style={{ background: C.surface, borderRadius: '10px', padding: '10px', border: `0.5px solid ${C.border}`, display: 'flex', gap: '10px', alignItems: 'center', cursor: item.product_url ? 'pointer' : 'default' }}
                    >
                      <AuthImg
                        src={item.product_image_url} token={token} alt={item.product_title ?? 'Item'}
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.store_name && <StoreTag name={item.store_name} />}
                        <div style={{ fontSize: '12px', fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                          {item.product_title ? toSentenceCase(item.product_title) : 'Untitled item'}
                        </div>
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
              ) : wardrobe.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👕</div>
                  <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>No wardrobe items</div>
                  <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5, marginBottom: '16px' }}>
                    Add your own clothes on the dashboard to mix them with wishlist items.
                  </p>
                  <button onClick={() => openTab('/dashboard?tab=wardrobe')} style={btnInk}>Add your clothes →</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {wardrobe.map((item) => (
                      <div key={item.id} style={{ background: C.surface, borderRadius: '10px', border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
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
        </div>
      )}

    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const btnPink: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '12px 16px',
  background: C.pink, color: C.surface, border: 'none', borderRadius: '10px',
  fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
  letterSpacing: '-0.01em',
};

const btnInk: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '12px 16px',
  background: C.ink, color: C.bone, border: 'none', borderRadius: '10px',
  fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
  letterSpacing: '-0.01em',
};

const btnGhost: preact.JSX.CSSProperties = {
  display: 'block', width: '100%', padding: '10px 16px',
  background: 'transparent', color: C.pinkDark,
  border: `1px solid ${C.pink}`, borderRadius: '10px',
  fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
};

render(<Popup />, document.getElementById('app')!);
