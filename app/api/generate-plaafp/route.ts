import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a licensed special education specialist writing a Present Levels of Academic Achievement and Functional Performance (PLAAFP) statement for an IEP document.

Your output must follow this exact structure with these four clearly labeled sections:

**Academic Achievement**
[2–3 sentences describing the student's current academic performance across subjects, using specific data from goal scores and progress. Reference actual numbers where available. Write in third person, past tense for data and present tense for current status.]

**Functional Performance**
[2–3 sentences describing how the student functions in school environments — social skills, daily living, attention, communication, behavior, or motor skills depending on their disability. Use progress note observations.]

**Strengths**
[2–3 sentences describing genuine, specific strengths observed in academic or functional areas. Ground these in the data — a student improving from baseline to a high score has demonstrated strong growth.]

**Areas of Need**
[2–3 sentences describing the specific areas that require continued special education support. Be specific and tie back to measurable gaps between baseline and target. This should naturally lead into the IEP goals.]

Rules:
- Write in formal, professional IEP language suitable for a legal document
- Never use vague phrases like "struggles with" — use specific, observable, measurable language
- Base everything on the data provided — do not fabricate scores or observations
- Do not include the student's name more than twice per section
- Do not add extra sections or commentary outside the four sections above
- Each section should be 2–4 sentences`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  // Fetch student info
  const { data: student } = await supabase
    .from("students")
    .select("name, grade, disability_category, review_date, date_of_birth")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Fetch IEP dates + goals with all progress scores
  const { data: iepData } = await supabase
    .from("ieps")
    .select(`
      start_date, end_date,
      goals ( id, title, baseline, target, timeframe, target_date,
        progress_updates ( score, recorded_at )
      ),
      services_accommodations ( type, frequency, duration )
    `)
    .eq("student_id", studentId)
    .maybeSingle();

  // Fetch teacher progress notes
  const { data: notes } = await supabase
    .from("progress_notes")
    .select("note, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(8);

  // Build a rich data summary for the AI
  type Goal = {
    title: string;
    baseline: string | null;
    target: string | null;
    timeframe: string | null;
    progress_updates: Array<{ score: number; recorded_at: string }>;
  };

  const goalsSummary = ((iepData?.goals as Goal[]) ?? [])
    .map((g) => {
      const updates = [...(g.progress_updates ?? [])].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      const latest = updates[0];
      const earliest = updates[updates.length - 1];
      const trend = updates.length >= 2
        ? `improved from ${earliest.score} to ${latest.score} over ${updates.length} data points`
        : latest
          ? `currently at ${latest.score}`
          : "no data recorded yet";

      const pct = latest && g.baseline && g.target
        ? Math.round(
            ((Number(latest.score) - Number(g.baseline)) /
              (Number(g.target) - Number(g.baseline))) *
              100
          )
        : null;

      return `• ${g.title}: baseline ${g.baseline ?? "N/A"}, target ${g.target ?? "N/A"}, ${trend}${pct !== null ? `, ${pct}% progress toward goal` : ""}`;
    })
    .join("\n");

  const notesSummary = (notes ?? [])
    .map((n) => `• ${new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}: ${n.note}`)
    .join("\n");

  type Service = { type: string; frequency: string | null; duration: string | null };
  const servicesSummary = ((iepData?.services_accommodations as Service[]) ?? [])
    .map((s) => `• ${s.type}${s.frequency ? ` (${s.frequency}` : ""}${s.duration ? `, ${s.duration})` : s.frequency ? ")" : ""}`)
    .join("\n");

  const userPrompt = `Write a PLAAFP for the following student.

STUDENT INFORMATION:
- Name: ${student.name}
- Grade: ${student.grade}
- Disability Category: ${student.disability_category}
- IEP Period: ${iepData?.start_date ?? "N/A"} to ${iepData?.end_date ?? "N/A"}

CURRENT GOALS AND PROGRESS DATA:
${goalsSummary || "No goals on file."}

TEACHER OBSERVATIONS AND PROGRESS NOTES:
${notesSummary || "No teacher notes recorded."}

CURRENT SERVICES:
${servicesSummary || "No services documented."}

Write the four-section PLAAFP now.`;

  const ai = new OpenAI({
    baseURL: "https://api.featherless.ai/v1",
    apiKey: process.env.FEATHERLESS_API_KEY!,
  });

  const completion = await ai.chat.completions.create({
    model: "Qwen/Qwen3-8B",
    max_tokens: 1500,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: `/no_think\n\n${userPrompt}` },
    ],
  });

  let plaafp = completion.choices[0]?.message?.content ?? "";
  // Strip <think>...</think> blocks, including truncated ones with no closing tag
  plaafp = plaafp.replace(/<think>[\s\S]*?<\/think>/gi, "");
  plaafp = plaafp.replace(/<think>[\s\S]*/i, "");
  plaafp = plaafp.trim();

  return NextResponse.json({ plaafp });
}
