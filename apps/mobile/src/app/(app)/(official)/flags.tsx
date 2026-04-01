import React from "react"
import {
  View,
  Text,
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
import { Flag, FlagAction, Message, User } from "@fieldhouse/types"

interface FlagWithDetails extends Flag {
  messagePreview: string
  senderName: string
}

export default function OfficialFlagsScreen() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const flagsQuery = useQuery<FlagWithDetails[]>({
    queryKey: ["official-pending-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flags")
        .select("*")
        .eq("action", FlagAction.Pending)
        .order("created_at", { ascending: false })
      if (error) throw error

      const flags = data as Flag[]
      const details: FlagWithDetails[] = []
      for (const flag of flags) {
        const { data: msg } = await supabase
          .from("messages")
          .select("content, sender_id")
          .eq("id", flag.messageId)
          .single()
        const message = msg as Pick<Message, "content" | "senderId"> | null
        let senderName = "Unknown"
        if (message?.senderId) {
          const { data: u } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", message.senderId)
            .single()
          senderName =
            (u as Pick<User, "displayName"> | null)?.displayName ?? "Unknown"
        }
        details.push({
          ...flag,
          messagePreview: message?.content?.slice(0, 120) ?? "",
          senderName,
        })
      }
      return details
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({
      flagId,
      action,
    }: {
      flagId: string
      action: FlagAction
    }) => {
      const { error } = await supabase
        .from("flags")
        .update({ action, reviewed_by: user!.id })
        .eq("id", flagId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["official-pending-flags"] })
    },
  })

  const handleAction = (flagId: string, action: FlagAction) => {
    Alert.alert("Confirm", `Mark this flag as ${action}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => actionMutation.mutate({ flagId, action }) },
    ])
  }

  if (flagsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const flags = flagsQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Flag Review</Text>

        {flags.length === 0 && (
          <Text style={styles.empty}>No pending flags to review.</Text>
        )}

        {flags.map((flag) => (
          <View key={flag.id} style={styles.card}>
            <Text style={styles.senderName}>{flag.senderName}</Text>
            <Text style={styles.preview} numberOfLines={3}>
              {flag.messagePreview}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {new Date(flag.createdAt).toLocaleDateString()}
              </Text>
              {flag.perspectiveScore != null && (
                <Text style={styles.score}>
                  Score: {flag.perspectiveScore.toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleAction(flag.id, FlagAction.Approved)}
              >
                <Text style={styles.actionText}>Approve</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleAction(flag.id, FlagAction.Deleted)}
              >
                <Text style={styles.actionText}>Delete</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.escalateBtn]}
                onPress={() => handleAction(flag.id, FlagAction.Escalated)}
              >
                <Text style={styles.actionText}>Escalate</Text>
              </Pressable>
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
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  senderName: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  preview: { fontSize: 14, color: "#1A1A2E", marginTop: 6, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  meta: { fontSize: 12, color: "#888888" },
  score: { fontSize: 12, fontWeight: "600", color: "#F57C00" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  approveBtn: { backgroundColor: "#2E7D32" },
  deleteBtn: { backgroundColor: "#C62828" },
  escalateBtn: { backgroundColor: "#F57C00" },
  actionText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
