import { supabase } from "../supabaseClient.js";

/**
 * Modelo simples:
 * - tabela produtos (id, fazenda_id, nome, unidade)
 * - tabela estoque_movs (id, fazenda_id, produto_id, tipo, quantidade, data, obs)
 * Saldo = soma(movs) por produto (ENTRADA +, SAIDA -)
 */

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
    .select("id,fazenda_id,produto_id,tipo,quantidade,data,obs,created_at")
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
    .select("id,fazenda_id,produto_id,tipo,quantidade,data,obs,created_at")
    .single();

  if (error) throw error;
  return data;
}

// (opcional) visão de saldo via RPC ou view; aqui calculo no front por simplicidade
