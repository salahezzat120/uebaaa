import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RiskChartProps {
  data?: Array<{ time: string; risk: number; alerts: number }>;
}

export function RiskChart({ data = [] }: RiskChartProps) {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p className="text-sm">No trend data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(160, 100%, 50%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(160, 100%, 50%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 15%)" />
        <XAxis
          dataKey="time"
          stroke="hsl(215, 20%, 55%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(215, 20%, 55%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 20%, 8%)",
            border: "1px solid hsl(220, 20%, 15%)",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          }}
          labelStyle={{ color: "hsl(210, 40%, 98%)" }}
        />
        <Area
          type="monotone"
          dataKey="risk"
          stroke="hsl(160, 100%, 50%)"
          strokeWidth={2}
          fill="url(#riskGradient)"
          name="Risk Score"
        />
        <Area
          type="monotone"
          dataKey="alerts"
          stroke="hsl(0, 84%, 60%)"
          strokeWidth={2}
          fill="url(#alertGradient)"
          name="Alerts"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
