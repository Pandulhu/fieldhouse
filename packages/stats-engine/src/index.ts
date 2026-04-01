import { Sport, PlayerStatsAggregate, Player } from "@fieldhouse/types"
import Papa from "papaparse"

// ─── STAT SCHEMAS ─────────────────────────────────────────────────────────────
// Raw stat keys per sport. These are the keys stored in player_stats.stat_key.

export const STAT_SCHEMAS: Record<Sport, string[]> = {
  [Sport.Baseball]: [
    // Batting
    "ab", "h", "doubles", "triples", "hr", "rbi", "r", "bb", "so", "sb", "cs", "hbp",
    // Pitching
    "ip", "er", "h_allowed", "bb_allowed", "k", "hr_allowed",
  ],
  [Sport.Softball]: [
    // same as baseball
    "ab", "h", "doubles", "triples", "hr", "rbi", "r", "bb", "so", "sb", "cs", "hbp",
    "ip", "er", "h_allowed", "bb_allowed", "k", "hr_allowed",
  ],
  [Sport.Soccer]: [
    "goals", "assists", "shots", "shots_on_goal", "minutes_played",
    // GK
    "saves", "goals_allowed", "clean_sheets",
  ],
  [Sport.Football]: [
    // Passing
    "pass_att", "pass_comp", "pass_yds", "pass_td", "int",
    // Rushing
    "rush_att", "rush_yds", "rush_td",
    // Receiving
    "rec", "rec_yds", "rec_td",
    // Defense
    "tackles", "sacks",
  ],
  [Sport.Basketball]: [
    "pts", "reb", "ast", "stl", "blk", "to",
    "fgm", "fga", "three_pm", "three_pa", "ftm", "fta",
  ],
}

// ─── DERIVED STAT CALCULATORS ─────────────────────────────────────────────────

const safeDivide = (num: number, denom: number, decimals = 3): number | null => {
  if (denom === 0) return null
  return parseFloat((num / denom).toFixed(decimals))
}

const battingDerived = (raw: Record<string, number>) => ({
  ba: safeDivide(raw.h ?? 0, raw.ab ?? 0),
  obp: safeDivide(
    (raw.h ?? 0) + (raw.bb ?? 0) + (raw.hbp ?? 0),
    (raw.ab ?? 0) + (raw.bb ?? 0) + (raw.hbp ?? 0)
  ),
  slg: safeDivide(
    (raw.h ?? 0) + (raw.doubles ?? 0) + (raw.triples ?? 0) * 2 + (raw.hr ?? 0) * 3,
    raw.ab ?? 0
  ),
  era: raw.ip
    ? safeDivide((raw.er ?? 0) * 9, raw.ip)
    : null,
  whip: raw.ip
    ? safeDivide((raw.bb_allowed ?? 0) + (raw.h_allowed ?? 0), raw.ip)
    : null,
})

const soccerDerived = (raw: Record<string, number>) => ({
  shot_accuracy: safeDivide(raw.shots_on_goal ?? 0, raw.shots ?? 0),
  goals_per_game: raw.minutes_played
    ? safeDivide((raw.goals ?? 0) * 90, raw.minutes_played)
    : null,
})

const basketballDerived = (raw: Record<string, number>) => ({
  fg_pct: safeDivide(raw.fgm ?? 0, raw.fga ?? 0),
  three_pct: safeDivide(raw.three_pm ?? 0, raw.three_pa ?? 0),
  ft_pct: safeDivide(raw.ftm ?? 0, raw.fta ?? 0),
})

const footballDerived = (raw: Record<string, number>) => ({
  completion_pct: safeDivide(raw.pass_comp ?? 0, raw.pass_att ?? 0),
  ypc: safeDivide(raw.rush_yds ?? 0, raw.rush_att ?? 0),
})

export const calculateDerivedStats = (
  sport: Sport,
  raw: Record<string, number>
): Record<string, number | null> => {
  switch (sport) {
    case Sport.Baseball:
    case Sport.Softball:
      return battingDerived(raw)
    case Sport.Soccer:
      return soccerDerived(raw)
    case Sport.Basketball:
      return basketballDerived(raw)
    case Sport.Football:
      return footballDerived(raw)
    default:
      return {}
  }
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────

interface CsvExportOptions {
  scope: "player" | "team" | "league"
  data: PlayerStatsAggregate[]
}

const flattenAggregate = (agg: PlayerStatsAggregate) => ({
  player_name: agg.player.displayName,
  jersey: agg.player.jerseyNumber ?? "",
  position: agg.player.position ?? "",
  season: agg.season,
  sport: agg.sport,
  ...Object.fromEntries(
    Object.entries(agg.raw).map(([k, v]) => [`raw_${k}`, v])
  ),
  ...Object.fromEntries(
    Object.entries(agg.derived).map(([k, v]) => [`derived_${k}`, v ?? ""])
  ),
})

export const generateStatsCsv = ({ data }: CsvExportOptions): string => {
  const rows = data.map(flattenAggregate)
  return Papa.unparse(rows)
}

// ─── STAT LABEL MAP ───────────────────────────────────────────────────────────
// Human-readable labels for each stat key. Used by UI display.

export const STAT_LABELS: Record<string, string> = {
  // Batting
  ab: "At Bats", h: "Hits", doubles: "2B", triples: "3B", hr: "HR",
  rbi: "RBI", r: "Runs", bb: "Walks", so: "Strikeouts", sb: "Stolen Bases",
  cs: "Caught Stealing", hbp: "HBP",
  // Pitching
  ip: "Innings Pitched", er: "Earned Runs", h_allowed: "Hits Allowed",
  bb_allowed: "Walks Allowed", k: "Strikeouts (P)", hr_allowed: "HR Allowed",
  // Derived batting
  ba: "Batting Avg", obp: "On-Base %", slg: "Slugging %",
  era: "ERA", whip: "WHIP",
  // Soccer
  goals: "Goals", assists: "Assists", shots: "Shots",
  shots_on_goal: "Shots on Goal", minutes_played: "Minutes",
  saves: "Saves", goals_allowed: "Goals Allowed", clean_sheets: "Clean Sheets",
  shot_accuracy: "Shot Accuracy", goals_per_game: "Goals/90",
  // Basketball
  pts: "Points", reb: "Rebounds", ast: "Assists", stl: "Steals",
  blk: "Blocks", to: "Turnovers",
  fgm: "FG Made", fga: "FG Attempted", three_pm: "3P Made",
  three_pa: "3P Attempted", ftm: "FT Made", fta: "FT Attempted",
  fg_pct: "FG%", three_pct: "3P%", ft_pct: "FT%",
  // Football
  pass_att: "Pass Att", pass_comp: "Completions", pass_yds: "Pass Yds",
  pass_td: "Pass TD", int: "INT",
  rush_att: "Rush Att", rush_yds: "Rush Yds", rush_td: "Rush TD",
  rec: "Receptions", rec_yds: "Rec Yds", rec_td: "Rec TD",
  tackles: "Tackles", sacks: "Sacks",
  completion_pct: "Completion%", ypc: "YPC",
}

export { Sport }
export * from "./brackets"
