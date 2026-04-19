export default function EmptyState({
    title = "No data yet",
    description = "Nothing to show here yet.",
    action = null,
  }) {
    return (
      <div className="rounded-3xl border border-dashed border-[#d1d5db] bg-white p-10 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    );
  }