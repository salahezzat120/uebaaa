import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Brain,
  Users,
  Webhook,
  Mail,
  MessageSquare,
  Save,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSoarPlaybooks } from "@/hooks/useSoarPlaybooks";
import type { SOARPlaybook } from "@/services/soarApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSetting, type RiskWeights, type RiskThresholds } from "@/services/settingsApi";
import { cn } from "@/lib/utils";

// SOAR Playbooks Tab Component
function SOARPlaybooksTab() {
  const {
    playbooks,
    isLoading,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSoarPlaybooks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<SOARPlaybook | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    action_type: "block_user" as SOARPlaybook["action_type"],
    conditions: {
      severity: [] as string[],
      alert_types: [] as string[],
      auto_execute: false,
      min_risk_score: null as number | null,
    },
    action_config: {} as Record<string, any>,
    enabled: true,
  });

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
      block_user: 90, // Critical action - high threshold
      revoke_tokens: 90, // Critical action - high threshold
      quarantine_endpoint: 85, // Very serious - high threshold
      force_password_reset: 75, // Moderate action - medium-high threshold
      trigger_mfa: 70, // Moderate action - medium threshold
      update_alert_status: 60, // Low impact - lower threshold
      send_notification: 50, // Informational - lowest threshold
    };
    return defaults[actionType] || 70;
  };

  const handleOpenDialog = (playbook?: SOARPlaybook) => {
    if (playbook) {
      setEditingPlaybook(playbook);
      setFormData({
        name: playbook.name,
        description: playbook.description || "",
        action_type: playbook.action_type,
        conditions: {
          severity: playbook.conditions.severity || [],
          alert_types: playbook.conditions.alert_types || [],
          auto_execute: playbook.conditions.auto_execute || false,
          min_risk_score: playbook.conditions.min_risk_score !== undefined ? playbook.conditions.min_risk_score : null,
        },
        action_config: playbook.action_config || {},
        enabled: playbook.enabled,
      });
    } else {
      setEditingPlaybook(null);
      const defaultActionType = "block_user" as SOARPlaybook["action_type"];
      setFormData({
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
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Playbook name is required");
      return;
    }

    if (editingPlaybook) {
      updatePlaybook({ id: editingPlaybook.id, data: formData });
    } else {
      createPlaybook(formData);
    }
    setDialogOpen(false);
  };

  const handleToggle = (playbook: SOARPlaybook) => {
    updatePlaybook({
      id: playbook.id,
      data: { enabled: !playbook.enabled },
    });
  };

  const handleDelete = (playbook: SOARPlaybook) => {
    if (confirm(`Are you sure you want to delete "${playbook.name}"?`)) {
      deletePlaybook(playbook.id);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SOAR Playbooks</CardTitle>
            <CardDescription>
              Configure automated response actions for security alerts
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlaybook ? "Edit Playbook" : "Create Playbook"}
                </DialogTitle>
                <DialogDescription>
                  Configure an automated response action for security alerts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Playbook Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Block Critical Threats"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this playbook does..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(value) => {
                      const newActionType = value as SOARPlaybook["action_type"];
                      // Set default risk score when action type changes (if not editing or risk score not set)
                      const currentRiskScore = formData.conditions.min_risk_score;
                      const newRiskScore = (!editingPlaybook || currentRiskScore === null || currentRiskScore === undefined)
                        ? getDefaultRiskScore(newActionType)
                        : currentRiskScore;
                      
                      setFormData({ 
                        ...formData, 
                        action_type: newActionType,
                        conditions: {
                          ...formData.conditions,
                          min_risk_score: newRiskScore,
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
                {formData.action_type === "update_alert_status" && (
                  <div>
                    <Label>New Alert Status</Label>
                    <Select
                      value={formData.action_config.new_status || "investigating"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, new_status: value },
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
                <div className="space-y-2">
                  <Label>Auto-Execute Conditions</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.conditions.auto_execute}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, auto_execute: checked },
                        })
                      }
                    />
                    <Label>Automatically execute when conditions match</Label>
                  </div>
                  {formData.conditions.auto_execute && (
                    <div className="space-y-4 pl-6 border-l-2 border-border">
                      <div>
                        <Label className="text-sm font-medium">Risk Score Threshold</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[formData.conditions.min_risk_score ?? getDefaultRiskScore(formData.action_type)]}
                              onValueChange={([value]) =>
                                setFormData({
                                  ...formData,
                                  conditions: { ...formData.conditions, min_risk_score: value },
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
                                value={formData.conditions.min_risk_score ?? getDefaultRiskScore(formData.action_type)}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  const clampedValue = Math.max(0, Math.min(100, value));
                                  setFormData({
                                    ...formData,
                                    conditions: { ...formData.conditions, min_risk_score: clampedValue },
                                  });
                                }}
                                className="text-center"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Playbook will auto-execute when risk score (from alert or user) is ≥ this value
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  conditions: { ...formData.conditions, min_risk_score: getDefaultRiskScore(formData.action_type) },
                                })
                              }
                            >
                              Use Default ({getDefaultRiskScore(formData.action_type)})
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  conditions: { ...formData.conditions, min_risk_score: null },
                                })
                              }
                            >
                              No Threshold
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Severity (optional)</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {["critical", "high", "medium", "low"].map((sev) => (
                            <Button
                              key={sev}
                              type="button"
                              variant={
                                formData.conditions.severity?.includes(sev) ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                const severity = formData.conditions.severity || [];
                                const newSeverity = severity.includes(sev)
                                  ? severity.filter((s) => s !== sev)
                                  : [...severity, sev];
                                setFormData({
                                  ...formData,
                                  conditions: { ...formData.conditions, severity: newSeverity },
                                });
                              }}
                            >
                              {sev}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave empty to match any severity
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                  <Label>Enabled</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No playbooks configured</p>
            <p className="text-sm">Create your first playbook to automate security responses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {playbooks.map((playbook) => (
              <div
                key={playbook.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{playbook.name}</h4>
                    <Badge variant="outline">{actionTypeLabels[playbook.action_type]}</Badge>
                    {playbook.conditions.auto_execute && (
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    )}
                    {!playbook.enabled && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  {playbook.description && (
                    <p className="text-sm text-muted-foreground mb-2">{playbook.description}</p>
                  )}
                  {(playbook.conditions.auto_execute && 
                    (playbook.conditions.severity?.length > 0 || 
                     (playbook.conditions.min_risk_score !== null && playbook.conditions.min_risk_score !== undefined))) && (
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs text-muted-foreground">Triggers on:</span>
                      {playbook.conditions.severity?.length > 0 && playbook.conditions.severity.map((sev) => (
                        <Badge key={sev} variant="outline" className="text-xs">
                          {sev}
                        </Badge>
                      ))}
                      {playbook.conditions.min_risk_score !== null && 
                       playbook.conditions.min_risk_score !== undefined && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            playbook.conditions.min_risk_score >= 90 && "bg-destructive/10 text-destructive border-destructive/30",
                            playbook.conditions.min_risk_score >= 70 && playbook.conditions.min_risk_score < 90 && "bg-orange-400/10 text-orange-400 border-orange-400/30",
                            playbook.conditions.min_risk_score < 70 && "bg-primary/10 text-primary border-primary/30"
                          )}
                        >
                          Risk ≥ {playbook.conditions.min_risk_score}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={playbook.enabled}
                    onCheckedChange={() => handleToggle(playbook)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(playbook)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(playbook)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: fetchSettings,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const [localWeights, setLocalWeights] = useState<RiskWeights | null>(null);
  const [localThresholds, setLocalThresholds] = useState<RiskThresholds | null>(null);

  // Initialize local state when data is loaded
  useState(() => {
    if (systemSettings) {
      setLocalWeights(systemSettings.risk_weights);
      setLocalThresholds(systemSettings.risk_thresholds);
    }
  });

  // Track if we need to sync local state with fetched data
  const [lastFetched, setLastFetched] = useState<string>("");
  if (systemSettings && JSON.stringify(systemSettings) !== lastFetched) {
    setLocalWeights(systemSettings.risk_weights);
    setLocalThresholds(systemSettings.risk_thresholds);
    setLastFetched(JSON.stringify(systemSettings));
  }

  const handleSave = () => {
    if (localWeights) updateMutation.mutate({ key: "risk_weights", value: localWeights });
    if (localThresholds) updateMutation.mutate({ key: "risk_thresholds", value: localThresholds });
    // Also update fusion if changed (defaulting to current if not in local state)
    if (systemSettings?.risk_fusion) updateMutation.mutate({ key: "risk_fusion", value: systemSettings.risk_fusion });
  };

  const [notifications, setNotifications] = useState({
    email: true,
    slack: true,
    teams: false,
    webhook: true,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const weights = localWeights || systemSettings?.risk_weights || { anomaly: 0.35, behavior: 0.25, temporal: 0.15, historical: 0.15, contextual: 0.10 };
  const thresholds = localThresholds || systemSettings?.risk_thresholds || { low: 30, medium: 50, high: 70, critical: 85 };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure platform behavior and integrations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["system-settings"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="risk" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Scoring
          </TabsTrigger>
          <TabsTrigger value="detection" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Detection
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="soar" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            SOAR Actions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Roles
          </TabsTrigger>
        </TabsList>

        {/* Risk Scoring */}
        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Risk Thresholds</CardTitle>
                <CardDescription>
                  Configure risk score thresholds for alert severity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                        Low Risk Max
                      </Label>
                      <span className="text-sm font-mono">{thresholds.low}</span>
                    </div>
                    <Slider
                      value={[thresholds.low]}
                      onValueChange={([v]) => setLocalThresholds({ ...thresholds, low: v })}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-yellow-500" />
                        Medium Risk Max
                      </Label>
                      <span className="text-sm font-mono">{thresholds.medium}</span>
                    </div>
                    <Slider
                      value={[thresholds.medium]}
                      onValueChange={([v]) => setLocalThresholds({ ...thresholds, medium: v })}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-orange-500" />
                        High Risk Threshold
                      </Label>
                      <span className="text-sm font-mono">{thresholds.high}</span>
                    </div>
                    <Slider
                      value={[thresholds.high]}
                      onValueChange={([v]) => setLocalThresholds({ ...thresholds, high: v })}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-600" />
                        Critical Risk Threshold
                      </Label>
                      <span className="text-sm font-mono">{thresholds.critical}</span>
                    </div>
                    <Slider
                      value={[thresholds.critical]}
                      onValueChange={([v]) => setLocalThresholds({ ...thresholds, critical: v })}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Risk Weighting (Formula)</CardTitle>
                <CardDescription>
                  Adjust the influence of each component on the final risk score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { id: "anomaly", label: "Anomaly Score", val: weights.anomaly },
                  { id: "behavior", label: "Behavior Deviation", val: weights.behavior },
                  { id: "temporal", label: "Temporal Risk", val: weights.temporal },
                  { id: "historical", label: "Historical Risk", val: weights.historical },
                  { id: "contextual", label: "Contextual Risk", val: weights.contextual },
                ].map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{item.label}</Label>
                      <span className="text-sm font-mono">{Math.round(item.val * 100)}%</span>
                    </div>
                    <Slider
                      value={[Math.round(item.val * 100)]}
                      onValueChange={([v]) => {
                        const newWeights = { ...weights, [item.id]: v / 100 };
                        setLocalWeights(newWeights);
                      }}
                      max={100}
                      step={1}
                    />
                  </div>
                ))}
                <div className="p-3 bg-secondary/50 rounded-md">
                   <p className="text-xs text-muted-foreground">
                     Total Influence: {Math.round(Object.values(weights).reduce((a, b) => a + b, 0) * 100)}%
                     (Should ideally be 100%)
                   </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detection */}
        <TabsContent value="detection">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Detection Engines</CardTitle>
              <CardDescription>
                Enable or disable specific threat detection modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Account Compromise Detection",
                    desc: "Detects unauthorized access and credential theft",
                    enabled: true,
                  },
                  {
                    name: "Insider Threat Detection",
                    desc: "Monitors for malicious insider activity",
                    enabled: true,
                  },
                  {
                    name: "Data Exfiltration Detection",
                    desc: "Identifies unusual data transfer patterns",
                    enabled: true,
                  },
                  {
                    name: "Privilege Escalation Detection",
                    desc: "Monitors for unauthorized privilege changes",
                    enabled: false,
                  },
                  {
                    name: "Lateral Movement Detection",
                    desc: "Tracks suspicious network navigation",
                    enabled: true,
                  },
                ].map((engine) => (
                  <div
                    key={engine.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <h4 className="font-medium">{engine.name}</h4>
                      <p className="text-sm text-muted-foreground">{engine.desc}</p>
                    </div>
                    <Switch defaultChecked={engine.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Configure where alerts are sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-xs text-muted-foreground">soc@company.com</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Slack</h4>
                      <p className="text-xs text-muted-foreground">#security-alerts</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.slack}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, slack: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Microsoft Teams</h4>
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.teams}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, teams: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Webhook className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Webhook</h4>
                      <p className="text-xs text-muted-foreground">
                        https://api.company.com/webhook
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.webhook}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, webhook: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Severity Routing</CardTitle>
                <CardDescription>Route alerts based on severity level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Critical", "High", "Medium", "Low"].map((severity) => (
                  <div key={severity} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          severity === "Critical"
                            ? "bg-destructive"
                            : severity === "High"
                            ? "bg-orange-400"
                            : severity === "Medium"
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                      />
                      {severity} Severity
                    </Label>
                    <Select
                      defaultValue={
                        severity === "Critical"
                          ? "all"
                          : severity === "High"
                          ? "email-slack"
                          : severity === "Medium"
                          ? "email"
                          : "none"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All channels</SelectItem>
                        <SelectItem value="email-slack">Email + Slack</SelectItem>
                        <SelectItem value="email">Email only</SelectItem>
                        <SelectItem value="slack">Slack only</SelectItem>
                        <SelectItem value="none">No notifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SOAR Actions */}
        <TabsContent value="soar">
          <SOARPlaybooksTab />
        </TabsContent>

        {/* User Roles */}
        <TabsContent value="users">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
              <CardDescription>
                Manage access levels for platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    role: "Admin",
                    users: 3,
                    permissions: ["Full access", "Manage users", "Configure settings"],
                  },
                  {
                    role: "SOC Analyst",
                    users: 12,
                    permissions: ["View alerts", "Investigate", "Run playbooks"],
                  },
                  {
                    role: "Read-only Viewer",
                    users: 8,
                    permissions: ["View dashboard", "View reports"],
                  },
                ].map((role) => (
                  <div
                    key={role.role}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{role.role}</h4>
                        <Badge variant="secondary">{role.users} users</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
