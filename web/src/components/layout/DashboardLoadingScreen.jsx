import Image from "next/image";

export default function DashboardLoadingScreen({ message = "Preparing your workspace…", overlay = false }) {
  return (
    <div
      className={overlay
        ? "fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#080a12]/96 px-5 backdrop-blur-md"
        : "flex min-h-[min(560px,calc(100dvh-72px))] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#080a12] px-5"
      }
      style={{
        backgroundImage: "radial-gradient(circle at 50% 28%, rgba(79,70,229,0.28), transparent 31%), radial-gradient(circle at 82% 76%, rgba(124,58,237,0.16), transparent 28%)",
      }}
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative w-full max-w-md">
        <div className="absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative rounded-[28px] border border-white/10 bg-[#11172a]/90 p-6 shadow-2xl shadow-indigo-950/40 sm:p-7">
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-[24px] border-2 border-indigo-400/15 border-t-indigo-300 border-r-violet-400 animate-spin" />
              <Image
                src="/logo.png"
                alt="LiteEvent"
                width={56}
                height={56}
                className="relative rounded-[18px] bg-white object-contain shadow-lg shadow-indigo-950/60"
                priority
              />
            </div>
            <p className="mt-5 text-[15px] font-bold tracking-tight text-white">{message}</p>
            <p className="mt-1 text-xs text-indigo-200/55">LiteEvent is getting things ready.</p>
          </div>

          <div className="mt-7 space-y-3" aria-hidden="true">
            <div className="h-2.5 w-[38%] animate-pulse rounded-full bg-indigo-300/30" />
            <div className="h-6 w-[78%] animate-pulse rounded-lg bg-white/12" />
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl border border-white/7 bg-white/6" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
