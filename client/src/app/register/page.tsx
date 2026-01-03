'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerUser as registerUserAction } from '@/store/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  accountType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.accountType === 'ORGANIZATION') {
    return data.organizationName && data.organizationName.length >= 2;
  }
  return true;
}, {
  message: "Organization name must be at least 2 characters",
  path: ['organizationName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'ORGANIZATION'>('INDIVIDUAL');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'INDIVIDUAL',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      const payload: {
        email: string;
        password: string;
        name: string;
        accountType: 'INDIVIDUAL' | 'ORGANIZATION';
        organizationName?: string;
      } = { 
        email: data.email, 
        password: data.password, 
        name: data.name,
        accountType: data.accountType,
      };
      
      if (data.accountType === 'ORGANIZATION') {
        payload.organizationName = data.organizationName;
      }
      
      await dispatch(registerUserAction(payload)).unwrap();
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as string;
      setError(error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-neutral-50 via-neutral-100 to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      {/* Theme Toggle Button */}
      <ThemeToggle className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-lg border border-neutral-200 dark:border-neutral-700" />
      
      <Card className="w-full max-w-md shadow-2xl border-neutral-200 dark:border-neutral-700 backdrop-blur-sm bg-white dark:bg-neutral-800">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Create Your Account</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-300 text-base">Get started with QueryShield today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-900">
                {error}
              </div>
            )}

            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label className="text-neutral-800 dark:text-neutral-200 font-medium">Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('INDIVIDUAL');
                    setValue('accountType', 'INDIVIDUAL');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accountType === 'INDIVIDUAL'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">Individual</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Personal account</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('ORGANIZATION');
                    setValue('accountType', 'ORGANIZATION');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    accountType === 'ORGANIZATION'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-amber-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">Organization</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Team account</div>
                </button>
              </div>
            </div>

            {/* Organization Name (only for ORGANIZATION type) */}
            {accountType === 'ORGANIZATION' && (
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-neutral-800 dark:text-neutral-200 font-medium">
                  Organization Name
                </Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Acme Inc."
                  className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600"
                  {...register('organizationName')}
                />
                {errors.organizationName && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.organizationName.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-neutral-800 dark:text-neutral-200 font-medium">
                {accountType === 'ORGANIZATION' ? 'Your Full Name' : 'Full Name'}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-800 dark:text-neutral-200 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-800 dark:text-neutral-200 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neutral-800 dark:text-neutral-200 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30 transition-all duration-200" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-neutral-700 dark:text-neutral-300 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
