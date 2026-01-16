/**
 * Elegant skeleton loading state for account dashboard tabs.
 * 
 * Shows a subtle skeleton that matches the page layout structure,
 * providing visual feedback during navigation while maintaining
 * a polished, professional appearance.
 */
export default function Loading() {
  return (
    <div className="p-6 small:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        {/* Title */}
        <div className="h-8 w-48 bg-stone-200 rounded-lg mb-3" />
        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full max-w-md bg-stone-100 rounded" />
          <div className="h-4 w-3/4 max-w-sm bg-stone-100 rounded" />
        </div>
      </div>

      {/* Content Skeleton - Cards */}
      <div className="space-y-4">
        {/* Card 1 */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-stone-200 rounded" />
              <div className="h-3 w-48 bg-stone-100 rounded" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-stone-200 rounded" />
              <div className="h-3 w-56 bg-stone-100 rounded" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-stone-200 rounded" />
              <div className="h-3 w-44 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
