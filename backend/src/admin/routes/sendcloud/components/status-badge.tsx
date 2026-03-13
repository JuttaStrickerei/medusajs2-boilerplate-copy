import { Badge } from "@medusajs/ui"
import { LABELS } from "./dashboard-labels"

type StatusBadgeProps = {
  status: string
  size?: "2xsmall" | "xsmall" | "small" | "base" | "large"
}

export function StatusBadge({ status, size = "xsmall" }: StatusBadgeProps) {
  const color = LABELS.statusColors[status] || "grey"
  const label = LABELS.status[status] || status

  return (
    <Badge color={color} size={size}>
      {label}
    </Badge>
  )
}
