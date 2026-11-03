# Squeek Burrow Circuit

A complete, original turn-based tunnel puzzle for the Squeekchain community. Rotate an illustrated underground burrow, collect its seed caches, and send Squeek safely home. The game opens directly on the playable tutorial. Twelve authored levels introduce bends, junctions, directed tunnels, switches, gates, and optional detours.

**Publication result:** the publisher returned `503 member_sites_closed: this plane names no member sites`. No public site URL, IPFS CID or ENS name was issued by this attempt. The finished static export and cloneable source repository are included. See [DEPLOYMENT.md](artifacts/DEPLOYMENT.md).

The production site is **`dist/`**, included with the source and lockfile. It is a static export with relative URLs and no server, wallet, account, payments, transactions, prizes, analytics, or external font requests. The only in-game network request is the public hamster status API. Publication details are recorded in `artifacts/DEPLOYMENT.md` when available.

## Install, play locally, and rebuild

Use Node.js **22.12+**, npm, and a modern browser. Node.js 24 was used for the recorded checks.

```sh
npm ci
npm run dev
```

To rebuild and inspect the exact production export:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` uses Vite with `base: './'`. Serve the whole `dist/` directory over HTTP; opening `index.html` with `file://` is not supported because it uses JavaScript modules. There is no client-side path router or rewrite requirement. Relative fonts, favicon, share image, scripts, styles, and source mirror work at an IPFS gateway subpath.

For browser validation:

```sh
npx playwright install chromium webkit
# On Linux, install Playwright's OS browser dependencies if needed:
npx playwright install-deps
npm run test:browser
```

The browser suite creates and closes its own preview server under `/burrow/`. It writes actual results and screenshots to `artifacts/`. Browser dependencies and caches are development tooling, not runtime assets, and are not submitted.

## How to play

- Tap a teal tunnel to rotate it clockwise by 90°. Every quarter turn costs one move. Home stays fixed. Dots and pebbles are unplayable soil.
- Connect home to **every solid seed cache** and back. Select **Send Squeek** to check and animate the shortest valid round trip. Each step costs one energy. A failed check consumes neither energy nor moves.
- **Undo** restores the previous board and move count, including after a win. **Reset** restores the authored starting layout and keeps this run's original live rule. Earned stars remain saved.
- Three-way junctions split routes. Arrows constrain both entry and exit to their direction. All striped gates start closed. Arriving on a switch toggles all gates; re-entering it toggles them again. A closed gate cannot be entered, though it can be left.
- Enable **Include bonus detour** to require the outlined star seed and this run's active live stop. The spinning-wheel stop restores **3 game energy** once per trip. The idle nap stop restores **4 game energy** once. Those are game rules, not hamster measurements. In early levels the two objectives produce different walks.
- One star rewards a safe return, one rewards finishing within the displayed rotation par, and one rewards the bonus objective. These are local game scores with no external value or promised outcome. The next level unlocks after a win.

Keyboard: Tab into the board, arrows select adjacent non-soil tiles, Enter/Space rotate, **U** undoes, **R** opens reset. Native buttons, visible focus, labelled tunnel openings, a polite result announcement, and focus-contained dialogs support keyboard use. The in-game guide and explicit solutions are always available.

English and Simplified Chinese UI are included, with locally bundled Latin and Chinese font subsets. Sound is **off by default**, optional, and generated locally with Web Audio. Reduced motion follows the system setting or the footer checkbox; the journey then resolves immediately and there is no endless animation.

## Reference solutions

[All 12 reference solutions](artifacts/LEVEL-SOLUTIONS.md) list clockwise rotations and complete round-trip coordinates for **core and bonus objectives in both idle and spinning modes**. [Machine-readable solutions](artifacts/level-solutions.json) include energy left and switch states.

```sh
npx tsx scripts/document-levels.ts
```

Solutions are generated from the explicit paths and scramble values in `src/levels.ts`, then validated independently step by step in `test/engine.test.ts`. Every initial puzzle is unsolved. Every core puzzle is solvable with idle rules and without taking the optional refill. Hints reveal one remaining reference rotation; they do not move tiles or change the budget.

## Live integration

Source: [Squeekchain status API](https://api.squeekchain.com/v1/status). Official context: [Squeekchain](https://squeekchain.com) and [Genesis code](https://squeekchain.com/genesis/code), also linked in About. The official web client's published schema defines `measurement.coreStatus` as `IDLE`, `ACTIVE`, or `COUNTER_FAULT`, and `measurement.rpmMilli` as a nonnegative safe integer. This app reads **only those two measurement fields**. It does not use block counts, settlement, work, distance, speed, wallet data, or signer information.

`src/live.ts` validates every field before use. `ACTIVE` or a validated positive RPM selects spinning. `IDLE` or zero RPM selects idle. A missing field is allowed if the other is valid. Unknown statuses, invalid numeric values, missing measurements, and `COUNTER_FAULT` are treated as unavailable signal. Displayed RPM is exactly the validated milli-RPM divided by 1,000; there is no simulated live reading.

A request begins at startup. After success, another request is scheduled about **20 seconds** later. Each has a **6-second abort timeout**. Failure retries after 20, 40, 80, then at most 120 seconds; success restores the 20-second interval. Retry, browser reconnection, and returning to the tab can refresh sooner. Requests do not overlap. Readings older than 60 seconds according to this browser's last successful receipt cannot be snapshotted as live. The displayed **Checked** time is the local receipt time, not an upstream observation or freshness guarantee.

A level snapshots its rule when it starts. The initial tutorial starts immediately in **offline practice with nap rules** while the first request is pending. A successful reading offers **Start a new live run**, with a reset confirmation. A transition during play changes the small live indicator and offers a new run, but leaves the current layout, move budget, refill, and objective unchanged. Ordinary Reset and Undo retain that snapshot. New levels use the latest valid reading. Failed API requests explicitly show **Offline practice** and keep every level playable. No player action affects the real hamster.

## Local storage and privacy

Only best stars and language/sound/motion settings are stored in `localStorage`, under `squeek-burrow-circuit:v1`. The current in-progress board is not persisted; reloading starts the tutorial with saved best scores and unlocked levels. Invalid saves recover to defaults. Storage restrictions or quota errors keep the game playable and show that progress lasts only for this visit. There is no cross-device sync, leaderboard, account, telemetry, or analytics.

## Public source repository

Open **About → Source repository**, or `/source-repository/index.html` relative to the hosted game. This is a real **read-only static HTTP Git repository**, not a placeholder link or a submodule. Its landing page computes the actual clone command from the deployed URL. It includes the full source, lockfile, fonts, art, tests, documentation, and production export in one delivery commit.

The mirror excludes itself under `public/` and `dist/` to avoid recursion. Its Git metadata lives in directories named `source-repository`, separate from the contributor checkout's protected `.git/`. The packaging script never reads or changes the checkout's Git metadata or global Git configuration. It creates a new isolated snapshot with the project name and an empty email, with no invented person or contact address.

To refresh this source mirror after source/docs/export changes, install Python 3 and Git, then run:

```sh
npm run build
python3 scripts/package-source.py
npm run build
```

No hosted Git account or private key is required. This snapshot has no issue tracker, push endpoint, or collaboration service. Use a normal Git forge for continuing development if desired. The committed top-level `dist/` is the actual delivered static site; it does not require a build by the publisher.

## Recorded validation

The actual recorded results are in [validation.md](artifacts/validation.md), [browser-results.json](artifacts/browser-results.json), [axe-results.json](artifacts/axe-results.json), [design-metrics.json](artifacts/design-metrics.json), and [screenshots](artifacts/screenshots/). These are worker-side observations, not independent certification.

| Check                  | Actual result                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Passed; no TypeScript diagnostics                                                                                                                                                                                                                       |
| `npm test`             | **69 passed, 0 failed**, including 48 reference runs (12 levels × 2 modes × 2 objectives), direction/gate/energy invariants, rotate/undo/reset/win, persistence, validation, timeout, backoff and recovery                                              |
| `npm run build`        | Passed; complete export with relative local assets                                                                                                                                                                                                      |
| `npm run test:browser` | **9 Chromium scenarios passed, 0 failed**; all 12 bonus solutions completed in both modes through the real controls; touch and keyboard flows, live snapshot, timeout/recovery, storage failures, English/Chinese, reduced motion, and 200% text tested |
| Rendered widths        | **320, 360, 390, 760, 950, 1440 CSS px**; no horizontal overflow in tested tutorial states                                                                                                                                                              |
| First screen           | At **390 × 844**, title, playable board and Send Squeek action are visible; action bottom is approximately **764 px**                                                                                                                                   |
| axe                    | **0 violations** in the tested Chinese level state at 390 and 320 px for WCAG 2 A/AA, 2.1 AA and 2.2 AA rule tags                                                                                                                                       |
| Pinned taste@1 probe   | **16/16 passed** at 320, 390 and 1440; no missing local assets or page script errors; reduced-motion check passed                                                                                                                                       |
| WebKit                 | Browser package was downloaded, but the browser could not complete a usable page in the available host setup; **interaction behavior is not verified**                                                                                                  |

The original browser fetch-binding bug, a seed/gate role collision, missing Chinese heading glyphs, a 4px decorative overflow, 200% text overflow, modal Tab escape, an unlabelled star graphic, and a redundant shadow were repaired and rechecked. [DESIGN.md](DESIGN.md) records the implemented design system and the six-domain review is in the validation document.

## Known limitations

- WebKit/iOS interaction testing and physical-device testing remain unperformed. Chromium mobile emulation and touch events were tested. A narrow viewport or 200% text is not a browser-native zoom or screen-reader session; those manual checks remain unperformed.
- The status endpoint is operated by Squeekchain and can fail or return a delayed observation. The game shows receipt time and practice mode rather than inventing a reading. Automated recovery uses clearly labelled test fixtures, not claims about changing the real hamster.
- Connectivity highlighting previews tunnel geometry, including directional openings. The full Send check additionally enforces gates, caches, return, energy and one-time refill. It is not a pre-run guarantee of success.
- No service worker is installed. Offline practice works once the game has loaded; a first load still needs access to the static host. Clearing browser data removes progress. Sound availability depends on the browser.
- Chinese fonts are subsets for the shipped UI, not full Chinese fonts. New Chinese copy requires expanding the subset or relying on an installed CJK fallback.
- The static Git source endpoint depends on the gateway serving ordinary file paths; it is read-only and has a single delivery commit. The publisher chooses the public name. No ENS ownership or registration is implied by the source code.

## Files and attribution

`src/engine.ts`: pure game rules and deterministic route solver. `src/levels.ts`: authored layouts and rotations. `src/main.ts`: accessible game views and input handling. `src/live.ts`: validated polling. `src/storage.ts`: local progression. `src/art.ts`: original SVG illustrations. `src/i18n.ts`: English/Chinese copy. `src/style.css`: final design tokens and responsive styles. `public/`: required local assets and source mirror. `dist/`: ready-to-publish export.

Original game code and art: MIT, [LICENSE](LICENSE). Font licenses are retained in `public/fonts/`. Better Interface design guidance is adapted from [Jakub Krehel's Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface), MIT; documentation guidance from [Paul Bakaus's Impeccable](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md), Apache-2.0. The supplied combined license is preserved in `artifacts/DESIGN-GUIDE-LICENSE.txt`.

`.gitignore` has an explicit path budget: dependency and cache directories at every nesting level, coverage, TypeScript build state, and `test/scratch/` only. It deliberately includes `dist/`, required fonts, source, solutions, and the static source repository. No dependency archives or registries are vendored.
