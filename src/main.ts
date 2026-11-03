import "./style.css";
import { levels } from "./levels";
import {
  newGame,
  rotate,
  undo,
  reset,
  rotateMask,
  reachable,
  findJourney,
  stars,
  directions,
  type Game,
  type Mode,
  type Tile,
  type Journey,
} from "./engine";
import { LiveStatus, STATUS_URL, initialSignal, type Signal } from "./live";
import { loadSave, writeSave, award, type Save } from "./storage";
import { copy } from "./i18n";
import { hamster, seed, icon, meadow } from "./art";

const root = document.querySelector<HTMLDivElement>("#app")!;
const modal = document.createElement("dialog");
modal.id = "modal";
document.body.append(modal);
const announce = document.createElement("div");
announce.className = "sr-only";
announce.setAttribute("role", "status");
announce.setAttribute("aria-live", "polite");
document.body.append(announce);
let storage: Storage | null = null;
try {
  storage = localStorage;
} catch {
  /* Private browser storage can be unavailable. */
}
let save: Save = loadSave(storage),
  storageOK = true,
  signal: Signal = { ...initialSignal };
let game: Game = newGame(levels[0], "idle");
let rule: { mode: Mode; online: boolean; checkedAt: number | null } = {
  mode: "idle",
  online: false,
  checkedAt: null,
};
let includeBonus = false,
  selected = game.level.solution[0][0],
  hint = "",
  feedback = "",
  feedbackKind: "error" | "hint" | "" = "";
let travelSwitch = false,
  bonusCollected = false;
let running = false,
  travelPos: number | null = null,
  travelSeeds = new Set<number>(),
  travelEnergy = game.level.energy,
  journey: Journey | null = null,
  token = 0;
let activeModal = "",
  modalTrigger = "",
  audio: AudioContext | null = null;
const t = () => copy[save.language];
const zh = () => save.language === "zh";
const live = new LiveStatus((next) => {
  signal = next;
  updateLive();
});
function persist() {
  storageOK = writeSave(storage, save);
}
function tell(text: string) {
  announce.textContent = "";
  requestAnimationFrame(() => (announce.textContent = text));
}
function tune(win = false) {
  if (!save.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(win ? 660 : 440, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      win ? 990 : 520,
      audio.currentTime + 0.1,
    );
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    osc.start();
    osc.stop(audio.currentTime + 0.17);
  } catch {
    /* Audio is optional; the game never depends on it. */
  }
}
function startLevel(index: number) {
  token++;
  running = false;
  travelSwitch = false;
  bonusCollected = false;
  travelPos = null;
  travelSeeds.clear();
  journey = null;
  hint = "";
  feedback = "";
  feedbackKind = "";
  includeBonus = false;
  const current = live.current();
  signal = current;
  rule = {
    mode: current.state === "online" ? current.mode : "idle",
    online: current.state === "online",
    checkedAt: current.checkedAt,
  };
  game = newGame(levels[index], rule.mode);
  selected = game.level.solution[0]?.[0] ?? game.level.home;
  travelEnergy = game.level.energy;
  render();
  tell(`${t().level} ${game.level.id}: ${game.level.name[zh() ? 1 : 0]}`);
}
function doReset() {
  token++;
  running = false;
  travelSwitch = false;
  bonusCollected = false;
  travelPos = null;
  travelSeeds.clear();
  journey = null;
  game = reset(game);
  travelEnergy = game.level.energy;
  hint = "";
  feedback = "";
  feedbackKind = "";
  render();
  tell(t().ready);
}
function tileName(tile: Tile) {
  const c = t(),
    row = Math.floor(tile.id / game.level.size) + 1,
    col = (tile.id % game.level.size) + 1;
  const ports = rotateMask(tile.ports, game.turns[tile.id]);
  const openings = directions
    .flatMap((d, i) =>
      ports & d.bit
        ? [c[(["north", "east", "south", "west"] as const)[i]]]
        : [],
    )
    .join(", ");
  const role =
    tile.role === "plain"
      ? c.plain
      : c[tile.role === "cache" ? "seeds" : tile.role];
  return `${zh() ? `第${row}行第${col}列` : `Row ${row}, column ${col}`}: ${role}; ${c.openings}: ${openings}${tile.oneWay !== undefined ? `; ${c.oneWay}: ${c[(["north", "east", "south", "west"] as const)[(tile.oneWay + game.turns[tile.id]) % 4]]}` : ""}; ${tile.fixed ? c.fixedTile : c.rotateHint}`;
}
function tunnel(tile: Tile) {
  const ports = rotateMask(tile.ports, game.turns[tile.id]),
    points = [
      [50, -2],
      [102, 50],
      [50, 102],
      [-2, 50],
    ],
    open = directions.flatMap((d, i) => (ports & d.bit ? [i] : []));
  let path = "";
  if (open.length === 2) {
    const a = points[open[0]],
      b = points[open[1]];
    path = `M${a[0]} ${a[1]}Q50 50 ${b[0]} ${b[1]}`;
  } else
    for (const d of open) path += `M50 50L${points[d][0]} ${points[d][1]} `;
  const arrow =
    tile.oneWay !== undefined
      ? `<g transform="rotate(${((tile.oneWay + game.turns[tile.id]) % 4) * 90} 50 50)"><path d="M50 29L40 43H46V65H54V43H60Z" fill="#fff3ce" stroke="#245b55" stroke-width="1.5"/></g>`
      : "";
  return `<svg class="tunnel" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="tunnel-wall" d="${path}" fill="none" stroke-width="39" stroke-linecap="round"/><path class="tunnel-floor" d="${path}" fill="none" stroke-width="27" stroke-linecap="round"/>${arrow}</svg>`;
}
function tileMarker(tile: Tile) {
  if (travelPos === tile.id)
    return `<span class="marker traveler">${hamster()}</span>`;
  if (tile.role === "home")
    return `<span class="marker home-marker">${hamster()}<span class="home-roof"></span></span>`;
  if (tile.role === "cache" || tile.role === "bonus")
    return `<span class="marker seed-marker ${tile.role === "bonus" ? "bonus-marker" : ""} ${travelSeeds.has(tile.id) || (tile.role === "bonus" && bonusCollected) ? "collected" : ""}">${tile.role === "bonus" ? icon("star") : seed}</span>`;
  if (tile.role === "wheel")
    return `<span class="marker stop-marker ${rule.mode === "spinning" ? "active-stop" : "inactive-stop"}">${icon("wheel")}</span>`;
  if (tile.role === "nap")
    return `<span class="marker stop-marker ${rule.mode === "idle" ? "active-stop" : "inactive-stop"}">${icon("moon")}</span>`;
  if (tile.role === "switch")
    return `<span class="marker switch-marker"><svg viewBox="0 0 36 36" aria-hidden="true"><rect x="5" y="20" width="26" height="10" rx="4" fill="#f6d67e" stroke="#5e4b28" stroke-width="2"/><path d="M18 23L25 9" stroke="#5e4b28" stroke-width="4"/><circle cx="25" cy="9" r="5" fill="#d89b41" stroke="#5e4b28" stroke-width="2"/></svg></span>`;
  if (tile.role === "gate" && travelSwitch)
    return `<span class="marker gate-marker gate-open"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M5 5V31M31 5V31M5 8H31" fill="none" stroke="#655339" stroke-width="3"/><path d="M12 20L17 25L26 14" fill="none" stroke="#23554c" stroke-width="3" stroke-linecap="round"/></svg></span>`;
  if (tile.role === "gate")
    return `<span class="marker gate-marker"><svg viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="6" width="28" height="24" rx="3" fill="#f4d58b" stroke="#655339" stroke-width="2"/><path d="M10 8V28M18 8V28M26 8V28" stroke="#7f6944" stroke-width="3"/></svg></span>`;
  return "";
}
function tilesHTML() {
  const connections = reachable(game);
  return game.level.tiles
    .map((tile) => {
      if (!tile.ports)
        return `<div class="soil-tile" aria-hidden="true"><span></span></div>`;
      const hintTile =
        game.moves === 0 && game.level.id === 1 && tile.id === selected;
      return `<button type="button" id="tile-${tile.id}" class="tile ${connections.has(tile.id) ? "connected" : ""} ${tile.id === selected ? "selected" : ""} ${hintTile ? "tutorial-tile" : ""} ${tile.fixed ? "fixed-tile" : ""}" data-tile="${tile.id}" tabindex="${tile.id === selected ? 0 : -1}" aria-label="${tileName(tile)}" ${running || game.won ? "disabled" : ""}>${tunnel(tile)}${tileMarker(tile)}<span class="turn-cue">${icon("rotate")}</span></button>`;
    })
    .join("");
}
function starsHTML(n: number, cls = "") {
  return `<span class="star-row ${cls}" role="img" aria-label="${n} / 3 ${t().stars}">${[1, 2, 3].map((i) => `<span class="${i <= n ? "earned" : ""}">${icon("star")}</span>`).join("")}</span>`;
}
function liveHTML() {
  const c = t(),
    s = signal;
  return `<span class="signal-dot ${s.state}" aria-hidden="true"></span><span>${s.state === "connecting" ? c.connecting : s.state === "offline" ? c.offline : s.mode === "spinning" ? c.spinning : c.idle}</span>${s.state === "online" && s.rpm !== null ? `<span class="rpm">${new Intl.NumberFormat(save.language, { maximumFractionDigits: 3 }).format(s.rpm)} rpm</span>` : ""}`;
}
function ruleHTML() {
  const c = t();
  return `<span class="rule-icon">${icon(rule.mode === "spinning" ? "wheel" : "moon")}</span><div><strong>${c.thisRun}: ${rule.mode === "spinning" ? c.wheel : c.nap}${!rule.online ? ` · ${c.offline}` : ""}</strong><p>${rule.mode === "spinning" ? c.spinRule : c.idleRule} ${c.fixed}</p></div>`;
}
function render() {
  const c = t(),
    l = game.level,
    focus = document.activeElement?.id;
  document.documentElement.lang = zh() ? "zh-Hans" : "en";
  document.documentElement.dataset.motion = save.motion ? "reduced" : "system";
  root.innerHTML = `<a class="skip-link" href="#board">${c.return}</a>
  <header class="site-header"><a class="brand" href="#" aria-label="Squeek Burrow Circuit">${hamster()}<h1>Squeek <span>Burrow Circuit</span></h1></a>
    <nav class="header-actions" aria-label="${zh() ? "工具" : "Game utilities"}"><button type="button" class="icon-button" id="sound" aria-label="${c.sound}" aria-pressed="${save.sound}">${icon(save.sound ? "sound" : "mute")}</button><button type="button" class="language-button" id="language" lang="${zh() ? "en" : "zh-Hans"}">${c.language}</button><button type="button" class="icon-button" id="help" aria-label="${c.help}">${icon("help")}</button></nav></header>
  <main><div class="level-heading"><div><h2>${l.name[zh() ? 1 : 0]}</h2><p class="goal">${c.goal}</p></div><button type="button" class="level-picker" id="choose-level">${c.level} ${String(l.id).padStart(2, "0")} <span>/ 12</span><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 10L12 14L16 10"/></svg></button></div>
  <div class="game-layout"><section class="play-area" aria-label="${zh() ? "游戏棋盘" : "Puzzle board"}">
    <div class="meters"><div class="meter"><span>${icon("rotate")}${c.moves}</span><strong>${game.moves} <small>/ ${l.maxMoves}</small></strong></div><div class="meter"><span>${icon("energy")}${c.energy}</span><strong>${running || game.won ? travelEnergy : l.energy}</strong></div><div class="meter"><span>${seed}${c.seeds}</span><strong>${travelSeeds.size} <small>/ ${l.tiles.filter((t) => t.role === "cache").length}</small></strong></div><div class="meter best-meter">${starsHTML(save.stars[l.id - 1])}<span>${c.stars}</span></div></div>
    <div class="burrow-scene"><div class="scene-live"><span class="tiny-hamster">${hamster(signal.mode === "idle")}</span><div id="live-indicator">${liveHTML()}</div><span class="scene-caption">${c.subtitle}</span></div>${meadow}
      <div class="soil-scene"><span class="root-decoration root-left" aria-hidden="true"></span><span class="root-decoration root-right" aria-hidden="true"></span><div class="board" id="board" role="group" style="--size:${l.size}" aria-label="${zh() ? "旋转隧道棋盘" : "Rotatable tunnel board"}">${tilesHTML()}</div><span class="soil-stone stone-a" aria-hidden="true"></span><span class="soil-stone stone-b" aria-hidden="true"></span></div>
      <div class="board-legend"><span>${hamster()}${c.home}</span><span>${seed}${c.seeds}</span><span>${icon("star")}${c.bonus}</span></div></div>
    <div class="board-directions"><p>${c.instruction}</p><p class="key-hint">${c.keys}</p></div>
    <div class="play-controls"><button type="button" class="secondary-button" id="undo" aria-label="${c.undo}" ${game.history.length === 0 || running ? "disabled" : ""}>${icon("undo")}<span>${c.undo}</span></button><button type="button" class="secondary-button" id="reset" aria-label="${c.reset}">${icon("reset")}<span>${c.reset}</span></button><button type="button" class="primary-button" id="send" ${running || game.won ? "disabled" : ""}>${icon("play")}<span>${running ? c.running : c.send}</span></button></div>
    <div class="feedback ${feedbackKind}" id="feedback" ${!feedback ? "hidden" : ""}>${feedback}</div>
    ${game.won && journey ? `<div class="win-panel" role="region" aria-label="${c.success}"><div class="win-hamster">${hamster()}</div><div><h3>${l.id === 12 ? c.finished : c.success}</h3><p>${l.id === 12 ? c.finishLine : c.successLine}</p>${starsHTML(stars(game, journey))}<p class="journey-summary">${journey.path.length - 1} ${c.routeLength} · ${journey.energy} ${c.remaining}</p></div><button type="button" id="next" class="primary-button">${l.id < 12 ? c.next : c.replay}${icon("arrow")}</button></div>` : ""}
  </section>
  <aside class="field-notes"><section class="lesson-section"><div class="notebook-mark" aria-hidden="true">${icon("help")}</div><h3>${c.help}</h3><p class="lesson-text">${l.lesson[zh() ? 1 : 0]}</p><div class="star-goals"><p>${icon("star")}${c.star1}</p><p>${icon("star")}${c.star2} ${l.par} ${!zh() && l.par === 1 ? "rotation" : c.star2end}</p><p>${icon("star")}${c.star3}</p></div><button type="button" id="hint" class="text-button">${icon("help")}${c.hint}</button><p class="hint-copy" ${!hint ? "hidden" : ""}>${hint}</p></section>
    <section class="live-section"><h3>${c.ruleLabel}</h3><div id="run-rule" class="run-rule">${ruleHTML()}</div><label class="bonus-toggle"><input id="bonus" type="checkbox" ${includeBonus ? "checked" : ""} ${running || game.won ? "disabled" : ""}/><span>${c.optional}<small>${c.optionalHint}</small></span></label><p class="live-explanation">${c.liveHint}</p><p class="freshness" id="freshness"></p><div class="live-actions"><a href="${STATUS_URL}" target="_blank" rel="noopener noreferrer">${c.source}${icon("arrow")}</a><button type="button" id="retry" class="text-button" ${signal.state === "online" ? "hidden" : ""}>${c.retry}</button></div><div id="new-live-rule"></div></section>
  </aside></div>
  <section class="burrow-trail" aria-label="${c.levels}"><div class="trail-title"><h3>${zh() ? "地洞之旅" : "The burrow trail"}</h3><span>${save.stars.filter((n) => n > 0).length} / 12</span></div><div class="trail-levels">${levels.map((level, i) => `<button type="button" id="trail-${i}" data-level="${i}" class="trail-stop ${level.id === l.id ? "active" : ""} ${save.stars[i] ? "complete" : ""}" ${i > 0 && !save.stars[i - 1] ? "disabled" : ""} aria-label="${c.level} ${i + 1}: ${level.name[zh() ? 1 : 0]}${i > 0 && !save.stars[i - 1] ? `. ${c.locked}` : ""}" ${level.id === l.id ? 'aria-current="step"' : ""}><span>${i + 1}</span>${save.stars[i] ? icon("check") : i > 0 && !save.stars[i - 1] ? icon("lock") : '<span class="trail-dot"></span>'}</button>`).join("")}</div></section>
  </main><footer><p id="storage-note">${storageOK ? c.local : c.unsaved}</p><div><button type="button" class="text-button" id="about">${c.about}</button><button type="button" class="text-button" id="solutions">${c.solutions}</button><label class="motion-toggle"><input type="checkbox" id="motion" ${save.motion ? "checked" : ""}/>${c.motion}</label></div></footer>`;
  bind();
  updateLive();
  if (focus) document.getElementById(focus)?.focus({ preventScroll: true });
}
function updateLive() {
  const c = t(),
    el = document.querySelector("#live-indicator");
  if (el) el.innerHTML = liveHTML();
  const tiny = document.querySelector(".tiny-hamster");
  if (tiny) tiny.innerHTML = hamster(signal.mode === "idle");
  const time =
    signal.checkedAt === null
      ? c.never
      : `${c.checked} ${new Date(signal.checkedAt).toLocaleTimeString(zh() ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  const freshness = document.querySelector("#freshness");
  if (freshness)
    freshness.textContent = `${time}${signal.state === "offline" ? ` · ${c.liveMissing}` : ""}`;
  const retry = document.querySelector<HTMLButtonElement>("#retry");
  if (retry) retry.hidden = signal.state === "online";
  const changed =
    signal.state === "online" && (!rule.online || signal.mode !== rule.mode);
  const newRule = document.querySelector("#new-live-rule");
  if (newRule) {
    newRule.innerHTML = changed
      ? `<p class="changed-note">${c.liveChanged}</p><button type="button" id="new-run" class="secondary-button">${c.newRun}</button>`
      : "";
    newRule
      .querySelector("#new-run")
      ?.addEventListener("click", () => openModal("new-run"));
  }
}
function bind() {
  root.querySelector(".brand")?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .querySelector("#board")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-tile]").forEach((button) => {
    button.addEventListener("click", () =>
      doRotate(Number(button.dataset.tile)),
    );
    button.addEventListener("focus", () => {
      selected = Number(button.dataset.tile);
      root.querySelectorAll<HTMLButtonElement>("[data-tile]").forEach((b) => {
        b.tabIndex = b === button ? 0 : -1;
        b.classList.toggle("selected", b === button);
      });
    });
    button.addEventListener("keydown", (e) => {
      const d = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[
        e.key
      ];
      if (d === undefined) return;
      e.preventDefault();
      const x = selected % game.level.size,
        y = Math.floor(selected / game.level.size);
      for (let distance = 1; distance < game.level.size; distance++) {
        const nx = x + directions[d].dx * distance,
          ny = y + directions[d].dy * distance;
        if (nx < 0 || ny < 0 || nx >= game.level.size || ny >= game.level.size)
          break;
        const id = ny * game.level.size + nx;
        if (game.level.tiles[id].ports) {
          document.getElementById(`tile-${id}`)?.focus();
          break;
        }
      }
    });
  });
  const click = (id: string, fn: () => void) =>
    document.getElementById(id)?.addEventListener("click", fn);
  click("send", () => void send());
  click("undo", () => {
    game = undo(game);
    journey = null;
    travelSwitch = false;
    bonusCollected = false;
    travelSeeds.clear();
    travelPos = null;
    feedback = "";
    hint = "";
    render();
    tell(t().undo);
  });
  click("reset", () =>
    game.moves || running || game.won ? openModal("reset") : doReset(),
  );
  click("language", () => {
    save = { ...save, language: zh() ? "en" : "zh" };
    hint = "";
    feedback = "";
    persist();
    render();
  });
  click("sound", () => {
    save = { ...save, sound: !save.sound };
    persist();
    tune();
    render();
  });
  click("help", () => openModal("help"));
  click("about", () => openModal("about"));
  click("solutions", () => openModal("solutions"));
  click("choose-level", () => openModal("levels"));
  click("retry", () => void live.refresh());
  click("next", () => {
    startLevel(game.level.id < 12 ? game.level.id : 0);
    document
      .querySelector("#board")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
    document
      .querySelector<HTMLButtonElement>(".tile.selected")
      ?.focus({ preventScroll: true });
  });
  click("hint", () => {
    const tile = game.level.tiles.find(
      (tile) => (4 - game.turns[tile.id]) % 4 > 0 && tile.ports && !tile.fixed,
    );
    const c = t();
    hint = tile
      ? c.hintText
          .replace("{r}", String(Math.floor(tile.id / game.level.size) + 1))
          .replace("{c}", String((tile.id % game.level.size) + 1))
          .replace("{n}", String((4 - game.turns[tile.id]) % 4))
      : c.hintDone;
    selected = tile?.id ?? selected;
    render();
    tell(hint);
  });
  root
    .querySelector<HTMLInputElement>("#bonus")
    ?.addEventListener("change", (e) => {
      includeBonus = (e.target as HTMLInputElement).checked;
      feedback = "";
      render();
    });
  root
    .querySelector<HTMLInputElement>("#motion")
    ?.addEventListener("change", (e) => {
      save = { ...save, motion: (e.target as HTMLInputElement).checked };
      persist();
      render();
    });
  root
    .querySelectorAll<HTMLButtonElement>("[data-level]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        startLevel(Number(button.dataset.level)),
      ),
    );
}
function doRotate(id: number) {
  if (running || game.won) return;
  selected = id;
  const next = rotate(game, id);
  if (next === game && game.moves >= game.level.maxMoves) {
    feedback = t().noMoves;
    feedbackKind = "error";
    tell(feedback);
  } else if (next !== game) {
    game = next;
    feedback = "";
    feedbackKind = "";
    hint = "";
    tune();
  }
  render();
}
async function send() {
  if (running || game.won) return;
  const result = findJourney(game, includeBonus);
  if (!result.success) {
    feedback = `${t().failed} ${result.reason === "energy" ? t().energyError : t().disconnected}`;
    feedbackKind = "error";
    render();
    tell(feedback);
    return;
  }
  const runToken = ++token;
  running = true;
  feedback = "";
  travelSeeds.clear();
  journey = result;
  travelEnergy = game.level.energy;
  const seenRest = new Set<number>();
  const reduced =
    save.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (let i = 0; i < result.path.length; i++) {
    if (runToken !== token) return;
    const pos = result.path[i],
      tile = game.level.tiles[pos];
    travelPos = pos;
    travelSwitch = result.switchStates[i];
    if (i > 0) travelEnergy--;
    if (tile.role === "cache") travelSeeds.add(pos);
    if (tile.role === "bonus") bonusCollected = true;
    if (
      tile.role === (game.mode === "spinning" ? "wheel" : "nap") &&
      !seenRest.has(pos)
    ) {
      travelEnergy += game.mode === "spinning" ? 3 : 4;
      seenRest.add(pos);
    }
    render();
    if (!reduced) await new Promise((resolve) => setTimeout(resolve, 185));
  }
  if (runToken !== token) return;
  running = false;
  game = { ...game, won: true };
  save = award(save, game.level.id, stars(game, result));
  persist();
  tune(true);
  render();
  tell(`${t().success} ${stars(game, result)} ${t().stars}`);
  document.getElementById("next")?.focus({ preventScroll: true });
}
function openModal(kind: string) {
  activeModal = kind;
  modalTrigger = document.activeElement?.id ?? "";
  const c = t();
  let body = "",
    title = "";
  if (kind === "help") {
    title = c.guideTitle;
    body = `${[1, 2, 3, 4].map((n) => `<section class="guide-section"><h3>${c[`guide${n}` as "guide1"]}</h3><p>${c[`guide${n}text` as "guide1text"]}</p></section>`).join("")}<p class="keyboard-guide">${c.guideKeys}</p>`;
  }
  if (kind === "about") {
    title = c.aboutTitle;
    body = `<div class="about-hamster">${hamster()}</div><p>${c.aboutText}</p><p>${c.aboutLive}</p><p>${c.aboutPrivacy}</p><div class="about-links"><a href="./source-repository/index.html" target="_blank" rel="noopener noreferrer">${c.sourceRepo}${icon("arrow")}</a><a href="https://squeekchain.com" target="_blank" rel="noopener noreferrer">${c.official}${icon("arrow")}</a><a href="https://squeekchain.com/genesis/code" target="_blank" rel="noopener noreferrer">${c.genesis}${icon("arrow")}</a></div>`;
  }
  if (kind === "levels") {
    title = c.levels;
    body = `<div class="level-list">${levels.map((l, i) => `<button type="button" class="level-option ${l.id === game.level.id ? "current" : ""}" data-modal-level="${i}" ${i > 0 && !save.stars[i - 1] ? "disabled" : ""}><span class="level-number">${String(i + 1).padStart(2, "0")}</span><span><strong>${l.name[zh() ? 1 : 0]}</strong><small>${save.stars[i] ? c.completed : i > 0 && !save.stars[i - 1] ? c.locked : c.unlocked}</small></span>${save.stars[i] ? starsHTML(save.stars[i]) : icon(i > 0 && !save.stars[i - 1] ? "lock" : "arrow")}</button>`).join("")}</div>`;
  }
  if (kind === "solutions") {
    title = c.solutions;
    body = `<p>${c.solutionIntro}</p><div class="solution-list">${levels
      .map(
        (l) =>
          `<details><summary>${c.level} ${l.id}: ${l.name[zh() ? 1 : 0]}</summary><ol>${l.solution
            .map(
              ([id, n]) =>
                `<li>${c.hintText
                  .replace("{r}", String(Math.floor(id / l.size) + 1))
                  .replace("{c}", String((id % l.size) + 1))
                  .replace("{n}", String(n))}</li>`,
            )
            .join("")}</ol></details>`,
      )
      .join("")}</div>`;
  }
  if (kind === "reset" || kind === "new-run") {
    title = c.confirmReset;
    body = `<p>${c.resetText}</p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-modal">${c.cancel}</button><button type="button" class="primary-button" id="confirm-reset">${kind === "new-run" ? c.newRun : c.reset}</button></div>`;
  }
  modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button type="button" class="icon-button" id="close-modal" aria-label="${c.close}">${icon("close")}</button></div><div class="modal-body">${body}</div>`;
  modal.setAttribute("aria-labelledby", "modal-title");
  modal
    .querySelector("#close-modal")
    ?.addEventListener("click", () => modal.close());
  modal
    .querySelector("#cancel-modal")
    ?.addEventListener("click", () => modal.close());
  modal.querySelector("#confirm-reset")?.addEventListener("click", () => {
    modal.close();
    kind === "new-run" ? startLevel(game.level.id - 1) : doReset();
  });
  modal.querySelectorAll<HTMLButtonElement>("[data-modal-level]").forEach((b) =>
    b.addEventListener("click", () => {
      modal.close();
      startLevel(Number(b.dataset.modalLevel));
    }),
  );
  modal.showModal();
}
modal.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const items = [
    ...modal.querySelectorAll<HTMLElement>(
      'button:not(:disabled),a[href],input:not(:disabled),summary,[tabindex="0"]',
    ),
  ].filter((el) => el.getClientRects().length > 0);
  const first = items[0],
    last = items.at(-1);
  if (
    first &&
    (items.length === 1 ||
      (!e.shiftKey && document.activeElement === last) ||
      (e.shiftKey && document.activeElement === first))
  ) {
    e.preventDefault();
    (e.shiftKey ? last : first)?.focus();
  }
});
modal.addEventListener("close", () => {
  activeModal = "";
  document.getElementById(modalTrigger)?.focus({ preventScroll: true });
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      modal.close();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    activeModal ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
  )
    return;
  if (e.key.toLowerCase() === "u" && !running) {
    e.preventDefault();
    game = undo(game);
    journey = null;
    travelSwitch = false;
    bonusCollected = false;
    travelSeeds.clear();
    travelPos = null;
    feedback = "";
    render();
  }
  if (e.key.toLowerCase() === "r") {
    e.preventDefault();
    if (game.moves || running || game.won) openModal("reset");
  }
});
window.addEventListener("online", () => void live.refresh());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    signal = live.current();
    updateLive();
    void live.refresh();
  }
});
window.addEventListener("pagehide", () => live.stop());
window.addEventListener("pageshow", () => live.start());
render();
live.start();
