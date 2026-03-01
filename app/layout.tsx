import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabaseServer";
import { ConditionalLayout } from "./components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: "IEPulse – AI-Powered IEP Management",
  description: "Internal school platform for IEP goals, compliance, and progress tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let user: { id: string; full_name: string; role: string } | null = null;
  if (session?.user?.id) {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .single();
    user = data ?? null;
  }
  return (
    <html lang="en">
      <body className="antialiased text-slate-700">
        <ConditionalLayout user={user}>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
