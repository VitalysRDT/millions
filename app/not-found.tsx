import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-display text-9xl font-bold text-gold-gradient">404</p>
        <p className="text-white/60 mt-4 mb-8">Page introuvable.</p>
        <Link href="/" className="btn-gold inline-flex">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
