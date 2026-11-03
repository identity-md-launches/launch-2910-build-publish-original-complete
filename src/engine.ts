export type Mode = "idle" | "spinning";
export type Role =
  | "plain"
  | "home"
  | "cache"
  | "bonus"
  | "wheel"
  | "nap"
  | "switch"
  | "gate";
export interface Tile {
  id: number;
  ports: number;
  initial: number;
  role: Role;
  fixed?: boolean;
  oneWay?: number;
}
export interface Level {
  id: number;
  size: number;
  name: [string, string];
  lesson: [string, string];
  tiles: Tile[];
  home: number;
  energy: number;
  maxMoves: number;
  par: number;
  solution: [number, number][];
}
export interface Frame {
  turns: number[];
  moves: number;
}
export interface Game extends Frame {
  level: Level;
  mode: Mode;
  history: Frame[];
  won: boolean;
}
export const directions = [
  { dx: 0, dy: -1, bit: 1 },
  { dx: 1, dy: 0, bit: 2 },
  { dx: 0, dy: 1, bit: 4 },
  { dx: -1, dy: 0, bit: 8 },
];
export function rotateMask(mask: number, turns: number) {
  const r = ((turns % 4) + 4) % 4;
  return ((mask << r) | (mask >> (4 - r))) & 15;
}
export function newGame(level: Level, mode: Mode): Game {
  return {
    level,
    mode,
    turns: level.tiles.map((t) => t.initial),
    moves: 0,
    history: [],
    won: false,
  };
}
export function rotate(game: Game, id: number, count = 1): Game {
  const tile = game.level.tiles[id];
  if (
    !tile ||
    tile.fixed ||
    !tile.ports ||
    game.won ||
    game.moves + count > game.level.maxMoves ||
    count < 1
  )
    return game;
  const turns = [...game.turns];
  turns[id] = (turns[id] + count) % 4;
  return {
    ...game,
    turns,
    moves: game.moves + count,
    history: [...game.history, { turns: game.turns, moves: game.moves }],
  };
}
export function undo(game: Game): Game {
  const last = game.history.at(-1);
  return last
    ? { ...game, ...last, won: false, history: game.history.slice(0, -1) }
    : game;
}
export function reset(game: Game): Game {
  return newGame(game.level, game.mode);
}
export interface Journey {
  success: boolean;
  path: number[];
  energy: number;
  bonus: boolean;
  reason?: "disconnected" | "energy";
  switchStates: boolean[];
}
/** Directed breadth-first search over position, seed inventory, switch and one-time refill.
 *  Every edge costs one energy; the live rest/refill can be collected once. No randomized path. */
export function findJourney(game: Game, includeBonus = false): Journey {
  const { level, mode, turns } = game;
  const required = level.tiles.filter((t) => t.role === "cache");
  const cacheBits = new Map(required.map((t, i) => [t.id, 1 << i]));
  const allCaches = (1 << required.length) - 1;
  const extra = level.tiles.find((t) => t.role === "bonus")?.id;
  const stop = level.tiles.find(
    (t) => t.role === (mode === "spinning" ? "wheel" : "nap"),
  )?.id;
  type Node = {
    pos: number;
    mask: number;
    on: boolean;
    extra: boolean;
    rest: boolean;
    energy: number;
    parent: number;
  };
  const queue: Node[] = [
    {
      pos: level.home,
      mask: 0,
      on: false,
      extra: false,
      rest: false,
      energy: level.energy,
      parent: -1,
    },
  ];
  const best = new Map<string, number>();
  let exhausted = false;
  for (let q = 0; q < queue.length; q++) {
    const n = queue[q];
    if (
      n.pos === level.home &&
      n.mask === allCaches &&
      (!includeBonus || (n.extra && n.rest))
    ) {
      const path: number[] = [],
        switchStates: boolean[] = [];
      for (let i = q; i >= 0; i = queue[i].parent) {
        path.unshift(queue[i].pos);
        switchStates.unshift(queue[i].on);
      }
      return {
        success: true,
        path,
        switchStates,
        energy: n.energy,
        bonus: n.extra && n.rest,
      };
    }
    const key = `${n.pos}:${n.mask}:${+n.on}:${+n.extra}:${+n.rest}`;
    if ((best.get(key) ?? -1) >= n.energy) continue;
    best.set(key, n.energy);
    if (n.energy <= 0) {
      exhausted = true;
      continue;
    }
    const tile = level.tiles[n.pos],
      ports = rotateMask(tile.ports, turns[n.pos]);
    for (let d = 0; d < 4; d++) {
      if (!(ports & directions[d].bit)) continue;
      if (tile.oneWay !== undefined && (tile.oneWay + turns[n.pos]) % 4 !== d)
        continue;
      const x = (n.pos % level.size) + directions[d].dx,
        y = Math.floor(n.pos / level.size) + directions[d].dy;
      if (x < 0 || y < 0 || x >= level.size || y >= level.size) continue;
      const pos = y * level.size + x,
        next = level.tiles[pos];
      if (!(rotateMask(next.ports, turns[pos]) & directions[(d + 2) % 4].bit))
        continue;
      if (next.oneWay !== undefined && (next.oneWay + turns[pos]) % 4 !== d)
        continue;
      if (next.role === "gate" && !n.on) continue;
      const rest = n.rest || pos === stop;
      queue.push({
        pos,
        mask: n.mask | (cacheBits.get(pos) ?? 0),
        on: next.role === "switch" ? !n.on : n.on,
        extra: n.extra || pos === extra,
        rest,
        energy:
          n.energy - 1 + (!n.rest && rest ? (mode === "spinning" ? 3 : 4) : 0),
        parent: q,
      });
    }
  }
  return {
    success: false,
    path: [],
    energy: level.energy,
    bonus: false,
    reason: exhausted ? "energy" : "disconnected",
    switchStates: [],
  };
}
export function reachable(game: Game): Set<number> {
  // Visual connection preview only; the journey solver additionally enforces energy, gates and inventory.
  const seen = new Set<number>([game.level.home]),
    todo = [game.level.home];
  for (let q = 0; q < todo.length; q++) {
    const id = todo[q],
      tile = game.level.tiles[id],
      ports = rotateMask(tile.ports, game.turns[id]);
    for (let d = 0; d < 4; d++) {
      if (
        !(ports & directions[d].bit) ||
        (tile.oneWay !== undefined && (tile.oneWay + game.turns[id]) % 4 !== d)
      )
        continue;
      const x = (id % game.level.size) + directions[d].dx,
        y = Math.floor(id / game.level.size) + directions[d].dy;
      if (x < 0 || y < 0 || x >= game.level.size || y >= game.level.size)
        continue;
      const p = y * game.level.size + x,
        next = game.level.tiles[p];
      if (
        !(rotateMask(next.ports, game.turns[p]) & directions[(d + 2) % 4].bit)
      )
        continue;
      if (next.oneWay !== undefined && (next.oneWay + game.turns[p]) % 4 !== d)
        continue;
      if (!seen.has(p)) {
        seen.add(p);
        todo.push(p);
      }
    }
  }
  return seen;
}
export function stars(game: Game, journey: Journey): number {
  return journey.success
    ? 1 + +(game.moves <= game.level.par) + +journey.bonus
    : 0;
}
