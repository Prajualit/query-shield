"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  AlertTriangle,
  Settings,
  Smartphone,
  Clock,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Notification, NotificationPreference } from "@/lib/types";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "settings">("inbox");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [emailDigest, setEmailDigest] = useState<
    "instant" | "daily" | "weekly"
  >("instant");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    if (activeTab === "settings") {
      fetchPreferences();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.getNotifications();
      setNotifications(response.data || []);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching notifications:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.getNotificationPreferences();
      setPreferences(response.data || []);
    } catch (err: unknown) {
      console.error("Error fetching preferences:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err: unknown) {
      console.error("Error marking as read:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err: unknown) {
      console.error("Error marking all as read:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (err: unknown) {
      console.error("Error deleting notification:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to delete notification");
    }
  };

  const clearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;

    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (err: unknown) {
      console.error("Error clearing notifications:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to clear notifications");
    }
  };

  const handleJoinOrganization = async (
    notificationId: string,
    token: string
  ) => {
    setActionLoading(notificationId);
    try {
      const response = await api.acceptInvitationByToken(token);
      if (response.success) {
        // Mark notification as read and remove it
        await deleteNotification(notificationId);

        // Fetch fresh user data to update organizationId in context
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.success && userResponse.data?.user) {
            // Update localStorage with fresh user data including org context
            const freshUser = userResponse.data.user;
            localStorage.setItem("user", JSON.stringify(freshUser));

            // Store organization ID if present
            if (freshUser.organizationId) {
              localStorage.setItem("currentOrgId", freshUser.organizationId);

              // Update Redux store with fresh user data
              dispatch(setUser(freshUser));

              alert(
                "Successfully joined the organization! Your dashboard will update now."
              );
              // No need to reload - Redux state updated
              return;
            }
          }
        } catch (err) {
          console.error("Error fetching updated user:", err);
        }

        // Fallback to reload if user fetch fails
        alert("Successfully joined the organization! Refreshing page...");
        // Refresh page to update context
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error("Error joining organization:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to join organization");
    } finally {
      setActionLoading(null);
    }
  };

  const togglePreference = async (
    prefId: string,
    channel: "email" | "push" | "slack"
  ) => {
    const pref = preferences.find((p) => p.id === prefId);
    if (!pref) return;

    const updatedValue = !pref[channel];

    try {
      await api.updateNotificationPreference(prefId, {
        [channel]: updatedValue,
      });
      setPreferences(
        preferences.map((p) =>
          p.id === prefId ? { ...p, [channel]: updatedValue } : p
        )
      );
    } catch (err: unknown) {
      console.error("Error updating preference:", err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to update preference");
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "CRITICAL":
        return { icon: AlertTriangle, color: "text-red-500 bg-red-500/20" };
      case "warning":
      case "WARNING":
        return {
          icon: AlertTriangle,
          color: "text-yellow-500 bg-yellow-500/20",
        };
      default:
        return { icon: Bell, color: "text-blue-500 bg-blue-500/20" };
    }
  };

  if (loading && activeTab === "inbox") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  if (error && activeTab === "inbox") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchNotifications} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manage your alerts and notification preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-medium">
              <Bell className="h-4 w-4" />
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "inbox"
              ? "text-amber-600 dark:text-amber-400 border-amber-500"
              : "text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "text-amber-600 dark:text-amber-400 border-amber-500"
              : "text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === "inbox" ? (
        <>
          {/* Notification Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              >
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
                  <BellOff className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {notifications.map((notification) => {
                    const { icon: Icon, color } = getSeverityIcon(
                      notification.severity
                    );
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                          !notification.read
                            ? "bg-amber-50/50 dark:bg-amber-900/10"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p
                                className={`font-medium ${
                                  !notification.read
                                    ? "text-neutral-900 dark:text-white"
                                    : "text-neutral-700 dark:text-neutral-300"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(notification.createdAt)}
                              </p>
                              {notification.metadata?.actionType ===
                                "JOIN_ORGANIZATION" &&
                              notification.metadata?.token ? (
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleJoinOrganization(
                                        notification.id,
                                        String(notification.metadata!.token)
                                      )
                                    }
                                    disabled={actionLoading === notification.id}
                                    className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg"
                                  >
                                    {actionLoading === notification.id
                                      ? "Joining..."
                                      : String(
                                          notification.metadata.actionLabel ||
                                            "Join Organization"
                                        )}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="text-neutral-400 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Email Digest Settings */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-neutral-500" />
                Email Digest
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Choose how often you receive email summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(["instant", "daily", "weekly"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setEmailDigest(option)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      emailDigest === option
                        ? "bg-amber-500 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-neutral-500" />
                Notification Channels
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Configure which notifications you receive on each channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Channel Headers */}
              <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="col-span-1"></div>
                <div className="flex flex-col items-center gap-1">
                  <Mail className="h-5 w-5 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Email</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Smartphone className="h-5 w-5 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Push</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <MessageSquare className="h-5 w-5 text-neutral-500" />
                  <span className="text-xs text-neutral-500">Slack</span>
                </div>
              </div>

              {/* Preference Rows */}
              <div className="space-y-4">
                {preferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="grid grid-cols-4 gap-4 items-center"
                  >
                    <div className="col-span-1">
                      <p className="font-medium text-neutral-900 dark:text-white text-sm">
                        {pref.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {pref.description}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePreference(pref.id, "email")}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                          pref.email
                            ? "bg-amber-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePreference(pref.id, "push")}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                          pref.push
                            ? "bg-amber-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePreference(pref.id, "slack")}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                          pref.slack
                            ? "bg-amber-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slack Integration */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-500" />
                Slack Integration
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Connect a Slack webhook to receive notifications in your
                workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="slack-webhook"
                    className="text-neutral-700 dark:text-neutral-300"
                  >
                    Webhook URL
                  </Label>
                  <Input
                    id="slack-webhook"
                    type="url"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    Test Connection
                  </Button>
                  <Button className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white">
                    Save Webhook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-white flex items-center gap-2">
                <BellOff className="h-5 w-5 text-neutral-500" />
                Quiet Hours
              </CardTitle>
              <CardDescription className="text-neutral-600 dark:text-neutral-400">
                Pause non-critical notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">
                    From
                  </Label>
                  <Input
                    type="time"
                    defaultValue="22:00"
                    className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">
                    To
                  </Label>
                  <Input
                    type="time"
                    defaultValue="08:00"
                    className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-neutral-700 dark:text-neutral-300">
                    Timezone
                  </Label>
                  <select className="w-full h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm">
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern (EST)</option>
                    <option value="PST">Pacific (PST)</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
