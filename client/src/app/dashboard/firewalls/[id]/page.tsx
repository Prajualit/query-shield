'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Save, Trash2, ArrowLeft, CheckCircle, Activity } from 'lucide-react';

export default function FirewallDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['firewall', params.id],
    queryFn: () => api.getFirewall(params.id),
  });

  const firewall = data?.data;

  const [formData, setFormData] = useState({
    name: firewall?.name || '',
    targetUrl: firewall?.targetUrl || '',
    rateLimit: firewall?.rateLimit || 1000,
    sqlInjectionProtection: firewall?.sqlInjectionProtection ?? true,
    xssProtection: firewall?.xssProtection ?? true,
    pathTraversalProtection: firewall?.pathTraversalProtection ?? true,
    aiValidation: firewall?.aiValidation ?? true,
    enabled: firewall?.enabled ?? true,
  });

  // Update form when data loads
  useState(() => {
    if (firewall) {
      setFormData({
        name: firewall.name || '',
        targetUrl: firewall.targetUrl || '',
        rateLimit: firewall.rateLimit || 1000,
        sqlInjectionProtection: firewall.sqlInjectionProtection ?? true,
        xssProtection: firewall.xssProtection ?? true,
        pathTraversalProtection: firewall.pathTraversalProtection ?? true,
        aiValidation: firewall.aiValidation ?? true,
        enabled: firewall.enabled ?? true,
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string | number | boolean>) => api.updateFirewall(params.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firewall', params.id] });
      queryClient.invalidateQueries({ queryKey: ['firewalls'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteFirewall(params.id),
    onSuccess: () => {
      router.push('/dashboard/firewalls');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${firewall?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading firewall...</p>
        </div>
      </div>
    );
  }

  if (!firewall) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Firewall not found</p>
          <Button
            onClick={() => router.push('/dashboard/firewalls')}
            variant="outline"
            className="mt-4"
          >
            Back to Firewalls
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/firewalls')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">{firewall.name}</h1>
            <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
              Configure firewall settings
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-800"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Firewall
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Total Requests</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {firewall.stats?.totalRequests || 0}
                </p>
              </div>
              <Activity className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Threats Blocked</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {firewall.stats?.threatsBlocked || 0}
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {firewall.stats?.successRate || 0}%
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">Avg Response</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mt-2">
                  {firewall.stats?.avgResponseTime || 0}ms
                </p>
              </div>
              <Activity className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Form */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <Shield className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Firewall Configuration</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Update settings and protection modules
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Basic Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Firewall Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL</Label>
                <Input
                  id="targetUrl"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={formData.rateLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Protection Modules */}
          <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Protection Modules</h3>
            <div className="space-y-3">
              {[
                { key: 'sqlInjectionProtection', label: 'SQL Injection Protection', description: 'Detect and block SQL injection attempts' },
                { key: 'xssProtection', label: 'XSS Protection', description: 'Prevent cross-site scripting attacks' },
                { key: 'pathTraversalProtection', label: 'Path Traversal Protection', description: 'Block directory traversal attempts' },
                { key: 'aiValidation', label: 'AI-Powered Validation', description: 'Use AI to detect advanced threats' },
              ].map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 cursor-pointer p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 mt-0.5 rounded border-neutral-300 dark:border-neutral-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-neutral-900"
                  />
                  <div className="flex-1">
                    <div className="text-neutral-900 dark:text-neutral-100 font-medium">{label}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Status</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-neutral-900"
              />
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">Firewall Enabled</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-6">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              {updateMutation.isPending ? (
                'Saving...'
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/firewalls')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
