import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoarExecutions } from "@/hooks/useSoarPlaybooks";
import type { SOARExecution } from "@/services/soarApi";

interface PlaybookExecutionStatusProps {
  alertId?: string;
  playbookId?: string;
  limit?: number;
}

export function PlaybookExecutionStatus({ 
  alertId, 
  playbookId, 
  limit = 10 
}: PlaybookExecutionStatusProps) {
  const { executions, isLoading } = useSoarExecutions({
    alert_id: alertId,
    playbook_id: playbookId,
  });

  const statusIcons = {
    success: CheckCircle,
    failed: XCircle,
    pending: Clock,
    running: Loader2,
  };

  const statusStyles = {
    success: "text-primary",
    failed: "text-destructive",
    pending: "text-muted-foreground",
    running: "text-warning animate-spin",
  };

  const recentExecutions = executions.slice(0, limit);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentExecutions.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center p-4">
            No executions found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentExecutions.map((execution) => {
            const StatusIcon = statusIcons[execution.status];
            const playbookName = execution.soar_playbooks?.name || "Unknown Playbook";
            const alertTitle = execution.alerts?.title || "Unknown Alert";
            
            return (
              <div
                key={execution.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <StatusIcon
                  className={cn(
                    "h-5 w-5 mt-0.5 shrink-0",
                    statusStyles[execution.status]
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{playbookName}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        execution.status === "success" && "bg-primary/10 text-primary",
                        execution.status === "failed" && "bg-destructive/10 text-destructive",
                        execution.status === "running" && "bg-warning/10 text-warning"
                      )}
                    >
                      {execution.status}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {execution.triggered_by}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Alert: {alertTitle}
                  </p>
                  {execution.result?.message && (
                    <p className="text-xs text-muted-foreground">
                      {execution.result.message}
                    </p>
                  )}
                  {execution.error_message && (
                    <p className="text-xs text-destructive mt-1">
                      Error: {execution.error_message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(execution.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}



