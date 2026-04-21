export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500" />
      <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
