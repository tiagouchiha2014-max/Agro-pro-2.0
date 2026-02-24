import { setTopbar } from "../ui/shell.js";
import { toast } from "../ui/toast.js";
import { esc } from "../utils/dom.js";
import { listTalhoes } from "../services/talhoesService.js";
import { listProdutos } from "../services/estoqueService.js";
import { listAplicacoes, createAplicacao, deleteAplicacao } from "../services/aplicacoesService.js";

function toNum(v) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function render({ farmCtx }) {
  setTopbar({ title: "Aplicações", meta: farmCtx?.fazenda_nome || "" });

  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Nova Aplicação</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <select id="a_talhao" style="min-width:260px"></select>
        <input id="a_data" type="date" style="width:170px" />
        <input id="a_obs" placeholder="Observação" style="min-width:240px" />
      </div>

      <div class="sep"></div>

      <div class="muted">Itens (produto + qtd)</div>
      <div id="itens"></div>

      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn" id="btnAddItem" type="button">+ Item</button>
        <button class="btn primary" id="btnSalvar" type="button">Salvar aplicação</button>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <h2>Histórico</h2>
      <div class="muted">Ao salvar, o sistema gera baixa no estoque (OUT) com referência da aplicação.</div>
      <div class="sep"></div>
      <div id="hist"></div>
    </div>
  `;

  const selTalhao = el.querySelector("#a_talhao");
  const itensBox = el.querySelector("#itens");
  const histBox = el.querySelector("#hist");
  el.querySelector("#a_data").value = todayISODate();

  let produtos = [];
  let talhoes = [];

  function addItemRow() {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.flexWrap = "wrap";
    row.style.marginTop = "8px";

    row.innerHTML = `
      <select class="it_prod" style="min-width:260px"></select>
      <input class="it_qtd" placeholder="Qtd" inputmode="decimal" style="width:140px" />
      <button class="btn it_del" type="button">Remover</button>
    `;

    const sel = row.querySelector(".it_prod");
    sel.innerHTML = produtos.length
      ? produtos.map(p => `<option value="${p.id}">${esc(p.nome)}${p.unidade ? " (" + esc(p.unidade) + ")" : ""}</option>`).join("")
      : `<option value="">— cadastre produtos —</option>`;

    row.querySelector(".it_del").onclick = () => row.remove();
    itensBox.appendChild(row);
  }

  async function refresh() {
    talhoes = await listTalhoes(farmCtx.fazenda_id);
    produtos = await listProdutos(farmCtx.fazenda_id);

    selTalhao.innerHTML = talhoes.length
      ? talhoes.map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join("")
      : `<option value="">— cadastre talhões —</option>`;

    itensBox.innerHTML = "";
    addItemRow();

    const hist = await listAplicacoes(farmCtx.fazenda_id, { limit: 50 });
    histBox.innerHTML = hist.length
      ? `<table class="tbl">
          <thead><tr><th>Data</th><th>Talhão</th><th>Obs</th><th>Ações</th></tr></thead>
          <tbody>
            ${hist.map(a => `
              <tr>
                <td>${esc(String(a.data || ""))}</td>
                <td>${esc(talhoes.find(t=>t.id===a.talhao_id)?.nome || "")}</td>
                <td>${esc(a.obs || "")}</td>
                <td><button class="btn" data-del="${a.id}">Excluir</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      : `<p class="muted">Sem aplicações registradas.</p>`;
  }

  el.querySelector("#btnAddItem").onclick = () => addItemRow();

  el.querySelector("#btnSalvar").onclick = async () => {
    try {
      const talhao_id = selTalhao.value;
      if (!talhao_id) return toast("Cadastre/Selecione um talhão.", "error");
      if (!produtos.length) return toast("Cadastre produtos antes.", "error");

      const data = el.querySelector("#a_data").value || todayISODate();
      const obs = (el.querySelector("#a_obs").value || "").trim() || null;

      const itens = Array.from(itensBox.children).map(row => {
        const produto_id = row.querySelector(".it_prod")?.value;
        const qtd = toNum(row.querySelector(".it_qtd")?.value);
        return { produto_id, qtd };
      });

      if (!itens.some(i => i.produto_id && Number(i.qtd) > 0)) {
        return toast("Adicione ao menos 1 item válido.", "error");
      }

      await createAplicacao({
        fazenda_id: farmCtx.fazenda_id,
        talhao_id,
        data, // date string
        obs,
        itens,
      });

      toast("Aplicação salva. Estoque baixado (OUT).", "success");
      el.querySelector("#a_obs").value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro ao salvar aplicação", "error");
    }
  };

  histBox.addEventListener("click", async (ev) => {
    const id = ev.target?.dataset?.del;
    if (!id) return;
    if (!confirm("Excluir aplicação? (não estorna estoque ainda)")) return;

    try {
      await deleteAplicacao(id, farmCtx.fazenda_id);
      toast("Aplicação excluída.", "success");
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro ao excluir", "error");
    }
  });

  await refresh();
}
