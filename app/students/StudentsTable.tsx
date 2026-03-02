"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { RiskBadge } from "@/app/components/ui/RiskBadge";
import { getRiskLevel } from "@/lib/riskUtils";

export interface StudentRow {
  id: string;
  name: string;
  grade: string;
  disability_category: string;
  compliance_risk_score: number;
  review_date: string;
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
            <tr className="border-b border-sand bg-vanilla/50">
              <th className="text-left text-xs uppercase tracking-wide text-stone-500 font-medium px-6 py-4">Name</th>
              <th className="text-left text-xs uppercase tracking-wide text-stone-500 font-medium px-6 py-4">Grade</th>
              <th className="text-left text-xs uppercase tracking-wide text-stone-500 font-medium px-6 py-4">Disability</th>
              <th className="text-left text-xs uppercase tracking-wide text-stone-500 font-medium px-6 py-4">Risk Level</th>
              <th className="text-left text-xs uppercase tracking-wide text-stone-500 font-medium px-6 py-4">Review Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-vanilla/50 transition-colors cursor-pointer"
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
                <td className="px-6 py-4 text-sm font-medium text-espresso-noir">{student.name}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{student.disability_category}</td>
                <td className="px-6 py-4">
                  <RiskBadge level={getRiskLevel(student.compliance_risk_score)} />
                </td>
                <td className="px-6 py-4 text-sm text-stone-700">{student.review_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
