import { supabase } from "../supabaseClient.js";

/**
 * Modelo:
 * aplicacoes (id, fazenda_id, talhao_id, data, obs)
 * aplicacao_itens (id, aplicacao_id, fazenda_id, produto_id, quantidade)
 *
 * Baixa estoque: por enquanto vamos criar também estoque_movs do tipo "SAIDA"
 * (Mais seguro é migrar isso para uma RPC/transação no banco depois.)
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
    .filter(x => x?.produto_id && Number(x?.quantidade) > 0)
    .map(x => ({
      aplicacao_id: apl.id,
      fazenda_id,
      produto_id: x.produto_id,
      quantidade: Number(x.quantidade),
    }));

  if (itensRows.length) {
    const { error: errI } = await supabase.from("aplicacao_itens").insert(itensRows);
    if (errI) throw errI;

    // 3) baixa estoque (SAIDA)
    const movs = itensRows.map(it => ({
      fazenda_id,
      produto_id: it.produto_id,
      tipo: "SAIDA",
      quantidade: it.quantidade,
      data,
      obs: `Baixa por aplicação ${apl.id}`,
    }));
    const { error: errM } = await supabase.from("estoque_movs").insert(movs);
    if (errM) throw errM;
  }

  return apl;
}

export async function deleteAplicacao(id, fazendaId) {
  // Simples: apaga aplicação. (Depois fazemos “estorno” automático.)
  const { error } = await supabase
    .from("aplicacoes")
    .delete()
    .eq("id", id)
    .eq("fazenda_id", fazendaId);

  if (error) throw error;
}
