import { supabase } from "../supabaseClient.js";

export async function listProdutos(fazendaId) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id,fazenda_id,nome,unidade,created_at")
    .eq("fazenda_id", fazendaId)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createProduto(payload) {
  const { data, error } = await supabase
    .from("produtos")
    .insert([payload])
    .select("id,fazenda_id,nome,unidade,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listMovs(fazendaId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("estoque_movs")
    .select("id,fazenda_id,produto_id,tipo,qtd,custo_unit,ref_tipo,ref_id,obs,data,created_at")
    .eq("fazenda_id", fazendaId)
    .order("data", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function addMov(payload) {
  const { data, error } = await supabase
    .from("estoque_movs")
    .insert([payload])
    .select("id,fazenda_id,produto_id,tipo,qtd,custo_unit,ref_tipo,ref_id,obs,data,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function listSaldos(fazendaId) {
  const { data, error } = await supabase
    .from("vw_estoque_saldos")
    .select("fazenda_id,produto_id,saldo")
    .eq("fazenda_id", fazendaId);

  if (error) throw error;
  return data || [];
}
