import { setTopbar } from "../ui/shell.js";
import { toast } from "../ui/toast.js";
import { esc } from "../utils/dom.js";
import { listProdutos, createProduto, listMovs, addMov } from "../services/estoqueService.js";

export async function render({ farmCtx }) {
  setTopbar({ title: "Estoque", meta: farmCtx?.fazenda_nome || "" });

  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Produtos</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <input id="p_nome" placeholder="Nome do produto" />
        <input id="p_un" placeholder="Unidade (L, kg, sc)" style="width:140px" />
        <button class="btn primary" id="btnAddProd">Adicionar</button>
      </div>

      <div class="sep"></div>
      <div id="prod_list"></div>
    </div>

    <div class="card" style="margin-top:12px">
      <h2>Movimentações</h2>
      <div class="muted">Entradas e saídas (Aplicações geram SAÍDA automaticamente).</div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <select id="m_prod" style="min-width:240px"></select>
        <select id="m_tipo" style="width:140px">
          <option value="ENTRADA">ENTRADA</option>
          <option value="SAIDA">SAÍDA</option>
        </select>
        <input id="m_qtd" placeholder="Quantidade" inputmode="decimal" style="width:140px" />
        <input id="m_data" type="date" />
        <input id="m_obs" placeholder="Observação" style="min-width:220px" />
        <button class="btn primary" id="btnMov">Lançar</button>
      </div>

      <div class="sep"></div>
      <div id="mov_list"></div>
    </div>
  `;

  const prodList = el.querySelector("#prod_list");
  const movList = el.querySelector("#mov_list");
  const selProd = el.querySelector("#m_prod");

  async function refresh() {
    const produtos = await listProdutos(farmCtx.fazenda_id);
    prodList.innerHTML = produtos.length
      ? `<ul>${produtos.map(p => `<li>${esc(p.nome)} <span class="muted">(${esc(p.unidade||"")})</span></li>`).join("")}</ul>`
      : `<p class="muted">Nenhum produto cadastrado.</p>`;

    selProd.innerHTML = produtos.length
      ? produtos.map(p => `<option value="${p.id}">${esc(p.nome)}${p.unidade ? " ("+esc(p.unidade)+")" : ""}</option>`).join("")
      : `<option value="">— cadastre um produto —</option>`;

    const movs = await listMovs(farmCtx.fazenda_id, { limit: 50 });
    movList.innerHTML = movs.length
      ? `<table class="tbl">
          <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Obs</th></tr></thead>
          <tbody>
            ${movs.map(m => `
              <tr>
                <td>${esc(String(m.data||""))}</td>
                <td>${esc(m.tipo||"")}</td>
                <td>${esc(String(m.quantidade||""))}</td>
                <td>${esc(m.obs||"")}</td>
              </tr>`).join("")}
          </tbody>
        </table>`
      : `<p class="muted">Sem movimentações ainda.</p>`;
  }

  el.querySelector("#btnAddProd").onclick = async () => {
    try {
      const nome = (el.querySelector("#p_nome").value||"").trim();
      const un = (el.querySelector("#p_un").value||"").trim();
      if (!nome) return toast("Informe o nome do produto.", "error");
      await createProduto({ fazenda_id: farmCtx.fazenda_id, nome, unidade: un || null });
      toast("Produto criado.", "success");
      el.querySelector("#p_nome").value = "";
      el.querySelector("#p_un").value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e.message || "Erro", "error");
    }
  };

  el.querySelector("#btnMov").onclick = async () => {
    try {
      const produto_id = selProd.value;
      if (!produto_id) return toast("Cadastre um produto primeiro.", "error");
      const tipo = el.querySelector("#m_tipo").value;
      const qtdRaw = String(el.querySelector("#m_qtd").value||"").replace(",", ".");
      const quantidade = Number(qtdRaw);
      const data = el.querySelector("#m_data").value || new Date().toISOString().slice(0,10);
      const obs = (el.querySelector("#m_obs").value||"").trim() || null;

      if (!Number.isFinite(quantidade) || quantidade <= 0) return toast("Quantidade inválida.", "error");

      await addMov({ fazenda_id: farmCtx.fazenda_id, produto_id, tipo, quantidade, data, obs });
      toast("Movimentação lançada.", "success");
      el.querySelector("#m_qtd").value = "";
      el.querySelector("#m_obs").value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e.message || "Erro", "error");
    }
  };

  await refresh();
}
