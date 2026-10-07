# Prompt journal

Mode: Operate / Read. Route: `/`.

## Direction contract

THESIS: The user selected concept 05, Prompt Journal: one chronological page instead of a sidebar and separate reader.

OWN-WORLD: Off-white paper, dark ink, olive actions, serif headings, restrained sans-serif controls, fine timeline rules and compact command labels.

STORY: Scan dates and titles, search or filter by month, expand a prompt, and copy its complete original text. Original-post links retain provenance.

FIRST VIEWPORT: Slim masthead with GitHub action; wide search and month selector; month heading; dated rows with a timeline gutter, central prompt content, and right-aligned actions. Mobile puts dates above titles and actions beneath each entry.

FORM: User-approved chronological journal, concept 05. The supplied visual is authoritative for composition; its generated prose is replaced with stored original content. Rows initially show the full original text. Titles independently collapse or expand each prompt; existing tweet-ID fragment links open their target without collapsing other entries.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Acceptance criteria

- No sidebar. All five initial entries have a visible copy action without expanding.
- Copy values match the full stored text, even for collapsed entries.
- Search, month selection, no-match recovery, keyboard expansion, and direct fragment links work.
- Prompt text appears directly; X is only a fallback for records without stored text.
- No horizontal overflow at 320px and 390px; desktop retains the selected mock’s columns and timeline.
- Keep the published custom domain, public audience, and personal GitHub history.

## Implementation reading order

1. `lib/prompt-model.ts` and `lib/seed-prompts.ts`: original content contract.
2. `app/library.tsx`: filtering, timeline, and fragment navigation.
3. `app/copy-prompt.tsx`: exact copying and manual fallback.
4. `app/globals.css`: journal layout and responsive behavior.

Checks: `make check`, `make test`, Sites production build, and browser interaction verification.
