import {createContext, useContext, useEffect, useState, type ReactNode} from "react";
import {Moon, Sun} from "lucide-react";
import {Button} from "@/components/ui/button";
import {browserThemeStorage, readTheme, saveTheme, THEME_STORAGE_KEY, type Theme} from "@/lib/theme-state";

const ThemeContext = createContext<{theme: Theme; toggleTheme: () => void} | null>(null);
export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setTheme] = useState<Theme>(() => readTheme(browserThemeStorage()));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setTheme(readTheme(browserThemeStorage()));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    saveTheme(next, browserThemeStorage());
    setTheme(next);
  };
  return <ThemeContext.Provider value={{theme, toggleTheme}}>{children}</ThemeContext.Provider>;
}
export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeToggle requires ThemeProvider");
  const dark = context.theme === "dark";
  return <Button type="button" variant="ghost" size="icon" onClick={context.toggleTheme} aria-label={dark ? "切换浅色模式" : "切换深色模式"} title={dark ? "切换浅色模式" : "切换深色模式"}>
    {dark ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}
  </Button>;
}
