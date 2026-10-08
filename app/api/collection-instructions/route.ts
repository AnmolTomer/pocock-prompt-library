import { collectionGuide } from '@/lib/collection-guide';

export function GET(): Response {
  return new Response(collectionGuide, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
