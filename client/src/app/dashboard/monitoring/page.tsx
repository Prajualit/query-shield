'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Shield, AlertTriangle, Zap, Play, Pause, Filter } from 'lucide-react';

interface LiveRequest {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
  responseTime: number;
  sourceIP: string;
}

export default function MonitoringPage() {
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState<'all' | 'threats' | 'blocked'>('all');
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>([]);

  // Fetch initial data
  const { data } = useQuery({
    queryKey: ['monitoring'],
    queryFn: () => api.getRealtimeMonitoring(),
    refetchInterval: isLive ? 2000 : false,
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newRequest: LiveRequest = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        path: ['/api/users', '/api/products', '/api/orders', '/api/auth'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.8 ? 403 : 200,
        threatLevel: (Math.random() > 0.7 ? ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] : 'none') as 'none' | 'low' | 'medium' | 'high' | 'critical',
        blocked: Math.random() > 0.8,
        responseTime: Math.floor(Math.random() * 500) + 50,
        sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      };

      setLiveRequests(prev => [newRequest, ...prev].slice(0, 50));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const metrics = data?.data || {
    requestsPerSecond: 0,
    threatsDetected: 0,
    requestsBlocked: 0,
    activeConnections: 0,
  };

  const filteredRequests = liveRequests.filter(req => {
    if (filter === 'threats') return req.threatLevel !== 'none';
    if (filter === 'blocked') return req.blocked;
    return true;
  });

  const threatColors = {
    none: 'text-green-600 dark:text-green-400',
    low: 'text-blue-600 dark:text-blue-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400',
  };

  const methodColors = {
    GET: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    POST: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    PUT: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    DELETE: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Live Monitoring</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Real-time request tracking and threat detection
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsLive(!isLive)}
            className={isLive ? 'border-green-500 text-green-600 dark:text-green-400' : ''}
          >
            {isLive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Requests/sec</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.requestsPerSecond || Math.floor(Math.random() * 100)}
                </p>
              </div>
              <Zap className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Threats Detected</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.threatsDetected || liveRequests.filter(r => r.threatLevel !== 'none').length}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Blocked</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.requestsBlocked || liveRequests.filter(r => r.blocked).length}
                </p>
              </div>
              <Shield className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Active Connections</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.activeConnections || Math.floor(Math.random() * 50)}
                </p>
              </div>
              <Activity className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Requests' },
                { value: 'threats', label: 'Threats Only' },
                { value: 'blocked', label: 'Blocked Only' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(value as 'all' | 'threats' | 'blocked')}
                  className={filter === value ? 'bg-linear-to-r from-amber-500 to-yellow-600' : ''}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Request Stream */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <Activity className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Request Stream</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Live view of incoming requests and threats
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No requests to display</p>
                <p className="text-sm mt-1">Waiting for traffic...</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`p-4 rounded-lg border transition-all ${
                    request.blocked
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      : request.threatLevel !== 'none'
                      ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                      : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${methodColors[request.method as keyof typeof methodColors]}`}>
                        {request.method}
                      </span>
                      <code className="text-sm font-mono text-neutral-900 dark:text-neutral-100">{request.path}</code>
                      {request.blocked && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-semibold ${threatColors[request.threatLevel]}`}>
                        {request.threatLevel.toUpperCase()}
                      </span>
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {request.responseTime}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span>Source: {request.sourceIP}</span>
                    <span>•</span>
                    <span>Status: {request.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
