import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { ENV } from "./env.js";

// Suporta diferentes nomes (caso você use outro padrão no env.js)
const SUPABASE_URL =
  ENV?.SUPABASE_URL || ENV?.url || ENV?.SUPABASE?.URL || ENV?.SUPABASE?.url;

const SUPABASE_ANON =
  ENV?.SUPABASE_ANON ||
  ENV?.SUPABASE_ANON_KEY ||
  ENV?.anon ||
  ENV?.SUPABASE?.ANON ||
  ENV?.SUPABASE?.anon;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error("❌ ENV do Supabase não encontrado. Verifique /js/env.js (SUPABASE_URL e SUPABASE_ANON).");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // ✅ estabilidade no mobile/tablet + evita lock “preso”
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "agropro2_auth",
  },
  global: {
    headers: { "x-client-info": "agro-pro-2.0" },
  },
});

// Sessão com timeout (não fica pendurado)
export async function getSession({ timeoutMs = 6000 } = {}) {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error("Timeout ao obter sessão")), timeoutMs)
  );

  const run = (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  })();

  return Promise.race([run, timeout]);
}

export async function signOutSafe() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("signOutSafe:", e);
  }
}
