export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-8 h-8 w-48 bg-gray-100 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border bg-white shadow-sm p-6">
            <div className="h-6 w-1/2 bg-gray-100 animate-pulse rounded mb-4" />
            <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded mb-6" />
            <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}


