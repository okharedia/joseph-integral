"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="error-shell">
      <div className="error-card">
        <p className="eyebrow">Connection error</p>
        <h1>We couldn&apos;t load the reconciliation data.</h1>
        <p>Check the API configuration and try again.</p>
        <button className="primary-button" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
