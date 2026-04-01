import React from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Share,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Player, PlayerStatRow, Sport } from "@fieldhouse/types"
import {
  calculateDerivedStats,
  STAT_LABELS,
  generateStatsCsv,
} from "@fieldhouse/stats-engine"

export default function ParentStatsScreen() {
  const user = useAuthStore((s) => s.user)

  const playersQuery = useQuery<Player[]>({
    queryKey: ["parent-players-stats", user?.id],
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

  const playerIds = (playersQuery.data ?? []).map((p) => p.id)

  const statsQuery = useQuery<PlayerStatRow[]>({
    queryKey: ["parent-stat-rows", playerIds],
    enabled: playerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stat_rows")
        .select("*")
        .in("player_id", playerIds)
      if (error) throw error
      return data as PlayerStatRow[]
    },
  })

  const handleExportCsv = async () => {
    const players = playersQuery.data ?? []
    const stats = statsQuery.data ?? []
    if (players.length === 0) return

    const aggregates = players.map((player) => {
      const rows = stats.filter((s) => s.playerId === player.id)
      const sport = rows[0]?.sport ?? Sport.Baseball
      const season = rows[0]?.season ?? ""
      const raw = rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.statKey] = (acc[r.statKey] ?? 0) + r.statValue
        return acc
      }, {})
      const derived = calculateDerivedStats(sport, raw)
      return { player, season, sport, raw, derived }
    })

    const csv = generateStatsCsv({ scope: "player", data: aggregates })
    await Share.share({ message: csv, title: "Player Stats Export" })
  }

  if (playersQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const players = playersQuery.data ?? []
  const stats = statsQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Player Stats</Text>

        {players.length === 0 && (
          <Text style={styles.empty}>No players linked to your account.</Text>
        )}

        {players.map((player) => {
          const rows = stats.filter((s) => s.playerId === player.id)
          const sport = rows[0]?.sport ?? Sport.Baseball
          const raw = rows.reduce<Record<string, number>>((acc, r) => {
            acc[r.statKey] = (acc[r.statKey] ?? 0) + r.statValue
            return acc
          }, {})
          const derived = calculateDerivedStats(sport, raw)

          return (
            <View key={player.id} style={styles.card}>
              <Text style={styles.playerName}>{player.displayName}</Text>

              {Object.keys(raw).length === 0 ? (
                <Text style={styles.empty}>No stats recorded.</Text>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Raw Stats</Text>
                  <View style={styles.grid}>
                    {Object.entries(raw).map(([key, val]) => (
                      <View key={key} style={styles.statItem}>
                        <Text style={styles.statValue}>{val}</Text>
                        <Text style={styles.statLabel}>
                          {STAT_LABELS[key] ?? key}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Derived Stats</Text>
                  <View style={styles.grid}>
                    {Object.entries(derived).map(([key, val]) => (
                      <View key={key} style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {val != null ? val.toFixed(3) : "--"}
                        </Text>
                        <Text style={styles.statLabel}>
                          {STAT_LABELS[key] ?? key}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )
        })}

        {stats.length > 0 && (
          <Pressable style={styles.exportBtn} onPress={handleExportCsv}>
            <Text style={styles.exportText}>Export CSV</Text>
          </Pressable>
        )}
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  playerName: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E75B6",
    marginTop: 12,
    marginBottom: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statItem: { alignItems: "center", minWidth: 60 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1E3A5F" },
  statLabel: { fontSize: 11, color: "#888888", marginTop: 2, textAlign: "center" },
  exportBtn: {
    marginTop: 12,
    backgroundColor: "#1E3A5F",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  exportText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic", marginTop: 6 },
})
