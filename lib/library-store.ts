import { env } from 'cloudflare:workers';
import type { Library, Prompt } from './prompt-model';
import { seedPrompts } from './seed-prompts';

export function database() {
  if (!env.DB) throw new Error('Library storage is unavailable.');
  return env.DB;
}

export async function readLibrary(): Promise<Library> {
  const db = database();
  const [records, refresh] = await db.batch([
    db.prepare('SELECT tweet_id AS tweetId, title, command, published_at AS publishedAt, prompt_text AS text, text_origin AS textOrigin FROM prompts ORDER BY published_at DESC LIMIT 2000'),
    db.prepare("SELECT last_checked_at AS lastCheckedAt FROM refresh_state WHERE id = 'discovery'"),
  ]);
  const merged = new Map(seedPrompts.map(prompt => [prompt.tweetId, prompt]));
  for (const prompt of records.results as Prompt[]) {
    const seeded = merged.get(prompt.tweetId);
    merged.set(prompt.tweetId, { ...prompt, text: prompt.text ?? seeded?.text ?? null, textOrigin: prompt.textOrigin ?? seeded?.textOrigin ?? null });
  }
  return {
    prompts: [...merged.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    lastCheckedAt: (refresh.results[0] as { lastCheckedAt?: string } | undefined)?.lastCheckedAt ?? null,
  };
}
