<meta name='viewport' content='width=device-width, initial-scale=1'/>import { getSession, supabase } from "./supabaseClient.js";

const LS_ORG = "agro_org_ctx_v1";
let orgCtxMem = null;

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    location.href = "./login.html";
    return null;
  }
  return session;
}

export function getCachedOrgCtx() {
  if (orgCtxMem) return orgCtxMem;
  try {
    const raw = localStorage.getItem(LS_ORG);
    if (!raw) return null;
    orgCtxMem = JSON.parse(raw);
    return orgCtxMem;
  } catch {
    return null;
  }
}

export async function loadOrgCtx() {
  // cache primeiro (performance)
  const cached = getCachedOrgCtx();
  if (cached?.org_id && cached?.role) return cached;

  // buscar no banco (seguro via RLS)
  const { data, error } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(nome)")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.org_id) throw new Error("Usuário sem empresa (org) vinculada.");

  const ctx = {
    org_id: data.org_id,
    role: data.role,
    org_nome: data.orgs?.nome || "Minha Empresa",
    loaded_at: Date.now(),
  };

  orgCtxMem = ctx;
  localStorage.setItem(LS_ORG, JSON.stringify(ctx));
  return ctx;
}

export async function signOut() {
  localStorage.removeItem(LS_ORG);
  orgCtxMem = null;
  await supabase.auth.signOut();
  location.href = "./login.html";
}