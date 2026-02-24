import { supabase, getSession } from "./supabaseClient.js";
import { toast } from "./ui/toast.js";

(async function bootAuth() {
  const session = await getSession();
  if (session) location.href = "./index.html#/dashboard";

  const root = document.getElementById("auth");
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

        <label>Empresa</label>
        <input name="empresa" type="text" required maxlength="60" />

        <label>Email</label>
        <input name="email" type="email" required autocomplete="email" />

        <label>Senha (mín. 8)</label>
        <input name="password" type="password" required minlength="8" autocomplete="new-password" />

        <button class="btn" type="submit">Criar conta</button>
      </form>
    </div>
  `;

  root.querySelector("#formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.href = "./index.html#/dashboard";
    } catch (err) {
      toast(err?.message || "Falha no login", "error");
    }
  });

  root.querySelector("#formSignup").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") || "").trim();
    const empresa = String(fd.get("empresa") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome, empresa } },
      });
      if (error) throw error;

      toast("Conta criada! Faça login.", "success");
      e.currentTarget.reset();
    } catch (err) {
      toast(err?.message || "Falha no cadastro", "error");
    }
  });
})();
