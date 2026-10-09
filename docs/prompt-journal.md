# Prompt journal

Mode: Operate / Read. Route: `/`.

## Direction contract

THESIS: The user selected concept 05, Prompt Journal: one chronological page instead of a sidebar and separate reader.

OWN-WORLD: Off-white paper, dark ink, olive actions, serif headings, restrained sans-serif controls, fine timeline rules and compact command labels.

STORY: Scan dates and titles, search across the archive, browse months, jump to a day, and copy complete original text. Original-post links retain provenance.

FIRST VIEWPORT: Slim masthead with GitHub action; narrow sticky calendar at left; wide search above the journal. The calendar heading is the only month selector. Mobile puts the calendar behind Browse dates, dates above titles, and actions beneath each entry.

FORM: User-approved chronological journal, concept 05. The supplied visual is authoritative for composition; its generated prose is replaced with stored original content. Rows initially show the full original text. Titles independently collapse or expand each prompt; existing tweet-ID fragment links open their target without collapsing other entries.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Acceptance criteria

- Calendar navigation begins October 2026, with earlier cells blank and Previous disabled. Future months are browsable.
- Dots and counts derive from archived records; missing dots do not assert that no post exists.
- Clicking a day expands its entries and jumps to the newest one, retaining the full month list.
- All entries have a visible copy action and full bodies by default.
- Copy values match the full stored text, even for collapsed entries.
- Search spans all months; clearing it restores the browsed month. Empty months offer Back to current month.
- Arrow keys, Home and End navigate calendar dates; today uses an outline and selection a fill.
- Calendar and journal share UTC dates. Direct fragment links reveal the correct month and prompt.
- Prompt text appears directly; X is only a fallback for records without stored text.
- No horizontal overflow at 320px and 390px; desktop retains the selected mock’s columns and timeline.
- Keep the published custom domain, public audience, and personal GitHub history.

## Implementation reading order

1. `lib/prompt-model.ts` and `lib/seed-prompts.ts`: original content contract.
2. `lib/calendar-model.ts` and `app/prompt-calendar.tsx`: bounded calendar dates and keyboard navigation.
3. `app/library.tsx`: filtering, timeline, and fragment navigation.
4. `app/copy-prompt.tsx`: exact copying and manual fallback.
5. `app/globals.css`: journal layout and responsive behavior.

Checks: `make check`, `make test`, Sites production build, and browser interaction verification.

## Calendar design update — 9 October 2026

Approved desktop, mobile disclosure, and future-month concepts retain the journal identity. Desktop uses a 320px calendar column with a 32px gutter, 32px brand, 25px entry headings, 14px monospace bodies, olive actions, and fine neutral rules. At 850px and below the calendar becomes a disclosure; prompt bodies never require horizontal scrolling. The count is quiet text without the previous promotional tagline.
