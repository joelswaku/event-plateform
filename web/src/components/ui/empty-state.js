export default function EmptyState({
    title = "No data yet",
    description = "Nothing to show here yet.",
    action = null,
  }) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    );
  }