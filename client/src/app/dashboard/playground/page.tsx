'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Zap,
  Copy,
  Shuffle,
  Eye,
  EyeOff,
  FileText,
  Code,
  Mail,
  Phone,
  CreditCard,
  Key
} from 'lucide-react';

// Sample data templates for testing
const sampleTemplates = [
  {
    name: 'PII Data',
    icon: Mail,
    description: 'Test with personal identifiable information',
    content: `Hello, my name is John Smith and I need help with my account.
My email is john.smith@example.com and you can reach me at (555) 123-4567.
My social security number is 123-45-6789 and I live at 123 Main Street, New York, NY 10001.`
  },
  {
    name: 'Credit Card',
    icon: CreditCard,
    description: 'Test credit card detection',
    content: `I want to make a purchase using my credit card.
Card Number: 4532015112830366
Expiry: 12/25
CVV: 123
Billing Address: 456 Oak Avenue, Los Angeles, CA 90001`
  },
  {
    name: 'API Keys',
    icon: Key,
    description: 'Test API key and secret detection',
    content: `Here are my configuration details:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234
GitHub Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  },
  {
    name: 'Code Snippet',
    icon: Code,
    description: 'Test code with embedded secrets',
    content: `// Database connection
const dbConfig = {
  host: 'production-db.example.com',
  user: 'admin',
  password: 'SuperSecret123!',
  database: 'users_prod'
};

// API configuration
const apiKey = 'sk-live-abcdef123456789';
const webhookSecret = 'whsec_1234567890abcdef';`
  },
  {
    name: 'IP Addresses',
    icon: Phone,
    description: 'Test IP address detection',
    content: `Server Configuration:
Primary Server: 192.168.1.100
Backup Server: 10.0.0.55
Public IP: 203.0.113.42
IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
Gateway: 192.168.1.1`
  },
  {
    name: 'Mixed Content',
    icon: FileText,
    description: 'Test with various sensitive data types',
    content: `Customer Support Ticket #12345

Customer: Jane Doe
Email: jane.doe@company.com
Phone: +1 (800) 555-0199
SSN: 987-65-4321
Account: 4111-1111-1111-1111

Issue: Cannot access API with key: api_key_xxxxxxxxxxxxxxxx
Server IP: 172.16.254.1
Please reset my password: CurrentPass123!`
  }
];

// Detection patterns for client-side preview
const detectionPatterns = [
  { name: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'EMAIL', severity: 'medium' },
  { name: 'Phone', pattern: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g, type: 'PHONE', severity: 'medium' },
  { name: 'Credit Card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, type: 'CREDIT_CARD', severity: 'critical' },
  { name: 'SSN', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, type: 'SSN', severity: 'critical' },
  { name: 'AWS Key', pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g, type: 'API_KEY', severity: 'critical' },
  { name: 'AWS Secret', pattern: /[A-Za-z0-9/+=]{40}/g, type: 'API_KEY', severity: 'critical' },
  { name: 'OpenAI Key', pattern: /sk-(?:proj-)?[A-Za-z0-9]{20,}/g, type: 'API_KEY', severity: 'critical' },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g, type: 'API_KEY', severity: 'critical' },
  { name: 'IPv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, type: 'IP_ADDRESS', severity: 'low' },
  { name: 'IPv6', pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g, type: 'IP_ADDRESS', severity: 'low' },
  { name: 'Password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi, type: 'PASSWORD', severity: 'critical' },
];

interface Detection {
  type: string;
  value: string;
  startIndex: number;
  endIndex: number;
  severity: string;
  patternName: string;
}

interface AnalysisResult {
  detections: Detection[];
  sanitizedText: string;
  riskScore: number;
  processingTime: number;
}

export default function PlaygroundPage() {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [selectedAction, setSelectedAction] = useState<'REDACT' | 'MASK' | 'BLOCK'>('REDACT');

  const analyzeText = useCallback(() => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    const startTime = performance.now();

    // Simulate processing delay
    setTimeout(() => {
      const detections: Detection[] = [];

      // Run all detection patterns
      detectionPatterns.forEach(({ name, pattern, type, severity }) => {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(inputText)) !== null) {
          // Avoid duplicate detections at the same position
          const isDuplicate = detections.some(
            d => d.startIndex === match!.index && d.endIndex === match!.index + match![0].length
          );
          if (!isDuplicate) {
            detections.push({
              type,
              value: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              severity,
              patternName: name
            });
          }
        }
      });

      // Sort detections by position (reverse order for replacement)
      detections.sort((a, b) => b.startIndex - a.startIndex);

      // Apply sanitization based on selected action
      let sanitizedText = inputText;
      if (selectedAction !== 'BLOCK') {
        detections.forEach(detection => {
          const replacement = selectedAction === 'REDACT' 
            ? `[${detection.type}_REDACTED]`
            : '*'.repeat(detection.value.length);
          sanitizedText = 
            sanitizedText.slice(0, detection.startIndex) + 
            replacement + 
            sanitizedText.slice(detection.endIndex);
        });
      }

      // Calculate risk score
      const riskScore = Math.min(100, detections.reduce((score, d) => {
        switch (d.severity) {
          case 'critical': return score + 25;
          case 'high': return score + 15;
          case 'medium': return score + 10;
          case 'low': return score + 5;
          default: return score;
        }
      }, 0));

      const processingTime = performance.now() - startTime;

      // Re-sort for display (by position ascending)
      detections.sort((a, b) => a.startIndex - b.startIndex);

      setResult({
        detections,
        sanitizedText,
        riskScore,
        processingTime
      });
      setIsAnalyzing(false);
    }, 500);
  }, [inputText, selectedAction]);

  const loadTemplate = (template: typeof sampleTemplates[0]) => {
    setInputText(template.content);
    setResult(null);
  };

  const generateRandomData = () => {
    const randomIndex = Math.floor(Math.random() * sampleTemplates.length);
    loadTemplate(sampleTemplates[randomIndex]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setInputText('');
    setResult(null);
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[severity] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Testing Playground</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Test your detection rules with sample or custom data in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateRandomData}
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Random Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Sample Templates */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-neutral-900 dark:text-white">Sample Templates</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Click a template to load sample data for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {sampleTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => loadTemplate(template)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
              >
                <template.icon className="h-6 w-6 text-neutral-500 dark:text-neutral-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{template.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-neutral-900 dark:text-white">Input Text</CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  Enter or paste text to analyze for sensitive data
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(inputText)}
                  className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setResult(null);
              }}
              placeholder="Enter text containing potentially sensitive data..."
              className="w-full h-64 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
            />
            
            {/* Action Selection */}
            <div className="space-y-2">
              <Label className="text-neutral-700 dark:text-neutral-300">Sanitization Action</Label>
              <div className="flex gap-2">
                {(['REDACT', 'MASK', 'BLOCK'] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedAction === action
                        ? 'bg-amber-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={analyzeText}
              disabled={!inputText.trim() || isAnalyzing}
              className="w-full bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Analyze Text
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-neutral-900 dark:text-white">Analysis Results</CardTitle>
                <CardDescription className="text-neutral-600 dark:text-neutral-400">
                  {result ? `${result.detections.length} sensitive items detected` : 'Run analysis to see results'}
                </CardDescription>
              </div>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                >
                  {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-400 dark:text-neutral-500">
                <Shield className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Enter text and click Analyze to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Risk Score */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${result.riskScore >= 50 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                      {result.riskScore >= 50 ? (
                        <AlertTriangle className={`h-5 w-5 ${getRiskColor(result.riskScore)}`} />
                      ) : (
                        <CheckCircle className={`h-5 w-5 ${getRiskColor(result.riskScore)}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Risk Score</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Processed in {result.processingTime.toFixed(2)}ms
                      </p>
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}%
                  </div>
                </div>

                {/* Sanitized Text Preview */}
                <div className="space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">
                    {showOriginal ? 'Original Text' : 'Sanitized Output'}
                  </Label>
                  <div className="h-32 overflow-auto p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-sm">
                    <pre className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                      {showOriginal ? inputText : result.sanitizedText}
                    </pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(showOriginal ? inputText : result.sanitizedText)}
                    className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>

                {/* Detections List */}
                {result.detections.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-neutral-700 dark:text-neutral-300">Detected Items</Label>
                    <div className="max-h-48 overflow-auto space-y-2">
                      {result.detections.map((detection, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityBadge(detection.severity)}`}>
                              {detection.severity.toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">{detection.patternName}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate max-w-[200px]">
                                {detection.value}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            pos: {detection.startIndex}-{detection.endIndex}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detection Statistics */}
      {result && result.detections.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Detection Statistics</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Breakdown of detected sensitive data by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(
                result.detections.reduce((acc, d) => {
                  acc[d.type] = (acc[d.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div
                  key={type}
                  className="flex flex-col items-center p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700"
                >
                  <Zap className="h-6 w-6 text-amber-500 mb-2" />
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">{count}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
