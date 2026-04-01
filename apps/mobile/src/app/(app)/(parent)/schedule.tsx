import React from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Player, Game, Team, GameStatus } from "@fieldhouse/types"

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

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t]))

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

  if (playersQuery.isLoading || gamesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const games = gamesQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Game Schedule</Text>

        {games.length === 0 && (
          <Text style={styles.empty}>No games scheduled.</Text>
        )}

        {games.map((game) => {
          const team = teamMap.get(game.teamId)
          const isFinal = game.status === GameStatus.Final
          return (
            <View key={game.id} style={styles.card}>
              <Text style={styles.teamLabel}>{team?.name ?? "Team"}</Text>
              <Text style={styles.opponent}>vs {game.opponent}</Text>
              <Text style={styles.meta}>
                {new Date(game.scheduledAt).toLocaleString()}
              </Text>
              {game.location && (
                <Text style={styles.meta}>{game.location}</Text>
              )}
              {isFinal &&
                game.scoreHome != null &&
                game.scoreAway != null && (
                  <Text style={styles.score}>
                    Final: {game.scoreHome} - {game.scoreAway}
                  </Text>
                )}
              {!isFinal && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{game.status}</Text>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  teamLabel: { fontSize: 12, fontWeight: "600", color: "#2E75B6" },
  opponent: { fontSize: 16, fontWeight: "600", color: "#1A1A2E", marginTop: 2 },
  meta: { fontSize: 13, color: "#888888", marginTop: 4 },
  score: { fontSize: 18, fontWeight: "700", color: "#1E3A5F", marginTop: 8 },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#D6E4F0",
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
