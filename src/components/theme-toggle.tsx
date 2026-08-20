import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("zelo-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(preferredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("zelo-theme", theme);
  }, [theme]);

  const dark = theme === "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="fixed bottom-5 left-5 z-50 rounded-full bg-background/95 shadow-elegant backdrop-blur"
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={dark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
