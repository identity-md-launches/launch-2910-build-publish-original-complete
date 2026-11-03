import { writeFileSync } from "node:fs";
import { levels } from "../src/levels.ts";
import { newGame, rotate, findJourney, type Mode } from "../src/engine.ts";
const coordinate = (id: number, size: number) =>
  `${Math.floor(id / size) + 1},${(id % size) + 1}`;
const output = levels.map((l) => ({
  level: l.id,
  title: l.name[0],
  size: l.size,
  par: l.par,
  maxMoves: l.maxMoves,
  energy: l.energy,
  rotations: l.solution.map(([id, turns]) => ({
    id,
    row: Math.floor(id / l.size) + 1,
    column: (id % l.size) + 1,
    clockwise: turns,
  })),
  routes: Object.fromEntries(
    (["idle", "spinning"] as Mode[]).map((mode) => {
      let game = newGame(l, mode);
      for (const [id, n] of l.solution) game = rotate(game, id, n);
      return [
        mode,
        Object.fromEntries(
          [false, true].map((bonus) => {
            const j = findJourney(game, bonus);
            if (!j.success) throw Error(`Unsolved ${l.id}`);
            return [
              bonus ? "bonus" : "core",
              {
                steps: j.path.length - 1,
                energyRemaining: j.energy,
                path: j.path.map((id) => coordinate(id, l.size)),
                switchStates: j.switchStates,
              },
            ];
          }),
        ),
      ];
    }),
  ),
}));
writeFileSync(
  "artifacts/level-solutions.json",
  JSON.stringify(output, null, 2) + "\n",
);
let md =
  "# Squeek Burrow Circuit reference solutions\n\nAll coordinates are **row,column**, starting at **1,1 in the top left**. Reset before following a solution. Each × number is a **clockwise 90° rotation**; perform all listed rotations, in any order, then select **Send Squeek**. These align the complete board, including optional paths. They fit both the move and energy budgets in idle and spinning variants.\n\nFor the optional solution, use the same rotations and enable **Include bonus detour** before sending. The solver requires both the star seed and the active live stop. Core routes require only the solid caches and a safe return. Only the first visit to the live stop restores energy. Gates start closed; every switch arrival toggles every gate.\n\nThe trip is selected deterministically by breadth-first search. It finds the shortest valid trip on your connected board, with north/east/south/west tie-breaking, inventory, direction, switches, energy and one-time refill state. A different legal arrangement may have a shorter route. Stars: one for a safe return, one for at most the par rotations, one for the optional objective.\n\n";
for (const l of output) {
  md += `## ${l.level}. ${l.title}\n\nPar ${l.par}; move limit ${l.maxMoves}; initial energy ${l.energy}.\n\n**Rotate:** ${l.rotations.map((r) => `(${r.row},${r.column}) × ${r.clockwise}`).join("; ")}.\n\n| Variant | Objective | Steps | Energy left |\n| --- | --- | ---: | ---: |\n`;
  for (const mode of ["idle", "spinning"])
    for (const goal of ["core", "bonus"]) {
      const j = l.routes[mode][goal];
      md += `| ${mode} | ${goal} | ${j.steps} | ${j.energyRemaining} |\n`;
    }
  md += "\n";
  for (const mode of ["idle", "spinning"])
    for (const goal of ["core", "bonus"]) {
      md += `**${mode}, ${goal}:** ${l.routes[mode][goal].path.map((p) => `(${p})`).join(" → ")}.\n\n`;
    }
}
md +=
  "The same solutions are available in the game’s Reference solutions dialog. Machine-readable paths and switch states are in [level-solutions.json](level-solutions.json). These are game simulations, not live telemetry.\n";
writeFileSync("artifacts/LEVEL-SOLUTIONS.md", md);
