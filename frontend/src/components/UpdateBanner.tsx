import { useState } from 'react';

interface Props {
  updateAvailable: boolean;
}

export default function UpdateBanner({ updateAvailable }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '10px 16px',
      background: '#1d4ed8',
      color: '#fff',
      fontSize: '14px',
    }}>
      <span>A new version is available.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '4px 12px',
          background: '#fff',
          color: '#1d4ed8',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Refresh
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
