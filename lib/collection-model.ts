import { z } from 'zod';
import { promptSchema } from './prompt-model.ts';

export const startRunSchema = z.object({
  runId: z.string().uuid(),
  trigger: z.enum(['scheduled', 'manual', 'verification']),
}).strict();

const tweetIds = z.array(z.string().regex(/^\d{18,20}$/)).max(100);
export const finishRunSchema = z.object({
  runId: z.string().uuid(),
  outcome: z.enum(['success', 'incomplete', 'failed', 'verified']),
  prompts: z.array(promptSchema).max(50),
  queries: z.array(z.string().trim().min(1).max(500)).max(12),
  checkedTweetIds: tweetIds,
  unresolvedTweetIds: tweetIds,
  errorCode: z.enum(['search_unavailable', 'source_unavailable', 'text_unavailable', 'verification_failed']).nullable(),
}).strict().superRefine((run, context) => {
  function reject(message: string): void {
    context.addIssue({ code: z.ZodIssueCode.custom, message });
  }
  if (new Set(run.prompts.map(prompt => prompt.tweetId)).size !== run.prompts.length) reject('Duplicate prompt IDs.');
  if (run.prompts.some(prompt => prompt.text === null || prompt.textOrigin === null)) reject('Collection accepts complete original text only.');
  if (run.prompts.some(prompt => !run.checkedTweetIds.includes(prompt.tweetId) || run.unresolvedTweetIds.includes(prompt.tweetId))) reject('Every submitted prompt must have a checked, resolved original post.');
  if (run.outcome === 'success' && (run.errorCode !== null || run.unresolvedTweetIds.length)) reject('Unresolved posts or errors cannot be reported as success.');
  if (['success', 'incomplete'].includes(run.outcome) && !run.queries.length) reject('Record the searches actually performed.');
  if (['failed', 'incomplete'].includes(run.outcome) && run.errorCode === null) reject('Record a failure reason.');
  if (['failed', 'verified'].includes(run.outcome) && (run.prompts.length || run.checkedTweetIds.length || run.unresolvedTweetIds.length || run.queries.length)) reject('Failed runs and connection checks cannot publish prompts or claim discovery.');
  if (run.outcome === 'verified' && run.errorCode !== null) reject('A successful connection check cannot have an error.');
});

export type CollectionRun = {
  id: string;
  trigger: 'scheduled' | 'manual' | 'verification';
  status: 'running' | 'no_changes' | 'updated' | 'incomplete' | 'failed' | 'verified';
  startedAt: string;
  finishedAt: string | null;
  searchFrom: string;
  searchTo: string;
  addedCount: number;
  evidence: string | null;
  errorCode: string | null;
};

export function searchWindow(lastCheckedAt: string | null, now: Date): { from: string; to: string } {
  const anchor = lastCheckedAt ? Date.parse(lastCheckedAt) : now.getTime();
  const days = lastCheckedAt ? 7 : 30;
  const from = Math.max(Date.parse('2026-09-07T00:00:00Z'), anchor - days * 86400000);
  return { from: new Date(from).toISOString(), to: now.toISOString() };
}
