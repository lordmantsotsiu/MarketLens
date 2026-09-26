'use client';

import React from 'react';

/**
 * Last-resort boundary for errors thrown outside the normal page shell —
 * e.g. failures during initial hydration in the root layout. Without this,
 * such errors render a completely blank white page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#020617', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '26rem',
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', margin: '0.75rem 0' }}>MarketLens failed to load</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.25rem' }}>
              A critical error prevented the app from starting. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
