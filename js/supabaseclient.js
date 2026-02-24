<meta name='viewport' content='width=device-width, initial-scale=1'/>import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // mais seguro no browser
  },
  global: {
    headers: {
      "x-client-info": "agro-pro-2.0-web",
    },
  },
});

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session || null));
}