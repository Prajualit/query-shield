"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Eye } from "lucide-react";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");

  const isOrgMember = !!user?.organizationId;
  const isAdmin = user?.orgRole === "ADMIN";
  const organizationId = typeof window !== "undefined" ? localStorage.getItem("currentOrgId") : null;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, search, action, organizationId],
    queryFn: () => api.getAuditLogs({ 
      page, 
      limit: 20, 
      search, 
      action,
      ...(organizationId ? { organizationId } : {}),
    }),
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  const handleExport = async () => {
    try {
      const blob = await api.exportAuditLogs({
        action,
        ...(organizationId ? { organizationId } : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">
            Loading audit logs...
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
            Audit Logs
          </h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            {isOrgMember && isAdmin 
              ? "View all organization firewall activity" 
              : isOrgMember 
                ? "View your firewall activity"
                : "View all firewall activity"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isOrgMember && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {isAdmin ? "Viewing all team activity" : "Viewing your activity only"}
              </span>
            </div>
          )}
          <Button
            onClick={handleExport}
            className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Actions</option>
              <option value="BLOCKED">Blocked</option>
              <option value="REDACTED">Redacted</option>
              <option value="ALLOWED">Allowed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-50">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                No audit logs found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-200 dark:border-neutral-700">
                    <tr className="text-left text-sm text-neutral-600 dark:text-neutral-400 font-semibold">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Firewall</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Detections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {logs.map((log: AuditLog) => (
                      <tr
                        key={log.id}
                        className="text-sm text-neutral-800 dark:text-neutral-200"
                      >
                        <td className="py-3">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="font-medium">
                            {log.firewall?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === "BLOCKED"
                                ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                                : log.action === "REDACTED"
                                ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                                : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-700 dark:text-neutral-300">
                          {log.aiProvider || "N/A"}
                        </td>
                        <td className="py-3 text-neutral-700 dark:text-neutral-300">
                          {Array.isArray(log.detectedIssues)
                            ? log.detectedIssues.length
                            : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    Showing {logs.length} of {pagination.total} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
