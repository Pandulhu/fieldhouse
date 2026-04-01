import React from "react"
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { UserRole } from "@fieldhouse/types"
import { useAuthStore, useUserRole } from "../../stores/authStore"

const ACTIVE_COLOR = "#2E75B6"
const INACTIVE_COLOR = "#888888"

interface TabDef {
  name: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
  roles: UserRole[]
}

const TABS: TabDef[] = [
  {
    name: "(official)/dashboard",
    title: "Dashboard",
    icon: "grid-outline",
    roles: [UserRole.LeagueOfficial],
  },
  {
    name: "(coach)/dashboard",
    title: "Dashboard",
    icon: "grid-outline",
    roles: [UserRole.Coach],
  },
  {
    name: "(parent)/dashboard",
    title: "Dashboard",
    icon: "grid-outline",
    roles: [UserRole.Parent],
  },
  {
    name: "(player)/dashboard",
    title: "Dashboard",
    icon: "grid-outline",
    roles: [UserRole.Player],
  },
  {
    name: "(official)/teams",
    title: "Teams",
    icon: "people-outline",
    roles: [UserRole.LeagueOfficial],
  },
  {
    name: "(coach)/roster",
    title: "Roster",
    icon: "people-outline",
    roles: [UserRole.Coach],
  },
  {
    name: "(official)/schedule",
    title: "Schedule",
    icon: "calendar-outline",
    roles: [UserRole.LeagueOfficial],
  },
  {
    name: "(coach)/schedule",
    title: "Schedule",
    icon: "calendar-outline",
    roles: [UserRole.Coach],
  },
  {
    name: "(parent)/schedule",
    title: "Schedule",
    icon: "calendar-outline",
    roles: [UserRole.Parent],
  },
  {
    name: "(player)/schedule",
    title: "Schedule",
    icon: "calendar-outline",
    roles: [UserRole.Player],
  },
  {
    name: "(official)/announcements",
    title: "Announcements",
    icon: "megaphone-outline",
    roles: [UserRole.LeagueOfficial],
  },
  {
    name: "(coach)/stats",
    title: "Stats",
    icon: "stats-chart-outline",
    roles: [UserRole.Coach],
  },
  {
    name: "(parent)/stats",
    title: "Stats",
    icon: "stats-chart-outline",
    roles: [UserRole.Parent],
  },
  {
    name: "(player)/my-stats",
    title: "My Stats",
    icon: "stats-chart-outline",
    roles: [UserRole.Player],
  },
  {
    name: "(official)/flags",
    title: "Flags",
    icon: "flag-outline",
    roles: [UserRole.LeagueOfficial],
  },
  {
    name: "(coach)/flags",
    title: "Flags",
    icon: "flag-outline",
    roles: [UserRole.Coach],
  },
]

export default function AppLayout() {
  const role = useUserRole()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      {TABS.map((tab) => {
        const visible = role !== null && tab.roles.includes(role)
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              href: visible ? undefined : null,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon} size={size} color={color} />
              ),
            }}
          />
        )
      })}
    </Tabs>
  )
}
