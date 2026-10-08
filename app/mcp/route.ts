import { env } from 'cloudflare:workers';
import { z, ZodError } from 'zod';
import { canEdit } from '@/lib/prompt-model';
import { database, readLibrary } from '@/lib/library-store';
import { CollectionConflict, finishRun, listRuns, readRun, startRun } from '@/lib/collection-store';
import { seedPrompts } from '@/lib/seed-prompts';
import { collectionGuide } from '@/lib/collection-guide';

const noArguments = { type: 'object', properties: {}, additionalProperties: false };
const idList = { type: 'array', maxItems: 100, items: { type: 'string', pattern: '^\\d{18,20}$' } };
const tools = [
  { name: 'get_prompt_library', description: 'Read published prompts and the last successful search time.', inputSchema: noArguments },
  { name: 'update_prompt_library', description: 'Compatibility check for older connected clients. Only prompts:[] and discoverySucceeded:false are accepted. Records an owner-authenticated verification run and returns its persisted result without changing prompts or discovery freshness. For collection, refresh tools and use start_collection_run and finish_collection_run.', inputSchema: {
    type: 'object', required: ['prompts', 'discoverySucceeded'], additionalProperties: false,
    properties: { prompts: { type: 'array', maxItems: 0, items: { type: 'object' } }, discoverySucceeded: { type: 'boolean', const: false } },
  } },
  { name: 'get_collection_instructions', description: 'Read the current daily/manual collection procedure before running it.', inputSchema: noArguments },
  { name: 'get_collection_runs', description: 'Owner-only: read the latest 100 collection runs, including successful empty checks. Optionally read one run by ID.', inputSchema: { type: 'object', properties: { runId: { type: 'string', format: 'uuid' } }, additionalProperties: false } },
  { name: 'start_collection_run', description: 'Owner-only: record a run before searching. Reuse the same UUID for retries. Returns the search window. One run at a time; abandoned runs expire after one hour. Verification runs only test persistence and never advance discovery freshness.', inputSchema: {
    type: 'object', required: ['runId', 'trigger'], additionalProperties: false,
    properties: { runId: { type: 'string', format: 'uuid' }, trigger: { enum: ['scheduled', 'manual', 'verification'] } },
  } },
  { name: 'finish_collection_run', description: 'Owner-only: atomically save complete verified new prompts and finish a run. Existing complete prompts are immutable through collection. Success with no additions records no_changes. Failures and incomplete retrieval never advance freshness. Retry the same run ID after an uncertain response; terminal runs are immutable. Never store secrets in search evidence.', inputSchema: {
    type: 'object', required: ['runId', 'outcome', 'prompts', 'queries', 'checkedTweetIds', 'unresolvedTweetIds', 'errorCode'], additionalProperties: false,
    properties: {
      runId: { type: 'string', format: 'uuid' }, outcome: { enum: ['success', 'incomplete', 'failed', 'verified'] },
      queries: { type: 'array', maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 500 } },
      checkedTweetIds: idList, unresolvedTweetIds: idList,
      errorCode: { enum: ['search_unavailable', 'source_unavailable', 'text_unavailable', 'verification_failed', null] },
      prompts: { type: 'array', maxItems: 50, items: {
        type: 'object', additionalProperties: false, required: ['tweetId', 'title', 'command', 'publishedAt', 'text', 'textOrigin'],
        properties: {
          tweetId: { type: 'string', pattern: '^\\d{18,20}$' }, title: { type: 'string', minLength: 1, maxLength: 120 },
          command: { type: ['string', 'null'], maxLength: 100 }, publishedAt: { type: 'string', format: 'date-time' },
          text: { type: 'string', minLength: 1, maxLength: 20000 }, textOrigin: { enum: ['user-provided', 'licensed-source', 'short-original'] },
        },
      } },
    },
  } },
];

async function callTool(name: string, args: unknown): Promise<unknown> {
  switch (name) {
    case 'get_prompt_library': return readLibrary();
    case 'update_prompt_library': {
      z.object({ prompts: z.array(z.never()).max(0), discoverySucceeded: z.literal(false) }).strict().parse(args);
      const runId = crypto.randomUUID();
      const db = database();
      await startRun(db, { runId, trigger: 'verification' });
      const verificationRun = await finishRun(db, seedPrompts, {
        runId, outcome: 'verified', prompts: [], queries: [], checkedTweetIds: [], unresolvedTweetIds: [], errorCode: null,
      });
      return { ...await readLibrary(), verificationRun };
    }
    case 'get_collection_instructions': return { instructions: collectionGuide };
    case 'get_collection_runs': {
      const { runId } = z.object({ runId: z.string().uuid().optional() }).strict().parse(args ?? {});
      if (!runId) return { runs: await listRuns(database()) };
      const run = await readRun(database(), runId);
      return { runs: run ? [run] : [] };
    }
    case 'start_collection_run': return startRun(database(), args);
    case 'finish_collection_run': return finishRun(database(), seedPrompts, args);
    default: throw new Error('Unknown tool');
  }
}

async function boundedJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('content-type');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 250000) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(data));
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return new Response('Forbidden', { status: 403 });
  let call;
  try { call = await boundedJson(request); } catch { return new Response('Invalid request', { status: 400 }); }
  if (!call || call.jsonrpc !== '2.0' || typeof call.method !== 'string' || (call.id !== undefined && call.id !== null && typeof call.id !== 'string' && typeof call.id !== 'number')) return new Response('Invalid request', { status: 400 });
  if (call.id === undefined) return new Response(null, { status: 202 });
  const result = (value: unknown) => Response.json({ jsonrpc: '2.0', id: call.id, result: value }, { headers: { 'Cache-Control': 'no-store' } });
  const error = (code: number, message: string) => Response.json({ jsonrpc: '2.0', id: call.id, error: { code, message } });
  if (call.method === 'initialize') return result({ protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'prompt-library', version: '1.0.0' } });
  if (call.method === 'ping') return result({});
  if (call.method === 'tools/list') return result({ tools });
  if (call.method !== 'tools/call') return error(-32601, 'Method not found');
  if (!tools.some(tool => tool.name === call.params?.name)) return error(-32602, 'Unknown tool');
  if (!['get_prompt_library', 'get_collection_instructions'].includes(call.params.name) && !canEdit(env.LIBRARY_EDITOR_EMAIL, request.headers.get('oai-authenticated-user-id'), request.headers.get('oai-authenticated-user-email'))) return new Response('Owner authentication required', { status: 403 });
  try {
    const library = await callTool(call.params.name, call.params.arguments);
    return result({ content: [{ type: 'text', text: JSON.stringify(library) }], structuredContent: library });
  } catch (failure) {
    return result({ isError: true, content: [{ type: 'text', text: failure instanceof ZodError ? 'Invalid collection input: ' + failure.issues.map(issue => issue.message).join(' ') : failure instanceof CollectionConflict ? failure.message : 'Library storage is temporarily unavailable. Retry with the same run ID.' }] });
  }
}

export async function GET() { return new Response(null, { status: 405, headers: { Allow: 'POST' } }); }
