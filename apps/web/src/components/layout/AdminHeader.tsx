"use client"

import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "../../lib/supabase-browser"

interface AdminHeaderProps {
  leagueName: string
  userDisplayName: string
  avatarUrl: string | null
}

export default function AdminHeader({
  leagueName,
  userDisplayName,
  avatarUrl,
}: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="bg-surface border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-primary">{leagueName}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userDisplayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-primary font-medium">
            {userDisplayName}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-muted hover:text-danger transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
