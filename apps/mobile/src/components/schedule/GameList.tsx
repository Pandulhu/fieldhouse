import React from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import { Game, GameStatus } from "@fieldhouse/types"
import { sharedStyles, COLORS } from "../../lib/sharedStyles"

// ─── STATUS COLORS ─────────────────────────────────────────

const STATUS_BG: Record<GameStatus, string> = {
  [GameStatus.Scheduled]: "#D6E4F0",
  [GameStatus.InProgress]: "#FFF3E0",
  [GameStatus.Final]: "#E8F5E9",
  [GameStatus.Cancelled]: "#FFEBEE",
  [GameStatus.Postponed]: "#ECEFF1",
}

// ─── PROPS ─────────────────────────────────────────────────

interface GameListProps {
  games: Game[]
  loading: boolean
  emptyMessage?: string
  showTeamName?: boolean
  teamMap?: Map<string, string>
}

// ─── COMPONENT ─────────────────────────────────────────────

export const GameList: React.FC<GameListProps> = ({
  games,
  loading,
  emptyMessage = "No games scheduled.",
  showTeamName = false,
  teamMap,
}) => {
  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    )
  }

  return (
    <ScrollView contentContainerStyle={sharedStyles.scroll}>
      {games.length === 0 && (
        <Text style={sharedStyles.empty}>{emptyMessage}</Text>
      )}

      {games.map((game) => {
        const isFinal = game.status === GameStatus.Final
        return (
          <View key={game.id} style={sharedStyles.card}>
            {showTeamName && teamMap && (
              <Text style={styles.teamLabel}>
                {teamMap.get(game.teamId) ?? "Team"}
              </Text>
            )}

            <View style={styles.headerRow}>
              <Text style={styles.opponent} numberOfLines={1}>
                vs {game.opponent}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_BG[game.status] },
                ]}
              >
                <Text style={styles.statusText}>{game.status}</Text>
              </View>
            </View>

            <Text style={styles.meta}>
              {new Date(game.scheduledAt).toLocaleString()}
            </Text>
            {game.location ? (
              <Text style={styles.meta}>{game.location}</Text>
            ) : null}

            {isFinal &&
              game.scoreHome != null &&
              game.scoreAway != null && (
                <Text style={styles.score}>
                  {game.scoreHome} - {game.scoreAway}
                </Text>
              )}
          </View>
        )
      })}
    </ScrollView>
  )
}

// ─── LOCAL STYLES ──────────────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent,
    marginBottom: 4,
  },
  opponent: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  meta: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 8,
  },
})
