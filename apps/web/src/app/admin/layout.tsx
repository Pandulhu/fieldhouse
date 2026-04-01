import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "../../lib/supabase-server"
import AdminLayoutShell from "./AdminLayoutShell"

export default async function AdminLayout({
  children,
}: {h
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, league_id, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("id", profile.league_id)
    .single()

  const { count: pendingFlagCount } = await supabase
    .from("flags")
    .select("id", { count: "exact", head: true })
    .eq("action", "pending")

  return (
    <AdminLayoutShell
      leagueName={league?.name ?? "Fieldhouse"}
      userDisplayName={profile.display_name ?? "Admin"}
      avatarUrl={profile.avatar_url ?? null}
      pendingFlagCount={pendingFlagCount ?? 0}
    >
      {children}
    </AdminLayoutShell>
  )
}
