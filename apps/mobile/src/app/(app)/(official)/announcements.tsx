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
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { Conversation, ConversationType } from "@fieldhouse/types"

interface AnnouncementRow {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender_name: string | null
}

export default function AnnouncementsScreen() {
  const user = useAuthStore((s) => s.user)
  const leagueId = user?.leagueId
  const queryClient = useQueryClient()
  const [body, setBody] = useState("")

  const announcementsQuery = useQuery<AnnouncementRow[]>({
    queryKey: ["league-announcements", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data: convs, error: cErr } = await supabase
        .from("conversations")
        .select("id")
        .eq("league_id", leagueId!)
        .eq("type", ConversationType.LeagueAnnouncement)
      if (cErr) throw cErr
      const convIds = (convs as Pick<Conversation, "id">[]).map((c) => c.id)
      if (convIds.length === 0) return []

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((m) => ({ ...m, sender_name: null })) as AnnouncementRow[]
    },
  })

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      let convId: string
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("league_id", leagueId!)
        .eq("type", ConversationType.LeagueAnnouncement)
        .limit(1)
        .single()

      if (existing) {
        convId = (existing as Pick<Conversation, "id">).id
      } else {
        const { data: created, error } = await supabase
          .from("conversations")
          .insert({
            league_id: leagueId!,
            type: ConversationType.LeagueAnnouncement,
            participant_ids: [user!.id],
          })
          .select("id")
          .single()
        if (error) throw error
        convId = (created as Pick<Conversation, "id">).id
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user!.id,
        content,
        type: "announcement",
        hidden: false,
        flagged: false,
        reviewed: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setBody("")
      queryClient.invalidateQueries({ queryKey: ["league-announcements", leagueId] })
    },
  })

  if (announcementsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Announcements</Text>

        <View style={styles.composeCard}>
          <TextInput
            style={styles.input}
            placeholder="Write an announcement..."
            placeholderTextColor="#888888"
            value={body}
            onChangeText={setBody}
            multiline
          />
          <Pressable
            style={[styles.postBtn, !body.trim() && styles.postBtnDisabled]}
            disabled={!body.trim() || postMutation.isPending}
            onPress={() => postMutation.mutate(body.trim())}
          >
            <Text style={styles.postBtnText}>
              {postMutation.isPending ? "Posting..." : "Post"}
            </Text>
          </Pressable>
        </View>

        {(announcementsQuery.data ?? []).length === 0 && (
          <Text style={styles.empty}>No announcements yet.</Text>
        )}

        {(announcementsQuery.data ?? []).map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardBody}>{a.content}</Text>
            <Text style={styles.cardMeta}>
              {new Date(a.created_at).toLocaleDateString()}
            </Text>
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
  composeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    minHeight: 60,
    fontSize: 15,
    color: "#1A1A2E",
    textAlignVertical: "top",
  },
  postBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#2E75B6",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
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
  cardBody: { fontSize: 15, color: "#1A1A2E" },
  cardMeta: { fontSize: 12, color: "#888888", marginTop: 8 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
