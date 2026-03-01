import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/riskUtils";

const styles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const labels: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

interface RiskBadgeProps {
  level: RiskLevel;
  large?: boolean;
}

export function RiskBadge({ level, large }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        large ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs",
        styles[level]
      )}
    >
      {labels[level]}
    </span>
  );
}
