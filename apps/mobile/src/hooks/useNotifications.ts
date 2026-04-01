import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { router } from "expo-router"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../stores/authStore"
import { Notification } from "@fieldhouse/types"

// ─── REGISTER PUSH TOKEN ─────────────────────────────────────────────────────

export const useRegisterPushToken = () => {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) return

    const register = async () => {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId as string | undefined

      if (!projectId) {
        console.warn("Missing EAS projectId — push token not registered.")
        return
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      const { error } = await supabase
        .from("users")
        .update({ push_token: token })
        .eq("id", user.id)

      if (error) {
        console.error("Failed to upsert push token:", error)
      }
    }

    register()
  }, [user])
}

// ─── FETCH NOTIFICATIONS ─────────────────────────────────────────────────────

export const useNotifications = () => {
  const user = useAuthStore((s) => s.user)

  return useQuery<Notification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        type: row.type as Notification["type"],
        title: row.title as string,
        body: row.body as string,
        read: row.read as boolean,
        data: row.data as Record<string, unknown>,
        createdAt: row.created_at as string,
      }))
    },
    enabled: !!user?.id,
  })
}

// ─── MARK NOTIFICATION READ ──────────────────────────────────────────────────

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] })
    },
  })
}

// ─── NOTIFICATION LISTENERS ──────────────────────────────────────────────────

interface NotificationData {
  screen?: string
  [key: string]: unknown
}

export const useNotificationListener = () => {
  const receivedRef = useRef<Notifications.Subscription | null>(null)
  const responseRef = useRef<Notifications.Subscription | null>(null)

  useEffect(() => {
    receivedRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Foreground notification received — no-op by default.
        // Could be extended to show an in-app toast.
        console.debug(
          "Notification received in foreground:",
          notification.request.identifier
        )
      }
    )

    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content
          .data as NotificationData

        if (data?.screen && typeof data.screen === "string") {
          router.push(data.screen as `/${string}`)
        }
      }
    )

    return () => {
      receivedRef.current?.remove()
      responseRef.current?.remove()
    }
  }, [])
}
