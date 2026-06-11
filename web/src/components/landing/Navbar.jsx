"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const NAV_LINKS = [
  { href: "#templates", label: "Templates" },
  { href: "#features",  label: "Features"  },
  { href: "#pricing",   label: "Pricing"   },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user            = useAuthStore((s) => s.user);
  const logout          = useAuthStore((s) => s.logout);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mobileOpen]);

  const loggedIn = mounted && isAuthenticated;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm" : "bg-white/70 backdrop-blur-md"
      }`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow">
            <span className="text-white text-sm font-black">W</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">WedSite</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="hover:text-gray-900 transition-colors">{label}</a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <>
              <Link href="/dashboard"
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button onClick={() => logout()}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-500 px-3 py-1.5 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link href="/register" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          onClick={(e) => { e.stopPropagation(); setMobileOpen((v) => !v); }}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-white border-b border-gray-100 shadow-lg px-6 py-4 flex flex-col gap-3 md:hidden"
          onClick={(e) => e.stopPropagation()}>
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 py-2 border-b border-gray-50 last:border-0 transition-colors">
              {label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {loggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  className="text-center flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  className="text-center text-sm font-medium text-red-500 py-2.5 rounded-xl border border-red-100 hover:bg-red-50 transition-colors w-full">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="text-center text-sm font-medium text-gray-600 py-2.5 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="text-center bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
