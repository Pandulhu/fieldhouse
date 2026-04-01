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
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Team, User } from "@fieldhouse/types"

interface TeamWithMeta extends Team {
  coachName: string | null
  playerCount: number
}

export default function TeamsScreen() {
  const user = useAuthStore((s) => s.user)
  const leagueId = user?.leagueId

  const teamsQuery = useQuery<TeamWithMeta[]>({
    queryKey: ["official-teams", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data: teams, error } = await supabase
        .from("teams")
        .select("*")
        .eq("league_id", leagueId!)
        .order("name", { ascending: true })
      if (error) throw error

      const result: TeamWithMeta[] = []
      for (const team of teams as Team[]) {
        const coachId = team.coachIds[0] ?? null
        let coachName: string | null = null
        if (coachId) {
          const { data: coach } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", coachId)
            .single()
          coachName = (coach as Pick<User, "displayName"> | null)
            ?.displayName ?? null
        }
        const { count } = await supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("team_id", team.id)
          .eq("active", true)
        result.push({
          ...team,
          coachName,
          playerCount: count ?? 0,
        })
      }
      return result
    },
  })

  if (teamsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const teams = teamsQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Teams</Text>

        {teams.length === 0 && (
          <Text style={styles.empty}>No teams in this league yet.</Text>
        )}

        {teams.map((team) => (
          <View key={team.id} style={styles.card}>
            <Text style={styles.cardTitle}>{team.name}</Text>
            <Text style={styles.cardSport}>{team.sport}</Text>
            {team.coachName && (
              <Text style={styles.cardMeta}>Coach: {team.coachName}</Text>
            )}
            <Text style={styles.cardMeta}>
              {team.playerCount} player{team.playerCount !== 1 ? "s" : ""}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Create team"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 80 },
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
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  cardSport: { fontSize: 14, color: "#2E75B6", marginTop: 2 },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 2 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2E75B6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: { color: "#FFFFFF", fontSize: 28, fontWeight: "600", lineHeight: 30 },
})
