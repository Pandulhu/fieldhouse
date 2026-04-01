-- ============================================================
-- Fieldhouse — Row Level Security Policies
-- 002_rls_policies.sql
-- ============================================================

-- ─── HELPER FUNCTIONS ────────────────────────────────────────

-- Returns the current user's role within their league
create or replace function current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Returns the current user's league_id
create or replace function current_league_id()
returns uuid as $$
  select league_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Checks if the current user is a league official
create or replace function is_league_official()
returns boolean as $$
  select current_user_role() = 'league_official'
$$ language sql security definer stable;

-- Checks if the current user is a coach
create or replace function is_coach()
returns boolean as $$
  select current_user_role() in ('coach', 'league_official')
$$ language sql security definer stable;

-- ─── LEAGUES ─────────────────────────────────────────────────

create policy "League members can view their own league"
  on leagues for select
  using (id = current_league_id());

create policy "League officials can update their league"
  on leagues for update
  using (owner_id = auth.uid());

-- ─── USERS ───────────────────────────────────────────────────

create policy "Users can view members of their league"
  on profiles for select
  using (league_id = current_league_id());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "League officials can manage users in their league"
  on profiles for all
  using (is_league_official() and league_id = current_league_id());

-- ─── TEAMS ───────────────────────────────────────────────────

create policy "League members can view teams in their league"
  on teams for select
  using (league_id = current_league_id());

create policy "League officials can manage teams"
  on teams for all
  using (is_league_official() and league_id = current_league_id());

create policy "Coaches can update their assigned teams"
  on teams for update
  using (
    current_user_role() = 'coach'
    and auth.uid() = any(coach_ids)
    and league_id = current_league_id()
  );

-- ─── PLAYERS ─────────────────────────────────────────────────

create policy "Team members can view players on their teams"
  on players for select
  using (
    exists (
      select 1 from teams t
      where t.id = players.team_id
        and t.league_id = current_league_id()
        and (
          is_league_official()
          or auth.uid() = any(t.coach_ids)
          or auth.uid() = players.parent_user_id
        )
    )
  );

create policy "Parents can manage their child profiles"
  on players for all
  using (parent_user_id = auth.uid());

create policy "Coaches can view and update players on their teams"
  on players for update
  using (
    exists (
      select 1 from teams t
      where t.id = players.team_id
        and auth.uid() = any(t.coach_ids)
    )
  );

create policy "League officials can manage all players in league"
  on players for all
  using (
    is_league_official()
    and exists (
      select 1 from teams t
      where t.id = players.team_id and t.league_id = current_league_id()
    )
  );

-- ─── PLAYER STATS ────────────────────────────────────────────

create policy "Team members can view stats in their league"
  on player_stats for select
  using (
    exists (
      select 1 from teams t
      where t.id = player_stats.team_id
        and t.league_id = current_league_id()
    )
  );

create policy "Coaches and officials can insert stats"
  on player_stats for insert
  with check (
    is_coach()
    and exists (
      select 1 from teams t
      where t.id = player_stats.team_id
        and t.league_id = current_league_id()
    )
  );

create policy "Coaches and officials can update stats they entered"
  on player_stats for update
  using (entered_by = auth.uid() and is_coach());

-- ─── CONVERSATIONS ───────────────────────────────────────────

create policy "Participants can view their conversations"
  on conversations for select
  using (
    auth.uid() = any(participant_ids)
    and league_id = current_league_id()
  );

-- Officials can see all conversations except direct messages
create policy "Officials can view non-direct conversations"
  on conversations for select
  using (
    is_league_official()
    and league_id = current_league_id()
    and type != 'direct'
  );

-- ─── MESSAGES ────────────────────────────────────────────────

create policy "Participants can view non-hidden messages"
  on messages for select
  using (
    hidden = false
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and auth.uid() = any(c.participant_ids)
    )
  );

create policy "Officials can view all non-hidden messages in league"
  on messages for select
  using (
    is_league_official()
    and hidden = false
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and c.league_id = current_league_id()
        and c.type != 'direct'
    )
  );

create policy "Participants can insert messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and auth.uid() = any(c.participant_ids)
    )
  );

-- ─── FLAGS ───────────────────────────────────────────────────

create policy "Coaches can view flags on their team messages"
  on flags for select
  using (
    is_coach()
    and exists (
      select 1 from messages m
        join conversations c on c.id = m.conversation_id
        join teams t on t.league_id = c.league_id
      where m.id = flags.message_id
        and auth.uid() = any(t.coach_ids)
    )
  );

create policy "Officials can view all flags in their league"
  on flags for select
  using (
    is_league_official()
    and exists (
      select 1 from messages m
        join conversations c on c.id = m.conversation_id
      where m.id = flags.message_id
        and c.league_id = current_league_id()
    )
  );

create policy "Anyone can create a flag"
  on flags for insert
  with check (flagged_by = auth.uid());

create policy "Coaches and officials can update flags"
  on flags for update
  using (is_coach());

-- ─── NOTIFICATIONS ───────────────────────────────────────────

create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can mark their notifications read"
  on notifications for update
  using (user_id = auth.uid());

-- ─── SIGNUP FORMS ────────────────────────────────────────────

create policy "Anyone in league can view active signup forms"
  on signup_forms for select
  using (league_id = current_league_id() and active = true);

create policy "Officials can manage signup forms"
  on signup_forms for all
  using (is_league_official() and league_id = current_league_id());

-- ─── FORM SUBMISSIONS ────────────────────────────────────────

create policy "Officials can view all submissions"
  on form_submissions for select
  using (
    is_league_official()
    and exists (
      select 1 from signup_forms sf
      where sf.id = form_submissions.form_id
        and sf.league_id = current_league_id()
    )
  );

create policy "Anyone can submit a form"
  on form_submissions for insert
  with check (true);

-- ─── GAMES & SCHEDULE ────────────────────────────────────────

create policy "League members can view games"
  on games for select
  using (league_id = current_league_id());

create policy "Officials can manage games"
  on games for all
  using (is_league_official() and league_id = current_league_id());

create policy "Coaches can create and update games for their teams"
  on games for insert
  with check (
    is_coach()
    and league_id = current_league_id()
  );

create policy "League members can view seasons"
  on seasons for select
  using (league_id = current_league_id());

create policy "Officials can manage seasons"
  on seasons for all
  using (is_league_official() and league_id = current_league_id());

create policy "League members can view schedules"
  on schedules for select
  using (league_id = current_league_id());

create policy "Officials can manage schedules"
  on schedules for all
  using (is_league_official() and league_id = current_league_id());
