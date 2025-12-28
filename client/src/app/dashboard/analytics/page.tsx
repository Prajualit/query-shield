'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const ACTION_COLORS = {
  blocked: '#ef4444',
  sanitized: '#f59e0b',
  allowed: '#10b981'
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const { data: stats } = useQuery({
    queryKey: ['analytics-stats', timeRange],
    queryFn: () => api.getDashboardStats(),
  });

  const { data: timeline } = useQuery({
    queryKey: ['analytics-timeline', timeRange],
    queryFn: () => api.getTimeline({ days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 }),
  });

  const { data: patterns } = useQuery({
    queryKey: ['analytics-patterns'],
    queryFn: () => api.getTopPatterns({ limit: 10 }),
  });

  const dashboardStats = stats?.data;
  const timelineData = timeline?.data || [];
  const patternsData = patterns?.data || [];

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  };

  // Mock trend data (in production, get from API)
  const trends = {
    requests: calculateTrend(dashboardStats?.requests.total || 0, 850),
    blocked: calculateTrend(dashboardStats?.requests.blocked || 0, 45),
    sanitized: calculateTrend(dashboardStats?.requests.sanitized || 0, 120),
    responseTime: calculateTrend(250, 320)
  };

  // Prepare data for charts
  const actionDistribution = [
    { name: 'Blocked', value: dashboardStats?.requests.blocked || 0, color: ACTION_COLORS.blocked },
    { name: 'Sanitized', value: dashboardStats?.requests.sanitized || 0, color: ACTION_COLORS.sanitized },
    { name: 'Allowed', value: dashboardStats?.requests.allowed || 0, color: ACTION_COLORS.allowed },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    requests: Math.floor(Math.random() * 100) + 20,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Analytics</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Deep insights into your firewall performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {dashboardStats?.requests.total.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 text-xs mt-2">
              {trends.requests.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span className={trends.requests.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {trends.requests.value}%
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Threats Blocked
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {dashboardStats?.requests.blocked.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 text-xs mt-2">
              {trends.blocked.isPositive ? (
                <TrendingUp className="h-3 w-3 text-red-600 dark:text-red-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
              <span className={!trends.blocked.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {trends.blocked.value}%
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Data Sanitized
            </CardTitle>
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              {dashboardStats?.requests.sanitized.toLocaleString() || 0}
            </div>
            <div className="flex items-center gap-1 text-xs mt-2">
              {trends.sanitized.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
              )}
              <span className={trends.sanitized.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {trends.sanitized.value}%
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              250<span className="text-xl">ms</span>
            </div>
            <div className="flex items-center gap-1 text-xs mt-2">
              {trends.responseTime.isPositive ? (
                <TrendingUp className="h-3 w-3 text-red-600 dark:text-red-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
              <span className={!trends.responseTime.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {trends.responseTime.value}%
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Timeline */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">Request Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSanitized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" opacity={0.1} />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" />
                <Area type="monotone" dataKey="sanitized" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSanitized)" />
                <Area type="monotone" dataKey="allowed" stroke="#10b981" fillOpacity={1} fill="url(#colorAllowed)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">Action Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hourly Activity */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">24-Hour Activity Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" opacity={0.1} />
                <XAxis dataKey="hour" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="requests" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Patterns */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">Top Detection Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patternsData.slice(0, 8).map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 text-sm font-bold text-amber-700 dark:text-amber-400">
                      {index + 1}
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{pattern.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                      {pattern.count} detections
                    </span>
                    <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-amber-500 to-yellow-600 rounded-full"
                        style={{ width: `${(pattern.count / (patternsData[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-50">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Detection Rate</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-500">94.2%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-amber-500 to-yellow-600 rounded-full" style={{ width: '94.2%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">False Positive Rate</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-500">2.1%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-green-500 to-emerald-600 rounded-full" style={{ width: '2.1%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">System Uptime</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">99.9%</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-emerald-500 to-green-600 rounded-full" style={{ width: '99.9%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
