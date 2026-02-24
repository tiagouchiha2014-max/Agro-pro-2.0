import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env.js";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ SUPABASE_URL ou SUPABASE_ANON_KEY não encontrados em env.js");
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // 🔒 estabilidade e segurança
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "agropro2_auth",
    },
    global: {
      headers: {
        "x-client-info": "agro-pro-2.0",
      },
    },
  }
);

// 🔐 Sessão com timeout (evita travar no tablet)
export async function getSession({ timeoutMs = 6000 } = {}) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout ao obter sessão")), timeoutMs)
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
    console.warn("Erro no logout:", e);
  }
}
