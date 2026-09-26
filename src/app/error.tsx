'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to your observability provider here (Sentry, LogRocket, etc.).
    console.error('Dashboard error boundary caught:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-slate-400">
          The dashboard hit an unexpected error while rendering. Your data was not affected.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
