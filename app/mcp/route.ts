import { env } from 'cloudflare:workers';
import { ZodError } from 'zod';
import { canEdit } from '@/lib/prompt-model';
import { readLibrary, updateLibrary } from '@/lib/library-store';

const tools = [
  { name: 'get_prompt_library', description: 'Read the public prompt index, exact available prompt text, and the last successful discovery time.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'update_prompt_library', description: 'Owner-only: atomically add verified Matt Pocock Prompt of the Day entries. Deduplicates by tweet ID. Preserve exact supplied prompt text and line breaks; no rewrites. Use null text and textOrigin when a full original is unavailable. Supply full text only from user-provided or explicitly licensed material, or complete original prompts of at most 25 words. Set discoverySucceeded true only after successful source discovery, including no-new-post results. A failed search must not update freshness.', inputSchema: {
    type: 'object', required: ['prompts', 'discoverySucceeded'], additionalProperties: false,
    properties: { discoverySucceeded: { type: 'boolean' }, prompts: { type: 'array', maxItems: 50, items: {
      type: 'object', additionalProperties: false, required: ['tweetId', 'title', 'command', 'publishedAt', 'text', 'textOrigin'],
      properties: { tweetId: { type: 'string', pattern: '^\\d{18,20}$' }, title: { type: 'string', maxLength: 120 }, command: { type: ['string', 'null'], maxLength: 100 }, publishedAt: { type: 'string', format: 'date-time' }, text: { type: ['string', 'null'], maxLength: 20000 }, textOrigin: { enum: ['user-provided', 'licensed-source', 'short-original', null] } },
    } } },
  } },
];

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
  if (!['get_prompt_library', 'update_prompt_library'].includes(call.params?.name)) return error(-32602, 'Unknown tool');
  if (call.params.name === 'update_prompt_library' && !canEdit(env.LIBRARY_EDITOR_EMAIL, request.headers.get('oai-authenticated-user-id'), request.headers.get('oai-authenticated-user-email'))) return new Response('Owner authentication required', { status: 403 });
  try {
    const library = call.params.name === 'get_prompt_library' ? await readLibrary() : await updateLibrary(call.params.arguments);
    return result({ content: [{ type: 'text', text: JSON.stringify(library) }], structuredContent: library });
  } catch (failure) {
    return result({ isError: true, content: [{ type: 'text', text: failure instanceof ZodError ? 'Invalid prompt records. Check required fields, dates, duplicate IDs, and text source classifications.' : 'Library storage is temporarily unavailable. Retry without changing the records.' }] });
  }
}

export async function GET() { return new Response(null, { status: 405, headers: { Allow: 'POST' } }); }
