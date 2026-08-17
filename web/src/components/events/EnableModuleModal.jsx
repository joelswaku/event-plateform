"use client";

import { Ticket, Heart, Users } from "lucide-react";

const MODULE_CONFIG = {
  allow_rsvp: {
    icon: Users,
    label: "Guest List",
    desc: "Free RSVP tracking",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
  },
  allow_ticketing: {
    icon: Ticket,
    label: "Stripe Ticketing",
    desc: "Paid ticket sales",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
  },
  allow_donations: {
    icon: Heart,
    label: "Donations",
    desc: "Accept contributions",
    iconColor: "text-pink-600 dark:text-pink-400",
    iconBg: "bg-pink-50 dark:bg-pink-900/30",
  },
};

export default function EnableModuleModal({
  moduleKey,
  otherModules = [],
  onConfirm,
  onCancel,
}) {
  const config = MODULE_CONFIG[moduleKey];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.iconBg}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Enable {config.label}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.desc}
            </p>
          </div>
        </div>

        {otherModules.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">!</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  This will disable {otherModules.join(' & ')}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Only one module can be active at a time.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Enable & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
