import Link from "next/link";

export default function NotFound() {
  return (
    <main className="screen min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p
          className="display shine m-0"
          style={{ fontSize: "clamp(96px, 22vw, 180px)", lineHeight: 1, fontWeight: 400 }}
        >
          404
        </p>
        <p className="muted mt-4 mb-8">Page introuvable.</p>
        <Link href="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}
