"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { useTheme } from "@/lib/state/ThemeContext";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel: string | number;
}

/** Doughnut chart with a center total label and a legend column, matching the legacy ChartJsDoughnut + DonutLegend pair. */
export function DonutChart({ segments, centerLabel }: DonutChartProps) {
  const { theme } = useTheme();
  const total = segments.reduce((s, sg) => s + (sg.value || 0), 0);
  const cardColor = theme === "dark" ? "#111827" : "#ffffff";
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
        {total > 0 ? (
          <PieChart width={96} height={96}>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={31}
              outerRadius={46}
              stroke={cardColor}
              strokeWidth={3}
              isAnimationActive
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} (${total ? Math.round((value / total) * 100) : 0}%)`, name]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--text)" }}
            />
          </PieChart>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-bold font-mono text-base" style={{ color: "var(--text)" }}>
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {visible.length === 0 && (
          <span className="text-xs italic" style={{ color: "var(--muted)" }}>
            No data
          </span>
        )}
        {visible.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="truncate" style={{ color: "var(--muted)", fontSize: "10.5px" }}>
              {s.label}
            </span>
            <span className="ml-auto font-mono font-bold flex-shrink-0" style={{ color: s.color, fontSize: "11px" }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
