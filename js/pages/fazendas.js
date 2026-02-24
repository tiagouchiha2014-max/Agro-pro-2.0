import { setTopbar } from "../ui/shell.js";

export async function render({ orgCtx }) {
  setTopbar({ title: "Fazendas", meta: orgCtx.org_nome });

  document.getElementById("content").innerHTML = `
    <div class="card">
      <h2>Fazendas</h2>
      <p class="muted">Próximo passo: CRUD completo (listar/criar/editar/excluir) usando Supabase + RLS.</p>
    </div>
  `;
}
