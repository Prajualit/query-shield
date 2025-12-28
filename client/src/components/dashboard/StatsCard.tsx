import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, className }: StatsCardProps) {
  return (
    <Card className={cn('bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
          <Icon className="h-4 w-4 text-amber-700 dark:text-amber-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{value}</div>
        {description && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 font-medium">{description}</p>}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            <span className={cn(
              'font-semibold px-2 py-1 rounded-full',
              trend.isPositive ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50' : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
