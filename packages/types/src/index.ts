// ─── ENUMS ───────────────────────────────────────────────────────────────────

export enum UserRole {
  LeagueOfficial = "league_official",
  Coach = "coach",
  Parent = "parent",
  Player = "player",
}

export enum Sport {
  Baseball = "baseball",
  Softball = "softball",
  Soccer = "soccer",
  Football = "football",
  Basketball = "basketball",
}

export enum GameStatus {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Final = "final",
  Cancelled = "cancelled",
  Postponed = "postponed",
}

export enum MessageType {
  Chat = "chat",
  Note = "note",
  Announcement = "announcement",
}

export enum ConversationType {
  Team = "team",
  Direct = "direct",
  LeagueAnnouncement = "league_announcement",
  CoachChannel = "coach_channel",
}

export enum FlagAction {
  Approved = "approved",
  Deleted = "deleted",
  Escalated = "escalated",
  Pending = "pending",
}

export enum BracketType {
  SingleElimination = "single_elimination",
  DoubleElimination = "double_elimination",
  RoundRobin = "round_robin",
}

export enum NotificationType {
  NewMessage = "new_message",
  NewAnnouncement = "new_announcement",
  ScheduleChange = "schedule_change",
  GameReminder = "game_reminder",
  FlagResolution = "flag_resolution",
  SeasonSignupOpen = "season_signup_open",
}

// ─── CORE ENTITIES ────────────────────────────────────────────────────────────

export interface League {
  id: string
  name: string
  sportTypes: Sport[]
  licenseKey: string
  ownerId: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  createdAt: string
}

export interface User {
  id: string
  displayName: string
  role: UserRole
  leagueId: string
  teamIds: string[]
  email: string
  phone: string | null
  avatarUrl: string | null
  isMinor: boolean
  coppaVerified: boolean
  coppaVerifiedAt: string | null
  createdAt: string
}

export interface Team {
  id: string
  leagueId: string
  name: string
  sport: Sport
  season: string
  coachIds: string[]
  color: string | null
  logoUrl: string | null
  division: string | null
  createdAt: string
}

export interface Player {
  id: string
  /** References the sponsoring parent's user.id — NOT a player auth account */
  parentUserId: string
  teamId: string
  displayName: string
  jerseyNumber: string | null
  position: string | null
  dateOfBirth: string | null
  photoUrl: string | null
  active: boolean
  createdAt: string
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export interface PlayerStatRow {
  id: string
  playerId: string
  teamId: string
  gameId: string
  season: string
  sport: Sport
  statKey: string
  statValue: number
  enteredBy: string
  createdAt: string
}

export interface DerivedStats {
  [key: string]: number | null
}

export interface PlayerStatsAggregate {
  player: Player
  season: string
  sport: Sport
  raw: Record<string, number>
  derived: DerivedStats
}

// ─── GAMES & SCHEDULE ─────────────────────────────────────────────────────────

export interface Game {
  id: string
  teamId: string
  leagueId: string
  opponent: string
  location: string | null
  scheduledAt: string
  scoreHome: number | null
  scoreAway: number | null
  status: GameStatus
  createdBy: string
  createdAt: string
}

export interface Season {
  id: string
  leagueId: string
  name: string
  sport: Sport
  startDate: string
  endDate: string
  active: boolean
}

export interface BracketData {
  type: BracketType
  rounds: BracketRound[]
}

export interface BracketRound {
  roundNumber: number
  label: string
  matchups: BracketMatchup[]
}

export interface BracketMatchup {
  id: string
  teamAId: string | null
  teamBId: string | null
  winnerId: string | null
  gameId: string | null
}

export interface Schedule {
  id: string
  leagueId: string
  seasonId: string
  gameIds: string[]
  bracketType: BracketType | null
  bracketData: BracketData | null
}

// ─── MESSAGING ────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  leagueId: string
  type: ConversationType
  participantIds: string[]
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: MessageType
  hidden: boolean
  flagged: boolean
  reviewed: boolean
  createdAt: string
}

// ─── MODERATION ───────────────────────────────────────────────────────────────

export interface Flag {
  id: string
  messageId: string
  flaggedBy: string | null  // null = auto-flagged
  reason: string | null
  autoFlagged: boolean
  perspectiveScore: number | null
  reviewedBy: string | null
  action: FlagAction
  createdAt: string
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  data: Record<string, unknown>
  createdAt: string
}

// ─── SEASON SIGNUP ────────────────────────────────────────────────────────────

export interface SignupFormField {
  id: string
  label: string
  type: "text" | "email" | "phone" | "select" | "checkbox"
  required: boolean
  options?: string[]  // for select fields
}

export interface SignupForm {
  id: string
  leagueId: string
  seasonId: string
  title: string
  fields: SignupFormField[]
  externalPaymentUrl: string | null
  active: boolean
  createdAt: string
}

export interface FormSubmission {
  id: string
  formId: string
  submittedBy: string
  data: Record<string, unknown>
  createdAt: string
}

// ─── MESSAGING PERMISSION MATRIX ─────────────────────────────────────────────
// Used by application layer to enforce messaging rules before DB write

export type MessagePermission = "full" | "note_only" | "none"

export interface MessagingPermissions {
  canMessage: MessagePermission
  canSeeNotes: boolean
}

/**
 * Resolves whether senderRole can message a user of targetRole.
 * Returns "full" | "note_only" | "none"
 */
export const resolveMessagingPermission = (
  senderRole: UserRole,
  targetRole: UserRole
): MessagePermission => {
  const matrix: Record<UserRole, Record<UserRole, MessagePermission>> = {
    [UserRole.LeagueOfficial]: {
      [UserRole.LeagueOfficial]: "full",
      [UserRole.Coach]: "full",
      [UserRole.Parent]: "full",
      [UserRole.Player]: "none",
    },
    [UserRole.Coach]: {
      [UserRole.LeagueOfficial]: "full",
      [UserRole.Coach]: "full",
      [UserRole.Parent]: "full",
      [UserRole.Player]: "note_only",
    },
    [UserRole.Parent]: {
      [UserRole.LeagueOfficial]: "note_only",
      [UserRole.Coach]: "full",
      [UserRole.Parent]: "none",
      [UserRole.Player]: "full",
    },
    [UserRole.Player]: {
      [UserRole.LeagueOfficial]: "none",
      [UserRole.Coach]: "note_only",
      [UserRole.Parent]: "full",
      [UserRole.Player]: "full",
    },
  }
  return matrix[senderRole][targetRole]
}
