import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  X,
  BarChart3,
  TrendingUp,
  Info,
  Brain,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dataSourcesApi } from "@/services/dataSourcesApi";
import { modelsApi } from "@/services/modelsApi";

interface ProcessedRow {
  row_number: number;
  user_id: string;
  timestamp: string;
  action: string;
  source_ip: string;
  resource: string;
  status: string;
  anomaly_score: number;
  is_anomaly: boolean;
  processed_at: string;
}

interface ProcessingStats {
  totalRows: number;
  processedRows: number;
  anomaliesDetected: number;
  averageAnomalyScore: number;
  processingRate: number;
}

interface LogstashProcessorProps {
  dataSourceId: string;
  dataSourceName: string;
  onClose?: () => void;
}

export function LogstashProcessor({ 
  dataSourceId, 
  dataSourceName,
  onClose
}: LogstashProcessorProps) {
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [activeModels, setActiveModels] = useState<Array<{ id: string; name: string; weight: number }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active models
  useEffect(() => {
    const fetchActiveModels = async () => {
      try {
        const models = await modelsApi.getActiveModels();
        setActiveModels(models);
      } catch (error) {
        console.error('Failed to fetch active models:', error);
      }
    };
    fetchActiveModels();
    const interval = setInterval(fetchActiveModels, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch processed rows periodically
  const fetchProcessedRows = useCallback(async () => {
    try {
      const rows = await dataSourcesApi.getProcessedRows(dataSourceId, { limit: 1000 });
      
      // Sort by processed_at descending (newest first)
      const sortedRows = rows.sort((a, b) => 
        new Date(b.processed_at || b.timestamp || 0).getTime() - 
        new Date(a.processed_at || a.timestamp || 0).getTime()
      );

      setProcessedRows(sortedRows);

      // Calculate stats
      if (sortedRows.length > 0) {
        const anomaliesDetected = sortedRows.filter(r => r.is_anomaly).length;
        const avgScore = sortedRows.reduce((sum, r) => sum + (r.anomaly_score || 0), 0) / sortedRows.length / 100; // Convert from 0-100 to 0-1
        
        // Calculate processing rate (rows per second) from last 30 seconds
        const now = Date.now();
        const recentRows = sortedRows.filter(r => {
          const processedTime = new Date(r.processed_at || r.timestamp || 0).getTime();
          return (now - processedTime) < 30000; // Last 30 seconds
        });
        const processingRate = recentRows.length / 30; // Rate per second

        const newStats: ProcessingStats = {
          totalRows: sortedRows.length,
          processedRows: sortedRows.length,
          anomaliesDetected,
          averageAnomalyScore: avgScore,
          processingRate,
        };
        setStats(newStats);
      } else {
        setStats({
          totalRows: 0,
          processedRows: 0,
          anomaliesDetected: 0,
          averageAnomalyScore: 0,
          processingRate: 0,
        });
      }

      // Auto-scroll to top (newest rows)
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error('Failed to fetch processed rows:', error);
    }
  }, [dataSourceId]);

  // Start polling for processed rows
  useEffect(() => {
    // Fetch immediately
    fetchProcessedRows();
    
    // Then fetch every 2 seconds
    fetchIntervalRef.current = setInterval(fetchProcessedRows, 2000);
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchProcessedRows]);

  const progress = stats ? (stats.processedRows / Math.max(stats.totalRows, 1)) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Logstash Processing: {dataSourceName}
                <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">
                  Live
                </Badge>
              </CardTitle>
              {activeModels.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Active Models:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {activeModels.map((model) => (
                      <Badge key={model.id} variant="outline" className="text-xs">
                        {model.name}
                        {activeModels.length > 1 && (
                          <span className="ml-1 text-muted-foreground">({(model.weight * 100).toFixed(0)}%)</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processed: {stats.processedRows} rows
                </span>
                <span className="font-medium">
                  {Math.round(progress)}%
                  <span className="ml-2 text-primary animate-pulse">●</span>
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Anomalies Detected</p>
                <p className="text-2xl font-bold text-destructive mono">
                  {stats.anomaliesDetected}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Anomaly Score</p>
                <p className="text-2xl font-bold mono">
                  {(stats.averageAnomalyScore * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processing Rate</p>
                <p className="text-2xl font-bold mono">
                  {stats.processingRate.toFixed(2)}/s
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Output Analysis */}
      {processedRows.length > 0 && stats && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Model Output Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Anomaly Rate</p>
                <p className="text-xl font-bold">
                  {stats.processedRows > 0 
                    ? ((stats.anomaliesDetected / stats.processedRows) * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.anomaliesDetected} / {stats.processedRows} rows
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Min Score</p>
                <p className="text-xl font-bold">
                  {processedRows.length > 0
                    ? (Math.min(...processedRows.map(r => (r.anomaly_score || 0) / 100)) * 100).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Max Score</p>
                <p className="text-xl font-bold">
                  {processedRows.length > 0
                    ? (Math.max(...processedRows.map(r => (r.anomaly_score || 0) / 100)) * 100).toFixed(1)
                    : '0'}%
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Median Score</p>
                <p className="text-xl font-bold">
                  {processedRows.length > 0
                    ? (() => {
                        const sorted = processedRows.map(r => (r.anomaly_score || 0) / 100).sort((a, b) => a - b);
                        const mid = Math.floor(sorted.length / 2);
                        return (sorted.length % 2 === 0 
                          ? (sorted[mid - 1] + sorted[mid]) / 2 
                          : sorted[mid]) * 100;
                      })().toFixed(1)
                    : '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Rows Table */}
      {processedRows.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Processed Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96" ref={scrollRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Anomaly Score</TableHead>
                    <TableHead className="w-24">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRows.map((row, index) => {
                    const score = (row.anomaly_score || 0) / 100; // Convert from 0-100 to 0-1
                    return (
                      <TableRow key={row.row_number || index}>
                        <TableCell className="font-mono text-xs">
                          {row.row_number || index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.user_id || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.action || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.source_ip || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              row.status === "success"
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {row.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  score < 0.5
                                    ? "bg-primary"
                                    : score < 0.7
                                    ? "bg-orange-500"
                                    : "bg-destructive"
                                )}
                                style={{ width: `${score * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono w-12 text-right">
                              {(score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.is_anomaly ? (
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive border-destructive/30"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Anomaly
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/30"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {processedRows.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Waiting for Logs</h3>
            <p className="text-sm text-muted-foreground">
              Logstash processor is running. Logs will appear here as they are processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

