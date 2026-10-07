import { readLibrary } from '@/lib/library-store';

export async function GET() {
  try {
    return Response.json(await readLibrary(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'The library is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
