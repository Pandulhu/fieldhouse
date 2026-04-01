import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import { Game, GameStatus } from "@fieldhouse/types"
import { UpdateGameScoreSchema, UpdateGameScoreInput } from "@fieldhouse/validators"

// ─── FETCH GAMES FOR A TEAM ─────────────────────────────────

export const useTeamGames = (teamId: string) =>
  useQuery({
    queryKey: ["team-games", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("team_id", teamId)
        .order("scheduled_at", { ascending: true })

      if (error) throw error
      return data as Game[]
    },
    enabled: !!teamId,
  })

// ─── FETCH ALL GAMES IN A LEAGUE ────────────────────────────

export const useLeagueGames = (leagueId: string) =>
  useQuery({
    queryKey: ["league-games", leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("league_id", leagueId)
        .order("scheduled_at", { ascending: true })

      if (error) throw error
      return data as Game[]
    },
    enabled: !!leagueId,
  })

// ─── UPDATE GAME SCORE ──────────────────────────────────────

export const useUpdateGameScore = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateGameScoreInput) => {
      const validated = UpdateGameScoreSchema.parse(input)

      const { data, error } = await supabase
        .from("games")
        .update({
          score_home: validated.scoreHome,
          score_away: validated.scoreAway,
          status: validated.status,
        })
        .eq("id", validated.gameId)
        .select()
        .single()

      if (error) throw error
      return data as Game
    },
    onSuccess: (updatedGame) => {
      queryClient.invalidateQueries({ queryKey: ["team-games"] })
      queryClient.invalidateQueries({ queryKey: ["league-games"] })
      queryClient.invalidateQueries({
        queryKey: ["team-games", updatedGame.teamId],
      })
    },
  })
}
