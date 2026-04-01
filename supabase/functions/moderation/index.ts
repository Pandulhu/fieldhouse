// supabase/functions/moderation/index.ts
// Triggered via Supabase Database Webhook on messages INSERT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PERSPECTIVE_API_KEY = Deno.env.get("PERSPECTIVE_API_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const FLAG_THRESHOLD = parseFloat(Deno.env.get("MODERATION_THRESHOLD") ?? "0.7")

interface PerspectiveResponse {
  attributeScores: {
    TOXICITY?: { summaryScore: { value: number } }
    SEVERE_TOXICITY?: { summaryScore: { value: number } }
    INSULT?: { summaryScore: { value: number } }
    THREAT?: { summaryScore: { value: number } }
    PROFANITY?: { summaryScore: { value: number } }
  }
}

const analyzeContent = async (text: string): Promise<number> => {
  const response = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          INSULT: {},
          THREAT: {},
          PROFANITY: {},
        },
      }),
    }
  )

  if (!response.ok) throw new Error(`Perspective API error: ${response.status}`)

  const data: PerspectiveResponse = await response.json()
  const scores = [
    data.attributeScores.TOXICITY?.summaryScore.value ?? 0,
    data.attributeScores.SEVERE_TOXICITY?.summaryScore.value ?? 0,
    data.attributeScores.INSULT?.summaryScore.value ?? 0,
    data.attributeScores.THREAT?.summaryScore.value ?? 0,
    data.attributeScores.PROFANITY?.summaryScore.value ?? 0,
  ]
  return Math.max(...scores)
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const message = payload.record

    if (!message?.content || !message?.id) {
      return new Response("Invalid payload", { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    let score = 0

    try {
      score = await analyzeContent(message.content)
    } catch (err) {
      console.error("Perspective API unavailable, skipping auto-moderation:", err)
      return new Response("Moderation skipped", { status: 200 })
    }

    if (score >= FLAG_THRESHOLD) {
      // Hide message immediately
      await supabase
        .from("messages")
        .update({ hidden: true, flagged: true })
        .eq("id", message.id)

      // Create flag record
      await supabase.from("flags").insert({
        message_id: message.id,
        flagged_by: null,
        auto_flagged: true,
        perspective_score: score,
        action: "pending",
        reason: `Auto-flagged: toxicity score ${score.toFixed(2)}`,
      })
    }

    return new Response(JSON.stringify({ score, flagged: score >= FLAG_THRESHOLD }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Moderation function error:", err)
    return new Response("Internal error", { status: 500 })
  }
})
