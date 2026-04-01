import React from "react"
import { Text, FlatList, SafeAreaView, ActivityIndicator } from "react-native"
import { usePendingFlags, useFlagAction, FlagWithDetails } from "../../../hooks/useFlags"
import { FlagReviewItem } from "../../../components/moderation/FlagReviewItem"
import { sharedStyles, COLORS } from "../../../lib/sharedStyles"

const QUERY_KEY = "coach-pending-flags"

export default function CoachFlagsScreen() {
  const flagsQuery = usePendingFlags(QUERY_KEY)
  const { confirmAction } = useFlagAction(QUERY_KEY)

  if (flagsQuery.isLoading) {
    return (
      <SafeAreaView style={sharedStyles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    )
  }

  const flags = flagsQuery.data ?? []

  return (
    <SafeAreaView style={sharedStyles.safe}>
      <FlatList
        data={flags}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sharedStyles.scroll}
        ListHeaderComponent={<Text style={sharedStyles.heading}>Team Flags</Text>}
        ListEmptyComponent={
          <Text style={sharedStyles.empty}>No pending flags for your teams.</Text>
        }
        renderItem={({ item }) => (
          <FlagReviewItem flag={item} onAction={confirmAction} />
        )}
      />
    </SafeAreaView>
  )
}
