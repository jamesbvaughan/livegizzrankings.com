// This loading boundary is load-bearing beyond UX: it makes requests for
// unknown slugs stream the 404 page inside the prerendered shell (with a 200
// status and a noindex tag) instead of blocking on the slug lookup. Without
// it, `notFound()` fires during Next's on-demand ISR fill, which crashes with
// "Invalid revalidate configuration provided: 0 < 1" on Next 16.2 (fixed in
// 16.3 canaries). If that bug is fixed and you want real 404 status codes
// for unknown slugs, removing this file is step one — see
// https://nextjs.org/docs/app/guides/streaming (the "HTTP contract" section).
export default function Loading() {
  return <div className="text-muted">Loading...</div>;
}
