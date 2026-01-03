"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Trash2, UserPlus, UserMinus, FolderOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Team {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

interface TeamMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  joinedAt: string;
}

export default function TeamsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Use organizationId from user object or localStorage
  const organizationId = user?.organizationId || (typeof window !== "undefined" ? localStorage.getItem("currentOrgId") : null);
  const isAdmin = user?.orgRole === "ADMIN";

  const fetchTeams = useCallback(async () => {
    if (!organizationId) return;
    try {
      const response = await api.getOrganizationTeams(organizationId);
      if (response.success) {
        setTeams(response.data || []);
        setError("");
      }
    } catch (err: any) {
      console.error("Failed to fetch teams:", err);
      const errorMessage = err?.response?.data?.message || "Failed to load teams. Please try again.";
      setError(errorMessage);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !organizationId) return;
    setError("");
    setActionLoading(true);
    try {
      const response = await api.createTeam({
        name: newTeamName,
        description: newTeamDescription || undefined,
        organizationId,
      });
      if (response.success) {
        setSuccess("Team created successfully!");
        setNewTeamName("");
        setNewTeamDescription("");
        setShowCreateModal(false);
        // Immediately refresh teams list
        await fetchTeams();
        // Also invalidate any related queries
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Failed to create team");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.deleteTeam(teamId);
      setSuccess("Team deleted successfully!");
      fetchTeams();
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamMembers([]);
      }
    } catch (err) {
      setError("Failed to delete team");
      console.error(err);
    }
  };

  const handleAddMember = async () => {
    if (!memberUserId.trim() || !selectedTeam) return;
    setError("");
    try {
      await api.addTeamMember(selectedTeam.id, memberUserId);
      setSuccess("Member added successfully!");
      setMemberUserId("");
      setShowAddMemberModal(false);
      fetchTeamMembers(selectedTeam.id);
      fetchTeams();
    } catch (err) {
      setError("Failed to add member. Make sure the user ID is correct.");
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.removeTeamMember(selectedTeam.id, userId);
      setSuccess("Member removed successfully!");
      fetchTeamMembers(selectedTeam.id);
      fetchTeams();
    } catch (err) {
      setError("Failed to remove member");
      console.error(err);
    }
  };

  // Check if user belongs to an organization
  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Teams are for Organizations</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Teams are only available for organization members. Join an organization to access team management.
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
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Teams</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            {isAdmin ? "Create and manage teams within your organization" : "View your organization teams"}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError("");
              setLoading(true);
              fetchTeams();
            }}
            className="text-red-700 hover:text-red-900 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">All Teams</CardTitle>
              <CardDescription>{teams.length} team{teams.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-500 text-sm">No teams created yet</p>
                  {isAdmin && (
                    <p className="text-neutral-400 text-xs mt-2">Click &quot;Create Team&quot; to get started</p>
                  )}
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      setSelectedTeam(team);
                      fetchTeamMembers(team.id);
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
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{team.description}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedTeam.name}</CardTitle>
                  <CardDescription>{selectedTeam.description || "No description"}</CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-4">Team Members</h4>
                {teamMembers.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No members in this team</p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-sm text-neutral-500">{member.user.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
                <p className="text-neutral-500 dark:text-neutral-400">Select a team to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
              <CardDescription>Add a new team to your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Engineering, Sales, etc."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Team description..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName("");
                    setNewTeamDescription("");
                    setError("");
                  }} 
                  className="flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTeam}
                  disabled={actionLoading || !newTeamName.trim()}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Team Member</CardTitle>
              <CardDescription>Add a member to {selectedTeam?.name} using their user ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  The user must be a member of your organization
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setMemberUserId("");
                    setError("");
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={!memberUserId.trim()}
                  className="flex-1 bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white disabled:opacity-50"
                >
                  Add Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
