import React from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Game, Team, Flag, FlagAction, GameStatus } from "@fieldhouse/types"

export default function CoachDashboard() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const teamIds = user?.teamIds ?? []

  const teamQuery = useQuery<Team | null>({
    queryKey: ["coach-team", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamIds[0])
        .single()
      if (error) throw error
      return data as Team
    },
  })

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["coach-upcoming-games", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("team_id", teamIds)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5)
      if (error) throw error
      return data as Game[]
    },
  })

  const flagsQuery = useQuery<Flag[]>({
    queryKey: ["coach-flags", teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flags")
        .select("*")
        .eq("action", FlagAction.Pending)
      if (error) throw error
      return data as Flag[]
    },
  })

  const loading = teamQuery.isLoading || gamesQuery.isLoading

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const team = teamQuery.data
  const pendingFlags = flagsQuery.data?.length ?? 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Coach Dashboard</Text>
        <Text style={styles.subheading}>
          {user?.displayName ?? "Coach"}
        </Text>

        {team && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{team.name}</Text>
            <Text style={styles.cardSubtitle}>
              {team.sport} — {team.season}
            </Text>
            {team.division && (
              <Text style={styles.cardMeta}>Division: {team.division}</Text>
            )}
          </View>
        )}

        {pendingFlags > 0 && (
          <View style={[styles.card, styles.flagCard]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingFlags}</Text>
            </View>
            <Text style={styles.flagLabel}>Pending Flags</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Upcoming Games</Text>
        {gamesQuery.data?.map((game) => (
          <View key={game.id} style={styles.card}>
            <Text style={styles.cardTitle}>vs {game.opponent}</Text>
            <Text style={styles.cardMeta}>
              {new Date(game.scheduledAt).toLocaleDateString()}
            </Text>
            {game.location && (
              <Text style={styles.cardMeta}>{game.location}</Text>
            )}
          </View>
        ))}
        {gamesQuery.data?.length === 0 && (
          <Text style={styles.empty}>No upcoming games.</Text>
        )}

        <Pressable
          style={styles.linkButton}
          onPress={() => router.push("/(app)/(coach)/stats")}
        >
          <Text style={styles.linkText}>Enter Game Stats</Text>
        </Pressable>
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
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  cardSubtitle: { fontSize: 14, color: "#2E75B6", marginTop: 2 },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 2 },
  flagCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F57C00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  badgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  flagLabel: { fontSize: 15, fontWeight: "600", color: "#F57C00" },
  linkButton: {
    marginTop: 16,
    backgroundColor: "#2E75B6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  linkText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
