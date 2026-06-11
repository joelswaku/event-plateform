"use client";
import { useTheme } from "@/context/ThemeContext";

/* Returns a comprehensive set of theme-aware style tokens.
   Usage:  const T = useT();
           <div style={{ background: T.pageBg, color: T.text }}> */

const DARK = {
  // Page / structure
  pageBg:      "#0B0A0F",
  sectionBg:   "rgba(255,255,255,0.012)",
  sidebarBg:   "#0a0a12",

  // Cards / glass
  cardBg:      "rgba(255,255,255,0.025)",
  cardBgSolid: "#0e0e1a",
  glassBorder: "rgba(255,255,255,0.07)",
  cardShadow:  "none",

  // Borders
  border:      "rgba(255,255,255,0.08)",
  borderSub:   "rgba(255,255,255,0.05)",
  borderHover: "rgba(255,255,255,0.14)",

  // Inputs
  inputBg:     "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.09)",

  // Interactive
  hoverBg:     "rgba(255,255,255,0.04)",
  activeBg:    "rgba(79,70,229,0.12)",
  activeBorder:"rgba(79,70,229,0.22)",

  // Typography
  text:        "#ffffff",
  textSub:     "rgba(255,255,255,0.45)",
  textMuted:   "rgba(255,255,255,0.28)",
  textFaint:   "rgba(255,255,255,0.15)",
  label:       "rgba(255,255,255,0.32)",

  // Special
  statColor:   "rgba(255,255,255,0.9)",
  pricingPop:  "#0c0c1a",
  selectBg:    "#1a1825",
};

const LIGHT = {
  // Page / structure
  pageBg:      "#f4f3ff",
  sectionBg:   "rgba(0,0,0,0.025)",
  sidebarBg:   "#ffffff",

  // Cards / glass
  cardBg:      "rgba(255,255,255,0.9)",
  cardBgSolid: "#ffffff",
  glassBorder: "rgba(0,0,0,0.08)",
  cardShadow:  "0 2px 16px rgba(0,0,0,0.06)",

  // Borders
  border:      "rgba(0,0,0,0.09)",
  borderSub:   "rgba(0,0,0,0.05)",
  borderHover: "rgba(0,0,0,0.18)",

  // Inputs
  inputBg:     "rgba(0,0,0,0.04)",
  inputBorder: "rgba(0,0,0,0.1)",

  // Interactive
  hoverBg:     "rgba(0,0,0,0.04)",
  activeBg:    "rgba(79,70,229,0.08)",
  activeBorder:"rgba(79,70,229,0.2)",

  // Typography
  text:        "#0d0c1d",
  textSub:     "rgba(13,12,29,0.55)",
  textMuted:   "rgba(13,12,29,0.35)",
  textFaint:   "rgba(13,12,29,0.18)",
  label:       "rgba(13,12,29,0.4)",

  // Special
  statColor:   "#0d0c1d",
  pricingPop:  "#ffffff",
  selectBg:    "#ffffff",
};

export default function useT() {
  const { theme } = useTheme();
  const raw = theme === "light" ? LIGHT : DARK;

  /* Glass card style — the most-used composite in the app */
  const glass = {
    background:           raw.cardBg,
    backdropFilter:       "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border:               `1px solid ${raw.glassBorder}`,
    borderRadius:         "18px",
    boxShadow:            raw.cardShadow,
  };

  /* Input style */
  const input = (hasError = false) => ({
    width:        "100%",
    padding:      "11px 14px",
    background:   raw.inputBg,
    border:       `1px solid ${hasError ? "rgba(248,113,113,0.4)" : raw.inputBorder}`,
    borderRadius: "11px",
    fontSize:     "13px",
    fontWeight:   400,
    color:        raw.text,
    outline:      "none",
    boxSizing:    "border-box",
    fontFamily:   "inherit",
    transition:   "border-color 0.2s, background 0.2s, box-shadow 0.2s",
  });

  return { ...raw, glass, input, isDark: theme === "dark" };
}
