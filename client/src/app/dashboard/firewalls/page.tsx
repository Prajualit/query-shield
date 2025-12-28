"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Plus, Settings, Trash2 } from "lucide-react";
import type { Firewall } from "@/lib/types";

export default function FirewallsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["firewalls"],
    queryFn: () => api.getFirewalls(),
  });

  const firewalls = data?.data || [];

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this firewall?")) {
      try {
        await api.deleteFirewall(id);
        refetch();
      } catch (error) {
        console.error("Failed to delete firewall:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto shadow-lg"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">
            Loading firewalls...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50">
            Firewalls
          </h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-lg font-medium">
            Manage your AI data firewalls
          </p>
        </div>
        <Link href="/dashboard/firewalls/new">
          <Button className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30">
            <Plus className="mr-2 h-4 w-4" />
            Create Firewall
          </Button>
        </Link>
      </div>

      {/* Firewalls Grid */}
      {firewalls.length === 0 ? (
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 mb-6">
              <Shield className="h-16 w-16 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              No firewalls yet
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 font-medium">
              Get started by creating your first firewall
            </p>
            <Link href="/dashboard/firewalls/new">
              <Button className="bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold shadow-lg shadow-amber-500/30">
                <Plus className="mr-2 h-4 w-4" />
                Create Firewall
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {firewalls.map((firewall: Firewall) => (
            <Card
              key={firewall.id}
              className="relative bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${
                        firewall.isActive
                          ? "bg-linear-to-br from-green-400 to-emerald-600 shadow-green-500/30"
                          : "bg-linear-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700"
                      }`}
                    >
                      <Shield
                        className={`h-6 w-6 ${
                          firewall.isActive
                            ? "text-white"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-neutral-900 dark:text-neutral-50">
                        {firewall.name}
                      </CardTitle>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          firewall.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {firewall.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                {firewall.description && (
                  <CardDescription className="mt-3 text-neutral-700 dark:text-neutral-300">
                    {firewall.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                      Rules
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {firewall._count?.rules || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                      Audit Logs
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {firewall._count?.auditLogs || 0}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Link
                      href={`/dashboard/firewalls/${firewall.id}`}
                      className="flex-1"
                    >
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
