"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Building2,
  Users,
  Crown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";

const COLORS = ["#ef4444", "#f59e0b", "#10b981"];

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  // Check org membership by organizationId, not accountType
  const isOrgMember = !!user?.organizationId;
  const isAdmin = user?.orgRole === "ADMIN";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.organizationId, isAdmin],
    queryFn: () => api.getDashboardStats(
      isAdmin && user?.organizationId ? { organizationId: user.organizationId } : undefined
    ),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["timeline", user?.organizationId, isAdmin],
    queryFn: () => api.getTimeline({
      days: 7,
      ...(isAdmin && user?.organizationId ? { organizationId: user.organizationId } : {}),
    }),
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["patterns", user?.organizationId, isAdmin],
    queryFn: () => api.getTopPatterns({
      limit: 5,
      ...(isAdmin && user?.organizationId ? { organizationId: user.organizationId } : {}),
    }),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const dashboardStats = stats?.data;
  const timelineData = timeline?.data || [];
  const patternsData = patterns?.data || [];

  // Prepare pie chart data
  const pieData = [
    { name: "Blocked", value: dashboardStats?.requests.blocked || 0 },
    { name: "Sanitized", value: dashboardStats?.requests.sanitized || 0 },
    { name: "Allowed", value: dashboardStats?.requests.allowed || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
          Dashboard
        </h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
          Monitor your AI data firewall performance
          {isOrgMember && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Building2 className="h-4 w-4" />
              Organization Account
            </span>
          )}
        </p>
      </div>

      {/* Organization Role Banner (for org users) */}
      {isOrgMember && (
        <Card className="bg-linear-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {isAdmin ? "Administrator Access" : "Member Access"}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isAdmin 
                      ? "You can view all organization activity and manage teams" 
                      : "You can view your personal activity"}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Link
                  href="/dashboard/organization"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-md shadow-amber-500/30 transition-colors"
                >
                  Manage Organization
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Firewalls"
          value={dashboardStats?.overview.activeFirewalls || 0}
          icon={Shield}
          description={`${
            dashboardStats?.overview.totalFirewalls || 0
          } total firewalls`}
        />
        <StatsCard
          title="Total Requests"
          value={dashboardStats?.requests.total || 0}
          icon={Activity}
          description="All time requests processed"
        />
        <StatsCard
          title="Blocked Requests"
          value={dashboardStats?.requests.blocked || 0}
          icon={AlertTriangle}
          description="Threats prevented"
          className="border-red-200"
        />
        <StatsCard
          title="Sanitized"
          value={dashboardStats?.requests.sanitized || 0}
          icon={CheckCircle}
          description="Data sanitized safely"
          className="border-green-200"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline Chart */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
              <div className="p-2 rounded-lg bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
                <TrendingUp className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              Request Timeline (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-neutral-700 dark:text-neutral-300 font-medium">
                  Loading chart...
                </div>
              </div>
            ) : timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="blocked"
                    stroke="#ef4444"
                    name="Blocked"
                  />
                  <Line
                    type="monotone"
                    dataKey="sanitized"
                    stroke="#f59e0b"
                    name="Sanitized"
                  />
                  <Line
                    type="monotone"
                    dataKey="allowed"
                    stroke="#10b981"
                    name="Allowed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-600 dark:text-neutral-400 font-medium">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Distribution */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">
              Request Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-neutral-700 dark:text-neutral-300 font-medium">
                  Loading chart...
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Patterns */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-50">
            Top Detected Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patternsLoading ? (
            <div className="text-neutral-700 dark:text-neutral-300 font-medium">
              Loading patterns...
            </div>
          ) : patternsData.length > 0 ? (
            <div className="space-y-3">
              {patternsData.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-sm font-medium text-amber-700 dark:text-amber-400">
                      {index + 1}
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">
                      {pattern.type}
                    </span>
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    {pattern.count} detections
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-600 dark:text-neutral-400 font-medium">
              No patterns detected yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-50">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/firewalls/new"
              className="flex items-center gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 p-4 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Shield className="h-8 w-8 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  Create Firewall
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Set up a new firewall
                </p>
              </div>
            </Link>
            <Link
              href="/dashboard/audit-logs"
              className="flex items-center gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 p-4 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Activity className="h-8 w-8 text-amber-600 dark:text-amber-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  View Logs
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {isOrgMember && isAdmin ? "View all team activity" : "Check audit logs"}
                </p>
              </div>
            </Link>
            {isOrgMember && isAdmin ? (
              <Link
                href="/dashboard/teams"
                className="flex items-center gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 p-4 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Users className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    Manage Teams
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Create and manage teams
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                href="/dashboard/api-keys"
                className="flex items-center gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 p-4 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <CheckCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-50">
                    API Keys
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Manage your keys
                  </p>
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
