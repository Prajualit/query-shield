'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Shield, Bell, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Firewall defaults
  const [firewallDefaults, setFirewallDefaults] = useState({
    defaultRateLimit: '1000',
    defaultSqlInjectionProtection: true,
    defaultXssProtection: true,
    defaultPathTraversalProtection: true,
    defaultAiValidation: true,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    threatDetections: true,
    systemUpdates: false,
    weeklyReports: true,
    criticalOnly: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => api.updateProfile(data),
    onSuccess: () => {
      showSuccess('Profile');
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updateFirewallMutation = useMutation({
    mutationFn: (data: Record<string, string | boolean>) => api.updateFirewallDefaults(data),
    onSuccess: () => {
      showSuccess('Firewall defaults');
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => api.updateNotificationSettings(data),
    onSuccess: () => {
      showSuccess('Notification preferences');
    },
  });

  const showSuccess = (section: string) => {
    setSaveSuccess(section);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleProfileSave = () => {
    const updates: { name: string; email: string; currentPassword?: string; newPassword?: string } = {
      name: profileData.name,
      email: profileData.email,
    };

    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        alert('New passwords do not match!');
        return;
      }
      updates.currentPassword = profileData.currentPassword;
      updates.newPassword = profileData.newPassword;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleFirewallSave = () => {
    updateFirewallMutation.mutate(firewallDefaults);
  };

  const handleNotificationsSave = () => {
    updateNotificationsMutation.mutate(notifications);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Settings</h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <User className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Profile Settings</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Update your personal information and password
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Change Password</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isPending}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              {updateProfileMutation.isPending ? (
                'Saving...'
              ) : saveSuccess === 'Profile' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Firewall Defaults */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <Shield className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Firewall Defaults</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Default settings for new firewall configurations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Default Rate Limit (requests/hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              value={firewallDefaults.defaultRateLimit}
              onChange={(e) => setFirewallDefaults(prev => ({ ...prev, defaultRateLimit: e.target.value }))}
              className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="space-y-3">
            <Label>Default Protection Modules</Label>
            <div className="space-y-3">
              {[
                { key: 'defaultSqlInjectionProtection', label: 'SQL Injection Protection' },
                { key: 'defaultXssProtection', label: 'XSS Protection' },
                { key: 'defaultPathTraversalProtection', label: 'Path Traversal Protection' },
                { key: 'defaultAiValidation', label: 'AI-Powered Validation' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firewallDefaults[key as keyof typeof firewallDefaults] as boolean}
                    onChange={(e) => setFirewallDefaults(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-neutral-900"
                  />
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleFirewallSave}
              disabled={updateFirewallMutation.isPending}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              {updateFirewallMutation.isPending ? (
                'Saving...'
              ) : saveSuccess === 'Firewall defaults' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Defaults
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <Bell className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-neutral-900 dark:text-neutral-50">Notification Settings</CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-300">
                Configure how you receive alerts and updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive notifications via email' },
              { key: 'threatDetections', label: 'Threat Detections', description: 'Alerts for detected threats' },
              { key: 'systemUpdates', label: 'System Updates', description: 'Product updates and announcements' },
              { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of activity and threats' },
              { key: 'criticalOnly', label: 'Critical Only', description: 'Only critical severity alerts' },
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="w-5 h-5 mt-0.5 rounded border-neutral-300 dark:border-neutral-600 text-amber-600 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-neutral-900"
                />
                <div className="flex-1">
                  <div className="text-neutral-900 dark:text-neutral-100 font-medium">{label}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleNotificationsSave}
              disabled={updateNotificationsMutation.isPending}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
            >
              {updateNotificationsMutation.isPending ? (
                'Saving...'
              ) : saveSuccess === 'Notification preferences' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
