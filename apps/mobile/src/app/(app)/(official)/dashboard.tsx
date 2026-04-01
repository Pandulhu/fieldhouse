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
import { Game, Team, Flag, FlagAction } from "@fieldhouse/types"

interface Announcement {
  id: string
  title: string
  body: string
  created_at: string
}

export default function OfficialDashboard() {
  const user = useAuthStore((s) => s.user)
  const leagueId = user?.leagueId

  const teamsQuery = useQuery<Team[]>({
    queryKey: ["teams", leagueId],
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

  const flagsQuery = useQuery<Flag[]>({
    queryKey: ["flags", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flags")
        .select("*")
        .eq("action", FlagAction.Pending)
      if (error) throw error
      return data as Flag[]
    },
  })

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["upcoming-games", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("league_id", leagueId!)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10)
      if (error) throw error
      return data as Game[]
    },
  })

  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ["announcements", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .eq("league_id", leagueId!)
        .order("created_at", { ascending: false })
        .limit(5)
      if (error) throw error
      return (data ?? []) as Announcement[]
    },
  })

  const loading =
    teamsQuery.isLoading ||
    flagsQuery.isLoading ||
    gamesQuery.isLoading

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>League Dashboard</Text>
        <Text style={styles.subheading}>
          {user?.displayName ?? "Official"}
        </Text>

        <View style={styles.row}>
          <StatCard label="Teams" value={teamsQuery.data?.length ?? 0} />
          <StatCard label="Active Flags" value={flagsQuery.data?.length ?? 0} />
          <StatCard label="Upcoming" value={gamesQuery.data?.length ?? 0} />
        </View>

        <Text style={styles.sectionTitle}>Recent Announcements</Text>
        {announcementsQuery.data?.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>
              {a.body}
            </Text>
          </View>
        ))}
        {announcementsQuery.data?.length === 0 && (
          <Text style={styles.empty}>No announcements yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  subheading: { fontSize: 14, color: "#888888", marginBottom: 16 },
  row: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: "700", color: "#1E3A5F" },
  statLabel: { fontSize: 12, color: "#888888", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A2E",
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
  cardBody: { fontSize: 14, color: "#888888", marginTop: 4 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
