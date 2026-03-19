import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "text-foreground",
  success: "text-primary",
  warning: "text-warning",
  danger: "text-destructive",
};

const iconBgStyles = {
  default: "bg-secondary",
  success: "bg-primary/10",
  warning: "bg-warning/10",
  danger: "bg-destructive/10",
};

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
}: StatsCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold mt-1 mono", variantStyles[variant])}>
            {value}
          </p>
        </div>
        <div
          className={cn(
            "p-3 rounded-lg transition-colors",
            iconBgStyles[variant],
            "group-hover:scale-110 transition-transform"
          )}
        >
          <Icon className={cn("h-5 w-5", variantStyles[variant])} />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-destructive" />
          ) : (
            <TrendingDown className="h-4 w-4 text-primary" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-destructive" : "text-primary"
            )}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
          <span className="text-sm text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
