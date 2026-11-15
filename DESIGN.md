---
version: alpha
name: uFawkesDevX
description: uFawkesDevX API gateway docs page, on the uFawkes suite tokens.
colors:
  flame-400: "#fc8200"
  flame-500: "#f06300"
  flame-600: "#e85800"
  night: "#061723"
  indigo-300: "#a5b4fc"
  indigo-600: "#4f46e5"
  indigo-700: "#4338ca"
  neutral-50: "#f9fafb"
  neutral-200: "#e5e7eb"
  neutral-600: "#4b5563"
  neutral-800: "#1f2937"
  neutral-900: "#111827"
  white: "#ffffff"
  green-100: "#dcfce7"
  green-700: "#15803d"
  red-100: "#fee2e2"
  red-700: "#b91c1c"
  amber-100: "#fef3c7"
  amber-800: "#92400e"
  primary: "{colors.flame-500}"
  on-primary: "{colors.night}"
  secondary: "{colors.indigo-600}"
  surface: "{colors.white}"
  on-surface: "{colors.neutral-900}"
  error: "{colors.red-700}"
typography:
  headline-lg:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.3
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  code:
    fontFamily: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
    fontSize: 0.9em
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 8px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.flame-600}"
    textColor: "{colors.on-primary}"
  button-primary-dark-hover:
    backgroundColor: "{colors.flame-400}"
    textColor: "{colors.night}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.indigo-700}"
  link-dark:
    backgroundColor: "{colors.night}"
    textColor: "{colors.indigo-300}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  card-dark:
    backgroundColor: "{colors.neutral-800}"
    textColor: "{colors.neutral-50}"
  page:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.on-surface}"
  text-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.neutral-600}"
  heading:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-lg}"
  divider:
    backgroundColor: "{colors.neutral-200}"
    height: 1px
  badge-pass:
    backgroundColor: "{colors.green-100}"
    textColor: "{colors.green-700}"
    rounded: "{rounded.sm}"
  badge-fail:
    backgroundColor: "{colors.red-100}"
    textColor: "{colors.error}"
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "{colors.amber-100}"
    textColor: "{colors.amber-800}"
    rounded: "{rounded.sm}"
  code-block:
    backgroundColor: "{colors.neutral-50}"
    textColor: "{colors.on-surface}"
    typography: "{typography.code}"
    padding: 16px
---

# DESIGN.md: uFawkesDevX

**Suite source:** [uFawkes.dev DESIGN.md](https://github.com/paruff/uFawkes.dev/blob/main/DESIGN.md) and [`tokens.json`](https://ufawkes.dev/design/tokens.json). Change a value there first, then copy it here. **UI changes:** read this file first; cite the section you follow in the PR.

## Overview

This covers the one hand-written page in this repo,
`gateway/api-docs/index.html` ("Developer Control Plane - API Gateway"). The
Backstage app (`backstage/`) keeps Backstage's own theme and is out of scope.
It applies the [suite DESIGN.md](https://github.com/paruff/uFawkes.dev/blob/main/DESIGN.md), which holds the brand, the marks, the
voice and the decisions. The owner decided this page moves from the violet
gradient to the suite tokens (D15).

## Colors

Orange is identity, Indigo is action, and green, red and amber are status
only. The full palette, its contrast table and the reasoning are in the suite
[DESIGN.md, Colors](https://github.com/paruff/uFawkes.dev/blob/main/DESIGN.md#colors).
The values above are copied from it name for name; change them there first.

- **Flame 500** `#f06300` fills the one primary button, with a **Night**
  `#061723` label (5.62:1). Hover is Flame 600 on light, Flame 400 on dark.
- **Indigo 600** `#4f46e5` for links, focus rings and secondary buttons;
  **Indigo 300** `#a5b4fc` on dark.
- **Ink** `#111827` for text, **Muted** `#4b5563` for secondary text,
  **Border** `#e5e7eb`, page background `#f9fafb`.
- Status: pass `#15803d` on `#dcfce7`, fail `#b91c1c` on `#fee2e2`, warning
  `#92400e` on `#fef3c7`, always with a symbol and a word.

## Typography

System font stack only, no web fonts. Headings 700, body 400 at 1rem with a
1.6 line height, code in the monospace stack at 0.9em.

## Layout

Spacing in multiples of 8px. Reading width 960px. Breakpoints 767px (tablet)
and 640px (mobile). Dark mode follows `prefers-color-scheme`, with Night as
the page and `#1f2937` for cards.

## Shapes

8px radius for cards and buttons, 4px for badges. A 1px `#e5e7eb` border
separates cards.

## Components

| Component        | Rule                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| Page header      | Night band with the flame mark and the page title. No gradient                        |
| Endpoint card    | `card`: white, 1px `#e5e7eb` border, 8px radius                                       |
| HTTP method tag  | A word on a neutral `badge` (`GET`, `POST`), not a colour code alone                   |
| Code sample      | `code-block`: monospace stack, wraps, never scrolls the page sideways                 |
| Links            | Indigo 600, underlined                                                                |

## Do's and Don'ts

- Do take every colour, size and radius from the tokens above. If one is
  missing, add it to the suite DESIGN.md and `design/tokens.json` first.
- Do fill only the one primary action per view with Flame and a Night label.
- Do pair every status colour with a symbol and a word ("✓ PASS").
- Don't use orange as text on white, as a status, or for links.
- Don't use `#16a34a` (3.30:1) or `#6366f1` with white text (4.47:1).
- Don't add gradients, web fonts or breakpoints beyond 767px and 640px.

## Today (measured 2026-10-24 on `main`)

| Rule                              | What the page has                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Flame and Indigo, no gradients    | Violet gradient `#667eea` to `#764ba2`                                                         |
| HTTP methods as words             | Swagger UI colours: GET `#61affe`, POST `#49cc90`, PUT `#fca130`, DELETE `#f93e3e`             |
| Ink and Muted greys               | `#333`, `#666`, borders `#e0e0e0`                                                              |
| Radii 4px and 8px                 | 3px, 4px, 8px, 12px                                                                            |
| Monospace stack                   | `'Courier New', monospace`                                                                     |
