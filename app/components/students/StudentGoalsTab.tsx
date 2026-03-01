"use client";

import { Card } from "@/app/components/ui/Card";
import { GoalProgressLineChart } from "@/app/components/charts/GoalProgressLineChart";
import { studentGoals, goalProgressLineData } from "@/app/data/mockData";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUp className="w-4 h-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
}

function StatusBadge({ status }: { status: "on_track" | "at_risk" | "exceeded" }) {
  const styles = {
    on_track: "bg-emerald-100 text-emerald-800",
    at_risk: "bg-amber-100 text-amber-800",
    exceeded: "bg-blue-100 text-blue-800",
  };
  const labels = { on_track: "On track", at_risk: "At risk", exceeded: "Exceeded" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function StudentGoalsTab() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="p-6 pb-0">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Goals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Goal Area
                </th>
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Baseline
                </th>
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Current
                </th>
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Target
                </th>
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Trend
                </th>
                <th className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium px-6 py-4">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentGoals.map((goal) => (
                <tr key={goal.area} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{goal.area}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{goal.baseline}%</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{goal.current}%</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{goal.target}%</td>
                  <td className="px-6 py-4">
                    <TrendIcon trend={goal.trend} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={goal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Progress Over Time</h2>
        <GoalProgressLineChart data={goalProgressLineData} />
      </Card>
    </div>
  );
}
