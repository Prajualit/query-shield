"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Shield, 
  Crown, 
  UserMinus, 
  Copy,
  Check,
  AlertCircle
} from "lucide-react";

interface OrganizationMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    lastActive: string | null;
  };
}

interface Organization {
  id: string;
  name: string;
  uniqueId: string;
  createdAt: string;
  _count: { members: number; teams: number };
}

export default function OrganizationPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use organizationId from user object or localStorage
  const organizationId = user?.organizationId || (typeof window !== "undefined" ? localStorage.getItem("currentOrgId") : null);
  const isAdmin = user?.orgRole === "ADMIN";

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) return;
    try {
      const response = await api.getOrganization(organizationId);
      if (response.success) {
        setOrganization(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch organization:", err);
    }
  }, [organizationId]);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;
    try {
      const response = await api.getOrganizationMembers(organizationId);
      if (response.success) {
        setMembers(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
  }, [fetchOrganization, fetchMembers]);

  // Clear success/error messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCopyOrgId = () => {
    if (organization?.uniqueId) {
      navigator.clipboard.writeText(organization.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!organizationId) return;
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) return;
    
    setActionLoading(memberId);
    try {
      await api.removeOrganizationMember(organizationId, memberId);
      setSuccess(`${memberEmail} has been removed from the organization.`);
      fetchMembers();
      fetchOrganization();
    } catch (err) {
      setError("Failed to remove member. They may be the organization creator.");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    if (!organizationId) return;
    
    setActionLoading(memberId);
    try {
      await api.updateOrganizationMemberRole(organizationId, memberId, newRole);
      setSuccess("Role updated successfully!");
      fetchMembers();
    } catch (err) {
      setError("Failed to update role.");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Check if user belongs to an organization
  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Organization Membership Required</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              This page is only available for users who belong to an organization.
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
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  const admins = members.filter((m) => m.role === "ADMIN");
  const regularMembers = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Organization</h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
          Manage your organization settings and members
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center gap-2">
          <Check className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {/* Organization Info */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-500">Name</label>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{organization?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500">Unique ID</label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded font-mono text-neutral-800 dark:text-neutral-200">
                  {organization?.uniqueId}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyOrgId} className="h-8 w-8 p-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500">Members</label>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{organization?._count.members}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-500">Teams</label>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{organization?._count.teams}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Role */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isAdmin ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30"
            }`}>
              {isAdmin ? (
                <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Your Role: {isAdmin ? "Administrator" : "Member"}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {isAdmin 
                  ? "You have full access to manage the organization, teams, and view all activity."
                  : "You can view your own activity and participate in assigned teams."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Organization Members
          </CardTitle>
          <CardDescription>{members.length} total member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Administrators */}
          <div>
            <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider mb-3">
              Administrators ({admins.length})
            </h4>
            <div className="space-y-2">
              {admins.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {member.user.name || member.user.email}
                        {member.user.id === user?.id && (
                          <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-neutral-500">{member.user.email}</p>
                    </div>
                  </div>
                  {isAdmin && member.user.id !== user?.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateRole(member.id, "MEMBER")}
                        disabled={actionLoading === member.id}
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        Demote to Member
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user.email)}
                        disabled={actionLoading === member.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Regular Members */}
          <div>
            <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider mb-3">
              Members ({regularMembers.length})
            </h4>
            {regularMembers.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No regular members yet. Go to Invitations to invite members.</p>
            ) : (
              <div className="space-y-2">
                {regularMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {member.user.name || member.user.email}
                          {member.user.id === user?.id && (
                            <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-neutral-500">{member.user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRole(member.id, "ADMIN")}
                          disabled={actionLoading === member.id}
                          className="text-neutral-700 dark:text-neutral-300"
                        >
                          Promote to Admin
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                          disabled={actionLoading === member.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
