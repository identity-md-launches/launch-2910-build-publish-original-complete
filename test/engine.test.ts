import test from "node:test";
import assert from "node:assert/strict";
import { levels } from "../src/levels.ts";
import {
  newGame,
  rotate,
  undo,
  reset,
  rotateMask,
  findJourney,
  stars,
  directions,
  type Game,
  type Mode,
} from "../src/engine.ts";
function solved(id: number, mode: Mode): Game {
  let g = newGame(levels[id - 1], mode);
  for (const [tile, n] of g.level.solution)
    for (let i = 0; i < n; i++) g = rotate(g, tile);
  return g;
}
function validateWalk(g: Game, bonus: boolean) {
  const trip = findJourney(g, bonus);
  assert.equal(
    trip.success,
    true,
    `level ${g.level.id}, ${g.mode}, bonus ${bonus}`,
  );
  assert.equal(trip.path[0], g.level.home);
  assert.equal(trip.path.at(-1), g.level.home);
  let on = false,
    energy = g.level.energy;
  let rest = false;
  const seeds = new Set<number>();
  let extra = false;
  for (let i = 1; i < trip.path.length; i++) {
    const from = trip.path[i - 1],
      to = trip.path[i],
      a = g.level.tiles[from],
      b = g.level.tiles[to];
    const dx = (to % g.level.size) - (from % g.level.size),
      dy = Math.floor(to / g.level.size) - Math.floor(from / g.level.size);
    const d = directions.findIndex((d) => d.dx === dx && d.dy === dy);
    assert.ok(d >= 0);
    assert.ok(rotateMask(a.ports, g.turns[from]) & directions[d].bit);
    assert.ok(rotateMask(b.ports, g.turns[to]) & directions[(d + 2) % 4].bit);
    if (a.oneWay !== undefined) assert.equal((a.oneWay + g.turns[from]) % 4, d);
    if (b.oneWay !== undefined) assert.equal((b.oneWay + g.turns[to]) % 4, d);
    assert.ok(energy > 0, "energy must be available before a step");
    energy--;
    if (b.role === "gate") assert.ok(on, "gate must be open before entering");
    if (b.role === "switch") on = !on;
    if (b.role === "cache") seeds.add(to);
    if (b.role === "bonus") extra = true;
    if (!rest && b.role === (g.mode === "spinning" ? "wheel" : "nap")) {
      energy += g.mode === "spinning" ? 3 : 4;
      rest = true;
    }
    assert.equal(trip.switchStates[i], on);
  }
  assert.equal(
    seeds.size,
    g.level.tiles.filter((t) => t.role === "cache").length,
  );
  assert.equal(energy, trip.energy);
  if (bonus) {
    assert.ok(extra);
    assert.ok(rest);
    assert.equal(stars(g, trip), 3);
  } else assert.ok(stars(g, trip) >= 2);
  assert.ok(g.moves <= g.level.maxMoves);
}
for (const level of levels)
  for (const mode of ["idle", "spinning"] as const)
    for (const bonus of [false, true]) {
      test(`Level ${level.id}: reference ${bonus ? "bonus" : "core"} solution in ${mode}`, () =>
        validateWalk(solved(level.id, mode), bonus));
    }
test("The tutorial’s live variants use different optional routes", () => {
  const idle = findJourney(solved(1, "idle"), true),
    spin = findJourney(solved(1, "spinning"), true);
  assert.notDeepEqual(idle.path, spin.path);
});
test("All initial authored boards need at least one rotation", () => {
  for (const l of levels)
    assert.equal(
      findJourney(newGame(l, "idle")).success,
      false,
      `Level ${l.id} starts solved`,
    );
});
test("Rotate costs one move, updates openings, and leaves the old state intact", () => {
  const g = newGame(levels[0], "idle"),
    id = g.level.solution[0][0],
    next = rotate(g, id);
  assert.equal(next.moves, 1);
  assert.equal(next.turns[id], 0);
  assert.equal(g.turns[id], 3);
  assert.equal(next.history.length, 1);
  assert.equal(rotateMask(9, 1), 3);
  assert.equal(rotateMask(9, 4), 9);
});
test("Undo restores exact state including move budget, and can undo a win", () => {
  const g = newGame(levels[0], "idle"),
    next = rotate(g, g.level.solution[0][0]);
  assert.deepEqual(undo({ ...next, won: true }), g);
  assert.equal(undo(g), g);
});
test("Reset restores authored board but keeps the snapshotted live variant", () => {
  const g = solved(7, "spinning");
  assert.deepEqual(reset({ ...g, won: true }), newGame(levels[6], "spinning"));
});
test("Fixed home, empty soil, exhausted budget and won games cannot rotate", () => {
  const g = newGame(levels[0], "idle");
  assert.equal(rotate(g, g.level.home), g);
  assert.equal(rotate(g, 0), g);
  const atBudget = { ...g, moves: g.level.maxMoves };
  assert.equal(rotate(atBudget, 9), atBudget);
  const won = { ...g, won: true };
  assert.equal(rotate(won, 9), won);
});
test("A disconnected route fails without consuming moves or energy", () => {
  const g = newGame(levels[0], "idle");
  const before = JSON.stringify(g);
  assert.equal(findJourney(g).success, false);
  assert.equal(JSON.stringify(g), before);
});
test("Insufficient energy prevents a win even on a connected board", () => {
  const g = solved(1, "idle");
  g.level = { ...g.level, energy: 1 };
  assert.equal(findJourney(g).success, false);
});
test("Reversing a required one-way tunnel prevents the directed circuit", () => {
  const g = solved(5, "idle"),
    tile = g.level.tiles.find((t) => t.oneWay !== undefined)!;
  g.turns[tile.id] = (g.turns[tile.id] + 2) % 4;
  assert.equal(findJourney(g).success, false);
});
test("Removing the switch leaves required gates closed", () => {
  const g = solved(7, "idle");
  g.level = {
    ...g.level,
    tiles: g.level.tiles.map((t) =>
      t.role === "switch" ? { ...t, role: "plain" } : t,
    ),
  };
  assert.equal(findJourney(g).success, false);
});

test("Every core level is solvable with both optional energy refills removed", () => {
  for (const level of levels) {
    const game = solved(level.id, "idle");
    game.level = {
      ...game.level,
      tiles: game.level.tiles.map((tile) =>
        tile.role === "wheel" || tile.role === "nap"
          ? { ...tile, role: "plain" }
          : tile,
      ),
    };
    assert.equal(
      findJourney(game, false).success,
      true,
      `Level ${level.id} depends on a live refill`,
    );
  }
});
