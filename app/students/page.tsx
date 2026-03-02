import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { StudentsTable } from "./StudentsTable";
import { UserPlus } from "lucide-react";

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, grade, disability_category, compliance_risk_score, review_date")
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
    compliance_risk_score: s.compliance_risk_score ?? 0,
    review_date: s.review_date,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Students</h1>
        <Link
          href="/students/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-cold-brew text-vanilla text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm transition-opacity"
        >
          <UserPlus size={16} />
          Add Student
        </Link>
      </div>
      <StudentsTable students={rows} />
    </div>
  );
}
