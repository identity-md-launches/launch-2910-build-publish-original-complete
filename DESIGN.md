# Squeek Burrow Circuit design system

## Overview

A warm, illustrated tunnel puzzle for the Squeekchain community. The visual idea is an underground cross-section: cream earth, connected teal tunnels, amber seeds, roots, and a legible round hamster. The game opens directly on the tutorial, with controls next to the board. A small field notebook holds instructions on desktop and follows the controls on mobile. This is a game surface rather than a marketing hero.

Source of truth: `src/style.css` for tokens and layout; `src/art.ts` for original SVG art; `src/main.ts` for component patterns and states; `src/i18n.ts` for both locales. No remote images, fonts, UI library, or icon dependency is required at runtime.

## Colors

The existing hexadecimal notation is canonical. Semantic tokens reference the cream, brown, teal and amber primitives at the beginning of `src/style.css`.

| Semantic token          | Value     | Actual role                                                    |
| ----------------------- | --------- | -------------------------------------------------------------- |
| `--bg`                  | `#f7efdb` | Page and trail background                                      |
| `--paper`               | `#fffbf1` | Notebook, neutral buttons, live strip, dialog                  |
| `--soil`                | `#eadbbd` | Burrow cutaway                                                 |
| `--soil-deep`, `--line` | `#d4bf98` | Soil detail and structural separators                          |
| `--ink`                 | `#403b2e` | Main text                                                      |
| `--muted`               | `#715b3e` | Instructions, metadata, secondary text                         |
| `--accent`, `--focus`   | `#23554c` | Primary action, active trail, links, keyboard outline          |
| `--accent-soft`         | `#d9e9dc` | Live stop explanation, success, completed trail                |
| `--error`               | `#934e38` | Recoverable route error text                                   |
| `--reward`              | `#d8992e` | Amber reward primitive; seed art also uses its own amber fills |

Art has separate literal SVG colors: hamster brown `#c7884e`, cheeks `#edb5a0`, face `#fff3d9`; seed fill `#e6ae3c` and outline `#79511e`. Tunnel walls use `#487b6a` when unconnected and the accent when reachable; floors change from `#8caf96` to `#a6c7a7`. These communicate board geometry, not additional peer actions. Reward, switch, gate, home, live and offline states also have distinct shapes and text labels.

Rendered contrast measurements recorded in the previous review round: main text/page **9.73:1**, primary action **8.21:1**, muted goal/page **5.61:1**, notebook body **10.79:1**, hint link/notebook **8.21:1**. These are measured solid pairs, not an assertion about every pixel of illustration, disabled opacity, or every forced-colors state. The pinned probe's rendered text contrast check passed again in this revision (see `docs/validation.md`).

## Typography

- **Nunito Sans** (family alias `Nunito`): locally bundled variable Latin WOFF2, body and controls, weights 400, 600 and 700.
- **Fraunces**: locally bundled Latin WOFF2 at weight 600, game brand and headings.
- **Noto Sans SC** (alias `Noto UI`): three local subset WOFF2 files at weights 400, 600 and 700, covering the shipped Chinese UI and headings. Fallbacks are PingFang SC, Microsoft YaHei, system UI, and sans-serif. Fraunces headings fall back to Noto UI before Georgia.

The active type scale is **13 / 16 / 20 / 24 / 32 px**, expressed as `--text-sm`, `--text-base`, `--text-md`, `--text-lg`, and `--text-xl` in rem units. A declared 40px display token is reserved and unused. Desktop brand and level headings use 32px; the mobile brand and level heading use 24px, with the smallest layout reducing to 20px. Body text is 16px at 1.5 line height. Prose instructions use 1.6. Captions and dense metadata use 13px. Titles have 1.1–1.25 line height and modest negative tracking; body copy has natural tracking.

Headings balance wrapping, paragraphs use pretty wrapping, and counters use tabular numerals. Content and labels wrap rather than truncate. Document `lang` changes to `zh-Hans` with the Chinese setting. Fonts are subsets, so expanding Chinese copy requires adding glyphs. Root font smoothing is applied once. No important text is rendered as part of the decorative SVG scene.

## Layout

Spacing follows **4 / 8 / 12 / 16 / 24 / 32 / 48px**, declared as `--space-*`; existing component rules mostly use the equivalent literal pixel values. Keep 8–12px within control groups and 24px or more between functional groups.

The main and footer have a 1152px maximum width; the header has 1216px. Desktop uses a flexible play column, a 284px notebook column and a 48px gap. Meters sit above the scene, directions and action controls immediately below it. The board is a CSS grid with four or five square cells per row; each tile is a real button. The desktop board is at most 370px wide. Soil surrounds it rather than framing every tile as a separate card.

Implemented breakpoints:

- **1215px:** 32px outer margins, 260px notebook and 32px column gap.
- **950px:** 240px notebook and 24px gap; brand subtitle moves below Squeek; some secondary hints condense.
- **760px:** gameplay becomes one column. Notes form two columns below the controls. The board can be up to 380px wide. The trail uses six columns instead of twelve.
- **480px:** 16px page margins, one-column notes, 18px board inset, compact utility controls. Main actions remain at least 48px high. Directions stay beside the action area rather than occupying the header.
- **359px:** decorative brand hamster and redundant best-star meter are hidden. Undo/Reset become icon controls with explicit accessible names. Their hit areas remain 44px.

Stats, header, and level title rows can wrap when text grows. At 200% text size they reflow without horizontal overflow in the tested state. Artwork overflow is clipped inside `.soil-scene`; text is not clipped. Observed widths: 320, 360, 390, 760, 950 and 1440px in Chromium. The 390×844 tutorial contains the product, board and Send Squeek action on the first screen. Physical devices, native browser zoom and WebKit layout remain unverified.

## Elevation & depth

The page uses tonal differences and space, with structural borders for neutral controls, trail stops, and the header. The notebook has no shadow. Only the native dialog uses elevation (`0 20px 70px #403b2e30`) and a dimmed, slightly blurred backdrop. Seed halos are flat illustrative outlines; the bonus marker does not combine a border and shadow. A small drop shadow belongs only to the illustrated travelling hamster. The board is isolated for decorative stacking; focus rings remain in front of tiles.

## Shapes

The cross-section has 28px upper and 24px lower corner radii. Desktop tiles use 15px corners, mobile tiles 11px. Buttons use 12px, level picker 10px, notebook an asymmetric 3px/14px corner, and dialogs 20px (16px on small screens). Markers are round. Keep the arched home, amber seed silhouette, star outline, wheel, moon, lever, and striped gate shapes distinct.

## Components

| Pattern                  | Source                                                   | Behavior and states                                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand and utilities      | `render()` in `src/main.ts`, `.site-header`              | Brand scrolls to the game; labelled sound toggle uses `aria-pressed`; language and help are native buttons                                                                                                          |
| Tunnel tile              | `tilesHTML()`, `tunnel()`, `tileMarker()`                | Soil is inert; tiles announce coordinates, feature and openings. Roving Tab stop plus arrow selection, Enter/Space rotation. Connected, selected, tutorial, focused, travelling, collected, won states are distinct |
| Primary/secondary action | `.primary-button`, `.secondary-button`                   | Send is the primary filled action; Undo/Reset are neutral. Hover is pointer-only; disabled states are real disabled buttons; optional press scale is 0.96                                                           |
| Meters and stars         | `.meters`, `starsHTML()`                                 | Tabular moves/energy/caches; stars are one labelled image with hidden decorative SVG children. Reflow on enlarged text                                                                                              |
| Field notebook           | `.lesson-section`, `.star-goals`                         | Level-specific tutorial, three star requirements, one optional hint at a time                                                                                                                                       |
| Live rule                | `LiveStatus`, `liveHTML()`, `ruleHTML()`, `updateLive()` | Connecting/online/offline text and dot, validated RPM only, checked timestamp, source, retry, fixed run explanation, and explicit new-run confirmation                                                              |
| Bonus objective          | `.bonus-toggle`                                          | Native checkbox with a full clickable text label; disabled during travel and after win                                                                                                                              |
| Result                   | `.feedback`, `.win-panel`                                | Actionable persistent route error or a success panel with stars, trip length, remaining energy and next-level action. A separate stable polite region announces results                                             |
| Level trail and picker   | `.trail-levels`, `.level-option`                         | Locked levels are disabled with explanatory names; current step and completed levels use text/shapes as well as color                                                                                               |
| Dialog                   | native `<dialog>`, `openModal()`                         | Native modal background inertness, explicit first/last Tab cycling, Escape/backdrop close, focus return to trigger, scroll containment. Help, About, solutions, picker and reset use one pattern                    |
| Preferences              | `src/storage.ts`, footer                                 | Local language/sound/motion settings; system reduced-motion support; storage failure copy; no synced state                                                                                                          |

CSS transitions are limited to named background and transform properties at 120ms. They exist only for no-preference motion and are also disabled by the local reduced-motion preference. There are no endless or page-entry animations. The journey moves in discrete 185ms steps, or resolves immediately under reduced motion. Sound never autoplays before user opt-in.

A visible 3px `:focus-visible` outline, 44px utility targets and 48px main actions are shared conventions. Tiny visual checkboxes use larger clickable labels. Forced-colors rules preserve outlines and geometry, but have not been inspected with a native high-contrast configuration.

## Do's and don'ts

Use the existing cream paper/soil separation and the single teal primary action. Reuse `icon()` and original SVG patterns rather than adding another icon language. Keep instructions near the board and the playable first level on entry. Extend both entries in `copy` for new UI, and provide the Chinese font glyphs. Avoid adding live-looking sample values, a hero above the game, decorative dashboard cards, additional font families, text clipping, an endless wheel animation, or remote asset dependencies.

For a new game view, start from `render()`'s main/notes structure, reuse the existing controls and dialog, keep local progression in the versioned storage adapter, and validate its 390px first screen, keyboard path, 320px reflow and Chinese labels. Review evidence and remaining limitations belong in `docs/validation.md`, not in the player flow.
