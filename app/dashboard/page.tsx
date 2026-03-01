import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { Card } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/RiskBadge";
import { getRiskLevel } from "@/lib/riskUtils";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  grade: string;
  disability_category: string;
  compliance_risk_score: number;
  compliance_risk_reasons: string[];
  review_date: string;
}

function isDue(reviewDate: string) {
  return new Date(reviewDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function isOverdue(reviewDate: string) {
  return new Date(reviewDate) < new Date();
}

export default async function DashboardPage() {
  const supabase = await createClient();

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

  const { data: raw } = await supabase
    .from("students")
    .select("id, name, grade, disability_category, compliance_risk_score, compliance_risk_reasons, review_date")
    .order("compliance_risk_score", { ascending: false });

  const students: StudentRow[] = (raw ?? []).map((s) => ({
    ...s,
    compliance_risk_score: s.compliance_risk_score ?? 0,
    compliance_risk_reasons: s.compliance_risk_reasons ?? [],
  }));

  const atRisk     = students.filter((s) => s.compliance_risk_score >= 25);
  const highRisk   = students.filter((s) => s.compliance_risk_score >= 50);
  const reviewsDue = students.filter((s) => isDue(s.review_date));
  const totalFlags = students.reduce((sum, s) => sum + s.compliance_risk_reasons.length, 0);

  if (role === "admin") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

        {/* Summary stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Students</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{students.length}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500">High Risk</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{highRisk.length}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500">Reviews Due Soon</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{reviewsDue.length}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total IDEA Flags</p>
            <p className="text-3xl font-bold text-slate-700 mt-1">{totalFlags}</p>
          </Card>
        </section>

        {/* Compliance Risk Monitor */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Compliance Risk Monitor</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                IDEA guideline tracking — AI-powered analysis of student IEPs
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-3">Student</th>
                  <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-3">Risk</th>
                  <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-3">Score</th>
                  <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-3">Review Date</th>
                  <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-3 min-w-[320px]">IDEA Compliance Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const level = getRiskLevel(s.compliance_risk_score);
                  const overdue = isOverdue(s.review_date);
                  const reasons = s.compliance_risk_reasons;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 align-top">
                      <td className="px-6 py-4">
                        <Link href={`/students/${s.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                          {s.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">Grade {s.grade} · {s.disability_category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={level} />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {s.compliance_risk_score}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-slate-700"}`}>
                          {s.review_date}
                        </span>
                        {overdue && (
                          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={10} /> Overdue
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reasons.length === 0 ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle size={12} /> No flags
                          </span>
                        ) : (
                          <ul className="space-y-1">
                            {reasons.map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ── Teacher view ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">My Students</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{students.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Students At Risk</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{atRisk.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Reviews Due</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{reviewsDue.length}</p>
        </Card>
      </section>

      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Students Requiring Attention</h2>
        {atRisk.length === 0 ? (
          <p className="text-sm text-slate-500">All students are on track.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {atRisk.map((s) => {
              const level = getRiskLevel(s.compliance_risk_score);
              const topFlag = s.compliance_risk_reasons[0];
              return (
                <li key={s.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/students/${s.id}`} className="text-sm font-medium text-slate-800 hover:text-blue-600">
                      {s.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Grade {s.grade} · Review: {s.review_date}
                    </p>
                    {topFlag && (
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {topFlag}
                      </p>
                    )}
                  </div>
                  <RiskBadge level={level} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
