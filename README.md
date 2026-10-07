# Prompt Library

A public index of Matt Pocock's Prompt of the Day posts. The reader displays official X embeds. Where an exact prompt body is stored, Copy prompt copies it without rewriting whitespace or punctuation. X can shorten long embedded posts; those link to the full original.

## Local development

Use Node 22.13+ and pnpm. The Sites execution profile is checkout-local and ignored. Run the Sites install-dependencies helper for this starter, then `make dev`. Local D1 state lives in `.wrangler/state`; hosted data is separate.

Set `LIBRARY_EDITOR_EMAIL` in ignored `.dev.vars` to a synthetic local identity for writer testing. Production uses the Sites runtime secret of the same name. Never copy hosted secrets into the checkout. Local mock identity does not establish production authorization.

Run `make build` before a fresh local database setup, then apply `drizzle/0000_purple_midnight.sql` with Wrangler's local D1 execute using `dist/server/wrangler.json` and `.wrangler/state`. Sites applies packaged migrations during publication.

## Checks

`make check`, `make test`, and `make build` validate types, input/identity rules, and the Worker build. `node tests/runtime-check.mjs` additionally tests the running local server and uses disposable local fixtures; inspect its host and synthetic identity before running it.

Browser QA covers desktop/mobile reading, original-post loading, selection, search/empty state, back navigation, and exact clipboard equality. Use the owner's required Chrome profile.

## Data and boundaries

`lib/prompt-model.ts` validates entries. `lib/library-store.ts` performs parameterized D1 updates, deduplicates by tweet ID, preserves existing text on metadata-only updates, and advances freshness only on successful discovery. `app/mcp/route.ts` exposes public reads and owner-only writes using trusted Sites request identity plus configured editor email. Anonymous visitors cannot update the archive.

The initial index has five verified posts from October 1–6, 2026. Discovery covered September 7–October 7 but does not establish exhaustive coverage. Only one prompt body is currently stored. Do not claim all entries have copyable text or that daily updates are enabled without a saved and verified schedule.

## Daily refresh

See `REFRESH.md`. Publication and recurring automation are separate: deploy the Site, connect its provisioned plugin, verify a tool write and persisted readback, then create the daily linked schedule. Do not expose an anonymous write endpoint or use a service bypass token as proof of owner identity.

## Reading order

1. `lib/prompt-model.ts` and `db/schema.ts`
2. `lib/library-store.ts` and `lib/seed-prompts.ts`
3. `app/library.tsx` and `app/original-post.tsx`
4. `app/mcp/route.ts` and `REFRESH.md`
