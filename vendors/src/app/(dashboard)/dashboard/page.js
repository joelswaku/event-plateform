"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, MessageSquare, Star, Calendar, Eye,
  ArrowUpRight, ArrowRight, CheckCircle, Circle, Share2,
  User, BarChart2, ExternalLink, Loader2
} from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

const STATUS_CONFIG = {
  new: { label: "New", bg: "rgba(99,102,241,0.15)", color: "#a78bfa", border: "rgba(99,102,241,0.3)" },
  responded: { label: "Responded", bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  booked: { label: "Booked", bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.3)" },
  declined: { label: "Declined", bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function KPICard({ title, value, sub, color, icon: Icon, loading, T }) {
  return (
    <div style={{
      background: T.cardBgSolid, border: `1px solid ${T.border}`,
      borderRadius: "18px", padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: `${color}18`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={19} color={color} />
        </div>
      </div>
      {loading ? (
        <div style={{ height: "38px", background: T.borderSub, borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
      ) : (
        <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "4px", color: T.text }}>{value}</div>
      )}
      <div style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, marginBottom: "2px" }}>{title}</div>
      {sub && <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>{sub}</div>}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

function calcProfileCompleteness(vendor) {
  if (!vendor) return { tasks: [], pct: 0 };
  const tasks = [
    { label: "Write your bio", done: !!vendor.bio, href: "/profile" },
    { label: "Add portfolio photos", done: Array.isArray(vendor.portfolio) && vendor.portfolio.length > 0, href: "/profile" },
    { label: "List your services", done: Array.isArray(vendor.services) && vendor.services.length > 0, href: "/profile" },
    { label: "Set your base price", done: vendor.base_price != null, href: "/profile" },
    { label: "Add logo/cover image", done: !!vendor.logo_url || !!vendor.cover_url, href: "/profile" },
    { label: "Complete contact info", done: !!vendor.phone || !!vendor.website_url, href: "/profile" },
  ];
  const completed = tasks.filter((t) => t.done).length;
  return { tasks, pct: Math.round((completed / tasks.length) * 100) };
}

export default function DashboardPage() {
  const T = useT();
  const { vendor } = useVendorStore();
  const displayName = vendor?.business_name || vendor?.businessName || vendor?.name || "Vendor";
  const firstName = displayName.split(" ")[0];

  const [analytics, setAnalytics] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/vendors/me/analytics");
        setAnalytics(res.data.data);
      } catch {}
      finally { setAnalyticsLoading(false); }
    };
    const fetchInquiries = async () => {
      try {
        const res = await api.get("/vendors/me/inquiries");
        setRecentInquiries((res.data.data || []).slice(0, 5));
      } catch {}
      finally { setInquiriesLoading(false); }
    };
    fetchAnalytics();
    fetchInquiries();
  }, []);

  const { tasks: profileTasks, pct: completionPct } = calcProfileCompleteness(vendor);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "6px", color: T.text }}>
          {getGreeting()}, {firstName} 👋
        </h1>
        <p style={{ fontSize: "14px", color: T.textSub, fontWeight: 500 }}>
          Here's what's happening with your vendor profile
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", marginBottom: "32px" }} className="kpi-grid">
        <KPICard title="Profile Views" value={analytics?.profile_views ?? "—"} sub="All time" color="#6366f1" icon={Eye} loading={analyticsLoading} T={T} />
        <KPICard title="Total Inquiries" value={analytics?.inquiry_count ?? "—"} sub={`${analytics?.inquiryRate ?? "—"}% inquiry rate`} color="#10b981" icon={MessageSquare} loading={analyticsLoading} T={T} />
        <KPICard title="Avg Rating" value={analytics?.rating != null ? `${parseFloat(analytics.rating).toFixed(1)}★` : "—"} sub={`${analytics?.review_count ?? 0} reviews`} color="#f59e0b" icon={Star} loading={analyticsLoading} T={T} />
        <KPICard title="Total Bookings" value={analytics?.booking_count ?? "—"} sub={`${analytics?.conversionRate ?? "—"}% conversion`} color="#a78bfa" icon={Calendar} loading={analyticsLoading} T={T} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }} className="dash-main-grid">
        <div>
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "2px", color: T.text }}>Recent Inquiries</h2>
                <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>Last 5 received</p>
              </div>
              <Link href="/inquiries" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: 700, color: "#6366f1", textDecoration: "none" }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              {inquiriesLoading ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <Loader2 size={24} color={T.textFaint} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : recentInquiries.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: T.textMuted }}>
                  <MessageSquare size={28} style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>No inquiries yet</p>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>Inquiries from organizers will appear here</p>
                </div>
              ) : recentInquiries.map((inq, idx) => {
                const st = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                const initials = inq.sender_name?.[0]?.toUpperCase() || "?";
                const colors = ["#6366f1","#10b981","#f59e0b","#a78bfa","#f43f5e"];
                const avatarColor = colors[idx % colors.length];
                return (
                  <div
                    key={inq.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px", padding: "16px 24px",
                      borderBottom: idx < recentInquiries.length - 1 ? `1px solid ${T.borderSub}` : "none",
                      transition: "background 0.15s", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "10px",
                      background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}90)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 900, color: "#fff", flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{inq.sender_name}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>
                        {inq.event_type || "Event"} · {inq.event_date ? new Date(inq.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date(inq.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {inq.budget && <div style={{ fontSize: "14px", fontWeight: 800, color: "#10b981" }}>${Number(inq.budget).toLocaleString()}</div>}
                      <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>Budget</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "Update Profile", icon: User, href: "/profile", color: "#6366f1" },
              { label: "View Listing", icon: ExternalLink, href: vendor?.slug ? `/vendor/${vendor.slug}` : "/marketplace", color: "#10b981" },
              { label: "Share Profile", icon: Share2, href: "#", color: "#a78bfa" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "12px", background: T.cardBgSolid, border: `1px solid ${T.border}`, textDecoration: "none", color: T.text, fontSize: "13px", fontWeight: 700, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${action.color}40`; e.currentTarget.style.background = T.hoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.cardBgSolid; }}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${action.color}15`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={15} color={action.color} />
                  </div>
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", color: T.text }}>Profile Completeness</h2>
            <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>Complete your profile to rank higher</p>
          </div>
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <div style={{ position: "relative", width: "100px", height: "100px" }}>
                <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke={T.borderSub} strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(completionPct / 100) * 264} 264`}
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: T.text }}>{completionPct}%</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profileTasks.map((task) => (
                <Link key={task.label} href={task.href} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", textDecoration: "none", borderBottom: `1px solid ${T.inputBg}`, transition: "opacity 0.15s" }}>
                  {task.done ? <CheckCircle size={17} color="#10b981" /> : <Circle size={17} color={T.textFaint} />}
                  <span style={{ fontSize: "13px", fontWeight: 600, flex: 1, color: task.done ? T.textMuted : T.textSub, textDecoration: task.done ? "line-through" : "none" }}>
                    {task.label}
                  </span>
                  {!task.done && <ArrowUpRight size={13} color={T.textFaint} />}
                </Link>
              ))}
            </div>
            {completionPct < 100 && (
              <Link href="/profile" style={{ display: "block", marginTop: "16px", padding: "11px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", textDecoration: "none", textAlign: "center" }}>
                Complete Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 700px) { .kpi-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) { .dash-main-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
