"use client";

import Link from "next/link";
import { StudentOverviewSection } from "@/app/components/students/StudentOverviewSection";
import { GoalsProgressSection } from "@/app/components/students/GoalsProgressSection";
import { ServicesAccommodationsSection } from "@/app/components/students/ServicesAccommodationsSection";
import { AIToolsSection } from "@/app/components/students/AIToolsSection";
import { ArrowLeft } from "lucide-react";
import type { GoalRow, ServiceRow, ProgressNoteRow } from "./page";

export interface StudentProfileData {
  id: string;
  name: string;
  grade: string;
  districtId: string | null;
  dateOfBirth: string | null;
  disabilityCategory: string;
  caseManager: string;
  reviewDate: string;
  iepEndDate: string | null;
  complianceRiskScore: number;
  complianceRiskReasons: string[];
}

interface StudentProfileClientProps {
  student: StudentProfileData;
  role: string;
  goals: GoalRow[];
  services: ServiceRow[];
  progressNotes: ProgressNoteRow[];
}

export function StudentProfileClient({
  student, role, goals, services, progressNotes,
}: StudentProfileClientProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/students"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Students
        </Link>
      </div>

      <StudentOverviewSection
        name={student.name}
        grade={student.grade}
        districtId={student.districtId}
        dateOfBirth={student.dateOfBirth}
        disabilityCategory={student.disabilityCategory}
        caseManager={student.caseManager}
        reviewDate={student.reviewDate}
        riskScore={student.complianceRiskScore}
        riskReasons={student.complianceRiskReasons}
        studentId={student.id}
      />

      <GoalsProgressSection
        role={role}
        goals={goals}
        studentId={student.id}
        progressNotes={progressNotes}
      />

      <ServicesAccommodationsSection services={services} />

      <AIToolsSection
        role={role}
        studentId={student.id}
        studentName={student.name}
        disabilityCategory={student.disabilityCategory}
        reviewDate={student.reviewDate}
      />
    </div>
  );
}
