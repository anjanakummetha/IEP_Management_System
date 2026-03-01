import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import OpenAI from "openai";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const SYSTEM_PROMPT = `You are an IEP document parser. Extract ALL of the following fields from the provided IEP document text and return ONLY valid JSON — no prose, no markdown fences, no <think> tags.

Return exactly this structure:
{
  "student_name":      string or null,
  "district_id":       string or null,
  "date_of_birth":     "YYYY-MM-DD" or null,
  "disability_category": string or null,
  "start_date":        "YYYY-MM-DD" or null,
  "end_date":          "YYYY-MM-DD" or null,
  "creation_date":     "YYYY-MM-DD" or null,
  "revision_date":     "YYYY-MM-DD" or null,
  "case_manager":      string or null,
  "goals": [
    {
      "title":       string,
      "baseline":    string or null,
      "target":      string or null,
      "timeframe":   string or null,
      "target_date": "YYYY-MM-DD" or null
    }
  ],
  "services": [
    {
      "type":      string,
      "frequency": string or null,
      "duration":  string or null,
      "provider":  string or null
    }
  ],
  "compliance_flags": [
    "Short sentence describing a specific IDEA compliance concern found in this document"
  ]
}

For compliance_flags, identify concrete issues such as:
- Goals that lack measurable baselines or criteria
- Missing required dates (start, end, creation)
- Services listed without frequency or duration
- Vague or non-measurable goal language
- Missing evaluation procedures
- Missing placement rationale
Only include flags for issues that are actually present. Return an empty array [] if no issues found.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    if (!file) return NextResponse.json({ error: "No PDF provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const rawText: string = parsed.text ?? "";

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF. Ensure it is not a scanned image." }, { status: 422 });
    }

    const truncatedText = rawText.slice(0, 12000);

    const ai = new OpenAI({
      baseURL: "https://api.featherless.ai/v1",
      apiKey: process.env.FEATHERLESS_API_KEY!,
    });

    const completion = await ai.chat.completions.create({
      model: "Qwen/Qwen3-8B",
      max_tokens: 2048,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Extract IEP data from this document:\n\n${truncatedText}` },
      ],
    });

    let raw = completion.choices[0]?.message?.content ?? "{}";
    // Strip <think>…</think> reasoning blocks
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    // Strip markdown fences
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Try again." }, { status: 502 });
    }

    return NextResponse.json({
      extracted,
      rawText: rawText.slice(0, 5000),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
