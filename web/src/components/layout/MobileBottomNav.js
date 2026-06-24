"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, QrCode, ClipboardList, User } from "lucide-react";

const TABS = [
  { label: "Home",    href: "/dashboard", icon: Home },
  { label: "Events",  href: "/events",    icon: CalendarDays },
  { label: "Scan",    href: "/events",    icon: QrCode,        isScan: true },
  { label: "Planner", href: "/planner",   icon: ClipboardList },
  { label: "Profile", href: "/settings",  icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed z-40 md:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ffffff",
        borderRadius: 9999,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
        padding: "6px 6px",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {TABS.map((tab) => {
        const { label, href, icon: Icon, isScan } = tab;

        if (isScan) {
          return (
            <Link
              key="scan"
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
              style={{
                minWidth: 54,
                padding: "8px 10px",
                borderRadius: 9999,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.40)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#6b7280", marginTop: 1 }}>
                {label}
              </span>
            </Link>
          );
        }

        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
          (href === "/dashboard" && pathname === "/dashboard");

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
            style={{
              minWidth: 58,
              padding: "8px 10px",
              borderRadius: 9999,
              background: active ? "rgba(99,102,241,0.10)" : "transparent",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                size={22}
                style={{ color: active ? "#6366f1" : "#374151" }}
                strokeWidth={active ? 2.2 : 1.8}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? "#6366f1" : "#6b7280",
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
