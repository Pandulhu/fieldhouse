import React, { useState, useEffect } from "react"
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
import { Player } from "@fieldhouse/types"

export default function PlayerProfileScreen() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [jersey, setJersey] = useState("")
  const [position, setPosition] = useState("")
  const [dob, setDob] = useState("")

  const playerQuery = useQuery<Player | null>({
    queryKey: ["parent-player-profile", user?.id],
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

  const player = playerQuery.data

  useEffect(() => {
    if (player) {
      setName(player.displayName)
      setJersey(player.jerseyNumber ?? "")
      setPosition(player.position ?? "")
      setDob(player.dateOfBirth ?? "")
    }
  }, [player])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!player) return
      const { error } = await supabase
        .from("players")
        .update({
          display_name: name.trim(),
          jersey_number: jersey.trim() || null,
          position: position.trim() || null,
          date_of_birth: dob.trim() || null,
        })
        .eq("id", player.id)
      if (error) throw error
    },
    onSuccess: () => {
      Alert.alert("Saved", "Player profile updated successfully.")
      queryClient.invalidateQueries({
        queryKey: ["parent-player-profile", user?.id],
      })
    },
    onError: () => Alert.alert("Error", "Failed to save profile."),
  })

  if (playerQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Player Profile</Text>
          <Text style={styles.empty}>
            No player linked to your account yet.
          </Text>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Player Profile</Text>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Player name"
          placeholderTextColor="#888888"
        />

        <Text style={styles.label}>Jersey Number</Text>
        <TextInput
          style={styles.input}
          value={jersey}
          onChangeText={setJersey}
          placeholder="e.g. 12"
          placeholderTextColor="#888888"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Position</Text>
        <TextInput
          style={styles.input}
          value={position}
          onChangeText={setPosition}
          placeholder="e.g. Pitcher"
          placeholderTextColor="#888888"
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#888888"
        />

        <Pressable
          style={[
            styles.saveBtn,
            saveMutation.isPending && styles.saveBtnDisabled,
          ]}
          disabled={saveMutation.isPending || !name.trim()}
          onPress={() => saveMutation.mutate()}
        >
          <Text style={styles.saveBtnText}>
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", marginBottom: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D6E4F0",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#1E3A5F" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#D6E4F0",
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: "#2E75B6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
