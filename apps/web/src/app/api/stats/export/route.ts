import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "../../../lib/supabase-server"
import { generateStatsCsv } from "@fieldhouse/stats-engine"
import { UserRole, Sport, PlayerStatsAggregate, Player } from "@fieldhouse/types"
import { calculateDerivedStats } from "@fieldhouse/stats-engine"

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, league_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") as "player" | "team" | "league"
  const playerId = searchParams.get("playerId")
  const teamId = searchParams.get("teamId")
  const season = searchParams.get("season") ?? undefined

  // Enforce role-based export scope
  const scopeAllowed = (() => {
    if (scope === "league") return profile.role === UserRole.LeagueOfficial
    if (scope === "team") return [UserRole.LeagueOfficial, UserRole.Coach].includes(profile.role as UserRole)
    if (scope === "player") return true // all roles can export player stats they have access to
    return false
  })()

  if (!scopeAllowed) {
    return NextResponse.json({ error: "Insufficient permissions for this export scope" }, { status: 403 })
  }

  const service = createSupabaseServiceClient()
  let query = service
    .from("player_stats")
    .select("*, players(id, display_name, jersey_number, position, team_id, parent_user_id, active, created_at)")

  if (scope === "player" && playerId) query = query.eq("player_id", playerId)
  else if (scope === "team" && teamId) query = query.eq("team_id", teamId)
  else if (scope === "league") query = query.eq("leagues.id", profile.league_id)

  if (season) query = query.eq("season", season)

  const { data: rows, error } = await query.order("season", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate raw rows into PlayerStatsAggregate[]
  const grouped: Record<string, { raw: Record<string, number>; player: Player; season: string; sport: Sport }> = {}

  for (const row of rows ?? []) {
    const key = `${row.player_id}__${row.season}__${row.sport}`
    if (!grouped[key]) {
      grouped[key] = {
        player: row.players as Player,
        season: row.season,
        sport: row.sport as Sport,
        raw: {},
      }
    }
    grouped[key].raw[row.stat_key] = (grouped[key].raw[row.stat_key] ?? 0) + row.stat_value
  }

  const aggregates: PlayerStatsAggregate[] = Object.values(grouped).map(({ player, season, sport, raw }) => ({
    player,
    season,
    sport,
    raw,
    derived: calculateDerivedStats(sport, raw),
  }))

  const csv = generateStatsCsv({ scope, data: aggregates })
  const filename = `fieldhouse_${scope}_stats${season ? `_${season}` : ""}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
