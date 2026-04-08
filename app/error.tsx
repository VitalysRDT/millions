"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-display text-5xl font-bold text-danger">Erreur</p>
        <p className="text-white/60 mt-3 mb-6">{error.message}</p>
        <button onClick={reset} className="btn-gold">
          Réessayer
        </button>
      </div>
    </main>
  );
}
