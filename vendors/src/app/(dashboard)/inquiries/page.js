"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search, Send, CheckCircle, XCircle, Filter,
  Calendar, Users, DollarSign, Mail, Loader2, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

const STATUS_CONFIG = {
  new:       { label: "New",       bg: "rgba(99,102,241,0.15)",  color: "#a78bfa", border: "rgba(99,102,241,0.3)"  },
  responded: { label: "Responded", bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "rgba(245,158,11,0.3)"  },
  booked:    { label: "Booked",    bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)"  },
  declined:  { label: "Declined",  bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "rgba(239,68,68,0.3)"   },
};

const COLORS = ["#6366f1","#10b981","#f59e0b","#f43f5e","#a78bfa","#0ea5e9"];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function senderColor(name) {
  return COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
}

const FILTER_TABS = ["All", "New", "Responded", "Booked", "Declined"];

export default function InquiriesPage() {
  const T = useT();
  const [inquiries, setInquiries]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState("All");
  const [selected, setSelected]           = useState(null);
  const [replyText, setReplyText]         = useState("");
  const [sending, setSending]             = useState(false);
  const [actioning, setActioning]         = useState(false);
  const [search, setSearch]              = useState("");

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await api.get("/vendors/me/inquiries");
      const data = res.data.data || [];
      setInquiries(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch {
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  // Keep selected in sync with updates
  useEffect(() => {
    if (selected) {
      const updated = inquiries.find((i) => i.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [inquiries]);

  const filtered = inquiries.filter((inq) => {
    const matchesFilter = activeFilter === "All" || inq.status === activeFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !search
      || inq.sender_name?.toLowerCase().includes(q)
      || inq.event_type?.toLowerCase().includes(q)
      || inq.message?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleSendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await api.patch(`/vendors/me/inquiries/${selected.id}/reply`, {
        reply: replyText,
        status: "responded",
      });
      const updated = res.data.data;
      setInquiries((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setSelected(updated);
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setActioning(true);
    try {
      const res = await api.patch(`/vendors/me/inquiries/${selected.id}/status`, { status: newStatus });
      const updated = res.data.data;
      setInquiries((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setSelected(updated);
      toast.success(newStatus === "booked" ? "Marked as booked!" : "Inquiry declined");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActioning(false);
    }
  };

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "4px", color: T.text }}>Inquiries</h1>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>
            {newCount > 0 ? `${newCount} new ${newCount === 1 ? "inquiry" : "inquiries"} waiting for your response` : "All inquiries up to date"}
          </p>
        </div>
        <button onClick={fetchInquiries} style={{ padding: "9px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${T.borderSub}`, background: T.inputBg, color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
          <Loader2 size={28} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : inquiries.length === 0 ? (
        <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📬</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", color: T.text }}>No inquiries yet</h2>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>
            Once organizers discover your profile and reach out, their inquiries will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", height: "calc(100vh - 180px)", minHeight: "500px" }} className="inbox-layout">

          {/* ── Left: Inbox list ── */}
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Search */}
            <div style={{ padding: "14px", borderBottom: `1px solid ${T.borderSub}` }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} color={T.textMuted} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inquiries…" style={{ width: "100%", padding: "9px 12px 9px 32px", background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: "9px", fontSize: "13px", fontWeight: 600, color: T.text, outline: "none" }} />
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", padding: "8px 10px", gap: "3px", borderBottom: `1px solid ${T.borderSub}`, flexWrap: "wrap" }}>
              {FILTER_TABS.map((tab) => {
                const count = tab === "All" ? inquiries.length : inquiries.filter((i) => i.status === tab.toLowerCase()).length;
                return (
                  <button key={tab} onClick={() => setActiveFilter(tab)} style={{ padding: "4px 10px", borderRadius: "7px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer", background: activeFilter === tab ? "rgba(99,102,241,0.15)" : "transparent", color: activeFilter === tab ? "#a78bfa" : T.textMuted, display: "flex", alignItems: "center", gap: "4px" }}>
                    {tab}
                    {count > 0 && <span style={{ background: activeFilter === tab ? "#6366f1" : T.inputBg, borderRadius: "100px", padding: "1px 5px", fontSize: "10px", fontWeight: 800, color: activeFilter === tab ? "#fff" : T.textMuted }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: T.textMuted }}>
                  <Filter size={24} style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "13px", fontWeight: 600 }}>No inquiries found</p>
                </div>
              ) : filtered.map((inq) => {
                const st = STATUS_CONFIG[inq.status] || STATUS_CONFIG.new;
                const isSelected = selected?.id === inq.id;
                const color = senderColor(inq.sender_name);
                return (
                  <div key={inq.id} onClick={() => setSelected(inq)} style={{ padding: "13px 15px", borderBottom: `1px solid ${T.inputBg}`, cursor: "pointer", background: isSelected ? "rgba(99,102,241,0.08)" : "transparent", borderLeft: `3px solid ${isSelected ? "#6366f1" : "transparent"}`, transition: "all 0.12s" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg, ${color}, ${color}90)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                        {inq.sender_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.text }}>{inq.sender_name}</span>
                          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600, flexShrink: 0, marginLeft: "6px" }}>{timeAgo(inq.created_at)}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: T.textSub, fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inq.event_type || "Inquiry"}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ padding: "1px 7px", borderRadius: "100px", fontSize: "10px", fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                          {inq.budget && <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 600 }}>${Number(inq.budget).toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Thread ── */}
          {selected ? (
            <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "13px", alignItems: "center" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(135deg, ${senderColor(selected.sender_name)}, ${senderColor(selected.sender_name)}90)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 900, color: "#fff" }}>
                    {selected.sender_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "2px", color: T.text }}>{selected.sender_name}</h2>
                    <div style={{ fontSize: "13px", color: T.textSub, fontWeight: 600 }}>{selected.sender_email}</div>
                  </div>
                </div>
                {(selected.status === "new" || selected.status === "responded") && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleStatusChange("booked")} disabled={actioning} style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: actioning ? 0.6 : 1 }}>
                      <CheckCircle size={13} /> Mark Booked
                    </button>
                    <button onClick={() => handleStatusChange("declined")} disabled={actioning} style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: actioning ? 0.6 : 1 }}>
                      <XCircle size={13} /> Decline
                    </button>
                  </div>
                )}
              </div>

              {/* Event details strip */}
              <div style={{ padding: "12px 22px", borderBottom: `1px solid ${T.borderSub}`, display: "flex", gap: "18px", flexWrap: "wrap", background: T.sectionBg }}>
                {[
                  selected.event_type && { icon: Mail, label: selected.event_type },
                  selected.event_date && { icon: Calendar, label: fmtDate(selected.event_date) },
                  selected.guest_count && { icon: Users, label: `${selected.guest_count} guests` },
                  selected.budget && { icon: DollarSign, label: `$${Number(selected.budget).toLocaleString()} budget` },
                ].filter(Boolean).map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon size={12} color={T.textMuted} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: T.textSub }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Thread */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Original message */}
                <div style={{ display: "flex", gap: "11px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${senderColor(selected.sender_name)}, ${senderColor(selected.sender_name)}90)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                    {selected.sender_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: T.textFaint, marginBottom: "5px" }}>{selected.sender_name} · {timeAgo(selected.created_at)}</div>
                    <div style={{ padding: "13px 15px", borderRadius: "0 12px 12px 12px", background: T.inputBg, border: `1px solid ${T.borderSub}`, fontSize: "14px", lineHeight: 1.65, color: T.textSub, fontWeight: 500 }}>
                      {selected.message}
                    </div>
                  </div>
                </div>

                {/* Vendor reply if exists */}
                {selected.vendor_reply && (
                  <div style={{ display: "flex", gap: "11px", flexDirection: "row-reverse" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                      Y
                    </div>
                    <div style={{ flex: 1, maxWidth: "80%" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: T.textFaint, marginBottom: "5px", textAlign: "right" }}>
                        You · {selected.replied_at ? timeAgo(selected.replied_at) : ""}
                      </div>
                      <div style={{ padding: "13px 15px", borderRadius: "12px 0 12px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", fontSize: "14px", lineHeight: 1.65, fontWeight: 500, color: T.textSub }}>
                        {selected.vendor_reply}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply input or status banner */}
              {selected.status === "booked" || selected.status === "declined" ? (
                <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderSub}`, textAlign: "center", background: selected.status === "booked" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: selected.status === "booked" ? "#10b981" : "#ef4444" }}>
                    {selected.status === "booked" ? "✓ This inquiry has been booked" : "✕ This inquiry has been declined"}
                  </span>
                </div>
              ) : (
                <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.borderSub}`, display: "flex", gap: "11px", alignItems: "flex-end" }}>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply… (⌘+Enter to send)" rows={3} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendReply(); }}
                    style={{ flex: 1, padding: "11px 13px", resize: "none", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "11px", fontSize: "14px", fontWeight: 600, color: T.text, outline: "none" }}
                  />
                  <button onClick={handleSendReply} disabled={!replyText.trim() || sending}
                    style={{ padding: "11px 18px", borderRadius: "11px", fontSize: "14px", fontWeight: 700, color: "#fff", background: replyText.trim() ? "linear-gradient(135deg, #6366f1, #a78bfa)" : T.inputBg, border: "none", cursor: replyText.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}>
                    {sending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
                    Send
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: T.textFaint }}>
                <Filter size={32} style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>Select an inquiry to view</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .inbox-layout { grid-template-columns: 1fr !important; height: auto !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
