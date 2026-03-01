import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import OpenAI from "openai";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  zh: "Chinese (Simplified)",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Write the entire summary in clear, friendly English.",
  es: "Escribe todo el resumen en español claro y amigable.",
  zh: "用清晰、友好的简体中文撰写完整摘要。",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, language = "en" } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  // Fetch student info
  const { data: student } = await supabase
    .from("students")
    .select("name, disability_category, review_date")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Fetch IEP + goals + progress updates
  const { data: iepData } = await supabase
    .from("ieps")
    .select("start_date, end_date, goals(title, baseline, target, timeframe, target_date, progress_updates(score, recorded_at))")
    .eq("student_id", studentId)
    .maybeSingle();

  // Fetch teacher progress notes
  const { data: notes } = await supabase
    .from("progress_notes")
    .select("note, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Build context string
  const goalsSummary = ((iepData?.goals as Array<{
    title: string; baseline: string; target: string; timeframe: string;
    target_date: string; progress_updates: Array<{ score: number; recorded_at: string }>;
  }>) ?? [])
    .map((g) => {
      const updates = g.progress_updates ?? [];
      const latest = updates.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )[0];
      const progress = latest
        ? `current score ${latest.score} (target: ${g.target})`
        : "no score recorded yet";
      return `• ${g.title}: baseline ${g.baseline}, ${progress}, timeframe: ${g.timeframe ?? "annual"}`;
    })
    .join("\n");

  const notesSummary = (notes ?? [])
    .map((n) => `• ${new Date(n.created_at).toLocaleDateString("en-US")}: ${n.note}`)
    .join("\n");

  const systemPrompt = `You are an empathetic school communicator writing a parent-friendly IEP progress summary.
${LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.en}
- Avoid jargon and acronyms — explain any educational terms in plain language.
- Be warm, encouraging, and honest.
- Organize into: (1) Overview, (2) Progress on Each Goal, (3) Teacher Notes & Observations, (4) Next Steps.
- Do NOT include risk scores or compliance information — this is for parents.
- Target 200–300 words.`;

  const userPrompt = `
Student: ${student.name}
Disability: ${student.disability_category}
IEP Period: ${iepData?.start_date ?? "N/A"} to ${iepData?.end_date ?? "N/A"}
Next Review: ${student.review_date}

GOALS & PROGRESS:
${goalsSummary || "No goals on file."}

TEACHER PROGRESS NOTES:
${notesSummary || "No notes recorded yet."}

Write a parent summary in ${LANGUAGE_NAMES[language] ?? "English"}.`;

  const ai = new OpenAI({
    baseURL: "https://api.featherless.ai/v1",
    apiKey: process.env.FEATHERLESS_API_KEY!,
  });

  const completion = await ai.chat.completions.create({
    model: "Qwen/Qwen3-8B",
    max_tokens: 1024,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
  });

  let summary = completion.choices[0]?.message?.content ?? "";
  summary = summary.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  return NextResponse.json({ summary });
}
