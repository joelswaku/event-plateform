"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "system", resolvedTheme: "light", toggle: () => {} });

function getSystemScheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved) {
  if (resolved === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "system";
    const resolved = saved === "system" ? getSystemScheme() : saved;
    setTheme(resolved);         // treat system as its resolved value from here on
    setResolvedTheme(resolved);
    applyTheme(resolved);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSysChange(e) {
      if (!localStorage.getItem("theme")) {
        const r = e.matches ? "dark" : "light";
        setTheme(r);
        setResolvedTheme(r);
        applyTheme(r);
      }
    }
    mq.addEventListener("change", onSysChange);
    return () => mq.removeEventListener("change", onSysChange);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setResolvedTheme(next);
      applyTheme(next);
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <ThemeCtx.Provider value={{ theme, resolvedTheme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
