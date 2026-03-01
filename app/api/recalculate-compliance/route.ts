import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateCompliance } from "@/lib/complianceUtils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  const { data: iepData } = await supabaseAdmin
    .from("ieps")
    .select("start_date, end_date, goals(baseline, target), services_accommodations(id), ai_extracted_json")
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: latestNote } = await supabaseAdmin
    .from("progress_notes")
    .select("created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Pull AI flags from stored extracted JSON if present
  const aiJson = iepData?.ai_extracted_json as { compliance_flags?: string[] } | null;
  const aiFlags: string[] = aiJson?.compliance_flags ?? [];

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

  return NextResponse.json({ score, reasons });
}
