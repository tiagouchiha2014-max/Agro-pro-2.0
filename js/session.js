import { supabase, getSession } from "./supabaseClient.js";

const LS_FARM = "agro_farm_ctx_v1";

let farmCtxMem = null;

// ------------------------------------------------------------
// AUTH GUARD
// ------------------------------------------------------------
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    location.href = "./login.html";
    return null;
  }

  return session;
}

// ------------------------------------------------------------
// FARM CONTEXT (CACHE)
// ------------------------------------------------------------
function getCachedFarmCtx() {
  if (farmCtxMem) return farmCtxMem;

  try {
    const raw = localStorage.getItem(LS_FARM);
    if (!raw) return null;
    farmCtxMem = JSON.parse(raw);
    return farmCtxMem;
  } catch {
    return null;
  }
}

function setCachedFarmCtx(ctx) {
  farmCtxMem = ctx;
  localStorage.setItem(LS_FARM, JSON.stringify(ctx));
}

// ------------------------------------------------------------
// LOAD FARM CONTEXT
// - Busca primeira fazenda do usuário
// - Se não existir, cria automaticamente
// ------------------------------------------------------------
export async function loadFarmCtx() {
  const cached = getCachedFarmCtx();
  if (cached?.fazenda_id) return cached;

  const session = await getSession();
  const user = session?.user;

  if (!user) throw new Error("Sessão inválida.");

  // 1️⃣ Tenta buscar fazenda existente
  const { data: existing, error: selectError } = await supabase
    .from("fazendas")
    .select("id, nome")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error("Erro ao buscar fazenda:", selectError);
    throw selectError;
  }

  if (existing?.id) {
    const ctx = {
      fazenda_id: existing.id,
      fazenda_nome: existing.nome || "Fazenda",
      loaded_at: Date.now(),
    };

    setCachedFarmCtx(ctx);
    return ctx;
  }

  // 2️⃣ Se não existir, cria automaticamente
  const { data: created, error: insertError } = await supabase
    .from("fazendas")
    .insert([
      {
        nome: "Minha Fazenda",
        // NÃO enviar owner_id (usa DEFAULT auth.uid())
      },
    ])
    .select("id, nome")
    .single();

  if (insertError) {
    console.error("Erro ao criar fazenda:", insertError);
    throw insertError;
  }

  const ctx = {
    fazenda_id: created.id,
    fazenda_nome: created.nome || "Minha Fazenda",
    loaded_at: Date.now(),
  };

  setCachedFarmCtx(ctx);
  return ctx;
}

// ------------------------------------------------------------
// LIMPAR CONTEXTO (ex: trocar fazenda no futuro)
// ------------------------------------------------------------
export function clearFarmCtx() {
  localStorage.removeItem(LS_FARM);
  farmCtxMem = null;
}

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
export async function signOut() {
  clearFarmCtx();
  await supabase.auth.signOut();
  location.href = "./login.html";
} 
