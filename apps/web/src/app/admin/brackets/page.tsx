"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser"
import type { Season, BracketType, Team, BracketData, BracketRound } from "@fieldhouse/types"

interface ScheduleRow {
  id: string
  season_id: string
  bracket_type: BracketType | null
  bracket_data: BracketData | null
}

export default function BracketsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState("")
  const [schedule, setSchedule] = useState<ScheduleRow | null>(null)
  const [teams, setTeams] = useState<Pick<Team, "id" | "name">[]>([])
  const [bracketType, setBracketType] = useState<BracketType>("single_elimination")
  const [generating, setGenerating] = useState(false)

  const supabase = createSupabaseBrowserClient()

  const fetchSeasons = useCallback(async () => {
    const { data } = await supabase
      .from("seasons")
      .select("*")
      .order("start_date", { ascending: false })
    setSeasons((data ?? []) as Season[])
  }, [supabase])

  useEffect(() => {
    fetchSeasons()
  }, [fetchSeasons])

  const fetchBracket = useCallback(async () => {
    if (!selectedSeasonId) return

    const { data: sched } = await supabase
      .from("schedules")
      .select("id, season_id, bracket_type, bracket_data")
      .eq("season_id", selectedSeasonId)
      .single()

    setSchedule((sched as ScheduleRow) ?? null)

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name")
      .order("name")

    setTeams((teamData ?? []) as Pick<Team, "id" | "name">[])
  }, [supabase, selectedSeasonId])

  useEffect(() => {
    fetchBracket()
  }, [fetchBracket])

  const generateBracket = async () => {
    if (!schedule || teams.length < 2) return
    setGenerating(true)

    const shuffled = [...teams].sort(() => Math.random() - 0.5)
    const matchups = []

    for (let i = 0; i < shuffled.length; i += 2) {
      matchups.push({
        id: crypto.randomUUID(),
        teamAId: shuffled[i]?.id ?? null,
        teamBId: shuffled[i + 1]?.id ?? null,
        winnerId: null,
        gameId: null,
      })
    }

    const rounds: BracketRound[] = [
      { roundNumber: 1, label: "Round 1", matchups },
    ]

    const bracketData: BracketData = { type: bracketType, rounds }

    await supabase
      .from("schedules")
      .update({
        bracket_type: bracketType,
        bracket_data: bracketData as unknown as Record<string, unknown>,
      })
      .eq("id", schedule.id)

    setSchedule({ ...schedule, bracket_type: bracketType, bracket_data: bracketData })
    setGenerating(false)
  }

  const currentBracket = schedule?.bracket_data

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Brackets</h2>

      {/* Season selector */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedSeasonId}
          onChange={(e) => setSelectedSeasonId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select Season</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {selectedSeasonId && (
          <>
            <select
              value={bracketType}
              onChange={(e) => setBracketType(e.target.value as BracketType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
            </select>
            <button
              onClick={generateBracket}
              disabled={generating || teams.length < 2}
              className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating..." : "Generate Bracket"}
            </button>
          </>
        )}
      </div>

      {/* Bracket display */}
      {currentBracket ? (
        <div className="bg-surface rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {currentBracket.type.replace(/_/g, " ")} Bracket
          </h3>
          {currentBracket.rounds.map((round) => (
            <div key={round.roundNumber} className="mb-6">
              <h4 className="text-sm font-medium text-muted mb-3">
                {round.label}
              </h4>
              <div className="space-y-2">
                {round.matchups.map((m) => {
                  const teamA = teams.find((t) => t.id === m.teamAId)
                  const teamB = teams.find((t) => t.id === m.teamBId)
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-2 text-sm"
                    >
                      <span className="font-medium text-primary w-40 truncate">
                        {teamA?.name ?? "BYE"}
                      </span>
                      <span className="text-muted">vs</span>
                      <span className="font-medium text-primary w-40 truncate">
                        {teamB?.name ?? "BYE"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : selectedSeasonId ? (
        <p className="text-sm text-muted">
          No bracket generated yet. Select a type and click Generate.
        </p>
      ) : (
        <p className="text-sm text-muted">Select a season to view or generate brackets.</p>
      )}
    </div>
  )
}
