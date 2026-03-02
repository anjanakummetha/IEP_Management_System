"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { RiskBadge } from "@/app/components/ui/RiskBadge";
import { getRiskLevel } from "@/lib/riskUtils";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface StudentOverviewSectionProps {
  name: string;
  grade: string;
  districtId?: string | null;
  dateOfBirth?: string | null;
  disabilityCategory: string;
  caseManager: string;
  reviewDate: string;
  riskScore: number;
  riskReasons?: string[];
  studentId?: string;
}

export function StudentOverviewSection({
  name, grade, districtId, dateOfBirth, disabilityCategory,
  caseManager, reviewDate, riskScore, riskReasons = [], studentId,
}: StudentOverviewSectionProps) {
  const router = useRouter();
  const [recalculating, setRecalculating] = useState(false);
  const [currentScore,   setCurrentScore]   = useState(riskScore);
  const [currentReasons, setCurrentReasons] = useState(riskReasons);

  const level   = getRiskLevel(currentScore);
  const factors = currentReasons;

  async function handleRecalculate() {
    if (!studentId) return;
    setRecalculating(true);
    try {
      const res  = await fetch("/api/recalculate-compliance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json();
      if (res.ok) { setCurrentScore(json.score); setCurrentReasons(json.reasons); router.refresh(); }
    } finally { setRecalculating(false); }
  }

  const fields: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Name",          value: name },
    { label: "Grade",         value: grade },
    { label: "Disability",    value: disabilityCategory },
    { label: "Case Manager",  value: caseManager },
    { label: "Review Date",   value: reviewDate },
    { label: "District ID",   value: districtId ?? null },
    { label: "Date of Birth", value: dateOfBirth ?? null },
  ];

  return (
    <Card>
      <h2 className="text-sm font-semibold text-espresso-noir mb-4">Student Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
        {fields.filter(f => f.value).map(({ label, value }) => (
          <div key={label}>
            <p className="text-stone-500 font-medium">{label}</p>
            <p className="text-espresso-noir mt-0.5">{value}</p>
          </div>
        ))}
        <div>
          <p className="text-stone-500 font-medium">Compliance Risk</p>
          <div className="mt-1 flex items-center gap-2">
            <RiskBadge level={level} large />
            <span className="text-xs text-stone-400">{currentScore}/100</span>
          </div>
        </div>
      </div>

      {factors.length > 0 && (
        <div className="border-t border-sand pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-mocha" />
              <p className="text-sm font-medium text-espresso-noir">Compliance Flags</p>
            </div>
            {studentId && (
              <button type="button" onClick={handleRecalculate} disabled={recalculating}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-cold-brew disabled:opacity-50">
                <RefreshCw size={12} className={recalculating ? "animate-spin" : ""} />
                {recalculating ? "Recalculating…" : "Refresh"}
              </button>
            )}
          </div>
          <ul className="space-y-1.5">
            {factors.map((f, i) => (
              <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-mocha shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
