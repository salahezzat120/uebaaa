import { cn } from "@/lib/utils";

interface ThreatCategory {
  name: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
  percentage: number;
}

interface ThreatMapProps {
  threats?: ThreatCategory[];
}

const severityColors = {
  critical: "bg-destructive",
  high: "bg-orange-400",
  medium: "bg-warning",
  low: "bg-primary",
};

export function ThreatMap({ threats = [] }: ThreatMapProps) {
  if (threats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No threat data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threats.map((threat) => (
        <div key={threat.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{threat.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{threat.count}</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  threat.severity === "critical" && "bg-destructive/20 text-destructive",
                  threat.severity === "high" && "bg-orange-400/20 text-orange-400",
                  threat.severity === "medium" && "bg-warning/20 text-warning",
                  threat.severity === "low" && "bg-primary/20 text-primary"
                )}
              >
                {threat.severity}
              </span>
            </div>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                severityColors[threat.severity]
              )}
              style={{ width: `${threat.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
