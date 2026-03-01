import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateCompliance } from "@/lib/complianceUtils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, note } = await req.json();
  if (!studentId || !note?.trim()) {
    return NextResponse.json({ error: "studentId and note are required" }, { status: 400 });
  }

  // Insert the progress note
  const { error: insertErr } = await supabaseAdmin.from("progress_notes").insert({
    student_id: studentId,
    created_by: session.user.id,
    note: note.trim(),
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Recalculate compliance risk
  const { data: iepData } = await supabaseAdmin
    .from("ieps")
    .select("start_date, end_date, goals(baseline, target), services_accommodations(id)")
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: latestNote } = await supabaseAdmin
    .from("progress_notes")
    .select("created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: studentRow } = await supabaseAdmin
    .from("students")
    .select("compliance_risk_reasons")
    .eq("id", studentId)
    .single();

  const existingReasons: string[] = studentRow?.compliance_risk_reasons ?? [];
  const aiFlags = existingReasons.filter((r) =>
    !r.startsWith("Annual IEP") &&
    !r.startsWith("IEP end date") &&
    !r.startsWith("No progress") &&
    !r.startsWith("IEP has no goals") &&
    !r.includes("goal") &&
    !r.startsWith("No services")
  );

  const { score, reasons } = calculateCompliance({
    iepEndDate: iepData?.end_date ?? null,
    iepStartDate: iepData?.start_date ?? null,
    goals: (iepData?.goals as Array<{ baseline: string | null; target: string | null }>) ?? [],
    services: iepData?.services_accommodations ?? [],
    lastProgressNoteDate: latestNote?.created_at ?? null,
    aiFlags,
  });

  await supabaseAdmin.from("students").update({
    compliance_risk_score: score,
    compliance_risk_reasons: reasons,
  }).eq("id", studentId);

  return NextResponse.json({ success: true });
}
