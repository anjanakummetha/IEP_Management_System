import { createClient } from "@supabase/supabase-js";

/** Service-role client that bypasses RLS — use only in server-side API routes. */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  { auth: { persistSession: false } }
);
