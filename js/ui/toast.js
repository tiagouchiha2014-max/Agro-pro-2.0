let host;

export function toast(msg, type = "info") {
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = msg; // textContent evita XSS
  host.appendChild(el);

  requestAnimationFrame(() => el.classList.add("is-show"));

  setTimeout(() => {
    el.classList.remove("is-show");
    setTimeout(() => el.remove(), 200);
  }, 2600);
}
