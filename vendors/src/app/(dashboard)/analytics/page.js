"use client";
import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Eye, MessageSquare, Star, Clock,
  BarChart2, Users, Zap, ArrowUp, ArrowDown, Globe, Search, Share2
} from "lucide-react";
import useT from "@/hooks/useT";

const DATE_RANGES = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

// Generate mock chart data
function generateChartData(days, baseValue, variance) {
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    value: Math.max(0, Math.round(baseValue + (Math.random() - 0.5) * variance * 2)),
  }));
}

const REFERRAL_SOURCES = [
  { source: "Organic Search", pct: 42, color: "#6366f1", count: 356 },
  { source: "Direct Link", pct: 28, color: "#10b981", count: 237 },
  { source: "Social Media", pct: 15, color: "#f59e0b", count: 127 },
  { source: "Event Organizer Referral", pct: 10, color: "#a78bfa", count: 85 },
  { source: "Other", pct: 5, color: "#64748b", count: 42 },
];

const INSIGHTS = [
  {
    icon: TrendingUp,
    text: "Your Photography profile gets 3.2× more views than the category average",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  {
    icon: MessageSquare,
    text: "Responding within 2 hours increases your booking rate by 45%. Your avg response time is 1.8 hours.",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.2)",
  },
  {
    icon: Star,
    text: "Adding 3 more portfolio photos could increase your inquiry rate by an estimated 20%.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
];

function SVGLineChart({ data, color = "#6366f1", height = 160, T }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = Math.min(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;
  const w = 600;
  const h = height;
  const padding = { top: 16, right: 20, bottom: 32, left: 48 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const pts = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, value: d.value, day: d.day };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h - padding.bottom} L ${pts[0].x} ${h - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = [minVal, Math.round(minVal + range / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={T.borderSub} strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill={T.textMuted} fontSize="11" fontFamily="sans-serif">
              {val}
            </text>
          </g>
        );
      })}

      {/* X-axis labels (first, mid, last) */}
      {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((idx) => {
        const p = pts[idx];
        return (
          <text key={idx} x={p.x} y={h - 8} textAnchor="middle" fill={T.textMuted} fontSize="11" fontFamily="sans-serif">
            Day {data[idx].day}
          </text>
        );
      })}

      {/* Area */}
      <path d={areaPath} fill="url(#lineGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on key points */}
      {pts.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === pts.length - 1).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke={T.pageBg} strokeWidth="2" />
      ))}
    </svg>
  );
}

function StatCard({ label, value, sub, trend, trendVal, color, icon: Icon, T }) {
  const isUp = trend === "up";
  return (
    <div style={{
      background: T.cardBgSolid, border: `1px solid ${T.border}`,
      borderRadius: "16px", padding: "20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px",
          background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} color={color} />
        </div>
        {trendVal && (
          <div style={{
            display: "flex", alignItems: "center", gap: "3px",
            fontSize: "12px", fontWeight: 700,
            color: isUp ? "#10b981" : "#ef4444",
          }}>
            {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trendVal}
          </div>
        )}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "3px", color: T.text }}>{value}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, marginBottom: "1px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const T = useT();
  const [range, setRange] = useState("30d");

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  const viewsData = useMemo(() => generateChartData(days, 28, 15), [range]);
  const inquiriesData = useMemo(() => generateChartData(days, 3, 2), [range]);

  const totalViews = viewsData.reduce((a, b) => a + b.value, 0);
  const totalInquiries = inquiriesData.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "4px", color: T.text }}>Analytics</h1>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>Track your profile performance and growth</p>
        </div>
        {/* Date range selector */}
        <div style={{ display: "flex", gap: "6px", background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "5px" }}>
          {DATE_RANGES.map((dr) => (
            <button
              key={dr.value}
              onClick={() => setRange(dr.value)}
              style={{
                padding: "8px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                border: "none", cursor: "pointer",
                background: range === dr.value ? "linear-gradient(135deg, #6366f1, #a78bfa)" : "transparent",
                color: range === dr.value ? "#fff" : T.textSub,
                transition: "all 0.2s",
              }}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }} className="analytics-stats">
        <StatCard label="Total Views" value={totalViews.toLocaleString()} sub={`Last ${days} days`} trend="up" trendVal="+23%" color="#6366f1" icon={Eye} T={T} />
        <StatCard label="Unique Visitors" value={Math.round(totalViews * 0.72).toLocaleString()} sub="Est. unique" trend="up" trendVal="+18%" color="#a78bfa" icon={Users} T={T} />
        <StatCard label="Inquiry Rate" value={`${((totalInquiries / totalViews) * 100).toFixed(1)}%`} sub="Views → inquiries" trend="up" trendVal="+1.2%" color="#10b981" icon={MessageSquare} T={T} />
        <StatCard label="Conversion Rate" value="31.4%" sub="Inquiries → booked" trend="down" trendVal="-2%" color="#f59e0b" icon={BarChart2} T={T} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }} className="analytics-stats-2">
        <StatCard label="Avg Response Time" value="1.8h" sub="Target: under 2h" trend="up" trendVal="↑ Good" color="#6366f1" icon={Clock} T={T} />
        <StatCard label="Total Reviews" value="142" sub="4.9★ average" trend="up" trendVal="+8" color="#f59e0b" icon={Star} T={T} />
        <StatCard label="Rating Trend" value="+0.1" sub="vs last period" trend="up" trendVal="↑" color="#10b981" icon={TrendingUp} T={T} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }} className="charts-grid">
        {/* Profile Views Chart */}
        <div style={{
          background: T.cardBgSolid, border: `1px solid ${T.border}`,
          borderRadius: "18px", padding: "24px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", color: T.text }}>Profile Views</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: T.text }}>{totalViews.toLocaleString()}</span>
              <span style={{
                display: "flex", alignItems: "center", gap: "3px",
                fontSize: "13px", fontWeight: 700, color: "#10b981",
              }}>
                <TrendingUp size={14} /> +23%
              </span>
            </div>
          </div>
          <SVGLineChart data={viewsData} color="#6366f1" height={160} T={T} />
        </div>

        {/* Inquiries Chart */}
        <div style={{
          background: T.cardBgSolid, border: `1px solid ${T.border}`,
          borderRadius: "18px", padding: "24px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", color: T.text }}>Inquiries Received</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: T.text }}>{totalInquiries}</span>
              <span style={{
                display: "flex", alignItems: "center", gap: "3px",
                fontSize: "13px", fontWeight: 700, color: "#10b981",
              }}>
                <TrendingUp size={14} /> +15%
              </span>
            </div>
          </div>
          <SVGLineChart data={inquiriesData} color="#10b981" height={160} T={T} />
        </div>
      </div>

      {/* Insights + Referral Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="insights-grid">
        {/* Insights */}
        <div style={{
          background: T.cardBgSolid, border: `1px solid ${T.border}`,
          borderRadius: "18px", padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Zap size={17} color="#f59e0b" />
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: T.text }}>Top Insights</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {INSIGHTS.map((ins, i) => {
              const Icon = ins.icon;
              return (
                <div key={i} style={{
                  padding: "14px 16px", borderRadius: "12px",
                  background: ins.bg, border: `1px solid ${ins.border}`,
                  display: "flex", gap: "12px", alignItems: "flex-start",
                }}>
                  <Icon size={16} color={ins.color} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 500, color: T.textSub }}>
                    {ins.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral Sources */}
        <div style={{
          background: T.cardBgSolid, border: `1px solid ${T.border}`,
          borderRadius: "18px", padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Globe size={17} color="#6366f1" />
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: T.text }}>Traffic Sources</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {REFERRAL_SOURCES.map((src) => (
              <div key={src.source}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: T.textSub }}>{src.source}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted }}>{src.count}</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: src.color }}>{src.pct}%</span>
                  </div>
                </div>
                <div style={{ height: "6px", background: T.borderSub, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${src.pct}%`,
                    background: src.color, borderRadius: "3px",
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .analytics-stats { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 700px) {
          .analytics-stats { grid-template-columns: 1fr !important; }
          .analytics-stats-2 { grid-template-columns: 1fr !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
          .insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
