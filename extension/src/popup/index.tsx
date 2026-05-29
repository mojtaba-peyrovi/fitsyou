import { render } from 'preact';
import { useState } from 'preact/hooks';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'manual';

interface ExtractResult {
  success: boolean;
  imageUrl?: string;
  productTitle?: string;
  productUrl?: string;
}

function Popup() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

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
        // Content script not injected on this page — trigger manual upload
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
    <div style={{ padding: '16px' }}>
      <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>fitsyou</div>

      {status === 'idle' && (
        <button onClick={handleTryOn} style={btnStyle}>
          Try this on
        </button>
      )}

      {status === 'loading' && (
        <p style={{ color: '#666', fontSize: '14px' }}>Extracting product image…</p>
      )}

      {status === 'success' && (
        <p style={{ color: '#16a34a', fontSize: '14px' }}>
          Saved: {message}
        </p>
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
