import { createSupabaseServerClient } from "../../lib/supabase-server"
import StatsBadge from "../../components/ui/StatsBadge"

interface ActivityRow {
  id: string
  type: string
  title: string
  body: string
  created_at: string
}

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("league_id")
    .eq("id", user?.id ?? "")
    .single()

  const leagueId = profile?.league_id as string | undefined

  // Parallel data fetches
  const [teamsRes, flagsRes, gamesRes, activityRes, leagueRes] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("league_id", leagueId ?? ""),
      supabase
        .from("flags")
        .select("id", { count: "exact", head: true })
        .eq("action", "pending"),
      supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .eq("league_id", leagueId ?? "")
        .eq("status", "scheduled"),
      supabase
        .from("notifications")
        .select("id, type, title, body, created_at")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueId ?? "")
        .single(),
    ])

  const leagueName = (leagueRes.data?.name as string) ?? "Your League"
  const totalTeams = teamsRes.count ?? 0
  const activeFlags = flagsRes.count ?? 0
  const upcomingGames = gamesRes.count ?? 0
  const recentActivity = (activityRes.data ?? []) as ActivityRow[]

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">{leagueName}</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <DashCard label="Total Teams" value={totalTeams} variant="default" />
        <DashCard
          label="Active Flags"
          value={activeFlags}
          variant={activeFlags > 0 ? "danger" : "success"}
        />
        <DashCard label="Upcoming Games" value={upcomingGames} variant="default" />
      </div>

      {/* Activity feed */}
      <div className="bg-surface rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 text-sm border-b border-gray-50 pb-3 last:border-0"
              >
                <StatsBadge
                  label={a.type.replace(/_/g, " ")}
                  value=""
                  variant="default"
                />
                <div className="flex-1">
                  <p className="font-medium text-primary">{a.title}</p>
                  <p className="text-muted text-xs">{a.body}</p>
                </div>
                <time className="text-xs text-muted whitespace-nowrap">
                  {new Date(a.created_at).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DashCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: "success" | "danger" | "default"
}) {
  const bg =
    variant === "danger"
      ? "border-danger/30 bg-red-50"
      : variant === "success"
        ? "border-success/30 bg-green-50"
        : "border-gray-200 bg-surface"

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  )
}
