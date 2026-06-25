"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, QrCode, ClipboardList, User } from "lucide-react";

const TABS = [
  { label: "Home",    href: "/dashboard", icon: Home },
  { label: "Events",  href: "/events",    icon: CalendarDays },
  { label: "Scan",    href: "/events",    icon: QrCode,        isScan: true },
  { label: "Planner", href: "/planner",   icon: ClipboardList },
  { label: "Profile", href: "/settings",  icon: User },
];

/* Brand color for active state — matches LiteEvent indigo */
const ACTIVE_COLOR = "#6366f1";
const INACTIVE_COLOR = "#1f2937";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed z-40 md:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ffffff",
        borderRadius: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.08)",
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}
    >
      {TABS.map((tab) => {
        const { label, href, icon: Icon, isScan } = tab;

        /* ── Centre Scan FAB ─────────────────── */
        if (isScan) {
          return (
            <Link
              key="scan"
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
              style={{ minWidth: 56, padding: "6px 8px" }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  boxShadow: "0 3px 12px rgba(16,185,129,0.38)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#6b7280", marginTop: 2 }}>
                {label}
              </span>
            </Link>
          );
        }

        /* ── Regular tabs ────────────────────── */
        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
          (href === "/dashboard" && pathname === "/dashboard");

        const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
            style={{ minWidth: 56, padding: "6px 8px" }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.3 : 1.9}
              style={{ color }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color,
                letterSpacing: active ? -0.1 : 0,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
