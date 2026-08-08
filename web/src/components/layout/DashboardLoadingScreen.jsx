import { Loader2 } from "lucide-react";

export default function DashboardLoadingScreen({ message = "Preparing your workspace…", overlay = false }) {
  return (
    <div
      className={overlay
        ? "fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-center justify-center bg-[#07070f]"
        : "flex min-h-[80vh] w-full items-center justify-center"
      }
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-white/10 border-t-[#6366f1] animate-spin" />
        <Loader2 className="absolute inset-0 m-auto animate-pulse text-[#6366f1]" size={24} />
      </div>
    </div>
  );
}
