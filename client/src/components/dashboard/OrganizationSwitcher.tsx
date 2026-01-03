// Organization Switcher Component
// src/components/dashboard/OrganizationSwitcher.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  uniqueId: string;
  role: 'ADMIN' | 'MEMBER';
  memberCount?: number;
  teamCount?: number;
}

export function OrganizationSwitcher() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/organizations/my', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.data);
        // Set first org as default
        if (data.data.length > 0 && !currentOrg) {
          setCurrentOrg(data.data[0]);
          localStorage.setItem('currentOrgId', data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (user?.accountType === 'ORGANIZATION') {
      fetchOrganizations();
    }
  }, [user, fetchOrganizations]);

  const switchOrganization = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrgId', org.id);
    setIsOpen(false);
    // Refresh the page or update global state
    window.location.reload();
  };

  if (user?.accountType !== 'ORGANIZATION' || organizations.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{currentOrg?.name}</span>
          <span className="text-xs text-gray-500">
            {currentOrg?.role === 'ADMIN' ? '👑 Admin' : '👤 Member'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => switchOrganization(org)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentOrg?.id === org.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-gray-500">@{org.uniqueId}</div>
                  </div>
                  {org.role === 'ADMIN' && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
