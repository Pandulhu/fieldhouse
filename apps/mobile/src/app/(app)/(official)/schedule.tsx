import React, { useMemo } from "react"
import { SafeAreaView, Text } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Game, Team } from "@fieldhouse/types"
import { sharedStyles } from "../../../lib/sharedStyles"
import { GameList } from "../../../components/schedule/GameList"

export default function OfficialScheduleScreen() {
  const user = useAuthStore((s) => s.user)
  const leagueId = user?.leagueId

  const teamsQuery = useQuery<Team[]>({
    queryKey: ["official-schedule-teams", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("league_id", leagueId!)
      if (error) throw error
      return data as Team[]
    },
  })

  const teamMap = useMemo(
    () => new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name])),
    [teamsQuery.data],
  )

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["official-all-games", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("league_id", leagueId!)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
      if (error) throw error
      return data as Game[]
    },
  })

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <Text style={sharedStyles.heading}>League Schedule</Text>
      <GameList
        games={gamesQuery.data ?? []}
        loading={gamesQuery.isLoading || teamsQuery.isLoading}
        emptyMessage="No upcoming games scheduled."
        showTeamName
        teamMap={teamMap}
      />
    </SafeAreaView>
  )
}
