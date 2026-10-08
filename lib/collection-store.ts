import { finishRunSchema, searchWindow, startRunSchema } from './collection-model.ts';
import type { CollectionRun } from './collection-model.ts';
import type { Prompt } from './prompt-model.ts';

const runColumns = `id, trigger, status, started_at AS startedAt, finished_at AS finishedAt,
  search_from AS searchFrom, search_to AS searchTo, added_count AS addedCount,
  evidence, error_code AS errorCode`;

export class CollectionConflict extends Error {}

export async function readRun(db: D1Database, runId: string): Promise<CollectionRun | null> {
  return db.prepare(`SELECT ${runColumns} FROM collection_runs WHERE id = ?`).bind(runId).first<CollectionRun>();
}

export async function listRuns(db: D1Database): Promise<CollectionRun[]> {
  const result = await db.prepare(`SELECT ${runColumns} FROM collection_runs ORDER BY started_at DESC, id DESC LIMIT 100`).all<CollectionRun>();
  return result.results;
}

export async function startRun(db: D1Database, input: unknown, now = new Date()): Promise<CollectionRun> {
  const { runId, trigger } = startRunSchema.parse(input);
  const previous = await readRun(db, runId);
  if (previous) return previous;
  const refresh = await db.prepare("SELECT last_checked_at AS checked FROM refresh_state WHERE id = 'discovery'").first<{ checked: string }>();
  const window = searchWindow(refresh?.checked ?? null, now);
  const timestamp = now.toISOString();
  await db.batch([
    db.prepare("UPDATE collection_runs SET status = 'failed', error_code = 'timed_out', finished_at = ? WHERE status = 'running' AND started_at < ?")
      .bind(timestamp, new Date(now.getTime() - 3600000).toISOString()),
    db.prepare(`INSERT INTO collection_runs (id, trigger, status, started_at, search_from, search_to)
      SELECT ?, ?, 'running', ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM collection_runs WHERE status = 'running')
      ON CONFLICT(id) DO NOTHING`).bind(runId, trigger, timestamp, window.from, window.to),
  ]);
  const run = await readRun(db, runId);
  if (!run) throw new CollectionConflict('Another collection run is active. Do not start another search.');
  return run;
}

export async function finishRun(db: D1Database, seeds: Prompt[], input: unknown, now = new Date()): Promise<CollectionRun> {
  const result = finishRunSchema.parse(input);
  const run = await readRun(db, result.runId);
  if (!run) throw new CollectionConflict('Start this run before finishing it.');
  if (run.status !== 'running') return run;
  if ((run.trigger === 'verification') !== (result.outcome === 'verified') && result.outcome !== 'failed') {
    throw new CollectionConflict('Connection checks and real collection runs are separate.');
  }
  const existing = await db.prepare('SELECT tweet_id AS tweetId, prompt_text AS text FROM prompts').all<{ tweetId: string; text: string | null }>();
  const completeIds = new Set(seeds.filter(prompt => prompt.text).map(prompt => prompt.tweetId));
  for (const prompt of existing.results) if (prompt.text) completeIds.add(prompt.tweetId);
  const additions = result.prompts.filter(prompt => !completeIds.has(prompt.tweetId));
  const suppliedIds = new Set(additions.map(prompt => prompt.tweetId));
  if (result.outcome === 'success' && result.checkedTweetIds.some(id => !completeIds.has(id) && !suppliedIds.has(id))) {
    throw new CollectionConflict('A checked new post has no complete prompt. Record an incomplete run instead.');
  }
  const status = result.outcome === 'success' ? (additions.length ? 'updated' : 'no_changes') : result.outcome;
  const evidence = JSON.stringify({ queries: result.queries, checkedTweetIds: result.checkedTweetIds, unresolvedTweetIds: result.unresolvedTweetIds });
  // Every write is guarded by the same running record; a retried or late finish cannot publish twice.
  const writes = additions.map(prompt => db.prepare(`INSERT INTO prompts (tweet_id, title, command, published_at, prompt_text, text_origin)
    SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM collection_runs WHERE id = ? AND status = 'running')
    ON CONFLICT(tweet_id) DO UPDATE SET title=excluded.title, command=excluded.command,
      published_at=excluded.published_at, prompt_text=excluded.prompt_text, text_origin=excluded.text_origin
    WHERE prompts.prompt_text IS NULL`).bind(prompt.tweetId, prompt.title, prompt.command, prompt.publishedAt, prompt.text, prompt.textOrigin, run.id));
  if (result.outcome === 'success') {
    writes.push(db.prepare(`INSERT INTO refresh_state (id, last_checked_at)
      SELECT 'discovery', ? WHERE EXISTS (SELECT 1 FROM collection_runs WHERE id = ? AND status = 'running')
      ON CONFLICT(id) DO UPDATE SET last_checked_at = MAX(refresh_state.last_checked_at, excluded.last_checked_at)`).bind(run.searchTo, run.id));
  }
  writes.push(db.prepare(`UPDATE collection_runs SET status = ?, finished_at = ?, added_count = ?, evidence = ?, error_code = ?
    WHERE id = ? AND status = 'running'`).bind(status, now.toISOString(), additions.length, evidence, result.errorCode, run.id));
  await db.batch(writes);
  return (await readRun(db, run.id))!;
}
