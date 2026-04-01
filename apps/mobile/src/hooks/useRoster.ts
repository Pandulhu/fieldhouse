import { useQuery } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import { Player, Team, User } from "@fieldhouse/types"
import { useAuthStore } from "../stores/authStore"

// ─── PLAYER WITH PARENT INFO ────────────────────────────────

interface PlayerWithParent extends Player {
  parentUser: Pick<User, "id" | "displayName" | "email" | "phone">
}

// ─── FETCH ROSTER FOR A TEAM ────────────────────────────────

export const useTeamRoster = (teamId: string) =>
  useQuery({
    queryKey: ["team-roster", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select(
          `
          *,
          users!players_parent_user_id_fkey (
            id,
            display_name,
            email,
            phone
          )
        `
        )
        .eq("team_id", teamId)
        .eq("active", true)
        .order("display_name", { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => {
        const parent = row.users as {
          id: string
          display_name: string
          email: string
          phone: string | null
        }
        return {
          id: row.id,
          parentUserId: row.parent_user_id,
          teamId: row.team_id,
          displayName: row.display_name,
          jerseyNumber: row.jersey_number,
          position: row.position,
          dateOfBirth: row.date_of_birth,
          photoUrl: row.photo_url,
          active: row.active,
          createdAt: row.created_at,
          parentUser: {
            id: parent.id,
            displayName: parent.display_name,
            email: parent.email,
            phone: parent.phone,
          },
        } satisfies PlayerWithParent
      })
    },
    enabled: !!teamId,
  })

// ─── FETCH TEAMS WHERE CURRENT USER IS COACH ────────────────

export const useCoachTeams = () => {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ["coach-teams", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .contains("coach_ids", [user.id])
        .order("name", { ascending: true })

      if (error) throw error
      return data as Team[]
    },
    enabled: !!user?.id,
  })
}
