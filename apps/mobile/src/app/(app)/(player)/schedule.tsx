import React from "react"
import { SafeAreaView, Text } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Game } from "@fieldhouse/types"
import { sharedStyles } from "../../../lib/sharedStyles"
import { GameList } from "../../../components/schedule/GameList"

export default function PlayerScheduleScreen() {
  const user = useAuthStore((s) => s.user)
  const teamIds = user?.teamIds ?? []

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["player-schedule", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("team_id", teamIds)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
      if (error) throw error
      return data as Game[]
    },
  })

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <Text style={sharedStyles.heading}>Upcoming Games</Text>
      <GameList
        games={gamesQuery.data ?? []}
        loading={gamesQuery.isLoading}
        emptyMessage="No upcoming games scheduled."
      />
    </SafeAreaView>
  )
}
