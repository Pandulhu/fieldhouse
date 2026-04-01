import { useQuery, useMutation } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import { PlayerStatsAggregate, Sport } from "@fieldhouse/types"
import { StatEntrySchema, StatEntryInput } from "@fieldhouse/validators"
import { calculateDerivedStats, generateStatsCsv } from "@fieldhouse/stats-engine"
import { useAuthStore } from "../stores/authStore"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

// ─── FETCH PLAYER STATS ──────────────────────────────────────

export const usePlayerStats = (playerId: string, season?: string) =>
  useQuery({
    queryKey: ["player-stats", playerId, season],
    queryFn: async () => {
      let q = supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerId)

      if (season) q = q.eq("season", season)

      const { data, error } = await q.order("created_at", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!playerId,
  })

// ─── ENTER STATS ─────────────────────────────────────────────

export const useEnterStats = () => {
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (input: StatEntryInput) => {
      if (!user) throw new Error("Not authenticated")

      const validated = StatEntrySchema.parse(input)
      const rows = Object.entries(validated.stats).map(([statKey, statValue]) => ({
        player_id: validated.playerId,
        game_id: validated.gameId,
        team_id: validated.teamId,
        season: validated.season,
        sport: validated.sport,
        stat_key: statKey,
        stat_value: statValue,
        entered_by: user.id,
      }))

      const { error } = await supabase
        .from("player_stats")
        .upsert(rows, { onConflict: "player_id,game_id,stat_key" })

      if (error) throw error
    },
  })
}

// ─── CSV EXPORT ──────────────────────────────────────────────

export const useExportPlayerStatsCsv = () => {
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      playerId,
      playerName,
    }: {
      playerId: string
      playerName: string
    }) => {
      if (!user) throw new Error("Not authenticated")

      const { data: rawRows, error } = await supabase
        .from("player_stats")
        .select("*, players(display_name, jersey_number, position)")
        .eq("player_id", playerId)
        .order("season", { ascending: true })

      if (error) throw error

      // Group by season + sport
      const grouped: Record<string, Record<string, number>> = {}
      const metaMap: Record<string, { season: string; sport: Sport }> = {}

      for (const row of rawRows ?? []) {
        const key = `${row.season}__${row.sport}`
        grouped[key] = grouped[key] ?? {}
        grouped[key][row.stat_key] = (grouped[key][row.stat_key] ?? 0) + row.stat_value
        metaMap[key] = { season: row.season, sport: row.sport as Sport }
      }

      const aggregates: PlayerStatsAggregate[] = Object.entries(grouped).map(
        ([key, raw]) => {
          const { season, sport } = metaMap[key]
          return {
            player: {
              id: playerId,
              parentUserId: user.id,
              teamId: "",
              displayName: playerName,
              jerseyNumber: null,
              position: null,
              dateOfBirth: null,
              photoUrl: null,
              active: true,
              createdAt: "",
            },
            season,
            sport,
            raw,
            derived: calculateDerivedStats(sport, raw),
          }
        }
      )

      const csv = generateStatsCsv({ scope: "player", data: aggregates })
      const filename = `${playerName.replace(/\s/g, "_")}_stats.csv`
      const path = `${FileSystem.documentDirectory}${filename}`

      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: `Export stats for ${playerName}`,
      })
    },
  })
}
