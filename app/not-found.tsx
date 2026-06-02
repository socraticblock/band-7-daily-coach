import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page py-24 text-center">
      <p className="label">404</p>
      <h1 className="mt-2 font-serif text-title">Page not found.</h1>
      <p className="mt-3 text-small text-ink-muted">
        The page you were looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-accent mt-6 inline-flex">
        Back to home
      </Link>
    </main>
  );
}
