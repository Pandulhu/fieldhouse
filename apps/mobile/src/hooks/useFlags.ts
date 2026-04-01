import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Alert } from "react-native"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../stores/authStore"
import { Flag, FlagAction, Message, User } from "@fieldhouse/types"

export interface FlagWithDetails extends Flag {
  messagePreview: string
  senderName: string
}

export const usePendingFlags = (queryKey: string) => {
  return useQuery<FlagWithDetails[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data: flagRows, error } = await supabase
        .from("flags")
        .select("*, messages(content, sender_id, users:sender_id(display_name))")
        .eq("action", "pending")
        .order("created_at", { ascending: false })
      if (error) throw error

      return (flagRows ?? []).map((row: Record<string, unknown>) => {
        const msg = row.messages as Record<string, unknown> | null
        const sender = msg?.users as Record<string, unknown> | null
        return {
          ...(row as unknown as Flag),
          messagePreview: ((msg?.content as string) ?? "").slice(0, 120),
          senderName: (sender?.display_name as string) ?? "Unknown",
        }
      })
    },
  })
}

export const useFlagAction = (queryKey: string) => {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ flagId, action }: { flagId: string; action: FlagAction }) => {
      const { error } = await supabase
        .from("flags")
        .update({ action, reviewed_by: user!.id })
        .eq("id", flagId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
  })

  const confirmAction = (flagId: string, action: FlagAction) => {
    Alert.alert("Confirm", `Mark this flag as ${action}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => mutation.mutate({ flagId, action }) },
    ])
  }

  return { mutation, confirmAction }
}
