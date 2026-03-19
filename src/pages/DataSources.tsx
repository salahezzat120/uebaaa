import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Upload,
  Server,
  Cloud,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Plus,
  Activity,
  HardDrive,
  Loader2,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataSources } from "@/hooks/useDataSources";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RealTimeProcessor } from "@/components/dataSources/RealTimeProcessor";
import { LogstashProcessor } from "@/components/dataSources/LogstashProcessor";

const typeIcons = {
  csv: FileText,
  logstash: Activity,
  api: Cloud,
  database: Database,
};

const typeLabels = {
  csv: "CSV Upload",
  logstash: "Logstash",
  api: "REST API",
  database: "Database",
};

const statusStyles = {
  connected: "bg-primary/10 text-primary",
  disconnected: "bg-muted text-muted-foreground",
  syncing: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

const statusIcons = {
  connected: CheckCircle,
  disconnected: XCircle,
  syncing: RefreshCw,
  error: XCircle,
};

export default function DataSources() {
  const {
    dataSources,
    isLoading,
    create,
    connect,
    disconnect,
    sync,
    uploadCSV,
    reprocessCSV,
    delete: deleteSource,
    isCreating,
    isConnecting,
    isSyncing,
    isUploading,
    isReprocessing,
  } = useDataSources();

  // Dialog states
  const [csvDialogOpen, setCSVDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const [processingFile, setProcessingFile] = useState<File | null>(null);
  const [showLogstashProcessor, setShowLogstashProcessor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [csvName, setCSVName] = useState("");
  const [sourceType, setSourceType] = useState<"logstash" | "api" | "database">("logstash");
  const [sourceName, setSourceName] = useState("");
  const [logstashEndpoint, setLogstashEndpoint] = useState("");
  const [indexPattern, setIndexPattern] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [dbConnectionString, setDbConnectionString] = useState("");
  const [dbType, setDbType] = useState("postgres");

  // Calculate totals from all data sources
  const totalRecords = dataSources.reduce((acc, ds) => {
    const records = ds.records || 0;
    return acc + records;
  }, 0);
  
  const totalEventsPerSec = dataSources.reduce((acc, ds) => {
    const eventsPerSec = ds.eventsPerSec || 0;
    return acc + eventsPerSec;
  }, 0);
  
  const connectedSources = dataSources.filter((ds) => ds.status === "connected").length;
  
  const avgHealth =
    dataSources.length > 0
      ? Math.round(
          dataSources.reduce((acc, ds) => {
            const health = ds.health || 0;
            return acc + health;
          }, 0) / dataSources.length
        )
      : 0;

  // Auto-show Logstash processor when a Logstash source becomes connected
  useEffect(() => {
    if (showLogstashProcessor) return; // Don't auto-show if one is already showing
    
    const connectedLogstashSource = dataSources.find(
      ds => ds.type === 'logstash' && ds.status === 'connected'
    );
    if (connectedLogstashSource) {
      setShowLogstashProcessor(connectedLogstashSource.id);
    }
  }, [dataSources, showLogstashProcessor]);

  const handleCSVUpload = async () => {
    if (!selectedFile || !csvName.trim()) {
      return;
    }
    // Also create the data source first, then start processing
    try {
      const dataSource = await uploadCSV({ name: csvName, file: selectedFile });
      // Attach data source ID to file so processor can save results
      (selectedFile as any)._dataSourceId = dataSource.id;
      
      // Start real-time processing automatically
      setProcessingFile(selectedFile);
      setShowProcessor(true);
      setCSVDialogOpen(false);
      
      // Reset file input for next upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      // Still allow processing even if upload fails
      setProcessingFile(selectedFile);
      setShowProcessor(true);
      setCSVDialogOpen(false);
    }
  };

  // Handle file updates - detect when same file is selected again with updates
  useEffect(() => {
    if (selectedFile && showProcessor && processingFile) {
      // If file changed (size or modification time), update processing file
      if (selectedFile.name === processingFile.name &&
          (selectedFile.size !== processingFile.size ||
           selectedFile.lastModified !== processingFile.lastModified)) {
        setProcessingFile(selectedFile);
      }
    }
  }, [selectedFile, showProcessor, processingFile]);

  const handleProcessingComplete = () => {
    // Don't hide the processor - keep it visible so user can see results
    // Only reset file selection for next upload
    setCSVName("");
    setSelectedFile(null);
    // Keep processingFile and showProcessor true so results stay visible
  };

  const handleReplayCSV = async (dataSourceId: string) => {
    try {
      // Reprocess CSV - downloads file and returns File object
      const result = await reprocessCSV(dataSourceId);
      // Attach data source ID to file
      (result.file as any)._dataSourceId = result.dataSourceId;
      
      // Start processing with the downloaded file
      setProcessingFile(result.file);
      setShowProcessor(true);
      setCSVName(result.fileName.replace('.csv', ''));
    } catch (error) {
      console.error('Failed to replay CSV:', error);
    }
  };

  const handleAddSource = () => {
    if (!sourceName.trim()) return;

    const config: any = {};
    if (sourceType === "logstash") {
      if (!logstashEndpoint.trim()) return;
      config.endpoint = logstashEndpoint;
      config.indexPattern = indexPattern;
    } else if (sourceType === "api") {
      if (!apiEndpoint.trim() || !apiKey.trim()) return;
      config.endpoint = apiEndpoint;
      config.apiKey = apiKey;
    } else if (sourceType === "database") {
      if (!dbConnectionString.trim()) return;
      config.connectionString = dbConnectionString;
    }

    create({
      name: sourceName,
      type: sourceType,
      config,
    });

    setAddDialogOpen(false);
    setSourceName("");
    setLogstashEndpoint("");
    setIndexPattern("");
    setApiEndpoint("");
    setApiKey("");
    setDbConnectionString("");
  };

  if (isLoading && dataSources.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Real-Time Processor - Always show when file is uploaded */}
      {showProcessor && processingFile && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <RealTimeProcessor
            csvFile={processingFile}
            onComplete={handleProcessingComplete}
            autoStart={true}
            autoStartDelay={500}
            onClose={() => {
              setShowProcessor(false);
              setProcessingFile(null);
              setCSVName("");
              setSelectedFile(null);
            }}
          />
        </div>
      )}

      {/* Logstash Processor - Show when Logstash data source is connected */}
      {showLogstashProcessor && (() => {
        const dataSource = dataSources.find(ds => ds.id === showLogstashProcessor);
        if (!dataSource || dataSource.type !== 'logstash') return null;
        return (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <LogstashProcessor
              dataSourceId={dataSource.id}
              dataSourceName={dataSource.name}
              onClose={() => setShowLogstashProcessor(null)}
            />
          </div>
        );
      })()}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage log ingestion and data pipelines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={csvDialogOpen} onOpenChange={setCSVDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload CSV Data</DialogTitle>
                <DialogDescription>
                  Upload historical log data for analysis and model training.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Data Source Name</Label>
                  <Input
                    placeholder="e.g., Q4 Auth Logs"
                    value={csvName}
                    onChange={(e) => setCSVName(e.target.value)}
                  />
                </div>
                  <div className="space-y-2">
                    <Label>CSV File</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check if this is an update to existing file
                          const isUpdate = selectedFile && 
                                          (file.name === selectedFile.name || 
                                           file.size !== selectedFile.size ||
                                           file.lastModified !== selectedFile.lastModified);
                          
                          setSelectedFile(file);
                          if (!csvName.trim()) {
                            setCSVName(file.name.replace(".csv", ""));
                          }
                          
                          // If file is updated and processor is already showing, update it
                          if (isUpdate && showProcessor && processingFile) {
                            setProcessingFile(file);
                          }
                        }
                      }}
                    />
                    {selectedFile && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </p>
                        <p className="text-xs text-primary">
                          Processing will start automatically after upload
                        </p>
                      </div>
                    )}
                  </div>
                <div className="p-4 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Expected columns: user_id, timestamp, action, source_ip, resource, status
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleCSVUpload}
                    disabled={!selectedFile || !csvName.trim() || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Start Real-Time Processing
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    CSV will be processed row-by-row with anomaly detection
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Data Source</DialogTitle>
                <DialogDescription>
                  Connect a new log source or database for real-time monitoring.
                </DialogDescription>
              </DialogHeader>
              <Tabs
                value={sourceType}
                onValueChange={(v) => setSourceType(v as typeof sourceType)}
                className="py-4"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="logstash">Logstash</TabsTrigger>
                  <TabsTrigger value="api">REST API</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                </TabsList>
                <TabsContent value="logstash" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., Production Auth Logs"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logstash Endpoint</Label>
                    <Input
                      placeholder="https://logstash.company.com:5044"
                      value={logstashEndpoint}
                      onChange={(e) => setLogstashEndpoint(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Index Pattern</Label>
                    <Input
                      placeholder="logs-*"
                      value={indexPattern}
                      onChange={(e) => setIndexPattern(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleAddSource}
                    disabled={!sourceName.trim() || !logstashEndpoint.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </TabsContent>
                <TabsContent value="api" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., Security API"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <Input
                      placeholder="https://api.company.com/logs"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleAddSource}
                    disabled={
                      !sourceName.trim() || !apiEndpoint.trim() || !apiKey.trim() || isCreating
                    }
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </TabsContent>
                <TabsContent value="database" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., HR Database"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Database Type</Label>
                    <Select value={dbType} onValueChange={setDbType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mssql">SQL Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Connection String</Label>
                    <Input
                      type="password"
                      placeholder="postgresql://user:pass@host:5432/db"
                      value={dbConnectionString}
                      onChange={(e) => setDbConnectionString(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleAddSource}
                    disabled={!sourceName.trim() || !dbConnectionString.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Sources</p>
                <p className="text-3xl font-bold text-primary mono">
                  {connectedSources}/{dataSources.length}
                </p>
              </div>
              <Server className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold mono">
                  {totalRecords >= 1000000
                    ? `${(totalRecords / 1000000).toFixed(1)}M`
                    : totalRecords >= 1000
                    ? `${(totalRecords / 1000).toFixed(1)}K`
                    : totalRecords.toLocaleString()}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events/Second</p>
                <p className="text-3xl font-bold mono">
                  {totalEventsPerSec > 0
                    ? totalEventsPerSec >= 1
                      ? totalEventsPerSec.toFixed(1)
                      : totalEventsPerSec.toFixed(3)
                    : '0'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Health</p>
                <p className="text-3xl font-bold text-primary mono">{avgHealth}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => {
          const TypeIcon = typeIcons[source.type];
          const StatusIcon = statusIcons[source.status];
          return (
            <Card key={source.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{source.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {typeLabels[source.type]}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-1",
                      statusStyles[source.status]
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "h-3 w-3",
                        source.status === "syncing" && "animate-spin"
                      )}
                    />
                    {source.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Records</p>
                      <p className="text-lg font-bold mono">
                        {source.records > 1000000
                          ? `${(source.records / 1000000).toFixed(1)}M`
                          : source.records > 1000
                          ? `${(source.records / 1000).toFixed(0)}K`
                          : source.records}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Events/sec</p>
                      <p className="text-lg font-bold mono">
                        {source.eventsPerSec > 0
                          ? source.eventsPerSec.toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Health */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Health</span>
                      <span
                        className={cn(
                          "font-medium",
                          source.health >= 90
                            ? "text-primary"
                            : source.health >= 70
                            ? "text-warning"
                            : "text-destructive"
                        )}
                      >
                        {source.health}%
                      </span>
                    </div>
                    <Progress
                      value={source.health}
                      className={cn(
                        "h-1.5",
                        source.health >= 90
                          ? "bg-primary/20"
                          : source.health >= 70
                          ? "bg-warning/20"
                          : "bg-destructive/20"
                      )}
                    />
                  </div>

                  {/* Last sync */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Last sync: {source.lastSync}</span>
                    <div className="flex items-center gap-1">
                      {source.status === "connected" && source.type !== "csv" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => sync(source.id)}
                          disabled={isSyncing}
                          title="Sync now"
                        >
                          <RefreshCw
                            className={cn(
                              "h-3.5 w-3.5",
                              isSyncing && "animate-spin"
                            )}
                          />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {source.status === "connected" ? (
                            <DropdownMenuItem
                              onClick={() => disconnect(source.id)}
                              disabled={isConnecting}
                            >
                              <PowerOff className="h-4 w-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          ) : source.status === "error" ? (
                            <DropdownMenuItem
                              onClick={() => connect(source.id)}
                              disabled={isConnecting}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Reconnect
                            </DropdownMenuItem>
                          ) : source.status === "disconnected" ? (
                            <DropdownMenuItem
                              onClick={async () => {
                                await connect(source.id);
                                // Show processor for Logstash sources when connected
                                if (source.type === 'logstash') {
                                  setShowLogstashProcessor(source.id);
                                }
                              }}
                              disabled={isConnecting}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Connect
                            </DropdownMenuItem>
                          ) : null}
                          {source.status === "connected" && source.type === "logstash" && (
                            <DropdownMenuItem
                              onClick={() => setShowLogstashProcessor(source.id)}
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              View Processing
                            </DropdownMenuItem>
                          )}
                          {source.status === "connected" && source.type !== "csv" && (
                            <DropdownMenuItem
                              onClick={() => sync(source.id)}
                              disabled={isSyncing}
                            >
                              <RefreshCw
                                className={cn(
                                  "h-4 w-4 mr-2",
                                  isSyncing && "animate-spin"
                                )}
                              />
                              Sync Now
                            </DropdownMenuItem>
                          )}
                          {source.type === "csv" && (
                            <DropdownMenuItem
                              onClick={() => handleReplayCSV(source.id)}
                              disabled={isReprocessing}
                            >
                              <RefreshCw
                                className={cn(
                                  "h-4 w-4 mr-2",
                                  isReprocessing && "animate-spin"
                                )}
                              />
                              Replay CSV
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm(`Delete "${source.name}"?`)) {
                                deleteSource(source.id);
                              }
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
