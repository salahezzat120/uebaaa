import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, User, Server } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  user?: string;
  entity?: string;
  timestamp: string;
}

interface AlertsTimelineProps {
  alerts?: Alert[];
}

const severityStyles = {
  critical: "border-destructive bg-destructive/5",
  high: "border-orange-400 bg-orange-400/5",
  medium: "border-warning bg-warning/5",
  low: "border-primary bg-primary/5",
};

const severityDotStyles = {
  critical: "bg-destructive",
  high: "bg-orange-400",
  medium: "bg-warning",
  low: "bg-primary",
};

const typeIcons = {
  account_compromise: User,
  insider_threat: AlertTriangle,
  entity_anomaly: Server,
  policy_violation: Shield,
};

export function AlertsTimeline({ alerts = [] }: AlertsTimelineProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No recent alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const alertType = alert.type as keyof typeof typeIcons;
        const Icon = typeIcons[alertType] || AlertTriangle;
        const severity = alert.severity || "medium";
        const timestamp = alert.timestamp
          ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
          : "Unknown";

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border-l-2 transition-colors hover:bg-secondary/50 cursor-pointer",
              severityStyles[severity]
            )}
          >
            <div className="relative mt-0.5">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  severityDotStyles[severity]
                )}
              />
              {severity === "critical" && (
                <div
                  className={cn(
                    "absolute inset-0 h-2 w-2 rounded-full animate-ping",
                    severityDotStyles[severity]
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">
                  {alert.user || alert.entity || "System"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {timestamp}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
