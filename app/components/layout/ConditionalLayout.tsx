"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "./AppLayout";

export interface AppUser {
  id: string;
  full_name: string;
  role: string;
}

interface ConditionalLayoutProps {
  user: AppUser | null;
  children: React.ReactNode;
}

export function ConditionalLayout({ user, children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return <AppLayout user={user}>{children}</AppLayout>;
}
