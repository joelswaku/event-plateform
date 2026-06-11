"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, QrCode, ClipboardList, User } from "lucide-react";

const TABS = [
  { label: "Home",    href: "/dashboard", icon: Home },
  { label: "Events",  href: "/events",    icon: CalendarDays },
  null, // center Scan FAB
  { label: "Planner", href: "/planner",   icon: ClipboardList },
  { label: "Profile", href: "/settings",  icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/10"
      style={{ background: "rgba(10,10,20,0.97)", backdropFilter: "blur(12px)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around px-1 pt-2 pb-2">
        {TABS.map((tab, idx) => {
          if (!tab) {
            return (
              <Link
                key="scan"
                href="/events"
                className="relative z-10 -mt-5 flex flex-col items-center gap-1 transition-transform active:scale-95"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-[18px]"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)", boxShadow: "0 4px 20px rgba(16,185,129,0.45)" }}
                >
                  <QrCode size={22} className="text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Scan
                </span>
              </Link>
            );
          }

          const { label, href, icon: Icon } = tab;
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 pb-1 text-[10px] font-semibold transition-opacity active:opacity-60"
              style={{ color: active ? "#6366f1" : "rgba(255,255,255,0.40)" }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center rounded-xl"
                style={active ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" } : {}}
              >
                <Icon className="w-5 h-5" />
              </div>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
