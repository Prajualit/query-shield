'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  RefreshCw,
  Shield,
  CheckCircle,
  FileSpreadsheet,
  FileJson,
  File,
  Filter,
  Plus,
  Trash2,
  Play,
  Pause,
  Settings,
  Mail,
  BarChart3
} from 'lucide-react';

// Mock report history
const mockReportHistory = [
  {
    id: '1',
    name: 'Weekly Security Report',
    type: 'security',
    format: 'pdf',
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    size: '2.4 MB',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Monthly Compliance Audit',
    type: 'compliance',
    format: 'csv',
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    size: '1.8 MB',
    status: 'completed'
  },
  {
    id: '3',
    name: 'Detection Summary - December',
    type: 'detections',
    format: 'json',
    generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    size: '890 KB',
    status: 'completed'
  },
  {
    id: '4',
    name: 'GDPR Data Export',
    type: 'gdpr',
    format: 'zip',
    generatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    size: '5.2 MB',
    status: 'completed'
  },
];

// Mock scheduled reports
const mockScheduledReports = [
  {
    id: '1',
    name: 'Weekly Security Summary',
    frequency: 'weekly',
    nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'pdf',
    recipients: ['admin@company.com'],
    isActive: true
  },
  {
    id: '2',
    name: 'Monthly Compliance Report',
    frequency: 'monthly',
    nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'csv',
    recipients: ['compliance@company.com', 'admin@company.com'],
    isActive: true
  },
  {
    id: '3',
    name: 'Daily Detection Log',
    frequency: 'daily',
    nextRun: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    format: 'json',
    recipients: ['security@company.com'],
    isActive: false
  },
];

type ReportType = 'security' | 'compliance' | 'detections' | 'gdpr' | 'custom';
type ReportFormat = 'pdf' | 'csv' | 'json' | 'zip';

export default function ReportsPage() {
  const [reportHistory, setReportHistory] = useState(mockReportHistory);
  const [scheduledReports, setScheduledReports] = useState(mockScheduledReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('security');
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport = {
        id: Date.now().toString(),
        name: `${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        format: selectedFormat,
        generatedAt: new Date().toISOString(),
        size: '1.2 MB',
        status: 'completed'
      };
      setReportHistory([newReport, ...reportHistory]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownload = (reportId: string) => {
    // In a real app, this would trigger a file download
    console.log('Downloading report:', reportId);
  };

  const handleDeleteReport = (reportId: string) => {
    setReportHistory(reportHistory.filter(r => r.id !== reportId));
  };

  const toggleSchedule = (scheduleId: string) => {
    setScheduledReports(scheduledReports.map(s =>
      s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const deleteSchedule = (scheduleId: string) => {
    setScheduledReports(scheduledReports.filter(s => s.id !== scheduleId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return File;
      case 'csv':
        return FileSpreadsheet;
      case 'json':
        return FileJson;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security':
        return 'bg-red-500/20 text-red-500';
      case 'compliance':
        return 'bg-purple-500/20 text-purple-500';
      case 'detections':
        return 'bg-amber-500/20 text-amber-500';
      case 'gdpr':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-neutral-500/20 text-neutral-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports & Compliance</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Generate compliance reports and export your data
          </p>
        </div>
        <Button
          onClick={() => setShowScheduleModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-yellow-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Total Reports</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{reportHistory.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-blue-600">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Scheduled</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{scheduledReports.filter(s => s.isActive).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-400 to-green-600">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Compliance Rate</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">98.5%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-purple-400 to-purple-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Data Protected</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">12.4k</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Generate Report</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Create a one-time report for your selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label className="text-neutral-700 dark:text-neutral-300">Report Type</Label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
              >
                <option value="security">Security Summary</option>
                <option value="compliance">Compliance Audit</option>
                <option value="detections">Detection Report</option>
                <option value="gdpr">GDPR Data Export</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-neutral-700 dark:text-neutral-300">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-700 dark:text-neutral-300">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label className="text-neutral-700 dark:text-neutral-300">Format</Label>
              <div className="flex gap-2">
                {(['pdf', 'csv', 'json'] as const).map((format) => {
                  const Icon = getFormatIcon(format);
                  return (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFormat === format
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {format.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Scheduled Reports</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Automated reports delivered to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
              <Calendar className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No scheduled reports</p>
              <p className="text-xs mt-1">Create a schedule to automate report generation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map((schedule) => {
                const FormatIcon = getFormatIcon(schedule.format);
                return (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      schedule.isActive
                        ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeColor(schedule.name.includes('Security') ? 'security' : schedule.name.includes('Compliance') ? 'compliance' : 'detections')}`}>
                        <FormatIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{schedule.name}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule.frequency}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Next: {formatDate(schedule.nextRun)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSchedule(schedule.id)}
                        className={schedule.isActive ? 'text-green-500 hover:text-green-600' : 'text-neutral-400 hover:text-neutral-600'}
                      >
                        {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report History */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-neutral-900 dark:text-white">Report History</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Previously generated reports available for download
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No reports generated yet</p>
              <p className="text-xs mt-1">Generate your first report above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Report Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Format</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Generated</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Size</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {reportHistory.map((report) => {
                    const FormatIcon = getFormatIcon(report.format);
                    return (
                      <tr key={report.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <FormatIcon className="h-5 w-5 text-neutral-400" />
                            <span className="font-medium text-neutral-900 dark:text-white">{report.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(report.type)}`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                          {report.format.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                          {formatDate(report.generatedAt)}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                          {report.size}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(report.id)}
                              className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-neutral-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Compliance Section */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            GDPR Compliance Tools
          </CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Tools to help you maintain GDPR compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left group">
              <Download className="h-6 w-6 text-blue-500 mb-3" />
              <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">Data Export</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Export all user data in a portable format</p>
            </button>
            <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left group">
              <Trash2 className="h-6 w-6 text-red-500 mb-3" />
              <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">Data Deletion</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Request permanent deletion of user data</p>
            </button>
            <button className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left group">
              <FileText className="h-6 w-6 text-purple-500 mb-3" />
              <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">Processing Records</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">View records of data processing activities</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg mx-4 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Schedule New Report</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Report Name</Label>
                <Input
                  placeholder="e.g., Weekly Security Summary"
                  className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Report Type</Label>
                <select className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm">
                  <option value="security">Security Summary</option>
                  <option value="compliance">Compliance Audit</option>
                  <option value="detections">Detection Report</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Frequency</Label>
                <select className="w-full h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Recipients (comma-separated)</Label>
                <Input
                  placeholder="admin@company.com, security@company.com"
                  className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowScheduleModal(false)}
                className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
