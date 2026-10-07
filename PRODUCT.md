# Prompt Library

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

People using coding agents browse Matt Pocock’s Prompt of the Day posts, find a useful prompt, and copy its original text. The site is public without sign-in.

## Capabilities and constraints

- Search prompt titles, commands, original text, and dates; browse by month.
- Copy the stored original text exactly, including punctuation and line breaks. Never substitute generated summaries for the clipboard payload.
- Keep links to the original posts and the personal GitHub repository.
- The initial archive covers the preceding 30 days; public discovery may be incomplete. Do not imply an active daily collector without verifying it.
- Preserve the existing server storage and owner-only write boundary. UI changes do not authorize changing access controls.

## Evidence

`lib/seed-prompts.ts` contains the five initial records, including four prompts supplied verbatim by the user. The live library may contain additional records. The mockup’s illustrative copy is not source content.

## Product principles

1. Reading and copying should work without waiting for a social embed.
2. Preserve the provenance and original wording of each prompt.
3. Keep the interface compact and useful on desktop and mobile.
