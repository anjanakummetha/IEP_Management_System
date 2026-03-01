import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { StudentProfileClient } from "./StudentProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("students")
    .select("id, name, grade, disability_category, review_date, risk_score, status, case_manager:users!case_manager_id(full_name)")
    .eq("id", id)
    .single();

  if (error || !row) {
    return (
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-slate-700">Student not found.</p>
        <Link href="/students" className="mt-4 inline-block text-sm font-medium text-mahogany hover:underline">
          Back to Students
        </Link>
      </div>
    );
  }

  const caseManagerData = (row as { case_manager?: { full_name: string } | { full_name: string }[] | null }).case_manager;
  const caseManagerName = Array.isArray(caseManagerData)
    ? caseManagerData[0]?.full_name
    : caseManagerData?.full_name;
  const student = {
    id: row.id,
    name: row.name,
    grade: row.grade,
    disabilityCategory: row.disability_category,
    caseManager: caseManagerName ?? "—",
    reviewDate: row.review_date,
    riskScore: row.risk_score ?? 0,
    status: (row.status ?? "active") as "active" | "review_due" | "compliant",
  };

  return <StudentProfileClient student={student} />;
}
