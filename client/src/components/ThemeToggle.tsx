'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Standalone theme toggle that works outside ThemeProvider
// Syncs with localStorage and applies theme to documentElement

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get initial theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for theme changes from other components/tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue as 'light' | 'dark');
        applyTheme(e.newValue as 'light' | 'dark');
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      setTheme(e.detail);
      applyTheme(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
    };
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        type="button"
        disabled
      >
        <Moon className="h-5 w-5 text-neutral-700" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      type="button"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500" />
      )}
    </Button>
  );
}
