export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="h-8 w-1/2 animate-pulse rounded bg-line" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-line" />
      <div className="mt-8 space-y-3">
        <div className="h-32 animate-pulse rounded bg-paper-warm" />
        <div className="h-32 animate-pulse rounded bg-paper-warm" />
      </div>
    </div>
  );
}
