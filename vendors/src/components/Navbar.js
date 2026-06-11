"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Menu, X, ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import { useVendorStore } from "@/store/vendor.store";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features",     href: "#features"     },
  { label: "Categories",   href: "#categories"   },
  { label: "Pricing",      href: "/pricing"      },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, vendor, logout, hydrate } = useVendorStore();

  useEffect(() => { setMounted(true); hydrate(); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const T = {
    text:        isDark ? "rgba(255,255,255,0.65)"  : "rgba(13,12,29,0.65)",
    textHover:   isDark ? "#ffffff"                 : "#0d0c1d",
    hoverBg:     isDark ? "rgba(255,255,255,0.06)"  : "rgba(0,0,0,0.05)",
    borderBtn:   isDark ? "rgba(255,255,255,0.12)"  : "rgba(0,0,0,0.12)",
    borderHover: isDark ? "rgba(255,255,255,0.25)"  : "rgba(0,0,0,0.22)",
    mobileBg:    isDark ? "#0e0e1a"                 : "#ffffff",
    mobileBorder:isDark ? "rgba(255,255,255,0.07)"  : "rgba(0,0,0,0.07)",
    mobileText:  isDark ? "rgba(255,255,255,0.8)"   : "rgba(13,12,29,0.8)",
  };

  const navBg = scrolled
    ? (isDark ? "rgba(11,10,15,0.96)" : "rgba(244,243,255,0.97)")
    : (isDark ? "rgba(11,10,15,0.5)"  : "rgba(244,243,255,0.7)");

  const borderColor = scrolled
    ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)")
    : "transparent";

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "all 0.3s ease", background: navBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${borderColor}` }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.015em", color: isDark ? "#fff" : "#0d0c1d" }}>
            EventApp <span style={{ color: "#818cf8", fontWeight: 600 }}>Vendors</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }} className="desktop-nav">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}
              style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: T.text, transition: "color 0.18s, background 0.18s", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.textHover; e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = "transparent"; }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} className="desktop-ctas">
          <ThemeToggle />
          {mounted && isAuthenticated ? (
            <>
              <Link href="/dashboard"
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 4px 14px rgba(79,70,229,0.25)", textDecoration: "none" }}>
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <button onClick={() => logout()}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: T.textMuted, border: `1px solid ${T.borderBtn}`, background: "none", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.borderBtn; }}>
                <LogOut size={13} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                style={{ padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: T.text, border: `1px solid ${T.borderBtn}`, transition: "all 0.18s", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.textHover; e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.borderBtn; e.currentTarget.style.background = "transparent"; }}>
                Sign In
              </Link>
              <Link href="/register/vendor"
                style={{ padding: "8px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "all 0.18s", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.3)"; }}>
                Join Free <ChevronRight size={13} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div style={{ display: "none", alignItems: "center", gap: "8px" }} className="mobile-controls">
          <ThemeToggle size="sm" />
          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", color: isDark ? "#fff" : "#0d0c1d", cursor: "pointer", padding: "6px", borderRadius: "8px", display: "flex" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: T.mobileBg, borderTop: `1px solid ${T.mobileBorder}`, padding: "16px 24px 24px" }} className="mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              style={{ display: "block", padding: "12px 0", fontSize: "15px", fontWeight: 500, color: T.mobileText, borderBottom: `1px solid ${T.mobileBorder}`, textDecoration: "none" }}>
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {mounted && isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                  style={{ display: "block", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", textAlign: "center", textDecoration: "none" }}>
                  Go to Dashboard
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  style={{ display: "block", width: "100%", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", background: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  style={{ display: "block", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, color: isDark ? "#fff" : "#0d0c1d", border: `1px solid ${T.mobileBorder}`, textAlign: "center", textDecoration: "none" }}>
                  Sign In
                </Link>
                <Link href="/register/vendor" onClick={() => setMobileOpen(false)}
                  style={{ display: "block", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", textAlign: "center", textDecoration: "none" }}>
                  Join as Vendor — Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-ctas { display: none !important; }
          .mobile-controls { display: flex !important; }
        }
        @media (min-width: 769px) { .mobile-menu { display: none !important; } }
      `}</style>
    </nav>
  );
}
