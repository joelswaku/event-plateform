"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, User, MessageSquare, Star, BarChart2, Settings,
  LogOut, Menu, X, Zap, ChevronRight, BadgeCheck
} from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }) {
  const router        = useRouter();
  const pathname      = usePathname();
  const { vendor, isAuthenticated, logout, hydrate } = useVendorStore();
  const { theme }     = useTheme();
  const isDark        = theme === "dark";
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [mounted,     setMounted]         = useState(false);
  const [inquiries,   setInquiries]       = useState(0);

  useEffect(() => { setMounted(true); hydrate(); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/vendors/me/inquiries?status=new")
      .then((r) => setInquiries(r.data.data?.length || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated]);

  if (!mounted) return null;

  const T = {
    pageBg:      isDark ? "#0B0A0F"                     : "#f4f3ff",
    sidebarBg:   isDark ? "#0a0a12"                     : "#ffffff",
    border:      isDark ? "rgba(255,255,255,0.06)"      : "rgba(0,0,0,0.07)",
    text:        isDark ? "#ffffff"                     : "#0d0c1d",
    textSub:     isDark ? "rgba(255,255,255,0.45)"      : "rgba(13,12,29,0.5)",
    activeBg:    isDark ? "rgba(79,70,229,0.12)"        : "rgba(79,70,229,0.08)",
    activeBorder:isDark ? "rgba(79,70,229,0.22)"        : "rgba(79,70,229,0.2)",
    activeText:  isDark ? "#ffffff"                     : "#0d0c1d",
    inactiveText:isDark ? "rgba(255,255,255,0.5)"       : "rgba(13,12,29,0.5)",
    hoverBg:     isDark ? "rgba(255,255,255,0.04)"      : "rgba(0,0,0,0.04)",
    topbarBg:    isDark ? "#0a0a12"                     : "#ffffff",
    spinBorder:  isDark ? "rgba(99,102,241,0.3)"        : "rgba(99,102,241,0.3)",
    overlayBg:   "rgba(0,0,0,0.6)",
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: T.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `2px solid ${T.spinBorder}`, borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: "13px", color: T.textSub, fontWeight: 500 }}>Redirecting…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const displayName = vendor?.business_name || vendor?.businessName || vendor?.fullName || "Vendor";
  const initial     = displayName[0]?.toUpperCase() || "V";
  const category    = vendor?.category || "Vendor";

  const NAV_ITEMS = [
    { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"  },
    { href: "/profile",      icon: User,            label: "My Profile" },
    { href: "/inquiries",    icon: MessageSquare,   label: "Inquiries", badge: inquiries > 0 ? inquiries : null },
    { href: "/reviews",      icon: Star,            label: "Reviews"    },
    { href: "/analytics",    icon: BarChart2,       label: "Analytics"  },
    { href: "/verification", icon: BadgeCheck,      label: "Verification" },
    { href: "/settings",     icon: Settings,        label: "Settings"   },
  ];

  const SidebarContent = () => (
    <div style={{
      width: "260px", height: "100vh", position: "fixed", top: 0,
      background: T.sidebarBg,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      zIndex: 40,
      transition: "background 0.25s ease, border-color 0.25s ease",
    }} className="sidebar">

      {/* Logo row */}
      <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={13} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.015em", color: T.text }}>EventApp</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="sidebar-close-btn"
          style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "none", padding: "4px" }}>
          <X size={16} />
        </button>
      </div>

      {/* Vendor info */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          {vendor?.logo_url ? (
            <img src={vendor.logo_url} alt={displayName}
              style={{ width: "40px", height: "40px", borderRadius: "11px", objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
          ) : (
            <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
              {displayName}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, background: "rgba(79,70,229,0.1)", color: "#818cf8", padding: "2px 8px", borderRadius: "100px", border: "1px solid rgba(79,70,229,0.18)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {category}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", marginBottom: "1px", background: active ? T.activeBg : "transparent", border: `1px solid ${active ? T.activeBorder : "transparent"}`, textDecoration: "none", color: active ? T.activeText : T.inactiveText, transition: "all 0.15s", fontSize: "13px", fontWeight: active ? 600 : 400 }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.inactiveText; } }}>
              <Icon size={16} color={active ? "#6366f1" : isDark ? "rgba(255,255,255,0.35)" : "rgba(13,12,29,0.35)"} strokeWidth={active ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ background: "#ef4444", borderRadius: "100px", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff" }}>
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={13} color="#6366f1" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + sign out */}
      <div style={{ padding: "10px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Theme toggle row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${T.border}` }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: T.textSub }}>
            {isDark ? "Dark mode" : "Light mode"}
          </span>
          <ThemeToggle size="sm" />
        </div>

        {/* Sign out */}
        <button onClick={() => { logout(); router.push("/login"); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: `1px solid ${isDark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.2)"}`, color: isDark ? "rgba(239,68,68,0.65)" : "rgba(220,38,38,0.75)", cursor: "pointer", fontSize: "13px", fontWeight: 500, transition: "all 0.15s", fontFamily: "inherit" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = isDark ? "rgba(239,68,68,0.65)" : "rgba(220,38,38,0.75)"; }}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.pageBg, transition: "background 0.25s ease" }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar-wrapper" style={{ width: "260px", flexShrink: 0 }}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 39, background: T.overlayBg, backdropFilter: "blur(4px)" }}
          className="mobile-overlay" />
      )}

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="mobile-sidebar-wrapper" style={{ position: "fixed", top: 0, left: 0, zIndex: 40 }}>
          <SidebarContent />
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, background: T.topbarBg, position: "sticky", top: 0, zIndex: 30, transition: "background 0.25s ease" }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", color: T.text, cursor: "pointer", display: "flex" }}>
            <Menu size={20} />
          </button>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={12} color="#fff" strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "13px", color: T.text }}>Vendors</span>
          </Link>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff" }}>
            {initial}
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", color: T.text, transition: "color 0.25s ease" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .desktop-sidebar-wrapper { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-sidebar-wrapper .sidebar { position: fixed !important; left: 0 !important; }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
