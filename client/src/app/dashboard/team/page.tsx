'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Crown, 
  MoreVertical,
  Trash2,
  Edit,
  Check,
  X,
  Clock,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react';

// Mock team data
const mockTeamMembers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'ADMIN',
    status: 'active',
    joinedAt: '2024-01-15T10:00:00Z',
    lastActive: '2024-12-20T14:30:00Z',
    avatar: null
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    role: 'USER',
    status: 'active',
    joinedAt: '2024-02-20T09:00:00Z',
    lastActive: '2024-12-19T16:45:00Z',
    avatar: null
  },
  {
    id: '3',
    name: 'Mike Wilson',
    email: 'mike.wilson@company.com',
    role: 'USER',
    status: 'active',
    joinedAt: '2024-03-10T11:30:00Z',
    lastActive: '2024-12-18T10:20:00Z',
    avatar: null
  },
];

const mockPendingInvites = [
  {
    id: '1',
    email: 'new.user@company.com',
    role: 'USER',
    invitedAt: '2024-12-19T10:00:00Z',
    expiresAt: '2024-12-26T10:00:00Z',
    invitedBy: 'John Smith'
  },
  {
    id: '2',
    email: 'another.user@company.com',
    role: 'ADMIN',
    invitedAt: '2024-12-18T14:00:00Z',
    expiresAt: '2024-12-25T14:00:00Z',
    invitedBy: 'John Smith'
  },
];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  status: 'active' | 'inactive';
  joinedAt: string;
  lastActive: string;
  avatar: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  invitedAt: string;
  expiresAt: string;
  invitedBy: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers as TeamMember[]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(mockPendingInvites as PendingInvite[]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleInvite = () => {
    if (!inviteEmail) return;
    
    const newInvite: PendingInvite = {
      id: Date.now().toString(),
      email: inviteEmail,
      role: inviteRole,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'You'
    };
    
    setPendingInvites([...pendingInvites, newInvite]);
    setInviteEmail('');
    setInviteRole('USER');
    setShowInviteModal(false);
  };

  const cancelInvite = (inviteId: string) => {
    setPendingInvites(pendingInvites.filter(i => i.id !== inviteId));
  };

  const resendInvite = (inviteId: string) => {
    // In a real app, this would resend the email
    console.log('Resending invite:', inviteId);
  };

  const removeMember = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
    setActiveDropdown(null);
  };

  const updateMemberRole = (memberId: string, newRole: 'USER' | 'ADMIN') => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    setEditingMember(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ADMIN':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return Crown;
      case 'ADMIN':
        return Shield;
      default:
        return Users;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText('https://queryshield.io/invite/abc123');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Team Management</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manage your team members and their access permissions
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-yellow-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Members</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{members.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-400 to-purple-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Admins</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {members.filter(m => m.role === 'ADMIN' || m.role === 'SUPER_ADMIN').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-400 to-blue-600">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Pending Invites</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pendingInvites.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-white">Team Members</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Active members with access to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const RoleIcon = getRoleIcon(member.role);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-yellow-500 text-white font-semibold">
                      {getInitials(member.name)}
                    </div>
                    
                    {/* Member Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900 dark:text-white">{member.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadge(member.role)}`}>
                          <RoleIcon className="h-3 w-3" />
                          {member.role}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Last Active */}
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Last active</p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{formatDate(member.lastActive)}</p>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {activeDropdown === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-10">
                          <div className="p-1">
                            <button
                              onClick={() => {
                                setEditingMember(member.id);
                                setActiveDropdown(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                              Change Role
                            </button>
                            <button
                              onClick={() => removeMember(member.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove Member
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle className="text-neutral-900 dark:text-white">Pending Invitations</CardTitle>
            <CardDescription className="text-neutral-600 dark:text-neutral-400">
              Invitations waiting for acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <Mail className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-neutral-900 dark:text-white">{invite.email}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadge(invite.role)}`}>
                          {invite.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <Clock className="h-3 w-3" />
                        Expires {formatDate(invite.expiresAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvite(invite.id)}
                      className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelInvite(invite.id)}
                      className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            <CardTitle className="text-neutral-900 dark:text-white">Role Permissions</CardTitle>
          </div>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            Understanding what each role can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Role */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">User</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> View firewalls</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> View rules</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> View audit logs</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Use playground</li>
                <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> Manage team</li>
                <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> Billing access</li>
              </ul>
            </div>

            {/* Admin Role */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Admin</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> All User permissions</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Create firewalls</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Manage rules</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Invite members</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Manage API keys</li>
                <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> Billing access</li>
              </ul>
            </div>

            {/* Super Admin Role */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">Super Admin</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> All Admin permissions</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Manage all members</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Billing & subscription</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Organization settings</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Delete organization</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Full system access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Invite Team Member</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-700 dark:text-neutral-300">Role</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInviteRole('USER')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'USER'
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setInviteRole('ADMIN')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      inviteRole === 'ADMIN'
                        ? 'bg-amber-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={copyInviteLink}
                  className="w-full border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invite Link
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Change Member Role</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => updateMemberRole(editingMember, 'USER')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-neutral-900 dark:text-white">User</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Basic access to view and use resources</p>
                </div>
              </button>
              <button
                onClick={() => updateMemberRole(editingMember, 'ADMIN')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
              >
                <Shield className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <p className="font-medium text-neutral-900 dark:text-white">Admin</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Full access to manage resources and team</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingMember(null)}
                className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
