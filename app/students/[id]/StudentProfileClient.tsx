"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Tabs } from "@/app/components/ui/Tabs";
import { StudentOverviewTab } from "@/app/components/students/StudentOverviewTab";
import { StudentGoalsTab } from "@/app/components/students/StudentGoalsTab";
import { StudentComplianceTab } from "@/app/components/students/StudentComplianceTab";
import { StudentParentSummaryTab } from "@/app/components/students/StudentParentSummaryTab";
import { cn } from "@/lib/utils";

export interface StudentProfileData {
  id: string;
  name: string;
  grade: string;
  disabilityCategory: string;
  caseManager: string;
  reviewDate: string;
  riskScore: number;
  status: "active" | "review_due" | "compliant";
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Goals" },
  { id: "compliance", label: "Compliance" },
  { id: "parent-summary", label: "Parent Summary" },
];

function isReviewDueSoon(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30 && diffDays >= 0;
}

interface StudentProfileClientProps {
  student: StudentProfileData;
}

export function StudentProfileClient({ student }: StudentProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const reviewDueSoon = isReviewDueSoon(student.reviewDate);

  const studentForOverview = {
    id: student.id,
    name: student.name,
    grade: student.grade,
    disabilityCategory: student.disabilityCategory,
    riskScore: student.riskScore,
    reviewDate: student.reviewDate,
    status: student.status,
    caseManager: student.caseManager,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{student.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span>Grade {student.grade}</span>
            <span className="text-slate-400">•</span>
            <span>{student.disabilityCategory}</span>
            <span className="text-slate-400">•</span>
            <span>Case Manager: {student.caseManager}</span>
          </div>
          <div className="mt-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                reviewDueSoon ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"
              )}
            >
              Review date: {student.reviewDate}
              {reviewDueSoon && " (within 30 days)"}
            </span>
          </div>
        </div>
      </header>

      <Tabs tabs={TABS} activeId={activeTab} onSelect={setActiveTab} />

      {activeTab === "overview" && <StudentOverviewTab student={studentForOverview} />}
      {activeTab === "goals" && <StudentGoalsTab />}
      {activeTab === "compliance" && <StudentComplianceTab />}
      {activeTab === "parent-summary" && <StudentParentSummaryTab />}
    </div>
  );
}
