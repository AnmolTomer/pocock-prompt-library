import PromptLibrary from './library';
import { readLibrary } from '@/lib/library-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    return <PromptLibrary library={await readLibrary()} />;
  } catch {
    return <PromptLibrary library={{ prompts: [], lastCheckedAt: null }} unavailable />;
  }
}
