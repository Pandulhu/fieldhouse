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
import { Player, PlayerStatRow, Sport } from "@fieldhouse/types"
import { calculateDerivedStats, STAT_LABELS } from "@fieldhouse/stats-engine"

interface SeasonGroup {
  season: string
  sport: Sport
  raw: Record<string, number>
  derived: Record<string, number | null>
}

export default function MyStatsScreen() {
  const user = useAuthStore((s) => s.user)

  const playerQuery = useQuery<Player | null>({
    queryKey: ["player-profile-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("parent_user_id", user!.id)
        .eq("active", true)
        .limit(1)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return (data as Player) ?? null
    },
  })

  const statsQuery = useQuery<PlayerStatRow[]>({
    queryKey: ["player-all-stats", playerQuery.data?.id],
    enabled: !!playerQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stat_rows")
        .select("*")
        .eq("player_id", playerQuery.data!.id)
        .order("season", { ascending: false })
      if (error) throw error
      return data as PlayerStatRow[]
    },
  })

  if (playerQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const stats = statsQuery.data ?? []

  const seasonGroups: SeasonGroup[] = []
  const grouped = new Map<string, PlayerStatRow[]>()
  for (const row of stats) {
    const key = `${row.season}::${row.sport}`
    const existing = grouped.get(key) ?? []
    existing.push(row)
    grouped.set(key, existing)
  }
  for (const [key, rows] of grouped) {
    const [season, sport] = key.split("::") as [string, Sport]
    const raw = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.statKey] = (acc[r.statKey] ?? 0) + r.statValue
      return acc
    }, {})
    const derived = calculateDerivedStats(sport, raw)
    seasonGroups.push({ season, sport, raw, derived })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>My Stats</Text>

        {seasonGroups.length === 0 && (
          <Text style={styles.empty}>No stats recorded yet.</Text>
        )}

        {seasonGroups.map((group) => (
          <View key={`${group.season}-${group.sport}`} style={styles.card}>
            <Text style={styles.seasonTitle}>
              {group.season} - {group.sport}
            </Text>

            <View style={styles.grid}>
              {Object.entries(group.raw).map(([key, val]) => (
                <View key={key} style={styles.statItem}>
                  <Text style={styles.statValue}>{val}</Text>
                  <Text style={styles.statLabel}>
                    {STAT_LABELS[key] ?? key}
                  </Text>
                </View>
              ))}
            </View>

            {Object.keys(group.derived).length > 0 && (
              <>
                <Text style={styles.derivedLabel}>Derived</Text>
                <View style={styles.grid}>
                  {Object.entries(group.derived).map(([key, val]) => (
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seasonTitle: { fontSize: 16, fontWeight: "700", color: "#1E3A5F" },
  derivedLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E75B6",
    marginTop: 12,
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  statItem: { alignItems: "center", minWidth: 60 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1E3A5F" },
  statLabel: {
    fontSize: 11,
    color: "#888888",
    marginTop: 2,
    textAlign: "center",
  },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
