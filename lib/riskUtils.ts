export type RiskLevel = "low" | "medium" | "high";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function getRiskFactors(riskScore: number, reviewDate: string): string[] {
  const factors: string[] = [];
  const daysUntilReview = Math.ceil(
    (new Date(reviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilReview < 0) {
    factors.push(`Review overdue by ${Math.abs(daysUntilReview)} days`);
  } else if (daysUntilReview <= 30) {
    factors.push(`Review due in ${daysUntilReview} days`);
  }
  if (riskScore >= 50) factors.push("No progress update logged in 45+ days");
  if (riskScore >= 25) factors.push("Goal missing measurable baseline data");
  return factors;
}
