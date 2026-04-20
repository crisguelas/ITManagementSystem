/**
 * @file loading.tsx
 * @description Loading state for the reports page while server data is fetched.
 */

export default function ReportsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="h-4 w-96 rounded bg-gray-100" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-gray-100 bg-white p-4">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="mt-3 h-6 w-10 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 bg-white p-5">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-52 rounded bg-gray-100" />
            <div className="h-3 w-44 rounded bg-gray-100" />
            <div className="h-10 w-44 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
