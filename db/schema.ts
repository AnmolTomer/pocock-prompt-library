import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
