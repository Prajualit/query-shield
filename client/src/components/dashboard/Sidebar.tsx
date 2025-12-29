"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield,
  LayoutDashboard,
  FileText,
  BarChart3,
  Key,
  Settings,
  FileCode,
  Activity,
  PlayCircle,
  Users,
  Bell,
  FileSpreadsheet,
  Code,
  Webhook,
  FolderOpen,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Firewalls", href: "/dashboard/firewalls", icon: Shield },
  { name: "Rules", href: "/dashboard/rules", icon: FileCode },
  { name: "Playground", href: "/dashboard/playground", icon: PlayCircle },
  { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const advancedNavigation = [
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Reports", href: "/dashboard/reports", icon: FileSpreadsheet },
  { name: "Integrations", href: "/dashboard/integrations", icon: Code },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
  { name: "Templates", href: "/dashboard/templates", icon: FolderOpen },
];

const settingsNavigation = [
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({
    item,
  }: {
    item: { name: string; href: string; icon: React.ElementType };
  }) => {
    const isActive =
      pathname === item.href || 
      (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-linear-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30"
            : "text-neutral-400 hover:bg-neutral-800 hover:text-white hover:shadow-md"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-linear-to-b from-neutral-900 via-neutral-900 to-neutral-800 text-white shadow-2xl overflow-hidden">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 bg-linear-to-r border-b border-neutral-700 from-neutral-900 to-neutral-800 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-linear-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          QueryShield
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Main
          </p>
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Advanced Features */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Advanced
          </p>
          {advancedNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Settings
          </p>
          {settingsNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-800/50 p-4 bg-neutral-900/50 shrink-0">
        <div className="text-xs text-neutral-500">
          <p className="font-medium">© 2025 QueryShield</p>
          <p className="mt-1 text-neutral-600">AI Data Firewall</p>
        </div>
      </div>
    </div>
  );
}
