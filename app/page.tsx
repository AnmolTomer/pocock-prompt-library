import PromptLibrary from './library';
import { readLibrary } from '@/lib/library-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    return <PromptLibrary today={today} library={await readLibrary()} />;
  } catch {
    return <PromptLibrary today={today} library={{ prompts: [], lastCheckedAt: null }} unavailable />;
  }
}
