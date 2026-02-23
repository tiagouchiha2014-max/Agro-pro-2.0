<meta name='viewport' content='width=device-width, initial-scale=1'/>import { signOut } from "../session.js";

export function renderShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="layout" id="layoutRoot">
      <div class="overlay" id="sidebarOverlay" aria-hidden="true"></div>

      <aside class="sidebar" id="sidebar" aria-label="Menu lateral">
        <div class="brand">Agro Pro</div>

        <nav class="menu" aria-label="Menu principal">
          <a href="#/dashboard" data-route="#/dashboard">Dashboard</a>
          <a href="#/fazendas" data-route="#/fazendas">Fazendas</a>
          <a href="#/talhoes" data-route="#/talhoes">Talhões</a>
          <a href="#/produtos" data-route="#/produtos">Produtos</a>
          <a href="#/aplicacoes" data-route="#/aplicacoes">Aplicações</a>
          <a href="#/estoque" data-route="#/estoque">Estoque</a>
          <a href="#/config" data-route="#/config">Config</a>
        </nav>

        <button class="btn ghost" id="btnLogout" type="button">Sair</button>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="icon-btn" id="btnToggleSidebar" type="button" aria-label="Abrir menu">
            ☰
          </button>

          <div class="topbar-left">
            <div id="topbarTitle"></div>
            <div id="topbarMeta" class="muted"></div>
          </div>
        </header>

        <section id="content" class="content"></section>
      </main>
    </div>
  `;

  document.getElementById("btnLogout").addEventListener("click", signOut);

  // Sidebar toggle (mobile/tablet)
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btn = document.getElementById("btnToggleSidebar");

  const open = () => {
    document.body.classList.add("sidebar-open");
    overlay.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-label", "Fechar menu");
  };
  const close = () => {
    document.body.classList.remove("sidebar-open");
    overlay.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-label", "Abrir menu");
  };
  const toggle = () => (document.body.classList.contains("sidebar-open") ? close() : open());

  btn.addEventListener("click", toggle);
  overlay.addEventListener("click", close);

  // Fecha ao clicar em um item (melhor UX no mobile)
  sidebar.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-route]");
    if (a) close();
  });

  // Esc fecha
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Se voltar para desktop, remove estado aberto
  const mq = window.matchMedia("(min-width: 901px)");
  mq.addEventListener?.("change", () => {
    if (mq.matches) close();
  });
}

export function setActiveMenu(route) {
  document.querySelectorAll(".menu a[data-route]").forEach(a => {
    const active = a.getAttribute("data-route") === route;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function setTopbar({ title, meta = "" }) {
  const t = document.getElementById("topbarTitle");
  const m = document.getElementById("topbarMeta");
  if (t) t.textContent = title || "";   // sem “Dashboard” fixo
  if (m) m.textContent = meta || "";
}
