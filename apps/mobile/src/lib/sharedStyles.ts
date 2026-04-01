import { StyleSheet } from "react-native"

export const COLORS = {
  primary: "#1E3A5F",
  accent: "#2E75B6",
  light: "#D6E4F0",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#888888",
  success: "#2E7D32",
  danger: "#C62828",
  warning: "#F57C00",
} as const

export const sharedStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: COLORS.text, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  empty: { fontSize: 14, color: COLORS.muted, fontStyle: "italic" },
})
