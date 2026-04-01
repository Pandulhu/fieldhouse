import React from "react"
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../../lib/supabase"
import { useAuthStore } from "../../../stores/authStore"
import { SignupForm, FormSubmission } from "@fieldhouse/types"

interface SignupFormWithCount extends SignupForm {
  submissionCount: number
}

export default function SignupFormsScreen() {
  const user = useAuthStore((s) => s.user)
  const leagueId = user?.leagueId

  const formsQuery = useQuery<SignupFormWithCount[]>({
    queryKey: ["signup-forms", leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signup_forms")
        .select("*")
        .eq("league_id", leagueId!)
        .order("created_at", { ascending: false })
      if (error) throw error

      const forms = data as SignupForm[]
      const result: SignupFormWithCount[] = []
      for (const form of forms) {
        const { count } = await supabase
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("form_id", form.id)
        result.push({ ...form, submissionCount: count ?? 0 })
      }
      return result
    },
  })

  if (formsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2E75B6" />
      </SafeAreaView>
    )
  }

  const forms = formsQuery.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Signup Forms</Text>

        {forms.length === 0 && (
          <Text style={styles.empty}>No signup forms created yet.</Text>
        )}

        {forms.map((form) => (
          <View key={form.id} style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{form.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  form.active ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    form.active ? styles.activeText : styles.inactiveText,
                  ]}
                >
                  {form.active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>
              {form.submissionCount} submission
              {form.submissionCount !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.cardMeta}>
              Created {new Date(form.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: "#1A1A2E", marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  activeBadge: { backgroundColor: "#E8F5E9" },
  inactiveBadge: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 12, fontWeight: "600" },
  activeText: { color: "#2E7D32" },
  inactiveText: { color: "#C62828" },
  cardMeta: { fontSize: 13, color: "#888888", marginTop: 4 },
  empty: { fontSize: 14, color: "#888888", fontStyle: "italic" },
})
