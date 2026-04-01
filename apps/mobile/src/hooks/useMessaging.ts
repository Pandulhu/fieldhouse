import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import { Message, MessageType, resolveMessagingPermission, UserRole } from "@fieldhouse/types"
import { SendMessageSchema } from "@fieldhouse/validators"
import { useAuthStore } from "../stores/authStore"

export const useConversationMessages = (conversationId: string) => {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("hidden", false)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId,
  })

  useEffect(() => {
    if (!conversationId) return

    channelRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.hidden) return

          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (prev) => [...(prev ?? []), newMessage]
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (prev) =>
              (prev ?? []).map((m) =>
                m.id === updated.id
                  ? updated.hidden ? null : updated
                  : m
              ).filter(Boolean) as Message[]
          )
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [conversationId, queryClient])

  return query
}

export const useSendMessage = () => {
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type,
      recipientRole,
    }: {
      conversationId: string
      content: string
      type: MessageType
      recipientRole: UserRole
    }) => {
      if (!user) throw new Error("Not authenticated")

      // Enforce messaging matrix before sending
      const permission = resolveMessagingPermission(user.role, recipientRole)
      if (permission === "none") {
        throw new Error("You are not permitted to message this user.")
      }
      if (type === MessageType.Chat && permission === "note_only") {
        throw new Error("You can only send notes to this user.")
      }

      const validated = SendMessageSchema.parse({ conversationId, content, type })

      const { error } = await supabase.from("messages").insert({
        conversation_id: validated.conversationId,
        sender_id: user.id,
        content: validated.content,
        type: validated.type,
      })

      if (error) throw error
    },
  })
}

export const useFlagMessage = () => {
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      messageId,
      reason,
    }: {
      messageId: string
      reason?: string
    }) => {
      if (!user) throw new Error("Not authenticated")

      // Hide immediately, then create flag
      await supabase
        .from("messages")
        .update({ hidden: true, flagged: true })
        .eq("id", messageId)

      const { error } = await supabase.from("flags").insert({
        message_id: messageId,
        flagged_by: user.id,
        reason: reason ?? null,
        auto_flagged: false,
        action: "pending",
      })

      if (error) throw error
    },
  })
}
