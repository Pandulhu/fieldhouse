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
import { Game, GameStatus } from "@fieldhouse/types"

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

  if (gamesQuery.isLoading) {
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
        <Text style={styles.heading}>Upcoming Games</Text>

        {games.length === 0 && (
          <Text style={styles.empty}>No upcoming games scheduled.</Text>
        )}

        {games.map((game) => (
          <View key={game.id} style={styles.card}>
            <Text style={styles.opponent}>vs {game.opponent}</Text>
            <Text style={styles.meta}>
              {new Date(game.scheduledAt).toLocaleString()}
            </Text>
            {game.location && (
              <Text style={styles.meta}>{game.location}</Text>
            )}
            <View
              style={[
                styles.statusBadge,
                game.status === GameStatus.InProgress && styles.liveBadge,
              ]}
            >
              <Text style={styles.statusText}>{game.status}</Text>
            </View>
          </View>
        ))}
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
  opponent: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  meta: { fontSize: 13, color: "#888888", marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#D6E4F0",
  },
  liveBadge: { backgroundColor: "#FFF3E0" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
