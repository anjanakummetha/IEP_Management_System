"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineDataItem {
  month: string;
  value: number;
}

interface GoalProgressLineChartProps {
  data: LineDataItem[];
}

export function GoalProgressLineChart({ data }: GoalProgressLineChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}
            formatter={(value: number) => [`${value}%`, "Progress"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Progress"
            stroke="#584738"
            strokeWidth={2}
            dot={{ fill: "#584738", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
