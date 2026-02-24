import { setTopbar } from "../ui/shell.js";
import { toast } from "../ui/toast.js";
import { esc } from "../utils/dom.js";
import {
  listFazendas,
  createFazenda,
  updateFazenda,
  deleteFazenda,
} from "../services/fazendasService.js";

// Tem que ser a mesma chave do session.js
const LS_FARM = "agro_farm_ctx_v1";

export async function render({ farmCtx }) {
  setTopbar({ title: "Fazendas", meta: farmCtx?.fazenda_nome || "" });

  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Suas Fazendas</h2>
      <p class="muted">Selecione a fazenda ativa ou crie uma nova.</p>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <input id="fz_nome" placeholder="Nome" style="min-width:220px" />
        <input id="fz_cidade" placeholder="Cidade" />
        <input id="fz_uf" placeholder="UF" maxlength="2" style="width:80px" />
        <button class="btn primary" id="btnCreateFz">Criar</button>
      </div>

      <div class="sep"></div>
      <div id="fz_list"></div>
    </div>
  `;

  const listBox = el.querySelector("#fz_list");
  const inNome = el.querySelector("#fz_nome");
  const inCidade = el.querySelector("#fz_cidade");
  const inUf = el.querySelector("#fz_uf");

  async function refresh() {
    const rows = await listFazendas();

    if (!rows.length) {
      listBox.innerHTML = `<p class="muted">Nenhuma fazenda encontrada.</p>`;
      return;
    }

    listBox.innerHTML = `
      <table class="tbl">
        <thead>
          <tr>
            <th>Ativa</th>
            <th>Nome</th>
            <th>Cidade</th>
            <th>UF</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((r) => {
              const active = farmCtx?.fazenda_id === r.id;
              return `
                <tr>
                  <td>
                    ${
                      active
                        ? "✅"
                        : `<button class="btn" data-act="select" data-id="${r.id}" data-nome="${esc(
                            r.nome || ""
                          )}">Usar</button>`
                    }
                  </td>
                  <td>${esc(r.nome || "")}</td>
                  <td>${esc(r.cidade || "")}</td>
                  <td>${esc(r.uf || "")}</td>
                  <td>
                    <button class="btn" data-act="edit" data-id="${r.id}">Editar</button>
                    <button class="btn" data-act="del" data-id="${r.id}">Excluir</button>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  el.querySelector("#btnCreateFz").onclick = async () => {
    try {
      const payload = {
        nome: (inNome.value || "").trim() || "Minha Fazenda",
        cidade: (inCidade.value || "").trim() || null,
        uf: (inUf.value || "").trim().toUpperCase() || null,
      };

      await createFazenda(payload);

      toast("Fazenda criada.", "success");
      inNome.value = "";
      inCidade.value = "";
      inUf.value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro ao criar fazenda", "error");
    }
  };

  el.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    const id = btn.dataset.id;

    try {
      if (act === "select") {
        const ctx = {
          fazenda_id: id,
          fazenda_nome: btn.dataset.nome || "Fazenda",
          loaded_at: Date.now(),
        };
        localStorage.setItem(LS_FARM, JSON.stringify(ctx));

        // Recarrega o app para pegar farmCtx novo
        location.href = "./index.html#/dashboard";
        return;
      }

      if (act === "edit") {
        const newNome = prompt("Novo nome da fazenda:");
        if (!newNome) return;
        await updateFazenda(id, { nome: newNome.trim() });
        toast("Atualizado.", "success");
        await refresh();
        return;
      }

      if (act === "del") {
        if (!confirm("Excluir fazenda?")) return;
        await deleteFazenda(id);
        toast("Excluída.", "success");
        await refresh();
      }
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro", "error");
    }
  });

  await refresh();
}
