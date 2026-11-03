import test from "node:test";
import assert from "node:assert/strict";
import {
  emptySave,
  loadSave,
  writeSave,
  award,
  STORAGE_KEY,
} from "../src/storage.ts";
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, v: string) => {
      values.set(key, v);
    },
  };
}
test("Progress persists and never overwrites a better score", () => {
  const store = memory();
  let s = award(emptySave(), 1, 3);
  s = award(s, 1, 1);
  assert.equal(writeSave(store, s), true);
  assert.equal(loadSave(store).stars[0], 3);
  assert.equal(loadSave(store).stars[1], 0);
});
test("Settings persist; sound defaults off", () => {
  const store = memory();
  assert.equal(loadSave(store).sound, false);
  const s = {
    ...emptySave(),
    language: "zh" as const,
    sound: true,
    motion: true,
  };
  writeSave(store, s);
  assert.deepEqual(loadSave(store), s);
});
test("Malformed or incompatible storage recovers safely", () => {
  const store = memory();
  for (const text of ["bad", "null", "{}", '{"version":2,"stars":[]}']) {
    store.setItem(STORAGE_KEY, text);
    assert.deepEqual(loadSave(store), emptySave());
  }
});
test("Invalid scores are sanitized", () => {
  const store = memory();
  store.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...emptySave(),
      stars: [-1, 4, 2.5, "3", null, 3, 0, 0, 0, 0, 0, 0],
    }),
  );
  assert.deepEqual(loadSave(store).stars.slice(0, 6), [0, 0, 0, 0, 0, 3]);
});
test("Storage restrictions do not crash gameplay", () => {
  assert.deepEqual(
    loadSave({
      getItem: () => {
        throw Error("denied");
      },
    }),
    emptySave(),
  );
  assert.equal(
    writeSave(
      {
        setItem: () => {
          throw Error("full");
        },
      },
      emptySave(),
    ),
    false,
  );
  assert.equal(writeSave(null, emptySave()), false);
});
