export default function PageHeader({
    eyebrow,
    title,
    description,
    action,
  }) {
    return (
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#e5e7eb] bg-white p-6 md:flex-row md:items-center">
        <div>
          {eyebrow ? (
            <p className="text-sm font-medium text-indigo-600">{eyebrow}</p>
          ) : null}
  
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
  
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              {description}
            </p>
          ) : null}
        </div>
  
        {action ? <div>{action}</div> : null}
      </div>
    );
  }