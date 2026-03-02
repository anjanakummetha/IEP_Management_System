"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Card } from "@/app/components/ui/Card";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) { setError(signInError.message); return; }
    window.location.replace("/dashboard");
  }

  const inputCls =
    "w-full rounded-lg border border-sand bg-white px-4 py-2 text-sm text-espresso-noir placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam";

  return (
    <div className="min-h-screen flex items-center justify-center bg-vanilla px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-espresso-noir tracking-tight">EveryLearner</h1>
          <p className="text-sm text-mocha mt-1">IEP Management System</p>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-espresso-noir mb-6">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-espresso-noir mb-1">
                Email
              </label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                className={inputCls}
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-espresso-noir mb-1">
                Password
              </label>
              <input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cold-brew text-vanilla px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
