"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { cn } from "@/lib/utils";

export interface StudentRow {
  id: string;
  name: string;
  grade: string;
  disability_category: string;
  risk_score: number;
  review_date: string;
  status: "active" | "review_due" | "compliant";
}

function RiskBadge({ score }: { score: number }) {
  const variant =
    score <= 25 ? "bg-emerald-100 text-emerald-800" : score <= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variant)}>
      {score}%
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "review_due" | "compliant" }) {
  const styles = {
    active: "bg-slate-100 text-slate-700",
    review_due: "bg-amber-100 text-amber-800",
    compliant: "bg-emerald-100 text-emerald-800",
  };
  const labels = { active: "Active", review_due: "Review due", compliant: "Compliant" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

interface StudentsTableProps {
  students: StudentRow[];
}

export function StudentsTable({ students }: StudentsTableProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">Name</th>
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">Grade</th>
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                Disability Category
              </th>
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                Risk Score
              </th>
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                Review Date
              </th>
              <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/students/${student.id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/students/${student.id}`);
                  }
                }}
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-800">{student.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{student.disability_category}</td>
                <td className="px-6 py-4">
                  <RiskBadge score={student.risk_score} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{student.review_date}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={student.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
