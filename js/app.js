import { renderShell, setActiveMenu, setTopbar } from "./ui/shell.js";
import { toast } from "./ui/toast.js";
import { requireAuth, loadFarmCtx } from "./session.js";

const DEFAULT_PAGE = "dashboard";

// -------------------------------------
// Route parsing + sanitização
// -------------------------------------
function parsePageFromHash() {
  // Aceita: #/dashboard ou #/fazendas?x=1
  const raw = (location.hash || "").trim();

  if (!raw || raw === "#" || raw === "#/") return DEFAULT_PAGE;

  const noQuery = raw.split("?")[0];         // "#/dashboard"
  const page = noQuery.replace(/^#\//, "");  // "dashboard"

  // Sanitiza: só letras, números, _ e -
  // (evita "#/../../algo" e afins)
  if (!/^[a-z0-9_-]+$/i.test(page)) return DEFAULT_PAGE;

  return page || DEFAULT_PAGE;
}

function currentRouteHash(page) {
  return `#/${page}`;
}

// -------------------------------------
// Render lock (evita corrida)
// -------------------------------------
let isRendering = false;
let pendingRender = false;

async function safeRender() {
  if (isRendering) {
    pendingRender = true;
    return;
  }
  isRendering = true;

  try {
    await renderRoute();
  } finally {
    isRendering = false;
    if (pendingRender) {
      pendingRender = false;
      queueMicrotask(() => safeRender());
    }
  }
}

// -------------------------------------
// Loader de página (auto-router)
// -------------------------------------
async function loadPageModule(page) {
  // tenta ./pages/{page}.js
  try {
    return await import(`./pages/${page}.js`);
  } catch (e) {
    // fallback: tenta dashboard
    if (page !== DEFAULT_PAGE) {
      try {
        toast("Página não encontrada. Indo para o Dashboard…", "info");
        location.hash = currentRouteHash(DEFAULT_PAGE);
        return await import(`./pages/${DEFAULT_PAGE}.js`);
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

// -------------------------------------
// Render principal
// -------------------------------------
async function renderRoute() {
  // 1) Auth
  const session = await requireAuth();
  if (!session) return;

  // 2) Contexto fazenda (cria se não existir)
  let farmCtx;
  try {
    farmCtx = await loadFarmCtx();
  } catch (e) {
    console.error(e);
    setTopbar({ title: "Erro", meta: "" });
    toast("Falha ao carregar fazenda do usuário.", "error");
    const el = document.getElementById("content");
    if (el) {
      el.innerHTML = `
        <div class="card">
          <h2>Não foi possível iniciar</h2>
          <p class="muted">Não conseguimos carregar/criar sua fazenda inicial.</p>
          <p class="muted">Verifique RLS/policies da tabela <b>fazendas</b> e a coluna <b>owner_id</b>.</p>
        </div>
      `;
    }
    return;
  }

  // 3) Router (auto)
  const page = parsePageFromHash();
  const route = currentRouteHash(page);

  setActiveMenu(route);
  setTopbar({ title: "", meta: farmCtx?.fazenda_nome || "" }); // evita “flash”

  // 4) Carrega módulo e renderiza
  let mod;
  try {
    mod = await loadPageModule(page);
  } catch (e) {
    console.error(e);
    toast("Falha ao carregar a página.", "error");
    const el = document.getElementById("content");
    if (el) {
      el.innerHTML = `
        <div class="card">
          <h2>Erro ao carregar</h2>
          <p class="muted">Rota: <b>${route}</b></p>
        </div>
      `;
    }
    return;
  }

  try {
    if (!mod || typeof mod.render !== "function") {
      throw new Error(`Página inválida: ${page} (export render() ausente)`);
    }
    await mod.render({ session, farmCtx, route, page });
  } catch (e) {
    console.error(e);
    toast("Erro ao renderizar a página.", "error");
    const el = document.getElementById("content");
    if (el) {
      el.innerHTML = `
        <div class="card">
          <h2>Erro na tela</h2>
          <p class="muted">Ocorreu um erro ao renderizar esta página.</p>
        </div>
      `;
    }
  }
}

// -------------------------------------
// Boot
// -------------------------------------
function boot() {
  renderShell();

  // rota inicial
  if (!location.hash || location.hash === "#" || location.hash === "#/") {
    location.hash = currentRouteHash(DEFAULT_PAGE);
  }

  window.addEventListener("hashchange", safeRender);
  safeRender();
}

boot();
