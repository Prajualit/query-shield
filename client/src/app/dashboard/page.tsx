'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: () => api.getTimeline({ days: 7 }),
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['patterns'],
    queryFn: () => api.getTopPatterns({ limit: 5 }),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardStats = stats?.data;
  const timelineData = timeline?.data || [];
  const patternsData = patterns?.data || [];

  // Prepare pie chart data
  const pieData = [
    { name: 'Blocked', value: dashboardStats?.requests.blocked || 0 },
    { name: 'Sanitized', value: dashboardStats?.requests.sanitized || 0 },
    { name: 'Allowed', value: dashboardStats?.requests.allowed || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor your AI data firewall performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Firewalls"
          value={dashboardStats?.overview.activeFirewalls || 0}
          icon={Shield}
          description={`${dashboardStats?.overview.totalFirewalls || 0} total firewalls`}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Request Timeline (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">Loading chart...</div>
              </div>
            ) : timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="blocked" stroke="#ef4444" name="Blocked" />
                  <Line type="monotone" dataKey="sanitized" stroke="#f59e0b" name="Sanitized" />
                  <Line type="monotone" dataKey="allowed" stroke="#10b981" name="Allowed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-500">Loading chart...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      <Card>
        <CardHeader>
          <CardTitle>Top Detected Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {patternsLoading ? (
            <div className="text-gray-500">Loading patterns...</div>
          ) : patternsData.length > 0 ? (
            <div className="space-y-3">
              {patternsData.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{pattern.type}</span>
                  </div>
                  <span className="text-sm text-gray-500">{pattern.count} detections</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No patterns detected yet</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/firewalls/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Create Firewall</p>
                <p className="text-sm text-gray-500">Set up a new firewall</p>
              </div>
            </a>
            <a
              href="/dashboard/audit-logs"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">View Logs</p>
                <p className="text-sm text-gray-500">Check audit logs</p>
              </div>
            </a>
            <a
              href="/dashboard/api-keys"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">API Keys</p>
                <p className="text-sm text-gray-500">Manage your keys</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
