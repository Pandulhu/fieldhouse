import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { FlagAction } from "@fieldhouse/types"
import { FlagWithDetails } from "../../hooks/useFlags"
import { COLORS, sharedStyles } from "../../lib/sharedStyles"

interface FlagReviewItemProps {
  flag: FlagWithDetails
  onAction: (flagId: string, action: FlagAction) => void
}

export function FlagReviewItem({ flag, onAction }: FlagReviewItemProps) {
  return (
    <View style={sharedStyles.card}>
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
          onPress={() => onAction(flag.id, FlagAction.Approved)}
        >
          <Text style={styles.actionText}>Approve</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => onAction(flag.id, FlagAction.Deleted)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.escalateBtn]}
          onPress={() => onAction(flag.id, FlagAction.Escalated)}
        >
          <Text style={styles.actionText}>Escalate</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  senderName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  preview: { fontSize: 14, color: COLORS.text, marginTop: 6, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  meta: { fontSize: 12, color: COLORS.muted },
  score: { fontSize: 12, fontWeight: "600", color: COLORS.warning },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  approveBtn: { backgroundColor: COLORS.success },
  deleteBtn: { backgroundColor: COLORS.danger },
  escalateBtn: { backgroundColor: COLORS.warning },
  actionText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
})
