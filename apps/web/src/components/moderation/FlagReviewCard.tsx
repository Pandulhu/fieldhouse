"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "../../lib/supabase-browser"
import type { FlagAction } from "@fieldhouse/types"

interface FlagReviewCardProps {
  flagId: string
  messageContent: string
  senderName: string
  reason: string | null
  autoFlagged: boolean
  perspectiveScore: number | null
  createdAt: string
  onResolved: (flagId: string, action: FlagAction) => void
}

export default function FlagReviewCard({
  flagId,
  messageContent,
  senderName,
  reason,
  autoFlagged,
  perspectiveScore,
  createdAt,
  onResolved,
}: FlagReviewCardProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: "approved" | "deleted" | "escalated") => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch("/api/flags/review", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ flagId, action }),
      })

      if (res.ok) {
        onResolved(flagId, action as FlagAction)
      }
    } finally {
      setLoading(false)
    }
  }

  const scorePercent = perspectiveScore !== null ? Math.round(perspectiveScore * 100) : null

  return (
    <div className="bg-surface rounded-lg border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{senderName}</span>
          {autoFlagged && (
            <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
              Auto-flagged
            </span>
          )}
        </div>
        <time className="text-xs text-muted">
          {new Date(createdAt).toLocaleString()}
        </time>
      </div>

      {/* Message content */}
      <div className="bg-gray-50 rounded-md p-3 mb-3 text-sm text-gray-700">
        {messageContent}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted">
        {reason && <span>Reason: {reason}</span>}
        {scorePercent !== null && (
          <div className="flex items-center gap-2">
            <span>Toxicity: {scorePercent}%</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  scorePercent > 70
                    ? "bg-danger"
                    : scorePercent > 40
                      ? "bg-warning"
                      : "bg-success"
                }`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => handleAction("approved")}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-green-50 text-success border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => handleAction("deleted")}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-red-50 text-danger border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>
        <button
          disabled={loading}
          onClick={() => handleAction("escalated")}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-amber-50 text-warning border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          Escalate
        </button>
      </div>
    </div>
  )
}
