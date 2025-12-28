'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import type { ApiKey } from '@/lib/types';

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.getApiKeys(),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.createApiKey({ name }),
    onSuccess: (response) => {
      setCreatedKey(response.data.key);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKeyName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const apiKeys = data?.data || [];

  const handleCreate = () => {
    if (newKeyName.trim()) {
      createMutation.mutate(newKeyName);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the API key "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key;
    return `${key.substring(0, 8)}${'•'.repeat(20)}${key.substring(key.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">API Keys</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Manage your authentication keys
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-neutral-50">Create New API Key</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-300">
              Give your API key a memorable name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">API Key Name</Label>
              <Input
                id="keyName"
                placeholder="Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || createMutation.isPending}
                className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Key'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName('');
                  setCreatedKey(null);
                }}
              >
                Cancel
              </Button>
            </div>

            {createdKey && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      API Key Created Successfully!
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                      Make sure to copy your key now. You won&apos;t be able to see it again!
                    </p>
                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-3 rounded border border-amber-300 dark:border-amber-700">
                      <code className="flex-1 text-sm font-mono text-neutral-900 dark:text-neutral-100 break-all">
                        {createdKey}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(createdKey, 'new')}
                      >
                        {copiedKey === 'new' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 mb-6">
              <Key className="h-16 w-16 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">No API Keys Yet</h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 font-medium">
              Create your first API key to get started
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {apiKeys.map((apiKey: ApiKey) => (
            <Card
              key={apiKey.id}
              className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
                      <Key className="h-6 w-6 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-neutral-900 dark:text-neutral-50">
                        {apiKey.name}
                      </CardTitle>
                      <CardDescription className="text-neutral-600 dark:text-neutral-400 mt-1">
                        Created {new Date(apiKey.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(apiKey.id, apiKey.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">API Key</Label>
                  <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <code className="flex-1 text-sm font-mono text-neutral-900 dark:text-neutral-100">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">Last Used:</span>
                    <p className="text-neutral-900 dark:text-neutral-100 font-semibold mt-1">
                      {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">Status:</span>
                    <p className="mt-1">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                        Active
                      </span>
                    </p>
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
