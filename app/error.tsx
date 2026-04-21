"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="screen min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="eyebrow mb-3">Oups</div>
        <p
          className="display m-0"
          style={{ fontSize: "clamp(48px, 10vw, 96px)", lineHeight: 1, color: "var(--bad)" }}
        >
          Erreur
        </p>
        <p className="muted mt-3 mb-7 text-sm">{error.message}</p>
        <button onClick={reset} className="btn btn-primary">
          Réessayer
        </button>
      </div>
    </main>
  );
}
