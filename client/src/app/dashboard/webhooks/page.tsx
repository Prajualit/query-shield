'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Webhook,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Clock,
  AlertTriangle,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

// Mock webhooks data
const mockWebhooks = [
  {
    id: '1',
    name: 'Security Alerts',
    url: 'https://api.company.com/webhooks/security',
    events: ['threat_blocked', 'pii_detected'],
    secret: 'whsec_abc123def456ghi789',
    isActive: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    successRate: 98.5,
    totalDeliveries: 1234
  },
  {
    id: '2',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXX',
    events: ['detection', 'firewall_updated'],
    secret: 'whsec_xyz789abc123def456',
    isActive: true,
    lastTriggered: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    successRate: 100,
    totalDeliveries: 567
  },
  {
    id: '3',
    name: 'Analytics Pipeline',
    url: 'https://analytics.internal.com/ingest/queryshield',
    events: ['all'],
    secret: 'whsec_qwe456rty789uio012',
    isActive: false,
    lastTriggered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    successRate: 95.2,
    totalDeliveries: 8901
  },
];

// Available event types
const eventTypes = [
  { id: 'threat_blocked', name: 'Threat Blocked', description: 'When a malicious request is blocked' },
  { id: 'pii_detected', name: 'PII Detected', description: 'When personal data is detected' },
  { id: 'detection', name: 'Any Detection', description: 'When any sensitive data is detected' },
  { id: 'firewall_updated', name: 'Firewall Updated', description: 'When firewall rules change' },
  { id: 'api_key_used', name: 'API Key Used', description: 'When an API key is used' },
  { id: 'rate_limit', name: 'Rate Limit Hit', description: 'When rate limit is reached' },
  { id: 'all', name: 'All Events', description: 'Receive all event types' },
];

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered: string;
  successRate: number;
  totalDeliveries: number;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretFor, setShowSecretFor] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });

  const handleCreateWebhook = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) return;

    const webhook: Webhook = {
      id: Date.now().toString(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      isActive: true,
      lastTriggered: '',
      successRate: 100,
      totalDeliveries: 0
    };

    setWebhooks([...webhooks, webhook]);
    setNewWebhook({ name: '', url: '', events: [] });
    setShowCreateModal(false);
  };

  const toggleWebhook = (webhookId: string) => {
    setWebhooks(webhooks.map(w =>
      w.id === webhookId ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const deleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(w => w.id !== webhookId));
  };

  const testWebhook = (webhookId: string) => {
    setTestingWebhook(webhookId);
    setTimeout(() => setTestingWebhook(null), 2000);
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
  };

  const toggleEventSelection = (eventId: string) => {
    if (eventId === 'all') {
      setNewWebhook({ ...newWebhook, events: ['all'] });
    } else {
      const events = newWebhook.events.filter(e => e !== 'all');
      if (events.includes(eventId)) {
        setNewWebhook({ ...newWebhook, events: events.filter(e => e !== eventId) });
      } else {
        setNewWebhook({ ...newWebhook, events: [...events, eventId] });
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-500';
    if (rate >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Webhooks</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-yellow-500">
              <Webhook className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Webhooks</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{webhooks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-400 to-green-600">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Active</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {webhooks.filter(w => w.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-blue-600">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Deliveries</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {webhooks.reduce((sum, w) => sum + w.totalDeliveries, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-purple-400 to-purple-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Avg Success Rate</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {(webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length || 0).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Configured Webhooks</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Manage your webhook endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
              <Webhook className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No webhooks configured</p>
              <p className="text-xs mt-1">Add a webhook to start receiving events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`p-4 rounded-xl border ${
                    webhook.isActive
                      ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${webhook.isActive ? 'bg-green-500' : 'bg-neutral-400'}`} />
                        <h3 className="font-medium text-neutral-900 dark:text-white">{webhook.name}</h3>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono truncate">
                          {webhook.url}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium"
                            >
                              {event}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {formatDate(webhook.lastTriggered)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {webhook.totalDeliveries} deliveries
                          </span>
                          <span className={`flex items-center gap-1 ${getSuccessRateColor(webhook.successRate)}`}>
                            {webhook.successRate >= 95 ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {webhook.successRate}% success
                          </span>
                        </div>

                        {/* Secret */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">Secret:</span>
                          <code className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded font-mono text-neutral-700 dark:text-neutral-300">
                            {showSecretFor === webhook.id ? webhook.secret : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSecretFor(showSecretFor === webhook.id ? null : webhook.id)}
                            className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                          >
                            {showSecretFor === webhook.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copySecret(webhook.secret)}
                            className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-600"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={testingWebhook === webhook.id}
                        className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                      >
                        {testingWebhook === webhook.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWebhook(webhook.id)}
                        className={webhook.isActive ? 'text-green-500' : 'text-neutral-400'}
                      >
                        {webhook.isActive ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWebhook(webhook.id)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Payload Example */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Payload Format</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Example webhook payload your endpoint will receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-xl bg-neutral-950 overflow-x-auto">
            <code className="text-sm text-neutral-300 font-mono">{`{
  "event": "detection",
  "timestamp": "2024-12-20T14:30:00.000Z",
  "data": {
    "firewallId": "fw_abc123",
    "requestId": "req_xyz789",
    "detections": [
      {
        "type": "EMAIL",
        "value": "j***@example.com",
        "action": "REDACT",
        "confidence": 0.99
      }
    ],
    "action": "SANITIZED",
    "provider": "openai"
  },
  "signature": "sha256=abc123def456..."
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg mx-4 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Add Webhook</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Name</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g., Security Alerts"
                  className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Endpoint URL</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.example.com/webhooks"
                  className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Events</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {eventTypes.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => toggleEventSelection(event.id)}
                      className={`p-3 rounded-lg text-left text-sm transition-all ${
                        newWebhook.events.includes(event.id)
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs mt-0.5 opacity-80">{event.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
