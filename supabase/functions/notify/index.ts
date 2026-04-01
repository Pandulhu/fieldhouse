// supabase/functions/notify/index.ts
// Triggered via Supabase Database Webhook on notifications INSERT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: "default"
  badge?: number
}

const sendExpoPushNotifications = async (messages: ExpoPushMessage[]) => {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  })
  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.status}`)
  }
  return response.json()
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const notification = payload.record

    if (!notification?.user_id) {
      return new Response("Invalid payload", { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch user push token and notification preferences
    const { data: user, error } = await supabase
      .from("users")
      .select("push_token, notification_prefs")
      .eq("id", notification.user_id)
      .single()

    if (error || !user?.push_token) {
      return new Response("User not found or no push token", { status: 200 })
    }

    // Check user preference for this notification type
    const typeMap: Record<string, string> = {
      new_message: "newMessage",
      new_announcement: "newAnnouncement",
      schedule_change: "scheduleChange",
      game_reminder: "gameReminder",
      flag_resolution: "flagResolution",
      season_signup_open: "seasonSignupOpen",
    }

    const prefKey = typeMap[notification.type]
    if (prefKey && user.notification_prefs?.[prefKey] === false) {
      return new Response("Notification suppressed by user preference", { status: 200 })
    }

    await sendExpoPushNotifications([{
      to: user.push_token,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? {},
      sound: "default",
    }])

    return new Response("Notification sent", { status: 200 })
  } catch (err) {
    console.error("Notify function error:", err)
    return new Response("Internal error", { status: 500 })
  }
})
