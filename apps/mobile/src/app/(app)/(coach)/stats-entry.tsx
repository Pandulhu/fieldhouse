import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Player, Game, Team, GameStatus } from "@fieldhouse/types"
import { STAT_SCHEMAS, STAT_LABELS } from "@fieldhouse/stats-engine"

export default function StatsEntryScreen() {
  const user = useAuthStore((s) => s.user)
  const teamIds = user?.teamIds ?? []
  const teamId = teamIds[0] ?? null
  const queryClient = useQueryClient()

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [statValues, setStatValues] = useState<Record<string, string>>({})

  const teamQuery = useQuery<Team | null>({
    queryKey: ["coach-team-sport", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId!)
        .single()
      if (error) throw error
      return data as Team
    },
  })

  const playersQuery = useQuery<Player[]>({
    queryKey: ["coach-roster-stats", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId!)
        .eq("active", true)
        .order("display_name", { ascending: true })
      if (error) throw error
      return data as Player[]
    },
  })

  const gamesQuery = useQuery<Game[]>({
    queryKey: ["coach-games-entry", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("team_id", teamId!)
        .order("scheduled_at", { ascending: false })
        .limit(20)
      if (error) throw error
      return data as Game[]
    },
  })

  const sport = teamQuery.data?.sport
  const statKeys = sport ? STAT_SCHEMAS[sport] : []

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlayerId || !selectedGameId || !sport || !teamId) return
      const rows = Object.entries(statValues)
        .filter(([, v]) => v !== "" && !isNaN(Number(v)))
        .map(([key, val]) => ({
          player_id: selectedPlayerId,
          team_id: teamId,
          game_id: selectedGameId,
          season: teamQuery.data?.season ?? "",
          sport,
          stat_key: key,
          stat_value: Number(val),
          entered_by: user!.id,
        }))
      if (rows.length === 0) return
      const { error } = await supabase.from("player_stat_rows").insert(rows)
      if (error) throw error
    },
    onSuccess: () => {
      Alert.alert("Success", "Stats saved successfully.")
      setStatValues({})
      queryClient.invalidateQueries({ queryKey: ["coach-roster-stats"] })
    },
    onError: () => Alert.alert("Error", "Failed to save stats."),
  })

  if (teamQuery.isLoading || playersQuery.isLoading || gamesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const players = playersQuery.data ?? []
  const games = gamesQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Enter Stats</Text>

        <Text style={styles.label}>Select Player</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {players.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  styles.chip,
                  selectedPlayerId === p.id && styles.chipActive,
                ]}
                onPress={() => setSelectedPlayerId(p.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPlayerId === p.id && styles.chipTextActive,
                  ]}
                >
                  {p.displayName}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Select Game</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {games.map((g) => (
              <Pressable
                key={g.id}
                style={[
                  styles.chip,
                  selectedGameId === g.id && styles.chipActive,
                ]}
                onPress={() => setSelectedGameId(g.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGameId === g.id && styles.chipTextActive,
                  ]}
                >
                  vs {g.opponent} ({new Date(g.scheduledAt).toLocaleDateString()})
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {selectedPlayerId && selectedGameId && (
          <>
            <Text style={styles.label}>
              {sport?.toUpperCase()} Stats
            </Text>
            {statKeys.map((key) => (
              <View key={key} style={styles.statRow}>
                <Text style={styles.statLabel}>
                  {STAT_LABELS[key] ?? key}
                </Text>
                <TextInput
                  style={styles.statInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#888888"
                  value={statValues[key] ?? ""}
                  onChangeText={(v) =>
                    setStatValues((prev) => ({ ...prev, [key]: v }))
                  }
                />
              </View>
            ))}
            <Pressable
              style={[
                styles.submitBtn,
                submitMutation.isPending && styles.submitBtnDisabled,
              ]}
              disabled={submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
            >
              <Text style={styles.submitText}>
                {submitMutation.isPending ? "Saving..." : "Submit Stats"}
              </Text>
            </Pressable>
          </>
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginTop: 12,
    marginBottom: 6,
  },
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#D6E4F0",
  },
  chipActive: { backgroundColor: "#1E3A5F" },
  chipText: { fontSize: 13, color: "#1E3A5F", fontWeight: "500" },
  chipTextActive: { color: "#FFFFFF" },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  statLabel: { fontSize: 14, color: "#1A1A2E", flex: 1 },
  statInput: {
    width: 72,
    height: 40,
    borderWidth: 1,
    borderColor: "#D6E4F0",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    color: "#1A1A2E",
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: "#2E75B6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
})
