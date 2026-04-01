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

export default function CoachScheduleScreen() {
  const user = useAuthStore((s) => s.user)
  const teamIds = user?.teamIds ?? []

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["coach-schedule", teamIds],
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
        <Text style={styles.heading}>Team Schedule</Text>

        {games.length === 0 && (
          <Text style={styles.empty}>No games scheduled.</Text>
        )}

        {games.map((game) => {
          const isFinal = game.status === GameStatus.Final
          return (
            <View key={game.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.opponent}>vs {game.opponent}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isFinal && styles.finalBadge,
                    game.status === GameStatus.Cancelled && styles.cancelBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{game.status}</Text>
                </View>
              </View>
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
                    {game.scoreHome} - {game.scoreAway}
                  </Text>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  opponent: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#D6E4F0",
  },
  finalBadge: { backgroundColor: "#E8F5E9" },
  cancelBadge: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },
  meta: { fontSize: 13, color: "#888888", marginTop: 4 },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A5F",
    marginTop: 8,
  },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
