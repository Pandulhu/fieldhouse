import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseServiceClient } from "../../../../lib/supabase-server"
import { SubmitSignupFormSchema } from "@fieldhouse/validators"

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const parsed = SubmitSignupFormSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { formId, data } = parsed.data

  // Try to get authenticated user if available
  let submittedBy: string | null = null
  try {
    const supabaseAuth = createSupabaseServerClient()
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser()
    if (authUser) {
      submittedBy = authUser.id
    }
  } catch {
    // Not authenticated — that's fine for public forms
  }

  // Use service client since this may be unauthenticated
  const service = createSupabaseServiceClient()

  // Verify the form exists and is active
  const { data: form, error: formError } = await service
    .from("signup_forms")
    .select("id, active")
    .eq("id", formId)
    .single()

  if (formError || !form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 })
  }

  if (!form.active) {
    return NextResponse.json(
      { error: "This form is no longer accepting submissions" },
      { status: 400 },
    )
  }

  // Insert submission
  const { error: insertError } = await service
    .from("form_submissions")
    .insert({
      form_id: formId,
      submitted_by: submittedBy,
      data,
    })

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
