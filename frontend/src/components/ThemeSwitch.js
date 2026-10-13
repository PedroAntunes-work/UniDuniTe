import { useEffect, useState } from "react";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeSwitch() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0e141f" : "#f5f7fb";
  }, [theme]);

  return (
    <div className="theme-switch" role="group" aria-label="Tema da página">
      <button type="button" className="theme-button" aria-pressed={theme === "light"} onClick={() => setTheme("light")} title="Modo claro"><span aria-hidden="true">☀</span><span className="visually-hidden">Modo claro</span></button>
      <button type="button" className="theme-button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} title="Modo escuro"><span aria-hidden="true">☾</span><span className="visually-hidden">Modo escuro</span></button>
    </div>
  );
}
