"use client"

import AdminSidebar from "../../components/layout/AdminSidebar"
import AdminHeader from "../../components/layout/AdminHeader"

interface AdminLayoutShellProps {
  leagueName: string
  userDisplayName: string
  avatarUrl: string | null
  pendingFlagCount: number
  children: React.ReactNode
}

export default function AdminLayoutShell({
  leagueName,
  userDisplayName,
  avatarUrl,
  pendingFlagCount,
  children,
}: AdminLayoutShellProps) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar pendingFlagCount={pendingFlagCount} />
      <div className="flex-1 flex flex-col">
        <AdminHeader
          leagueName={leagueName}
          userDisplayName={userDisplayName}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
