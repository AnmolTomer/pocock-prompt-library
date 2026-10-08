import { z } from 'zod';

export const promptSchema = z.object({
  tweetId: z.string().regex(/^\d{18,20}$/),
  title: z.string().trim().min(1).max(120),
  command: z.string().trim().max(100).nullable(),
  publishedAt: z.string().datetime(),
  text: z.string().min(1).max(20000).refine(value => value.trim().length > 0).nullable(),
  textOrigin: z.enum(['user-provided', 'licensed-source', 'short-original']).nullable(),
}).strict().superRefine((prompt, context) => {
  if ((prompt.text === null) !== (prompt.textOrigin === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Text and its source classification must be provided together.' });
  }
  if (prompt.textOrigin === 'short-original' && prompt.text !== null && prompt.text.trim().split(/\s+/).length > 25) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Short originals must be at most 25 words.' });
  }
  if (Date.parse(prompt.publishedAt) > Date.now() + 60000 || Date.parse(prompt.publishedAt) < Date.parse('2026-09-07T00:00:00Z')) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Publication date is outside this archive’s collection window.' });
  }
});

export type Prompt = z.infer<typeof promptSchema>;
export type Library = { prompts: Prompt[]; lastCheckedAt: string | null };
export const sourceUrl = (tweetId: string) => `https://x.com/mattpocockuk/status/${tweetId}`;

export function canEdit(editorEmail: string | undefined, userId: string | null, userEmail: string | null) {
  return Boolean(editorEmail && userId && userEmail && editorEmail.toLowerCase() === userEmail.toLowerCase());
}
