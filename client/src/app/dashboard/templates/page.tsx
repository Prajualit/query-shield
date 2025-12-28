'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileCode,
  Shield,
  Download,
  Upload,
  Search,
  Star,
  Users,
  Filter,
  Plus,
  Copy,
  Check,
  ChevronRight,
  Heart,
  Sparkles,
  Building,
  CreditCard,
  Mail,
  Phone,
  Key,
  Globe
} from 'lucide-react';

// Mock templates data
const mockTemplates = [
  {
    id: '1',
    name: 'HIPAA Compliance',
    description: 'Protect PHI (Protected Health Information) for healthcare applications',
    category: 'Healthcare',
    icon: Building,
    color: 'bg-red-500',
    rules: 12,
    stars: 847,
    uses: 2341,
    author: 'QueryShield Team',
    isOfficial: true,
    patterns: ['SSN', 'Medical Record Numbers', 'Insurance IDs', 'Patient Names', 'Dates of Birth'],
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'PCI DSS',
    description: 'Credit card and payment data protection for e-commerce',
    category: 'Finance',
    icon: CreditCard,
    color: 'bg-blue-500',
    rules: 8,
    stars: 623,
    uses: 1892,
    author: 'QueryShield Team',
    isOfficial: true,
    patterns: ['Credit Card Numbers', 'CVV', 'Expiry Dates', 'Cardholder Names', 'Bank Account Numbers'],
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '3',
    name: 'GDPR Email & Contact',
    description: 'European privacy regulation compliant contact information protection',
    category: 'Privacy',
    icon: Mail,
    color: 'bg-purple-500',
    rules: 6,
    stars: 512,
    uses: 1567,
    author: 'QueryShield Team',
    isOfficial: true,
    patterns: ['Email Addresses', 'Phone Numbers', 'Physical Addresses', 'Names'],
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: '4',
    name: 'API Security',
    description: 'Detect and protect API keys, tokens, and credentials',
    category: 'Security',
    icon: Key,
    color: 'bg-amber-500',
    rules: 15,
    stars: 934,
    uses: 3421,
    author: 'QueryShield Team',
    isOfficial: true,
    patterns: ['AWS Keys', 'OpenAI Keys', 'GitHub Tokens', 'Database Passwords', 'JWT Secrets'],
    createdAt: '2024-02-15T10:00:00Z'
  },
  {
    id: '5',
    name: 'Phone Number International',
    description: 'Comprehensive phone number detection for global applications',
    category: 'PII',
    icon: Phone,
    color: 'bg-green-500',
    rules: 10,
    stars: 287,
    uses: 892,
    author: 'Community',
    isOfficial: false,
    patterns: ['US Phone', 'UK Phone', 'EU Phone', 'APAC Phone', 'International Format'],
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: '6',
    name: 'IP & Network Data',
    description: 'Network identifiers and infrastructure information protection',
    category: 'Infrastructure',
    icon: Globe,
    color: 'bg-cyan-500',
    rules: 7,
    stars: 198,
    uses: 654,
    author: 'Community',
    isOfficial: false,
    patterns: ['IPv4 Addresses', 'IPv6 Addresses', 'MAC Addresses', 'Hostnames', 'Port Numbers'],
    createdAt: '2024-03-15T10:00:00Z'
  },
];

const categories = ['All', 'Healthcare', 'Finance', 'Privacy', 'Security', 'PII', 'Infrastructure'];

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  rules: number;
  stars: number;
  uses: number;
  author: string;
  isOfficial: boolean;
  patterns: string[];
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates] = useState<Template[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [installingTemplate, setInstallingTemplate] = useState<string | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstallTemplate = (templateId: string) => {
    setInstallingTemplate(templateId);
    setTimeout(() => {
      setInstallingTemplate(null);
      setSelectedTemplate(null);
    }, 1500);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Template Library</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Pre-built firewall templates for common use cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Template
          </Button>
          <Button
            className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-10 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCode className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{templates.length}</p>
                <p className="text-xs text-neutral-500">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {templates.reduce((sum, t) => sum + t.rules, 0)}
                </p>
                <p className="text-xs text-neutral-500">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatNumber(templates.reduce((sum, t) => sum + t.stars, 0))}
                </p>
                <p className="text-xs text-neutral-500">Total Stars</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatNumber(templates.reduce((sum, t) => sum + t.uses, 0))}
                </p>
                <p className="text-xs text-neutral-500">Installations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card
              key={template.id}
              className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer group"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${template.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {template.isOfficial && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Official
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {template.patterns.slice(0, 3).map((pattern) => (
                    <span
                      key={pattern}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs"
                    >
                      {pattern}
                    </span>
                  ))}
                  {template.patterns.length > 3 && (
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs">
                      +{template.patterns.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {template.rules} rules
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {formatNumber(template.stars)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatNumber(template.uses)}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCode className="h-12 w-12 text-neutral-400 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">No templates found</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
              Try adjusting your search or filter
            </p>
          </CardContent>
        </Card>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${selectedTemplate.color}`}>
                    <selectedTemplate.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {selectedTemplate.name}
                      </h2>
                      {selectedTemplate.isOfficial && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <Sparkles className="h-3 w-3" />
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      by {selectedTemplate.author}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  ✕
                </button>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {selectedTemplate.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-center">
                  <Shield className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedTemplate.rules}</p>
                  <p className="text-xs text-neutral-500">Detection Rules</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-center">
                  <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{formatNumber(selectedTemplate.stars)}</p>
                  <p className="text-xs text-neutral-500">Stars</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-center">
                  <Download className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{formatNumber(selectedTemplate.uses)}</p>
                  <p className="text-xs text-neutral-500">Installations</p>
                </div>
              </div>

              {/* Patterns */}
              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Included Detection Patterns</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.patterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  onClick={() => handleInstallTemplate(selectedTemplate.id)}
                  disabled={installingTemplate === selectedTemplate.id}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
                >
                  {installingTemplate === selectedTemplate.id ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Installed!
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Install Template
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Clone
                </Button>
                <Button
                  variant="ghost"
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
