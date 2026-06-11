"use client";
import { AlertTriangle, CheckCircle2, Info, Zap } from "lucide-react";

const TYPE_META = {
  warning: { icon: AlertTriangle, border: "border-amber-500/40", bg: "bg-amber-500/8", text: "text-amber-400", iconColor: "text-amber-400" },
  success: { icon: CheckCircle2, border: "border-emerald-500/40", bg: "bg-emerald-500/8", text: "text-emerald-400", iconColor: "text-emerald-400" },
  info:    { icon: Info,         border: "border-blue-500/40",   bg: "bg-blue-500/8",   text: "text-blue-400",   iconColor: "text-blue-400"   },
  action:  { icon: Zap,          border: "border-indigo-500/40", bg: "bg-indigo-500/8", text: "text-indigo-400", iconColor: "text-indigo-400" },
};

export default function AIInsightCard({ type = "info", message, count, onAction, actionLabel }) {
  const meta = TYPE_META[type] ?? TYPE_META.info;
  const Icon = meta.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 ${meta.border} ${meta.bg} px-4 py-3`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${meta.text}`}>{message}</p>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className={`mt-1.5 text-xs font-semibold underline underline-offset-2 ${meta.text} hover:opacity-80`}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {count != null && (
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>{count}</span>
      )}
    </div>
  );
}
