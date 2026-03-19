import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Activity,
  X,
  BarChart3,
  TrendingUp,
  Info,
  Brain,
} from "lucide-react";
import { CSVProcessor, type ProcessedRow, type ProcessingStats } from "@/services/csvProcessor";
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

interface RealTimeProcessorProps {
  csvFile: File | null;
  onComplete?: () => void;
  autoStart?: boolean;
  autoStartDelay?: number; // milliseconds to wait before auto-start
  onClose?: () => void; // Optional callback to close/hide processor
}

export function RealTimeProcessor({ 
  csvFile, 
  onComplete, 
  autoStart = false,
  autoStartDelay = 500,
  onClose
}: RealTimeProcessorProps) {
  const [processor] = useState(() => new CSVProcessor());
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [rowsPerSecond, setRowsPerSecond] = useState(1);
  const [activeModels, setActiveModels] = useState<Array<{ id: string; name: string; weight: number }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFileSizeRef = useRef<number>(0);
  const lastModifiedRef = useRef<number>(0);
  const hasAutoStartedRef = useRef(false);

  // Define handleStart before useEffect to avoid initialization order issue
  const handleStart = useCallback(async () => {
    if (!csvFile) return;
    
    setIsProcessing(true);
    
    try {
      // Ensure CSV is loaded
      const currentStats = processor.getStats();
      if (currentStats.totalRows === 0) {
        await processor.loadCSV(csvFile);
      }
      // Start processing - will continue automatically until all rows are done
      await processor.startProcessing(rowsPerSecond);
    } catch (error) {
      console.error("Failed to start processing:", error);
      setIsProcessing(false);
    }
  }, [csvFile, processor, rowsPerSecond]);

  const handleResume = useCallback(async () => {
    if (!csvFile) return;
    
    setIsProcessing(true);
    try {
      // Resume from current position - processing will continue automatically
      await processor.startProcessing(rowsPerSecond);
    } catch (error) {
      console.error("Failed to resume processing:", error);
      setIsProcessing(false);
    }
  }, [csvFile, processor, rowsPerSecond]);

  // Fetch active models on mount and periodically
  useEffect(() => {
    const fetchActiveModels = async () => {
      try {
        const { modelsApi } = await import('../../services/modelsApi');
        const models = await modelsApi.getActiveModels();
        setActiveModels(models);
        console.log(`✅ Loaded ${models.length} active model(s): ${models.map(m => m.name).join(', ')}`);
      } catch (error) {
        console.error('Failed to fetch active models:', error);
        setActiveModels([]);
      }
    };
    
    // Fetch immediately
    fetchActiveModels();
    
    // Refresh every 10 seconds to pick up model changes
    const interval = setInterval(fetchActiveModels, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (csvFile) {
      // Check if file is new or updated
      const isNewFile = lastFileSizeRef.current === 0;
      const isUpdated = !isNewFile && (
        csvFile.size !== lastFileSizeRef.current || 
        csvFile.lastModified !== lastModifiedRef.current
      );
      
      if (isNewFile || isUpdated) {
        // Stop current processing if running
        if (isProcessing) {
          processor.stopProcessing();
          setIsProcessing(false);
        }
        
        // Reset processor for new/updated file
        processor.reset();
        setProcessedRows([]);
        setStats(null);
        hasAutoStartedRef.current = false;
        
        // Update file tracking
        lastFileSizeRef.current = csvFile.size;
        lastModifiedRef.current = csvFile.lastModified;
        
        // Load CSV
        processor.loadCSV(csvFile).then(() => {
          // Auto-start if enabled
          if (autoStart) {
            hasAutoStartedRef.current = true;
            setTimeout(() => {
              handleStart();
            }, autoStartDelay);
          }
        }).catch(console.error);
      }
    }

    processor.setCallbacks({
      onRowProcessed: (row) => {
        setProcessedRows((prev) => [...prev, row]);
        // Log model usage for verification (first few rows)
        if (processedRows.length < 3) {
          console.log(`📊 Row ${processedRows.length + 1} processed - Check backend logs above to see which models were used`);
        }
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onComplete: async () => {
        setIsProcessing(false);
        
        // Save processed rows to database if we have a data source ID
        const currentDataSourceId = (csvFile as any)?._dataSourceId;
        // Get processed rows directly from processor (more reliable than state)
        const processorRows = processor.getProcessedRows();
        const rowsToSaveData = processorRows.length > 0 ? processorRows : processedRows;
        
        if (currentDataSourceId && rowsToSaveData.length > 0) {
          try {
            console.log(`💾 Saving ${rowsToSaveData.length} processed rows to database...`);
            console.log(`   Data source ID: ${currentDataSourceId}`);
            const { dataSourcesApi } = await import('../../services/dataSourcesApi');
            
            // Transform processed rows to match database schema
            const rowsToSave = rowsToSaveData.map((row, index) => ({
              row_number: row.rowNumber || (index + 1),
              user_id: row.user_id || null,
              timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : null,
              action: row.action || null,
              source_ip: row.source_ip || null,
              resource: row.resource || null,
              status: row.status || null,
              anomaly_score: row.anomalyScore ? (row.anomalyScore * 100) : null, // Convert to 0-100 scale
              is_anomaly: row.isAnomaly || false,
              features: row.features || null,
            }));
            
            console.log(`   Sample row to save:`, rowsToSave[0]);
            const result = await dataSourcesApi.saveProcessedRows(currentDataSourceId, rowsToSave);
            console.log(`✅ Successfully saved ${rowsToSaveData.length} rows to database`, result);
          } catch (error: any) {
            console.error('❌ Failed to save processed rows to database:', error);
            console.error('   Error details:', error.message, error.stack);
            // Don't block completion if save fails - data is still in UI
          }
        } else {
          if (!currentDataSourceId) {
            console.warn('⚠️ No data source ID found, cannot save processed rows');
          }
          if (rowsToSaveData.length === 0) {
            console.warn('⚠️ No processed rows to save');
          }
        }
        
        if (onComplete) {
          onComplete();
        }
      },
      onError: (error) => {
        console.error("Processing error:", error);
        setIsProcessing(false);
        hasAutoStartedRef.current = false;
      },
    });

    return () => {
      // Don't stop processing on cleanup - let it continue
      // Only stop if component is unmounting completely
    };
  }, [csvFile, processor, onComplete, autoStart, autoStartDelay, handleStart, isProcessing, processedRows]);

  const handlePause = useCallback(() => {
    processor.stopProcessing();
    setIsProcessing(false);
  }, [processor]);

  const handleStop = useCallback(() => {
    processor.stopProcessing();
    setIsProcessing(false);
    // Don't clear results - keep them visible
    // Just stop the processing
  }, [processor]);

  const progress = stats
    ? (stats.processedRows / stats.totalRows) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Real-Time Processing
                {autoStart && (
                  <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">
                    Auto-Start Enabled
                  </Badge>
                )}
              </CardTitle>
              {activeModels.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Active Models:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {activeModels.map((model, idx) => (
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
              {activeModels.length === 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-warning">No active models found</span>
                </div>
              )}
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">
                Processing Speed: {rowsPerSecond} row{rowsPerSecond !== 1 ? 's' : ''} per second
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={rowsPerSecond}
                onChange={(e) => {
                  const newSpeed = parseFloat(e.target.value);
                  setRowsPerSecond(newSpeed);
                  // Update speed during processing if active
                  if (isProcessing) {
                    processor.updateProcessingSpeed(newSpeed);
                  }
                }}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.1x</span>
                <span>5x</span>
                <span>10x</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isProcessing ? (
                <Button
                  onClick={stats && stats.processedRows > 0 && stats.processedRows < stats.totalRows ? handleResume : handleStart}
                  disabled={!csvFile}
                  className="bg-primary text-primary-foreground"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {stats && stats.processedRows > 0 && stats.processedRows < stats.totalRows ? 'Resume' : 'Start Processing'}
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                onClick={handleStop}
                variant="outline"
                disabled={!isProcessing && (!stats || stats.processedRows === 0)}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>

          {/* Progress - Always show when file is loaded */}
          {csvFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats ? (
                    <>
                      {isProcessing ? (
                        <>Processing: {stats.processedRows} / {stats.totalRows} rows</>
                      ) : stats.processedRows < stats.totalRows ? (
                        <>Paused: {stats.processedRows} / {stats.totalRows} rows</>
                      ) : (
                        <>Complete: {stats.processedRows} / {stats.totalRows} rows</>
                      )}
                    </>
                  ) : (
                    <>Ready to process: {csvFile.name}</>
                  )}
                </span>
                {stats && (
                  <span className="font-medium">
                    {Math.round(progress)}%
                    {isProcessing && (
                      <span className="ml-2 text-primary animate-pulse">●</span>
                    )}
                  </span>
                )}
              </div>
              {stats ? (
                <Progress value={progress} className="h-2" />
              ) : (
                <Progress value={0} className="h-2" />
              )}
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
                  {stats.processingRate.toFixed(1)}/s
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
                  {((stats.anomaliesDetected / stats.processedRows) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.anomaliesDetected} / {stats.processedRows} rows
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Min Score</p>
                <p className="text-xl font-bold">
                  {(Math.min(...processedRows.map(r => r.anomalyScore)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Max Score</p>
                <p className="text-xl font-bold">
                  {(Math.max(...processedRows.map(r => r.anomalyScore)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Median Score</p>
                <p className="text-xl font-bold">
                  {(() => {
                    const sorted = [...processedRows.map(r => r.anomalyScore)].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    return (sorted.length % 2 === 0 
                      ? (sorted[mid - 1] + sorted[mid]) / 2 
                      : sorted[mid]) * 100;
                  })().toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Anomaly Score Distribution
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((bucket) => {
                  const min = bucket * 0.2;
                  const max = (bucket + 1) * 0.2;
                  const count = processedRows.filter(r => 
                    r.anomalyScore >= min && r.anomalyScore < (bucket === 4 ? 1.01 : max)
                  ).length;
                  const percentage = (count / processedRows.length) * 100;
                  const maxCount = Math.max(...[0, 1, 2, 3, 4].map(b => {
                    const m = b * 0.2;
                    const mx = (b + 1) * 0.2;
                    return processedRows.filter(r => 
                      r.anomalyScore >= m && r.anomalyScore < (b === 4 ? 1.01 : mx)
                    ).length;
                  }));
                  
                  return (
                    <div key={bucket} className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {(min * 100).toFixed(0)}-{(max * 100).toFixed(0)}%
                      </div>
                      <div className="relative h-24 bg-secondary/30 rounded overflow-hidden">
                        <div
                          className={cn(
                            "absolute bottom-0 w-full transition-all",
                            bucket <= 2 ? "bg-primary" : bucket === 3 ? "bg-orange-500" : "bg-destructive"
                          )}
                          style={{ 
                            height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-end justify-center pb-1">
                          <span className="text-xs font-bold text-foreground">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Health Insights */}
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Model Health Insights
              </p>
              <div className="space-y-2 text-sm">
                {(() => {
                  const anomalyRate = (stats.anomaliesDetected / stats.processedRows) * 100;
                  const avgScore = stats.averageAnomalyScore * 100;
                  const scoreStdDev = Math.sqrt(
                    processedRows.reduce((sum, r) => 
                      sum + Math.pow(r.anomalyScore - stats.averageAnomalyScore, 2), 0
                    ) / processedRows.length
                  ) * 100;
                  const allScoresHigh = avgScore > 80;
                  const lowVariance = scoreStdDev < 10;
                  const veryHighAnomalyRate = anomalyRate > 80;
                  const veryLowAnomalyRate = anomalyRate < 5;

                  const insights = [];
                  
                  if (veryHighAnomalyRate) {
                    insights.push({
                      type: "warning",
                      text: `⚠️ High anomaly rate (${anomalyRate.toFixed(1)}%). Model may be too sensitive or features don't match training data.`
                    });
                  } else if (veryLowAnomalyRate && avgScore < 30) {
                    insights.push({
                      type: "success",
                      text: `✅ Low anomaly rate (${anomalyRate.toFixed(1)}%). Model appears to be working well.`
                    });
                  }

                  if (allScoresHigh && lowVariance) {
                    insights.push({
                      type: "warning",
                      text: `⚠️ All scores are very high with low variance. Check if feature extraction matches model training.`
                    });
                  }

                  if (avgScore > 90) {
                    insights.push({
                      type: "error",
                      text: `❌ Average score is ${avgScore.toFixed(1)}%. Model may need threshold adjustment or retraining.`
                    });
                  } else if (avgScore < 40 && anomalyRate < 20) {
                    insights.push({
                      type: "success",
                      text: `✅ Model is showing good discrimination with average score of ${avgScore.toFixed(1)}%.`
                    });
                  }

                  if (scoreStdDev > 30) {
                    insights.push({
                      type: "info",
                      text: `ℹ️ High score variance (${scoreStdDev.toFixed(1)}%). Model is distinguishing between patterns.`
                    });
                  }

                  if (insights.length === 0) {
                    insights.push({
                      type: "info",
                      text: `ℹ️ Processing ${stats.processedRows} rows with ${stats.anomaliesDetected} anomalies detected (${anomalyRate.toFixed(1)}%). Average score: ${avgScore.toFixed(1)}%.`
                    });
                  }

                  return insights.map((insight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg text-xs",
                        insight.type === "success" && "bg-primary/10 text-primary border border-primary/20",
                        insight.type === "warning" && "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                        insight.type === "error" && "bg-destructive/10 text-destructive border border-destructive/20",
                        insight.type === "info" && "bg-secondary/50 text-muted-foreground"
                      )}
                    >
                      {insight.text}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Normal vs Anomaly Breakdown */}
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Normal Rows</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary/30 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-primary h-full flex items-center justify-center text-xs font-bold text-primary-foreground transition-all"
                        style={{ 
                          width: `${((stats.processedRows - stats.anomaliesDetected) / stats.processedRows) * 100}%`
                        }}
                      >
                        {stats.processedRows - stats.anomaliesDetected}
                      </div>
                    </div>
                    <span className="text-sm font-bold w-12 text-right">
                      {(((stats.processedRows - stats.anomaliesDetected) / stats.processedRows) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Anomaly Rows</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary/30 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-destructive h-full flex items-center justify-center text-xs font-bold text-white transition-all"
                        style={{ 
                          width: `${(stats.anomaliesDetected / stats.processedRows) * 100}%`
                        }}
                      >
                        {stats.anomaliesDetected}
                      </div>
                    </div>
                    <span className="text-sm font-bold w-12 text-right text-destructive">
                      {((stats.anomaliesDetected / stats.processedRows) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Rows Table */}
      {processedRows.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Processed Rows</CardTitle>
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
                  {processedRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="font-mono text-sm">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell className="text-sm">{row.user_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.source_ip}
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
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                row.anomalyScore > 0.7
                                  ? "bg-destructive"
                                  : row.anomalyScore > 0.5
                                  ? "bg-orange-400"
                                  : "bg-primary"
                              )}
                              style={{ width: `${row.anomalyScore * 100}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs font-mono font-bold w-12 text-right",
                              row.anomalyScore > 0.7
                                ? "text-destructive"
                                : row.anomalyScore > 0.5
                                ? "text-orange-400"
                                : "text-primary"
                            )}
                          >
                            {(row.anomalyScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.isAnomaly ? (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Anomaly
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 bg-primary/10 text-primary"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Normal
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isProcessing && processedRows.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing processing...</p>
            <p className="text-xs text-muted-foreground mt-2">Loading model and preparing data...</p>
          </CardContent>
        </Card>
      )}

      {/* Status when not processing but has results */}
      {!isProcessing && processedRows.length > 0 && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Processing Complete</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {stats?.processedRows || processedRows.length} rows processed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
