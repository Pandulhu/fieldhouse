"use client"

import { useEffect, useState, useCallback } from "react"
import { createSupabaseBrowserClient } from "../../lib/supabase-browser"
import FlagReviewCard from "./FlagReviewCard"
import type { FlagAction } from "@fieldhouse/types"

interface FlagRow {
  id: string
  message_id: string
  reason: string | null
  auto_flagged: boolean
  perspective_score: number | null
  created_at: string
  messages: {
    content: string
    sender_id: string
    users: { display_name: string } | null
  } | null
}

export default function FlagQueue() {
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from("flags")
      .select(
        "id, message_id, reason, auto_flagged, perspective_score, created_at, messages(content, sender_id, users:sender_id(display_name))",
      )
      .eq("action", "pending")
      .order("created_at", { ascending: false })

    setFlags((data as FlagRow[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  const handleResolved = (flagId: string, _action: FlagAction) => {
    setFlags((prev) => prev.filter((f) => f.id !== flagId))
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        Loading flags...
      </div>
    )
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        No pending flags. All clear!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <FlagReviewCard
          key={flag.id}
          flagId={flag.id}
          messageContent={flag.messages?.content ?? "[message deleted]"}
          senderName={flag.messages?.users?.display_name ?? "Unknown"}
          reason={flag.reason}
          autoFlagged={flag.auto_flagged}
          perspectiveScore={flag.perspective_score}
          createdAt={flag.created_at}
          onResolved={handleResolved}
        />
      ))}
    </div>
  )
}
