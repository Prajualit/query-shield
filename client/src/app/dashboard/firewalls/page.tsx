'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Plus, Settings, Trash2 } from 'lucide-react';
import type { Firewall } from '@/lib/types';

export default function FirewallsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['firewalls'],
    queryFn: () => api.getFirewalls(),
  });

  const firewalls = data?.data || [];

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this firewall?')) {
      try {
        await api.deleteFirewall(id);
        refetch();
      } catch (error) {
        console.error('Failed to delete firewall:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading firewalls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Firewalls</h1>
          <p className="mt-2 text-gray-600">Manage your AI data firewalls</p>
        </div>
        <Link href="/dashboard/firewalls/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Firewall
          </Button>
        </Link>
      </div>

      {/* Firewalls Grid */}
      {firewalls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No firewalls yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first firewall</p>
            <Link href="/dashboard/firewalls/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Firewall
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {firewalls.map((firewall: Firewall) => (
            <Card key={firewall.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      firewall.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Shield className={`h-5 w-5 ${
                        firewall.isActive ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{firewall.name}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        firewall.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {firewall.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                {firewall.description && (
                  <CardDescription className="mt-2">{firewall.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rules</span>
                    <span className="font-medium">{firewall._count?.rules || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Audit Logs</span>
                    <span className="font-medium">{firewall._count?.auditLogs || 0}</span>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Link href={`/dashboard/firewalls/${firewall.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(firewall.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
