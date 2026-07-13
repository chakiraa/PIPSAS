"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/lib/state/ThemeContext";

export interface WeeklyBarDatum {
  label: string;
  value: number;
  color: string;
}

interface WeeklyBarChartProps {
  bars: WeeklyBarDatum[];
}

/** Vertical bar chart used for "Upcoming Deliveries" (W+0..W+3 buckets). */
export function WeeklyBarChart({ bars }: WeeklyBarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div style={{ position: "relative", height: 120, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="label" tick={{ fill: labelColor, fontSize: 10 }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fill: labelColor, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: gridColor }}
            formatter={(value: number) => [`${value} orders`, ""]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text)" }}
          />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={36}>
            {bars.map((b, i) => (
              <Cell key={i} fill={b.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
