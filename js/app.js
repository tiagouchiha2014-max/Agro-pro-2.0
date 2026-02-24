import { renderShell, setActiveMenu, setTopbar } from "./ui/shell.js";
import { toast } from "./ui/toast.js";
import { requireAuth, loadFarmCtx } from "./session.js";

// ------------------------------------------------------------
// ROTAS (lazy-load por página)
// ------------------------------------------------------------
const ROUTES = {
  "#/dashboard": () => import("./pages/dashboard.js"),
  "#/fazendas": () => import("./pages/fazendas.js"),
  "#/talhoes": () => import("./pages/talhoes.js"),
  "#/produtos": () => import("./pages/produtos.js"),
  "#/aplicacoes": () => import("./pages/aplicacoes.js"),
  "#/estoque": () => import("./pages/estoque.js"),
  "#/config": () => import("./pages/config.js"),
};

const DEFAULT_ROUTE = "#/dashboard";

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function normalizeHash(hash) {
  if (!hash || hash === "#") return DEFAULT_ROUTE;
  // mantém só a parte da rota (sem query string)
  const base = hash.split("?")[0];
  return ROUTES[base] ? base : DEFAULT_ROUTE;
}

function getRoute() {
  return normalizeHash(location.hash);
}

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
      // roda mais uma vez caso tenha mudado rota durante render
      queueMicrotask(() => safeRender());
    }
  }
}

// ------------------------------------------------------------
// RENDER PRINCIPAL
// ------------------------------------------------------------
async function renderRoute() {
  // 1) Auth
  const session = await requireAuth();
  if (!session) return;

  // 2) Carregar contexto da fazenda (cria se não existir)
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

  // 3) Router
  const route = getRoute();
  setActiveMenu(route);

  // Placeholder neutro (evita “flash”)
  setTopbar({ title: "", meta: farmCtx?.fazenda_nome || "" });

  // 4) Carrega módulo da página
  const loader = ROUTES[route] || ROUTES[DEFAULT_ROUTE];
  let mod;
  try {
    mod = await loader();
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

  // 5) Render da página
  try {
    if (!mod || typeof mod.render !== "function") {
      throw new Error(`Página inválida: ${route} (export render() ausente)`);
    }
    await mod.render({ session, farmCtx, route });
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

// ------------------------------------------------------------
// BOOT
// ------------------------------------------------------------
function boot() {
  // garante shell 1x
  renderShell();

  // rota inicial
  if (!location.hash || location.hash === "#") {
    location.hash = DEFAULT_ROUTE;
  }

  // listeners
  window.addEventListener("hashchange", safeRender);

  // primeira renderização
  safeRender();
}

// ------------------------------------------------------------
// START
// ------------------------------------------------------------
boot();
