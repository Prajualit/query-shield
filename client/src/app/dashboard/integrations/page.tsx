'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Code,
  Copy,
  CheckCircle,
  Terminal,
  BookOpen,
  Zap,
  Globe,
  Key,
  Shield,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

type Language = 'javascript' | 'typescript' | 'python' | 'curl';

const codeExamples: Record<Language, Record<string, string>> = {
  javascript: {
    install: `npm install @queryshield/sdk`,
    init: `import { QueryShield } from '@queryshield/sdk';

const shield = new QueryShield({
  apiKey: 'your-api-key',
  firewallId: 'firewall-id'
});`,
    protect: `// Protect text before sending to AI
const result = await shield.protect({
  text: 'User input with email@example.com',
  provider: 'openai',
  model: 'gpt-4'
});

console.log(result.sanitized); // Redacted text
console.log(result.detected);  // Array of detected issues`,
    proxy: `// Use as a proxy for OpenAI
const response = await shield.proxy({
  provider: 'openai',
  endpoint: '/v1/chat/completions',
  body: {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: userInput }
    ]
  }
});`,
    webhook: `// Listen for detection events
shield.on('detection', (event) => {
  console.log('Detected:', event.type);
  console.log('Value:', event.value);
  console.log('Action:', event.action);
});`
  },
  typescript: {
    install: `npm install @queryshield/sdk`,
    init: `import { QueryShield, ShieldConfig } from '@queryshield/sdk';

const config: ShieldConfig = {
  apiKey: 'your-api-key',
  firewallId: 'firewall-id'
};

const shield = new QueryShield(config);`,
    protect: `import { ProtectResult, DetectedIssue } from '@queryshield/sdk';

const result: ProtectResult = await shield.protect({
  text: 'User input with email@example.com',
  provider: 'openai',
  model: 'gpt-4'
});

const sanitized: string = result.sanitized;
const issues: DetectedIssue[] = result.detected;`,
    proxy: `import { ProxyResponse } from '@queryshield/sdk';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const response: ProxyResponse = await shield.proxy({
  provider: 'openai',
  endpoint: '/v1/chat/completions',
  body: {
    model: 'gpt-4',
    messages: [
      { role: 'user', content: userInput }
    ] as ChatMessage[]
  }
});`,
    webhook: `import { DetectionEvent } from '@queryshield/sdk';

shield.on('detection', (event: DetectionEvent) => {
  console.log('Type:', event.type);
  console.log('Severity:', event.severity);
  console.log('Timestamp:', event.timestamp);
});`
  },
  python: {
    install: `pip install queryshield`,
    init: `from queryshield import QueryShield

shield = QueryShield(
    api_key="your-api-key",
    firewall_id="firewall-id"
)`,
    protect: `# Protect text before sending to AI
result = shield.protect(
    text="User input with email@example.com",
    provider="openai",
    model="gpt-4"
)

print(result.sanitized)  # Redacted text
print(result.detected)   # List of detected issues`,
    proxy: `# Use as a proxy for OpenAI
response = shield.proxy(
    provider="openai",
    endpoint="/v1/chat/completions",
    body={
        "model": "gpt-4",
        "messages": [
            {"role": "user", "content": user_input}
        ]
    }
)`,
    webhook: `# Listen for detection events using callback
@shield.on_detection
def handle_detection(event):
    print(f"Detected: {event.type}")
    print(f"Value: {event.value}")
    print(f"Action: {event.action}")`
  },
  curl: {
    install: `# No installation required - use the REST API directly`,
    init: `# Set your API key as an environment variable
export QUERYSHIELD_API_KEY="your-api-key"
export QUERYSHIELD_FIREWALL_ID="firewall-id"`,
    protect: `# Protect text using the REST API
curl -X POST https://api.queryshield.io/v1/protect \\
  -H "Authorization: Bearer $QUERYSHIELD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "User input with email@example.com",
    "firewallId": "'$QUERYSHIELD_FIREWALL_ID'",
    "provider": "openai",
    "model": "gpt-4"
  }'`,
    proxy: `# Proxy request through QueryShield
curl -X POST https://api.queryshield.io/v1/proxy/openai \\
  -H "Authorization: Bearer $QUERYSHIELD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firewallId": "'$QUERYSHIELD_FIREWALL_ID'",
    "endpoint": "/v1/chat/completions",
    "body": {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": "Hello"}]
    }
  }'`,
    webhook: `# Configure webhook endpoint
curl -X POST https://api.queryshield.io/v1/webhooks \\
  -H "Authorization: Bearer $QUERYSHIELD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["detection", "blocked", "alert"]
  }'`
  }
};

export default function IntegrationsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const languages: { id: Language; name: string; icon: string }[] = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨' },
    { id: 'typescript', name: 'TypeScript', icon: '🔷' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'curl', name: 'cURL / REST', icon: '🌐' },
  ];

  const CodeBlock = ({ code, blockKey }: { code: string; blockKey: string }) => (
    <div className="relative group">
      <pre className="p-4 rounded-xl bg-neutral-950 overflow-x-auto">
        <code className="text-sm text-neutral-300 font-mono whitespace-pre">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(code, blockKey)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
      >
        {copiedCode === blockKey ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">SDK & Integrations</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Integrate QueryShield into your applications
          </p>
        </div>
        <Button
          variant="outline"
          className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Full Documentation
        </Button>
      </div>

      {/* Quick Start Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 mb-4">
              <Key className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">1. Get API Key</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Generate an API key from the API Keys page to authenticate your requests.
            </p>
            <Button
              variant="link"
              className="px-0 text-amber-600 dark:text-amber-400 mt-2"
            >
              Go to API Keys <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-blue-600 mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">2. Create Firewall</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Set up a firewall with detection rules to protect your AI interactions.
            </p>
            <Button
              variant="link"
              className="px-0 text-amber-600 dark:text-amber-400 mt-2"
            >
              Go to Firewalls <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-400 to-green-600 mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">3. Integrate SDK</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Install our SDK and start protecting your AI prompts in minutes.
            </p>
            <Button
              variant="link"
              className="px-0 text-amber-600 dark:text-amber-400 mt-2"
            >
              View Examples <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Language Selector */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedLanguage === lang.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{lang.icon}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <div className="space-y-6">
        {/* Installation */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-neutral-500" />
              Installation
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Install the SDK using your package manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={codeExamples[selectedLanguage].install} 
              blockKey="install"
            />
          </CardContent>
        </Card>

        {/* Initialization */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
              <Code className="h-5 w-5 text-neutral-500" />
              Initialize the SDK
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Set up your API key and configure the client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={codeExamples[selectedLanguage].init} 
              blockKey="init"
            />
          </CardContent>
        </Card>

        {/* Protect Text */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-neutral-500" />
              Protect Text
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Sanitize user input before sending to AI providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={codeExamples[selectedLanguage].protect} 
              blockKey="protect"
            />
          </CardContent>
        </Card>

        {/* Proxy Requests */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-neutral-500" />
              Proxy AI Requests
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Route requests through QueryShield for automatic protection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={codeExamples[selectedLanguage].proxy} 
              blockKey="proxy"
            />
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-neutral-500" />
              Event Webhooks
            </CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Listen for real-time detection events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock 
              code={codeExamples[selectedLanguage].webhook} 
              blockKey="webhook"
            />
          </CardContent>
        </Card>
      </div>

      {/* API Reference */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-neutral-500" />
            API Reference
          </CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Complete API documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Endpoints</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">POST /v1/protect</code>
                  <span>Protect text</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">POST /v1/proxy/*</code>
                  <span>Proxy requests</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">GET /v1/firewalls</code>
                  <span>List firewalls</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded">GET /v1/audit-logs</code>
                  <span>Fetch logs</span>
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Response Codes</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">200</code>
                  <span>Success</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">400</code>
                  <span>Bad request</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">401</code>
                  <span>Unauthorized</span>
                </li>
                <li className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <code className="bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">429</code>
                  <span>Rate limited</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supported Providers */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Supported AI Providers</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            QueryShield works with all major AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'OpenAI', models: 'GPT-4, GPT-3.5, DALL-E' },
              { name: 'Anthropic', models: 'Claude 3, Claude 2' },
              { name: 'Google', models: 'Gemini Pro, PaLM' },
              { name: 'Cohere', models: 'Command, Embed' },
            ].map((provider) => (
              <div
                key={provider.name}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
              >
                <p className="font-medium text-neutral-900 dark:text-white">{provider.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{provider.models}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
