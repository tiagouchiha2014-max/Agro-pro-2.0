import { supabase } from "../supabaseClient.js";

export async function listTalhoes(fazendaId) {
  const { data, error } = await supabase
    .from("talhoes")
    .select("id,fazenda_id,nome,area_ha,cultura,created_at")
    .eq("fazenda_id", fazendaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTalhao(payload) {
  const { data, error } = await supabase
    .from("talhoes")
    .insert([payload])
    .select("id,fazenda_id,nome,area_ha,cultura,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTalhao(id, patch) {
  const { data, error } = await supabase
    .from("talhoes")
    .update(patch)
    .eq("id", id)
    .select("id,fazenda_id,nome,area_ha,cultura,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTalhao(id) {
  const { error } = await supabase
    .from("talhoes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
