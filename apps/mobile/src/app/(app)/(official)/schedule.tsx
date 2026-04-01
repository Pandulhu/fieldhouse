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
import { Game, GameStatus, Team } from "@fieldhouse/types"

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

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t]))

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

  if (gamesQuery.isLoading || teamsQuery.isLoading) {
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
        <Text style={styles.heading}>League Schedule</Text>

        {games.length === 0 && (
          <Text style={styles.empty}>No upcoming games scheduled.</Text>
        )}

        {games.map((game) => {
          const team = teamMap.get(game.teamId)
          return (
            <View key={game.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.teamName}>
                  {team?.name ?? "TBD"}
                </Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamName}>{game.opponent}</Text>
              </View>
              <Text style={styles.cardMeta}>
                {new Date(game.scheduledAt).toLocaleString()}
              </Text>
              {game.location && (
                <Text style={styles.cardMeta}>{game.location}</Text>
              )}
              <View
                style={[
                  styles.statusBadge,
                  game.status === GameStatus.Final && styles.statusFinal,
                  game.status === GameStatus.InProgress && styles.statusLive,
                  game.status === GameStatus.Cancelled && styles.statusCancelled,
                ]}
              >
                <Text style={styles.statusText}>{game.status}</Text>
              </View>
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
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  teamName: { fontSize: 15, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  vs: { fontSize: 13, color: "#888888", marginHorizontal: 8 },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 2 },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#D6E4F0",
  },
  statusFinal: { backgroundColor: "#E8F5E9" },
  statusLive: { backgroundColor: "#FFF3E0" },
  statusCancelled: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
