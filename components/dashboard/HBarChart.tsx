"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/lib/state/ThemeContext";

export interface HBarDatum {
  label: string;
  value: number;
  color: string;
}

interface HBarChartProps {
  bars: HBarDatum[];
}

/** Horizontal bar chart used for "Late — Top Suppliers". */
export function HBarChart({ bars }: HBarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const labelColor = isDark ? "#64748b" : "#94a3b8";
  const fixedH = Math.max(bars.length * 32, 80);

  return (
    <div style={{ position: "relative", height: fixedH, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <XAxis type="number" tick={{ fill: labelColor, fontSize: 10 }} axisLine={{ stroke: gridColor }} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: labelColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            cursor={{ fill: gridColor }}
            formatter={(value) => [`${Number(value) || 0} orders`, ""]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text)" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {bars.map((b, i) => (
              <Cell key={i} fill={b.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
