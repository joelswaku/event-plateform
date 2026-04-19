"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PlusSquare,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Create Event", href: "/events/create", icon: PlusSquare },
];

export default function DashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`hidden border-r border-[#e5e7eb] bg-white transition-all duration-300 md:flex md:flex-col ${
        sidebarOpen ? "md:w-[260px]" : "md:w-[88px]"
      }`}
    >
      {/* HEADER */}
      <div className="flex h-20 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Sparkles className="h-5 w-5 text-[#4f46e5]" />
          </div>

          {sidebarOpen && (
            <div>
              <p className="text-sm font-semibold">MeetCraft</p>
              <p className="text-xs text-gray-500">Event Platform</p>
            </div>
          )}
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[#eef2ff] text-[#3730a3]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* UPGRADE */}
        {sidebarOpen && (
          <div className="mt-8 rounded-3xl bg-[#f5f3ff] p-4">
            <p className="text-sm font-semibold text-[#4c1d95]">
              Upgrade your workspace
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Unlock advanced features.
            </p>

            <button className="mt-4 w-full rounded-2xl bg-black px-4 py-2 text-sm text-white">
              Upgrade now
            </button>
          </div>
        )}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-[#f3f4f6] p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-black"
        >
          <Settings className="h-5 w-5" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}

