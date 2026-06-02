"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-page py-24">
      <p className="label text-error">Something went wrong</p>
      <h1 className="mt-2 font-serif text-title">The page hit an unexpected error.</h1>
      <p className="mt-3 text-small text-ink-muted">{error.message}</p>
      <button onClick={() => reset()} className="btn-accent btn-sm mt-6">
        Try again
      </button>
    </main>
  );
}
