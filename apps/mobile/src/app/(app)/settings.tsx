import React, { useCallback, useEffect, useState } from "react"
import {
  View,
  Text,
  Switch,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Pressable,
} from "react-native"
import { MMKV } from "react-native-mmkv"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../stores/authStore"
import { NotificationType } from "@fieldhouse/types"

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const Colors = {
  Primary: "#1E3A5F",
  Accent: "#2E75B6",
  Background: "#F8FAFC",
  Surface: "#FFFFFF",
  Text: "#1A1A2E",
  Muted: "#888888",
  Danger: "#C62828",
} as const

// ─── NOTIFICATION PREF KEYS ─────────────────────────────────────────────────

const NOTIFICATION_PREF_KEYS: { key: NotificationType; label: string }[] = [
  { key: NotificationType.NewMessage, label: "New messages" },
  { key: NotificationType.NewAnnouncement, label: "Announcements" },
  { key: NotificationType.ScheduleChange, label: "Schedule changes" },
  { key: NotificationType.GameReminder, label: "Game reminders" },
  { key: NotificationType.FlagResolution, label: "Flag resolutions" },
  { key: NotificationType.SeasonSignupOpen, label: "Season sign-up opens" },
]

type NotificationPrefs = Record<NotificationType, boolean>

const DEFAULT_PREFS: NotificationPrefs = {
  [NotificationType.NewMessage]: true,
  [NotificationType.NewAnnouncement]: true,
  [NotificationType.ScheduleChange]: true,
  [NotificationType.GameReminder]: true,
  [NotificationType.FlagResolution]: true,
  [NotificationType.SeasonSignupOpen]: true,
}

// ─── MMKV STORAGE ────────────────────────────────────────────────────────────

const storage = new MMKV()
const DARK_MODE_KEY = "settings.darkMode"

// ─── SETTINGS SCREEN ────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [darkMode, setDarkMode] = useState(
    () => storage.getBoolean(DARK_MODE_KEY) ?? false
  )
  const [saving, setSaving] = useState(false)

  // Load prefs from supabase on mount
  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Failed to load notification prefs:", error)
        return
      }

      const stored = data?.notification_prefs as
        | Partial<NotificationPrefs>
        | null

      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...stored })
      }
    }

    load()
  }, [user])

  const togglePref = useCallback(
    async (key: NotificationType, value: boolean) => {
      if (!user) return

      const next = { ...prefs, [key]: value }
      setPrefs(next)
      setSaving(true)

      const { error } = await supabase
        .from("profiles")
        .update({ notification_prefs: next })
        .eq("id", user.id)

      if (error) {
        console.error("Failed to save notification prefs:", error)
        // Roll back
        setPrefs(prefs)
      }

      setSaving(false)
    },
    [user, prefs]
  )

  const toggleDarkMode = useCallback((value: boolean) => {
    setDarkMode(value)
    storage.set(DARK_MODE_KEY, value)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [signOut])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>Settings</Text>

        {/* ── Notification Preferences ────────────────────── */}
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.card}>
          {NOTIFICATION_PREF_KEYS.map(({ key, label }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Switch
                value={prefs[key]}
                onValueChange={(v) => togglePref(key, v)}
                trackColor={{ false: Colors.Muted, true: Colors.Accent }}
                thumbColor={Colors.Surface}
                disabled={saving}
              />
            </View>
          ))}
        </View>

        {/* ── Appearance ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: Colors.Muted, true: Colors.Accent }}
              thumbColor={Colors.Surface}
            />
          </View>
        </View>

        {/* ── Sign Out ────────────────────────────────────── */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.Primary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.Muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.Surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.Background,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.Text,
  },
  signOutButton: {
    marginTop: 32,
    backgroundColor: Colors.Danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.Surface,
  },
})
