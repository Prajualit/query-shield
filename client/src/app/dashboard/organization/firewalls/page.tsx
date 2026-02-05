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
  Building2,
  AlertCircle,
  FileCode,
  ChevronRight,
  ChevronDown,
  Power
} from "lucide-react";
import type { Firewall, Rule } from "@/lib/types";

interface RuleFormData {
  name: string;
  type: string;
  pattern: string;
  action: string;
  priority: number;
  isActive: boolean;
}

export default function OrgFirewallsPage() {
  const { user } = useAppSelector((state) => state.auth);
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

  const fetchFirewalls = useCallback(async () => {
    if (!organizationId) return;
    try {
      const response = await api.getOrgFirewalls(organizationId);
      if (response.success) {
        setFirewalls(response.data || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch org firewalls:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to load organization firewalls");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchFirewalls();
  }, [fetchFirewalls]);

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
    if (!newFirewallName.trim() || !organizationId) return;
    setActionLoading(true);
    try {
      const response = await api.createOrgFirewall(organizationId, {
        name: newFirewallName,
        description: newFirewallDescription || undefined,
      });
      if (response.success) {
        setSuccess("Organization firewall created successfully!");
        setNewFirewallName("");
        setNewFirewallDescription("");
        setShowCreateFirewallModal(false);
        fetchFirewalls();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFirewall = async (firewallId: string) => {
    if (!organizationId) return;
    if (!confirm("Are you sure you want to delete this firewall? All associated rules will be deleted.")) return;
    setActionLoading(true);
    try {
      await api.deleteOrgFirewall(organizationId, firewallId);
      setSuccess("Firewall deleted successfully!");
      fetchFirewalls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFirewall = async (firewall: Firewall) => {
    if (!organizationId) return;
    setActionLoading(true);
    try {
      await api.updateOrgFirewall(organizationId, firewall.id, { isActive: !firewall.isActive });
      setSuccess(`Firewall ${firewall.isActive ? 'disabled' : 'enabled'} successfully!`);
      fetchFirewalls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to update firewall");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim() || !newRule.pattern.trim() || !selectedFirewall || !organizationId) return;
    setActionLoading(true);
    try {
      await api.createOrgFirewallRule(organizationId, selectedFirewall.id, newRule);
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
      fetchFirewalls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to create rule");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (firewallId: string, ruleId: string) => {
    if (!organizationId) return;
    if (!confirm("Are you sure you want to delete this rule?")) return;
    setActionLoading(true);
    try {
      await api.deleteOrgFirewallRule(organizationId, firewallId, ruleId);
      setSuccess("Rule deleted successfully!");
      fetchFirewalls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to delete rule");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRuleActive = async (firewallId: string, rule: Rule) => {
    if (!organizationId) return;
    setActionLoading(true);
    try {
      await api.updateOrgFirewallRule(organizationId, firewallId, rule.id, { isActive: !rule.isActive });
      setSuccess(`Rule ${rule.isActive ? 'disabled' : 'enabled'} successfully!`);
      fetchFirewalls();
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
            <Building2 className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Organization Required</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Organization firewalls are only available for organization members.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Admin Access Required</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Only organization admins can manage organization-level firewalls. These firewalls apply to all teams in the organization.
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
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading organization firewalls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Organization Firewalls</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Manage firewalls that apply to <span className="text-amber-600">all teams</span> in your organization
          </p>
        </div>
        <Button
          onClick={() => setShowCreateFirewallModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Firewall
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

      {/* Firewalls List */}
      {firewalls.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 mb-6">
              <Shield className="h-16 w-16 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              No organization firewalls yet
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 font-medium text-center max-w-md">
              Create organization-level firewalls to enforce security rules across all teams. These rules apply to every team member.
            </p>
            <Button
              onClick={() => setShowCreateFirewallModal(true)}
              className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Firewall
            </Button>
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
                        ? "bg-linear-to-br from-green-400 to-emerald-600 shadow-green-500/30"
                        : "bg-linear-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700"
                    }`}>
                      <Shield className={`h-6 w-6 ${firewall.isActive ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-neutral-900 dark:text-neutral-50">
                          {firewall.name}
                        </CardTitle>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold">
                          Organization-wide
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                        No rules configured. Click &quot;Add Rule&quot; to create one.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Firewall Modal */}
      {showCreateFirewallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white dark:bg-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-900 dark:text-neutral-100">Create Organization Firewall</CardTitle>
              <CardDescription>
                This firewall will apply to <strong>all teams</strong> in your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Firewall Name</label>
                <Input
                  value={newFirewallName}
                  onChange={(e) => setNewFirewallName(e.target.value)}
                  placeholder="e.g., PII Protection"
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
                Create a detection rule for this organization firewall
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rule Name</label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Block Credit Card Numbers"
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
                  placeholder="e.g., \b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b"
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
