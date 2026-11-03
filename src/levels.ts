import { directions, type Level, type Role, type Tile } from "./engine";
type Point = [number, number];
interface Plan {
  name: [string, string];
  lesson: [string, string];
  size?: number;
  main: Point[];
  branches?: Point[][];
  caches: Point[];
  bonus: Point;
  wheel: Point;
  nap: Point;
  arrows?: [Point, number][];
  switches?: Point[];
  gates?: Point[];
  energy: number;
  scramble: [Point, number][];
}
const p = (x: number, y: number): Point => [x, y];
const plans: Plan[] = [
  {
    name: ["A seed of an idea", "第一颗种子"],
    size: 4,
    lesson: [
      "Rotate the highlighted tunnel once. Send Squeek to the seeds and back home.",
      "将高亮隧道旋转一次，派吱吱收集种子并回家。",
    ],
    main: [p(0, 2), p(1, 2), p(2, 2)],
    branches: [
      [p(1, 2), p(1, 1)],
      [p(2, 2), p(3, 2), p(3, 1), p(2, 1)],
    ],
    caches: [p(2, 2)],
    bonus: p(3, 1),
    wheel: p(2, 1),
    nap: p(1, 1),
    energy: 8,
    scramble: [[p(1, 2), 3]],
  },
  {
    name: ["Around the root", "绕过树根"],
    size: 4,
    lesson: [
      "Bends turn too. Match both tunnel mouths before you send Squeek.",
      "弯道也能旋转。连接隧道两端，再派吱吱出发。",
    ],
    main: [p(0, 3), p(0, 2), p(1, 2), p(1, 1), p(2, 1)],
    branches: [
      [p(2, 1), p(3, 1), p(3, 2)],
      [p(1, 2), p(2, 2)],
    ],
    caches: [p(2, 1)],
    bonus: p(3, 1),
    wheel: p(3, 2),
    nap: p(2, 2),
    energy: 12,
    scramble: [
      [p(0, 2), 3],
      [p(1, 1), 2],
      [p(2, 2), 3],
    ],
  },
  {
    name: ["The fork in the burrow", "地洞岔路"],
    lesson: [
      "A junction has three mouths. Collect both seed caches; the star seed is optional.",
      "三岔口有三个出口。收集两处种子，星标种子可选。",
    ],
    main: [p(0, 2), p(1, 2), p(2, 2), p(3, 2), p(4, 2)],
    branches: [
      [p(2, 2), p(2, 1)],
      [p(3, 2), p(3, 3), p(2, 3)],
      [p(1, 2), p(1, 3)],
    ],
    caches: [p(2, 1), p(4, 2)],
    bonus: p(3, 3),
    wheel: p(2, 3),
    nap: p(1, 3),
    energy: 16,
    scramble: [
      [p(1, 2), 3],
      [p(2, 2), 2],
      [p(3, 2), 1],
      [p(2, 1), 3],
    ],
  },
  {
    name: ["The long way home", "回家的远路"],
    lesson: [
      "Loops can save energy. The preview shows connections; Send checks the whole trip.",
      "环路可以节省体力。预览显示连通隧道，出发时检查全程。",
    ],
    main: [
      p(0, 2),
      p(1, 2),
      p(1, 1),
      p(2, 1),
      p(3, 1),
      p(3, 2),
      p(2, 2),
      p(2, 3),
      p(1, 3),
      p(0, 3),
      p(0, 2),
    ],
    branches: [[p(3, 2), p(4, 2), p(4, 3), p(3, 3), p(2, 3)]],
    caches: [p(3, 1), p(1, 3)],
    bonus: p(4, 2),
    wheel: p(4, 3),
    nap: p(3, 3),
    energy: 16,
    scramble: [
      [p(1, 2), 2],
      [p(1, 1), 3],
      [p(3, 2), 1],
      [p(2, 3), 3],
      [p(0, 3), 2],
    ],
  },
  {
    name: ["One-way whiskers", "单行胡须"],
    lesson: [
      "Arrow tunnels only allow travel in the arrow’s direction. Build a return loop.",
      "箭头隧道只能顺箭头行走。连接环路才能回家。",
    ],
    main: [
      p(0, 2),
      p(0, 1),
      p(1, 1),
      p(2, 1),
      p(3, 1),
      p(3, 2),
      p(3, 3),
      p(2, 3),
      p(1, 3),
      p(0, 3),
      p(0, 2),
    ],
    branches: [[p(3, 2), p(4, 2), p(4, 3), p(4, 4), p(3, 4), p(3, 3)]],
    caches: [p(3, 1), p(1, 3)],
    bonus: p(4, 2),
    wheel: p(4, 3),
    nap: p(4, 4),
    arrows: [
      [p(2, 1), 1],
      [p(2, 3), 3],
    ],
    energy: 16,
    scramble: [
      [p(0, 1), 3],
      [p(2, 1), 2],
      [p(3, 2), 3],
      [p(2, 3), 1],
      [p(4, 3), 3],
    ],
  },
  {
    name: ["Two little errands", "两趟小差事"],
    lesson: [
      "Gather every solid seed. An arrow can make the shorter-looking route impossible.",
      "收集所有实心种子。注意箭头方向，近路不一定能走。",
    ],
    main: [
      p(0, 2),
      p(0, 1),
      p(0, 0),
      p(1, 0),
      p(2, 0),
      p(3, 0),
      p(3, 1),
      p(3, 2),
      p(2, 2),
      p(1, 2),
      p(0, 2),
    ],
    branches: [
      [p(2, 2), p(2, 3), p(2, 4)],
      [p(3, 1), p(4, 1), p(4, 2), p(4, 3), p(3, 3), p(2, 3)],
    ],
    caches: [p(2, 0), p(2, 4)],
    bonus: p(4, 1),
    wheel: p(4, 2),
    nap: p(4, 3),
    arrows: [
      [p(1, 0), 1],
      [p(1, 2), 3],
    ],
    energy: 20,
    scramble: [
      [p(0, 0), 2],
      [p(1, 0), 3],
      [p(3, 1), 3],
      [p(2, 2), 1],
      [p(2, 3), 2],
      [p(1, 2), 3],
    ],
  },
  {
    name: ["A switch in the soil", "土里的开关"],
    lesson: [
      "Cross the switch to open the striped gate. Crossing it again closes the gate.",
      "经过开关会打开条纹门，再次经过则关闭。",
    ],
    main: [
      p(0, 2),
      p(0, 1),
      p(1, 1),
      p(2, 1),
      p(3, 1),
      p(3, 2),
      p(3, 3),
      p(2, 3),
      p(1, 3),
      p(0, 3),
      p(0, 2),
    ],
    branches: [[p(3, 2), p(4, 2), p(4, 3), p(4, 4), p(3, 4), p(3, 3)]],
    caches: [p(3, 1), p(1, 3)],
    bonus: p(4, 2),
    wheel: p(4, 3),
    nap: p(4, 4),
    switches: [p(1, 1)],
    gates: [p(3, 2)],
    arrows: [[p(2, 1), 1]],
    energy: 16,
    scramble: [
      [p(0, 1), 3],
      [p(1, 1), 2],
      [p(3, 1), 3],
      [p(3, 2), 1],
      [p(0, 3), 2],
      [p(4, 3), 3],
    ],
  },
  {
    name: ["The sleepy side path", "午睡小径"],
    lesson: [
      "The live stop is optional: a spinning wheel gives 3 energy; a nap gives 4.",
      "实时支线可选：转轮补充3点体力，午睡补充4点。",
    ],
    main: [
      p(0, 3),
      p(0, 2),
      p(1, 2),
      p(1, 1),
      p(2, 1),
      p(3, 1),
      p(3, 2),
      p(3, 3),
      p(2, 3),
      p(1, 3),
      p(0, 3),
    ],
    branches: [
      [p(1, 1), p(1, 0), p(2, 0), p(3, 0), p(3, 1)],
      [p(3, 3), p(4, 3), p(4, 2)],
    ],
    caches: [p(3, 1), p(4, 2)],
    bonus: p(2, 0),
    wheel: p(3, 0),
    nap: p(1, 0),
    switches: [p(1, 2)],
    gates: [p(3, 2)],
    arrows: [[p(2, 1), 1]],
    energy: 19,
    scramble: [
      [p(0, 2), 2],
      [p(1, 2), 3],
      [p(1, 1), 3],
      [p(3, 1), 1],
      [p(3, 3), 2],
      [p(2, 0), 3],
    ],
  },
  {
    name: ["Switchback supper", "折返晚餐"],
    lesson: [
      "Plan the switch order before you run. A closed gate cannot be entered from either side.",
      "出发前规划开关顺序。门关闭时，两侧都无法进入。",
    ],
    main: [
      p(0, 2),
      p(0, 1),
      p(0, 0),
      p(1, 0),
      p(2, 0),
      p(3, 0),
      p(4, 0),
      p(4, 1),
      p(4, 2),
      p(3, 2),
      p(2, 2),
      p(1, 2),
      p(0, 2),
    ],
    branches: [
      [p(2, 2), p(2, 3), p(2, 4)],
      [p(4, 2), p(4, 3), p(4, 4), p(3, 4), p(2, 4)],
    ],
    caches: [p(4, 0), p(2, 4)],
    bonus: p(4, 3),
    wheel: p(4, 4),
    nap: p(3, 4),
    switches: [p(1, 0)],
    gates: [p(4, 1)],
    arrows: [
      [p(2, 0), 1],
      [p(1, 2), 3],
    ],
    energy: 23,
    scramble: [
      [p(0, 0), 3],
      [p(1, 0), 2],
      [p(4, 0), 3],
      [p(4, 1), 2],
      [p(2, 2), 1],
      [p(2, 3), 3],
      [p(4, 4), 2],
    ],
  },
  {
    name: ["Roots and roundabouts", "树根环岛"],
    lesson: [
      "Three caches, one home. Junctions let you use the same tunnel more than once.",
      "三处种子，一个家。利用岔路重复经过隧道。",
    ],
    main: [
      p(0, 2),
      p(1, 2),
      p(1, 1),
      p(1, 0),
      p(2, 0),
      p(3, 0),
      p(3, 1),
      p(3, 2),
      p(3, 3),
      p(2, 3),
      p(1, 3),
      p(1, 2),
    ],
    branches: [
      [p(1, 1), p(2, 1), p(3, 1)],
      [p(3, 2), p(4, 2), p(4, 3), p(4, 4), p(3, 4), p(3, 3)],
    ],
    caches: [p(2, 0), p(2, 1), p(1, 3)],
    bonus: p(4, 2),
    wheel: p(4, 3),
    nap: p(4, 4),
    arrows: [[p(3, 1), 2]],
    switches: [p(1, 0)],
    gates: [p(3, 2)],
    energy: 22,
    scramble: [
      [p(1, 2), 3],
      [p(1, 1), 2],
      [p(1, 0), 3],
      [p(3, 1), 1],
      [p(2, 3), 3],
      [p(4, 3), 2],
      [p(3, 4), 3],
    ],
  },
  {
    name: ["The amber vault", "琥珀粮仓"],
    lesson: [
      "Keep an eye on energy. The optional live stop restores energy only once per trip.",
      "留意体力。每趟旅程只能在实时补给点恢复一次。",
    ],
    main: [
      p(0, 3),
      p(0, 2),
      p(0, 1),
      p(1, 1),
      p(2, 1),
      p(2, 0),
      p(3, 0),
      p(4, 0),
      p(4, 1),
      p(4, 2),
      p(3, 2),
      p(2, 2),
      p(2, 3),
      p(1, 3),
      p(0, 3),
    ],
    branches: [[p(2, 3), p(2, 4), p(3, 4), p(4, 4), p(4, 3), p(4, 2)]],
    caches: [p(1, 1), p(4, 0), p(2, 2)],
    bonus: p(4, 4),
    wheel: p(4, 3),
    nap: p(3, 4),
    switches: [p(2, 0)],
    gates: [p(4, 1)],
    arrows: [
      [p(3, 0), 1],
      [p(1, 3), 3],
    ],
    energy: 22,
    scramble: [
      [p(0, 1), 2],
      [p(1, 1), 3],
      [p(2, 1), 1],
      [p(2, 0), 3],
      [p(4, 1), 2],
      [p(3, 2), 3],
      [p(2, 3), 1],
      [p(4, 4), 3],
    ],
  },
  {
    name: ["The burrow circuit", "地洞大环线"],
    lesson: [
      "One last circuit. Bring every seed home, then try for the optional third star.",
      "最后一圈。把全部种子带回家，再挑战可选的第三颗星。",
    ],
    main: [
      p(0, 2),
      p(0, 1),
      p(0, 0),
      p(1, 0),
      p(2, 0),
      p(3, 0),
      p(4, 0),
      p(4, 1),
      p(4, 2),
      p(4, 3),
      p(4, 4),
      p(3, 4),
      p(2, 4),
      p(1, 4),
      p(0, 4),
      p(0, 3),
      p(0, 2),
    ],
    branches: [
      [p(2, 0), p(2, 1), p(2, 2), p(3, 2), p(4, 2)],
      [p(2, 2), p(1, 2), p(1, 3), p(1, 4)],
    ],
    caches: [p(4, 0), p(4, 4), p(0, 4)],
    bonus: p(2, 2),
    wheel: p(3, 2),
    nap: p(1, 3),
    switches: [p(1, 0)],
    gates: [p(4, 1)],
    arrows: [
      [p(3, 0), 1],
      [p(3, 4), 3],
    ],
    energy: 25,
    scramble: [
      [p(0, 0), 3],
      [p(1, 0), 2],
      [p(2, 0), 1],
      [p(4, 0), 3],
      [p(4, 1), 2],
      [p(4, 4), 3],
      [p(2, 4), 1],
      [p(0, 3), 2],
      [p(2, 2), 3],
    ],
  },
];
export const levels: Level[] = plans.map((plan, i) => {
  const size = plan.size ?? 5,
    at = ([x, y]: Point) => y * size + x;
  const tiles: Tile[] = Array.from({ length: size * size }, (_, id) => ({
    id,
    ports: 0,
    initial: 0,
    role: "plain",
  }));
  for (const path of [plan.main, ...(plan.branches ?? [])])
    for (let j = 1; j < path.length; j++) {
      const a = path[j - 1],
        b = path[j],
        d = directions.findIndex(
          (v) => v.dx === b[0] - a[0] && v.dy === b[1] - a[1],
        );
      if (d < 0) throw new Error(`Non-adjacent authored path, level ${i + 1}`);
      tiles[at(a)].ports |= directions[d].bit;
      tiles[at(b)].ports |= directions[(d + 2) % 4].bit;
    }
  const set = (points: Point[], role: Role) =>
    points.forEach((point) => (tiles[at(point)].role = role));
  set(plan.caches, "cache");
  set([plan.bonus], "bonus");
  set([plan.wheel], "wheel");
  set([plan.nap], "nap");
  set(plan.switches ?? [], "switch");
  set(plan.gates ?? [], "gate");
  const home = at(plan.main[0]);
  tiles[home].role = "home";
  tiles[home].fixed = true;
  for (const [point, d] of plan.arrows ?? []) tiles[at(point)].oneWay = d;
  for (const [point, turns] of plan.scramble) tiles[at(point)].initial = turns;
  const solution: [number, number][] = plan.scramble.map(([point, turns]) => [
    at(point),
    (4 - turns) % 4,
  ]);
  const par = solution.reduce((sum, [, n]) => sum + n, 0);
  return {
    id: i + 1,
    size,
    name: plan.name,
    lesson: plan.lesson,
    tiles,
    home,
    energy: plan.energy,
    maxMoves: par + (i < 2 ? 4 : 5),
    par,
    solution,
  };
});
