import { getSession, supabase } from "./supabaseClient.js";

const LS_FARM = "agro_fazenda_ctx_v1";
let farmCtxMem = null;

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    location.href = "./login.html";
    return null;
  }
  return session;
}

export function getCachedFarmCtx() {
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

export async function loadFarmCtx() {
  const cached = getCachedFarmCtx();
  if (cached?.fazenda_id) return cached;

  // 1) tenta pegar a primeira fazenda do usuário
  const { data: existing, error: selErr } = await supabase
    .from("fazendas")
    .select("id, nome")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;

  if (existing?.id) {
    const ctx = {
      fazenda_id: existing.id,
      fazenda_nome: existing.nome || "Fazenda",
      loaded_at: Date.now(),
    };
    farmCtxMem = ctx;
    localStorage.setItem(LS_FARM, JSON.stringify(ctx));
    return ctx;
  }

  // 2) se não existe, cria automaticamente
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sessão inválida.");

  const { data: created, error: insErr } = await supabase
    .from("fazendas")
    .insert([{ nome: "Minha Fazenda", owner_id: userId }])
    .select("id, nome")
    .single();

  if (insErr) throw insErr;

  const ctx = {
    fazenda_id: created.id,
    fazenda_nome: created.nome || "Minha Fazenda",
    loaded_at: Date.now(),
  };
  farmCtxMem = ctx;
  localStorage.setItem(LS_FARM, JSON.stringify(ctx));
  return ctx;
}

export async function signOut() {
  localStorage.removeItem(LS_FARM);
  farmCtxMem = null;
  await supabase.auth.signOut();
  location.href = "./login.html";
}
