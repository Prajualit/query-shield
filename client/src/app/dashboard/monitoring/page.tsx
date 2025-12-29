"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Shield,
  AlertTriangle,
  Zap,
  Filter,
  RefreshCw,
} from "lucide-react";
import type { AuditLog } from "@/lib/types";

export default function MonitoringPage() {
  const [filter, setFilter] = useState<"all" | "threats" | "blocked">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch audit logs with auto-refresh
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["monitoring-logs"],
    queryFn: () => api.getAuditLogs({ limit: 50 }),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const logs = data?.data?.logs || [];

  // Calculate real-time metrics
  const lastMinuteLogs = logs.filter((log: AuditLog) => {
    const logTime = new Date(log.createdAt).getTime();
    const now = Date.now();
    return now - logTime < 60000; // Last minute
  });

  const metrics = {
    requestsPerMinute: lastMinuteLogs.length,
    threatsDetected: logs.filter((log: AuditLog) =>
      Array.isArray(log.detectedIssues) ? log.detectedIssues.length > 0 : false
    ).length,
    requestsBlocked: logs.filter((log: AuditLog) => log.action === "BLOCKED")
      .length,
    activeFirewalls: logs.reduce((acc: Set<string>, log: AuditLog) => {
      if (log.firewallId) acc.add(log.firewallId);
      return acc;
    }, new Set()).size,
  };

  const filteredLogs = logs.filter((log: AuditLog) => {
    if (filter === "threats") {
      return Array.isArray(log.detectedIssues) && log.detectedIssues.length > 0;
    }
    if (filter === "blocked") return log.action === "BLOCKED";
    return true;
  });

  const getThreatLevel = (
    log: AuditLog
  ): "none" | "low" | "medium" | "high" | "critical" => {
    const issues = Array.isArray(log.detectedIssues) ? log.detectedIssues : [];
    if (issues.length === 0) return "none";
    if (log.action === "BLOCKED") return "critical";
    if (issues.length >= 3) return "high";
    if (issues.length >= 2) return "medium";
    return "low";
  };

  const threatColors = {
    none: "text-green-600 dark:text-green-400",
    low: "text-blue-600 dark:text-blue-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    high: "text-orange-600 dark:text-orange-400",
    critical: "text-red-600 dark:text-red-400",
  };

  const actionColors = {
    BLOCKED: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
    REDACTED:
      "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
    ALLOWED:
      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">
            Loading monitoring data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
            Live Monitoring
          </h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Real-time request tracking and threat detection
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={
              autoRefresh
                ? "border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                : "hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
          {autoRefresh && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                LIVE
              </span>
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Requests/min
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.requestsPerMinute}
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Threats Detected
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.threatsDetected}
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Blocked
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.requestsBlocked}
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Active Firewalls
                </p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {metrics.activeFirewalls}
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
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Filter:
            </span>
            <div className="flex gap-2">
              {[
                { value: "all", label: "All Requests" },
                { value: "threats", label: "Threats Only" },
                { value: "blocked", label: "Blocked Only" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={filter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFilter(value as "all" | "threats" | "blocked")
                  }
                  className={
                    filter === value
                      ? "bg-linear-to-r from-amber-500 to-yellow-600"
                      : "hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="ml-auto text-sm text-neutral-600 dark:text-neutral-400">
              Showing {filteredLogs.length} of {logs.length} requests
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
              <CardTitle className="text-neutral-900 dark:text-neutral-50">
                Request Stream
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Live view of incoming requests and threats
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No requests to display</p>
                <p className="text-sm mt-1">
                  {filter !== "all"
                    ? `No ${
                        filter === "threats" ? "threats" : "blocked requests"
                      } found. Try changing the filter.`
                    : "Start using your firewall to see activity here."}
                </p>
              </div>
            ) : (
              filteredLogs.map((log: AuditLog) => {
                const threatLevel = getThreatLevel(log);
                const issues = Array.isArray(log.detectedIssues)
                  ? log.detectedIssues
                  : [];

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border transition-all ${
                      log.action === "BLOCKED"
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                        : issues.length > 0
                        ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                        : "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            actionColors[
                              log.action as keyof typeof actionColors
                            ]
                          }`}
                        >
                          {log.action}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {log.aiProvider || "Unknown Provider"}
                            </span>
                            {issues.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                                {issues.length}{" "}
                                {issues.length === 1 ? "issue" : "issues"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                            {log.inputText}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        <span
                          className={`font-semibold ${threatColors[threatLevel]}`}
                        >
                          {threatLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {issues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Detected Issues:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {issues.map(
                            (
                              issue: { type?: string } | string,
                              idx: number
                            ) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                              >
                                {typeof issue === "object" ? issue.type : issue}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
