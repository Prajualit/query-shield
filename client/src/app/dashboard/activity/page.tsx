'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus,
  Settings,
  Key,
  Filter,
  RefreshCw,
  Clock,
  User,
  Zap,
  Bell,
  Eye,
  Ban,
  Edit,
  Plus
} from 'lucide-react';

// Mock activity data
const mockActivities = [
  {
    id: '1',
    type: 'threat_blocked',
    message: 'SQL injection attempt blocked',
    details: 'Detected malicious pattern in API request to /api/users',
    user: 'System',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    severity: 'critical',
    icon: Ban,
    color: 'red'
  },
  {
    id: '2',
    type: 'firewall_created',
    message: 'New firewall created',
    details: 'Production API Firewall with 12 rules',
    user: 'John Smith',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: Shield,
    color: 'amber'
  },
  {
    id: '3',
    type: 'rule_updated',
    message: 'Detection rule updated',
    details: 'Email detection pattern modified',
    user: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: Edit,
    color: 'blue'
  },
  {
    id: '4',
    type: 'member_joined',
    message: 'New team member joined',
    details: 'Mike Wilson accepted invitation',
    user: 'Mike Wilson',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: UserPlus,
    color: 'green'
  },
  {
    id: '5',
    type: 'pii_detected',
    message: 'PII detected and redacted',
    details: '3 email addresses, 2 phone numbers sanitized',
    user: 'System',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    severity: 'warning',
    icon: AlertTriangle,
    color: 'yellow'
  },
  {
    id: '6',
    type: 'api_key_created',
    message: 'New API key generated',
    details: 'Production API Key for mobile app',
    user: 'John Smith',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: Key,
    color: 'purple'
  },
  {
    id: '7',
    type: 'settings_updated',
    message: 'Account settings updated',
    details: 'Notification preferences changed',
    user: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: Settings,
    color: 'neutral'
  },
  {
    id: '8',
    type: 'firewall_activated',
    message: 'Firewall activated',
    details: 'Development API Firewall is now active',
    user: 'John Smith',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    severity: 'success',
    icon: CheckCircle,
    color: 'green'
  },
  {
    id: '9',
    type: 'rule_created',
    message: 'New detection rule created',
    details: 'Custom regex pattern for internal IDs',
    user: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'info',
    icon: Plus,
    color: 'blue'
  },
  {
    id: '10',
    type: 'threat_blocked',
    message: 'XSS attack blocked',
    details: 'Malicious script detected in user input',
    user: 'System',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'critical',
    icon: Ban,
    color: 'red'
  },
];

type ActivityFilter = 'all' | 'security' | 'team' | 'system';

export default function ActivityPage() {
  const [activities] = useState(mockActivities);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    if (filter === 'security') return activities.filter(a => 
      ['threat_blocked', 'pii_detected', 'firewall_created', 'firewall_activated', 'rule_created', 'rule_updated'].includes(a.type)
    );
    if (filter === 'team') return activities.filter(a => 
      ['member_joined', 'settings_updated'].includes(a.type)
    );
    if (filter === 'system') return activities.filter(a => a.user === 'System');
    return activities;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIconBg = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-500/20 text-red-500',
      amber: 'bg-amber-500/20 text-amber-500',
      yellow: 'bg-yellow-500/20 text-yellow-500',
      green: 'bg-green-500/20 text-green-500',
      blue: 'bg-blue-500/20 text-blue-500',
      purple: 'bg-purple-500/20 text-purple-500',
      neutral: 'bg-neutral-500/20 text-neutral-500'
    };
    return colors[color] || colors.neutral;
  };

  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return badges[severity] || badges.info;
  };

  const filteredActivities = getFilteredActivities();

  // Activity stats
  const todayCount = activities.filter(a => {
    const activityDate = new Date(a.timestamp);
    const today = new Date();
    return activityDate.toDateString() === today.toDateString();
  }).length;

  const threatCount = activities.filter(a => a.type === 'threat_blocked').length;
  const teamCount = activities.filter(a => a.type === 'member_joined').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Activity Feed</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Track all actions and events across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Bell className="mr-2 h-4 w-4" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-yellow-500">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Today</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{todayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-red-400 to-red-600">
              <Ban className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Threats Blocked</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{threatCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-400 to-green-600">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">New Members</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{teamCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Events</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{activities.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">Filter:</span>
            {(['all', 'security', 'team', 'system'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Recent Activity</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Showing {filteredActivities.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No activities found for this filter</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
                
                {filteredActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      {/* Icon */}
                      <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl ${getIconBg(activity.color)}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-neutral-900 dark:text-white">
                                {activity.message}
                              </p>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityBadge(activity.severity)}`}>
                                {activity.severity}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                              {activity.details}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.user}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Load More Activities
          </Button>
        </div>
      )}
    </div>
  );
}
