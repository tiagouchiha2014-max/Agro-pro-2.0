import { supabase } from "../supabaseClient.js";

export async function listFazendas() {
  const { data, error } = await supabase
    .from("fazendas")
    .select("id,nome,cidade,uf,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFazenda(payload) {
  const { data, error } = await supabase
    .from("fazendas")
    .insert([payload])
    .select("id,nome,cidade,uf,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateFazenda(id, patch) {
  const { data, error } = await supabase
    .from("fazendas")
    .update(patch)
    .eq("id", id)
    .select("id,nome,cidade,uf,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFazenda(id) {
  const { error } = await supabase
    .from("fazendas")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

