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
import { Player, Team, Game, PlayerStatRow } from "@fieldhouse/types"

export default function PlayerDashboard() {
  const user = useAuthStore((s) => s.user)
  const teamIds = user?.teamIds ?? []

  const playerQuery = useQuery<Player | null>({
    queryKey: ["my-player-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("parent_user_id", user!.id)
        .eq("active", true)
        .limit(1)
        .single()
      if (error) throw error
      return data as Player
    },
  })

  const teamQuery = useQuery<Team | null>({
    queryKey: ["player-team", playerQuery.data?.teamId],
    enabled: !!playerQuery.data?.teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", playerQuery.data!.teamId)
        .single()
      if (error) throw error
      return data as Team
    },
  })

  const statsQuery = useQuery<PlayerStatRow[]>({
    queryKey: ["player-season-stats", playerQuery.data?.id],
    enabled: !!playerQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stat_rows")
        .select("*")
        .eq("player_id", playerQuery.data!.id)
      if (error) throw error
      return data as PlayerStatRow[]
    },
  })

  const nextGameQuery = useQuery<Game | null>({
    queryKey: ["player-next-game", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("team_id", teamIds)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return (data as Game) ?? null
    },
  })

  if (playerQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const player = playerQuery.data
  const team = teamQuery.data
  const stats = statsQuery.data ?? []
  const nextGame = nextGameQuery.data

  const statSummary = stats.reduce<Record<string, number>>((acc, row) => {
    acc[row.statKey] = (acc[row.statKey] ?? 0) + row.statValue
    return acc
  }, {})

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>My Dashboard</Text>
        <Text style={styles.subheading}>
          {player?.displayName ?? user?.displayName ?? "Player"}
        </Text>

        <Text style={styles.sectionTitle}>Season Stats</Text>
        <View style={styles.card}>
          {Object.keys(statSummary).length === 0 ? (
            <Text style={styles.empty}>No stats recorded yet.</Text>
          ) : (
            <View style={styles.statsGrid}>
              {Object.entries(statSummary).map(([key, val]) => (
                <View key={key} style={styles.statItem}>
                  <Text style={styles.statValue}>{val}</Text>
                  <Text style={styles.statLabel}>{key}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Next Game</Text>
        {nextGame ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>vs {nextGame.opponent}</Text>
            <Text style={styles.cardMeta}>
              {new Date(nextGame.scheduledAt).toLocaleDateString()}
            </Text>
            {nextGame.location && (
              <Text style={styles.cardMeta}>{nextGame.location}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.empty}>No upcoming games.</Text>
        )}

        <Text style={styles.sectionTitle}>My Team</Text>
        {team ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{team.name}</Text>
            <Text style={styles.cardSubtitle}>
              {team.sport} — {team.season}
            </Text>
            {team.division && (
              <Text style={styles.cardMeta}>
                Division: {team.division}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.empty}>No team assigned.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  subheading: { fontSize: 14, color: "#888888", marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A2E",
    marginTop: 12,
    marginBottom: 10,
  },
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: { alignItems: "center", minWidth: 60 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1E3A5F" },
  statLabel: { fontSize: 11, color: "#888888", marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  cardSubtitle: { fontSize: 14, color: "#2E75B6", marginTop: 2 },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 2 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
