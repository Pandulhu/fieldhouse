# Fieldhouse

**Youth Sports League Platform** — All-in-one team communication, stats, scheduling, and league management. Built as a GroupMe/TeamSnap replacement with child safety guardrails.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Mobile | React Native + Expo SDK 51 (managed workflow) |
| Web | Next.js 14 (App Router) |
| Language | TypeScript (strict mode, no `any`) |
| Auth & DB | Supabase (PostgreSQL + Row Level Security) |
| Real-time | Supabase Realtime (WebSocket channels) |
| Storage | Supabase Storage |
| Push Notifications | Expo Notifications (APNs + FCM) |
| Content Moderation | Google Perspective API |
| State (mobile) | Zustand + React Query + MMKV |
| Navigation (mobile) | Expo Router (file-based) |
| Styling (mobile) | React Native StyleSheet |
| Styling (web) | Tailwind CSS |
| Validation | Zod (shared across all packages) |
| CSV Export | Papa Parse (server-side) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Web Hosting | Vercel |
| Mobile Builds | EAS Build |

---

## Project Structure

```
fieldhouse/
├── apps/
│   ├── mobile/                    # React Native + Expo
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   └── src/
│   │       ├── app/               # Expo Router file-based routes
│   │       │   ├── _layout.tsx    # Root layout — session guard + QueryClient
│   │       │   ├── (auth)/
│   │       │   │   ├── sign-in.tsx
│   │       │   │   └── invite-accept.tsx
│   │       │   └── (app)/
│   │       │       ├── _layout.tsx        # Tab navigator — role-aware
│   │       │       ├── settings.tsx       # Notification prefs + dark mode
│   │       │       ├── (official)/        # League Official screens
│   │       │       ├── (coach)/           # Coach screens
│   │       │       ├── (parent)/          # Parent screens
│   │       │       └── (player)/          # Player screens
│   │       ├── components/
│   │       │   ├── common/        # Button, Card, Avatar, Badge, EmptyState
│   │       │   ├── messaging/     # ConversationList, MessageThread, etc.
│   │       │   ├── stats/         # StatEntryForm, StatsTable, StatCard
│   │       │   └── schedule/      # GameCard, BracketView
│   │       ├── hooks/             # useMessaging, useStats, useSchedule, etc.
│   │       ├── stores/            # Zustand auth store
│   │       └── lib/               # Supabase client
│   │
│   └── web/                       # Next.js 14 admin dashboard
│       └── src/
│           ├── app/
│           │   ├── layout.tsx     # Root layout (Inter font, Tailwind)
│           │   ├── page.tsx       # Public landing page
│           │   ├── admin/         # Authenticated admin panel
│           │   │   ├── page.tsx, teams/, schedule/, brackets/
│           │   │   ├── flags/, signup-forms/, stats/
│           │   │   └── layout.tsx + AdminLayoutShell.tsx
│           │   └── api/           # Route handlers
│           │       ├── auth/callback/
│           │       ├── stats/export/
│           │       ├── flags/review/
│           │       └── signup/submit/
│           ├── components/
│           │   ├── layout/        # AdminSidebar, AdminHeader
│           │   ├── ui/            # DataTable, Modal, StatsBadge
│           │   └── moderation/    # FlagQueue, FlagReviewCard
│           └── lib/               # supabase-browser, supabase-server
│
├── packages/
│   ├── types/src/index.ts         # All shared TypeScript types and enums
│   ├── validators/src/index.ts    # All Zod schemas
│   └── stats-engine/src/          # Stat schemas, calculators, CSV, brackets
│
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   └── 002_rls_policies.sql
    ├── functions/
    │   ├── moderation/index.ts    # Perspective API auto-flag
    │   └── notify/index.ts        # Expo push dispatch
    └── seed/
        └── dev_seed.sql           # Complete dev league for local testing
```

---

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Supabase CLI (`brew install supabase/tap/supabase` or `npx supabase`)
- Expo CLI (comes with `npx expo`)

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_ORG/fieldhouse.git
cd fieldhouse
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
cp supabase/.env.example supabase/.env
# Fill in all values
```

### 3. Start Supabase locally

```bash
supabase start
# Outputs: API URL, anon key, service_role key — copy these to .env files
```

### 4. Run database migrations + seed

```bash
supabase db reset
# This applies 001_initial_schema.sql, 002_rls_policies.sql, and dev_seed.sql
```

Then create the dev users in Supabase Dashboard (Auth > Users > Add User):
- `official@fieldhouse.dev` (UUID: 11111111-...)
- `coach1@fieldhouse.dev` (UUID: 22222222-...)
- `coach2@fieldhouse.dev` (UUID: 33333333-...)
- `parent1@fieldhouse.dev` (UUID: 44444444-...)
- `parent2@fieldhouse.dev` (UUID: 55555555-...)

Password for all: `fieldhouse123`

### 5. Deploy edge functions (local)

```bash
supabase functions serve moderation --env-file supabase/.env
supabase functions serve notify --env-file supabase/.env
```

### 6. Set up database webhooks

In Supabase Dashboard > Database > Webhooks:

| Table | Event | Function URL |
|-------|-------|-------------|
| messages | INSERT | `http://localhost:54321/functions/v1/moderation` |
| notifications | INSERT | `http://localhost:54321/functions/v1/notify` |

### 7. Run dev servers

```bash
# Web admin (localhost:3000)
pnpm dev:web

# Mobile (opens Expo Go)
pnpm dev:mobile

# Both (via Turborepo)
pnpm dev
```

---

## User Roles

```
League Official → Coach → Parent → Player
```

| Role | Auth | Capabilities |
|---|---|---|
| League Official | Full credentials (adult) | Manages all teams, coaches, schedules, flags |
| Coach | Full credentials (adult) | Manages assigned team(s), enters stats, reviews flags |
| Parent | Full credentials (adult) | Sponsors child profile, receives comms |
| Player | Child profile (no login under 13 — COPPA) | Stats tracked, limited messaging |

---

## Messaging Permission Matrix

| Sender → Target | Official | Coach | Parent | Player |
|---|---|---|---|---|
| **Official** | Full | Full | Full | None |
| **Coach** | Full | Full | Full | Note only |
| **Parent** | Note only | Full | None | Full (own child) |
| **Player** | None | Note only | Full (own parent) | Full (teammates) |

Enforced at **both** application layer (TypeScript) and database layer (RLS).

---

## Sports Supported

Baseball, Softball, Soccer, Football, Basketball — each with sport-specific stat schemas and derived stat calculators.

---

## Build & Deploy

### Web (Vercel)

Connect the repo to Vercel. It auto-detects the Next.js app in `apps/web`. Set environment variables in the Vercel dashboard.

### Mobile (EAS)

```bash
cd apps/mobile

# Update EAS project ID in app.config.ts
eas build --profile preview --platform all   # TestFlight + internal Android
eas build --profile production --platform all # App Store + Google Play
```

### Edge Functions (Production)

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy moderation
supabase functions deploy notify
supabase secrets set PERSPECTIVE_API_KEY=your-key MODERATION_THRESHOLD=0.7
```

---

## Content Moderation

1. Every message INSERT triggers the `moderation` edge function
2. Google Perspective API evaluates: TOXICITY, SEVERE_TOXICITY, INSULT, THREAT, PROFANITY
3. Score >= threshold (default 0.7): message hidden + flag created automatically
4. Users can also manually flag messages
5. Coaches review flags for their team; Officials review all flags
6. Actions: Approve (restore), Delete (permanent), Escalate (coach → official)
7. Perspective API unavailability = graceful fallback (no crash)

---

## Pre-Launch Checklist

- [ ] Supabase project created + migrations applied
- [ ] Auth flow working (sign in, invite accept, role assignment)
- [ ] League creation + team setup
- [ ] Coach assignment (with duplicate name warning)
- [ ] Parent invite + child profile creation (COPPA consent)
- [ ] Team messaging (real-time, permission matrix enforced)
- [ ] League announcements
- [ ] Stat entry for all 5 sports
- [ ] Schedule + bracket display
- [ ] CSV stat export (player/team/league scope)
- [ ] Push notifications (per-type toggles)
- [ ] Content moderation (auto + manual flagging)
- [ ] Flag review queue (coach + official)
- [ ] Season signup forms
- [ ] Mobile builds (iOS + Android)
- [ ] Web admin panel deployed
- [ ] Privacy Policy (COPPA-compliant)
- [ ] Terms of Service
- [ ] Perspective API key provisioned
