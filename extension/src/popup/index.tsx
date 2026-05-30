import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API_BASE = 'https://fitsyou-web.vercel.app';

type PopupState =
  | 'checking'
  | 'signed-out'
  | 'needs-setup'
  | 'idle'
  | 'extracting'
  | 'checking-fit'
  | 'saving'
  | 'saved'
  | 'error'
  | 'manual';

// Which list the user is viewing on the idle screen.
type Menu = 'home' | 'wishlist' | 'wardrobe';

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

interface MeasurementComparison {
  measurement: 'chest' | 'waist' | 'hips';
  userValue: number | null;
  rangeMin: number;
  rangeMax: number;
  fit: 'good' | 'borderline' | 'poor' | 'unknown';
}

interface FitResult {
  verdict: FitVerdict;
  recommended_size: string | null;
  reason: string;
  needs_measurements?: boolean;
  details?: {
    evaluatedSize: string;
    comparisons: MeasurementComparison[];
  };
}

interface Profile {
  photo_url: string | null;
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

function storeName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return '';
  }
}

// Our own R2 objects (wardrobe pictures, generated try-ons, uploaded products)
// are private and must be loaded through the authenticated /api/image route.
// Scraped retailer images are public URLs that load directly.
const R2_PREFIXES = ['wardrobe/', 'try-ons/', 'user-photos/', 'user-faces/', 'product-images/'];
function authKeyFor(src: string): string | null {
  try {
    const key = new URL(src).pathname.replace(/^\//, '');
    return R2_PREFIXES.some((p) => key.startsWith(p)) ? key : null;
  } catch {
    return null;
  }
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
  } catch {
    return null; // fit check must never block saving
  }
}

async function saveWishlist(
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
  } catch {
    return { error: 'Network error — please try again.' };
  }
}

async function fetchList<T>(token: string, path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: T[] };
    return json.items ?? [];
  } catch {
    return [];
  }
}

const FIT_BADGE: Record<FitVerdict, { label: string; bg: string; fg: string }> = {
  good: { label: 'Good fit', bg: '#dcfce7', fg: '#166534' },
  borderline: { label: 'Borderline fit', bg: '#fef9c3', fg: '#854d0e' },
  poor: { label: 'Likely won’t fit', bg: '#fee2e2', fg: '#991b1b' },
  unknown: { label: 'Fit unknown', bg: '#f1f5f9', fg: '#475569' },
};

// Loads an image, fetching it through the authenticated route (as a blob) when
// it points at one of our private R2 objects.
function AuthImg({ src, token, alt, style }: { src: string | null; token: string; alt: string; style: preact.JSX.CSSProperties }) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    if (!src) {
      setResolved(null);
      return;
    }
    const key = authKeyFor(src);
    if (!key) {
      setResolved(src);
      return;
    }
    fetch(`${API_BASE}/api/image?key=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) {
          revoke = URL.createObjectURL(blob);
          setResolved(revoke);
        }
      })
      .catch(() => setResolved(null));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src, token]);

  if (!resolved) return <div style={{ ...style, background: '#f0f0f0' }} />;
  return <img src={resolved} alt={alt} style={style} />;
}

function FitBadge({ fit, onAddMeasurements }: { fit: FitResult; onAddMeasurements: () => void }) {
  const style = FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown;
  const icon = (f: string) => (f === 'good' ? '✓' : f === 'borderline' ? '≈' : f === 'poor' ? '✗' : '?');

  return (
    <div style={{ background: style.bg, color: style.fg, borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700 }}>
        {style.label}
        {fit.recommended_size ? ` · size ${fit.recommended_size}` : ''}
      </div>
      {fit.reason && <div style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.35 }}>{fit.reason}</div>}
      {fit.details && fit.details.comparisons.length > 0 && (
        <div style={{ fontSize: '11px', marginTop: '6px', borderTop: `1px solid ${style.fg}33`, paddingTop: '6px' }}>
          <div style={{ fontWeight: 600, marginBottom: '3px' }}>Size {fit.details.evaluatedSize}:</div>
          {fit.details.comparisons.map((comp) => (
            <div key={comp.measurement} style={{ marginBottom: '2px', fontFamily: 'monospace' }}>
              <span style={{ marginRight: '4px' }}>{icon(comp.fit)}</span>
              <span style={{ textTransform: 'capitalize', minWidth: '50px', display: 'inline-block' }}>{comp.measurement}:</span>
              {comp.userValue !== null ? (
                <span>{comp.userValue}cm vs {comp.rangeMin}-{comp.rangeMax}cm</span>
              ) : (
                <span style={{ opacity: 0.7 }}>not provided</span>
              )}
            </div>
          ))}
        </div>
      )}
      {fit.needs_measurements && (
        <button onClick={onAddMeasurements} style={{ marginTop: '6px', background: 'none', border: 'none', padding: 0, color: style.fg, fontSize: '12px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
          Add your measurements →
        </button>
      )}
    </div>
  );
}

function Popup() {
  const [status, setStatus] = useState<PopupState>('checking');
  const [menu, setMenu] = useState<Menu>('home');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [currentTabUrl, setCurrentTabUrl] = useState('');
  const [fit, setFit] = useState<FitResult | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  async function checkAuth() {
    const fitsyou_token = await getToken();
    if (!fitsyou_token) {
      setStatus('signed-out');
      return;
    }
    setToken(fitsyou_token);
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${fitsyou_token}` } });
      if (res.status === 401) {
        chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token']);
        setStatus('signed-out');
        return;
      }
      const profile: Profile | null = await res.json();
      setStatus(!profile?.photo_url ? 'needs-setup' : 'idle');
    } catch {
      setStatus('signed-out');
    }
  }

  useEffect(() => {
    checkAuth();
    const onStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if ('fitsyou_token' in changes) checkAuth();
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => chrome.storage.onChanged.removeListener(onStorageChange);
  }, []);

  // Lazy-load the user's lists the first time they're needed.
  async function loadLists(t: string) {
    const [w, c] = await Promise.all([
      fetchList<WishlistItem>(t, '/api/wishlist'),
      fetchList<WardrobeItem>(t, '/api/wardrobe'),
    ]);
    setWishlist(w);
    setWardrobe(c);
    setListsLoaded(true);
  }

  useEffect(() => {
    if (status === 'idle' && token && !listsLoaded) loadLists(token);
  }, [status, token, listsLoaded]);

  function openTab(path: string) {
    const url = new URL(`${API_BASE}${path}`);
    url.searchParams.set('extensionId', chrome.runtime.id);
    chrome.tabs.create({ url: url.toString() });
  }

  async function handleAddToWishlist() {
    setStatus('extracting');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      setStatus('error');
      setMessage('Could not access current tab.');
      return;
    }
    const tabUrl = tab.url ?? '';
    setCurrentTabUrl(tabUrl);

    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT' }, async (response: ExtractResult | undefined) => {
      if (chrome.runtime.lastError || !response) {
        setStatus('error');
        setMessage('Refresh this page, then click again. (If it keeps failing, this store may not be supported yet — use manual upload.)');
        return;
      }
      if (!response.success || !response.imageUrl) {
        setStatus('manual');
        return;
      }

      const t = (await getToken()) ?? token;
      if (!t) { setStatus('signed-out'); return; }

      setStatus('checking-fit');
      setFit(null);

      // Compute the fit verdict once, at save time, so the dashboard + Fitting
      // Room show the same badge the user saw here. Free — no credit spent.
      const fitResult = await callFit(t, {
        product_title: response.productTitle ?? null,
        size_chart_text: response.sizeChartText,
        available_sizes: response.availableSizes,
        selected_size: response.selectedSize,
      });
      setFit(fitResult);

      setStatus('saving');
      const result = await saveWishlist(t, {
        product_url: tabUrl,
        product_image_url: response.imageUrl,
        product_title: response.productTitle ?? null,
        store_name: storeName(tabUrl),
        available_sizes: response.availableSizes,
        fit_verdict: fitResult?.verdict ?? null,
        recommended_size: fitResult?.recommended_size ?? null,
      });

      if ('error' in result) {
        setStatus('error');
        setMessage(result.error);
        return;
      }
      setMessage(response.productTitle ?? 'Added to your wishlist');
      setListsLoaded(false); // refresh lists next time the menu opens
      setStatus('saved');
    });
  }

  async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setStatus('saving');

    const t = (await getToken()) ?? token;
    if (!t) { setStatus('signed-out'); return; }

    const formData = new FormData();
    formData.append('file', file);
    let productImageUrl: string;
    try {
      const uploadRes = await fetch(`${API_BASE}/api/upload-product-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      productImageUrl = ((await uploadRes.json()) as { url: string }).url;
    } catch {
      setStatus('error');
      setMessage('Failed to upload product image.');
      return;
    }

    const productUrl = currentTabUrl || `manual-upload-${Date.now()}`;
    const result = await saveWishlist(t, {
      product_url: productUrl,
      product_image_url: productImageUrl,
      store_name: currentTabUrl ? storeName(currentTabUrl) : undefined,
    });
    if ('error' in result) {
      setStatus('error');
      setMessage(result.error);
      return;
    }
    setMessage('Added to your wishlist');
    setListsLoaded(false);
    setStatus('saved');
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>fitsyou</div>

      {status === 'checking' && <p style={hintStyle}>Loading…</p>}

      {status === 'signed-out' && (
        <div>
          <p style={hintStyle}>Sign in to start building outfits.</p>
          <button onClick={() => openTab('/auth/extension')} style={btnStyle}>Sign in to fitsyou</button>
        </div>
      )}

      {status === 'needs-setup' && (
        <div>
          <p style={hintStyle}>Complete your profile to start building outfits.</p>
          <button onClick={() => openTab('/onboarding/photo')} style={btnStyle}>Complete setup</button>
        </div>
      )}

      {status === 'idle' && (
        <div>
          <button onClick={handleAddToWishlist} style={btnStyle}>+ Add to wishlist</button>
          <button onClick={() => openTab('/dashboard?tab=fitting-room')} style={{ ...btnStyle, background: '#9d50dd', marginTop: '8px' }}>
            Build an outfit →
          </button>

          <div style={tabBarStyle}>
            {(['home', 'wishlist', 'wardrobe'] as Menu[]).map((m) => (
              <button key={m} onClick={() => setMenu(m)} style={{ ...tabStyle, ...(menu === m ? tabActiveStyle : {}) }}>
                {m === 'home' ? 'Home' : m === 'wishlist' ? `Wishlist${wishlist.length ? ` (${wishlist.length})` : ''}` : `Wardrobe${wardrobe.length ? ` (${wardrobe.length})` : ''}`}
              </button>
            ))}
          </div>

          {menu === 'home' && (
            <p style={{ ...hintStyle, marginTop: '10px' }}>
              On a product page? Add it to your wishlist. Then open the Fitting Room to combine items into a look.
            </p>
          )}

          {menu === 'wishlist' && (
            <div style={listStyle}>
              {!listsLoaded ? (
                <p style={hintStyle}>Loading…</p>
              ) : wishlist.length === 0 ? (
                <p style={hintStyle}>No wishlist items yet.</p>
              ) : (
                wishlist.map((item) => (
                  <div key={item.id} style={rowStyle}>
                    <AuthImg src={item.product_image_url} token={token} alt={item.product_title ?? 'Item'} style={thumbStyle} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={rowTitleStyle}>{item.product_title ?? 'Untitled item'}</div>
                      {item.fit_verdict && (
                        <div style={{ fontSize: '11px', color: (FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).fg }}>
                          {(FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).label}
                          {item.recommended_size ? ` · ${item.recommended_size}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {menu === 'wardrobe' && (
            <div style={listStyle}>
              {!listsLoaded ? (
                <p style={hintStyle}>Loading…</p>
              ) : wardrobe.length === 0 ? (
                <p style={hintStyle}>
                  No wardrobe items yet.{' '}
                  <button onClick={() => openTab('/dashboard?tab=wardrobe')} style={linkBtnStyle}>Add some →</button>
                </p>
              ) : (
                wardrobe.map((item) => (
                  <div key={item.id} style={rowStyle}>
                    <AuthImg src={item.image_url} token={token} alt={item.name ?? 'Item'} style={thumbStyle} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={rowTitleStyle}>{item.name ?? 'Untitled'}</div>
                      {item.category && <div style={{ fontSize: '11px', color: '#888', textTransform: 'capitalize' }}>{item.category}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {status === 'extracting' && <p style={hintStyle}>Finding product image…</p>}
      {status === 'checking-fit' && <p style={hintStyle}>Checking fit…</p>}
      {status === 'saving' && <p style={hintStyle}>Saving to your wishlist…</p>}

      {status === 'saved' && (
        <div>
          {fit && <FitBadge fit={fit} onAddMeasurements={() => openTab('/dashboard')} />}
          <p style={{ color: '#16a34a', fontSize: '13px', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ✓ {message}
          </p>
          <button onClick={() => openTab('/dashboard?tab=fitting-room')} style={{ ...btnStyle, background: '#9d50dd' }}>
            Open Fitting Room →
          </button>
          <button onClick={() => { setFit(null); setMenu('wishlist'); setStatus('idle'); }} style={{ ...btnStyle, background: '#555', marginTop: '6px' }}>
            Done
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{message}</p>
          <button onClick={() => setStatus('idle')} style={{ ...btnStyle, background: '#555' }}>Back</button>
        </div>
      )}

      {status === 'manual' && (
        <div>
          <p style={hintStyle}>Can't auto-detect the product image. Screenshot the item and upload it below.</p>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ fontSize: '12px', width: '100%', marginBottom: '8px' }} />
          <button onClick={() => setStatus('idle')} style={{ ...btnStyle, background: '#555', marginTop: '6px' }}>← Back</button>
        </div>
      )}
    </div>
  );
}

const btnStyle: preact.JSX.CSSProperties = {
  width: '100%',
  padding: '10px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const hintStyle: preact.JSX.CSSProperties = {
  color: '#666',
  fontSize: '13px',
  marginBottom: '10px',
};

const tabBarStyle: preact.JSX.CSSProperties = {
  display: 'flex',
  gap: '2px',
  borderBottom: '1px solid #e5e5e5',
  marginTop: '14px',
};

const tabStyle: preact.JSX.CSSProperties = {
  flex: 1,
  padding: '7px 4px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#666',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  marginBottom: '-1px',
  cursor: 'pointer',
};

const tabActiveStyle: preact.JSX.CSSProperties = {
  color: '#111',
  fontWeight: 700,
  borderBottom: '2px solid #111',
};

const listStyle: preact.JSX.CSSProperties = {
  marginTop: '10px',
  maxHeight: '260px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const rowStyle: preact.JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const thumbStyle: preact.JSX.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  objectFit: 'cover',
  flexShrink: 0,
};

const rowTitleStyle: preact.JSX.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#111',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const linkBtnStyle: preact.JSX.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#9d50dd',
  fontSize: '12px',
  fontWeight: 600,
  textDecoration: 'underline',
  cursor: 'pointer',
};

render(<Popup />, document.getElementById('app')!);
