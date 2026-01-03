// Updated Registration Page with Account Type Selection
// src/app/register/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'ORGANIZATION'>('INDIVIDUAL');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organizationName: '',
    organizationUniqueId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (accountType === 'ORGANIZATION') {
      if (!formData.organizationName || !formData.organizationUniqueId) {
        setError('Organization name and unique ID are required');
        return;
      }
      // Validate unique ID format (lowercase, hyphens only)
      if (!/^[a-z0-9-]+$/.test(formData.organizationUniqueId)) {
        setError('Organization ID can only contain lowercase letters, numbers, and hyphens');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          accountType,
          ...(accountType === 'ORGANIZATION' && {
            organizationName: formData.organizationName,
            organizationUniqueId: formData.organizationUniqueId,
          }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        if (accountType === 'ORGANIZATION') {
          localStorage.setItem('currentOrgId', data.data.organization.id);
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('INDIVIDUAL')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'INDIVIDUAL'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-semibold">Individual</div>
                <div className="text-xs text-gray-500 mt-1">Personal account</div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('ORGANIZATION')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  accountType === 'ORGANIZATION'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold">Organization</div>
                <div className="text-xs text-gray-500 mt-1">Team/Company</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Common Fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              />
            </div>

            {/* Organization-specific Fields */}
            {accountType === 'ORGANIZATION' && (
              <>
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Organization Name
                  </label>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label htmlFor="organizationUniqueId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Organization Unique ID
                  </label>
                  <input
                    id="organizationUniqueId"
                    name="organizationUniqueId"
                    type="text"
                    required
                    value={formData.organizationUniqueId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                    placeholder="acme-corp"
                    pattern="[a-z0-9-]+"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          {accountType === 'ORGANIZATION' && (
            <p className="text-xs text-center text-gray-500">
              By creating an organization, you will automatically become an administrator
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
