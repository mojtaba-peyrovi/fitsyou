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
  | 'fit-warning'
  | 'generating'
  | 'success'
  | 'error'
  | 'manual';

interface GeneratePayload {
  product_url: string;
  product_image_url: string;
  product_title?: string | null;
  store_name?: string;
  fit_verdict?: string | null;
  recommended_size?: string | null;
}

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
  body_type: string | null;
  backdrop_category: string | null;
}

interface GenerateResult {
  output_image_urls: string[];
  preview_path?: string;
  cached?: boolean;
}

async function loadPreviewBlob(path: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

function storeName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return '';
  }
}

async function callGenerate(
  token: string,
  payload: {
    product_url: string;
    product_image_url: string;
    product_title?: string | null;
    store_name?: string;
    fit_verdict?: string | null;
    recommended_size?: string | null;
  }
): Promise<GenerateResult | { error: string }> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({ error: 'Generation failed' }));
  if (!res.ok) {
    const j = json as { error?: string; detail?: string };
    const msg = j.detail ? `${j.error}: ${j.detail}` : (j.error ?? `Error ${res.status}`);
    return { error: msg };
  }
  return json as { output_image_urls: string[] };
}

async function callFit(
  token: string,
  payload: {
    product_title?: string | null;
    size_chart_text?: string;
    available_sizes?: string[];
    selected_size?: string;
  }
): Promise<FitResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/fit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as FitResult;
  } catch {
    return null; // fit check must never block the try-on flow
  }
}

const FIT_BADGE: Record<FitVerdict, { label: string; bg: string; fg: string }> = {
  good: { label: 'Good fit', bg: '#dcfce7', fg: '#166534' },
  borderline: { label: 'Borderline fit', bg: '#fef9c3', fg: '#854d0e' },
  poor: { label: 'Likely won’t fit', bg: '#fee2e2', fg: '#991b1b' },
  unknown: { label: 'Fit unknown', bg: '#f1f5f9', fg: '#475569' },
};

function FitBadge({ fit, onAddMeasurements }: { fit: FitResult; onAddMeasurements: () => void }) {
  const style = FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown;

  const getMeasurementIcon = (fit: string) => {
    if (fit === 'good') return '✓';
    if (fit === 'borderline') return '≈';
    if (fit === 'poor') return '✗';
    return '?';
  };

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
              <span style={{ marginRight: '4px' }}>{getMeasurementIcon(comp.fit)}</span>
              <span style={{ textTransform: 'capitalize', minWidth: '50px', display: 'inline-block' }}>
                {comp.measurement}:
              </span>
              {comp.userValue !== null ? (
                <span>
                  {comp.userValue}cm vs {comp.rangeMin}-{comp.rangeMax}cm
                </span>
              ) : (
                <span style={{ opacity: 0.7 }}>not provided</span>
              )}
            </div>
          ))}
        </div>
      )}
      {fit.needs_measurements && (
        <button
          onClick={onAddMeasurements}
          style={{ marginTop: '6px', background: 'none', border: 'none', padding: 0, color: style.fg, fontSize: '12px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
        >
          Add your measurements →
        </button>
      )}
    </div>
  );
}

function Popup() {
  const [status, setStatus] = useState<PopupState>('checking');
  const [message, setMessage] = useState('');
  const [currentTabUrl, setCurrentTabUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fit, setFit] = useState<FitResult | null>(null);
  const [pending, setPending] = useState<{ token: string; payload: GeneratePayload } | null>(null);

  async function checkAuth() {
    chrome.storage.local.get(['fitsyou_token'], async (items) => {
      const fitsyou_token = items['fitsyou_token'] as string | undefined;
      if (!fitsyou_token) {
        setStatus('signed-out');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/user/profile`, {
          headers: { Authorization: `Bearer ${fitsyou_token}` },
        });

        if (res.status === 401) {
          chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token']);
          setStatus('signed-out');
          return;
        }

        const profile: Profile | null = await res.json();
        if (!profile?.photo_url) {
          setStatus('needs-setup');
        } else {
          setStatus('idle');
        }
      } catch {
        setStatus('signed-out');
      }
    });
  }

  useEffect(() => {
    checkAuth();

    const onStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if ('fitsyou_token' in changes) checkAuth();
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => chrome.storage.onChanged.removeListener(onStorageChange);
  }, []);

  function openTab(path: string) {
    const url = new URL(`${API_BASE}${path}`);
    url.searchParams.set('extensionId', chrome.runtime.id);
    chrome.tabs.create({ url: url.toString() });
  }

  async function handleTryOn() {
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
      // Content script not reachable: either a stale tab (opened before the
      // extension was reloaded) or a site we don't inject into. Tell the user
      // to refresh rather than dumping them into manual upload.
      if (chrome.runtime.lastError || !response) {
        setStatus('error');
        setMessage('Refresh this page, then click "Try this on" again. (If it keeps failing, this store may not be supported yet — use manual upload.)');
        return;
      }

      // Content script responded but found no product image → manual upload.
      if (!response.success || !response.imageUrl) {
        setStatus('manual');
        return;
      }

      setStatus('checking-fit');
      setFit(null);
      setPending(null);

      chrome.storage.local.get(['fitsyou_token'], async (items) => {
        const fitsyou_token = items['fitsyou_token'] as string | undefined;
        if (!fitsyou_token) { setStatus('signed-out'); return; }

        const payload: GeneratePayload = {
          product_url: tabUrl,
          product_image_url: response.imageUrl!,
          product_title: response.productTitle ?? null,
          store_name: storeName(tabUrl),
        };

        // Fit check first (free, ~1-2s). If it predicts a poor match, ask before
        // spending a generation credit instead of auto-generating.
        const fitResult = await callFit(fitsyou_token, {
          product_title: response.productTitle ?? null,
          size_chart_text: response.sizeChartText,
          available_sizes: response.availableSizes,
          selected_size: response.selectedSize,
        });
        setFit(fitResult);

        // Persist the fit result the user just saw alongside the try-on, so the
        // dashboard can show the same verdict + suggested size on the saved card.
        // Set before the poor-fit branch so it's carried whether the user
        // generates immediately or confirms through the fit warning.
        if (fitResult) {
          payload.fit_verdict = fitResult.verdict;
          payload.recommended_size = fitResult.recommended_size;
        }

        if (fitResult?.verdict === 'poor') {
          setPending({ token: fitsyou_token, payload });
          setStatus('fit-warning');
          return;
        }

        await runGenerate(fitsyou_token, payload);
      });
    });
  }

  // Runs the (credit-consuming) try-on generation and renders the result.
  async function runGenerate(token: string, payload: GeneratePayload) {
    setStatus('generating');
    const result = await callGenerate(token, payload);

    if ('error' in result) {
      setStatus('error');
      setMessage(
        result.error.includes('limit')
          ? 'Monthly limit reached. Upgrade your plan at fitsyou.live/dashboard.'
          : result.error
      );
      return;
    }

    const blobUrl = result.preview_path ? await loadPreviewBlob(result.preview_path, token) : null;
    setPreviewUrl(blobUrl);
    setStatus('success');
    setMessage(payload.product_title ?? 'Try-on ready!');
  }

  async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setStatus('generating');

    chrome.storage.local.get(['fitsyou_token'], async (items) => {
      const fitsyou_token = items['fitsyou_token'] as string | undefined;
      if (!fitsyou_token) { setStatus('signed-out'); return; }

      // Upload the product screenshot to R2 first
      const formData = new FormData();
      formData.append('file', file);

      let productImageUrl: string;
      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload-product-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${fitsyou_token}` },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json() as { url: string };
        productImageUrl = uploadData.url;
      } catch {
        setStatus('error');
        setMessage('Failed to upload product image.');
        return;
      }

      // Then generate
      const productUrl = currentTabUrl || `manual-upload-${Date.now()}`;
      const result = await callGenerate(fitsyou_token, {
        product_url: productUrl,
        product_image_url: productImageUrl,
        store_name: currentTabUrl ? storeName(currentTabUrl) : undefined,
      });

      if ('error' in result) {
        setStatus('error');
        setMessage(result.error);
        return;
      }

      const blobUrl = result.preview_path
        ? await loadPreviewBlob(result.preview_path, fitsyou_token)
        : null;
      setPreviewUrl(blobUrl);
      setStatus('success');
      setMessage('Try-on ready!');
    });
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>fitsyou</div>

      {status === 'checking' && <p style={hintStyle}>Loading…</p>}

      {status === 'signed-out' && (
        <div>
          <p style={hintStyle}>Sign in to start trying on clothes.</p>
          <button onClick={() => openTab('/auth/extension')} style={btnStyle}>
            Sign in to fitsyou
          </button>
        </div>
      )}

      {status === 'needs-setup' && (
        <div>
          <p style={hintStyle}>Complete your profile to start trying on clothes.</p>
          <button onClick={() => openTab('/onboarding/photo')} style={btnStyle}>
            Complete setup
          </button>
        </div>
      )}

      {status === 'idle' && (
        <button onClick={handleTryOn} style={btnStyle}>
          Try this on
        </button>
      )}

      {status === 'extracting' && <p style={hintStyle}>Finding product image…</p>}

      {status === 'checking-fit' && <p style={hintStyle}>Checking fit…</p>}

      {status === 'fit-warning' && fit && (
        <div>
          <FitBadge fit={fit} onAddMeasurements={() => openTab('/dashboard')} />
          <p style={hintStyle}>
            This probably won’t be a great match. Generating a try-on uses one of your
            credits — try it on anyway?
          </p>
          <button
            onClick={() => { if (pending) runGenerate(pending.token, pending.payload); }}
            style={btnStyle}
          >
            Try it on anyway
          </button>
          <button
            onClick={() => { setPending(null); setStatus('idle'); }}
            style={{ ...btnStyle, background: '#555', marginTop: '6px' }}
          >
            No thanks
          </button>
        </div>
      )}

      {status === 'generating' && (
        <p style={hintStyle}>Generating your try-on… this takes ~15 sec.</p>
      )}

      {status === 'success' && (
        <div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Try-on preview"
              style={{ width: '100%', borderRadius: '6px', marginBottom: '8px', display: 'block' }}
            />
          )}
          {fit && <FitBadge fit={fit} onAddMeasurements={() => openTab('/dashboard')} />}
          <p style={{ color: '#16a34a', fontSize: '13px', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ✓ {message}
          </p>
          <button onClick={() => openTab('/dashboard')} style={btnStyle}>
            View all try-ons →
          </button>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{message}</p>
          <button onClick={() => setStatus('idle')} style={{ ...btnStyle, background: '#555' }}>
            Try again
          </button>
        </div>
      )}

      {status === 'manual' && (
        <div>
          <p style={hintStyle}>
            Can't auto-detect the product image. Screenshot the item and upload it below.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            style={{ fontSize: '12px', width: '100%', marginBottom: '8px' }}
          />
          <button onClick={() => setStatus('idle')} style={{ ...btnStyle, background: '#555', marginTop: '6px' }}>
            ← Back
          </button>
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

render(<Popup />, document.getElementById('app')!);
