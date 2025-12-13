import { cn } from "@lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text"
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-stone-200",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "default" && "rounded-lg",
        className
      )}
      {...props}
    />
  )
}

// Pre-built skeleton components
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton variant="text" className={cn("w-full", className)} />
}

export function SkeletonTitle({ className }: { className?: string }) {
  return <Skeleton variant="text" className={cn("w-3/4 h-6", className)} />
}

export function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn("aspect-product w-full", className)} />
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton variant="circular" className={cn("w-10 h-10", className)} />
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-24", className)} />
}

// Product Card Skeleton
export function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl overflow-hidden bg-white", className)}>
      <SkeletonImage />
      <div className="p-4 space-y-3">
        <SkeletonText className="w-1/3 h-3" />
        <SkeletonText className="w-full h-5" />
        <SkeletonText className="w-2/3 h-5" />
        <SkeletonText className="w-1/4 h-6 mt-2" />
      </div>
    </div>
  )
}

// Product Grid Skeleton
export function SkeletonProductGrid({
  count = 8,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}

