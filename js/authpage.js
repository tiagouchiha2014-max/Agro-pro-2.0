import { supabase, getSession } from "./supabaseClient.js";
import { toast } from "./ui/toast.js";

// Mostra erros na tela (tablet-friendly)
window.addEventListener("error", (e) => {
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:12px;font:14px/1.4 system-ui;background:#111;color:#fff">
ERRO JS:
${e.message}
${e.filename}:${e.lineno}:${e.colno}
</pre>`;
});

window.addEventListener("unhandledrejection", (e) => {
  document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:12px;font:14px/1.4 system-ui;background:#111;color:#fff">
PROMISE REJEITADA:
${String(e.reason?.message || e.reason)}
</pre>`;
});

function renderAuth(root) {
  root.innerHTML = `
    <div class="auth-card">
      <h1>Agro Pro</h1>
      <p class="muted">Acesso seguro</p>

      <form id="formLogin" autocomplete="on">
        <label>Email</label>
        <input name="email" type="email" required autocomplete="email" />

        <label>Senha</label>
        <input name="password" type="password" required autocomplete="current-password" />

        <button class="btn primary" type="submit">Entrar</button>
      </form>

      <div class="sep"></div>

      <form id="formSignup" autocomplete="on">
        <label>Nome</label>
        <input name="nome" type="text" required maxlength="60" autocomplete="name" />

        <label>Email</label>
        <input name="email" type="email" required autocomplete="email" />

        <label>Senha (mín. 8)</label>
        <input name="password" type="password" required minlength="8" autocomplete="new-password" />

        <button class="btn" type="submit">Criar conta</button>
      </form>
    </div>
  `;
}

(async function bootAuth() {
  const root = document.getElementById("auth");
  if (!root) {
    document.body.innerHTML = "<pre>Erro: #auth não encontrado no login.html</pre>";
    return;
  }

  // Renderiza ANTES de qualquer chamada ao Supabase (evita “azul vazio”)
  renderAuth(root);

  // Se getSession estiver quebrado/undefined, a tela vai mostrar aqui
  let session = null;
  if (typeof getSession === "function") {
    session = await getSession();
  } else {
    toast("getSession() não existe em supabaseClient.js", "error");
  }

  if (session) {
    location.href = "./index.html#/dashboard";
    return;
  }

  const formLogin = root.querySelector("#formLogin");
  const formSignup = root.querySelector("#formSignup");

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message, "error");

    location.href = "./index.html#/dashboard";
  });

  formSignup.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });

    if (error) return toast(error.message, "error");

    toast("Conta criada! Faça login.", "success");
    e.currentTarget.reset();
  });
})();
