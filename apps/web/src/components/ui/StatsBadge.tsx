type BadgeVariant = "success" | "warning" | "danger" | "default"

interface StatsBadgeProps {
  label: string
  value: string | number
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-success border-green-200",
  warning: "bg-orange-50 text-warning border-orange-200",
  danger: "bg-red-50 text-danger border-red-200",
  default: "bg-light text-primary border-blue-200",
}

export default function StatsBadge({
  label,
  value,
  variant = "default",
}: StatsBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}
    >
      {label}: {value}
    </span>
  )
}
