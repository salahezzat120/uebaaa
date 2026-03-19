import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  BarChart3,
  Shield,
  Users,
  AlertTriangle,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { format } from "date-fns";
import type { Report } from "@/services/reportsApi";

const REPORT_TEMPLATES = [
  {
    id: 'executive_security_summary',
    name: 'Executive Security Summary',
    description: 'High-level security metrics and risk overview',
    type: 'executive' as const,
    icon: Shield,
  },
  {
    id: 'threat_analysis',
    name: 'Threat Analysis',
    description: 'Detailed threat intelligence and analysis',
    type: 'technical' as const,
    icon: AlertTriangle,
  },
  {
    id: 'user_behavior',
    name: 'User Behavior',
    description: 'User activity patterns and risk assessment',
    type: 'technical' as const,
    icon: Users,
  },
];

const typeStyles = {
  executive: "bg-accent/10 text-accent",
  technical: "bg-primary/10 text-primary",
  compliance: "bg-warning/10 text-warning",
};

const frequencyIcons = {
  daily: Clock,
  weekly: Calendar,
  monthly: Calendar,
  "on-demand": FileText,
};

export default function Reports() {
  const { reports, isLoading, createReport, generateReport, downloadReport, deleteReport, isGenerating } = useReports();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    type: 'executive' as Report['type'],
    frequency: 'weekly' as Report['frequency'],
    template_id: '',
  });
  const [generateForm, setGenerateForm] = useState({
    timePeriod: 'month' as 'today' | 'week' | 'month' | 'year' | 'custom',
    customStart: '',
    customEnd: '',
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const generatedToday = reports.filter(r => {
      if (!r.last_generated_at) return false;
      const genDate = new Date(r.last_generated_at);
      return genDate >= today;
    }).length;
    const scheduled = reports.filter(r => r.status === 'scheduled').length;
    const processing = reports.filter(r => r.status === 'generating').length;
    return { total, generatedToday, scheduled, processing };
  }, [reports]);

  const handleTemplateSelect = (templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setReportForm({
        name: template.name,
        description: template.description,
        type: template.type,
        frequency: 'weekly',
        template_id: templateId,
      });
      setCreateDialogOpen(true);
    }
  };

  const handleCreateReport = () => {
    if (!reportForm.name.trim()) {
      return;
    }
    createReport(reportForm);
    setCreateDialogOpen(false);
    setReportForm({
      name: '',
      description: '',
      type: 'executive',
      frequency: 'weekly',
      template_id: '',
    });
    setSelectedTemplate(null);
  };

  const handleGenerate = (id: string) => {
    setSelectedReportId(id);
    setGenerateDialogOpen(true);
  };

  const handleConfirmGenerate = () => {
    if (!selectedReportId) return;
    
    const { timePeriod, customStart, customEnd } = generateForm;
    generateReport(
      selectedReportId,
      timePeriod === 'custom' ? 'custom' : timePeriod,
      timePeriod === 'custom' && customStart ? customStart : undefined,
      timePeriod === 'custom' && customEnd ? customEnd : undefined
    );
    setGenerateDialogOpen(false);
    setSelectedReportId(null);
    setGenerateForm({
      timePeriod: 'month',
      customStart: '',
      customEnd: '',
    });
  };

  const handleDownload = (id: string) => {
    downloadReport(id);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete report "${name}"?`)) {
      deleteReport(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  };

  if (isLoading && reports.length === 0) {
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
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and download security reports
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => setSelectedTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-card">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Configure a new security report
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={reportForm.name}
                  onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                  placeholder="e.g., Executive Security Summary"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="Describe what this report contains..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select
                  value={reportForm.type}
                  onValueChange={(value: Report['type']) => setReportForm({ ...reportForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={reportForm.frequency}
                  onValueChange={(value: Report['frequency']) => setReportForm({ ...reportForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="on-demand">On-demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport} disabled={!reportForm.name.trim()}>
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold mono">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Generated Today</p>
                <p className="text-3xl font-bold text-primary mono">{stats.generatedToday}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-3xl font-bold mono">{stats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-3xl font-bold text-warning mono">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports created yet</p>
            <p className="text-sm">Create your first report to get started</p>
          </div>
        ) : (
          reports.map((report) => {
            const FrequencyIcon = frequencyIcons[report.frequency];
            const isGeneratingThis = report.status === 'generating';
            const canDownload = report.status === 'ready' && report.file_path;
            
            return (
              <Card key={report.id} className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={typeStyles[report.type]}>
                        {report.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(report.id, report.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{report.name}</CardTitle>
                  {report.description && (
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  )}
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <FrequencyIcon className="h-3 w-3" />
                    {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Last generated:</span>
                    <span className="font-mono">{formatDate(report.last_generated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={isGeneratingThis || !canDownload}
                      onClick={() => handleDownload(report.id)}
                    >
                      {isGeneratingThis ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={isGeneratingThis}
                      onClick={() => handleGenerate(report.id)}
                    >
                      {isGeneratingThis ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Report Templates */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Report Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="glass-card border-dashed hover:border-primary/50 cursor-pointer transition-colors"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`p-4 rounded-full mb-4 ${
                  template.type === 'executive' ? 'bg-accent/10' :
                  template.type === 'technical' ? 'bg-primary/10' :
                  'bg-warning/10'
                }`}>
                  <Icon className={`h-8 w-8 ${
                    template.type === 'executive' ? 'text-accent' :
                    template.type === 'technical' ? 'text-primary' :
                    'text-warning'
                  }`} />
                </div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Select the time period for report generation
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="timePeriod">Time Period</Label>
              <Select
                value={generateForm.timePeriod}
                onValueChange={(value: 'today' | 'week' | 'month' | 'year' | 'custom') => 
                  setGenerateForm({ ...generateForm, timePeriod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {generateForm.timePeriod === 'custom' && (
              <>
                <div>
                  <Label htmlFor="customStart">Start Date</Label>
                  <Input
                    id="customStart"
                    type="datetime-local"
                    value={generateForm.customStart}
                    onChange={(e) => setGenerateForm({ ...generateForm, customStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customEnd">End Date</Label>
                  <Input
                    id="customEnd"
                    type="datetime-local"
                    value={generateForm.customEnd}
                    onChange={(e) => setGenerateForm({ ...generateForm, customEnd: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmGenerate}
              disabled={
                generateForm.timePeriod === 'custom' && 
                (!generateForm.customStart || !generateForm.customEnd)
              }
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
