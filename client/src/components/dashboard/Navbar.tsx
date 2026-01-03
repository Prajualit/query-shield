"use client";

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Bell, Sun, Moon, Building2, Crown, Shield } from "lucide-react";

export function Navbar() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    // Clear organization context
    localStorage.removeItem('currentOrgId');
    router.push('/login');
  };
  const { theme, toggleTheme } = useTheme();
  
  // Check if user belongs to an organization (based on organizationId, not accountType)
  const isOrgMember = !!user?.organizationId;
  const isAdmin = user?.orgRole === 'ADMIN';

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Welcome back, {user?.name || "User"}!
        </h1>
        {isOrgMember && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            {isAdmin ? (
              <Crown className="h-3 w-3 text-purple-500" />
            ) : (
              <Shield className="h-3 w-3 text-blue-500" />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative hover:bg-neutral-100 dark:hover:bg-neutral-700"
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          ) : (
            <Sun className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-4 py-2 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-yellow-600 text-white shadow-md shadow-amber-500/30">
            <User className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {user?.name || "User"}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:border-amber-500 transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
