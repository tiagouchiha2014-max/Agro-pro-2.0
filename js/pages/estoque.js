import { setTopbar } from "../ui/shell.js";
import { toast } from "../ui/toast.js";
import { esc } from "../utils/dom.js";
import { listProdutos, createProduto, listMovs, addMov, listSaldos } from "../services/estoqueService.js";

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
  setTopbar({ title: "Estoque", meta: farmCtx?.fazenda_nome || "" });

  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="card">
      <h2>Produtos</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <input id="p_nome" placeholder="Nome do produto" style="min-width:240px" />
        <input id="p_un" placeholder="Unidade (L, kg, sc)" style="width:160px" />
        <button class="btn primary" id="btnAddProd">Adicionar</button>
      </div>

      <div class="sep"></div>
      <div id="prod_list"></div>
    </div>

    <div class="card" style="margin-top:12px">
      <h2>Saldo por produto</h2>
      <div class="muted">Saldo = soma(IN) - soma(OUT) + soma(ADJ)</div>
      <div class="sep"></div>
      <div id="saldo_list"></div>
    </div>

    <div class="card" style="margin-top:12px">
      <h2>Movimentações</h2>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <select id="m_prod" style="min-width:260px"></select>

        <select id="m_tipo" style="width:140px">
          <option value="IN">IN (Entrada)</option>
          <option value="OUT">OUT (Saída)</option>
          <option value="ADJ">ADJ (Ajuste +)</option>
        </select>

        <input id="m_qtd" placeholder="Qtd" inputmode="decimal" style="width:120px" />
        <input id="m_custo" placeholder="Custo unit (op.)" inputmode="decimal" style="width:150px" />
        <input id="m_data" type="date" style="width:160px" />
        <input id="m_obs" placeholder="Observação" style="min-width:220px" />
        <button class="btn primary" id="btnMov">Lançar</button>
      </div>

      <div class="sep"></div>
      <div id="mov_list"></div>
    </div>
  `;

  const prodList = el.querySelector("#prod_list");
  const saldoList = el.querySelector("#saldo_list");
  const movList = el.querySelector("#mov_list");
  const selProd = el.querySelector("#m_prod");

  async function refresh() {
    const produtos = await listProdutos(farmCtx.fazenda_id);
    const saldos = await listSaldos(farmCtx.fazenda_id);
    const saldosMap = new Map(saldos.map(s => [s.produto_id, s.saldo]));

    prodList.innerHTML = produtos.length
      ? `<ul>${produtos.map(p => `<li>${esc(p.nome)} <span class="muted">(${esc(p.unidade || "")})</span></li>`).join("")}</ul>`
      : `<p class="muted">Nenhum produto cadastrado.</p>`;

    saldoList.innerHTML = produtos.length
      ? `<table class="tbl">
          <thead><tr><th>Produto</th><th>Unidade</th><th>Saldo</th></tr></thead>
          <tbody>
            ${produtos.map(p => `
              <tr>
                <td>${esc(p.nome)}</td>
                <td>${esc(p.unidade || "")}</td>
                <td>${esc(String(saldosMap.get(p.id) ?? 0))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      : `<p class="muted">Cadastre produtos para ver saldo.</p>`;

    selProd.innerHTML = produtos.length
      ? produtos.map(p => `<option value="${p.id}">${esc(p.nome)}${p.unidade ? " (" + esc(p.unidade) + ")" : ""}</option>`).join("")
      : `<option value="">— cadastre um produto —</option>`;

    const movs = await listMovs(farmCtx.fazenda_id, { limit: 80 });
    movList.innerHTML = movs.length
      ? `<table class="tbl">
          <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Obs</th></tr></thead>
          <tbody>
            ${movs.map(m => `
              <tr>
                <td>${esc(String(m.data || ""))}</td>
                <td>${esc(m.tipo || "")}</td>
                <td>${esc(String(m.qtd ?? ""))}</td>
                <td>${esc(m.obs || "")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      : `<p class="muted">Sem movimentações ainda.</p>`;
  }

  el.querySelector("#btnAddProd").onclick = async () => {
    try {
      const nome = (el.querySelector("#p_nome").value || "").trim();
      const unidade = (el.querySelector("#p_un").value || "").trim();
      if (!nome) return toast("Informe o nome do produto.", "error");

      await createProduto({
        fazenda_id: farmCtx.fazenda_id,
        nome,
        unidade: unidade || null,
      });

      toast("Produto criado.", "success");
      el.querySelector("#p_nome").value = "";
      el.querySelector("#p_un").value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro ao criar produto", "error");
    }
  };

  // default data
  el.querySelector("#m_data").value = todayISODate();

  el.querySelector("#btnMov").onclick = async () => {
    try {
      const produto_id = selProd.value;
      if (!produto_id) return toast("Cadastre um produto primeiro.", "error");

      const tipo = el.querySelector("#m_tipo").value; // IN/OUT/ADJ
      const qtd = toNum(el.querySelector("#m_qtd").value);
      const custo_unit_raw = el.querySelector("#m_custo").value;
      const custo_unit = custo_unit_raw ? toNum(custo_unit_raw) : null;

      const data = el.querySelector("#m_data").value || todayISODate();
      const obs = (el.querySelector("#m_obs").value || "").trim() || null;

      if (!Number.isFinite(qtd) || qtd <= 0) return toast("Qtd inválida.", "error");
      if (custo_unit_raw && (!Number.isFinite(custo_unit) || custo_unit < 0)) return toast("Custo unit inválido.", "error");

      await addMov({
        fazenda_id: farmCtx.fazenda_id,
        produto_id,
        tipo,
        qtd,
        custo_unit,
        data: new Date(data).toISOString(), // timestamptz
        obs,
      });

      toast("Movimentação lançada.", "success");
      el.querySelector("#m_qtd").value = "";
      el.querySelector("#m_custo").value = "";
      el.querySelector("#m_obs").value = "";
      await refresh();
    } catch (e) {
      console.error(e);
      toast(e?.message || "Erro ao lançar movimentação", "error");
    }
  };

  await refresh();
}
