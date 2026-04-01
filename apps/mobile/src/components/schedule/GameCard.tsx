import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Game, GameStatus } from "@fieldhouse/types"

// ─── DESIGN TOKENS ──────────────────────────────────────────

const Colors = {
  primary: "#1E3A5F",
  accent: "#2E75B6",
  success: "#2E7D32",
  warning: "#F57C00",
  danger: "#C62828",
  muted: "#888888",
  white: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#555555",
} as const

const STATUS_CONFIG: Record<
  GameStatus,
  { label: string; bg: string; fg: string }
> = {
  [GameStatus.Scheduled]: {
    label: "Scheduled",
    bg: Colors.accent,
    fg: Colors.white,
  },
  [GameStatus.InProgress]: {
    label: "In Progress",
    bg: Colors.warning,
    fg: Colors.white,
  },
  [GameStatus.Final]: {
    label: "Final",
    bg: Colors.success,
    fg: Colors.white,
  },
  [GameStatus.Cancelled]: {
    label: "Cancelled",
    bg: Colors.danger,
    fg: Colors.white,
  },
  [GameStatus.Postponed]: {
    label: "Postponed",
    bg: Colors.muted,
    fg: Colors.white,
  },
}

// ─── DATE FORMATTING ────────────────────────────────────────

const formatDateTime = (iso: string): string => {
  const d = new Date(iso)
  const date = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  return `${date} at ${time}`
}

// ─── PROPS ──────────────────────────────────────────────────

interface GameCardProps {
  game: Game
  teamName?: string
  onPress?: () => void
}

// ─── COMPONENT ──────────────────────────────────────────────

export const GameCard: React.FC<GameCardProps> = ({
  game,
  teamName,
  onPress,
}) => {
  const statusCfg = STATUS_CONFIG[game.status]

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Game vs ${game.opponent}`}
    >
      {/* Header row: opponent + status badge */}
      <View style={styles.headerRow}>
        <View style={styles.opponentWrap}>
          {teamName ? (
            <Text style={styles.teamLabel}>{teamName}</Text>
          ) : null}
          <Text style={styles.opponent} numberOfLines={1}>
            vs {game.opponent}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.badgeText, { color: statusCfg.fg }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Date & location */}
      <Text style={styles.dateTime}>{formatDateTime(game.scheduledAt)}</Text>
      {game.location ? (
        <Text style={styles.location} numberOfLines={1}>
          {game.location}
        </Text>
      ) : null}

      {/* Final score */}
      {game.status === GameStatus.Final &&
      game.scoreHome !== null &&
      game.scoreAway !== null ? (
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score:</Text>
          <Text style={styles.scoreValue}>
            Home {game.scoreHome} - Away {game.scoreAway}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

// ─── STYLES ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  opponentWrap: { flex: 1, marginRight: 8 },
  teamLabel: { fontSize: 12, color: Colors.muted, marginBottom: 2 },
  opponent: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.primary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  dateTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  location: { fontSize: 13, color: Colors.muted },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginRight: 6,
  },
  scoreValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
  },
})
