"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser"
import { CreateTeamSchema } from "@fieldhouse/validators"
import type { Sport } from "@fieldhouse/types"
import DataTable from "../../../components/ui/DataTable"
import Modal from "../../../components/ui/Modal"

interface TeamRow {
  id: string
  name: string
  sport: Sport
  division: string | null
  season: string
  coach_ids: string[]
  player_count: number
  coach_name: string | null
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [showModal, setShowModal] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    sport: "baseball" as Sport,
    season: "",
    division: "",
  })

  const supabase = createSupabaseBrowserClient()

  const fetchTeams = useCallback(async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, name, sport, division, season, coach_ids")
      .order("name")

    if (!data) return

    const enriched: TeamRow[] = await Promise.all(
      data.map(async (t) => {
        const { count } = await supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("team_id", t.id)

        let coachName: string | null = null
        const coachIds = (t.coach_ids as string[]) ?? []
        if (coachIds.length > 0) {
          const { data: coach } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", coachIds[0])
            .single()
          coachName = coach?.display_name ?? null
        }

        return {
          ...t,
          coach_ids: coachIds,
          player_count: count ?? 0,
          coach_name: coachName,
        } as TeamRow
      }),
    )

    setTeams(enriched)
  }, [supabase])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleCreate = async () => {
    const { data: profile } = await supabase
      .from("users")
      .select("league_id")
      .single()

    if (!profile) return

    const payload = {
      leagueId: profile.league_id as string,
      name: form.name,
      sport: form.sport,
      season: form.season,
      division: form.division || null,
    }

    const parsed = CreateTeamSchema.safeParse(payload)
    if (!parsed.success) return

    // Check for duplicate coach name
    if (form.name) {
      const existing = teams.find(
        (t) =>
          t.coach_name?.toLowerCase() === form.name.toLowerCase() &&
          t.name !== form.name,
      )
      if (existing && !duplicateWarning) {
        setDuplicateWarning(
          `A coach with a similar name exists on team "${existing.name}".`,
        )
        return
      }
    }

    await supabase.from("teams").insert({
      league_id: payload.leagueId,
      name: payload.name,
      sport: payload.sport,
      season: payload.season,
      division: payload.division,
      coach_ids: [],
    })

    setShowModal(false)
    setForm({ name: "", sport: "baseball" as Sport, season: "", division: "" })
    setDuplicateWarning(null)
    fetchTeams()
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "sport", label: "Sport" },
    { key: "division", label: "Division" },
    { key: "coach_name", label: "Coach" },
    { key: "player_count", label: "Players" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Teams</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Create Team
        </button>
      </div>

      <DataTable columns={columns} data={teams as unknown as Record<string, unknown>[]} />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setDuplicateWarning(null)
        }}
        title="Create Team"
      >
        <div className="space-y-4">
          <input
            placeholder="Team name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.sport}
            onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="baseball">Baseball</option>
            <option value="softball">Softball</option>
            <option value="soccer">Soccer</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
          </select>
          <input
            placeholder="Season (e.g. Spring 2025)"
            value={form.season}
            onChange={(e) => setForm({ ...form, season: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Division (optional)"
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {duplicateWarning && (
            <p className="text-warning text-sm">{duplicateWarning} Click again to confirm.</p>
          )}
          <button
            onClick={handleCreate}
            className="w-full bg-accent text-white py-2 rounded-lg text-sm font-medium hover:bg-accent/90"
          >
            {duplicateWarning ? "Confirm Create" : "Create"}
          </button>
        </div>
      </Modal>
    </div>
  )
}
