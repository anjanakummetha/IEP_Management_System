import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { StudentProfileClient } from "./StudentProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export interface GoalRow {
  id: string;
  title: string;
  baseline: string;
  target: string;
  timeframe: string;
  targetDate: string | null;
  latestScore: number | null;
  progressPct: number;
}

export interface ServiceRow {
  id: string;
  type: string;
  frequency: string | null;
  duration: string | null;
  provider: string | null;
}

export interface ProgressNoteRow {
  id: string;
  note: string;
  created_at: string;
}

function calcProgress(baseline: string, target: string, score: number): number {
  const b = parseFloat(baseline);
  const t = parseFloat(target);
  if (isNaN(b) || isNaN(t) || t <= b) return 0;
  return Math.min(100, Math.max(0, Math.round(((score - b) / (t - b)) * 100)));
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Current user role ────────────────────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession();

  let role = "teacher";
  if (session?.user?.id) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();
    role = userRow?.role ?? "teacher";
  }

  // ── Student row ──────────────────────────────────────────────────────────
  const { data: row, error } = await supabase
    .from("students")
    .select(
      "id, name, grade, district_id, date_of_birth, disability_category, review_date, compliance_risk_score, compliance_risk_reasons, case_manager:users!case_manager_id(full_name)"
    )
    .eq("id", id)
    .single();

  if (error || !row) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pt-6">
        <p className="text-sm text-slate-700">
          Student not found. The schema may need to be re-applied and the seed re-run.
        </p>
        <Link href="/students" className="inline-block text-sm font-medium text-blue-600 hover:underline">
          Back to Students
        </Link>
      </div>
    );
  }

  const caseManagerData = (
    row as { case_manager?: { full_name: string } | { full_name: string }[] | null }
  ).case_manager;
  const caseManagerName = Array.isArray(caseManagerData)
    ? caseManagerData[0]?.full_name
    : caseManagerData?.full_name;

  // ── IEP + goals + progress ───────────────────────────────────────────────
  type RawProgressUpdate = { score: number; recorded_at: string };
  type RawGoal = {
    id: string; title: string; baseline: string | null; target: string | null;
    timeframe: string | null; target_date: string | null;
    progress_updates: RawProgressUpdate[];
  };
  type RawService = { id: string; type: string; frequency: string | null; duration: string | null; provider: string | null };
  type RawIEP = {
    id: string; start_date: string | null; end_date: string | null;
    goals: RawGoal[]; services_accommodations: RawService[];
  };

  const { data: iepData } = await supabase
    .from("ieps")
    .select(
      `id, start_date, end_date,
       goals ( id, title, baseline, target, timeframe, target_date,
         progress_updates ( score, recorded_at )
       ),
       services_accommodations ( id, type, frequency, duration, provider )`
    )
    .eq("student_id", id)
    .maybeSingle() as { data: RawIEP | null };

  const goals: GoalRow[] = (iepData?.goals ?? []).map((g) => {
    const sorted = [...(g.progress_updates ?? [])].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );
    const latest = sorted[0];
    const latestScore = latest ? Math.round(Number(latest.score)) : null;
    const progressPct =
      latestScore !== null
        ? calcProgress(g.baseline ?? "0", g.target ?? "100", latestScore)
        : 0;
    return {
      id: g.id,
      title: g.title,
      baseline: g.baseline ?? "—",
      target: g.target ?? "—",
      timeframe: g.timeframe ?? "Annual",
      targetDate: g.target_date ?? null,
      latestScore,
      progressPct,
    };
  });

  const services: ServiceRow[] = (iepData?.services_accommodations ?? []).map((s) => ({
    id: s.id, type: s.type,
    frequency: s.frequency ?? null,
    duration: s.duration ?? null,
    provider: s.provider ?? null,
  }));

  // ── Progress notes ───────────────────────────────────────────────────────
  const { data: notesRaw } = await supabase
    .from("progress_notes")
    .select("id, note, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const progressNotes: ProgressNoteRow[] = (notesRaw ?? []).map((n) => ({
    id: n.id, note: n.note, created_at: n.created_at,
  }));

  const student = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    districtId: (row as { district_id?: string }).district_id ?? null,
    dateOfBirth: (row as { date_of_birth?: string }).date_of_birth ?? null,
    disabilityCategory: row.disability_category,
    caseManager: caseManagerName ?? "—",
    reviewDate: row.review_date,
    iepEndDate: iepData?.end_date ?? null,
    complianceRiskScore: (row as { compliance_risk_score?: number }).compliance_risk_score ?? 0,
    complianceRiskReasons: (row as { compliance_risk_reasons?: string[] }).compliance_risk_reasons ?? [],
  };

  return (
    <StudentProfileClient
      student={student}
      role={role}
      goals={goals}
      services={services}
      progressNotes={progressNotes}
    />
  );
}
