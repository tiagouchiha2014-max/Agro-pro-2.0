import { renderShell, setActiveMenu, setTopbar } from "./ui/shell.js";
import { toast } from "./ui/toast.js";
import { requireAuth, loadFarmCtx } from "./session.js";

const DEFAULT_PAGE = "dashboard";

function pageFromHash() {
  const raw = (location.hash || "").trim();
  if (!raw || raw === "#" || raw === "#/") return DEFAULT_PAGE;
  const base = raw.split("?")[0].replace(/^#\//, "");
  if (!/^[a-z0-9_-]+$/i.test(base)) return DEFAULT_PAGE;
  return base || DEFAULT_PAGE;
}

let busy = false, pending = false;
async function safeRender() {
  if (busy) { pending = true; return; }
  busy = true;
  try { await renderRoute(); }
  finally {
    busy = false;
    if (pending) { pending = false; queueMicrotask(safeRender); }
  }
}

async function renderRoute() {
  const session = await requireAuth();
  if (!session) return;

  let farmCtx;
  try {
    farmCtx = await loadFarmCtx();
  } catch (e) {
    console.error(e);
    toast("Falha ao carregar/criar fazenda.", "error");
    document.getElementById("content")?.replaceChildren();
    return;
  }

  const page = pageFromHash();
  const route = `#/${page}`;

  setActiveMenu(route);
  setTopbar({ title: "", meta: farmCtx?.fazenda_nome || "" });

  let mod;
  try {
    mod = await import(`./pages/${page}.js`);
  } catch {
    toast("Página não encontrada. Indo para Dashboard…", "info");
    location.hash = "#/dashboard";
    mod = await import(`./pages/dashboard.js`);
  }

  if (typeof mod.render !== "function") {
    toast("Página inválida (export render ausente).", "error");
    return;
  }

  await mod.render({ session, farmCtx, page, route });
}

(function boot() {
  renderShell();
  if (!location.hash || location.hash === "#" || location.hash === "#/") {
    location.hash = "#/dashboard";
  }
  window.addEventListener("hashchange", safeRender);
  safeRender();
})();
