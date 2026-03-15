"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface Series {
  key: string;
  label: string;
  color: string;
  data: DataPoint[];
}

interface AnalyticsChartProps {
  series: Series[];
  type?: "bar" | "line";
  height?: number;
}

function mergeSeriesData(series: Series[]) {
  const map: Record<string, Record<string, string | number>> = {};
  for (const s of series) {
    for (const point of s.data) {
      if (!map[point.date]) map[point.date] = { date: point.date };
      map[point.date][s.key] = point.count;
    }
  }
  return Object.values(map).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

export function AnalyticsChart({ series, type = "line", height = 260 }: AnalyticsChartProps) {
  const data = mergeSeriesData(series);
  const ChartComponent = type === "bar" ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip />
        {series.length > 1 && <Legend />}
        {series.map((s) =>
          type === "bar" ? (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          )
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
