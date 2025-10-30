import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabaseStorageBucket =
  (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) ?? null;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export const getSupabaseClient = () => {
  if (!supabase) {
    console.warn(
      "Supabase n'est pas initialisé. Utilisation des endpoints mock pour les données."
    );
  }
  return supabase;
};

export type { SupabaseClient };
