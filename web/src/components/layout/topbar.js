
"use client";

import { Menu, Search, Bell } from "lucide-react";

export default function Topbar({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 rounded-2xl border bg-[#fafafa] px-4 py-3 md:flex md:w-[360px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              placeholder="Search events..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button className="relative rounded-2xl border p-3 hover:bg-gray-50">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe] font-semibold text-[#5b21b6]">
              J
            </div>

            <div className="hidden md:block">
              <p className="text-sm font-semibold">Joel</p>
              <p className="text-xs text-gray-500">Organizer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}







