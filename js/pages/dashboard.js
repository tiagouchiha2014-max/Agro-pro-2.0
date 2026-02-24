import { setTopbar } from "../ui/shell.js";
import { esc } from "../utils/dom.js";

export async function render({ orgCtx }) {
  setTopbar({ title: "Dashboard", meta: orgCtx.org_nome });
  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Bem-vindo</h2>
      <p class="muted">Empresa: ${esc(orgCtx.org_nome)}</p>
      <p>Agora vamos iniciar os CRUDs com segurança máxima e performance.</p>
    </div>
  `;
}
