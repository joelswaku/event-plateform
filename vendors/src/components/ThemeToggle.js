"use client";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ size = "md" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const dim = size === "sm" ? 32 : 36;
  const iconSize = size === "sm" ? 13 : 15;

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        borderRadius: "10px",
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s",
        transform: isDark ? "rotate(0deg) scale(1)" : "rotate(180deg) scale(0.8)",
        opacity: isDark ? 1 : 0,
        position: "absolute",
      }}>
        <Moon size={iconSize} color={isDark ? "rgba(255,255,255,0.7)" : "transparent"} strokeWidth={1.5} />
      </span>
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s",
        transform: isDark ? "rotate(-180deg) scale(0.8)" : "rotate(0deg) scale(1)",
        opacity: isDark ? 0 : 1,
        position: "absolute",
      }}>
        <Sun size={iconSize} color={isDark ? "transparent" : "rgba(13,12,29,0.6)"} strokeWidth={1.5} />
      </span>
    </button>
  );
}
