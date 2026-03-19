import { cn } from "@/lib/utils";
import { User, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RiskyUser {
  id: string;
  email: string;
  name: string;
  riskScore: number;
  change: number;
  department: string;
  lastActivity: string;
}

interface TopRiskyUsersProps {
  users?: RiskyUser[];
}

const getRiskColor = (score: number) => {
  if (score >= 80) return "text-destructive";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-warning";
  return "text-primary";
};

const getRiskBg = (score: number) => {
  if (score >= 80) return "bg-destructive/10";
  if (score >= 60) return "bg-orange-400/10";
  if (score >= 40) return "bg-warning/10";
  return "bg-primary/10";
};

export function TopRiskyUsers({ users = [] }: TopRiskyUsersProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No risky users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => {
        const lastActivity = user.lastActivity
          ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })
          : "Never";

        return (
          <div
            key={user.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium text-muted-foreground w-5">
              {index + 1}
            </span>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.department} • {lastActivity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user.change !== 0 && (
                <div className="flex items-center gap-1">
                  {user.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-destructive" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-primary" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      user.change > 0 ? "text-destructive" : "text-primary"
                    )}
                  >
                    {user.change > 0 ? "+" : ""}
                    {user.change}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "px-2 py-1 rounded-md font-mono text-sm font-bold",
                  getRiskBg(user.riskScore),
                  getRiskColor(user.riskScore)
                )}
              >
                {user.riskScore}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
