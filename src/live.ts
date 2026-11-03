import type { Mode } from "./engine";
export const STATUS_URL = "https://api.squeekchain.com/v1/status";
export interface Signal {
  state: "connecting" | "online" | "offline";
  mode: Mode;
  rpm: number | null;
  checkedAt: number | null;
  error?: "timeout" | "network" | "schema" | "fault" | "stale";
  nextIn: number;
}
export const initialSignal: Signal = {
  state: "connecting",
  mode: "idle",
  rpm: null,
  checkedAt: null,
  nextIn: 20_000,
};
export function parseMeasurement(data: unknown): {
  mode: Mode;
  rpm: number | null;
} {
  if (!data || typeof data !== "object" || !("measurement" in data))
    throw new Error("schema");
  const m = (data as { measurement: unknown }).measurement;
  if (!m || typeof m !== "object") throw new Error("schema");
  const { coreStatus, rpmMilli } = m as {
    coreStatus?: unknown;
    rpmMilli?: unknown;
  };
  if (
    coreStatus !== undefined &&
    !["IDLE", "ACTIVE", "COUNTER_FAULT"].includes(coreStatus as string)
  )
    throw new Error("schema");
  if (
    rpmMilli !== undefined &&
    (typeof rpmMilli !== "number" ||
      !Number.isSafeInteger(rpmMilli) ||
      rpmMilli < 0)
  )
    throw new Error("schema");
  if (coreStatus === "COUNTER_FAULT") throw new Error("fault");
  if (coreStatus === undefined && rpmMilli === undefined)
    throw new Error("schema");
  const rpm = typeof rpmMilli === "number" ? rpmMilli / 1000 : null;
  return {
    mode:
      coreStatus === "ACTIVE" || (rpm !== null && rpm > 0)
        ? "spinning"
        : "idle",
    rpm,
  };
}
export interface LiveOptions {
  interval?: number;
  timeout?: number;
  maxBackoff?: number;
  fetcher?: typeof fetch;
  now?: () => number;
}
export class LiveStatus {
  value: Signal = { ...initialSignal };
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | undefined;
  private stopped = true;
  private busy = false;
  private readonly interval: number;
  private readonly timeout: number;
  private readonly maxBackoff: number;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  constructor(
    private listener: (s: Signal) => void,
    options: LiveOptions = {},
  ) {
    this.interval = options.interval ?? 20_000;
    this.timeout = options.timeout ?? 6_000;
    this.maxBackoff = options.maxBackoff ?? 120_000;
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? Date.now;
  }
  start() {
    if (!this.stopped) return;
    this.stopped = false;
    void this.refresh();
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.controller?.abort();
  }
  current(): Signal {
    if (
      this.value.state === "online" &&
      this.value.checkedAt !== null &&
      this.now() - this.value.checkedAt > 60_000
    )
      return { ...this.value, state: "offline", rpm: null, error: "stale" };
    return this.value;
  }
  async refresh() {
    if (this.busy || this.stopped) return;
    this.busy = true;
    clearTimeout(this.timer);
    this.controller = new AbortController();
    let timedOut = false;
    const deadline = setTimeout(() => {
      timedOut = true;
      this.controller?.abort();
    }, this.timeout);
    try {
      const response = await this.fetcher(STATUS_URL, {
        signal: this.controller.signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("network");
      const measurement = parseMeasurement(await response.json());
      this.failures = 0;
      this.value = {
        state: "online",
        ...measurement,
        checkedAt: this.now(),
        nextIn: this.interval,
      };
    } catch (error) {
      if (this.stopped) return;
      this.failures++;
      const message = error instanceof Error ? error.message : "";
      this.value = {
        ...this.value,
        state: "offline",
        mode: "idle",
        rpm: null,
        error: timedOut
          ? "timeout"
          : message === "schema"
            ? "schema"
            : message === "fault"
              ? "fault"
              : "network",
        nextIn: Math.min(
          this.maxBackoff,
          this.interval * 2 ** (this.failures - 1),
        ),
      };
    } finally {
      clearTimeout(deadline);
      this.busy = false;
      if (!this.stopped) {
        this.listener(this.current());
        this.timer = setTimeout(() => void this.refresh(), this.value.nextIn);
      }
    }
  }
}
