export interface Student {
  id: string;
  name: string;
  grade: string;
  disabilityCategory: string;
  riskScore: number;
  reviewDate: string;
  status: "active" | "review_due" | "compliant";
  caseManager: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  studentName?: string;
  timestamp: string;
}

export interface GoalProgress {
  area: string;
  baseline: number;
  current: number;
  target: number;
  trend: "up" | "down" | "stable";
  status: "on_track" | "at_risk" | "exceeded";
}

export interface ComplianceIssue {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export interface ChartDataItem {
  name: string;
  progress: number;
  target?: number;
}

export const dashboardKpis = {
  totalActiveIeps: 47,
  avgComplianceRisk: 23,
  studentsOffTrack: 5,
  upcomingReviews: 12,
};

export const goalProgressChartData = [
  { name: "Reading", progress: 72, target: 80 },
  { name: "Math", progress: 65, target: 75 },
  { name: "Writing", progress: 88, target: 85 },
  { name: "Social/Emotional", progress: 54, target: 70 },
  { name: "Communication", progress: 91, target: 90 },
];

export const complianceRiskDistribution = [
  { name: "Low (0-25%)", value: 28, color: "#22c55e" },
  { name: "Medium (26-50%)", value: 12, color: "#eab308" },
  { name: "High (51%+)", value: 7, color: "#ef4444" },
];

export const recentActivities: Activity[] = [
  { id: "1", type: "goal_updated", description: "Reading goal progress updated to 72%", studentName: "Alex Johnson", timestamp: "2 hours ago" },
  { id: "2", type: "review_scheduled", description: "Annual review scheduled for March 15", studentName: "Maria Garcia", timestamp: "4 hours ago" },
  { id: "3", type: "compliance_alert", description: "Documentation deadline approaching", studentName: "Jordan Smith", timestamp: "5 hours ago" },
  { id: "4", type: "parent_summary", description: "Parent summary generated and sent", studentName: "Taylor Williams", timestamp: "Yesterday" },
  { id: "5", type: "iep_approved", description: "IEP approved by administrator", studentName: "Casey Brown", timestamp: "Yesterday" },
];

// Student list now comes from Supabase (see students page). Student interface kept for profile/overview.

export const studentGoals: GoalProgress[] = [
  { area: "Reading Comprehension", baseline: 45, current: 72, target: 80, trend: "up", status: "on_track" },
  { area: "Written Expression", baseline: 38, current: 65, target: 75, trend: "up", status: "at_risk" },
  { area: "Math Problem Solving", baseline: 52, current: 88, target: 85, trend: "up", status: "exceeded" },
];

export const goalProgressLineData = [
  { month: "Sep", value: 45 },
  { month: "Oct", value: 52 },
  { month: "Nov", value: 58 },
  { month: "Dec", value: 62 },
  { month: "Jan", value: 68 },
  { month: "Feb", value: 72 },
];

export const complianceIssues: ComplianceIssue[] = [
  { id: "1", title: "Missing parent signature on consent form", severity: "high", suggestion: "Send consent form via email and follow up with a phone call within 48 hours." },
  { id: "2", title: "Progress report due in 5 days", severity: "medium", suggestion: "Complete progress report using the template and submit before the deadline." },
  { id: "3", title: "Annual review documentation incomplete", severity: "medium", suggestion: "Gather assessment data and draft present levels of performance." },
  { id: "4", title: "Service log missing for 2 sessions", severity: "low", suggestion: "Backfill service logs from your calendar and notes." },
];

export const parentSummaryMock = `Dear Parent or Guardian,

We are pleased to share a summary of your child's progress and current educational plan.

**Current Focus Areas**
Your child is making meaningful progress in reading and math. Our team has been working on building comprehension skills and number sense. We have seen growth in both areas this semester.

**Goals and Progress**
• Reading: Your child is working toward reading at grade level. Current data shows they are about 72% of the way to their annual goal.
• Math: Strong progress in problem-solving. They have already met their target in this area.
• Writing: We are continuing to support sentence structure and organization. Progress is on track.

**Services and Support**
Your child receives small-group instruction in reading and math, as well as support in the general education classroom. We meet regularly to review progress and adjust as needed.

**Next Steps**
We have an annual review scheduled for March 15. You will receive an invitation to attend. Please reach out if you have any questions before then.

Sincerely,
The IEP Team`;
