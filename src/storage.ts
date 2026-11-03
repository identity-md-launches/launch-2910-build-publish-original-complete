export const STORAGE_KEY = "squeek-burrow-circuit:v1";
export interface Save {
  version: 1;
  stars: number[];
  language: "en" | "zh";
  sound: boolean;
  motion: boolean;
}
export const emptySave = (): Save => ({
  version: 1,
  stars: Array(12).fill(0),
  language: "en",
  sound: false,
  motion: false,
});
export function loadSave(storage: Pick<Storage, "getItem"> | null): Save {
  try {
    const d = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "null");
    if (
      !d ||
      d.version !== 1 ||
      !Array.isArray(d.stars) ||
      d.stars.length !== 12
    )
      return emptySave();
    return {
      version: 1,
      stars: d.stars.map((n: unknown) =>
        typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 3
          ? n
          : 0,
      ),
      language: d.language === "zh" ? "zh" : "en",
      sound: d.sound === true,
      motion: d.motion === true,
    };
  } catch {
    return emptySave();
  }
}
export function writeSave(
  storage: Pick<Storage, "setItem"> | null,
  save: Save,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
export function award(save: Save, level: number, stars: number): Save {
  return {
    ...save,
    stars: save.stars.map((n, i) => (i === level - 1 ? Math.max(n, stars) : n)),
  };
}
