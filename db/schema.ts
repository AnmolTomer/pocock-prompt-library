import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const prompts = sqliteTable('prompts', {
  tweetId: text('tweet_id').primaryKey(),
  title: text('title').notNull(),
  command: text('command'),
  publishedAt: text('published_at').notNull(),
  text: text('prompt_text'),
  textOrigin: text('text_origin'),
});

export const refreshState = sqliteTable('refresh_state', {
  id: text('id').primaryKey(),
  lastCheckedAt: text('last_checked_at').notNull(),
});

export const collectionRuns = sqliteTable('collection_runs', {
  id: text('id').primaryKey(),
  trigger: text('trigger').notNull(),
  status: text('status').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  searchFrom: text('search_from').notNull(),
  searchTo: text('search_to').notNull(),
  addedCount: integer('added_count').notNull().default(0),
  evidence: text('evidence'),
  errorCode: text('error_code'),
});
