export interface ComplianceInput {
  iepEndDate: string | null;
  iepStartDate: string | null;
  goals: Array<{ baseline: string | null; target: string | null }>;
  services: Array<unknown>;
  lastProgressNoteDate: string | null;
  aiFlags: string[];
}

export interface ComplianceResult {
  score: number;
  reasons: string[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const now = () => Date.now();

/** Calculates IDEA compliance risk score (0–100) and specific reasons. */
export function calculateCompliance(input: ComplianceInput): ComplianceResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. IEP annual review overdue / approaching
  if (input.iepEndDate) {
    const daysFromNow = Math.floor(
      (new Date(input.iepEndDate).getTime() - now()) / MS_PER_DAY
    );
    if (daysFromNow < 0) {
      const overdue = Math.abs(daysFromNow);
      reasons.push(
        `Annual IEP review is overdue by ${overdue} day${overdue === 1 ? "" : "s"}`
      );
      score += 35;
    } else if (daysFromNow <= 30) {
      reasons.push(`Annual IEP review due in ${daysFromNow} day${daysFromNow === 1 ? "" : "s"}`);
      score += 15;
    }
  } else {
    reasons.push("IEP end date is not documented");
    score += 20;
  }

  // 2. No progress notes in 60+ days
  if (input.lastProgressNoteDate) {
    const daysSince = Math.floor(
      (now() - new Date(input.lastProgressNoteDate).getTime()) / MS_PER_DAY
    );
    if (daysSince > 60) {
      reasons.push(`No progress update in ${daysSince} days — IDEA requires regular monitoring`);
      score += 15;
    }
  } else {
    reasons.push("No progress notes have been recorded for this student");
    score += 15;
  }

  // 3. No goals
  if (input.goals.length === 0) {
    reasons.push("IEP has no measurable goals documented");
    score += 35;
  } else {
    // 4. Goals missing baseline or target
    const missing = input.goals.filter((g) => !g.baseline || !g.target).length;
    if (missing > 0) {
      reasons.push(
        `${missing} goal${missing > 1 ? "s" : ""} missing measurable baseline or target`
      );
      score += Math.min(20, missing * 10);
    }
  }

  // 5. No services / accommodations
  if (input.services.length === 0) {
    reasons.push("No services or accommodations documented on IEP");
    score += 20;
  }

  // 6. AI-detected flags (up to 3, 10 pts each)
  for (const flag of input.aiFlags.slice(0, 3)) {
    reasons.push(flag);
    score += 10;
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

/** Maps a 0–100 score to a risk level label. */
export function getRiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}
