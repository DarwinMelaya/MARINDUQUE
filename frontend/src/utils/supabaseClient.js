import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env"
  );
}

// Database only — login/signup use the admins table, not Supabase Auth
const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

/**
 * The Supabase Storage bucket name used for all file uploads.
 * Set VITE_SUPABASE_STORAGE_BUCKET in frontend/.env
 * Falls back to "dost-marinduque" if the variable is missing.
 */
export const STORAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? "dost-marinduque";

export default supabase;
