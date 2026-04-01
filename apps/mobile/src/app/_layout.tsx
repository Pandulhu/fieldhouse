import { useEffect } from "react"
import { Slot, useRouter, useSegments } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../stores/authStore"
import { UserRole } from "@fieldhouse/types"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
    },
  },
})

const ROLE_ROOT: Record<UserRole, string> = {
  [UserRole.LeagueOfficial]: "/(app)/(official)/dashboard",
  [UserRole.Coach]: "/(app)/(coach)/dashboard",
  [UserRole.Parent]: "/(app)/(parent)/dashboard",
  [UserRole.Player]: "/(app)/(player)/dashboard",
}

function SessionGuard() {
  const { session, user, loading, setSession } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === "(auth)"

    if (!session && !inAuth) {
      router.replace("/(auth)/sign-in")
      return
    }

    if (session && user && inAuth) {
      router.replace(ROLE_ROOT[user.role])
    }
  }, [session, user, loading, segments])

  return <Slot />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionGuard />
    </QueryClientProvider>
  )
}
