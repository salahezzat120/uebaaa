import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  User,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useAlerts } from "@/hooks/useAlerts";
import { useSoarPlaybooks } from "@/hooks/useSoarPlaybooks";
import { toast } from "sonner";
import type { Alert } from "@/services/alertsApi";
import type { SOARPlaybook } from "@/services/soarApi";

const mockAlerts: any[] = [
  {
    id: "ALT-001",
    type: "Account Compromise",
    severity: "critical",
    status: "open",
    user: "john.doe@company.com",
    riskScore: 95,
    description: "Multiple failed login attempts followed by successful access from anomalous IP",
    timestamp: "2024-01-15 14:32:05",
    model: "TGN Compromise Detector",
  },
  {
    id: "ALT-002",
    type: "Insider Threat",
    severity: "high",
    status: "investigating",
    user: "sarah.chen@company.com",
    riskScore: 82,
    description: "Unusual data access pattern detected - accessing sensitive files outside normal scope",
    timestamp: "2024-01-15 13:45:12",
    model: "Sequence Autoencoder",
  },
  {
    id: "ALT-003",
    type: "Entity Anomaly",
    severity: "medium",
    status: "open",
    user: "system",
    entity: "PROD-DB-01",
    riskScore: 65,
    description: "Server exhibiting unusual network traffic patterns - 300% increase in outbound data",
    timestamp: "2024-01-15 12:18:33",
    model: "SUOD Ensemble",
  },
  {
    id: "ALT-004",
    type: "Policy Violation",
    severity: "low",
    status: "resolved",
    user: "mike.wilson@company.com",
    riskScore: 42,
    description: "Access to restricted HR documents outside business hours",
    timestamp: "2024-01-15 11:05:47",
    model: "Risk Fusion Engine",
  },
  {
    id: "ALT-005",
    type: "Account Compromise",
    severity: "high",
    status: "open",
    user: "admin@company.com",
    riskScore: 88,
    description: "Privileged account accessed from new device and location simultaneously",
    timestamp: "2024-01-15 10:22:19",
    model: "TGN Compromise Detector",
  },
];

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-primary/10 text-primary border-primary/30",
};

const statusStyles = {
  open: "bg-destructive/10 text-destructive",
  acknowledged: "bg-warning/10 text-warning",
  investigating: "bg-warning/10 text-warning",
  resolved: "bg-primary/10 text-primary",
  dismissed: "bg-muted text-muted-foreground",
  false_positive: "bg-muted text-muted-foreground",
};

const statusIcons = {
  open: AlertTriangle,
  acknowledged: Eye,
  investigating: Eye,
  resolved: CheckCircle,
  dismissed: XCircle,
  false_positive: XCircle,
};

export default function Alerts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [soarDialogOpen, setSoarDialogOpen] = useState(false);
  const [createPlaybookDialogOpen, setCreatePlaybookDialogOpen] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>("");
  const [newPlaybookForm, setNewPlaybookForm] = useState({
    name: "",
    description: "",
    action_type: "block_user" as SOARPlaybook["action_type"],
    conditions: {
      severity: [] as string[],
      alert_types: [] as string[],
      auto_execute: false,
      min_risk_score: 90 as number | null,
    },
    action_config: {} as Record<string, any>,
    enabled: true,
  });
  
  const filters = useMemo(() => {
    const f: { status?: string; severity?: string } = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (severityFilter !== "all") f.severity = severityFilter;
    return f;
  }, [statusFilter, severityFilter]);

  const { alerts, isLoading, updateStatus, delete: deleteAlert } = useAlerts(filters);
  const { playbooks, executePlaybook, createPlaybookAsync, isExecuting, isCreating } = useSoarPlaybooks();

  const actionTypeLabels: Record<SOARPlaybook["action_type"], string> = {
    block_user: "Block User Account",
    force_password_reset: "Force Password Reset",
    trigger_mfa: "Trigger MFA Challenge",
    revoke_tokens: "Revoke API Tokens",
    quarantine_endpoint: "Quarantine Endpoint",
    update_alert_status: "Update Alert Status",
    send_notification: "Send Notification",
  };

  // Smart defaults for risk score thresholds based on action type
  const getDefaultRiskScore = (actionType: SOARPlaybook["action_type"]): number => {
    const defaults: Record<SOARPlaybook["action_type"], number> = {
      block_user: 90,
      revoke_tokens: 90,
      quarantine_endpoint: 85,
      force_password_reset: 75,
      trigger_mfa: 70,
      update_alert_status: 60,
      send_notification: 50,
    };
    return defaults[actionType] || 70;
  };

  const handleCreatePlaybook = async () => {
    if (!newPlaybookForm.name.trim()) {
      toast.error("Playbook name is required");
      return;
    }

    try {
      const createdPlaybook = await createPlaybookAsync(newPlaybookForm);
      
      // Select the newly created playbook
      setSelectedPlaybookId(createdPlaybook.id);
      setCreatePlaybookDialogOpen(false);
      const defaultActionType = "block_user" as SOARPlaybook["action_type"];
      setNewPlaybookForm({
        name: "",
        description: "",
        action_type: defaultActionType,
        conditions: { 
          severity: [], 
          alert_types: [], 
          auto_execute: false,
          min_risk_score: getDefaultRiskScore(defaultActionType),
        },
        action_config: {},
        enabled: true,
      });
      toast.success("Playbook created and selected");
    } catch (error: any) {
      // Error is already handled by the mutation
    }
  };

  // Filter alerts by search query
  const filteredAlerts = useMemo(() => {
    if (!searchQuery.trim()) return alerts;
    const query = searchQuery.toLowerCase();
    return alerts.filter((alert) =>
      alert.title?.toLowerCase().includes(query) ||
      alert.description?.toLowerCase().includes(query) ||
      alert.metadata?.user_email?.toLowerCase().includes(query) ||
      alert.id.toLowerCase().includes(query)
    );
  }, [alerts, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const allAlerts = alerts; // Use all alerts for stats, not filtered
    const openCount = allAlerts.filter((a) => a.status === "open").length;
    const investigatingCount = allAlerts.filter((a) => a.status === "acknowledged" || a.status === "investigating").length;
    const resolvedToday = allAlerts.filter((a) => {
      if (a.status !== "resolved") return false;
      const resolvedDate = new Date(a.updated_at || a.created_at);
      const today = new Date();
      return resolvedDate.toDateString() === today.toDateString();
    }).length;
    
    return { openCount, investigatingCount, resolvedToday };
  }, [alerts]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get alert type from title or metadata
  const getAlertType = (alert: Alert) => {
    if (alert.metadata?.action) {
      if (alert.metadata.action === "execute_script") return "Insider Threat";
      if (alert.metadata.status === "failed" && alert.metadata.action === "login") return "Account Compromise";
      return "Entity Anomaly";
    }
    // Extract from title if available
    const title = alert.title || "";
    if (title.includes("Account Compromise") || title.includes("account_compromise")) return "Account Compromise";
    if (title.includes("Insider Threat") || title.includes("insider_threat")) return "Insider Threat";
    if (title.includes("Entity Anomaly") || title.includes("entity_anomaly")) return "Entity Anomaly";
    return "Security Alert";
  };

  // Get user email from metadata or user_id
  const getUserEmail = (alert: Alert) => {
    return alert.metadata?.user_email || "Unknown User";
  };

  if (isLoading && alerts.length === 0) {
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
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Security Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and respond to detected threats
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={soarDialogOpen} onOpenChange={setSoarDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Shield className="h-4 w-4 mr-2" />
                Run SOAR Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Run SOAR Playbook</DialogTitle>
                <DialogDescription>
                  Select a playbook and alerts to execute automated response actions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-medium">Select Playbook</Label>
                    <Dialog open={createPlaybookDialogOpen} onOpenChange={setCreatePlaybookDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Create New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Playbook</DialogTitle>
                          <DialogDescription>
                            Create a new SOAR playbook to automate security responses
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Playbook Name</Label>
                            <Input
                              value={newPlaybookForm.name}
                              onChange={(e) =>
                                setNewPlaybookForm({ ...newPlaybookForm, name: e.target.value })
                              }
                              placeholder="e.g., Block Critical Threats"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newPlaybookForm.description}
                              onChange={(e) =>
                                setNewPlaybookForm({ ...newPlaybookForm, description: e.target.value })
                              }
                              placeholder="Describe what this playbook does..."
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Action Type</Label>
                            <Select
                              value={newPlaybookForm.action_type}
                              onValueChange={(value) => {
                                const newActionType = value as SOARPlaybook["action_type"];
                                setNewPlaybookForm({
                                  ...newPlaybookForm,
                                  action_type: newActionType,
                                  conditions: {
                                    ...newPlaybookForm.conditions,
                                    min_risk_score: getDefaultRiskScore(newActionType),
                                  },
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(actionTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Risk Score Threshold</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[newPlaybookForm.conditions.min_risk_score ?? getDefaultRiskScore(newPlaybookForm.action_type)]}
                                  onValueChange={([value]) =>
                                    setNewPlaybookForm({
                                      ...newPlaybookForm,
                                      conditions: { ...newPlaybookForm.conditions, min_risk_score: value },
                                    })
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="w-20 text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={newPlaybookForm.conditions.min_risk_score ?? getDefaultRiskScore(newPlaybookForm.action_type)}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      const clampedValue = Math.max(0, Math.min(100, value));
                                      setNewPlaybookForm({
                                        ...newPlaybookForm,
                                        conditions: { ...newPlaybookForm.conditions, min_risk_score: clampedValue },
                                      });
                                    }}
                                    className="text-center"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Auto-execute when risk score (from alert or user) is ≥ this value
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setNewPlaybookForm({
                                    ...newPlaybookForm,
                                    conditions: { 
                                      ...newPlaybookForm.conditions, 
                                      min_risk_score: getDefaultRiskScore(newPlaybookForm.action_type) 
                                    },
                                  })
                                }
                              >
                                Use Default ({getDefaultRiskScore(newPlaybookForm.action_type)})
                              </Button>
                            </div>
                          </div>
                          {newPlaybookForm.action_type === "update_alert_status" && (
                            <div>
                              <Label>New Alert Status</Label>
                              <Select
                                value={newPlaybookForm.action_config.new_status || "investigating"}
                                onValueChange={(value) =>
                                  setNewPlaybookForm({
                                    ...newPlaybookForm,
                                    action_config: { ...newPlaybookForm.action_config, new_status: value },
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="investigating">Investigating</SelectItem>
                                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={newPlaybookForm.enabled}
                              onCheckedChange={(checked) =>
                                setNewPlaybookForm({ ...newPlaybookForm, enabled: checked })
                              }
                            />
                            <Label>Enabled</Label>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setCreatePlaybookDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCreatePlaybook} disabled={isCreating}>
                              {isCreating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={selectedPlaybookId} onValueChange={setSelectedPlaybookId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a playbook..." />
                    </SelectTrigger>
                    <SelectContent>
                      {playbooks.filter(p => p.enabled).map((playbook) => (
                        <SelectItem key={playbook.id} value={playbook.id}>
                          <div className="flex items-center gap-2">
                            <span>{playbook.name}</span>
                            {playbook.conditions.min_risk_score !== null && 
                             playbook.conditions.min_risk_score !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Risk ≥ {playbook.conditions.min_risk_score}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlaybookId && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {playbooks.find(p => p.id === selectedPlaybookId)?.description}
                      </p>
                      {playbooks.find(p => p.id === selectedPlaybookId)?.conditions.min_risk_score !== null && 
                       playbooks.find(p => p.id === selectedPlaybookId)?.conditions.min_risk_score !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Risk threshold: ≥ {playbooks.find(p => p.id === selectedPlaybookId)?.conditions.min_risk_score}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Select Alerts</Label>
                  <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {filteredAlerts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center p-4">
                        No alerts available
                      </p>
                    ) : (
                      filteredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded"
                        >
                          <Checkbox
                            checked={selectedAlerts.has(alert.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedAlerts);
                              if (checked) {
                                newSelected.add(alert.id);
                              } else {
                                newSelected.delete(alert.id);
                              }
                              setSelectedAlerts(newSelected);
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{alert.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {alert.metadata?.user_email || "System"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAlerts(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSoarDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!selectedPlaybookId) {
                        toast.error("Please select a playbook");
                        return;
                      }
                      if (selectedAlerts.size === 0) {
                        toast.error("Please select at least one alert");
                        return;
                      }
                      executePlaybook({
                        playbookId: selectedPlaybookId,
                        alertIds: Array.from(selectedAlerts),
                      });
                      // Alerts will be refreshed automatically via query invalidation in the mutation
                      setSoarDialogOpen(false);
                      setSelectedAlerts(new Set());
                      setSelectedPlaybookId("");
                    }}
                    disabled={isExecuting || !selectedPlaybookId || selectedAlerts.size === 0}
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Execute Playbook
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
                <p className="text-sm text-muted-foreground">Open Alerts</p>
                <p className="text-3xl font-bold text-destructive mono">{stats.openCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-3xl font-bold text-warning mono">{stats.investigatingCount}</p>
              </div>
              <Eye className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-3xl font-bold text-primary mono">{stats.resolvedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold mono">4.2m</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="account">Account Compromise</SelectItem>
                <SelectItem value="insider">Insider Threat</SelectItem>
                <SelectItem value="entity">Entity Anomaly</SelectItem>
                <SelectItem value="policy">Policy Violation</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-28">Alert ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead>User / Entity</TableHead>
                  <TableHead className="w-20">Risk</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-40">Timestamp</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading alerts...</span>
                      </div>
                    ) : (
                      "No alerts found"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => {
                  const alertStatus = alert.status as keyof typeof statusIcons;
                  const StatusIcon = statusIcons[alertStatus] || AlertTriangle;
                  const alertSeverity = alert.severity as keyof typeof severityStyles;
                  const userEmail = getUserEmail(alert);
                  const alertType = getAlertType(alert);
                  const riskScore = alert.anomaly_score || 0;

                  return (
                    <TableRow key={alert.id} className="border-border hover:bg-secondary/30">
                      <TableCell className="font-mono text-sm">{alert.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {alertType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("capitalize", severityStyles[alertSeverity])}
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge
                            variant="secondary"
                            className={cn("capitalize", statusStyles[alertStatus] || statusStyles.open)}
                          >
                            {alert.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-mono font-bold",
                            riskScore >= 80 && "text-destructive",
                            riskScore >= 60 && riskScore < 80 && "text-orange-400",
                            riskScore >= 40 && riskScore < 60 && "text-warning",
                            riskScore < 40 && "text-primary"
                          )}
                        >
                          {riskScore.toFixed(0)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {alert.description || alert.title}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {formatTimestamp(alert.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {alert.status !== "resolved" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus({ id: alert.id, status: "resolved" })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "acknowledged" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus({ id: alert.id, status: "acknowledged" })}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Acknowledge
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "false_positive" && (
                              <DropdownMenuItem
                                onClick={() => updateStatus({ id: alert.id, status: "false_positive" })}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark False Positive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Delete alert ${alert.id}?`)) {
                                  deleteAlert(alert.id);
                                }
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
