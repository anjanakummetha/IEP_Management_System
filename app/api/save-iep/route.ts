import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

interface ExtractedGoal {
  title: string;
  baseline: string;
  target: string;
  timeframe: string;
}

interface ExtractedIEP {
  student_name?: string | null;
  disability_category?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  goals?: ExtractedGoal[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { studentId: string; extracted: ExtractedIEP; rawText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { studentId, extracted, rawText } = body;
  if (!studentId || !extracted) {
    return NextResponse.json(
      { error: "Missing studentId or extracted data" },
      { status: 400 }
    );
  }

  try {
    // 1. Update student row with any fields the AI found
    const studentPatch: Record<string, unknown> = {};
    if (extracted.disability_category) {
      studentPatch.disability_category = extracted.disability_category;
    }
    if (extracted.end_date) {
      studentPatch.review_date = extracted.end_date;
    }
    if (Object.keys(studentPatch).length > 0) {
      const { error: stuErr } = await supabase
        .from("students")
        .update(studentPatch)
        .eq("id", studentId);
      if (stuErr) throw new Error(`students update: ${stuErr.message}`);
    }

    // 2. Upsert the IEP record
    const iepPayload = {
      student_id: studentId,
      start_date: extracted.start_date ?? null,
      end_date: extracted.end_date ?? null,
      raw_document_text: rawText ?? null,
      ai_extracted_json: extracted as object,
    };

    const { data: existing } = await supabase
      .from("ieps")
      .select("id")
      .eq("student_id", studentId)
      .maybeSingle();

    let iepId: string;
    if (existing?.id) {
      const { error: upErr } = await supabase
        .from("ieps")
        .update(iepPayload)
        .eq("id", existing.id);
      if (upErr) throw new Error(`ieps update: ${upErr.message}`);
      iepId = existing.id;
    } else {
      const { data: newIep, error: insErr } = await supabase
        .from("ieps")
        .insert(iepPayload)
        .select("id")
        .single();
      if (insErr) throw new Error(`ieps insert: ${insErr.message}`);
      iepId = newIep.id;
    }

    // 3. Replace goals for this IEP
    if (Array.isArray(extracted.goals) && extracted.goals.length > 0) {
      await supabase.from("goals").delete().eq("iep_id", iepId);

      const { error: goalErr } = await supabase.from("goals").insert(
        extracted.goals.map((g) => ({
          iep_id: iepId,
          title: g.title ?? "Untitled Goal",
          baseline: g.baseline ?? null,
          target: g.target ?? null,
          timeframe: g.timeframe ?? null,
        }))
      );
      if (goalErr) throw new Error(`goals insert: ${goalErr.message}`);
    }

    return NextResponse.json({ success: true, iepId });
  } catch (err) {
    console.error("[save-iep]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
