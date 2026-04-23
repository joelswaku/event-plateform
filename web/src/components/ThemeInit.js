"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    try {
      const s = localStorage.getItem("theme");
      const m = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (s === "dark" || (!s && m)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}
  }, []);

  return null;
}