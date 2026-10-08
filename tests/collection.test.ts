import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { finishRunSchema, searchWindow } from '../lib/collection-model.ts';
import { finishRun, listRuns, startRun } from '../lib/collection-store.ts';
import { promptSchema } from '../lib/prompt-model.ts';

const now = new Date('2026-10-07T12:00:00Z');
const prompt = { tweetId: '2107433940638457866', title: 'Synthetic test prompt', command: '/test', publishedAt: '2026-10-06T11:33:00Z', text: '  /test preserve this.\n\n- Keep punctuation!  ', textOrigin: 'user-provided' as const };

// D1-shaped transport over a real disposable SQLite database: production SQL and migrations execute unchanged.
function database(): { db: D1Database; sql: DatabaseSync } {
  const sql = new DatabaseSync(':memory:');
  for (const file of readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort()) sql.exec(readFileSync(`drizzle/${file}`, 'utf8'));
  function prepare(query: string) {
    let values: (string | number | null)[] = [];
    const operation = {
      bind(...args: typeof values) { values = args; return operation; },
      async first() { return sql.prepare(query).get(...values) ?? null; },
      async all() { return { results: sql.prepare(query).all(...values) }; },
    };
    return operation;
  }
  const db = {
    prepare,
    async batch(operations: ReturnType<typeof prepare>[]) {
      sql.exec('BEGIN');
      try {
        const results = [];
        for (const operation of operations) results.push(await operation.all());
        sql.exec('COMMIT');
        return results;
      } catch (error) {
        sql.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as D1Database;
  return { db, sql };
}

function finishInput(runId: string) {
  return { runId, outcome: 'success', prompts: [], queries: ['synthetic fixture query'], checkedTweetIds: [], unresolvedTweetIds: [], errorCode: null };
}

test('successful empty checks persist a run and freshness without prompt changes', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'scheduled' }, now);
  const result = await finishRun(db, [], finishInput(runId), now);
  assert.equal(result.status, 'no_changes');
  assert.equal(result.addedCount, 0);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM prompts').get()?.n, 0);
  assert.equal(sql.prepare('SELECT last_checked_at AS checked FROM refresh_state').get()?.checked, now.toISOString());
  assert.equal((await listRuns(db)).length, 1);
  sql.close();
});

test('manual addition preserves exact text; retry and later discovery do not duplicate or overwrite', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'manual' }, now);
  const input = { ...finishInput(runId), prompts: [prompt], checkedTweetIds: [prompt.tweetId] };
  assert.equal((await finishRun(db, [], input, now)).addedCount, 1);
  assert.equal((await finishRun(db, [], input, now)).addedCount, 1);
  assert.equal(sql.prepare('SELECT prompt_text AS text FROM prompts').get()?.text, prompt.text);
  const nextId = randomUUID();
  await startRun(db, { runId: nextId, trigger: 'scheduled' }, now);
  const next = await finishRun(db, [], { ...input, runId: nextId, prompts: [{ ...prompt, text: 'must not overwrite' }] }, now);
  assert.equal(next.status, 'no_changes');
  assert.equal(sql.prepare('SELECT prompt_text AS text FROM prompts').get()?.text, prompt.text);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM prompts').get()?.n, 1);
  sql.close();
});

test('incomplete and failed checks persist reasons without advancing freshness', async () => {
  const { db, sql } = database();
  for (const outcome of ['incomplete', 'failed']) {
    const runId = randomUUID();
    await startRun(db, { runId, trigger: 'scheduled' }, now);
    const input = { ...finishInput(runId), outcome, queries: outcome === 'failed' ? [] : ['fixture'], errorCode: outcome === 'failed' ? 'search_unavailable' : 'text_unavailable' };
    assert.equal((await finishRun(db, [], input, now)).status, outcome);
  }
  assert.equal(sql.prepare('SELECT count(*) AS n FROM refresh_state').get()?.n, 0);
  assert.equal((await listRuns(db)).length, 2);
  sql.close();
});

test('unresolved and missing full bodies cannot be published or reported successful', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'manual' }, now);
  assert.equal(finishRunSchema.safeParse({ ...finishInput(runId), prompts: [{ ...prompt, text: null, textOrigin: null }] }).success, false);
  assert.equal(finishRunSchema.safeParse({ ...finishInput(runId), unresolvedTweetIds: [prompt.tweetId] }).success, false);
  await assert.rejects(finishRun(db, [], { ...finishInput(runId), checkedTweetIds: [prompt.tweetId] }, now), /no complete prompt/);
  assert.equal(promptSchema.safeParse({ ...prompt, text: null, textOrigin: 'short-original' }).success, false);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM prompts').get()?.n, 0);
  sql.close();
});

test('connection checks persist separately and never claim a discovery run', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'verification' }, now);
  await assert.rejects(finishRun(db, [], finishInput(runId), now), /separate/);
  const result = await finishRun(db, [], { ...finishInput(runId), outcome: 'verified', queries: [] }, now);
  assert.equal(result.status, 'verified');
  assert.equal(sql.prepare('SELECT count(*) AS n FROM refresh_state').get()?.n, 0);
  sql.close();
});

test('active runs exclude concurrent starts and expired runs reject late writes', async () => {
  const { db, sql } = database();
  const first = randomUUID();
  const second = randomUUID();
  await startRun(db, { runId: first, trigger: 'manual' }, now);
  assert.equal((await startRun(db, { runId: first, trigger: 'manual' }, now)).id, first);
  await assert.rejects(startRun(db, { runId: second, trigger: 'scheduled' }, now), /active/);
  await startRun(db, { runId: second, trigger: 'scheduled' }, new Date(now.getTime() + 3600001));
  const late = await finishRun(db, [], { ...finishInput(first), prompts: [prompt], checkedTweetIds: [prompt.tweetId] }, now);
  assert.equal(late.status, 'failed');
  assert.equal(late.errorCode, 'timed_out');
  assert.equal(sql.prepare('SELECT count(*) AS n FROM prompts').get()?.n, 0);
  sql.close();
});

test('partial progress saves complete prompts; seeded originals never count as additions', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'manual' }, now);
  const input = { ...finishInput(runId), outcome: 'incomplete', prompts: [prompt], checkedTweetIds: [prompt.tweetId], unresolvedTweetIds: ['2107077843859513769'], errorCode: 'text_unavailable' };
  assert.equal((await finishRun(db, [], input, now)).addedCount, 1);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM refresh_state').get()?.n, 0);
  const nextId = randomUUID();
  await startRun(db, { runId: nextId, trigger: 'manual' }, now);
  assert.equal((await finishRun(db, [prompt], { ...finishInput(nextId), prompts: [prompt], checkedTweetIds: [prompt.tweetId] }, now)).addedCount, 0);
  sql.close();
});

test('search windows overlap seven days and first collection covers thirty days', () => {
  assert.equal(searchWindow(null, now).from, '2026-09-07T12:00:00.000Z');
  assert.equal(searchWindow('2026-10-06T12:00:00Z', now).from, '2026-09-29T12:00:00.000Z');
});

test('invalid batches are rejected and database failures roll back all writes', async () => {
  const { db, sql } = database();
  const runId = randomUUID();
  await startRun(db, { runId, trigger: 'manual' }, now);
  const input = { ...finishInput(runId), prompts: [prompt, prompt], checkedTweetIds: [prompt.tweetId] };
  assert.equal(finishRunSchema.safeParse(input).success, false);
  assert.equal(finishRunSchema.safeParse({ ...finishInput(runId), unexpected: true }).success, false);
  assert.equal(finishRunSchema.safeParse({ ...input, prompts: Array(51).fill(prompt) }).success, false);
  sql.exec("CREATE TRIGGER simulate_storage_failure BEFORE UPDATE ON collection_runs BEGIN SELECT RAISE(ABORT, 'fixture failure'); END;");
  await assert.rejects(finishRun(db, [], { ...input, prompts: [prompt] }, now), /fixture failure/);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM prompts').get()?.n, 0);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM refresh_state').get()?.n, 0);
  assert.equal(sql.prepare('SELECT status FROM collection_runs').get()?.status, 'running');
  sql.close();
});
