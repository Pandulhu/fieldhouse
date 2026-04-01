import { z } from "zod"
import { Sport, GameStatus, MessageType, ConversationType } from "@fieldhouse/types"

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid()
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
const dateStringSchema = z.string().datetime()

// ─── AUTH / ONBOARDING ────────────────────────────────────────────────────────

export const CreateLeagueSchema = z.object({
  name: z.string().min(2).max(80),
  sportTypes: z.array(z.nativeEnum(Sport)).min(1),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  logoUrl: z.string().url().nullable().optional(),
})

export const InviteCoachSchema = z.object({
  leagueId: uuidSchema,
  teamId: uuidSchema,
  email: z.string().email(),
  displayName: z.string().min(2).max(60),
})

export const CreatePlayerProfileSchema = z.object({
  teamId: uuidSchema,
  displayName: z.string().min(2).max(60),
  jerseyNumber: z.string().max(3).nullable().optional(),
  position: z.string().max(40).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional(),
  parentCoppaConsent: z.boolean().refine(val => val === true, {
    message: "Parental consent is required to create a child profile",
  }),
})

export const UpdatePlayerProfileSchema = CreatePlayerProfileSchema
  .omit({ parentCoppaConsent: true })
  .partial()

// ─── TEAM ─────────────────────────────────────────────────────────────────────

export const CreateTeamSchema = z.object({
  leagueId: uuidSchema,
  name: z.string().min(2).max(80),
  sport: z.nativeEnum(Sport),
  season: z.string().min(4).max(20),
  color: hexColorSchema.nullable().optional(),
  division: z.string().max(40).nullable().optional(),
})

export const AssignCoachSchema = z.object({
  teamId: uuidSchema,
  coachUserId: uuidSchema,
  /** Confirmed by admin after duplicate-name warning was shown */
  duplicateConfirmed: z.boolean().optional().default(false),
})

// ─── GAME / SCHEDULE ──────────────────────────────────────────────────────────

export const CreateGameSchema = z.object({
  teamId: uuidSchema,
  leagueId: uuidSchema,
  opponent: z.string().min(1).max(80),
  location: z.string().max(120).nullable().optional(),
  scheduledAt: dateStringSchema,
})

export const UpdateGameScoreSchema = z.object({
  gameId: uuidSchema,
  scoreHome: z.number().int().min(0),
  scoreAway: z.number().int().min(0),
  status: z.nativeEnum(GameStatus),
})

export const CreateSeasonSchema = z.object({
  leagueId: uuidSchema,
  name: z.string().min(2).max(60),
  sport: z.nativeEnum(Sport),
  startDate: z.string().date(),
  endDate: z.string().date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// ─── STATS ────────────────────────────────────────────────────────────────────

export const StatEntrySchema = z.object({
  playerId: uuidSchema,
  gameId: uuidSchema,
  teamId: uuidSchema,
  season: z.string(),
  sport: z.nativeEnum(Sport),
  stats: z.record(z.string(), z.number()),
})

export const StatExportQuerySchema = z.object({
  playerId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  leagueId: uuidSchema.optional(),
  seasonFilter: z.string().optional(),
  sport: z.nativeEnum(Sport).optional(),
})

// ─── MESSAGING ────────────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  conversationId: uuidSchema,
  content: z.string().min(1).max(2000).trim(),
  type: z.nativeEnum(MessageType),
})

export const CreateConversationSchema = z.object({
  leagueId: uuidSchema,
  type: z.nativeEnum(ConversationType),
  participantIds: z.array(uuidSchema).min(2),
})

// ─── MODERATION ───────────────────────────────────────────────────────────────

export const FlagMessageSchema = z.object({
  messageId: uuidSchema,
  reason: z.string().max(500).nullable().optional(),
})

export const ReviewFlagSchema = z.object({
  flagId: uuidSchema,
  action: z.enum(["approved", "deleted", "escalated"]),
})

// ─── SEASON SIGNUP ────────────────────────────────────────────────────────────

export const SignupFormFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  type: z.enum(["text", "email", "phone", "select", "checkbox"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})

export const CreateSignupFormSchema = z.object({
  leagueId: uuidSchema,
  seasonId: uuidSchema,
  title: z.string().min(2).max(120),
  fields: z.array(SignupFormFieldSchema).min(1),
  externalPaymentUrl: z.string().url().nullable().optional(),
})

export const SubmitSignupFormSchema = z.object({
  formId: uuidSchema,
  data: z.record(z.string(), z.unknown()),
})

// ─── NOTIFICATION PREFS ───────────────────────────────────────────────────────

export const NotificationPrefsSchema = z.object({
  newMessage: z.boolean(),
  newAnnouncement: z.boolean(),
  scheduleChange: z.boolean(),
  gameReminder: z.boolean(),
  flagResolution: z.boolean(),
  seasonSignupOpen: z.boolean(),
})

export type CreateLeagueInput = z.infer<typeof CreateLeagueSchema>
export type InviteCoachInput = z.infer<typeof InviteCoachSchema>
export type CreatePlayerProfileInput = z.infer<typeof CreatePlayerProfileSchema>
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>
export type AssignCoachInput = z.infer<typeof AssignCoachSchema>
export type CreateGameInput = z.infer<typeof CreateGameSchema>
export type UpdateGameScoreInput = z.infer<typeof UpdateGameScoreSchema>
export type StatEntryInput = z.infer<typeof StatEntrySchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type FlagMessageInput = z.infer<typeof FlagMessageSchema>
export type ReviewFlagInput = z.infer<typeof ReviewFlagSchema>
export type CreateSignupFormInput = z.infer<typeof CreateSignupFormSchema>
export type NotificationPrefsInput = z.infer<typeof NotificationPrefsSchema>
