import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users as UsersIcon,
  Search,
  Filter,
  User,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Shield,
  Ban,
  Key,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "@/hooks/useUsers";
import { formatDistanceToNow } from "date-fns";
import type { User as UserType } from "@/services/usersApi";

interface UserEntity {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  riskScore: number;
  riskTrend: number;
  status: "active" | "suspended" | "under_review";
  lastActivity: string;
  alertCount: number;
  riskFactors: string[];
}

// Map database user to UI format
function mapUserToEntity(user: UserType): UserEntity {
  const metadata = user.metadata || {};
  const name = metadata.name || user.username || user.email.split('@')[0];
  const department = metadata.department || 'Unknown';
  const role = metadata.role || 'User';
  
  // Map status: 'active' -> 'active', 'suspended' -> 'suspended', 'inactive' -> 'under_review'
  let status: "active" | "suspended" | "under_review" = "active";
  if (user.status === 'suspended') {
    status = 'suspended';
  } else if (user.status === 'inactive') {
    status = 'under_review';
  } else {
    status = 'active';
  }

  // Calculate last activity
  const lastActivityTime = user.last_alert_time || user.updated_at;
  const lastActivity = lastActivityTime 
    ? formatDistanceToNow(new Date(lastActivityTime), { addSuffix: true })
    : 'Never';

  // Risk score (0-100)
  const riskScore = Math.round(user.risk_score || 0);

  // Risk factors from alerts
  const riskFactors = user.risk_factors || [];

  return {
    id: user.id,
    name,
    email: user.email,
    department,
    role,
    riskScore,
    riskTrend: 0, // TODO: Calculate trend from historical data
    status,
    lastActivity,
    alertCount: user.alert_count || 0,
    riskFactors,
  };
}

const getRiskColor = (score: number) => {
  if (score >= 80) return "text-destructive";
  if (score >= 60) return "text-orange-400";
  if (score >= 40) return "text-warning";
  return "text-primary";
};

const getRiskBg = (score: number) => {
  if (score >= 80) return "bg-destructive";
  if (score >= 60) return "bg-orange-400";
  if (score >= 40) return "bg-warning";
  return "bg-primary";
};

const statusStyles = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-destructive/10 text-destructive",
  under_review: "bg-warning/10 text-warning",
};

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);

  const { users: rawUsers, isLoading, suspendUser, forcePasswordReset, triggerMFA, revokeTokens } = useUsers(true);

  // Map users to UI format
  const users = useMemo(() => rawUsers.map(mapUserToEntity), [rawUsers]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const highRisk = users.filter(u => u.riskScore >= 80).length;
    const underReview = users.filter(u => u.status === 'under_review' || (u.status === 'active' && u.riskScore >= 80)).length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    return { total, highRisk, underReview, suspended };
  }, [users]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.name.toLowerCase().includes(query) && 
            !user.email.toLowerCase().includes(query) &&
            !user.department.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Risk level filter
      if (riskFilter !== "all") {
        if (riskFilter === "critical" && user.riskScore < 80) return false;
        if (riskFilter === "high" && (user.riskScore < 60 || user.riskScore >= 80)) return false;
        if (riskFilter === "medium" && (user.riskScore < 40 || user.riskScore >= 60)) return false;
        if (riskFilter === "low" && user.riskScore >= 40) return false;
      }

      // Department filter
      if (departmentFilter !== "all" && user.department.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, riskFilter, departmentFilter, statusFilter]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(users.map(u => u.department));
    return Array.from(depts).sort();
  }, [users]);

  if (isLoading && users.length === 0) {
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
          <h1 className="text-2xl font-bold">Users & Entities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor user behavior and risk profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Import Users
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground">
            <UsersIcon className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold mono">{stats.total}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-3xl font-bold text-destructive mono">{stats.highRisk}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Under Review</p>
                <p className="text-3xl font-bold text-warning mono">{stats.underReview}</p>
              </div>
              <Eye className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-3xl font-bold mono">{stats.suspended}</p>
              </div>
              <Ban className="h-8 w-8 text-muted-foreground/50" />
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical (80+)</SelectItem>
                <SelectItem value="high">High (60-79)</SelectItem>
                <SelectItem value="medium">Medium (40-59)</SelectItem>
                <SelectItem value="low">Low (0-39)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept.toLowerCase()}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading users...</span>
              </div>
            ) : (
              "No users found matching your filters"
            )}
          </div>
        ) : (
          filteredUsers.map((user) => (
          <Card
            key={user.id}
            className={cn(
              "glass-card hover:border-primary/30 transition-all cursor-pointer",
              selectedUser?.id === user.id && "border-primary/50"
            )}
            onClick={() => setSelectedUser(user)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      Run Analysis
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm(`Force password reset for ${user.email}?`)) {
                          forcePasswordReset(user.id);
                        }
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Force Password Reset
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm(`Trigger MFA challenge for ${user.email}?`)) {
                          triggerMFA(user.id);
                        }
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Trigger MFA
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm(`Revoke API tokens for ${user.email}?`)) {
                          revokeTokens(user.id);
                        }
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Revoke Tokens
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Suspend account for ${user.email}?`)) {
                          suspendUser(user.id);
                        }
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">
                  {user.department}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("text-xs capitalize", statusStyles[user.status])}
                >
                  {user.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                  <div className="flex items-center gap-2">
                    {user.riskTrend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-primary" />
                    )}
                    <span
                      className={cn(
                        "text-lg font-bold mono",
                        getRiskColor(user.riskScore)
                      )}
                    >
                      {user.riskScore}
                    </span>
                  </div>
                </div>
                <Progress
                  value={user.riskScore}
                  className={cn("h-2", getRiskBg(user.riskScore))}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Active Alerts: {user.alertCount}</span>
                  <span>Last: {user.lastActivity}</span>
                </div>
              </div>

              {user.riskFactors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {user.riskFactors.slice(0, 2).map((factor, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] bg-destructive/5 text-destructive border-destructive/20"
                    >
                      {factor}
                    </Badge>
                  ))}
                  {user.riskFactors.length > 2 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{user.riskFactors.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
}
