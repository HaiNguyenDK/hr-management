function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
}

export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Bone className="h-10 w-full sm:w-72" />
        <Bone className="h-10 w-36" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Bone className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-gray-100">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <Bone className={`h-4 ${c === 0 ? 'w-32' : 'w-20'}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

export function GridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Bone className="h-10 w-64" />
          <Bone className="h-10 w-40" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 w-28" />
          <Bone className="h-10 w-20" />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex gap-2 items-center">
              <Bone className="h-6 w-40 shrink-0" />
              {Array.from({ length: 15 }).map((_, c) => (
                <Bone key={c} className="h-7 w-7 rounded shrink-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton({ cards, cols, rows, variant = 'table' }: {
  cards?: number
  cols?: number
  rows?: number
  variant?: 'table' | 'grid'
}) {
  return (
    <div className="space-y-4">
      {cards && <CardsSkeleton count={cards} />}
      {variant === 'grid' ? <GridSkeleton /> : <TableSkeleton cols={cols} rows={rows} />}
    </div>
  )
}
