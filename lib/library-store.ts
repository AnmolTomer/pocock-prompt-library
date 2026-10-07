import { env } from 'cloudflare:workers';
import type { Library, Prompt } from './prompt-model';
import { updateSchema } from './prompt-model';
import { seedPrompts } from './seed-prompts';

function database() {
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

export async function updateLibrary(input: unknown) {
  const { prompts, discoverySucceeded } = updateSchema.parse(input);
  const db = database();
  const writes = prompts.map(prompt => db.prepare(`
    INSERT INTO prompts (tweet_id, title, command, published_at, prompt_text, text_origin)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(tweet_id) DO UPDATE SET title=excluded.title, command=excluded.command,
      published_at=excluded.published_at,
      prompt_text=COALESCE(excluded.prompt_text, prompts.prompt_text),
      text_origin=COALESCE(excluded.text_origin, prompts.text_origin)
  `).bind(prompt.tweetId, prompt.title, prompt.command, prompt.publishedAt, prompt.text, prompt.textOrigin));
  if (discoverySucceeded) writes.push(db.prepare("INSERT INTO refresh_state (id, last_checked_at) VALUES ('discovery', ?) ON CONFLICT(id) DO UPDATE SET last_checked_at=excluded.last_checked_at").bind(new Date().toISOString()));
  if (writes.length) await db.batch(writes);
  return readLibrary();
}
