-- ============================================================
-- Fieldhouse — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────

create type user_role as enum (
  'league_official', 'coach', 'parent', 'player'
);

create type sport_type as enum (
  'baseball', 'softball', 'soccer', 'football', 'basketball'
);

create type game_status as enum (
  'scheduled', 'in_progress', 'final', 'cancelled', 'postponed'
);

create type message_type as enum (
  'chat', 'note', 'announcement'
);

create type conversation_type as enum (
  'team', 'direct', 'league_announcement', 'coach_channel'
);

create type flag_action as enum (
  'pending', 'approved', 'deleted', 'escalated'
);

create type bracket_type as enum (
  'single_elimination', 'double_elimination', 'round_robin'
);

create type notification_type as enum (
  'new_message', 'new_announcement', 'schedule_change',
  'game_reminder', 'flag_resolution', 'season_signup_open'
);

-- ─── LEAGUES ────────────────────────────────────────────────

create table leagues (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  sport_types     sport_type[] not null,
  license_key     text unique not null default encode(gen_random_bytes(16), 'hex'),
  owner_id        uuid not null references auth.users(id),
  logo_url        text,
  primary_color   text not null default '#1E3A5F',
  secondary_color text not null default '#2E75B6',
  created_at      timestamptz not null default now()
);

alter table leagues enable row level security;

-- ─── USERS ──────────────────────────────────────────────────

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  role            user_role not null,
  league_id       uuid not null references leagues(id) on delete cascade,
  team_ids        uuid[] not null default '{}',
  email           text,
  phone           text,
  avatar_url      text,
  is_minor        boolean not null default false,
  coppa_verified  boolean not null default false,
  coppa_verified_at timestamptz,
  notification_prefs jsonb not null default '{
    "newMessage": true,
    "newAnnouncement": true,
    "scheduleChange": true,
    "gameReminder": true,
    "flagResolution": true,
    "seasonSignupOpen": true
  }',
  push_token      text,
  created_at      timestamptz not null default now()
);

alter table profiles enable row level security;

-- ─── TEAMS ──────────────────────────────────────────────────

create table teams (
  id          uuid primary key default uuid_generate_v4(),
  league_id   uuid not null references leagues(id) on delete cascade,
  name        text not null,
  sport       sport_type not null,
  season      text not null,
  coach_ids   uuid[] not null default '{}',
  color       text,
  logo_url    text,
  division    text,
  created_at  timestamptz not null default now()
);

alter table teams enable row level security;

-- ─── PLAYERS ────────────────────────────────────────────────

create table players (
  id              uuid primary key default uuid_generate_v4(),
  parent_user_id  uuid not null references users(id) on delete cascade,
  team_id         uuid not null references teams(id) on delete cascade,
  display_name    text not null,
  jersey_number   text,
  position        text,
  date_of_birth   date,
  photo_url       text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table players enable row level security;

-- ─── SEASONS ────────────────────────────────────────────────

create table seasons (
  id          uuid primary key default uuid_generate_v4(),
  league_id   uuid not null references leagues(id) on delete cascade,
  name        text not null,
  sport       sport_type not null,
  start_date  date not null,
  end_date    date not null,
  active      boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint end_after_start check (end_date > start_date)
);

alter table seasons enable row level security;

-- ─── GAMES ──────────────────────────────────────────────────

create table games (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references teams(id) on delete cascade,
  league_id     uuid not null references leagues(id) on delete cascade,
  opponent      text not null,
  location      text,
  scheduled_at  timestamptz not null,
  score_home    integer,
  score_away    integer,
  status        game_status not null default 'scheduled',
  created_by    uuid not null references users(id),
  created_at    timestamptz not null default now()
);

alter table games enable row level security;

-- ─── PLAYER STATS ────────────────────────────────────────────

create table player_stats (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references players(id) on delete cascade,
  team_id     uuid not null references teams(id),
  game_id     uuid references games(id),
  season      text not null,
  sport       sport_type not null,
  stat_key    text not null,
  stat_value  numeric not null,
  entered_by  uuid not null references users(id),
  created_at  timestamptz not null default now(),
  unique (player_id, game_id, stat_key)
);

alter table player_stats enable row level security;

-- ─── CONVERSATIONS ───────────────────────────────────────────

create table conversations (
  id              uuid primary key default uuid_generate_v4(),
  league_id       uuid not null references leagues(id) on delete cascade,
  type            conversation_type not null,
  participant_ids uuid[] not null,
  created_at      timestamptz not null default now()
);

alter table conversations enable row level security;

-- ─── MESSAGES ────────────────────────────────────────────────

create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references users(id),
  content         text not null,
  type            message_type not null default 'chat',
  hidden          boolean not null default false,
  flagged         boolean not null default false,
  reviewed        boolean not null default false,
  deleted         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table messages enable row level security;

-- ─── FLAGS ───────────────────────────────────────────────────

create table flags (
  id                  uuid primary key default uuid_generate_v4(),
  message_id          uuid not null references messages(id) on delete cascade,
  flagged_by          uuid references users(id),   -- null = auto-flagged
  reason              text,
  auto_flagged        boolean not null default false,
  perspective_score   numeric,
  reviewed_by         uuid references users(id),
  action              flag_action not null default 'pending',
  created_at          timestamptz not null default now()
);

alter table flags enable row level security;

-- ─── SCHEDULES / BRACKETS ────────────────────────────────────

create table schedules (
  id            uuid primary key default uuid_generate_v4(),
  league_id     uuid not null references leagues(id) on delete cascade,
  season_id     uuid not null references seasons(id) on delete cascade,
  game_ids      uuid[] not null default '{}',
  bracket_type  bracket_type,
  bracket_data  jsonb,
  created_at    timestamptz not null default now()
);

alter table schedules enable row level security;

-- ─── NOTIFICATIONS ───────────────────────────────────────────

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text not null,
  read        boolean not null default false,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

-- ─── SIGNUP FORMS ────────────────────────────────────────────

create table signup_forms (
  id                    uuid primary key default uuid_generate_v4(),
  league_id             uuid not null references leagues(id) on delete cascade,
  season_id             uuid not null references seasons(id) on delete cascade,
  title                 text not null,
  fields                jsonb not null default '[]',
  external_payment_url  text,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table signup_forms enable row level security;

-- ─── FORM SUBMISSIONS ────────────────────────────────────────

create table form_submissions (
  id            uuid primary key default uuid_generate_v4(),
  form_id       uuid not null references signup_forms(id) on delete cascade,
  submitted_by  uuid references users(id),   -- nullable for unauthenticated public signup
  data          jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

alter table form_submissions enable row level security;

-- ─── INDEXES ─────────────────────────────────────────────────

create index idx_profiles_league       on profiles(league_id);
create index idx_teams_league       on teams(league_id);
create index idx_players_team       on players(team_id);
create index idx_players_parent     on players(parent_user_id);
create index idx_games_team         on games(team_id);
create index idx_games_league       on games(league_id);
create index idx_player_stats_player on player_stats(player_id);
create index idx_player_stats_game  on player_stats(game_id);
create index idx_messages_convo     on messages(conversation_id);
create index idx_messages_sender    on messages(sender_id);
create index idx_flags_message      on flags(message_id);
create index idx_notifications_user on notifications(user_id, read);
create index idx_form_submissions_form on form_submissions(form_id);
