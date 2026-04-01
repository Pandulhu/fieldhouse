import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "../../../../lib/supabase-server"
import { ReviewFlagSchema } from "@fieldhouse/validators"
import { UserRole, FlagAction } from "@fieldhouse/types"

export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, league_id")
    .eq("id", user.id)
    .single()

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const isCoachOrAbove = [UserRole.Coach, UserRole.LeagueOfficial].includes(profile.role as UserRole)
  if (!isCoachOrAbove) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await req.json()
  const result = ReviewFlagSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { flagId, action } = result.data

  // Fetch the flag to validate scope
  const { data: flag, error: flagError } = await supabase
    .from("flags")
    .select("id, message_id, action")
    .eq("id", flagId)
    .single()

  if (flagError || !flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 })
  }

  // Update flag record
  const { error: updateError } = await supabase
    .from("flags")
    .update({ action, reviewed_by: user.id })
    .eq("id", flagId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // If approved: restore message. If deleted: mark deleted. If escalated: leave hidden.
  if (action === FlagAction.Approved) {
    await supabase
      .from("messages")
      .update({ hidden: false, reviewed: true })
      .eq("id", flag.message_id)
  } else if (action === FlagAction.Deleted) {
    await supabase
      .from("messages")
      .update({ deleted: true, hidden: true, reviewed: true })
      .eq("id", flag.message_id)
  }

  return NextResponse.json({ success: true, action })
}
