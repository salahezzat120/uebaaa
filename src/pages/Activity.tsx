import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Download,
  User,
  Shield,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityLogs } from "@/hooks/useActivityLogs";

const typeIcons = {
  auth: User,
  config: Settings,
  alert: AlertTriangle,
  model: Shield,
  data: Database,
};

const typeLabels = {
  auth: "Authentication",
  config: "Configuration",
  alert: "Alert",
  model: "Model",
  data: "Data Source",
};

const statusIcons = {
  success: CheckCircle,
  warning: Clock,
  error: AlertTriangle,
};

const statusStyles = {
  success: "text-primary",
  warning: "text-warning",
  error: "text-destructive",
};

export default function Activity() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { logs, isLoading, error } = useActivityLogs({
    type: selectedType,
    status: selectedStatus,
    search: searchQuery || undefined,
  });

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).replace(',', '');
    } catch {
      return timestamp;
    }
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit trail of all platform actions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="config">Configuration</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="data">Data Source</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading activity logs...</span>
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive">Error loading activity logs: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No activity logs found</p>
            </div>
          )}

          {!isLoading && !error && logs.length > 0 && (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const TypeIcon = typeIcons[log.type];
                const StatusIcon = statusIcons[log.status];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-secondary shrink-0">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[log.type]}
                        </Badge>
                        {log.target && (
                          <Badge variant="secondary" className="text-xs">
                            {log.target}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        by <span className="text-foreground">{log.actor}</span>
                      </p>
                      {log.details && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusIcon
                        className={cn("h-4 w-4", statusStyles[log.status])}
                      />
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
