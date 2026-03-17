"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Mail, Clock, X, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function InvitationsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const organizationId = user?.organizationId || (typeof window !== "undefined" ? localStorage.getItem("currentOrgId") : null);
  const isAdmin = user?.orgRole === "ADMIN";

  const fetchInvitations = useCallback(async () => {
    if (!organizationId) {
      console.log("No organizationId found. User:", user);
      return;
    }
    console.log("Fetching invitations for org:", organizationId, "User role:", user?.orgRole);
    try {
      const response = await api.getOrganizationInvitations(organizationId);
      if (response.success) {
        setInvitations(response.data || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch invitations:", err);

      const errorWithResponse = err as {
        response?: { data?: { message?: string } };
      };

      console.error("Error response:", errorWithResponse.response?.data);
      setError(errorWithResponse.response?.data?.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, [organizationId, user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !organizationId) return;
    setError("");
    setActionLoading("send");
    try {
      await api.inviteOrganizationMember(organizationId, {
        email: inviteEmail,
        role: inviteRole,
      });
      setSuccess("Invitation sent successfully!");
      setInviteEmail("");
      setInviteRole("MEMBER");
      setShowInviteModal(false);
      fetchInvitations();
    } catch (err) {
      setError("Failed to send invitation. The email may already be invited or a member.");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    setActionLoading(invitationId);
    try {
      await api.cancelInvitation(invitationId);
      setSuccess("Invitation cancelled successfully!");
      fetchInvitations();
    } catch (err) {
      setError("Failed to cancel invitation");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await api.resendInvitation(invitationId);
      setSuccess("Invitation resent successfully!");
      fetchInvitations();
    } catch (err) {
      setError("Failed to resend invitation");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "EXPIRED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-neutral-500" />;
      default:
        return <Clock className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "ACCEPTED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "EXPIRED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "CANCELLED":
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Only organization administrators can manage invitations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading invitations...</p>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING");
  const otherInvitations = invitations.filter((inv) => inv.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Invitations</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Invite new members to your organization
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Pending Invitations */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Invitations
          </CardTitle>
          <CardDescription>{pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? "s" : ""} awaiting response</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No pending invitations</p>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          invitation.role === "ADMIN" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {invitation.role}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${actionLoading === invitation.id ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation History */}
      {otherInvitations.length > 0 && (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle>Invitation History</CardTitle>
            <CardDescription>Past invitations and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      {getStatusIcon(invitation.status)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{invitation.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Sent {new Date(invitation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite New Member</CardTitle>
              <CardDescription>Send an invitation to join your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole("MEMBER")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      inviteRole === "MEMBER"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">Member</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">View their own activity</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("ADMIN")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      inviteRole === "ADMIN"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">Admin</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Full access to all data</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteRole("MEMBER");
                    setError("");
                  }} 
                  className="flex-1"
                  disabled={actionLoading === "send"}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={actionLoading === "send" || !inviteEmail.trim()}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white disabled:opacity-50"
                >
                  {actionLoading === "send" ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
