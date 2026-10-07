import type { Prompt } from './prompt-model';

export const seedPrompts: Prompt[] = [
  { tweetId: '2107433940638457866', publishedAt: '2026-10-06T11:33:00Z', title: 'Clear up agent instructions', command: '/writing-for-agents', text: null, textOrigin: null },
  { tweetId: '2107077843859513769', publishedAt: '2026-10-05T11:58:00Z', title: 'Learn from review comments', command: '/retro', text: null, textOrigin: null },
  { tweetId: '2106730768789602313', publishedAt: '2026-10-04T12:58:51Z', title: 'Review the skills update', command: null, text: null, textOrigin: null },
  { tweetId: '2105951409887949107', publishedAt: '2026-10-02T09:21:57Z', title: 'Make a repo easier to navigate', command: '/retro', text: null, textOrigin: null },
  { tweetId: '2105563604384915639', publishedAt: '2026-10-01T07:40:57Z', title: 'Find unnecessary abstractions', command: '/codebase-design', text: '/codebase-design Take a look in the repo for shallow modules, applying the deletion test and look for candidates for deletion.', textOrigin: 'short-original' },
];
