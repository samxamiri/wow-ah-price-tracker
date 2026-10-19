import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint, PriceRange } from "../types";
import { formatGold, formatGoldShort } from "../utils/money";

interface Props {
  points: PricePoint[];
  range: PriceRange;
}

function formatTime(iso: string, range: PriceRange): string {
  const d = new Date(iso);
  return range === "24h"
    ? d.toLocaleTimeString([], { hour: "numeric" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function PriceChart({ points, range }: Props) {
  if (points.length === 0) {
    return <p className="muted">No price history yet.</p>;
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(t: string) => formatTime(t, range)}
            stroke="var(--text-muted)"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={formatGoldShort}
            stroke="var(--text-muted)"
            width={70}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value: number) => formatGold(value)}
            labelFormatter={(t: string) => new Date(t).toLocaleString()}
            contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="minPrice"
            name="Lowest price"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="movingAvg24h"
            name="24h average"
            stroke="var(--series-2)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
