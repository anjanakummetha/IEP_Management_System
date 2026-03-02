"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppUser } from "./ConditionalLayout";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students",  label: "Students"  },
];

const roleLabels: Record<string, string> = {
  teacher: "Teacher",
  admin:   "Administrator",
};

interface AppLayoutProps {
  user: AppUser | null;
  children: React.ReactNode;
}

export function AppLayout({ user, children }: AppLayoutProps) {
  const pathname = usePathname();

  function handleLogout() {
    window.location.href = "/api/logout";
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="w-[240px] fixed left-0 top-0 h-full bg-espresso-noir text-stone-200 flex flex-col z-10">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="text-xl font-semibold text-vanilla tracking-tight">
            EveryLearner
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cold-brew text-vanilla"
                    : "text-stone-300 hover:bg-white/10 hover:text-vanilla"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-cold-brew flex items-center justify-center text-vanilla">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vanilla truncate">
                {user?.full_name ?? "—"}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {user ? (roleLabels[user.role] ?? user.role) : "—"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-stone-300 hover:bg-white/10 hover:text-vanilla transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 pl-[240px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 h-14 border-b border-sand bg-vanilla/80 backdrop-blur flex items-center justify-end px-6">
          <div className="w-9 h-9 rounded-full bg-cold-brew flex items-center justify-center text-vanilla">
            <User className="w-4 h-4" />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
