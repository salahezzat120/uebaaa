import { cn } from "@/lib/utils";
import { Brain, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useModels } from "@/hooks/useModels";
import { formatDistanceToNow } from "date-fns";

interface Model {
  id: string;
  name: string;
  type: string;
  status: "active" | "training" | "error";
  accuracy: number;
  lastUpdated: string;
}

const statusIcons = {
  active: CheckCircle,
  training: Clock,
  error: AlertCircle,
};

const statusStyles = {
  active: "text-primary",
  training: "text-warning",
  error: "text-destructive",
};

export function ModelStatus() {
  const { models, isLoading } = useModels();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get active models only, limit to top 4
  const activeModels = (models || [])
    .filter(m => m.enabled)
    .slice(0, 4)
    .map(model => {
      const lastUpdated = model.updated_at
        ? formatDistanceToNow(new Date(model.updated_at), { addSuffix: true })
        : "Unknown";

      return {
        id: model.id,
        name: model.name,
        type: model.type || "Anomaly Detection",
        status: model.enabled ? ("active" as const) : ("error" as const),
        accuracy: model.accuracy || 0,
        lastUpdated,
      };
    });

  if (activeModels.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No active models</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeModels.map((model) => {
        const StatusIcon = statusIcons[model.status];
        return (
          <div
            key={model.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="p-2 rounded-lg bg-accent/10">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{model.name}</p>
                <StatusIcon
                  className={cn("h-4 w-4 shrink-0", statusStyles[model.status])}
                />
              </div>
              <p className="text-xs text-muted-foreground">{model.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-medium text-primary">
                {model.accuracy.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">{model.lastUpdated}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
