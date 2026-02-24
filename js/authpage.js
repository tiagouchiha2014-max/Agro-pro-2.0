import { supabase, getSession } from "./supabaseClient.js";
import { toast } from "./ui/toast.js";

// ✅ Anti boot duplicado (evita lock/session bug em alguns tablets)
if (window.__AUTH_BOOTED__) {
  throw new Error("Auth boot duplicado (authpage.js carregado duas vezes)");
}
window.__AUTH_BOOTED__ = true;

// ✅ Erros visíveis na tela (tablet-friendly)
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

  // ✅ Renderiza antes do Supabase (evita tela vazia)
  renderAuth(root);

  // ✅ Se já tem sessão, manda pro app
  try {
    const session = await getSession({ timeoutMs: 6000 });
    if (session) {
      location.href = "./index.html#/dashboard";
      return;
    }
  } catch (e) {
    console.warn("getSession falhou:", e);
  }

  const formLogin = root.querySelector("#formLogin");
  const formSignup = root.querySelector("#formSignup");

  if (!formLogin || !formSignup) {
    toast("Tela de login corrompida (forms não encontrados).", "error");
    return;
  }

  // LOGIN
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    if (!email || !password) return toast("Informe email e senha.", "error");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message, "error");

    location.href = "./index.html#/dashboard";
  });

  // SIGNUP
  formSignup.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    if (!nome) return toast("Informe seu nome.", "error");
    if (!email || !password) return toast("Informe email e senha.", "error");
    if (password.length < 8) return toast("Senha mínima de 8 caracteres.", "error");

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
