export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-[#080a12] p-5" aria-busy="true" aria-label="Loading event">
      <div className="mx-auto max-w-6xl animate-pulse space-y-5">
        <div className="h-64 rounded-3xl bg-[#1a2038] sm:h-80" />
        <div className="h-5 w-32 rounded-full bg-indigo-400/35" />
        <div className="h-9 w-3/4 rounded-xl bg-white/15 sm:w-1/2" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 rounded-2xl border border-white/10 bg-white/8" />
          ))}
        </div>
      </div>
    </div>
  );
}
