import { requireAuth, loadOrgCtx } from "./session.js";
import { renderShell, setActiveMenu } from "./ui/shell.js";
import { toast } from "./ui/toast.js";

const ROUTES = {
  "#/dashboard": () => import("./pages/dashboard.js"),
  "#/fazendas": () => import("./pages/fazendas.js"),
  "#/talhoes": () => import("./pages/talhoes.js"),
  "#/produtos": () => import("./pages/produtos.js"),
  "#/aplicacoes": () => import("./pages/aplicacoes.js"),
  "#/estoque": () => import("./pages/estoque.js"),
  "#/config": () => import("./pages/config.js"),
};

function getRoute() {
  const h = location.hash || "#/dashboard";
  return ROUTES[h] ? h : "#/dashboard";
}

async function renderRoute() {
  const session = await requireAuth();
  if (!session) return;

  let orgCtx;
  try {
    orgCtx = await loadOrgCtx();
  } catch (e) {
    toast("Falha ao carregar empresa do usuário.", "error");
    console.error(e);
    return;
  }

  const route = getRoute();
  setActiveMenu(route);

  const mod = await ROUTES[route]();
  await mod.render({ session, orgCtx });
}

window.addEventListener("hashchange", renderRoute);

(async function boot() {
  renderShell();
  await renderRoute();
})(); 
