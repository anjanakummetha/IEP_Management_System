"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { complianceIssues } from "@/app/data/mockData";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const COMPLIANCE_RISK_SCORE = 32;

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const styles = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styles[severity])}>
      {severity}
    </span>
  );
}

function FlaggedIssueItem({
  title,
  severity,
  suggestion,
}: {
  title: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-slate-800">{title}</h3>
          <div className="mt-2">
            <SeverityBadge severity={severity} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Suggestion</p>
          <p className="text-sm text-slate-700 mt-1">{suggestion}</p>
        </div>
      )}
    </div>
  );
}

export function StudentComplianceTab() {
  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center justify-center py-12">
        <div
          className="relative w-40 h-40 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(#584738 0% ${COMPLIANCE_RISK_SCORE}%, #e2e8f0 ${COMPLIANCE_RISK_SCORE}% 100%)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center flex-col">
            <span className="text-2xl font-bold text-slate-800">{COMPLIANCE_RISK_SCORE}%</span>
            <span className="text-xs text-slate-500 mt-0.5">Risk</span>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">Compliance Risk Score: {COMPLIANCE_RISK_SCORE}%</p>
      </Card>
      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Flagged Issues</h2>
        <ul className="space-y-3">
          {complianceIssues.map((issue) => (
            <li key={issue.id}>
              <FlaggedIssueItem title={issue.title} severity={issue.severity} suggestion={issue.suggestion} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
