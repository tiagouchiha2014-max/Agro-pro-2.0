import { supabase, getSession } from "./supabaseClient.js";
import { toast } from "./ui/toast.js";

(async function bootAuth() {
  const session = await getSession();
  if (session) {
    location.href = "./index.html#/dashboard";
    return;
  }

  const root = document.getElementById("auth");
  if (!root) {
    document.body.innerHTML = "<pre>Erro: #auth não encontrado no login.html</pre>";
    return;
  }

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

  // LOGIN
  root.querySelector("#formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message, "error");
      return;
    }

    location.href = "./index.html#/dashboard";
  });

  // SIGNUP
  root.querySelector("#formSignup").addEventListener("submit", async (e) => {
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

    if (error) {
      toast(error.message, "error");
      return;
    }

    toast("Conta criada! Faça login.", "success");
    e.currentTarget.reset();
  });
})();
