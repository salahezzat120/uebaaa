import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RiskGauge } from "@/components/dashboard/RiskGauge";
import { AlertsTimeline } from "@/components/dashboard/AlertsTimeline";
import { RiskChart } from "@/components/dashboard/RiskChart";
import { TopRiskyUsers } from "@/components/dashboard/TopRiskyUsers";
import { ThreatMap } from "@/components/dashboard/ThreatMap";
import { ModelStatus } from "@/components/dashboard/ModelStatus";
import {
  Users,
  AlertTriangle,
  Shield,
  Activity,
  Brain,
  Server,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard } from "@/hooks/useDashboard";

const Index = () => {
  const { stats, isLoading } = useDashboard();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  if (isLoading && !stats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const riskTrend = stats
    ? timeRange === "24h"
      ? stats.riskTrend24h
      : timeRange === "7d"
      ? stats.riskTrend7d
      : stats.riskTrend30d
    : [];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time behavior analytics and threat detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Activity className="h-4 w-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Monitored Users"
          value={stats?.totalUsers?.toLocaleString() || "0"}
          change={stats?.userChange}
          changeLabel="vs last week"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Active Alerts"
          value={stats?.activeAlerts?.toString() || "0"}
          change={stats?.alertChange}
          changeLabel="vs yesterday"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatsCard
          title="Threats Blocked"
          value={stats?.threatsBlocked?.toLocaleString() || "0"}
          change={stats?.threatChange}
          changeLabel="this month"
          icon={Shield}
          variant="success"
        />
        <StatsCard
          title="Data Sources"
          value={stats?.totalDataSources?.toString() || "0"}
          icon={Server}
          variant="default"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Risk Overview */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <RiskGauge score={stats?.systemRiskScore || 0} size="lg" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold mono text-primary">{stats?.riskPercentages?.low || 0}%</p>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold mono text-warning">{stats?.riskPercentages?.medium || 0}%</p>
                <p className="text-xs text-muted-foreground">Medium Risk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold mono text-destructive">{stats?.riskPercentages?.high || 0}%</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Risk Trend</CardTitle>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "24h" | "7d" | "30d")} className="h-auto">
                <TabsList className="h-8 p-1 bg-secondary">
                  <TabsTrigger value="24h" className="text-xs h-6 px-2">
                    24H
                  </TabsTrigger>
                  <TabsTrigger value="7d" className="text-xs h-6 px-2">
                    7D
                  </TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs h-6 px-2">
                    30D
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <RiskChart data={riskTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Alerts */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Recent Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AlertsTimeline alerts={stats?.recentAlerts || []} />
          </CardContent>
        </Card>

        {/* Threat Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatMap threats={stats?.threatDistribution || []} />
          </CardContent>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risky Users */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-warning" />
                Top Risky Users
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TopRiskyUsers users={stats?.topRiskyUsers || []} />
          </CardContent>
        </Card>

        {/* AI Models */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                AI Models
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ModelStatus />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
