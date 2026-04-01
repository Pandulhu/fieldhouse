"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser"
import type { Sport, Team } from "@fieldhouse/types"
import DataTable from "../../../components/ui/DataTable"

interface StatRow extends Record<string, unknown> {
  player_name: string
  stat_key: string
  stat_value: number
  season: string
  sport: Sport
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatRow[]>([])
  const [teams, setTeams] = useState<Pick<Team, "id" | "name">[]>([])
  const [filterTeamId, setFilterTeamId] = useState("")
  const [filterSeason, setFilterSeason] = useState("")
  const [filterSport, setFilterSport] = useState("")
  const [exporting, setExporting] = useState(false)

  const supabase = createSupabaseBrowserClient()

  const fetchStats = useCallback(async () => {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name")
      .order("name")
    setTeams((teamData ?? []) as Pick<Team, "id" | "name">[])

    let query = supabase
      .from("player_stats")
      .select("stat_key, stat_value, season, sport, player_id, players(display_name)")
      .order("season", { ascending: false })
      .limit(200)

    if (filterTeamId) query = query.eq("team_id", filterTeamId)
    if (filterSeason) query = query.eq("season", filterSeason)
    if (filterSport) query = query.eq("sport", filterSport)

    const { data } = await query

    const rows: StatRow[] = (data ?? []).map((r: Record<string, unknown>) => ({
      player_name:
        (r.players as Record<string, unknown>)?.display_name as string ?? "",
      stat_key: r.stat_key as string,
      stat_value: r.stat_value as number,
      season: r.season as string,
      sport: r.sport as Sport,
    }))

    setStats(rows)
  }, [supabase, filterTeamId, filterSeason, filterSport])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleExport = async () => {
    setExporting(true)
    const params = new URLSearchParams({ scope: "league" })
    if (filterTeamId) params.set("teamId", filterTeamId)
    if (filterSeason) params.set("season", filterSeason)

    const res = await fetch(`/api/stats/export?${params.toString()}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "stats_export.csv"
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  const columns = [
    { key: "player_name", label: "Player" },
    { key: "stat_key", label: "Stat" },
    { key: "stat_value", label: "Value" },
    { key: "season", label: "Season" },
    { key: "sport", label: "Sport" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Stats Overview</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterTeamId}
          onChange={(e) => setFilterTeamId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input
          placeholder="Season filter"
          value={filterSeason}
          onChange={(e) => setFilterSeason(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={filterSport}
          onChange={(e) => setFilterSport(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Sports</option>
          <option value="baseball">Baseball</option>
          <option value="softball">Softball</option>
          <option value="soccer">Soccer</option>
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
        </select>
      </div>

      <DataTable columns={columns} data={stats as unknown as Record<string, unknown>[]} />
    </div>
  )
}
