import React, { useMemo } from "react"
import { SafeAreaView, Text } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Player, Game, Team } from "@fieldhouse/types"
import { sharedStyles } from "../../../lib/sharedStyles"
import { GameList } from "../../../components/schedule/GameList"

export default function ParentScheduleScreen() {
  const user = useAuthStore((s) => s.user)

  const playersQuery = useQuery<Player[]>({
    queryKey: ["parent-players-sched", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("parent_user_id", user!.id)
        .eq("active", true)
      if (error) throw error
      return data as Player[]
    },
  })

  const teamIds = (playersQuery.data ?? []).map((p) => p.teamId)

  const teamsQuery = useQuery<Team[]>({
    queryKey: ["parent-teams-sched", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)
      if (error) throw error
      return data as Team[]
    },
  })

  const teamMap = useMemo(
    () => new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name])),
    [teamsQuery.data],
  )

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["parent-schedule-games", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("team_id", teamIds)
        .order("scheduled_at", { ascending: true })
      if (error) throw error
      return data as Game[]
    },
  })

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <Text style={sharedStyles.heading}>Game Schedule</Text>
      <GameList
        games={gamesQuery.data ?? []}
        loading={playersQuery.isLoading || gamesQuery.isLoading}
        showTeamName
        teamMap={teamMap}
      />
    </SafeAreaView>
  )
}
