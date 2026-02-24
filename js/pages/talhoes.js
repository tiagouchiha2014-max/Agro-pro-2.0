import { setTopbar } from "../ui/shell.js";
import { toast } from "../ui/toast.js";
import { esc } from "../utils/dom.js";
import { listTalhoes, createTalhao, updateTalhao, deleteTalhao } from "../services/talhoesService.js";

export async function render({ farmCtx }) {
  setTopbar({ title: "Talhões", meta: farmCtx?.fazenda_nome || "" });

  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Talhões</h2>
      <div class="muted">Fazenda ativa: <b>${esc(farmCtx?.fazenda_nome||"")}</b></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <input id="t_nome" placeholder="Nome do talhão" />
        <input id="t_area" placeholder="Área (ha)" inputmode="decimal" />
        <input id="t_cultura" placeholder="Cultura (ex: Soja)" />
        <button class="btn primary" id="btnCreate">Criar</button>
      </div>

      <div class="sep"></div>
      <div id="list"></div>
    </div>
  `;

  const listBox = el.querySelector("#list");
  const inNome = el.querySelector("#t_nome");
  const inArea = el.querySelector("#t_area");
  const inCultura = el.querySelector("#t_cultura");

  async function refresh() {
    const rows = await listTalhoes(farmCtx.fazenda_id);
    if (!rows.length) {
      listBox.innerHTML = `<p class="muted">Nenhum talhão cadastrado.</p>`;
      return;
    }
    listBox.innerHTML = `
      <table class="tbl">
        <thead><tr><th>Nome</th><th>Área (ha)</th><th>Cultura</th><th>Ações</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${esc(r.nome||"")}</td>
              <td>${esc(String(r.area_ha ?? ""))}</td>
              <td>${esc(r.cultura||"")}</td>
              <td>
                <button class="btn" data-act="edit" data-id="${r.id}">Editar</button>
                <button class="btn" data-act="del" data-id="${r.id}">Excluir</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  el.querySelector("#btnCreate").onclick = async () => {
    try {
      const payload = {
        fazenda_id: farmCtx.fazenda_id,
        nome: (inNome.value||"").trim() || "Talhão",
        area_ha: inArea.value ? Number(String(inArea.value).replace(",", ".")) : null,
        cultura: (inCultura.value||"").trim() || null,
      };
      await createTalhao(payload);
      toast("Talhão criado.", "success");
      inNome.value=""; inArea.value=""; inCultura.value="";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e.message || "Erro ao criar talhão", "error");
    }
  };

  el.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    try {
      if (act === "edit") {
        const newNome = prompt("Novo nome:");
        if (!newNome) return;
        await updateTalhao(id, { nome: newNome.trim() });
        toast("Atualizado.", "success");
        await refresh();
      }
      if (act === "del") {
        if (!confirm("Excluir talhão?")) return;
        await deleteTalhao(id);
        toast("Excluído.", "success");
        await refresh();
      }
    } catch (e) {
      console.error(e);
      toast(e.message || "Erro", "error");
    }
  });

  await refresh();
}
