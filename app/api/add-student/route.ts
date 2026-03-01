import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { calculateCompliance } from "@/lib/complianceUtils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Fetch role + school_id
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("role, school_id")
    .eq("id", userId)
    .single();
  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 403 });

  const body = await req.json();
  const {
    student_name, district_id, date_of_birth, disability_category, grade,
    start_date, end_date, creation_date, revision_date,
    goals = [], services = [],
    raw_document_text, ai_extracted_json, compliance_flags = [],
  } = body;

  if (!student_name || !disability_category || !grade) {
    return NextResponse.json({ error: "student_name, disability_category, and grade are required" }, { status: 400 });
  }

  const reviewDate = end_date ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Determine case_manager_id
  const caseManagerId = userRow.role === "teacher" ? userId : null;

  // 1. Insert student
  const { data: student, error: sErr } = await supabaseAdmin
    .from("students")
    .insert({
      school_id: userRow.school_id,
      name: student_name,
      district_id: district_id ?? null,
      date_of_birth: date_of_birth ?? null,
      grade,
      disability_category,
      case_manager_id: caseManagerId,
      review_date: reviewDate,
      compliance_risk_score: 0,
      compliance_risk_reasons: [],
    })
    .select("id")
    .single();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  // 2. Insert IEP
  const { data: iep, error: iErr } = await supabaseAdmin
    .from("ieps")
    .insert({
      student_id: student.id,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      creation_date: creation_date ?? null,
      revision_date: revision_date ?? null,
      raw_document_text: raw_document_text ?? null,
      ai_extracted_json: ai_extracted_json ?? null,
    })
    .select("id")
    .single();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // 3. Insert goals
  for (const g of goals) {
    await supabaseAdmin.from("goals").insert({
      iep_id: iep.id,
      title: g.title ?? "Untitled Goal",
      baseline: g.baseline ?? null,
      target: g.target ?? null,
      timeframe: g.timeframe ?? null,
      target_date: g.target_date ?? null,
    });
  }

  // 4. Insert services
  for (const s of services) {
    await supabaseAdmin.from("services_accommodations").insert({
      iep_id: iep.id,
      type: s.type ?? "Service",
      frequency: s.frequency ?? null,
      duration: s.duration ?? null,
      provider: s.provider ?? null,
    });
  }

  // 5. Calculate and store initial compliance score
  const { score, reasons } = calculateCompliance({
    iepEndDate: end_date ?? null,
    iepStartDate: start_date ?? null,
    goals: goals.map((g: { baseline?: string; target?: string }) => ({
      baseline: g.baseline ?? null,
      target: g.target ?? null,
    })),
    services,
    lastProgressNoteDate: null,
    aiFlags: compliance_flags,
  });

  await supabaseAdmin.from("students").update({
    compliance_risk_score: score,
    compliance_risk_reasons: reasons,
  }).eq("id", student.id);

  return NextResponse.json({ studentId: student.id });
}
