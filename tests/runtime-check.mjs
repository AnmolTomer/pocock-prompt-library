import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// Deliberately fixed loopback target: never run synthetic identity checks against production.
const base = 'http://127.0.0.1:5173';
const call = (name, args, headers = {}) => fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) });
const initial = await (await fetch(`${base}/api/library`)).json();
const runId = randomUUID();
const start = { runId, trigger: 'verification' };
for (const name of ['start_collection_run', 'finish_collection_run', 'get_collection_runs']) {
  assert.equal((await call(name, start)).status, 403);
  assert.equal((await call(name, start, { 'oai-authenticated-user-id': 'someone', 'oai-authenticated-user-email': 'other@sites.test' })).status, 403);
}
const signIn = await fetch(`${base}/signin-with-chatgpt?return_to=/`, { redirect: 'manual' });
const cookie = signIn.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie, 'Local-only mock sign-in should return a test cookie');
const owner = { Cookie: cookie };
async function ownerCall(name, args) {
  const response = await call(name, args, owner);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.result?.isError, undefined, JSON.stringify(body));
  return body.result.structuredContent;
}
assert.equal((await ownerCall('start_collection_run', start)).status, 'running');
const finish = { runId, outcome: 'verified', prompts: [], queries: [], checkedTweetIds: [], unresolvedTweetIds: [], errorCode: null };
assert.equal((await ownerCall('finish_collection_run', finish)).status, 'verified');
assert.equal((await ownerCall('finish_collection_run', finish)).status, 'verified');
assert.equal((await ownerCall('get_collection_runs', { runId })).runs[0].status, 'verified');
assert.deepEqual(await (await fetch(`${base}/api/library`)).json(), initial);
const invalid = await (await call('start_collection_run', { ...start, runId: 'bad' }, owner)).json();
assert.equal(invalid.result.isError, true);
assert.equal((await fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(250001) })).status, 400);
assert.equal((await call('start_collection_run', start, { ...owner, Origin: 'https://foreign.invalid' })).status, 403);
assert.match(await (await fetch(`${base}/api/collection-instructions`)).text(), /revision 1/);
console.log('PASS: owner-only starts, finishes and history; authorized local persistence/readback; idempotent finish; unchanged prompts and freshness; validation/body/origin rejection; collection instructions. Local synthetic identity only.');
