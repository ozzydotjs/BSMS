export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Loading summary metrics">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-3.5 w-28 rounded bg-slate-200" />
              <div className="h-8 w-20 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
            <div className="h-11 w-11 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm animate-pulse"
      aria-label="Loading table data"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="h-4 w-48 rounded bg-slate-200" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid gap-4 px-4 py-3.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, cIdx) => (
              <div key={cIdx} className="h-4 rounded bg-slate-200/80" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
      aria-label="Loading forecast chart"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-64 rounded bg-slate-200" />
        <div className="h-4 w-32 rounded bg-slate-100" />
      </div>
      <div className="h-72 w-full rounded-md bg-slate-100" />
    </div>
  );
}

export function PortalCardsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading resident requests">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2.5">
              <div className="h-4 w-44 rounded bg-slate-200" />
              <div className="h-3.5 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded-md bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
