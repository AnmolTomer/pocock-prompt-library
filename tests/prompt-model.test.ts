import assert from 'node:assert/strict';
import test from 'node:test';
import { canEdit, promptSchema, sourceUrl } from '../lib/prompt-model.ts';

const prompt = { tweetId: '2107433940638457866', title: 'A supplied prompt', command: '/test', publishedAt: '2026-10-06T11:33:00Z', text: '  /test preserve this.\n\n- Keep line breaks\n- Keep punctuation!  ', textOrigin: 'user-provided' };

test('preserves supplied prompt bytes, including whitespace', () => {
  assert.equal(promptSchema.parse(prompt).text, prompt.text);
});

test('rejects malformed IDs, missing provenance, and empty bodies', () => {
  for (const input of [{ ...prompt, tweetId: '../evil' }, { ...prompt, textOrigin: null }, { ...prompt, text: ' \n ' }, { ...prompt, title: '' }, { ...prompt, publishedAt: '2030-01-01T00:00:00Z' }]) assert.equal(promptSchema.safeParse(input).success, false);
  assert.equal(promptSchema.safeParse({ ...prompt, text: null, textOrigin: null }).success, true);
});

test('denies absent identity, wrong owner, and missing editor configuration', () => {
  assert.equal(canEdit(undefined, 'owner', 'owner@example.test'), false);
  assert.equal(canEdit('owner@example.test', null, 'owner@example.test'), false);
  assert.equal(canEdit('owner@example.test', 'visitor', 'other@example.test'), false);
  assert.equal(canEdit('owner@example.test', 'owner', null), false);
  assert.equal(canEdit('owner@example.test', 'owner', 'OWNER@example.test'), true);
});

test('source links stay on the fixed author and X origin', () => {
  assert.equal(sourceUrl(prompt.tweetId), 'https://x.com/mattpocockuk/status/2107433940638457866');
});
