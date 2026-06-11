"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSuperAdminStore } from "@/store/superAdmin.store";

const STATUS_COLORS = {
  operational:    "#10b981",
  connected:      "#10b981",
  down:           "#ef4444",
  not_configured: "rgba(255,255,255,0.30)",
};

function statusColor(s) {
  return STATUS_COLORS[s] ?? "rgba(255,255,255,0.30)";
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function ServiceCard({ name, service, delay }) {
  const color = statusColor(service?.status);
  const isDown = service?.status === "down";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-6"
      style={{ background: "#0d0d1a", border: `1px solid ${isDown ? "rgba(239,68,68,0.25)" : "rgba(201,169,110,0.12)"}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{name}</p>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{
            background: color,
            boxShadow: isDown ? "0 0 6px rgba(239,68,68,0.6)" : color !== "rgba(255,255,255,0.30)" ? `0 0 6px ${color}80` : "none",
            animation: !isDown && service?.status !== "not_configured" ? "pulse 2s infinite" : "none",
          }}
        />
      </div>
      <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.02em" }}>
        {service?.status ?? "unknown"}
      </p>
      {service?.latency !== undefined && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
          {service.latency}ms latency
        </p>
      )}
    </motion.div>
  );
}

function MetricCard({ label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-5"
      style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
    >
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color: color ?? "#fff", marginTop: 6, letterSpacing: "-0.03em" }}>
        {(value ?? 0).toLocaleString()}
      </p>
    </motion.div>
  );
}

export default function HealthPage() {
  const { health, fetchHealth, loading } = useSuperAdminStore();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => { fetchHealth(); setCountdown(30); }, 30000);
    const tick = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, []);

  const h = health;
  const svc = h?.services ?? {};
  const metrics = h?.metrics ?? {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Super Admin
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            System Health
          </h1>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          Refreshing in {countdown}s
        </span>
      </div>

      {/* Services */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        Services
      </p>
      <div className="grid grid-cols-5 gap-4 mb-8">
        {loading && !h ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-3 w-16 rounded mb-4" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="h-5 w-20 rounded" style={{ background: "rgba(255,255,255,0.09)" }} />
            </div>
          ))
        ) : (
          <>
            <ServiceCard name="API" service={svc.api} delay={0} />
            <ServiceCard name="Database" service={svc.database} delay={0.05} />
            <ServiceCard name="Stripe" service={svc.stripe} delay={0.1} />
            <ServiceCard name="Email" service={svc.email} delay={0.15} />
            <ServiceCard name="Storage" service={svc.storage} delay={0.2} />
          </>
        )}
      </div>

      {/* Metrics */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        Platform Metrics
      </p>
      <div className="grid grid-cols-5 gap-4 mb-8">
        {loading && !h ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="h-3 w-20 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="h-7 w-16 rounded" style={{ background: "rgba(255,255,255,0.09)" }} />
            </div>
          ))
        ) : (
          <>
            <MetricCard label="Total Users" value={metrics.users} delay={0.25} />
            <MetricCard label="Total Events" value={metrics.events} delay={0.3} />
            <MetricCard label="Tickets Issued" value={metrics.tickets} delay={0.35} />
            <MetricCard label="Failed Pmts (24h)" value={metrics.failedPayments24h} color="#ef4444" delay={0.4} />
            <MetricCard label="Active Users (24h)" value={metrics.activeUsers24h} color="#10b981" delay={0.45} />
          </>
        )}
      </div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl p-6"
        style={{ background: "#0d0d1a", border: "1px solid rgba(201,169,110,0.12)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>System Information</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Uptime", value: h?.uptime ? formatUptime(h.uptime) : "—" },
            { label: "Node Version", value: h?.nodeVersion ?? "—" },
            { label: "Environment", value: h?.environment ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#c9a96e", marginTop: 4 }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
