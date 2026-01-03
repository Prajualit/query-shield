// Invitation Acceptance Page
// src/app/invite/accept/page.tsx

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Mail, Crown, Users, Building2 } from 'lucide-react';

interface InvitationInfo {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  organization: {
    id: string;
    name: string;
  };
  inviter?: {
    name: string;
  };
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [existingUser, setExistingUser] = useState(false);

  const fetchInvitation = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.getInvitationByToken(token);

      if (response.success && response.data) {
        setInvitation(response.data);
      } else {
        setError(response.message || 'Invalid or expired invitation');
      }
    } catch (err) {
      setError('Failed to load invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token, fetchInvitation]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!existingUser) {
      if (!formData.name || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await api.acceptInvitation(
        token!,
        existingUser ? undefined : { password: formData.password, name: formData.name }
      );

      if (response.success && response.data) {
        // Save tokens
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Fetch organization ID separately if needed
        if (response.data.user.organizationId) {
          localStorage.setItem('currentOrgId', response.data.user.organizationId);
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(response.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('An error occurred while accepting the invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 via-neutral-100 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 via-neutral-100 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 px-4">
        <ThemeToggle className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-lg border border-neutral-200 dark:border-neutral-700" />
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center shadow-lg">
            <div className="h-16 w-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 px-6 py-2 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 rounded-lg font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 via-neutral-100 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <ThemeToggle className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-lg border border-neutral-200 dark:border-neutral-700" />
      
      <div className="max-w-md w-full space-y-8">
        {/* Header Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            You&apos;re Invited!
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {invitation?.inviter?.name || 'An administrator'} has invited you to join
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xl font-semibold text-amber-900 dark:text-amber-100">
              {invitation?.organization?.name}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {invitation?.role === 'ADMIN' ? (
              <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              as {invitation?.role === 'ADMIN' ? 'an Administrator' : 'a Member'}
            </span>
          </div>
        </div>

        {/* Accept Form */}
        <form className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8 space-y-6" onSubmit={handleAccept}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Toggle for existing user */}
          <div className="flex items-center justify-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
            <button
              type="button"
              onClick={() => setExistingUser(false)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                !existingUser
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              New User
            </button>
            <button
              type="button"
              onClick={() => setExistingUser(true)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                existingUser
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              Existing User
            </button>
          </div>

          {!existingUser ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  placeholder="••••••••"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Click &quot;Accept Invitation&quot; below to join {invitation?.organization?.name}.
                You&apos;ll be logged in automatically if you&apos;re already signed in, or prompted to sign in.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg shadow-amber-500/30 text-sm font-semibold text-white bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </form>

        <p className="text-xs text-center text-neutral-500">
          By accepting this invitation, you agree to join {invitation?.organization?.name} and
          abide by their policies.
        </p>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 via-neutral-100 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <InviteAcceptContent />
    </Suspense>
  );
}
