'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download } from 'lucide-react';
import type { AuditLog } from '@/lib/types';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, action],
    queryFn: () => api.getAuditLogs({ page, limit: 20, search, action }),
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  const handleExport = async () => {
    try {
      const blob = await api.exportAuditLogs({ action });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">View all firewall activity</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Firewall</th>
                      <th className="pb-3 font-medium">Action</th>
                      <th className="pb-3 font-medium">Provider</th>
                      <th className="pb-3 font-medium">Detections</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log: AuditLog) => (
                      <tr key={log.id} className="text-sm">
                        <td className="py-3">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className="font-medium">{log.firewall?.name || 'N/A'}</span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === 'BLOCKED'
                                ? 'bg-red-100 text-red-700'
                                : log.action === 'REDACTED'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{log.aiProvider || 'N/A'}</td>
                        <td className="py-3 text-gray-600">
                          {Array.isArray(log.detectedIssues) ? log.detectedIssues.length : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {logs.length} of {pagination.total} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
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
