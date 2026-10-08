# Prompt Library

A public index of Matt Pocock's Prompt of the Day posts. The journal displays complete stored prompt text by default. Copy prompt preserves whitespace and punctuation. Each entry links to the original post.

## Local development

Use Node 22.13+ and pnpm. The Sites execution profile is checkout-local and ignored. Run the Sites install-dependencies helper for this starter, then `make dev`. Local D1 state lives in `.wrangler/state`; hosted data is separate.

Set `LIBRARY_EDITOR_EMAIL` in ignored `.dev.vars` to a synthetic local identity for writer testing. Production uses the Sites runtime secret of the same name. Never copy hosted secrets into the checkout. Local mock identity does not establish production authorization.

Run `make build` before a fresh local database setup, then apply pending `drizzle/*.sql` migrations in order with Wrangler's local D1 execute using `dist/server/wrangler.json` and `.wrangler/state`. Sites applies packaged migrations during publication.

## Checks

`make check`, `make test`, and `make build` validate types, input/identity rules, and the Worker build. `node tests/runtime-check.mjs` additionally tests the running local server and uses disposable local fixtures; inspect its host and synthetic identity before running it.

Browser QA covers desktop/mobile reading, original-post loading, selection, search/empty state, back navigation, and exact clipboard equality. Use the owner's required Chrome profile.

## Data and boundaries

`lib/prompt-model.ts` validates entries. `lib/library-store.ts` reads the public library. `lib/collection-store.ts` atomically stores new complete prompts and run history, deduplicates by tweet ID, preserves existing complete text, and advances freshness only on successful discovery. `app/mcp/route.ts` exposes public reads and owner-only collection and history using trusted Sites request identity plus configured editor email. Anonymous visitors cannot update the archive.

The initial index has five verified posts from October 1–6, 2026. Discovery covered September 7–October 7 but does not establish exhaustive coverage. All five initial entries have exact stored text. The owner supplied the October 2, 4, 5, and 6 blocks, including closing commentary. Do not trim or rewrite these when copying. Do not claim daily updates are enabled without a saved and verified schedule.

## Daily refresh

See `REFRESH.md`. Publication and recurring automation are separate: deploy the Site, connect its provisioned plugin, verify a tool write and persisted readback, then create the daily linked schedule for 17:00 Asia/Kolkata. The same collector can be invoked manually through the connected agent. Read `REFRESH.md` for invocation and run-status semantics. Do not expose an anonymous write endpoint or use a service bypass token as proof of owner identity.

## Reading order

1. `lib/prompt-model.ts` and `db/schema.ts`
2. `lib/library-store.ts`, `lib/collection-model.ts`, `lib/collection-store.ts` and `lib/seed-prompts.ts`
3. `app/library.tsx` and `app/original-post.tsx`
4. `app/mcp/route.ts` and `REFRESH.md`
