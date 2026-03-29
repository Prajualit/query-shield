"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
  Building2,
  UserPlus,
  ChevronDown,
} from "lucide-react";

// Navigation items with role restrictions
// adminOnly: true means only org admins OR individual users can see it
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    name: "Firewalls",
    href: "/dashboard/firewalls",
    icon: Shield,
    adminOnly: true,
  },
  { name: "Rules", href: "/dashboard/rules", icon: FileCode, adminOnly: true },
  {
    name: "Playground",
    href: "/dashboard/playground",
    icon: PlayCircle,
    adminOnly: true,
  },
  {
    name: "Monitoring",
    href: "/dashboard/monitoring",
    icon: Activity,
    adminOnly: false,
  },
  {
    name: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: FileText,
    adminOnly: false,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    adminOnly: false,
  },
];

// Organization-specific navigation (only for org members)
const organizationNavigation = [
  {
    name: "Organization",
    icon: Building2,
    adminOnly: false,
    children: [
      { name: "Overview", href: "/dashboard/organization", adminOnly: false },
      {
        name: "Org Firewalls",
        href: "/dashboard/organization/firewalls",
        adminOnly: true,
      },
    ],
  },
  { 
    name: "Teams", 
    icon: Users, 
    adminOnly: false,
    children: [
      { name: "Overview", href: "/dashboard/teams", adminOnly: false },
      {
        name: "Team Firewalls",
        href: "/dashboard/teams/firewalls",
        adminOnly: false,
      },
    ],
  },
  {
    name: "Invitations",
    href: "/dashboard/invitations",
    icon: UserPlus,
    adminOnly: true,
  },
];

const advancedNavigation = [
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    adminOnly: false,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: FileSpreadsheet,
    adminOnly: false,
  },
  {
    name: "Integrations",
    href: "/dashboard/integrations",
    icon: Code,
    adminOnly: true,
  },
  {
    name: "Webhooks",
    href: "/dashboard/webhooks",
    icon: Webhook,
    adminOnly: true,
  },
  {
    name: "Templates",
    href: "/dashboard/templates",
    icon: FolderOpen,
    adminOnly: true,
  },
];

const settingsNavigation = [
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key, adminOnly: true },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    adminOnly: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.getUnreadCount();
        if (response.success && response.data) {
          setUnreadCount(response.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user belongs to an organization
  const isOrgMember = !!user?.organizationId;
  const isAdmin = user?.orgRole === "ADMIN";
  // Individual users (no org) OR org admins can see admin-only items
  const canSeeAdminItems = !isOrgMember || isAdmin;

  const NavLink = ({
    item,
    badge,
  }: {
    item: { name: string; href: string; icon: React.ElementType };
    badge?: number;
  }) => {
    const isActive =
      pathname === item.href ||
      (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
          isActive
            ? "bg-linear-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30"
            : "text-neutral-400 hover:bg-neutral-800 hover:text-white hover:shadow-md"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-yellow-600 text-[10px] font-bold text-white shadow-lg shadow-yellow-600/50">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  const NavDropdown = ({
    item,
  }: {
    item: {
      name: string;
      icon: React.ElementType;
      children: { name: string; href: string; adminOnly?: boolean }[];
    };
  }) => {
    // Check if any child route is active
    const isChildActive = item.children.some((child) =>
      pathname === child.href ||
      (pathname.startsWith(child.href + "/") && child.href !== "/dashboard")
    );
    const [isOpen, setIsOpen] = useState(isChildActive);
    
    // Update open state if a child becomes active
    useEffect(() => {
      if (isChildActive) setIsOpen(true);
    }, [isChildActive]);

    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
            isOpen || isChildActive
              ? "text-white bg-neutral-800/50"
              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
            {item.name}
          </div>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200 text-neutral-500", {
              "rotate-180": isOpen,
            })}
          />
        </button>

        {isOpen && (
          <div className="ml-[22px] border-l border-neutral-700/50 pl-4 py-1 space-y-1">
            {item.children.map((child) => {
              if (child.adminOnly && !isAdmin) return null;
              
              const isChildRouteActive =
                pathname === child.href;
                
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isChildRouteActive
                      ? "bg-neutral-800 text-amber-500 font-semibold"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  )}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
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
          {navigation.map((item) => {
            // Hide admin-only items from org members who are not admins
            if (item.adminOnly && !canSeeAdminItems) return null;
            return <NavLink key={item.name} item={item} />;
          })}
        </div>

        {/* Organization Navigation (only for org members) */}
        {isOrgMember && (
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Organization
            </p>
            {organizationNavigation.map((item) => {
              // Hide admin-only items from non-admins
              if (item.adminOnly && !isAdmin) return null;
              if (item.children) {
                return (
                  <NavDropdown key={item.name} item={item as { name: string; icon: React.ElementType; children: { name: string; href: string; adminOnly?: boolean }[] }} />
                );
              }
              return <NavLink key={item.name} item={item as { name: string; href: string; icon: React.ElementType }} />;
            })}
          </div>
        )}

        {/* Advanced Features */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Advanced
          </p>
          {advancedNavigation.map((item) => {
            if (item.adminOnly && !canSeeAdminItems) return null;
            // Add badge to notifications
            const badge =
              item.name === "Notifications" ? unreadCount : undefined;
            return <NavLink key={item.name} item={item} badge={badge} />;
          })}
        </div>

        {/* Settings */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Settings
          </p>
          {settingsNavigation.map((item) => {
            if (item.adminOnly && !canSeeAdminItems) return null;
            return <NavLink key={item.name} item={item} />;
          })}
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
