import test from "node:test";
import assert from "node:assert/strict";
import { parseMeasurement, LiveStatus, type Signal } from "../src/live.ts";
const payload = (coreStatus: unknown = "IDLE", rpmMilli: unknown = 0) => ({
  measurement: { coreStatus, rpmMilli },
});
test("Only validated documented fields determine idle/spinning and RPM", () => {
  assert.deepEqual(parseMeasurement(payload()), { mode: "idle", rpm: 0 });
  assert.deepEqual(parseMeasurement(payload("ACTIVE", 12500)), {
    mode: "spinning",
    rpm: 12.5,
  });
  assert.equal(parseMeasurement(payload("IDLE", 1)).mode, "spinning");
  assert.equal(
    parseMeasurement({ measurement: { coreStatus: "ACTIVE" } }).rpm,
    null,
  );
  assert.equal(
    parseMeasurement({ measurement: { rpmMilli: 0 }, fakeSpeed: 999999 }).mode,
    "idle",
  );
});
test("Reject fault, unrecognized statuses and malformed numeric readings", () => {
  for (const data of [
    null,
    {},
    [],
    { measurement: {} },
    payload("SPINNING"),
    payload("COUNTER_FAULT"),
    payload("IDLE", -1),
    payload("IDLE", 1.2),
    payload("ACTIVE", "1000"),
    payload("IDLE", Infinity),
    payload("IDLE", Number.MAX_SAFE_INTEGER + 1),
  ])
    assert.throws(() => parseMeasurement(data));
});
test("Polling retries with backoff, recovers, and stops cleanly", async () => {
  const signals: Signal[] = [];
  let calls = 0;
  const live = new LiveStatus((s) => signals.push(s), {
    interval: 15,
    maxBackoff: 60,
    timeout: 50,
    fetcher: async () => {
      calls++;
      if (calls <= 2) throw Error("network");
      return new Response(JSON.stringify(payload("ACTIVE", 1000)));
    },
  });
  live.start();
  await new Promise<void>((resolve, reject) => {
    const timer = setInterval(() => {
      if (signals.some((s) => s.state === "online")) {
        clearInterval(timer);
        resolve();
      }
    }, 5);
    setTimeout(() => {
      clearInterval(timer);
      reject(Error("recovery not reached"));
    }, 500).unref();
  });
  live.stop();
  assert.equal(signals[0].state, "offline");
  assert.equal(signals[0].nextIn, 15);
  assert.equal(signals[1].nextIn, 30);
  assert.equal(signals.at(-1)?.state, "online");
  assert.equal(signals.at(-1)?.nextIn, 15);
  const previous = calls;
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(calls, previous);
});
test("Timeout aborts a hung API call and keeps idle practice available", async () => {
  let aborted = false;
  const states: Signal[] = [];
  const live = new LiveStatus((s) => states.push(s), {
    interval: 500,
    timeout: 12,
    fetcher: (_input, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(Error("aborted"));
        }),
      ),
  });
  live.start();
  await new Promise((r) => setTimeout(r, 35));
  live.stop();
  assert.ok(aborted);
  assert.equal(states[0].state, "offline");
  assert.equal(states[0].error, "timeout");
  assert.equal(states[0].mode, "idle");
});
test("A new level cannot snapshot an expired successful reading as live", async () => {
  let now = 1_000;
  const live = new LiveStatus(() => {}, {
    interval: 500_000,
    now: () => now,
    fetcher: async () => new Response(JSON.stringify(payload())),
  });
  live.start();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(live.current().state, "online");
  now += 60_001;
  assert.equal(live.current().state, "offline");
  assert.equal(live.current().error, "stale");
  live.stop();
});
