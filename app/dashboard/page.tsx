import { Card } from "../components/ui/Card";
import { GoalProgressBarChart } from "../components/charts/GoalProgressBarChart";
import { CompliancePieChart } from "../components/charts/CompliancePieChart";
import {
  dashboardKpis,
  goalProgressChartData,
  complianceRiskDistribution,
} from "../data/mockData";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Active IEPs</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardKpis.totalActiveIeps}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg Compliance Risk</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardKpis.avgComplianceRisk}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Students Off Track</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardKpis.studentsOffTrack}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming Reviews</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{dashboardKpis.upcomingReviews}</p>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Goal Progress Overview</h2>
          <GoalProgressBarChart data={goalProgressChartData} />
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Compliance Risk Distribution</h2>
          <CompliancePieChart data={complianceRiskDistribution} />
        </Card>
      </section>

    </div>
  );
}
