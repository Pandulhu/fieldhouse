import { BracketData, BracketRound, BracketMatchup, BracketType } from "@fieldhouse/types"

interface SeededTeam { id: string; seed: number }

const nextPow2 = (n: number): number => { let p = 1; while (p < n) p *= 2; return p }

let ctr = 0
const mid = (): string => `m-${Date.now()}-${++ctr}`

const emptyMatchup = (): BracketMatchup => ({
  id: mid(), teamAId: null, teamBId: null, winnerId: null, gameId: null,
})

const label = (r: number, total: number): string => {
  const rem = total - r
  if (rem === 0) return "Finals"
  if (rem === 1) return "Semifinals"
  if (rem === 2) return "Quarterfinals"
  return `Round ${r + 1}`
}

// ─── SINGLE ELIMINATION ─────────────────────────────────────

export const generateSingleEliminationBracket = (teams: SeededTeam[]): BracketData => {
  const sorted = [...teams].sort((a, b) => a.seed - b.seed)
  const size = nextPow2(sorted.length)
  const totalRounds = Math.log2(size)

  // First round: 1vN, 2v(N-1), etc. Byes auto-advance.
  const r0: BracketMatchup[] = []
  for (let i = 0; i < size / 2; i++) {
    const top = sorted[i] as SeededTeam | undefined
    const bot = sorted[size - 1 - i] as SeededTeam | undefined
    r0.push({
      id: mid(),
      teamAId: top?.id ?? null,
      teamBId: bot?.id ?? null,
      winnerId: !bot ? (top?.id ?? null) : null,
      gameId: null,
    })
  }

  const rounds: BracketRound[] = [{ roundNumber: 0, label: label(0, totalRounds), matchups: r0 }]

  for (let r = 1; r < totalRounds; r++) {
    const prev = rounds[r - 1].matchups
    const matchups: BracketMatchup[] = []
    for (let i = 0; i < prev.length; i += 2) {
      const a = prev[i].winnerId
      const b = (prev[i + 1] as BracketMatchup | undefined)?.winnerId ?? null
      matchups.push({ id: mid(), teamAId: a, teamBId: b, winnerId: null, gameId: null })
    }
    rounds.push({ roundNumber: r, label: label(r, totalRounds), matchups })
  }

  return { type: BracketType.SingleElimination, rounds }
}

// ─── DOUBLE ELIMINATION ─────────────────────────────────────

export const generateDoubleEliminationBracket = (teams: SeededTeam[]): BracketData => {
  const winners = generateSingleEliminationBracket(teams)
  const size = nextPow2(teams.length)
  const wRounds = Math.log2(size)
  const losersCount = (wRounds - 1) * 2
  let prev = size / 2

  const losers: BracketRound[] = []
  for (let r = 0; r < losersCount; r++) {
    const ct = r % 2 === 1 ? Math.ceil(prev / 2) : prev
    losers.push({
      roundNumber: winners.rounds.length + r,
      label: `Losers Round ${r + 1}`,
      matchups: Array.from({ length: ct }, emptyMatchup),
    })
    prev = ct
  }

  const finals: BracketRound = {
    roundNumber: winners.rounds.length + losersCount,
    label: "Grand Finals",
    matchups: [emptyMatchup()],
  }

  return { type: BracketType.DoubleElimination, rounds: [...winners.rounds, ...losers, finals] }
}

// ─── ROUND ROBIN ────────────────────────────────────────────

export const generateRoundRobinSchedule = (teams: { id: string }[]): BracketData => {
  const ids = teams.map((t) => t.id)
  const parts: (string | null)[] = ids.length % 2 === 1 ? [...ids, null] : [...ids]
  const n = parts.length
  const rounds: BracketRound[] = []

  for (let r = 0; r < n - 1; r++) {
    const matchups: BracketMatchup[] = []
    for (let i = 0; i < n / 2; i++) {
      const home = parts[i]
      const away = parts[n - 1 - i]
      if (home === null || away === null) continue
      matchups.push({ id: mid(), teamAId: home, teamBId: away, winnerId: null, gameId: null })
    }
    rounds.push({ roundNumber: r, label: `Round ${r + 1}`, matchups })
    const last = parts.pop()!
    parts.splice(1, 0, last)
  }

  return { type: BracketType.RoundRobin, rounds }
}

// ─── ADVANCE WINNER ─────────────────────────────────────────

export const advanceWinner = (
  bracket: BracketData, matchupId: string, winnerId: string
): BracketData => {
  const rounds = bracket.rounds.map((r) => ({
    ...r, matchups: r.matchups.map((m) => ({ ...m })),
  }))

  let rIdx = -1
  let mIdx = -1
  for (let r = 0; r < rounds.length; r++) {
    const idx = rounds[r].matchups.findIndex((m) => m.id === matchupId)
    if (idx !== -1) { rIdx = r; mIdx = idx; break }
  }
  if (rIdx === -1) throw new Error(`Matchup ${matchupId} not found in bracket`)

  const matchup = rounds[rIdx].matchups[mIdx]
  if (winnerId !== matchup.teamAId && winnerId !== matchup.teamBId) {
    throw new Error(`Winner ${winnerId} is not a participant in matchup ${matchupId}`)
  }

  matchup.winnerId = winnerId

  const nextR = rIdx + 1
  if (nextR < rounds.length) {
    const next = rounds[nextR].matchups[Math.floor(mIdx / 2)]
    if (next) {
      if (mIdx % 2 === 0) next.teamAId = winnerId
      else next.teamBId = winnerId
    }
  }

  return { type: bracket.type, rounds }
}
