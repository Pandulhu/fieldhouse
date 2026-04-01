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
import { Player, Team, Game } from "@fieldhouse/types"

export default function ParentDashboard() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const playersQuery = useQuery<Player[]>({
    queryKey: ["my-players", user?.id],
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
    queryKey: ["parent-teams", teamIds],
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

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["parent-upcoming-games", teamIds],
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

  const teamMap = new Map(
    (teamsQuery.data ?? []).map((t) => [t.id, t])
  )

  if (playersQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>My Family</Text>
        <Text style={styles.subheading}>
          {user?.displayName ?? "Parent"}
        </Text>

        {(playersQuery.data ?? []).map((player) => {
          const team = teamMap.get(player.teamId)
          return (
            <View key={player.id} style={styles.card}>
              <View style={styles.playerRow}>
                <View style={styles.jersey}>
                  <Text style={styles.jerseyText}>
                    {player.jerseyNumber ?? "—"}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.cardTitle}>
                    {player.displayName}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {team?.name ?? "Team TBD"}
                  </Text>
                  {player.position && (
                    <Text style={styles.cardMeta}>
                      {player.position}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )
        })}

        {(playersQuery.data ?? []).length === 0 && (
          <Text style={styles.empty}>
            No players linked to your account yet.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Upcoming Games</Text>
        {(gamesQuery.data ?? []).map((game) => (
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
          onPress={() => router.push("/(app)/(parent)/stats")}
        >
          <Text style={styles.linkText}>View Stats</Text>
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
  playerRow: { flexDirection: "row", alignItems: "center" },
  jersey: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D6E4F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  jerseyText: { fontSize: 16, fontWeight: "700", color: "#1E3A5F" },
  playerInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 2 },
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
