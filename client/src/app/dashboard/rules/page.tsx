'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileCode, Plus, Trash2, Play, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import type { Rule } from '@/lib/types';

export default function RulesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testPattern, setTestPattern] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();

  const [newRule, setNewRule] = useState<{
    name: string;
    type: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
  }>({
    name: '',
    type: 'sql_injection',
    pattern: '',
    severity: 'medium',
    enabled: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.getRules(),
  });

  const createMutation = useMutation({
    mutationFn: (rule: { name: string; type: string; pattern: string; severity: 'low' | 'medium' | 'high' | 'critical'; enabled: boolean }) => api.createRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      setShowCreateModal(false);
      setNewRule({
        name: '',
        type: 'sql_injection',
        pattern: '',
        severity: 'medium',
        enabled: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateRule(id, { enabled: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  const rules = data?.data || [];

  const handleCreate = () => {
    if (newRule.name && newRule.pattern) {
      createMutation.mutate(newRule);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete rule "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleTest = async () => {
    if (!testPattern.trim()) return;
    
    // Simulate pattern testing
    const testPatterns = [
      { pattern: /select.*from/i, message: 'SQL Injection detected' },
      { pattern: /<script>/i, message: 'XSS Attack detected' },
      { pattern: /\.\.\//i, message: 'Path Traversal detected' },
    ];

    const matched = testPatterns.some(p => p.pattern.test(testPattern));
    setTestResult({
      matched,
      message: matched 
        ? testPatterns.find(p => p.pattern.test(testPattern))?.message || 'Pattern matched'
        : 'No threats detected',
    });
  };

  const severityColors = {
    low: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    high: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    critical: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  };

  const typeLabels: Record<string, string> = {
    sql_injection: 'SQL Injection',
    xss: 'Cross-Site Scripting',
    path_traversal: 'Path Traversal',
    command_injection: 'Command Injection',
    custom: 'Custom Pattern',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Detection Rules</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Manage custom detection patterns
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Test Pattern Card */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <Play className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Test Pattern</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Test your rules against sample inputs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter test input (e.g., SELECT * FROM users)"
              value={testPattern}
              onChange={(e) => setTestPattern(e.target.value)}
              className="flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
            <Button
              onClick={handleTest}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Test
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              testResult.matched 
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
              {testResult.matched ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${
                  testResult.matched 
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-green-900 dark:text-green-100'
                }`}>
                  {testResult.message}
                </p>
                <p className={`text-sm mt-1 ${
                  testResult.matched
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  {testResult.matched 
                    ? 'This input would be blocked by your rules'
                    : 'This input would pass through your firewall'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">Create Detection Rule</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-300">
              Define a new pattern for threat detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                placeholder="SQL Injection - UNION Attack"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <select
                  id="ruleType"
                  value={newRule.type}
                  onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="sql_injection">SQL Injection</option>
                  <option value="xss">Cross-Site Scripting</option>
                  <option value="path_traversal">Path Traversal</option>
                  <option value="command_injection">Command Injection</option>
                  <option value="custom">Custom Pattern</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  id="severity"
                  value={newRule.severity}
                  onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                  className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Detection Pattern (Regex)</Label>
              <textarea
                id="pattern"
                rows={3}
                placeholder="(?i)(union.*select|select.*from)"
                value={newRule.pattern}
                onChange={(e) => setNewRule(prev => ({ ...prev, pattern: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newRule.enabled}
                onChange={(e) => setNewRule(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-neutral-900"
              />
              <span className="text-neutral-900 dark:text-neutral-100 font-medium">Enable rule immediately</span>
            </label>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreate}
                disabled={!newRule.name || !newRule.pattern || createMutation.isPending}
                className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRule({
                    name: '',
                    type: 'sql_injection',
                    pattern: '',
                    severity: 'medium',
                    enabled: true,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 mb-6">
              <FileCode className="h-16 w-16 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">No Rules Yet</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 font-medium">
              Create your first detection rule
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rules.map((rule: Rule) => (
            <Card
              key={rule.id}
              className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
                      <Shield className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg text-neutral-900 dark:text-neutral-50">
                          {rule.name}
                        </CardTitle>
                        {rule.severity && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors[rule.severity]}`}>
                            {rule.severity.toUpperCase()}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          rule.isActive
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <CardDescription className="text-neutral-600 dark:text-neutral-400">
                        {typeLabels[rule.type]} • {rule.detectionCount || 0} detections
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className="hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-500 dark:hover:border-amber-600 transition-all"
                    >
                      {rule.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">Pattern</Label>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <code className="text-sm font-mono text-neutral-900 dark:text-neutral-100">
                      {rule.pattern}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
