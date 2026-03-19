import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useModels } from "@/hooks/useModels";
import type { AIModel } from "@/services/modelsApi";
import type { AIModel } from "@/services/modelsApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Zap,
  BarChart3,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Models are loaded from API via useModels hook

const typeLabels = {
  account_compromise: "Account Compromise",
  insider_threat: "Insider Threat",
  anomaly_detection: "Anomaly Detection",
  risk_fusion: "Risk Fusion",
};

const typeColors = {
  account_compromise: "bg-destructive/10 text-destructive",
  insider_threat: "bg-orange-400/10 text-orange-400",
  anomaly_detection: "bg-accent/10 text-accent",
  risk_fusion: "bg-primary/10 text-primary",
};

const statusStyles = {
  active: "bg-primary/10 text-primary",
  training: "bg-warning/10 text-warning",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
};

const statusIcons = {
  active: CheckCircle,
  training: Clock,
  inactive: Pause,
  error: AlertCircle,
};

export default function Models() {
  const {
    models,
    isLoading,
    upload,
    update,
    delete: deleteModel,
    toggle,
    isUploading,
  } = useModels();

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState<"account_compromise" | "insider_threat" | "anomaly_detection" | "risk_fusion">("anomaly_detection");
  const [modelFramework, setModelFramework] = useState<"pytorch" | "tensorflow" | "pickle" | "onnx">("tensorflow");
  const [description, setDescription] = useState("");
  const [requiredFeatures, setRequiredFeatures] = useState("");
  const [weight, setWeight] = useState(0.25);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configure dialog state
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequiredFeatures, setEditRequiredFeatures] = useState("");
  const [editWeight, setEditWeight] = useState(0.25);

  // Calculate stats
  const activeModels = models.filter(m => m.enabled && m.status === 'active').length;
  const avgAccuracy = models.length > 0 && models.filter(m => m.accuracy !== null).length > 0
    ? (models.filter(m => m.accuracy !== null).reduce((sum, m) => sum + (m.accuracy || 0), 0) / models.filter(m => m.accuracy !== null).length).toFixed(1)
    : '0';
  const totalPredictions = models.reduce((sum, m) => sum + m.predictions, 0);
  const avgF1Score = models.length > 0 && models.filter(m => m.f1Score !== null).length > 0
    ? (models.filter(m => m.f1Score !== null).reduce((sum, m) => sum + (m.f1Score || 0), 0) / models.filter(m => m.f1Score !== null).length).toFixed(1)
    : '0';

  const toggleModel = async (id: string) => {
    const model = models.find(m => m.id === id);
    if (model) {
      toggle({ id, enabled: !model.enabled });
    }
  };

  const updateWeight = async (id: string, weight: number) => {
    update({ id, updates: { weight } });
  };

  const handleConfigure = (model: any) => {
    setEditingModel(model);
    setEditName(model.name);
    setEditDescription(model.description || "");
    setEditRequiredFeatures(model.requiredFeatures ? (Array.isArray(model.requiredFeatures) ? model.requiredFeatures.join(", ") : model.requiredFeatures) : "");
    setEditWeight(model.weight);
    setConfigureDialogOpen(true);
  };

  const handleSaveConfiguration = async () => {
    if (!editingModel) return;

    try {
      await update({ 
        id: editingModel.id, 
        updates: { 
          name: editName,
          description: editDescription || null,
          requiredFeatures: editRequiredFeatures || null,
          weight: editWeight,
        } 
      });
      setConfigureDialogOpen(false);
      setEditingModel(null);
      toast.success('Model configuration updated successfully');
    } catch (error) {
      console.error('Failed to update model:', error);
      toast.error('Failed to update model configuration');
    }
  };

  const handleUpload = async () => {
    if (!modelFile || !modelName.trim()) {
      return;
    }

    try {
      await upload({
        name: modelName,
        type: modelType,
        framework: modelFramework,
        description: description || undefined,
        requiredFeatures: requiredFeatures || undefined,
        weight,
        modelFile,
      });

      // Reset form
      setModelName("");
      setModelType("anomaly_detection");
      setModelFramework("tensorflow");
      setDescription("");
      setRequiredFeatures("");
      setWeight(0.25);
      setModelFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  if (isLoading && models.length === 0) {
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
          <h1 className="text-2xl font-bold">AI Models</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage detection models and risk scoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Custom Model</DialogTitle>
                <DialogDescription>
                  Upload a PyTorch, TensorFlow, or ONNX model for threat detection.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Model Name *</Label>
                  <Input 
                    placeholder="e.g., Custom Anomaly Detector" 
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Threat Type *</Label>
                  <Select value={modelType} onValueChange={(v) => setModelType(v as typeof modelType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select threat type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account_compromise">Account Compromise</SelectItem>
                      <SelectItem value="insider_threat">Insider Threat</SelectItem>
                      <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
                      <SelectItem value="risk_fusion">Risk Fusion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Framework *</Label>
                  <Select value={modelFramework} onValueChange={(v) => setModelFramework(v as typeof modelFramework)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pytorch">PyTorch (.pt, .pth)</SelectItem>
                      <SelectItem value="tensorflow">TensorFlow (.h5, .pb)</SelectItem>
                      <SelectItem value="pickle">Pickle (.pkl, .pickle)</SelectItem>
                      <SelectItem value="onnx">ONNX (.onnx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea 
                    placeholder="Describe the model's purpose and capabilities..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Features (Optional)</Label>
                  <Textarea 
                    placeholder="user_id, timestamp, action, source_ip, resource, status"
                    value={requiredFeatures}
                    onChange={(e) => setRequiredFeatures(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of required input features
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Model File *</Label>
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pt,.pth,.h5,.pb,.pkl,.pickle,.onnx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setModelFile(file);
                      }
                    }}
                  />
                  {modelFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {modelFile.name} ({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Risk Score Weight</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[weight * 100]}
                      onValueChange={([v]) => setWeight(v / 100)}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-right">{Math.round(weight * 100)}%</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary text-primary-foreground"
                  onClick={handleUpload}
                  disabled={!modelFile || !modelName.trim() || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Model
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Configure Dialog */}
          <Dialog open={configureDialogOpen} onOpenChange={setConfigureDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Configure Model: {editingModel?.name}</DialogTitle>
                <DialogDescription>
                  Update model settings and metadata. Changes take effect immediately.
                </DialogDescription>
              </DialogHeader>
              {editingModel && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Model Name *</Label>
                    <Input 
                      placeholder="e.g., LSTM Anomaly Detector" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Describe the model's purpose, training data, or usage..." 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Required Features</Label>
                    <Input 
                      placeholder="Comma-separated: user_id, timestamp, action, source_ip" 
                      value={editRequiredFeatures}
                      onChange={(e) => setEditRequiredFeatures(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      List the features this model expects, separated by commas
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Risk Score Weight</Label>
                      <span className="text-sm font-mono text-primary">
                        {Math.round(editWeight * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[editWeight * 100]}
                      onValueChange={([v]) => setEditWeight(v / 100)}
                      max={100}
                      step={5}
                      className="py-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Weight used when this model participates in ensemble predictions (0-100%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="text-sm font-medium">{typeLabels[editingModel.type]}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Framework</Label>
                      <p className="text-sm font-medium capitalize">{editingModel.framework}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setConfigureDialogOpen(false);
                        setEditingModel(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-primary text-primary-foreground"
                      onClick={handleSaveConfiguration}
                      disabled={!editName.trim()}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
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
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-3xl font-bold text-primary mono">{activeModels}</p>
              </div>
              <Brain className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-3xl font-bold mono">{avgAccuracy}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-3xl font-bold mono">
                  {totalPredictions >= 1000 
                    ? `${(totalPredictions / 1000).toFixed(1)}K`
                    : totalPredictions.toLocaleString()}
                </p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg F1 Score</p>
                <p className="text-3xl font-bold mono">{avgF1Score}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models Grid */}
      {models.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Models Uploaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first AI model to start detecting threats
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Model
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {models.map((model) => {
          const StatusIcon = statusIcons[model.status];
          return (
            <Card key={model.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Brain className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", typeColors[model.type])}
                        >
                          {typeLabels[model.type]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {model.framework}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "flex items-center gap-1",
                        statusStyles[model.status]
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {model.status}
                    </Badge>
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold mono text-primary">
                      {model.accuracy !== null ? `${model.accuracy}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold mono">
                      {model.precision !== null ? `${model.precision}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Precision</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold mono">
                      {model.recall !== null ? `${model.recall}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Recall</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold mono">
                      {model.f1Score !== null ? model.f1Score.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">F1 Score</p>
                  </div>
                </div>

                {/* Weight Slider */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Risk Score Weight</Label>
                    <span className="text-sm font-mono text-primary">
                      {Math.round(model.weight * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[model.weight * 100]}
                    onValueChange={([v]) => updateWeight(model.id, v / 100)}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border text-xs text-muted-foreground">
                  <span>
                    {model.lastTrained 
                      ? `Last trained: ${model.lastTrained}`
                      : 'Not trained yet'}
                  </span>
                  <span>{model.predictions.toLocaleString()} predictions</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleConfigure(model)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    disabled={model.status === "training"}
                    onClick={() => {
                      if (confirm(`Delete model "${model.name}"? This cannot be undone.`)) {
                        deleteModel(model.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}
    </MainLayout>
  );
}
