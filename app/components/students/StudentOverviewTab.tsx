import { Card } from "@/app/components/ui/Card";
import type { Student } from "@/app/data/mockData";

interface StudentOverviewTabProps {
  student: Student;
}

export function StudentOverviewTab({ student }: StudentOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Student Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 font-medium">Name</dt>
            <dd className="text-slate-800 mt-0.5">{student.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Grade</dt>
            <dd className="text-slate-800 mt-0.5">{student.grade}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Disability Category</dt>
            <dd className="text-slate-800 mt-0.5">{student.disabilityCategory}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Case Manager</dt>
            <dd className="text-slate-800 mt-0.5">{student.caseManager}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Review Date</dt>
            <dd className="text-slate-800 mt-0.5">{student.reviewDate}</dd>
          </div>
          <div>
            <dt className="text-slate-500 font-medium">Compliance Risk Score</dt>
            <dd className="text-slate-800 mt-0.5">{student.riskScore}%</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Quick Stats (Mock)</h2>
        <p className="text-sm text-slate-700">Overview placeholder. Goals and compliance data appear in their tabs.</p>
      </Card>
    </div>
  );
}
