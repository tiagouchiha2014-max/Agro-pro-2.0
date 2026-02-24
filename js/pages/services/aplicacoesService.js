import { supabase } from "../supabaseClient.js";

/**
 * Schema:
 * aplicacoes: (id, fazenda_id, talhao_id, data(date), obs)
 * aplicacao_itens: (id, aplicacao_id, fazenda_id, produto_id, qtd)
 * estoque_movs: (tipo IN/OUT/ADJ, qtd, ref_tipo/ref_id)
 */

export async function listAplicacoes(fazendaId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("aplicacoes")
    .select("id,fazenda_id,talhao_id,data,obs,created_at")
    .eq("fazenda_id", fazendaId)
    .order("data", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createAplicacao({ fazenda_id, talhao_id, data, obs, itens }) {
  // 1) cria aplicação
  const { data: apl, error: errA } = await supabase
    .from("aplicacoes")
    .insert([{ fazenda_id, talhao_id, data, obs }])
    .select("id,fazenda_id,talhao_id,data,obs,created_at")
    .single();
  if (errA) throw errA;

  // 2) cria itens
  const itensRows = (itens || [])
    .filter(x => x?.produto_id && Number(x?.qtd) > 0)
    .map(x => ({
      aplicacao_id: apl.id,
      fazenda_id,
      produto_id: x.produto_id,
      qtd: Number(x.qtd),
    }));

  if (itensRows.length) {
    const { error: errI } = await supabase.from("aplicacao_itens").insert(itensRows);
    if (errI) throw errI;

    // 3) baixa estoque (OUT) com referência
    const movs = itensRows.map(it => ({
      fazenda_id,
      produto_id: it.produto_id,
      tipo: "OUT",
      qtd: it.qtd,
      ref_tipo: "APLICACAO",
      ref_id: apl.id,
      obs: `Baixa por aplicação`,
      data: new Date(data).toISOString(),
    }));

    const { error: errM } = await supabase.from("estoque_movs").insert(movs);
    if (errM) throw errM;
  }

  return apl;
}

export async function deleteAplicacao(id, fazendaId) {
  const { error } = await supabase
    .from("aplicacoes")
    .delete()
    .eq("id", id)
    .eq("fazenda_id", fazendaId);

  if (error) throw error;

  // (Ainda não estorna estoque aqui — faremos via RPC depois)
}
