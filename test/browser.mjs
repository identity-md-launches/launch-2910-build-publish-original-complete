import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(process.env.SQUEEK_TOOLCHAIN || import.meta.url);
const { chromium, webkit } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const solutions = JSON.parse(
  await readFile("docs/level-solutions.json", "utf8"),
);
const root = resolve("dist"),
  out = resolve("test/scratch/screenshots");
await mkdir(out, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".zip": "application/zip",
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!path.startsWith("/burrow/")) throw Error();
    const file = resolve(root, path.slice(8) || "index.html");
    if (!file.startsWith(root + "/")) throw Error();
    res.setHeader(
      "Content-Type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/burrow/`;
const results = [],
  limitations = [];
let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log("PASS", name);
  } catch (e) {
    failures++;
    results.push({ name, passed: false, error: String(e) });
    console.error("FAIL", name, e.stack || String(e));
  }
}
async function mock(page, mode = "IDLE") {
  await page.route("https://api.squeekchain.com/v1/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        measurement: {
          coreStatus: mode,
          rpmMilli: mode === "ACTIVE" ? 12500 : 0,
        },
      }),
    }),
  );
}
async function currentRule(page) {
  if (await page.locator("#new-run").count()) {
    await page.locator("#new-run").click();
    await page.locator("#confirm-reset").click();
  }
}
async function solveUI(page, index, bonus = false) {
  if (bonus) await page.locator("#bonus").check();
  for (const step of solutions[index].rotations)
    for (let j = 0; j < step.clockwise; j++)
      await page.locator(`#tile-${step.id}`).click();
  await page.locator("#send").click();
  await page.locator(".win-panel").waitFor({ timeout: 10_000 });
}
let browser;
try {
  browser = await chromium.launch({ headless: true });
  await check(
    "Chromium: relative assets, mobile first screen and no runtime errors",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await mock(page);
      const errors = [],
        bad = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("response", (r) => {
        if (r.url().startsWith(url) && r.status() >= 400) bad.push(r.url());
      });
      await page.goto(url);
      await page.locator(".signal-dot.online").waitFor();
      await page.evaluate(() => document.fonts.ready);
      // An untouched first run adopts the first live reading silently.
      const firstRule = await page.locator("#run-rule").textContent();
      assert.match(firstRule, /Nap nook/);
      assert.doesNotMatch(firstRule, /Offline practice/);
      assert.equal(await page.locator("#new-run").count(), 0);
      assert.equal(await page.locator(".changed-note").count(), 0);
      assert.equal(await page.locator(".notebook-mark").count(), 0);
      const box = await page.locator("#send").boundingBox();
      assert.ok(box.y + box.height <= 844);
      assert.equal(await page.title(), "Squeek Burrow Circuit");
      assert.equal(
        await page.locator("#sound").getAttribute("aria-pressed"),
        "false",
      );
      for (const width of [320, 360, 390, 760, 950, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const dims = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
        }));
        assert.ok(
          dims.scroll <= dims.width,
          `overflow at ${width}: ${JSON.stringify(dims)}`,
        );
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: out + "/mobile-390.png", fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: out + "/desktop-1440.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 320, height: 900 });
      await page.screenshot({ path: out + "/mobile-320.png", fullPage: true });
      assert.deepEqual(errors, []);
      assert.deepEqual(bad, []);
      await context.close();
    },
  );
  await check("Chromium: touch rotate, undo and tutorial win", async () => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 800 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await mock(page);
    await page.goto(url);
    await page.locator("#tile-9").tap();
    assert.match(await page.locator(".meter").first().textContent(), /1/);
    await page.locator("#undo").tap();
    assert.match(await page.locator(".meter").first().textContent(), /0/);
    await page.locator("#tile-9").tap();
    await page.locator("#send").tap();
    await page.locator(".win-panel").waitFor();
    assert.equal(await page.locator("#trail-1").isEnabled(), true);
    await context.close();
  });
  await check(
    "Chromium: keyboard rotate, undo, reset, error, win, focus and persistence",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await mock(page);
      await page.goto(url);
      await page.locator("#send").click();
      assert.match(
        await page.locator("#feedback").textContent(),
        /blocks the round trip/,
      );
      await page.locator("#tile-9").focus();
      await page.keyboard.press("Enter");
      assert.match(await page.locator(".meter").first().textContent(), /1/);
      assert.equal(
        await page
          .locator("#tile-9")
          .evaluate((e) => e === document.activeElement),
        true,
      );
      await page.keyboard.press("u");
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page
          .locator("#tile-10")
          .evaluate((e) => e === document.activeElement),
        true,
      );
      await page.keyboard.press("ArrowLeft");
      assert.match(await page.locator(".meter").first().textContent(), /0/);
      await page.keyboard.press("Enter");
      await page.locator("#reset").click();
      assert.equal(await page.locator("#modal").evaluate((e) => e.open), true);
      await page.locator("#confirm-reset").click();
      assert.match(await page.locator(".meter").first().textContent(), /0/);
      await solveUI(page, 0, true);
      assert.equal(
        await page.locator(".win-panel .star-row").getAttribute("aria-label"),
        "3 / 3 Stars",
      );
      assert.equal(
        await page
          .locator("#next")
          .evaluate((e) => e === document.activeElement),
        true,
      );
      assert.equal(await page.locator("#trail-1").isEnabled(), true);
      await page.screenshot({ path: out + "/win-390.png", fullPage: true });
      await page.reload();
      assert.match(
        await page.locator(".best-meter .star-row").getAttribute("aria-label"),
        /^3/,
      );
      assert.equal(await page.locator("#trail-1").isEnabled(), true);
      await page.locator("#help").click();
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .locator("#modal")
          .evaluate((e) => e.contains(document.activeElement)),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page
          .locator("#help")
          .evaluate((e) => e === document.activeElement),
        true,
      );
      await context.close();
    },
  );
  for (const mode of ["IDLE", "ACTIVE"])
    await check(
      `Chromium: all 12 reference bonus wins and progression with ${mode}`,
      async () => {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        await mock(page, mode);
        await page.goto(url);
        await page.locator(".signal-dot.online").waitFor();
        await currentRule(page);
        for (let i = 0; i < 12; i++) {
          assert.match(
            await page.locator("#run-rule").textContent(),
            mode === "ACTIVE" ? /Energy wheel/ : /Nap nook/,
          );
          await solveUI(page, i, true);
          assert.equal(
            await page
              .locator(".win-panel .star-row")
              .getAttribute("aria-label"),
            "3 / 3 Stars",
            `3 stars on level ${i + 1}`,
          );
          if (i === 11)
            await page.screenshot({
              path: out + `/final-level-${mode.toLowerCase()}.png`,
              fullPage: true,
            });
          else await page.locator("#next").click();
        }
        const save = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("squeek-burrow-circuit:v1")),
        );
        assert.deepEqual(save.stars, Array(12).fill(3));
        await context.close();
      },
    );
  await check(
    "Chromium: live change stays frozen and a new run adopts spinning",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      let active = false;
      await page.route("https://api.squeekchain.com/v1/status", (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            measurement: {
              coreStatus: active ? "ACTIVE" : "IDLE",
              rpmMilli: active ? 2500 : 0,
            },
          }),
        }),
      );
      await page.clock.install();
      await page.goto(url);
      await page.locator(".signal-dot.online").waitFor();
      await currentRule(page);
      const rule = await page.locator("#run-rule").textContent();
      await page.locator("#tile-9").click();
      active = true;
      await page.clock.fastForward(20_100);
      await page
        .locator("#live-indicator")
        .getByText("The wheel is spinning")
        .waitFor();
      assert.equal(await page.locator("#run-rule").textContent(), rule);
      await page.locator("#reset").click();
      await page.locator("#confirm-reset").click();
      assert.equal(await page.locator("#run-rule").textContent(), rule);
      await currentRule(page);
      assert.match(
        await page.locator("#run-rule").textContent(),
        /Energy wheel/,
      );
      await context.close();
    },
  );
  await check(
    "Chromium: API timeout, offline play and timed recovery",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      let calls = 0;
      await page.route(
        "https://api.squeekchain.com/v1/status",
        async (route) => {
          calls++;
          if (calls === 1) {
            await new Promise((r) => setTimeout(r, 100));
            return;
          }
          await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              measurement: { coreStatus: "IDLE", rpmMilli: 0 },
            }),
          });
        },
      );
      await page.clock.install();
      await page.goto(url);
      await page.clock.fastForward(6_100);
      await page.locator(".signal-dot.offline").waitFor();
      assert.match(
        await page.locator("#live-indicator").textContent(),
        /Offline practice/,
      );
      await solveUI(page, 0);
      await page.clock.fastForward(20_100);
      await page.locator(".signal-dot.online").waitFor();
      assert.match(await page.locator("#freshness").textContent(), /Checked/);
      assert.ok(calls >= 2);
      await context.close();
    },
  );
  await check(
    "Chromium: Chinese UI, reduced motion, text enlargement and accessibility",
    async () => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await mock(page);
      await page.goto(url);
      await page.locator("#language").click();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hans");
      assert.match(await page.locator("#send").textContent(), /派吱吱出发/);
      assert.equal(
        await page.evaluate(() =>
          document.fonts.check('600 24px "Noto UI"', "第一颗种子"),
        ),
        true,
      );
      await page.screenshot({ path: out + "/chinese-390.png", fullPage: true });
      await solveUI(page, 0);
      assert.match(
        await page.locator(".win-panel h3").textContent(),
        /回到温暖的家/,
      );
      await page.locator("#next").click();
      await page.evaluate(
        () => (document.documentElement.style.fontSize = "200%"),
      );
      const dims = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dims.scroll <= dims.width,
        "text enlargement horizontal overflow",
      );
      await page.evaluate(() => (document.documentElement.style.fontSize = ""));
      const audits = [];
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        audits.push({
          width,
          violations: audit.violations,
          passes: audit.passes.map((p) => p.id),
        });
      }
      await writeFile(
        "docs/axe-results.json",
        JSON.stringify(
          { violations: audits.flatMap((a) => a.violations), audits },
          null,
          2,
        ) + "\n",
      );
      assert.deepEqual(
        audits.flatMap((a) =>
          a.violations.map((v) => ({
            width: a.width,
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ),
        [],
      );
      const motion = await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      );
      assert.equal(motion, 0);
      await context.close();
    },
  );
  await check(
    "Chromium: corrupt and unavailable storage stay playable",
    async () => {
      for (const blocked of [false, true]) {
        const context = await browser.newContext({ reducedMotion: "reduce" });
        const page = await context.newPage();
        await mock(page);
        await page.addInitScript(
          blocked
            ? () => {
                Object.defineProperty(window, "localStorage", {
                  get() {
                    throw Error("denied");
                  },
                });
              }
            : () =>
                localStorage.setItem("squeek-burrow-circuit:v1", "bad json"),
        );
        await page.goto(url);
        await solveUI(page, 0);
        if (blocked)
          assert.match(
            await page.locator("#storage-note").textContent(),
            /Storage unavailable/,
          );
        await context.close();
      }
    },
  );
  try {
    const safari = await webkit.launch({
      headless: process.env.SQUEEK_WEBKIT_HEADED !== "1",
      timeout: 20_000,
    });
    await check(
      "WebKit: mobile rotate, undo, reset, win and Chinese layout",
      async () => {
        const context = await safari.newContext({
          viewport: { width: 390, height: 844 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        await mock(page);
        await page.goto(url);
        await page.locator("#tile-9").click();
        await page.locator("#undo").click();
        await page.locator("#tile-9").click();
        await page.locator("#reset").click();
        await page.locator("#confirm-reset").click();
        await solveUI(page, 0, true);
        await page.locator("#language").click();
        assert.equal(
          await page.locator("html").getAttribute("lang"),
          "zh-Hans",
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.screenshot({
          path: out + "/webkit-390.png",
          fullPage: true,
        });
        await context.close();
      },
    );
    await safari.close();
  } catch (e) {
    limitations.push(
      "WebKit could not launch on this host (browser executable or OS dependencies unavailable)",
    );
    console.log("LIMITATION WebKit host dependencies unavailable");
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
const summary = {
  date: new Date().toISOString(),
  results,
  passed: results.filter((r) => r.passed).length,
  failed: failures,
  limitations,
};
await writeFile(
  "docs/browser-results.json",
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { passed: summary.passed, failed: failures, limitations },
    null,
    2,
  ),
);
if (failures) process.exitCode = 1;
