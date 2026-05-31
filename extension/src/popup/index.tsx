import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API_BASE = 'https://fitsyou-web.vercel.app';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  pink:     '#FF2E88',
  pinkDark: '#D1246E',
  pinkLight:'#FFE0ED',
  ink:      '#121212',
  bone:     '#F5F2EC',
  surface:  '#FFFFFF',
  muted:    '#9A9690',
  faint:    '#C4C0BA',
  border:   'rgba(18,18,18,0.10)',
};
const SERIF = "'Playfair Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";
const MONO  = "'DM Mono', monospace";

// ─── Types ───────────────────────────────────────────────────────────────────
type PopupState =
  | 'checking'
  | 'signed-out'
  | 'needs-setup'
  | 'idle'
  | 'extracting'
  | 'checking-fit'
  | 'generating'
  | 'generated'
  | 'saving'
  | 'saved'
  | 'error'
  | 'manual';

type Menu = 'home' | 'wishlist' | 'wardrobe' | 'tryons';

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
  try_on_count_this_month?: number;
  subscription_tier?: string;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

async function callFit(
  token: string,
  payload: { product_title?: string | null; size_chart_text?: string; available_sizes?: string[]; selected_size?: string }
): Promise<FitResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as FitResult;
  } catch { return null; }
}

async function saveWishlistItem(
  token: string,
  payload: {
    product_url: string;
    product_image_url?: string;
    product_title?: string | null;
    store_name?: string;
    available_sizes?: string[];
    fit_verdict?: string | null;
    recommended_size?: string | null;
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({ error: 'Save failed' }));
    if (!res.ok) return { error: (json as { error?: string }).error ?? `Error ${res.status}` };
    return { ok: true };
  } catch { return { error: 'Network error — please try again.' }; }
}

async function fetchList<T>(token: string, path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: T[] };
    return json.items ?? [];
  } catch { return []; }
}

const TIER_LIMITS: Record<string, number> = { free: 5, pro: 20, power: 100, atelier: Infinity };

const FIT_BADGE: Record<FitVerdict, { label: string; bg: string; fg: string }> = {
  good:      { label: 'Good fit',   bg: '#dcfce7', fg: '#166534' },
  borderline:{ label: 'Borderline', bg: '#fef9c3', fg: '#854d0e' },
  poor:      { label: "Won't fit",  bg: '#fee2e2', fg: '#991b1b' },
  unknown:   { label: 'Fit unknown',bg: C.pinkLight, fg: C.pinkDark },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function AuthImg({
  src, token, alt, style,
}: {
  src: string | null;
  token: string;
  alt: string;
  style: preact.JSX.CSSProperties;
}) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    if (!src) { setResolved(null); return; }
    const key = authKeyFor(src);
    if (!key) { setResolved(src); return; }
    fetch(`${API_BASE}/api/image?key=${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) { revoke = URL.createObjectURL(blob); setResolved(revoke); }
      })
      .catch(() => setResolved(null));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [src, token]);

  if (!resolved) {
    return <div style={{ ...style, background: C.faint, borderRadius: '8px', flexShrink: 0 }} />;
  }
  return <img src={resolved} alt={alt} style={{ ...style, flexShrink: 0 }} />;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        border: `3px solid ${C.pinkLight}`, borderTopColor: C.pink,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

function Hint({ children }: { children: preact.ComponentChildren }) {
  return <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5, marginBottom: '14px', fontFamily: SANS }}>{children}</p>;
}

function StoreTag({ name }: { name: string }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em',
      textTransform: 'uppercase', color: C.pinkDark, marginBottom: '2px',
    }}>
      {name}
    </div>
  );
}

// ─── Main popup ──────────────────────────────────────────────────────────────
function Popup() {
  const [status, setStatus]           = useState<PopupState>('checking');
  const [menu, setMenu]               = useState<Menu>('home');
  const [message, setMessage]         = useState('');
  const [token, setToken]             = useState('');
  const [currentTabUrl, setCurrentTabUrl] = useState('');
  const [fit, setFit]                 = useState<FitResult | null>(null);
  const [wishlist, setWishlist]       = useState<WishlistItem[]>([]);
  const [wardrobe, setWardrobe]       = useState<WardrobeItem[]>([]);
  const [tryOns, setTryOns]           = useState<TryOnItem[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [progress, setProgress]       = useState(0);
  const [triesLeft, setTriesLeft]     = useState<number | null>(null);

  async function checkAuth() {
    const tk = await getToken();
    if (!tk) { setStatus('signed-out'); return; }
    setToken(tk);
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (res.status === 401) {
        chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token']);
        setStatus('signed-out');
        return;
      }
      const profile: Profile | null = await res.json();
      if (profile?.try_on_count_this_month !== undefined) {
        const tier = profile.subscription_tier ?? 'free';
        const limit = TIER_LIMITS[tier] ?? 5;
        setTriesLeft(Math.max(0, limit - (profile.try_on_count_this_month ?? 0)));
      }
      setStatus(!profile?.photo_url ? 'needs-setup' : 'idle');
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
      fetchList<WishlistItem>(tk, '/api/wishlist'),
      fetchList<WardrobeItem>(tk, '/api/wardrobe'),
      fetchList<TryOnItem>(tk, '/api/try-ons'),
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

  async function extractProduct(): Promise<ExtractResult | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return null;
    setCurrentTabUrl(tab.url ?? '');
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT_PRODUCT' }, (resp: ExtractResult | undefined) => {
        if (chrome.runtime.lastError || !resp) { resolve(null); return; }
        resolve(resp);
      });
    });
  }

  // ── Add to wishlist flow ──────────────────────────────────────────────────
  async function handleAddToWishlist() {
    setStatus('extracting');
    const ext = await extractProduct();
    if (!ext) {
      setStatus('error');
      setMessage('Refresh this page, then click again. If it keeps failing, this store may not be supported yet.');
      return;
    }
    if (!ext.success || !ext.imageUrl) { setStatus('manual'); return; }

    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }

    setStatus('checking-fit');
    setFit(null);
    const fitResult = await callFit(tk, {
      product_title: ext.productTitle ?? null,
      size_chart_text: ext.sizeChartText,
      available_sizes: ext.availableSizes,
      selected_size: ext.selectedSize,
    });
    setFit(fitResult);

    setStatus('saving');
    const saved = await saveWishlistItem(tk, {
      product_url: currentTabUrl,
      product_image_url: ext.imageUrl,
      product_title: ext.productTitle ?? null,
      store_name: storeName(currentTabUrl),
      available_sizes: ext.availableSizes,
      fit_verdict: fitResult?.verdict ?? null,
      recommended_size: fitResult?.recommended_size ?? null,
    });
    if ('error' in saved) { setStatus('error'); setMessage(saved.error); return; }
    setMessage(ext.productTitle ?? 'Added to your wishlist');
    setListsLoaded(false);
    setStatus('saved');
  }

  // ── Try-on generation ─────────────────────────────────────────────────────
  async function runGeneration(productUrl: string, productImageUrl: string) {
    setGeneratedImages([]);
    setProgress(0);
    setStatus('generating');

    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }

    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(prog + 4, 88);
      setProgress(prog);
    }, 500);

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
        body: JSON.stringify({ product_url: productUrl, product_image_url: productImageUrl }),
      });
      clearInterval(timer);
      setProgress(100);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage((err as { error?: string }).error ?? `Generation failed (${res.status})`);
        return;
      }
      const data = await res.json() as { output_image_urls?: string[] };
      setGeneratedImages(data.output_image_urls ?? []);
      setTriesLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      setListsLoaded(false);
      setStatus('generated');
    } catch {
      clearInterval(timer);
      setStatus('error');
      setMessage('Network error — please try again.');
    }
  }

  async function handleTryOnFromPage() {
    setStatus('extracting');
    const ext = await extractProduct();
    if (!ext) {
      setStatus('error');
      setMessage('Refresh this page, then click again.');
      return;
    }
    if (!ext.success || !ext.imageUrl) { setStatus('manual'); return; }
    await runGeneration(currentTabUrl, ext.imageUrl);
  }

  // ── Manual upload ─────────────────────────────────────────────────────────
  async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setStatus('saving');
    const tk = (await getToken()) ?? token;
    if (!tk) { setStatus('signed-out'); return; }

    const form = new FormData();
    form.append('file', file);
    let productImageUrl: string;
    try {
      const up = await fetch(`${API_BASE}/api/upload-product-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tk}` },
        body: form,
      });
      if (!up.ok) throw new Error();
      productImageUrl = ((await up.json()) as { url: string }).url;
    } catch {
      setStatus('error');
      setMessage('Failed to upload product image.');
      return;
    }

    const productUrl = currentTabUrl || `manual-upload-${Date.now()}`;
    const saved = await saveWishlistItem(tk, {
      product_url: productUrl,
      product_image_url: productImageUrl,
      store_name: currentTabUrl ? storeName(currentTabUrl) : undefined,
    });
    if ('error' in saved) { setStatus('error'); setMessage(saved.error); return; }
    setMessage('Added to your wishlist');
    setListsLoaded(false);
    setStatus('saved');
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '360px', fontFamily: SANS, background: C.bone, color: C.ink }}>

      {/* Header */}
      <div style={{
        background: C.ink, padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: SERIF, fontSize: '22px', color: C.bone, lineHeight: 1 }}>
          fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
        </div>
        {triesLeft !== null && (
          <div style={{
            fontFamily: MONO, fontSize: '10px', color: C.pink,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {triesLeft} tries left
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px' }}>

        {/* ── Checking ── */}
        {status === 'checking' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spinner />
          </div>
        )}

        {/* ── Signed out ── */}
        {status === 'signed-out' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: '22px', marginBottom: '8px' }}>
              Welcome to fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
            </div>
            <Hint>Sign in to try clothes on yourself and save looks you love.</Hint>
            <button onClick={() => openTab('/auth/extension')} style={btnPink}>
              Sign in to fitsyou
            </button>
          </div>
        )}

        {/* ── Needs setup ── */}
        {status === 'needs-setup' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: '20px', marginBottom: '8px' }}>Almost ready</div>
            <Hint>Upload your photo once and start trying on clothes from any store.</Hint>
            <button onClick={() => openTab('/onboarding/photo')} style={btnPink}>
              Complete setup
            </button>
          </div>
        )}

        {/* ── Idle — main UI ── */}
        {status === 'idle' && (
          <div>
            {/* Tab bar */}
            <div style={{
              display: 'flex', gap: '1px',
              borderBottom: `1px solid ${C.border}`, marginBottom: '14px',
            }}>
              {(['home', 'wishlist', 'wardrobe', 'tryons'] as Menu[]).map((m) => {
                const labels: Record<Menu, string> = {
                  home:     'Home',
                  wishlist: wishlist.length ? `Saved (${wishlist.length})` : 'Saved',
                  wardrobe: wardrobe.length ? `Wardrobe (${wardrobe.length})` : 'Wardrobe',
                  tryons:   tryOns.length  ? `Try-ons (${tryOns.length})`   : 'Try-ons',
                };
                const active = menu === m;
                return (
                  <button key={m} onClick={() => setMenu(m)} style={{
                    flex: 1, padding: '8px 3px',
                    fontSize: '10px', fontWeight: active ? 600 : 400,
                    color: active ? C.pink : C.muted,
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${active ? C.pink : 'transparent'}`,
                    marginBottom: '-1px', cursor: 'pointer',
                    fontFamily: MONO, letterSpacing: '0.04em',
                    textTransform: 'uppercase', transition: 'color 0.15s',
                  }}>
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {/* ── Home tab ── */}
            {menu === 'home' && (
              <div>
                <Hint>Browse any fashion store and try items on yourself — right here, without leaving the page.</Hint>
                <button onClick={handleTryOnFromPage} style={{ ...btnPink, marginBottom: '8px' }}>
                  Try this on me
                </button>
                <button onClick={handleAddToWishlist} style={{ ...btnInk, marginBottom: '8px' }}>
                  + Add to wishlist
                </button>
                <button onClick={() => openTab('/dashboard?tab=fitting-room')} style={btnGhost}>
                  Open Fitting Room →
                </button>
              </div>
            )}

            {/* ── Wishlist tab ── */}
            {menu === 'wishlist' && (
              <div>
                {!listsLoaded ? (
                  <Spinner />
                ) : wishlist.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Hint>No saved items yet. Browse a store and add something.</Hint>
                    <button onClick={() => setMenu('home')} style={btnPink}>Find something →</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                    {wishlist.map((item) => (
                      <div key={item.id} style={{
                        background: C.surface, borderRadius: '10px', padding: '10px',
                        border: `0.5px solid ${C.border}`,
                      }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <AuthImg
                            src={item.product_image_url} token={token}
                            alt={item.product_title ?? 'Item'}
                            style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.store_name && <StoreTag name={item.store_name} />}
                            <div style={{
                              fontSize: '12px', fontWeight: 600, color: C.ink,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.product_title ?? 'Untitled item'}
                            </div>
                            {item.fit_verdict && (
                              <div style={{ fontSize: '10px', color: (FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).fg, marginTop: '2px' }}>
                                {(FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).label}
                                {item.recommended_size ? ` · ${item.recommended_size}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        {item.product_image_url && (
                          <button
                            onClick={() => runGeneration(item.product_url, item.product_image_url!)}
                            style={{ ...btnPinkSmall, marginTop: '8px', width: '100%' }}
                          >
                            Try this on me
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Wardrobe tab ── */}
            {menu === 'wardrobe' && (
              <div>
                {!listsLoaded ? (
                  <Spinner />
                ) : wardrobe.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Hint>No wardrobe items yet. Add your own clothes on the dashboard.</Hint>
                    <button onClick={() => openTab('/dashboard?tab=wardrobe')} style={btnInk}>Add your clothes →</button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                      maxHeight: '380px', overflowY: 'auto',
                    }}>
                      {wardrobe.map((item) => (
                        <div key={item.id} style={{
                          background: C.surface, borderRadius: '10px',
                          border: `0.5px solid ${C.border}`, overflow: 'hidden',
                        }}>
                          <AuthImg
                            src={item.image_url} token={token}
                            alt={item.name ?? 'Item'}
                            style={{ width: '100%', height: '110px', objectFit: 'contain', background: C.bone, display: 'block' }}
                          />
                          <div style={{ padding: '6px 8px 8px' }}>
                            {item.category && <StoreTag name={item.category} />}
                            <div style={{
                              fontSize: '11px', fontWeight: 600, color: C.ink,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.name ?? 'Untitled'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => openTab('/dashboard?tab=fitting-room')} style={{ ...btnGhost, marginTop: '10px', width: '100%' }}>
                      Open Fitting Room →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Try-ons tab ── */}
            {menu === 'tryons' && (
              <div>
                {!listsLoaded ? (
                  <Spinner />
                ) : tryOns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Hint>No try-ons yet. Visit a store page and hit "Try this on me".</Hint>
                    <button onClick={() => setMenu('home')} style={btnPink}>Try something on</button>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                      maxHeight: '380px', overflowY: 'auto',
                    }}>
                      {tryOns.slice(0, 8).map((item) => (
                        <div key={item.id} style={{
                          background: C.surface, borderRadius: '10px',
                          border: `0.5px solid ${C.border}`, overflow: 'hidden',
                        }}>
                          {item.output_image_urls?.[0] ? (
                            <div style={{ position: 'relative' }}>
                              <AuthImg
                                src={item.output_image_urls[0]} token={token}
                                alt={item.product_title ?? 'Try-on'}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                              />
                              <div style={{
                                position: 'absolute', bottom: '4px', right: '6px',
                                fontFamily: SERIF, fontSize: '9px', color: C.surface, opacity: 0.9,
                              }}>
                                fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
                              </div>
                            </div>
                          ) : (
                            <div style={{ height: '120px', background: C.bone }} />
                          )}
                          <div style={{ padding: '6px 8px 8px' }}>
                            {item.store_name && <StoreTag name={item.store_name} />}
                            <div style={{
                              fontSize: '11px', fontWeight: 600, color: C.ink,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.product_title ?? 'Try-on'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => openTab('/dashboard')} style={{ ...btnGhost, marginTop: '10px', width: '100%' }}>
                      View all on dashboard →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Extracting ── */}
        {status === 'extracting' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>Finding product…</div>
            <Hint>Scanning the page for the product image</Hint>
            <Spinner />
          </div>
        )}

        {/* ── Checking fit ── */}
        {status === 'checking-fit' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>Checking fit…</div>
            <Spinner />
          </div>
        )}

        {/* ── Generating ── */}
        {status === 'generating' && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontFamily: SERIF, fontSize: '19px', marginBottom: '5px' }}>
                Composing your try-<em style={{ color: C.pink, fontStyle: 'italic' }}>on</em>…
              </div>
              <div style={{ fontSize: '12px', color: C.muted }}>Usually takes 8–15 seconds</div>
            </div>
            <div style={{ background: C.surface, borderRadius: '6px', overflow: 'hidden', height: '5px', marginBottom: '4px' }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${C.pink}, ${C.pinkDark})`,
                width: `${progress}%`,
                transition: 'width 0.5s ease',
                borderRadius: '6px',
              }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: C.muted, textAlign: 'right', marginBottom: '12px' }}>
              {progress}%
            </div>
            <Spinner />
          </div>
        )}

        {/* ── Generated ── */}
        {status === 'generated' && (
          <div>
            <div style={{ fontFamily: SERIF, fontSize: '19px', marginBottom: '12px' }}>
              Your try-<em style={{ color: C.pink, fontStyle: 'italic' }}>on</em>
            </div>
            {generatedImages.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: generatedImages.length === 1 ? '1fr' : '1fr 1fr',
                gap: '8px', marginBottom: '14px',
              }}>
                {generatedImages.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                    <AuthImg
                      src={url} token={token}
                      alt={`Try-on variant ${i + 1}`}
                      style={{
                        width: '100%',
                        height: generatedImages.length === 1 ? '300px' : '190px',
                        objectFit: 'cover', display: 'block',
                      }}
                    />
                    {/* Corner brand mark */}
                    <div style={{
                      position: 'absolute', bottom: '7px', right: '9px',
                      fontFamily: SERIF, fontSize: '11px',
                      color: C.surface, opacity: 0.92,
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}>
                      fits<em style={{ color: C.pink, fontStyle: 'italic' }}>you</em>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Hint>Try-on generated! View it on your dashboard.</Hint>
            )}
            <button onClick={() => openTab('/dashboard')} style={{ ...btnInk, marginBottom: '8px' }}>
              View on dashboard
            </button>
            <button onClick={() => { setGeneratedImages([]); setMenu('tryons'); setStatus('idle'); }} style={btnGhost}>
              Done
            </button>
          </div>
        )}

        {/* ── Saving ── */}
        {status === 'saving' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }}>Saving…</div>
            <Spinner />
          </div>
        )}

        {/* ── Saved ── */}
        {status === 'saved' && (
          <div>
            {fit && (
              <div style={{
                background: (FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).bg,
                color: (FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).fg,
                borderRadius: '10px', padding: '10px 12px', marginBottom: '10px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {(FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).label}
                  {fit.recommended_size ? ` · size ${fit.recommended_size}` : ''}
                </div>
                {fit.reason && <div style={{ fontSize: '12px', marginTop: '3px', lineHeight: 1.4 }}>{fit.reason}</div>}
                {fit.needs_measurements && (
                  <button
                    onClick={() => openTab('/dashboard')}
                    style={{ marginTop: '6px', background: 'none', border: 'none', padding: 0, fontSize: '12px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', color: 'inherit' }}
                  >
                    Add measurements →
                  </button>
                )}
              </div>
            )}
            <div style={{
              background: C.surface, borderRadius: '10px', padding: '12px',
              marginBottom: '12px', border: `0.5px solid ${C.border}`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }}>
                ✓ Saved to wishlist
              </div>
              <div style={{ fontSize: '13px', color: C.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {message}
              </div>
            </div>
            <button onClick={() => openTab('/dashboard?tab=fitting-room')} style={{ ...btnPink, marginBottom: '8px' }}>
              Build an outfit →
            </button>
            <button onClick={() => { setFit(null); setMenu('wishlist'); setStatus('idle'); }} style={btnInk}>
              Done
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div>
            <div style={{
              background: '#fee2e2', color: '#991b1b', borderRadius: '10px',
              padding: '12px', marginBottom: '12px', fontSize: '13px', lineHeight: 1.45,
            }}>
              {message}
            </div>
            <button onClick={() => setStatus('idle')} style={btnInk}>← Back</button>
          </div>
        )}

        {/* ── Manual upload ── */}
        {status === 'manual' && (
          <div>
            <div style={{
              background: C.surface, borderRadius: '10px', padding: '14px',
              marginBottom: '12px', border: `0.5px solid ${C.border}`,
            }}>
              <div style={{ fontFamily: SERIF, fontSize: '16px', marginBottom: '5px' }}>Can't detect image</div>
              <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>Screenshot the item and upload it below to save it to your wishlist.</p>
            </div>
            <label style={{
              display: 'block', border: `1.5px dashed ${C.pink}`, borderRadius: '10px',
              padding: '18px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>📷</div>
              <div style={{ fontSize: '12px', color: C.pinkDark, fontWeight: 600 }}>Tap to upload screenshot</div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button onClick={() => setStatus('idle')} style={btnInk}>← Back</button>
          </div>
        )}

      </div>
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

const btnPinkSmall: preact.JSX.CSSProperties = {
  display: 'block', padding: '7px 12px',
  background: C.pink, color: C.surface, border: 'none', borderRadius: '7px',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
};

render(<Popup />, document.getElementById('app')!);
