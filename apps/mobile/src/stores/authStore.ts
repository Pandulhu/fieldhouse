import { create } from "zustand"
import { Session } from "@supabase/supabase-js"
import { User, UserRole } from "@fieldhouse/types"
import { supabase } from "../lib/supabase"

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  setSession: (session: Session | null) => void
  fetchUser: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) => {
    set({ session })
    if (session) get().fetchUser()
    else set({ user: null, loading: false })
  },

  fetchUser: async () => {
    const { session } = get()
    if (!session) return

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (error) {
      console.error("Failed to fetch user profile:", error)
      set({ loading: false })
      return
    }

    set({ user: data as User, loading: false })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))

// Convenience selectors
export const useUserRole = (): UserRole | null =>
  useAuthStore((s) => s.user?.role ?? null)

export const useLeagueId = (): string | null =>
  useAuthStore((s) => s.user?.leagueId ?? null)

export const useIsOfficialOrCoach = (): boolean => {
  const role = useUserRole()
  return role === UserRole.LeagueOfficial || role === UserRole.Coach
}
