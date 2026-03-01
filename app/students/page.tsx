import { createClient } from "@/lib/supabaseServer";
import { StudentsTable } from "./StudentsTable";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, grade, disability_category, risk_score, review_date, status")
    .order("name");

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Students</h1>
        <div className="rounded-2xl shadow-sm p-6 bg-white">
          <p className="text-sm text-red-700">Failed to load students. Please try again.</p>
        </div>
      </div>
    );
  }

  const rows = (students ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    disability_category: s.disability_category,
    risk_score: s.risk_score ?? 0,
    review_date: s.review_date,
    status: (s.status ?? "active") as "active" | "review_due" | "compliant",
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Students</h1>
      <StudentsTable students={rows} />
    </div>
  );
}
