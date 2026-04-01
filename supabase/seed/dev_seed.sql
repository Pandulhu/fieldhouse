-- ============================================================
-- Fieldhouse — Dev Seed Data
-- supabase/seed/dev_seed.sql
--
-- Creates a fully usable local dev environment with fixed UUIDs
-- for predictability. Idempotent — safe to re-run.
-- ============================================================

-- ─── AUTH USERS NOTE ───────────────────────────────────────
-- NOTE: In local dev, create these users via Supabase Dashboard or supabase auth admin commands.
-- The seed below populates the public.users table assuming auth.users already exist.
--
-- Expected auth.users:
--   official@fieldhouse.dev  → 11111111-1111-1111-1111-111111111111
--   coach1@fieldhouse.dev    → 22222222-2222-2222-2222-222222222222
--   coach2@fieldhouse.dev    → 33333333-3333-3333-3333-333333333333
--   parent1@fieldhouse.dev   → 44444444-4444-4444-4444-444444444444
--   parent2@fieldhouse.dev   → 55555555-5555-5555-5555-555555555555
--
-- To create them locally, run these in the Supabase SQL Editor or via CLI:
--   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
--   VALUES
--     ('11111111-1111-1111-1111-111111111111', 'official@fieldhouse.dev', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"League Official"}', now(), now()),
--     ('22222222-2222-2222-2222-222222222222', 'coach1@fieldhouse.dev',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Martinez"}', now(), now()),
--     ('33333333-3333-3333-3333-333333333333', 'coach2@fieldhouse.dev',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Coach Williams"}', now(), now()),
--     ('44444444-4444-4444-4444-444444444444', 'parent1@fieldhouse.dev',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sarah Johnson"}', now(), now()),
--     ('55555555-5555-5555-5555-555555555555', 'parent2@fieldhouse.dev',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Mike Thompson"}', now(), now())
--   ON CONFLICT (id) DO NOTHING;
-- ============================================================

-- Fixed UUIDs for all entities
-- League:       aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Teams:        bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01 through bb04
-- Seasons:      cccccccc-cccc-cccc-cccc-cccccccccc01, cc02
-- Players:      dddddddd-dddd-dddd-dddd-dddddddddd01 through dd06
-- Games:        eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01 through ee08
-- Conversations: ffffffff-ffff-ffff-ffff-ffffffffffff01, ff02
-- Messages:     00000000-0000-0000-0000-000000000m01 through 0m05
-- Flag:         00000000-0000-0000-0000-00000000f001
-- Notifications: 00000000-0000-0000-0000-00000000n001, n002
-- Signup form:  00000000-0000-0000-0000-00000000s001
-- Form subs:    00000000-0000-0000-0000-0000000sub01, sub02


-- ─── 1. LEAGUE ─────────────────────────────────────────────
-- "Riverside Youth Sports League" offering baseball + soccer

INSERT INTO leagues (id, name, sport_types, owner_id, primary_color, secondary_color)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Riverside Youth Sports League',
  ARRAY['baseball', 'soccer']::sport_type[],
  '11111111-1111-1111-1111-111111111111',
  '#1E3A5F',
  '#2E75B6'
) ON CONFLICT (id) DO NOTHING;


-- ─── 2. USERS ──────────────────────────────────────────────
-- Public users table entries for each role

INSERT INTO profiles (id, display_name, role, league_id, email, team_ids) VALUES
  ('11111111-1111-1111-1111-111111111111', 'League Official', 'league_official',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'official@fieldhouse.dev', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'Coach Martinez', 'coach',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'coach1@fieldhouse.dev',
   ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02']::uuid[]),
  ('33333333-3333-3333-3333-333333333333', 'Coach Williams', 'coach',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'coach2@fieldhouse.dev',
   ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04']::uuid[]),
  ('44444444-4444-4444-4444-444444444444', 'Sarah Johnson', 'parent',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'parent1@fieldhouse.dev',
   ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03']::uuid[]),
  ('55555555-5555-5555-5555-555555555555', 'Mike Thompson', 'parent',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'parent2@fieldhouse.dev',
   ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04']::uuid[])
ON CONFLICT (id) DO NOTHING;


-- ─── 3. SEASONS ────────────────────────────────────────────
-- One season per sport

INSERT INTO seasons (id, league_id, name, sport, start_date, end_date, active) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Spring 2025 Baseball', 'baseball', '2025-03-01', '2025-06-30', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Spring 2025 Soccer', 'soccer', '2025-03-01', '2025-06-30', true)
ON CONFLICT (id) DO NOTHING;


-- ─── 4. TEAMS ──────────────────────────────────────────────
-- 2 baseball teams, 2 soccer teams

INSERT INTO teams (id, league_id, name, sport, season, coach_ids, color, division) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Tigers', 'baseball', 'Spring 2025 Baseball',
   ARRAY['22222222-2222-2222-2222-222222222222']::uuid[],
   '#FF6600', '10U'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Eagles', 'baseball', 'Spring 2025 Baseball',
   ARRAY['22222222-2222-2222-2222-222222222222']::uuid[],
   '#003366', '10U'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Strikers', 'soccer', 'Spring 2025 Soccer',
   ARRAY['33333333-3333-3333-3333-333333333333']::uuid[],
   '#228B22', 'U12'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Lightning', 'soccer', 'Spring 2025 Soccer',
   ARRAY['33333333-3333-3333-3333-333333333333']::uuid[],
   '#FFD700', 'U12')
ON CONFLICT (id) DO NOTHING;


-- ─── 5. PLAYERS ────────────────────────────────────────────
-- 6 players across teams, linked to parents

INSERT INTO players (id, parent_user_id, team_id, display_name, jersey_number, position, date_of_birth) VALUES
  -- Tigers (baseball) — Parent 1's kids
  ('dddddddd-dddd-dddd-dddd-dddddddddd01',
   '44444444-4444-4444-4444-444444444444',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'Jake Johnson', '7', 'Shortstop', '2015-04-12'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02',
   '44444444-4444-4444-4444-444444444444',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'Emily Johnson', '12', 'Outfield', '2016-09-03'),

  -- Eagles (baseball) — Parent 2's kid
  ('dddddddd-dddd-dddd-dddd-dddddddddd03',
   '55555555-5555-5555-5555-555555555555',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'Tyler Thompson', '3', 'Pitcher', '2015-01-22'),

  -- Strikers (soccer) — Parent 1's kid
  ('dddddddd-dddd-dddd-dddd-dddddddddd04',
   '44444444-4444-4444-4444-444444444444',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   'Mia Johnson', '10', 'Forward', '2013-07-15'),

  -- Lightning (soccer) — Parent 2's kids
  ('dddddddd-dddd-dddd-dddd-dddddddddd05',
   '55555555-5555-5555-5555-555555555555',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'Ryan Thompson', '5', 'Midfielder', '2013-11-08'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd06',
   '55555555-5555-5555-5555-555555555555',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'Ava Thompson', '9', 'Defender', '2014-03-21')
ON CONFLICT (id) DO NOTHING;


-- ─── 6. GAMES ──────────────────────────────────────────────
-- 8 games: 2 per team, mix of scheduled/final/in_progress

INSERT INTO games (id, team_id, league_id, opponent, location, scheduled_at, score_home, score_away, status, created_by) VALUES
  -- Tigers games (baseball)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Eagles', 'Riverside Field 1', '2025-04-05 10:00:00-04', 5, 3, 'final',
   '22222222-2222-2222-2222-222222222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Hawks', 'Central Park Diamond', '2025-04-19 14:00:00-04', NULL, NULL, 'scheduled',
   '22222222-2222-2222-2222-222222222222'),

  -- Eagles games (baseball)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Tigers', 'Riverside Field 1', '2025-04-05 10:00:00-04', 3, 5, 'final',
   '22222222-2222-2222-2222-222222222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Wolves', 'East Side Park', '2025-04-26 10:00:00-04', 2, 2, 'in_progress',
   '22222222-2222-2222-2222-222222222222'),

  -- Strikers games (soccer)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Lightning', 'Soccer Complex A', '2025-04-06 09:00:00-04', 2, 1, 'final',
   '33333333-3333-3333-3333-333333333333'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Panthers', 'Riverside Soccer Pitch', '2025-04-20 11:00:00-04', NULL, NULL, 'scheduled',
   '33333333-3333-3333-3333-333333333333'),

  -- Lightning games (soccer)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Strikers', 'Soccer Complex A', '2025-04-06 09:00:00-04', 1, 2, 'final',
   '33333333-3333-3333-3333-333333333333'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Cyclones', 'North Field', '2025-04-27 13:00:00-04', 1, 0, 'in_progress',
   '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;


-- ─── 7. PLAYER STATS ──────────────────────────────────────
-- Stats for completed games
-- Baseball: ab (at-bats), h (hits), hr (home runs), rbi
-- Soccer: goals, assists, shots

-- Jake Johnson — Tigers vs Eagles (final, game ee01)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'ab', 4, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'h', 2, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'hr', 1, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'rbi', 3, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;

-- Emily Johnson — Tigers vs Eagles (final, game ee01)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'ab', 3, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'h', 1, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'hr', 0, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Spring 2025 Baseball', 'baseball', 'rbi', 1, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;

-- Tyler Thompson — Eagles vs Tigers (final, game ee03)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'Spring 2025 Baseball', 'baseball', 'ab', 3, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'Spring 2025 Baseball', 'baseball', 'h', 1, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'Spring 2025 Baseball', 'baseball', 'hr', 0, '22222222-2222-2222-2222-222222222222'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'Spring 2025 Baseball', 'baseball', 'rbi', 2, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;

-- Mia Johnson — Strikers vs Lightning (final, game ee05)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 'Spring 2025 Soccer', 'soccer', 'goals', 1, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 'Spring 2025 Soccer', 'soccer', 'assists', 1, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 'Spring 2025 Soccer', 'soccer', 'shots', 4, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;

-- Ryan Thompson — Lightning vs Strikers (final, game ee07)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'goals', 1, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'assists', 0, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'shots', 3, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;

-- Ava Thompson — Lightning vs Strikers (final, game ee07)
INSERT INTO player_stats (id, player_id, team_id, game_id, season, sport, stat_key, stat_value, entered_by) VALUES
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'goals', 0, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'assists', 1, '33333333-3333-3333-3333-333333333333'),
  (uuid_generate_v4(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'Spring 2025 Soccer', 'soccer', 'shots', 1, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (player_id, game_id, stat_key) DO NOTHING;


-- ─── 8. CONVERSATIONS ─────────────────────────────────────
-- 1 team chat for Tigers, 1 league announcement channel

INSERT INTO conversations (id, league_id, type, participant_ids) VALUES
  -- Tigers team chat (coach + both parents with kids on Tigers)
  ('ffffffff-ffff-ffff-ffff-ffffffffffff',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'team',
   ARRAY[
     '22222222-2222-2222-2222-222222222222',
     '44444444-4444-4444-4444-444444444444',
     '55555555-5555-5555-5555-555555555555'
   ]::uuid[]),
  -- League announcement channel (official + all members)
  ('ffffffff-ffff-ffff-ffff-fffffffffff2',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'league_announcement',
   ARRAY[
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     '33333333-3333-3333-3333-333333333333',
     '44444444-4444-4444-4444-444444444444',
     '55555555-5555-5555-5555-555555555555'
   ]::uuid[])
ON CONFLICT (id) DO NOTHING;


-- ─── 9. MESSAGES ───────────────────────────────────────────
-- 5 messages in the Tigers team chat (mix of types)

INSERT INTO messages (id, conversation_id, sender_id, content, type, flagged, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '22222222-2222-2222-2222-222222222222',
   'Welcome to the Tigers team chat! Looking forward to a great season.',
   'announcement', false, '2025-03-15 08:00:00-04'),

  ('00000000-0000-0000-0000-0000000000a2',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '44444444-4444-4444-4444-444444444444',
   'Thanks Coach! Jake and Emily are so excited. What time should we arrive for the first game?',
   'chat', false, '2025-03-15 09:30:00-04'),

  ('00000000-0000-0000-0000-0000000000a3',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '22222222-2222-2222-2222-222222222222',
   'Please arrive 30 minutes before game time for warmups. Bring water and sunscreen!',
   'chat', false, '2025-03-15 10:00:00-04'),

  ('00000000-0000-0000-0000-0000000000a4',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '55555555-5555-5555-5555-555555555555',
   'Sounds good. Will Tyler need any special gear for the first practice?',
   'chat', false, '2025-03-15 11:15:00-04'),

  -- This message will be auto-flagged (see flags section below)
  ('00000000-0000-0000-0000-0000000000a5',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   '44444444-4444-4444-4444-444444444444',
   'That umpire was absolutely terrible and blind! Worst calls I have ever seen!',
   'chat', true, '2025-04-05 16:30:00-04')
ON CONFLICT (id) DO NOTHING;


-- ─── 10. FLAGS ─────────────────────────────────────────────
-- 1 auto-flagged message (the umpire complaint)

INSERT INTO flags (id, message_id, flagged_by, reason, auto_flagged, perspective_score, action) VALUES
  ('00000000-0000-0000-0000-00000000f001',
   '00000000-0000-0000-0000-0000000000a5',
   NULL,
   'Potential toxicity detected by automated moderation',
   true,
   0.78,
   'pending')
ON CONFLICT (id) DO NOTHING;


-- ─── 11. NOTIFICATIONS ────────────────────────────────────
-- 1 game reminder, 1 new announcement notification

INSERT INTO notifications (id, user_id, type, title, body, read, data) VALUES
  ('00000000-0000-0000-0000-00000000b001',
   '44444444-4444-4444-4444-444444444444',
   'game_reminder',
   'Game Tomorrow!',
   'Tigers vs Hawks at Central Park Diamond — April 19 at 2:00 PM',
   false,
   '{"game_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02", "team_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01"}'),
  ('00000000-0000-0000-0000-00000000b002',
   '22222222-2222-2222-2222-222222222222',
   'new_announcement',
   'New League Announcement',
   'Spring schedules have been posted. Check the schedule page for details.',
   false,
   '{"conversation_id": "ffffffff-ffff-ffff-ffff-fffffffffff2"}')
ON CONFLICT (id) DO NOTHING;


-- ─── 12. SIGNUP FORMS ─────────────────────────────────────
-- 1 signup form for the baseball season

INSERT INTO signup_forms (id, league_id, season_id, title, fields, external_payment_url, active) VALUES
  ('00000000-0000-0000-0000-00000000c001',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'cccccccc-cccc-cccc-cccc-cccccccccc01',
   'Spring 2025 Baseball Registration',
   '[
     {"name": "player_name", "label": "Player Full Name", "type": "text", "required": true},
     {"name": "date_of_birth", "label": "Date of Birth", "type": "date", "required": true},
     {"name": "parent_email", "label": "Parent/Guardian Email", "type": "email", "required": true},
     {"name": "parent_phone", "label": "Parent/Guardian Phone", "type": "tel", "required": true},
     {"name": "previous_experience", "label": "Previous Experience", "type": "select", "options": ["None", "1-2 years", "3+ years"], "required": false},
     {"name": "medical_notes", "label": "Medical Notes / Allergies", "type": "textarea", "required": false}
   ]'::jsonb,
   'https://example.com/pay/spring-baseball-2025',
   true)
ON CONFLICT (id) DO NOTHING;


-- ─── 13. FORM SUBMISSIONS ─────────────────────────────────
-- 2 submissions to the baseball signup form

INSERT INTO form_submissions (id, form_id, submitted_by, data) VALUES
  ('00000000-0000-0000-0000-00000000d001',
   '00000000-0000-0000-0000-00000000c001',
   '44444444-4444-4444-4444-444444444444',
   '{
     "player_name": "Jake Johnson",
     "date_of_birth": "2015-04-12",
     "parent_email": "parent1@fieldhouse.dev",
     "parent_phone": "555-0101",
     "previous_experience": "1-2 years",
     "medical_notes": ""
   }'::jsonb),
  ('00000000-0000-0000-0000-00000000d002',
   '00000000-0000-0000-0000-00000000c001',
   '55555555-5555-5555-5555-555555555555',
   '{
     "player_name": "Tyler Thompson",
     "date_of_birth": "2015-01-22",
     "parent_email": "parent2@fieldhouse.dev",
     "parent_phone": "555-0202",
     "previous_experience": "3+ years",
     "medical_notes": "Peanut allergy"
   }'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Seed complete!
--
-- Summary:
--   1 league, 5 users (1 official, 2 coaches, 2 parents)
--   4 teams (2 baseball, 2 soccer), 2 seasons
--   6 players across 4 teams
--   8 games (3 final, 2 in_progress, 3 scheduled)
--   Player stats for all completed games
--   2 conversations (team chat + league announcements)
--   5 messages with 1 auto-flagged
--   2 notifications
--   1 signup form with 2 submissions
-- ============================================================
