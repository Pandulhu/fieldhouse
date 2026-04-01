"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser"
import { CreateGameSchema } from "@fieldhouse/validators"
import type { Game, Team } from "@fieldhouse/types"
import DataTable from "../../../components/ui/DataTable"

interface GameRow extends Record<string, unknown> {
  id: string
  opponent: string
  location: string | null
  scheduled_at: string
  status: string
  team_name: string
}

export default function SchedulePage() {
  const [games, setGames] = useState<GameRow[]>([])
  const [teams, setTeams] = useState<Pick<Team, "id" | "name">[]>([])
  const [filterTeamId, setFilterTeamId] = useState("")
  const [form, setForm] = useState({
    teamId: "",
    opponent: "",
    location: "",
    scheduledAt: "",
  })

  const supabase = createSupabaseBrowserClient()

  const fetchData = useCallback(async () => {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name")
      .order("name")

    setTeams((teamData ?? []) as Pick<Team, "id" | "name">[])

    let query = supabase
      .from("games")
      .select("id, opponent, location, scheduled_at, status, team_id, teams(name)")
      .order("scheduled_at", { ascending: true })

    if (filterTeamId) {
      query = query.eq("team_id", filterTeamId)
    }

    const { data: gameData } = await query

    const rows: GameRow[] = (gameData ?? []).map((g: Record<string, unknown>) => ({
      id: g.id as string,
      opponent: g.opponent as string,
      location: g.location as string | null,
      scheduled_at: g.scheduled_at as string,
      status: g.status as string,
      team_name: (g.teams as Record<string, unknown>)?.name as string ?? "",
    }))

    setGames(rows)
  }, [supabase, filterTeamId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    const { data: profile } = await supabase
      .from("users")
      .select("league_id")
      .single()

    if (!profile) return

    const payload = {
      teamId: form.teamId,
      leagueId: profile.league_id as string,
      opponent: form.opponent,
      location: form.location || null,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    }

    const parsed = CreateGameSchema.safeParse(payload)
    if (!parsed.success) return

    await supabase.from("games").insert({
      team_id: payload.teamId,
      league_id: payload.leagueId,
      opponent: payload.opponent,
      location: payload.location,
      scheduled_at: payload.scheduledAt,
      status: "scheduled",
      created_by: (await supabase.auth.getUser()).data.user?.id ?? "",
    })

    setForm({ teamId: "", opponent: "", location: "", scheduledAt: "" })
    fetchData()
  }

  const columns = [
    { key: "team_name", label: "Team" },
    { key: "opponent", label: "Opponent" },
    { key: "location", label: "Location" },
    {
      key: "scheduled_at",
      label: "Date/Time",
      render: (row: GameRow) => new Date(row.scheduled_at).toLocaleString(),
    },
    { key: "status", label: "Status" },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Schedule</h2>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterTeamId}
          onChange={(e) => setFilterTeamId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={games as unknown as Record<string, unknown>[]} />

      {/* Create form */}
      <div className="mt-8 bg-surface rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Add Game
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={form.teamId}
            onChange={(e) => setForm({ ...form, teamId: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Opponent"
            value={form.opponent}
            onChange={(e) => setForm({ ...form, opponent: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleCreate}
          className="mt-4 bg-accent text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Create Game
        </button>
      </div>
    </div>
  )
}
