"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import type { AppUser } from "./ConditionalLayout";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/goals", label: "Goals" },
  { href: "/compliance", label: "Compliance" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

const roleLabels: Record<string, string> = {
  teacher: "Special Ed Teacher",
  provider: "Service Provider",
  admin: "Administrator",
};

interface AppLayoutProps {
  user: AppUser | null;
  children: React.ReactNode;
}

export function AppLayout({ user, children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-[240px] fixed left-0 top-0 h-full bg-slate-900 text-slate-200 flex flex-col z-10">
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="text-xl font-semibold text-white">
            IEPulse
          </Link>
        </div>
        <nav className="flex-1 p-4 gap-1 flex flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-mahogany flex items-center justify-center text-vanilla text-sm font-medium">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name ?? "—"}</p>
              <p className="text-xs text-slate-400 truncate">{user ? roleLabels[user.role] ?? user.role : "—"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 pl-[240px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 h-14 border-b border-slate-200 bg-white flex items-center gap-4 px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search students, goals..."
                className="w-full rounded-lg bg-slate-100 px-4 py-2 pl-9 text-sm text-slate-700 placeholder:text-slate-400 border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-mahogany flex items-center justify-center text-vanilla">
            <User className="w-4 h-4" />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
