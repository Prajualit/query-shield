'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const firewallSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FirewallFormData = z.infer<typeof firewallSchema>;

export default function NewFirewallPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FirewallFormData>({
    resolver: zodResolver(firewallSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: FirewallFormData) => {
    try {
      setError('');
      setLoading(true);
      await api.createFirewall(data);
      router.push('/dashboard/firewalls');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create firewall');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/firewalls">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Firewalls
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">Create New Firewall</h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">Set up a new AI data firewall</p>
      </div>

      {/* Form */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-neutral-900 dark:text-neutral-50">Firewall Details</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-300">Enter the basic information for your firewall</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-900 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Firewall Name *</Label>
              <Input
                id="name"
                placeholder="Production Firewall"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-20 w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Protects sensitive data in production AI requests"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-amber-600 focus:ring-amber-500"
                defaultChecked
                {...register('isActive')}
              />
              <Label htmlFor="isActive" className="font-normal">
                Activate firewall immediately
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Firewall'}
              </Button>
              <Link href="/dashboard/firewalls">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
