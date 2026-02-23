<meta name='viewport' content='width=device-width, initial-scale=1'/><style>:root{ --bg:#0b1220; --card:#0f1a2e; --line:rgba(255,255,255,.08); --text:#e5e7eb; --muted:#9aa4b2; --brand:#3b82f6; }

*{ box-sizing:border-box; }
body{ margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto; background:var(--bg); color:var(--text); }

.layout{ display:grid; grid-template-columns:260px 1fr; min-height:100vh; }
.sidebar{ border-right:1px solid var(--line); padding:16px; background:rgba(255,255,255,.02); display:flex; flex-direction:column; gap:12px; }
.brand{ font-weight:800; letter-spacing:.4px; }

.menu{ display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.menu a{ color:var(--text); text-decoration:none; padding:10px 10px; border-radius:10px; border:1px solid transparent; }
.menu a.active{ border-color:var(--line); background:rgba(59,130,246,.12); }

.main{ display:flex; flex-direction:column; }
.topbar{ display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid var(--line); background:rgba(255,255,255,.02); position:sticky; top:0; }
.content{ padding:16px; display:grid; gap:12px; }

.card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; }
.muted{ color:var(--muted); }

.btn{ cursor:pointer; border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--text); padding:10px 12px; border-radius:12px; }
.btn.primary{ background:rgba(59,130,246,.20); border-color:rgba(59,130,246,.35); }
.btn.ghost{ background:transparent; }

.auth-card{ max-width:420px; margin:6vh auto; background:var(--card); border:1px solid var(--line); border-radius:18px; padding:18px; }
label{ display:block; margin-top:10px; margin-bottom:6px; color:var(--muted); }
input{ width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--line); background:rgba(0,0,0,.18); color:var(--text); }
.sep{ height:1px; background:var(--line); margin:14px 0; }

.toast-host{ position:fixed; right:12px; top:12px; display:flex; flex-direction:column; gap:8px; z-index:9999; }
.toast{ opacity:0; transform:translateY(-6px); transition:.18s; padding:10px 12px; border-radius:12px; border:1px solid var(--line); background:rgba(0,0,0,.45); backdrop-filter: blur(10px); }
.toast.is-show{ opacity:1; transform:translateY(0); }
.toast--error{ border-color:rgba(239,68,68,.35); }
.toast--success{ border-color:rgba(34,197,94,.35); }

@media (max-width: 900px){
  .layout{ grid-template-columns:1fr; }
  .sidebar{ position:sticky; top:0; z-index:10; border-right:none; border-bottom:1px solid var(--line); }
}</style>
