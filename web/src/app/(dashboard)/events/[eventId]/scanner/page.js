"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  QrCode, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Wifi, WifiOff, Camera, CameraOff,
  ChevronRight, Loader2, Ticket, Users, BarChart3,
  ClipboardList, Search, Trash2, RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Device ID ────────────────────────────────────────────────────────────────
function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("scanner_device_id");
  if (!id) {
    id = `web-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("scanner_device_id", id);
  }
  return id;
}

// ─── Offline queue ────────────────────────────────────────────────────────────
const QUEUE_KEY = "scanner_offline_queue";
function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
function enqueueOffline(qr_token, eventId) {
  const q = loadQueue();
  if (!q.find((s) => s.qr_token === qr_token)) {
    q.push({ qr_token, eventId, queued_at: new Date().toISOString() });
    saveQueue(q);
  }
}

// ─── Result config ────────────────────────────────────────────────────────────
const RC = {
  SUCCESS:   { label: "Checked In!",        color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  Icon: CheckCircle2  },
  DUPLICATE: { label: "Already Checked In", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  Icon: AlertTriangle },
  INVALID:   { label: "Invalid Ticket",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   Icon: XCircle       },
  REVOKED:   { label: "Ticket Revoked",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   Icon: XCircle       },
  OFFLINE:   { label: "Queued (offline)",   color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  Icon: WifiOff       },
};

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Load ZXing from CDN (fallback only) ──────────────────────────────────────
let _zxingPromise = null;
function loadZXing() {
  if (_zxingPromise) return _zxingPromise;
  _zxingPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(); return; }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js";
    script.onload = () => {
      try { resolve(new window.ZXing.BrowserQRCodeReader()); } catch { reject(); }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _zxingPromise;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, Icon }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.04] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={14} style={{ color: accent }} className="opacity-60" />}
      </div>
      <span className="text-2xl font-black" style={{ color: accent }}>{value ?? "—"}</span>
      {sub && <span className="text-[11px] text-foreground/25">{sub}</span>}
    </div>
  );
}

// ─── ScanResultBanner ─────────────────────────────────────────────────────────
function ScanResultBanner({ result }) {
  if (!result) return null;
  const cfg  = RC[result.type] ?? RC.INVALID;
  const Icon = cfg.Icon;
  return (
    <div className="flex items-start gap-4 rounded-2xl border p-4"
      style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${cfg.color}25` }}>
        <Icon size={20} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
        {result.holder_name     && <p className="text-sm text-foreground/80 font-medium mt-0.5">{result.holder_name}</p>}
        {result.ticket_type_name && <p className="text-[11px] text-foreground/40 mt-0.5">{result.ticket_type_name}</p>}
        {result.holder_email    && <p className="text-[11px] text-foreground/30">{result.holder_email}</p>}
        {result.message && !result.holder_name && <p className="text-[11px] text-foreground/50 mt-0.5">{result.message}</p>}
        <p className="text-[10px] text-foreground/20 mt-1">{fmtTime(result.scanned_at)}</p>
      </div>
    </div>
  );
}

// ─── ScanFeedItem ─────────────────────────────────────────────────────────────
function ScanFeedItem({ scan }) {
  const cfg  = RC[scan.type] ?? RC.INVALID;
  const Icon = cfg.Icon;
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/[0.04] transition">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${cfg.color}20` }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground/75 truncate">
          {scan.holder_name || (scan.qr_token ? `${scan.qr_token.slice(0, 18)}…` : "Unknown")}
        </p>
        <p className="text-[10px] text-foreground/30 truncate">{scan.ticket_type_name || cfg.label}</p>
      </div>
      <span className="text-[10px] text-foreground/25 shrink-0">{fmtTime(scan.scanned_at)}</span>
    </div>
  );
}

// ─── Camera QR Scanner component ─────────────────────────────────────────────
// Note: everything INSIDE the black camera viewfinder intentionally keeps white colours.
function CameraScanner({ onScan, active }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const stoppedRef = useRef(false);
  const lastToken  = useRef(null);
  const lastAt     = useRef(0);

  const [error,  setError]  = useState(null);
  const [ready,  setReady]  = useState(false);
  const [method, setMethod] = useState(null);
  const detectorRef = useRef(null);

  function fireToken(token) {
    if (!token) return;
    const now = Date.now();
    if (token === lastToken.current && now - lastAt.current < 3000) return;
    lastToken.current = token;
    lastAt.current    = now;
    onScan(token);
  }

  function stopAll() {
    stoppedRef.current = true;
    setReady(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current  = null;
    detectorRef.current = null;
  }

  async function tickNative() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tickNative);
      return;
    }
    try {
      const codes = await detectorRef.current.detect(video);
      if (codes.length > 0) fireToken(codes[0].rawValue);
    } catch { /* ignore decode errors */ }
    if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tickNative);
  }

  function tickCanvas() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tickCanvas);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (detectorRef.current && detectorRef.current.decodeFromCanvas) {
      try {
        const result = detectorRef.current.decodeFromCanvas(canvas);
        if (result) fireToken(result.getText());
      } catch { /* no code detected */ }
    }
    if (!stoppedRef.current) rafRef.current = requestAnimationFrame(tickCanvas);
  }

  async function initDecoder() {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        setMethod("native");
        rafRef.current = requestAnimationFrame(tickNative);
        return;
      } catch { /* fall through */ }
    }
    try {
      const reader = await loadZXing();
      detectorRef.current = reader;
      setMethod("zxing");
      rafRef.current = requestAnimationFrame(tickCanvas);
    } catch {
      setMethod("canvas");
      rafRef.current = requestAnimationFrame(tickCanvas);
    }
  }

  async function startCamera() {
    stoppedRef.current = false;
    setError(null);
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setReady(true);
      initDecoder();
    } catch (e) {
      setError(
        e.name === "NotAllowedError"
          ? "Camera permission denied. Use manual entry below."
          : "Camera not available. Use manual entry below.",
      );
    }
  }

  useEffect(() => {
    if (!active) return stopAll;
    const id = setTimeout(startCamera, 0);
    return () => { clearTimeout(id); stopAll(); };
  }, [active]); // eslint-disable-line

  return (
    <div className="relative aspect-square w-full max-w-xs mx-auto rounded-3xl overflow-hidden bg-black border border-foreground/10">
      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <CameraOff size={32} className="text-white/25" />
          <p className="text-[12px] text-white/40 leading-relaxed">{error}</p>
          <button onClick={startCamera}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/60 hover:bg-white/15 transition">
            <RotateCcw size={11} /> Retry
          </button>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

          {ready && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative h-52 w-52">
                {[
                  "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                ].map((c, i) => (
                  <div key={i} className={`absolute h-9 w-9 border-indigo-400 ${c}`} />
                ))}
                <div className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                  style={{ animation: "scanLine 2s ease-in-out infinite" }} />
              </div>
              {method && (
                <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2 py-1">
                  <span className="text-[9px] text-white/30 font-mono">
                    {method === "native" ? "BarcodeDetector" : method === "zxing" ? "ZXing" : "Canvas"}
                  </span>
                </div>
              )}
            </div>
          )}

          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 size={28} className="animate-spin text-white/40" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScannerPage() {
  const { eventId } = useParams();
  const deviceId    = useRef(getDeviceId()).current;

  const [tab,          setTab]          = useState("scanner");
  const [cameraOn,     setCameraOn]     = useState(true);
  const [manualInput,  setManualInput]  = useState("");
  const [scanning,     setScanning]     = useState(false);
  const [lastResult,   setLastResult]   = useState(null);
  const [resultKey,    setResultKey]    = useState(0);
  const [feed,         setFeed]         = useState([]);
  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [online,       setOnline]       = useState(true);
  const [offlineQ,     setOfflineQ]     = useState([]);
  const [syncing,      setSyncing]      = useState(false);

  // ── Online detection ────────────────────────────────────────────────────────
  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Offline queue ───────────────────────────────────────────────────────────
  useEffect(() => { setOfflineQ(loadQueue()); }, []);
  useEffect(() => {
    if (online && offlineQ.length > 0) syncOffline();
  }, [online]); // eslint-disable-line

  // ── Stats fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(fetchStats, 0);
    return () => clearTimeout(id);
  }, [eventId]); // eslint-disable-line

  useEffect(() => {
    if (!online) return;
    const id = setInterval(fetchStats, 10_000);
    return () => clearInterval(id);
  }, [online, eventId]); // eslint-disable-line

  async function fetchStats() {
    try {
      const res = await api.get(`/scanner/events/${eventId}/dashboard`);
      setStats(res.data.data ?? null);
    } catch { /* silent */ } finally { setStatsLoading(false); }
  }

  // ── Offline sync ────────────────────────────────────────────────────────────
  async function syncOffline() {
    if (syncing) return;
    const pending = offlineQ.filter((s) => s.eventId === eventId);
    if (!pending.length) return;
    setSyncing(true);
    try {
      await api.post(`/scanner/events/${eventId}/tickets/checkin/batch-sync`, {
        scans: pending.map((s) => ({ qr_token: s.qr_token })),
        device_id: deviceId,
      });
      const remaining = loadQueue().filter((s) => !pending.find((p) => p.qr_token === s.qr_token));
      saveQueue(remaining);
      setOfflineQ(remaining);
      await fetchStats();
    } catch { /* will retry */ } finally { setSyncing(false); }
  }

  // ── Core scan ───────────────────────────────────────────────────────────────
  async function handleScan(raw) {
    const token = raw?.trim();
    if (!token || scanning) return;
    setScanning(true);

    if (!online) {
      enqueueOffline(token, eventId);
      setOfflineQ(loadQueue());
      push({ type: "OFFLINE", qr_token: token, message: "Queued — will sync on reconnect", scanned_at: new Date().toISOString() });
      setScanning(false);
      return;
    }

    try {
      const res = await api.post(`/checkin/events/${eventId}/tickets/checkin`, {
        qr_token: token, device_id: deviceId,
      });
      const d = res.data.data;
      push({
        type: "SUCCESS",
        qr_token: token,
        holder_name: d.holder_name,
        holder_email: d.holder_email,
        ticket_type_name: d.ticket_type_name,
        scanned_at: d.checked_in_at || new Date().toISOString(),
      });
      fetchStats();
    } catch (err) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || "Unknown error";
      const type    = status === 409 ? "DUPLICATE"
        : message.toLowerCase().includes("revoked") ? "REVOKED"
        : "INVALID";
      push({ type, qr_token: token, message, scanned_at: new Date().toISOString() });
    } finally {
      setScanning(false);
      setManualInput("");
    }
  }

  function push(result) {
    setLastResult(result);
    setResultKey((k) => k + 1);
    setFeed((prev) => [result, ...prev].slice(0, 100));
  }

  const checkinPct = stats
    ? (stats.total_issued > 0 ? Math.round((stats.checked_in / stats.total_issued) * 100) : 0)
    : 0;

  const pendingCount = offlineQ.filter((s) => s.eventId === eventId).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-screen flex-col bg-background text-foreground pb-16">

      {/* Scan-line animation */}
      <style>{`
        @keyframes scanLine {
          0%,100% { transform:translateY(0);   opacity:1;   }
          50%      { transform:translateY(200px); opacity:0.5; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-5">
        <div>
          <h1 className="text-xl font-black">QR Scanner</h1>
          <p className="text-[11px] text-foreground/35 mt-0.5">Scan tickets at the door</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold ${
            online
              ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? "Online" : "Offline"}
          </div>

          {pendingCount > 0 && (
            <button onClick={syncOffline} disabled={syncing || !online}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 transition disabled:opacity-50">
              {syncing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Sync {pendingCount}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.03] p-1 mb-6">
        {[
          { key: "scanner", label: "Scanner", Icon: QrCode       },
          { key: "feed",    label: "Feed",    Icon: ClipboardList, badge: feed.length || null },
          { key: "stats",   label: "Stats",   Icon: BarChart3     },
        ].map(({ key, label, Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
              tab === key
                ? "bg-foreground text-background shadow-sm"
                : "text-foreground/40 hover:text-foreground/70"
            }`}>
            <Icon size={13} />
            {label}
            {badge > 0 && tab !== key && (
              <span className="absolute right-2 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ SCANNER TAB ═══════════════════════════════════════════════════════ */}
      {tab === "scanner" && (
        <div className="flex flex-col gap-5 items-center max-w-md mx-auto w-full">

          {/* Camera toggle */}
          <div className="flex w-full items-center justify-between">
            <p className="text-[11px] font-semibold text-foreground/35 uppercase tracking-widest">Camera</p>
            <button onClick={() => setCameraOn((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                cameraOn
                  ? "border-foreground/10 bg-foreground/[0.05] text-foreground/50"
                  : "border-indigo-500/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
              }`}>
              {cameraOn ? <><CameraOff size={11} /> Disable</> : <><Camera size={11} /> Enable</>}
            </button>
          </div>

          {cameraOn && <CameraScanner active={cameraOn} onScan={handleScan} />}

          {scanning && (
            <div className="flex items-center gap-2 text-[12px] text-foreground/40">
              <Loader2 size={13} className="animate-spin" /> Processing…
            </div>
          )}

          {lastResult && (
            <div key={resultKey} className="w-full" style={{ animation: "fadeUp 0.25s ease-out" }}>
              <ScanResultBanner result={lastResult} />
            </div>
          )}

          {/* Manual input */}
          <div className="w-full space-y-2">
            <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-widest">Manual Entry</p>
            <form onSubmit={(e) => { e.preventDefault(); handleScan(manualInput); }} className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.05] px-3 py-2.5">
                <Search size={13} className="text-foreground/25 shrink-0" />
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste ticket token…"
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-foreground/20"
                />
              </div>
              <button type="submit" disabled={!manualInput.trim() || scanning}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-[12px] font-bold text-white hover:bg-indigo-500 transition disabled:opacity-40">
                {scanning ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={13} />}
                Check
              </button>
            </form>
          </div>

          {/* Entry progress */}
          {stats && (
            <div className="w-full rounded-2xl border border-foreground/[0.06] bg-foreground/[0.03] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">Entry Progress</span>
                <span className="text-[12px] font-black"
                  style={{ color: checkinPct >= 80 ? "#f43f5e" : "#10b981" }}>
                  {stats.checked_in}/{stats.total_issued}
                </span>
              </div>
              <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${checkinPct}%`, background: checkinPct >= 80 ? "#f43f5e" : "#10b981" }} />
              </div>
              <p className="text-[10px] text-foreground/25">
                {checkinPct}% of tickets scanned · {stats.remaining} remaining
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ FEED TAB ══════════════════════════════════════════════════════════ */}
      {tab === "feed" && (
        <div className="flex flex-col gap-3 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-foreground/35 uppercase tracking-widest">
              {feed.length} scan{feed.length !== 1 ? "s" : ""} this session
            </p>
            {feed.length > 0 && (
              <button onClick={() => { setFeed([]); setLastResult(null); }}
                className="flex items-center gap-1 rounded-lg bg-foreground/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-foreground/30 hover:bg-foreground/[0.08] transition">
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <QrCode size={28} className="text-foreground/15" />
              <p className="text-sm text-foreground/25">No scans yet — start scanning tickets.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] divide-y divide-foreground/[0.04] overflow-hidden">
              {feed.map((s, i) => <ScanFeedItem key={i} scan={s} />)}
            </div>
          )}
        </div>
      )}

      {/* ══ STATS TAB ════════════════════════════════════════════════════════ */}
      {tab === "stats" && (
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-foreground/35 uppercase tracking-widest">
              Live stats · refreshes every 10 s
            </p>
            <button onClick={fetchStats}
              className="flex items-center gap-1 rounded-lg bg-foreground/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-foreground/30 hover:bg-foreground/[0.08] transition">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-foreground/20" />
            </div>
          ) : stats ? (
            <>
              {/* Big progress bar */}
              <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.03] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest">Entry Progress</p>
                  <p className="text-[13px] font-black" style={{ color: checkinPct >= 80 ? "#f43f5e" : "#10b981" }}>
                    {checkinPct}%
                  </p>
                </div>
                <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${checkinPct}%`,
                      background: `linear-gradient(90deg,#10b981,${checkinPct >= 80 ? "#f43f5e" : "#10b981"})`,
                    }} />
                </div>
                <div className="flex justify-between text-[10px] text-foreground/25">
                  <span>{stats.checked_in} checked in</span>
                  <span>{stats.remaining} remaining</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Tickets" value={stats.total_issued}  accent="#6366f1" Icon={Ticket}        sub="Issued" />
                <StatCard label="Checked In"    value={stats.checked_in}    accent="#10b981" Icon={Users}         sub={`${checkinPct}% attendance`} />
                <StatCard label="Remaining"     value={stats.remaining}     accent="#f59e0b" Icon={QrCode}        sub="Not yet scanned" />
                <StatCard label="Valid Scans"   value={stats.scan_success}  accent="#10b981" Icon={CheckCircle2}  sub="Successful" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Duplicates" value={stats.scan_duplicate} accent="#f59e0b" Icon={AlertTriangle} sub="Already used" />
                <StatCard label="Invalid"    value={stats.scan_invalid}   accent="#ef4444" Icon={XCircle}       sub="Bad QR codes" />
              </div>

              {/* Device */}
              <div className="rounded-2xl border border-foreground/[0.05] bg-foreground/[0.02] px-4 py-3">
                <p className="text-[11px] text-foreground/25">
                  Device&nbsp;<span className="font-mono text-foreground/40">{deviceId}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart3 size={28} className="text-foreground/15" />
              <p className="text-sm text-foreground/25">Could not load stats</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
