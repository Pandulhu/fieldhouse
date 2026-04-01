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
import { Player, User } from "@fieldhouse/types"

interface RosterPlayer extends Player {
  parentName: string | null
}

export default function RosterScreen() {
  const user = useAuthStore((s) => s.user)
  const teamIds = user?.teamIds ?? []
  const teamId = teamIds[0] ?? null

  const rosterQuery = useQuery<RosterPlayer[]>({
    queryKey: ["coach-roster", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId!)
        .eq("active", true)
        .order("display_name", { ascending: true })
      if (error) throw error

      const players = data as Player[]
      const result: RosterPlayer[] = []
      for (const player of players) {
        let parentName: string | null = null
        if (player.parentUserId) {
          const { data: parent } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", player.parentUserId)
            .single()
          parentName =
            (parent as Pick<User, "displayName"> | null)?.displayName ?? null
        }
        result.push({ ...player, parentName })
      }
      return result
    },
  })

  if (rosterQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const roster = rosterQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Team Roster</Text>

        {roster.length === 0 && (
          <Text style={styles.empty}>No players on this roster yet.</Text>
        )}

        {roster.map((player) => (
          <View key={player.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.jersey}>
                <Text style={styles.jerseyText}>
                  {player.jerseyNumber ?? "--"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.playerName}>{player.displayName}</Text>
                {player.position && (
                  <Text style={styles.position}>{player.position}</Text>
                )}
                {player.parentName && (
                  <Text style={styles.meta}>
                    Parent: {player.parentName}
                  </Text>
                )}
              </View>
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
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
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
  info: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  position: { fontSize: 13, color: "#2E75B6", marginTop: 2 },
  meta: { fontSize: 12, color: "#888888", marginTop: 2 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
