# Prompt collection

The collector is an agent task with public web search, backed by the site's owner-authenticated tools and Cloudflare D1. It is not a browser scraper or a Worker cron handler. The requested schedule is daily at **17:00 Asia/Kolkata**. A saved schedule is separate from deployment; confirm its enabled state through Sites before claiming it runs.

## One procedure for scheduled and manual runs

The executable task instructions are maintained in `lib/collection-guide.ts`, returned by `get_collection_instructions` and publicly readable at `/api/collection-instructions`. Every fresh cloud task must read that revision. It specifies searches, the inclusive date window, author/series verification, exact-text requirements, deduplication, retries, failures and readback. Do not duplicate a different algorithm in a schedule prompt.

Manual invocation: ask the connected agent **“Run the Prompt Library collector now.”** It follows the same instructions with trigger `manual`. Ask **“Show the latest Prompt Library collection runs”** to read status without starting collection. There is no public Run button or anonymous write path.

## Run history

`start_collection_run` accepts a caller-generated UUID, records the start and returns the search window. Reuse that ID on retry. Only one run may be active; the next start marks an abandoned run failed after one hour.

`finish_collection_run` commits new complete prompts and the terminal run atomically. Retries return the original terminal record. Existing complete prompts are preserved. The owner reads the latest 100 records, or a specific UUID, through `get_collection_runs`.

| Status | Meaning |
| --- | --- |
| `running` | Started; no verified completion yet |
| `no_changes` | Search succeeded; no new complete prompts; no prompt changes |
| `updated` | Search succeeded and complete prompts were added |
| `incomplete` | Some discovery/retrieval remained unresolved; complete additions may be saved |
| `failed` | Search failed, verification failed, or the run timed out |
| `verified` | Connection/storage check only; no search was performed |

Each record includes trigger, start/finish time, search window, addition count, queries, checked/unresolved tweet IDs and a bounded error code. No credentials or raw provider error dumps belong in records. Successful no-change runs remain quiet; additions, failures and required actions are surfaced.

Only successful discovery advances freshness, to the search window's end. Incomplete runs retain their unresolved IDs for retry even outside the next search window. A verification run never advances freshness or pretends to have searched.

## Sources and limitations

Use public web search over original `x.com/mattpocockuk/status/` and legacy `twitter.com` URLs. Search indexing can miss posts. No paid X API or logged-in Chrome session is required. Search success does not establish complete coverage.

Publish only complete exact prompt text from owner-provided or explicitly reusable material, or a complete short original under the existing source rules. Do not turn an inaccessible, truncated or ineligible body into a copyable entry. Mark the run incomplete and retain the source ID instead. Instructions do not establish actual retrieval capability: verify source access separately.

## Enablement and verification

Connect the provisioned Prompt Library plugin. Read the library, start a `verification` run, finish it with `verified` and empty evidence, then read it back through the same owner connection. This proves authorized persistence without changing public content. Check missing/wrong identity and invalid inputs locally. The SQLite tests exercise real migration SQL, duplicates, partial failures, no-change runs and stale locks, without external search.

Once the writer works, create the Sites-linked daily task for 17:00 Asia/Kolkata. Preserve its ID and do not duplicate it. Read the saved schedule back. Per the owner request, the first live new-prompt ingestion test is deferred until explicitly requested; do not fabricate a successful empty production run to stand in for it.
