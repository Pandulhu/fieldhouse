"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  label: string
  href: string
  badge?: number
}

interface AdminSidebarProps {
  pendingFlagCount: number
}

export default function AdminSidebar({ pendingFlagCount }: AdminSidebarProps) {
  const pathname = usePathname()

  const items: NavItem[] = [
    { label: "Dashboard", href: "/admin" },
    { label: "Teams", href: "/admin/teams" },
    { label: "Schedule", href: "/admin/schedule" },
    { label: "Brackets", href: "/admin/brackets" },
    {
      label: "Flags",
      href: "/admin/flags",
      badge: pendingFlagCount > 0 ? pendingFlagCount : undefined,
    },
    { label: "Signup Forms", href: "/admin/signup-forms" },
    { label: "Stats", href: "/admin/stats" },
  ]

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <aside className="w-64 min-h-screen bg-primary text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/admin" className="text-xl font-bold tracking-tight">
          Fieldhouse
        </Link>
        <p className="text-xs text-light/70 mt-0.5">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center justify-between px-6 py-2.5 text-sm transition-colors
              ${
                isActive(item.href)
                  ? "bg-accent/20 text-white font-semibold border-r-2 border-accent"
                  : "text-light/80 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
