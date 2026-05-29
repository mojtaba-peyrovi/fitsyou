import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const API_BASE = 'https://fitsyou-web.vercel.app';

type AuthState = 'checking' | 'signed-out' | 'needs-setup' | 'idle' | 'loading' | 'success' | 'error' | 'manual';

interface ExtractResult {
  success: boolean;
  imageUrl?: string;
  productTitle?: string;
  productUrl?: string;
}

interface Profile {
  photo_url: string | null;
  body_type: string | null;
  backdrop_category: string | null;
}

function Popup() {
  const [status, setStatus] = useState<AuthState>('checking');
  const [message, setMessage] = useState('');

  async function checkAuth() {
    chrome.storage.local.get(['fitsyou_token'], async ({ fitsyou_token }) => {
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
      if ('fitsyou_token' in changes) {
        checkAuth();
      }
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
    setStatus('loading');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      setStatus('error');
      setMessage('Could not access current tab.');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT' }, (response: ExtractResult | undefined) => {
      if (chrome.runtime.lastError) {
        setStatus('manual');
        return;
      }

      if (!response || !response.success) {
        setStatus('manual');
        return;
      }

      chrome.runtime.sendMessage({ type: 'PRODUCT_EXTRACTED', data: response });
      setStatus('success');
      setMessage(response.productTitle ?? 'Item saved!');
    });
  }

  function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setStatus('success');
    setMessage('Image uploaded. Try-on coming soon!');
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>fitsyou</div>

      {status === 'checking' && (
        <p style={{ color: '#666', fontSize: '14px' }}>Loading…</p>
      )}

      {status === 'signed-out' && (
        <div>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
            Sign in to start trying on clothes.
          </p>
          <button onClick={() => openTab('/auth/extension')} style={btnStyle}>
            Sign in to fitsyou
          </button>
        </div>
      )}

      {status === 'needs-setup' && (
        <div>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
            Complete your profile to start trying on clothes.
          </p>
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

      {status === 'loading' && (
        <p style={{ color: '#666', fontSize: '14px' }}>Extracting product image…</p>
      )}

      {status === 'success' && (
        <p style={{ color: '#16a34a', fontSize: '14px' }}>Saved: {message}</p>
      )}

      {status === 'error' && (
        <p style={{ color: '#dc2626', fontSize: '14px' }}>{message}</p>
      )}

      {status === 'manual' && (
        <div>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>
            Can't extract image automatically. Please screenshot the item and upload it.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            style={{ fontSize: '12px', width: '100%' }}
          />
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

render(<Popup />, document.getElementById('app')!);
