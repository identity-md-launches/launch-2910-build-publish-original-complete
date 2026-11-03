# Squeek Burrow Circuit validation record

Worker-side results for the current revision, run on the committed source and the rebuilt `dist/`. They are not independent certification.

## Commands and actual results

| Command | Result |
| --- | --- |
| `npm ci` | Installed from `package-lock.json` |
| `npm run typecheck` | Passed, no TypeScript diagnostics |
| `npm test` | 69 passed, 0 failed (48 reference runs: 12 levels × idle/spinning × core/bonus; rotate, undo, reset, win, persistence, status validation, timeout, backoff, recovery) |
| `npm run build` | Passed; `dist/index.html` plus hashed CSS/JS under `dist/assets/`, all relative URLs |
| `npx tsx scripts/document-levels.ts` | Wrote `docs/LEVEL-SOLUTIONS.md` and `docs/level-solutions.json`; every level reached a successful journey in both modes and both objectives |
| `npm run test:browser` | 9 Chromium scenarios passed, 0 failed (`docs/browser-results.json`); WebKit could not launch on this host, so it is unverified |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16/16 checks passed at 320, 390 and 1440 wide: render, layout, targets, contrast, casing, tracking, eyebrows, type-sizes, type-faces, glyphs, slogans, repetition, copy-budget, chrome, motion, share |

The 390 × 844 probe screenshot was inspected: header, level title, meters, the board with the live hamster indicator, the directions line and Undo / Reset / Send Squeek all fit on the first screen. Screenshots are kept in the local scratch folder and are not shipped.

## Revision findings and fixes

- **Dead `artifacts/` links in README and DESIGN.md.** Reproduced: there was no tracked `artifacts/` folder. The level documentation script and browser suite now write to the committed `docs/` folder. README has the 12-level rotation table inline and links only to files that exist.
- **First visit showed "Offline practice" and "The signal changed".** Reproduced from `src/main.ts`: the tutorial snapshots offline nap rules before the first request returns, and `!rule.online` then marked the run as changed. Fix: in the status callback in `src/main.ts`, a run that is still offline and untouched (no moves, no history, not running, not won) now adopts the first valid reading as its snapshot and re-renders. After the player has moved, a differing reading still keeps the original rule and offers **Start a new live run**. The first browser scenario now asserts that the rule card shows Nap nook without "Offline practice" and that no changed note or new-run button appears. The frozen-snapshot scenario still passes.
- **Decorative teal "?" tab on How to play.** Reproduced: it was an `aria-hidden` div that looked like the real Help button. The `.notebook-mark` element and its CSS rules were removed. The browser suite asserts it is absent.

## Better Interface review (six domains) for this revision

- **Accessibility:** removing the decorative tab removes a dead tap target that looked like a control. The live rule card no longer reports a network failure that did not happen. Roving tabindex, labelled tiles, the polite live region and focus-contained dialogs are unchanged, and the axe run in the browser suite found 0 violations (`docs/axe-results.json`).
- **Layout:** the How to play card keeps its heading position, and the probe found no overflow at 320, 390 or 1440.
- **Writing:** the copy is unchanged. The run state is now truthful because "Offline practice" appears only while no valid reading exists for the run.
- **Typography:** unchanged. The probe passed type-sizes, type-faces and glyphs checks. No new Chinese copy was added, so the shipped CJK subset still covers the UI.
- **Colors:** unchanged tokens. The probe's rendered contrast check passed.
- **UI:** one fewer competing teal accent near the primary action. Controls look like controls.

## Limitations

- WebKit/iOS, physical devices, native browser zoom and screen-reader sessions were not tested.
- The real status API's behavior depends on Squeekchain. Automated live tests use labelled fixtures.
- The contrast ratios listed in DESIGN.md come from the previous review round. This round relied on the probe's pass/fail contrast check.
