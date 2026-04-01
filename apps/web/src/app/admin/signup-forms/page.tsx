"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser"
import { CreateSignupFormSchema } from "@fieldhouse/validators"
import type { SignupForm, SignupFormField, Season } from "@fieldhouse/types"
import DataTable from "../../../components/ui/DataTable"
import Modal from "../../../components/ui/Modal"
import FieldBuilder from "../../../components/ui/FieldBuilder"

export default function SignupFormsPage() {
  const [forms, setForms] = useState<SignupForm[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [seasonId, setSeasonId] = useState("")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [fields, setFields] = useState<SignupFormField[]>([])

  const supabase = createSupabaseBrowserClient()

  const fetchData = useCallback(async () => {
    const [formRes, seasonRes] = await Promise.all([
      supabase.from("signup_forms").select("*").order("created_at", { ascending: false }),
      supabase.from("seasons").select("*").order("start_date", { ascending: false }),
    ])
    setForms((formRes.data ?? []) as SignupForm[])
    setSeasons((seasonRes.data ?? []) as Season[])
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), label: "", type: "text", required: false }])
  }

  const removeField = (id: string) => setFields(fields.filter((f) => f.id !== id))

  const updateField = (id: string, updates: Partial<SignupFormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleCreate = async () => {
    const { data: profile } = await supabase.from("users").select("league_id").single()
    if (!profile) return

    const payload = {
      leagueId: profile.league_id as string,
      seasonId,
      title,
      fields,
      externalPaymentUrl: paymentUrl || null,
    }

    const parsed = CreateSignupFormSchema.safeParse(payload)
    if (!parsed.success) return

    await supabase.from("signup_forms").insert({
      league_id: payload.leagueId,
      season_id: payload.seasonId,
      title: payload.title,
      fields: payload.fields as unknown as Record<string, unknown>[],
      external_payment_url: payload.externalPaymentUrl,
      active: true,
    })

    setShowModal(false)
    setTitle("")
    setSeasonId("")
    setPaymentUrl("")
    setFields([])
    fetchData()
  }

  const columns = [
    { key: "title", label: "Title" },
    { key: "season_id", label: "Season" },
    {
      key: "active",
      label: "Status",
      render: (row: Record<string, unknown>) =>
        (row.active as boolean) ? (
          <span className="text-success font-medium">Active</span>
        ) : (
          <span className="text-muted">Inactive</span>
        ),
    },
    {
      key: "fields",
      label: "Fields",
      render: (row: Record<string, unknown>) => (row.fields as unknown[])?.length ?? 0,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Signup Forms</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Create Form
        </button>
      </div>

      <DataTable columns={columns} data={forms as unknown as Record<string, unknown>[]} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Signup Form">
        <div className="space-y-4">
          <input
            placeholder="Form title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select Season</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            placeholder="Payment URL (optional)"
            value={paymentUrl}
            onChange={(e) => setPaymentUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <FieldBuilder fields={fields} onAdd={addField} onRemove={removeField} onUpdate={updateField} />
          <button
            onClick={handleCreate}
            className="w-full bg-accent text-white py-2 rounded-lg text-sm font-medium hover:bg-accent/90"
          >
            Create Form
          </button>
        </div>
      </Modal>
    </div>
  )
}
