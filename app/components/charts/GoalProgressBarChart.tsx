"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartDataItem } from "@/app/data/mockData";

const COLORS = ["#584738", "#B59E7D", "#AAA396", "#CEC1A8", "#F1EADA"];

interface GoalProgressBarChartProps {
  data: ChartDataItem[];
}

export function GoalProgressBarChart({ data }: GoalProgressBarChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}
            formatter={(value: number) => [`${value}%`, "Progress"]}
          />
          <Bar dataKey="progress" name="Progress" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
