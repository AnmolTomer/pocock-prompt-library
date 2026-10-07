---
name: Prompt Library
description: A paper-and-ink visual system for reading and copying original prompts.
colors:
  paper: "#fafaf7"
  ink: "#151b24"
  muted: "#555e65"
  action: "#50643b"
  selected: "#e9eddf"
  line: "#dedfd8"
  focus: "#50643b"
  surface: "#f0f1eb"
  field: "#ffffff"
  field-border: "#c8ccc5"
  button-border: "#d5d9ce"
  action-hover: "#3f512e"
  button-hover: "#e1e7d6"
  command-ink: "#415330"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.16em"
  prompt:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  control: "4px"
  command: "3px"
spacing:
  compact: "8px"
  content: "16px"
  mobile-gutter: "20px"
  gutter: "24px"
  section: "32px"
  column: "40px"
components:
  button-copy:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-copy-expanded:
    backgroundColor: "{colors.action}"
    textColor: "{colors.field}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-copy-expanded-hover:
    backgroundColor: "{colors.action-hover}"
  command:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.command-ink}"
    rounded: "{rounded.command}"
    padding: "1px 7px 2px"
  prompt:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.prompt}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
---

# Design System: Prompt Library

## Overview

**Creative North Star: "Prompt Journal"**

Off-white paper, dark ink, olive actions, and serif headings give the archive its reading character. Compact sans-serif controls keep finding and copying a prompt straightforward.

The visual system is flat and restrained. Type, fine rules, and small tonal changes establish hierarchy. This document captures the implementation in `app/globals.css` and `app/library.tsx`; the selected page composition and acceptance criteria remain in `docs/prompt-journal.md`. No raster imagery ships.

**Key Characteristics:**

- Paper background and dark, readable text.
- Serif titles with sans-serif controls and monospaced original text.
- Fine timeline rules and compact command labels.
- Olive accents for actions, focus, and expanded entries.

## Colors

The palette pairs warm neutral surfaces with a single muted olive accent. Frontmatter records the actual CSS values.

### Primary

**Action olive** marks source links and expanded copy buttons. **Focus olive** uses the same color for keyboard outlines. **Selected olive tint** backs command labels and text selection; **command ink** gives labels a darker foreground. Hover tokens distinguish neutral and expanded copy buttons.

### Neutral

**Paper** is the page canvas; **ink** is the primary foreground; **muted** supports dates, excerpts, and supporting text. **Line** separates entries and frames the masthead and footer. **Surface** holds original text and neutral copy buttons; **field** supplies white input surfaces. The field and button border tokens preserve their distinct strokes.

## Typography

**Display Font:** Source Serif 4, Georgia, serif. The bundled weight is 600.

**Body Font:** Source Sans 3, sans-serif. Bundled weights are 400, 600, and 700.

**Label/Mono Font:** Controls and command labels use the body family. Original prompt text uses the system monospace stack in frontmatter.

### Hierarchy

- **Display:** Masthead wordmark; the frontmatter desktop size becomes 25px at 640px and 22px at 380px.
- **Title:** Prompt headings; the desktop size becomes 23px at 900px and below.
- **Body:** General text. Excerpts and desktop dates use 16px; action and command labels use 15px.
- **Label:** Uppercase month headings with wide tracking. Mobile dates use 13px.
- **Prompt:** Original content preserves whitespace and wraps long strings. The size becomes 13px at 640px and below.

## Layout

Shared content containers have a maximum width of 1264px, including 24px side padding. The masthead is at least 76px tall. Desktop entries use date/content/action columns of `150px minmax(0, 1fr) 145px`, with 40px gaps and 24px vertical padding. Search fills available width beside a 190px month selector, separated by 36px.

At 900px, entry columns become `115px minmax(0, 1fr) 132px` with 24px gaps. At 640px, entries become one column: date, content, then wrapping actions. The timeline remains at the left, entries have 24px left padding, and shared side padding becomes 20px. Search and month remain adjacent with a 145px month selector. At 380px, filters stack and shared side padding becomes 16px.

These measurements describe the implemented journal surface rather than a requirement that future surfaces reuse its entire composition.

## Elevation & Depth

Surfaces have no elevation shadows. Background tints, borders, and whitespace separate content. The timeline dot has a paper-colored spread (`0 0 0 6px var(--paper)`) to interrupt the rule behind it; this is a masking halo rather than depth.

## Shapes

Controls and text surfaces use the control radius; command labels use the smaller command radius. Borders and timeline rules are 1px. Timeline markers are circles, 11px on desktop and 10px on mobile. Entries themselves are open rows, without card shells.

## Components

### Buttons

Copy controls are compact and lightly outlined, with a neutral default and olive expanded variant. Desktop copy buttons are at least 40px tall; mobile copy and source actions are at least 44px. Active copy buttons move down 1px. Disabled copy buttons use a muted olive treatment and a not-allowed cursor.

Keyboard focus has a 2px olive outline with 4px offset. Title buttons expose expansion with a chevron rotating 180 degrees over 160ms ease-out. Reduced-motion preferences disable transitions.

### Chips

Command labels are inline, softly tinted, and allow long strings to wrap. They are descriptive text, not clickable filter controls.

### Cards / Containers

Prompt text sits in a tinted inset with preserved whitespace. Mobile padding becomes 14px. Empty, no-match, and unavailable states use open space and a serif heading rather than a card.

### Inputs / Fields

Search uses a white background, fine border, and a minimum height of 46px. Its container receives a 2px olive outline with 2px offset when focused. The native month selector has the same minimum height and border, with the paper background. The manual-copy fallback uses a white, resizable text area.

### Navigation

The serif wordmark links home. The GitHub action and original-post links are olive; links underline on hover. On mobile, the subtitle moves beneath the masthead actions. A skip link appears on keyboard focus.

### Timeline entry

Dates use tabular numerals. The first and expanded entry markers are olive; others are muted. Collapsed long prompts show a two-line excerpt, while short prompts retain their complete text. Copy and source actions stay visible independently of expansion.

## Do's and Don'ts

### Do:

- Do preserve the serif title, sans-serif control, and monospace content roles.
- Do keep focus indicators visible against the paper and tinted surfaces.
- Do preserve original text whitespace and wrap long content within its container.
- Do use fine rules and tonal surfaces to establish hierarchy.

### Don't:

- Don't add elevation shadows to the existing flat journal components.
- Don't turn command labels into controls without a corresponding interaction.
- Don't replace original content with illustrative copy or image-based text.
