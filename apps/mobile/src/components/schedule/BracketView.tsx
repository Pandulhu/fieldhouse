import React from "react"
import { View, Text, ScrollView, StyleSheet } from "react-native"
import { BracketData, BracketMatchup } from "@fieldhouse/types"

// ─── DESIGN TOKENS ──────────────────────────────────────────

const Colors = {
  primary: "#1E3A5F",
  accent: "#2E75B6",
  success: "#2E7D32",
  white: "#FFFFFF",
  muted: "#888888",
  border: "#CCC",
  bg: "#F5F5F5",
  winnerBg: "#E8F5E9",
} as const

const MATCHUP_HEIGHT = 80
const MATCHUP_WIDTH = 160
const COLUMN_GAP = 40
const ROW_GAP = 16

// ─── PROPS ──────────────────────────────────────────────────

interface BracketViewProps {
  bracketData: BracketData
  teams: Record<string, string>
}

// ─── MATCHUP CARD ───────────────────────────────────────────

interface MatchupCardProps {
  matchup: BracketMatchup
  teams: Record<string, string>
}

const MatchupCard: React.FC<MatchupCardProps> = ({ matchup, teams }) => {
  const nameA = matchup.teamAId ? (teams[matchup.teamAId] ?? "Unknown") : "TBD"
  const nameB = matchup.teamBId ? (teams[matchup.teamBId] ?? "Unknown") : "TBD"
  const aWon = matchup.winnerId !== null && matchup.winnerId === matchup.teamAId
  const bWon = matchup.winnerId !== null && matchup.winnerId === matchup.teamBId

  return (
    <View style={styles.matchupCard}>
      <View
        style={[styles.teamSlot, aWon ? styles.winnerSlot : undefined]}
      >
        <Text
          style={[styles.teamName, aWon ? styles.winnerText : undefined]}
          numberOfLines={1}
        >
          {nameA}
        </Text>
      </View>
      <View style={styles.vsDivider}>
        <Text style={styles.vsText}>vs</Text>
      </View>
      <View
        style={[styles.teamSlot, bWon ? styles.winnerSlot : undefined]}
      >
        <Text
          style={[styles.teamName, bWon ? styles.winnerText : undefined]}
          numberOfLines={1}
        >
          {nameB}
        </Text>
      </View>
    </View>
  )
}

// ─── CONNECTOR LINE ─────────────────────────────────────────

const ConnectorLine: React.FC<{ height: number }> = ({ height }) => (
  <View style={[styles.connector, { height }]}>
    <View style={styles.connectorHorizontal} />
    <View style={[styles.connectorVertical, { height }]} />
    <View style={styles.connectorHorizontal} />
  </View>
)

// ─── MAIN COMPONENT ─────────────────────────────────────────

export const BracketView: React.FC<BracketViewProps> = ({
  bracketData,
  teams,
}) => {
  const { rounds } = bracketData

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.bracketContainer}>
        {rounds.map((round, roundIdx) => {
          const matchupSpacing =
            roundIdx === 0
              ? ROW_GAP
              : ROW_GAP + (MATCHUP_HEIGHT + ROW_GAP) * (2 ** roundIdx - 1)

          return (
            <View key={round.roundNumber} style={styles.roundColumn}>
              <Text style={styles.roundLabel}>{round.label}</Text>
              <View style={styles.matchupsColumn}>
                {round.matchups.map((matchup, mIdx) => (
                  <View
                    key={matchup.id}
                    style={[
                      styles.matchupWrapper,
                      { marginTop: mIdx === 0 ? matchupSpacing / 2 : matchupSpacing },
                    ]}
                  >
                    <MatchupCard matchup={matchup} teams={teams} />
                  </View>
                ))}
              </View>
              {/* Connector lines to next round */}
              {roundIdx < rounds.length - 1 ? (
                <View style={styles.connectorColumn}>
                  {round.matchups
                    .filter((_, i) => i % 2 === 0)
                    .map((matchup) => (
                      <ConnectorLine
                        key={`conn-${matchup.id}`}
                        height={MATCHUP_HEIGHT + matchupSpacing}
                      />
                    ))}
                </View>
              ) : null}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

// ─── STYLES ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  bracketContainer: { flexDirection: "row", padding: 16 },
  roundColumn: { alignItems: "center", marginRight: COLUMN_GAP },
  roundLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchupsColumn: { alignItems: "center" },
  matchupWrapper: { alignItems: "center" },
  matchupCard: {
    width: MATCHUP_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  teamSlot: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "center",
  },
  winnerSlot: { backgroundColor: Colors.winnerBg },
  teamName: { fontSize: 13, color: Colors.primary },
  winnerText: { fontWeight: "700", color: Colors.success },
  vsDivider: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingVertical: 2,
  },
  vsText: { fontSize: 10, color: Colors.muted, fontWeight: "600" },
  connectorColumn: {
    position: "absolute",
    right: -COLUMN_GAP,
    top: 30,
  },
  connector: { width: COLUMN_GAP, justifyContent: "space-between" },
  connectorHorizontal: {
    width: COLUMN_GAP / 2,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    alignSelf: "flex-start",
  },
  connectorVertical: {
    width: 0,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    position: "absolute",
    left: COLUMN_GAP / 2 - 1,
    top: 0,
  },
})
