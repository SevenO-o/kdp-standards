export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "kdp.ui.theme.v1";
export type ThemeStorage = Pick<Storage, "getItem" | "setItem">;
export function readTheme(storage?: ThemeStorage): Theme {
  try { return storage?.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light"; }
  catch { return "light"; }
}
export function saveTheme(theme: Theme, storage?: ThemeStorage): boolean {
  try { if (!storage) return false; storage.setItem(THEME_STORAGE_KEY, theme); return true; }
  catch { return false; }
}
export function browserThemeStorage(): ThemeStorage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}
