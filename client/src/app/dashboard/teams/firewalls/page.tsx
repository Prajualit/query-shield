"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Users,
  FileCode,
  ChevronRight,
  ChevronDown,
  Power,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import type { Firewall, Rule } from "@/lib/types";

interface Team {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

interface TeamMember {
  id: string;
  role: "MANAGER" | "MEMBER";
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface RuleFormData {
  name: string;
  type: string;
  pattern: string;
  action: string;
  priority: number;
  isActive: boolean;
}

export default function TeamFirewallsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showCreateFirewallModal, setShowCreateFirewallModal] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [selectedFirewall, setSelectedFirewall] = useState<Firewall | null>(null);
  const [expandedFirewall, setExpandedFirewall] = useState<string | null>(null);
  
  // Form states
  const [newFirewallName, setNewFirewallName] = useState("");
  const [newFirewallDescription, setNewFirewallDescription] = useState("");
  const [newRule, setNewRule] = useState<RuleFormData>({
    name: "",
    type: "CUSTOM_REGEX",
    pattern: "",
    action: "BLOCK",
    priority: 0,
    isActive: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const organizationId = user?.organizationId || (typeof window !== "undefined" ? localStorage.getItem("currentOrgId") : null);
  const isAdmin = user?.orgRole === "ADMIN";

  // Check if current user is a manager of the selected team
  const isTeamManager = selectedTeam && teamMembers.some(
    (m) => m.user.id === user?.id && m.role === "MANAGER"
  );

  // User can manage firewalls if they're org admin or team manager
  const canManageFirewalls = isAdmin || isTeamManager;

  const fetchTeams = useCallback(async () => {
    if (!organizationId) return;
    try {
      const response = await api.getOrganizationTeams(organizationId);
      if (response.success) {
        setTeams(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    try {
      const response = await api.getTeamMembersById(teamId);
      if (response.success) {
        setTeamMembers(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    }
  }, []);

  const fetchTeamFirewalls = useCallback(async (teamId: string) => {
    try {
      const response = await api.getTeamFirewalls(teamId);
      if (response.success) {
        setFirewalls(response.data || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch team firewalls:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load team firewalls");
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
      fetchTeamFirewalls(selectedTeam.id);
    }
  }, [selectedTeam, fetchTeamMembers, fetchTeamFirewalls]);

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

  const handleCreateFirewall = async () => {
    if (!newFirewallName.trim() || !selectedTeam) return;
    setActionLoading(true);
    try {
      const response = await api.createTeamFirewall(selectedTeam.id, {
        name: newFirewallName,
        description: newFirewallDescription || undefined,
      });
      if (response.success) {
        setSuccess("Team firewall created successfully!");
        setNewFirewallName("");
        setNewFirewallDescription("");
        setShowCreateFirewallModal(false);
        fetchTeamFirewalls(selectedTeam.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFirewall = async (firewallId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to delete this firewall? All associated rules will be deleted.")) return;
    setActionLoading(true);
    try {
      await api.deleteTeamFirewall(selectedTeam.id, firewallId);
      setSuccess("Firewall deleted successfully!");
      fetchTeamFirewalls(selectedTeam.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFirewall = async (firewall: Firewall) => {
    if (!selectedTeam) return;
    setActionLoading(true);
    try {
      await api.updateTeamFirewall(selectedTeam.id, firewall.id, { isActive: !firewall.isActive });
      setSuccess(`Firewall ${firewall.isActive ? 'disabled' : 'enabled'} successfully!`);
      fetchTeamFirewalls(selectedTeam.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to update firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim() || !newRule.pattern.trim() || !selectedFirewall || !selectedTeam) return;
    setActionLoading(true);
    try {
      await api.createTeamFirewallRule(selectedTeam.id, selectedFirewall.id, newRule);
      setSuccess("Rule created successfully!");
      setNewRule({
        name: "",
        type: "CUSTOM_REGEX",
        pattern: "",
        action: "BLOCK",
        priority: 0,
        isActive: true,
      });
      setShowCreateRuleModal(false);
      fetchTeamFirewalls(selectedTeam.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create rule");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (firewallId: string, ruleId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to delete this rule?")) return;
    setActionLoading(true);
    try {
      await api.deleteTeamFirewallRule(selectedTeam.id, firewallId, ruleId);
      setSuccess("Rule deleted successfully!");
      fetchTeamFirewalls(selectedTeam.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete rule");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRuleActive = async (firewallId: string, rule: Rule) => {
    if (!selectedTeam) return;
    setActionLoading(true);
    try {
      await api.updateTeamFirewallRule(selectedTeam.id, firewallId, rule.id, { isActive: !rule.isActive });
      setSuccess(`Rule ${rule.isActive ? 'disabled' : 'enabled'} successfully!`);
      fetchTeamFirewalls(selectedTeam.id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to update rule");
    } finally {
      setActionLoading(false);
    }
  };

  const ruleTypes = [
    { value: "EMAIL", label: "Email Detection" },
    { value: "PHONE", label: "Phone Number" },
    { value: "CREDIT_CARD", label: "Credit Card" },
    { value: "SSN", label: "Social Security Number" },
    { value: "API_KEY", label: "API Key" },
    { value: "IP_ADDRESS", label: "IP Address" },
    { value: "PII", label: "Personal Information (PII)" },
    { value: "CODE_SECRET", label: "Code Secrets" },
    { value: "CUSTOM_REGEX", label: "Custom Regex" },
  ];

  const actionTypes = [
    { value: "BLOCK", label: "Block" },
    { value: "REDACT", label: "Redact" },
    { value: "MASK", label: "Mask" },
    { value: "WARN", label: "Warn" },
    { value: "ALLOW", label: "Allow" },
  ];

  // Not an org member
  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Organization Required</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Team firewalls are only available for organization members.
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
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/teams" className="text-amber-600 hover:text-amber-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Team Firewalls</h1>
          </div>
          <p className="mt-1 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Manage firewalls for specific teams. Select a team to view and manage its firewalls.
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Select a Team</CardTitle>
              <CardDescription>{teams.length} team{teams.length !== 1 ? "s" : ""} available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-500 text-sm">No teams found</p>
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(team);
                      setFirewalls([]);
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500"
                        : "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{team.name}</h3>
                        <p className="text-sm text-neutral-500">{team._count.members} member{team._count.members !== 1 ? "s" : ""}</p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-neutral-400 ${selectedTeam?.id === team.id ? 'text-amber-500' : ''}`} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Firewalls Section */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="space-y-4">
              {/* Team Header with Create Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{selectedTeam.name}</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {canManageFirewalls ? (
                      <span>You can manage firewalls for this team</span>
                    ) : (
                      <span className="text-amber-600">View only - Only team managers can edit</span>
                    )}
                  </p>
                </div>
                {canManageFirewalls && (
                  <Button
                    onClick={() => setShowCreateFirewallModal(true)}
                    className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Firewall
                  </Button>
                )}
              </div>

              {/* Firewalls List */}
              {firewalls.length === 0 ? (
                <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 rounded-2xl bg-linear-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 mb-6">
                      <Shield className="h-16 w-16 text-blue-700 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                      No team firewalls yet
                    </h3>
                    <p className="text-neutral-700 dark:text-neutral-300 mb-6 font-medium text-center max-w-md">
                      {canManageFirewalls 
                        ? "Create team-specific firewalls to enforce security rules for this team only."
                        : "No firewalls have been created for this team yet. Contact a team manager to create one."
                      }
                    </p>
                    {canManageFirewalls && (
                      <Button
                        onClick={() => setShowCreateFirewallModal(true)}
                        className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Firewall
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {firewalls.map((firewall) => (
                    <Card key={firewall.id} className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setExpandedFirewall(expandedFirewall === firewall.id ? null : firewall.id)}
                              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                            >
                              {expandedFirewall === firewall.id ? (
                                <ChevronDown className="h-5 w-5 text-neutral-500" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-neutral-500" />
                              )}
                            </button>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${
                              firewall.isActive
                                ? "bg-linear-to-br from-blue-400 to-cyan-600 shadow-blue-500/30"
                                : "bg-linear-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700"
                            }`}>
                              <Shield className={`h-6 w-6 ${firewall.isActive ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg text-neutral-900 dark:text-neutral-50">
                                  {firewall.name}
                                </CardTitle>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                                  Team-only
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                  firewall.isActive
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                                }`}>
                                  {firewall.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              {firewall.description && (
                                <CardDescription className="mt-1 text-neutral-600 dark:text-neutral-400">
                                  {firewall.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                              {firewall._count?.rules || 0} rules
                            </span>
                            {canManageFirewalls && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleFirewall(firewall)}
                                  disabled={actionLoading}
                                  className={firewall.isActive ? "text-amber-600" : "text-green-600"}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFirewall(firewall);
                                    setShowCreateRuleModal(true);
                                  }}
                                  className="text-blue-600"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Rule
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteFirewall(firewall.id)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Rules Section */}
                      {expandedFirewall === firewall.id && (
                        <CardContent className="pt-0">
                          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                              <FileCode className="h-4 w-4" />
                              Detection Rules
                            </h4>
                            {firewall.rules && firewall.rules.length > 0 ? (
                              <div className="space-y-2">
                                {firewall.rules.map((rule) => (
                                  <div
                                    key={rule.id}
                                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-neutral-400'}`} />
                                      <div>
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{rule.name}</p>
                                        <p className="text-xs text-neutral-500">
                                          {rule.type} • {rule.action} • Priority: {rule.priority}
                                        </p>
                                      </div>
                                    </div>
                                    {canManageFirewalls && (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleRuleActive(firewall.id, rule)}
                                          disabled={actionLoading}
                                          className={rule.isActive ? "text-amber-600" : "text-green-600"}
                                        >
                                          <Power className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteRule(firewall.id, rule.id)}
                                          disabled={actionLoading}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                                No rules configured. {canManageFirewalls && "Click \"Add Rule\" to create one."}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">Select a team to manage its firewalls</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Firewall Modal */}
      {showCreateFirewallModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white dark:bg-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-neutral-100">Create Team Firewall</CardTitle>
              <CardDescription>
                This firewall will apply only to <strong>{selectedTeam.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Firewall Name</label>
                <Input
                  value={newFirewallName}
                  onChange={(e) => setNewFirewallName(e.target.value)}
                  placeholder="e.g., Engineering Team Rules"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Description (optional)</label>
                <Input
                  value={newFirewallDescription}
                  onChange={(e) => setNewFirewallDescription(e.target.value)}
                  placeholder="Describe what this firewall protects against"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateFirewallModal(false);
                    setNewFirewallName("");
                    setNewFirewallDescription("");
                  }}
                  className="flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFirewall}
                  disabled={actionLoading || !newFirewallName.trim()}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
                >
                  {actionLoading ? "Creating..." : "Create Firewall"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateRuleModal && selectedFirewall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white dark:bg-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-neutral-100">Add Rule to {selectedFirewall.name}</CardTitle>
              <CardDescription>
                Create a detection rule for this team firewall
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rule Name</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Block API Keys"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                    className="mt-1 w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  >
                    {ruleTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    className="mt-1 w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  >
                    {actionTypes.map((action) => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pattern (Regex)</label>
                <Input
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  placeholder="e.g., sk-[a-zA-Z0-9]{48}"
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-neutral-500 mt-1">Enter a regular expression pattern to match</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Priority</label>
                <Input
                  type="number"
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">Higher priority rules are evaluated first</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateRuleModal(false);
                    setSelectedFirewall(null);
                    setNewRule({
                      name: "",
                      type: "CUSTOM_REGEX",
                      pattern: "",
                      action: "BLOCK",
                      priority: 0,
                      isActive: true,
                    });
                  }}
                  className="flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={actionLoading || !newRule.name.trim() || !newRule.pattern.trim()}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
                >
                  {actionLoading ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
