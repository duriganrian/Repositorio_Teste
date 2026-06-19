const MetroApp = (() => {
  const keys = {
    users: "metro.users",
    session: "metro.session",
    audit: "metro.audit",
    instruments: "metro.instruments",
    calibrations: "metro.calibrations",
    dimensional: "metro.dimensional",
    standards: "metro.standards",
    inspectionPlans: "metro.inspectionPlans",
    msa: "metro.msa",
    nonconformities: "metro.nonconformities",
    documents: "metro.documents",
    suppliers: "metro.suppliers"
  };

  const recordCollections = {
    [keys.instruments]: "instruments",
    [keys.calibrations]: "calibrations",
    [keys.dimensional]: "dimensional",
    [keys.standards]: "standards",
    [keys.inspectionPlans]: "inspectionPlans",
    [keys.msa]: "msa",
    [keys.nonconformities]: "nonconformities",
    [keys.documents]: "documents",
    [keys.suppliers]: "suppliers"
  };

  const developerEmail = "duriganrian7@gmail.com";

  const defaultUsers = [
    {
      id: "dev-durigan",
      nome: "Durigan Rian",
      email: developerEmail,
      senha: "DevLocal@2026",
      perfil: "desenvolvedor",
      cargo: "Desenvolvedor do sistema",
      setor: "Metrologia / Sistemas",
      ativo: true,
      criadoEm: "2026-06-19T00:00:00.000Z"
    },
    {
      id: "gestor-metrologia",
      nome: "Gestor Metrologia",
      email: "gestor.metrologia@moreno.com",
      senha: "GestorLocal@2026",
      perfil: "gestor",
      cargo: "Gestor de metrologia",
      setor: "Metrologia",
      ativo: true,
      criadoEm: "2026-06-19T00:00:00.000Z"
    },
    {
      id: "funcionario-metrologia",
      nome: "Funcionario Metrologia",
      email: "funcionario.metrologia@moreno.com",
      senha: "FuncionarioLocal@2026",
      perfil: "funcionario",
      cargo: "Tecnico de metrologia",
      setor: "Metrologia",
      ativo: true,
      criadoEm: "2026-06-19T00:00:00.000Z"
    }
  ];

  const navItems = [
    { label: "Dashboard", href: "dashboard.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Metrologia", href: "metrologia.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Instrumentos", href: "instrumentos.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Calibracoes", href: "calibracoes.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Controle Dimensional", href: "controle-dimensional.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Planos", href: "planos-inspecao.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Nao conformidades", href: "nao-conformidades.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Relatorios", href: "relatorios.html", roles: ["desenvolvedor", "gestor", "funcionario"] },
    { label: "Usuarios", href: "usuarios.html", roles: ["desenvolvedor"] },
    { label: "Auditoria", href: "auditoria.html", roles: ["desenvolvedor", "gestor"] },
    { label: "Desenvolvedor", href: "desenvolvedor.html", roles: ["desenvolvedor"] }
  ];

  function read(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function seedUsers() {
    const users = read(keys.users, []);
    const byEmail = new Map(users.map((user) => [normalizeEmail(user.email), user]));

    defaultUsers.forEach((defaultUser) => {
      const existing = byEmail.get(normalizeEmail(defaultUser.email));
      if (existing) {
        Object.assign(existing, {
          senha: defaultUser.senha,
          perfil: defaultUser.perfil,
          cargo: existing.cargo || defaultUser.cargo,
          setor: existing.setor || defaultUser.setor,
          ativo: true
        });
      } else {
        users.push({ ...defaultUser });
      }
    });

    write(keys.users, users);
    return users;
  }

  function migrateLegacyData() {
    const migrations = [
      ["usuarios", keys.users, (items) => items.map((item) => ({
        id: item.id || uid("user"),
        nome: item.nome || "Usuario",
        email: item.email || "",
        senha: item.senha || "123456",
        perfil: normalizeLegacyRole(item.perfil),
        cargo: item.cargo || "",
        setor: item.setor || "Metrologia",
        ativo: item.ativo !== false,
        criadoEm: item.criadoEm || new Date().toISOString()
      }))],
      ["instrumentos", keys.instruments, (items) => items.map((item) => ({
        id: item.id || uid("instrumento"),
        ...item,
        criadoEm: item.criadoEm || new Date().toISOString(),
        criadoPor: item.criadoPor || "Sistema legado",
        criadoPorEmail: item.criadoPorEmail || "sistema@local"
      }))],
      ["calibracoes", keys.calibrations, (items) => items.map((item) => ({
        id: item.id || uid("calibracao"),
        ...item,
        criadoEm: item.criadoEm || new Date().toISOString(),
        criadoPor: item.criadoPor || "Sistema legado",
        criadoPorEmail: item.criadoPorEmail || "sistema@local"
      }))],
      ["controleDimensional", keys.dimensional, (items) => items.map((item) => ({
        id: item.id || uid("dimensional"),
        ...item,
        criadoEm: item.criadoEm || new Date().toISOString(),
        criadoPor: item.criadoPor || "Sistema legado",
        criadoPorEmail: item.criadoPorEmail || "sistema@local"
      }))],
      ["auditoria", keys.audit, (items) => items.map((item) => ({
        id: item.id || uid("audit"),
        data: item.data || new Date().toISOString(),
        acao: item.acao || "Acao legada",
        detalhe: item.detalhe || "",
        entidade: item.entidade || "",
        entidadeId: item.entidadeId || "",
        usuario: item.usuario || "Sistema legado",
        usuarioEmail: item.usuarioEmail || "sistema@local",
        perfil: item.perfil || "sistema"
      }))]
    ];

    migrations.forEach(([legacyKey, newKey, transform]) => {
      if (localStorage.getItem(newKey)) return;
      const legacy = read(legacyKey, null);
      if (Array.isArray(legacy) && legacy.length) {
        write(newKey, transform(legacy));
      }
    });
  }

  function normalizeLegacyRole(role) {
    const value = String(role || "").toLowerCase();
    if (value.includes("desenvolvedor")) return "desenvolvedor";
    if (value.includes("supervisor") || value.includes("gestor")) return "gestor";
    return "funcionario";
  }

  function init() {
    migrateLegacyData();
    seedUsers();
  }

  function getUsers() {
    return read(keys.users, []);
  }

  function saveUsers(users) {
    write(keys.users, users);
  }

  function getSession() {
    return read(keys.session, null);
  }

  function setSession(user) {
    const session = {
      id: user.id,
      nome: user.nome || user.name,
      email: user.email,
      perfil: user.perfil || user.role,
      cargo: user.cargo || user.jobTitle || "",
      setor: user.setor || user.department || "",
      startedAt: new Date().toISOString()
    };
    write(keys.session, session);
    return session;
  }

  function login(email, senha) {
    init();
    const user = getUsers().find((item) => normalizeEmail(item.email) === normalizeEmail(email));
    if (!user || user.senha !== senha || user.ativo === false) {
      return { ok: false, message: "Email ou senha invalidos." };
    }

    const session = setSession(user);
    audit("Login realizado", "Acesso autorizado ao sistema", "sessao", session.email);
    return { ok: true, user: session };
  }

  async function loginRemote(email, senha) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) {
      const data = await safeJson(response);
      return {
        ok: false,
        remoteUnavailable: response.status >= 500,
        message: data.error || "Email ou senha invalidos."
      };
    }

    const data = await response.json();
    localStorage.setItem("metro.apiToken", data.token);
    const session = setSession(data.user);
    return { ok: true, user: session, remote: true };
  }

  function logout() {
    audit("Logout realizado", "Usuario saiu do sistema", "sessao", getSession()?.email || "");
    localStorage.removeItem(keys.session);
    localStorage.removeItem("metro.apiToken");
    window.location.href = "index.html";
  }

  function canAccess(role, item) {
    return item.roles.includes(role);
  }

  function canManageRecords(user = getSession()) {
    return user?.perfil === "desenvolvedor" && normalizeEmail(user.email) === developerEmail;
  }

  function assertCanManageRecords() {
    if (!canManageRecords()) {
      throw new Error("Somente o administrador pode cadastrar, editar ou excluir registros.");
    }
  }

  function requireAuth(roles) {
    init();
    const session = getSession();
    if (!session) {
      window.location.href = "index.html";
      return null;
    }

    if (roles && !roles.includes(session.perfil)) {
      window.location.href = "dashboard.html";
      return null;
    }

    return session;
  }

  function renderShell(activeHref) {
    const session = getSession();
    const sidebar = document.querySelector("[data-sidebar]");
    const userBar = document.querySelector("[data-userbar]");
    if (!session || !sidebar) return;

    const items = navItems
      .filter((item) => canAccess(session.perfil, item))
      .map((item) => {
        const active = item.href === activeHref ? "active" : "";
        return `<li><a class="${active}" href="${item.href}">${item.label}</a></li>`;
      })
      .join("");

    ensureMobileNavigation();

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <strong>Moreno</strong>
        <span>Sistema de Metrologia</span>
      </div>
      <ul>${items}</ul>
      <button class="logout-button" type="button" data-logout>Sair</button>
    `;

    if (userBar) {
      userBar.innerHTML = `
        <div>
          <span class="eyebrow">Perfil conectado</span>
          <strong>${escapeHtml(session.nome)}</strong>
          <small>${labelRole(session.perfil)} - ${escapeHtml(session.email)}</small>
        </div>
      `;
    }

    const logoutButton = document.querySelector("[data-logout]");
    if (logoutButton) {
      logoutButton.addEventListener("click", logout);
    }

    sidebar.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileNavigation);
    });
  }

  function ensureMobileNavigation() {
    if (!document.querySelector("[data-nav-toggle]")) {
      const button = document.createElement("button");
      button.className = "mobile-nav-toggle";
      button.type = "button";
      button.setAttribute("aria-label", "Abrir navegacao");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("data-nav-toggle", "");
      button.innerHTML = "<span></span><span></span><span></span>";
      document.body.appendChild(button);

      const overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      overlay.setAttribute("data-nav-overlay", "");
      document.body.appendChild(overlay);

      button.addEventListener("click", () => {
        const isOpen = document.body.classList.toggle("nav-open");
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen ? "Fechar navegacao" : "Abrir navegacao");
      });
      overlay.addEventListener("click", closeMobileNavigation);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMobileNavigation();
      });
    }
  }

  function closeMobileNavigation() {
    document.body.classList.remove("nav-open");
    const button = document.querySelector("[data-nav-toggle]");
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Abrir navegacao");
    }
  }

  function renderReadOnlyNotice(form, message = "Seu perfil pode consultar estes dados. Somente o administrador pode cadastrar, editar ou excluir registros.") {
    const card = form?.closest(".form-card");
    if (!card) return;
    card.classList.add("notice-card");
    card.innerHTML = `
      <h2>Modo consulta</h2>
      <p>${escapeHtml(message)}</p>
    `;
  }

  function labelRole(role) {
    const labels = {
      desenvolvedor: "Desenvolvedor",
      gestor: "Gestor",
      funcionario: "Funcionario"
    };
    return labels[role] || role;
  }

  function audit(acao, detalhe = "", entidade = "", entidadeId = "") {
    const session = getSession();
    const logs = read(keys.audit, []);
    logs.unshift({
      id: uid("audit"),
      data: new Date().toISOString(),
      acao,
      detalhe,
      entidade,
      entidadeId,
      usuario: session?.nome || "Sistema",
      usuarioEmail: session?.email || "sistema@local",
      perfil: session?.perfil || "sistema"
    });
    write(keys.audit, logs);
  }

  function createRecord(key, data, action, entityName) {
    assertCanManageRecords();
    const session = getSession();
    const record = {
      id: uid(entityName || "item"),
      ...data,
      criadoEm: new Date().toISOString(),
      criadoPor: session?.nome || "Sistema",
      criadoPorEmail: session?.email || "sistema@local"
    };
    const list = read(key, []);
    list.unshift(record);
    write(key, list);
    audit(action, data.descricao || data.nome || data.codigo || data.instrumento || "", entityName, record.id);
    syncRecord(key, record);
    return record;
  }

  function updateRecord(key, id, changes, action, entityName) {
    assertCanManageRecords();
    const list = read(key, []);
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return null;
    list[index] = {
      ...list[index],
      ...changes,
      atualizadoEm: new Date().toISOString(),
      atualizadoPorEmail: getSession()?.email || "sistema@local"
    };
    write(key, list);
    audit(action, list[index].nome || list[index].codigo || id, entityName, id);
    syncRecordUpdate(key, list[index]);
    return list[index];
  }

  function removeRecord(key, id, action, entityName) {
    assertCanManageRecords();
    const list = read(key, []);
    const item = list.find((record) => record.id === id);
    write(key, list.filter((record) => record.id !== id));
    audit(action, item?.nome || item?.codigo || id, entityName, id);
    syncRecordDelete(key, id);
  }

  function resetDatabase() {
    const session = getSession();
    if (!session || session.email !== developerEmail || session.perfil !== "desenvolvedor") {
      throw new Error("Apenas o desenvolvedor pode apagar o banco.");
    }

    Object.values(keys).forEach((key) => localStorage.removeItem(key));
    init();
    const devUser = getUsers().find((user) => normalizeEmail(user.email) === developerEmail);
    setSession(devUser);
    audit("Banco de dados apagado", "Todos os dados locais foram removidos e usuarios padrao foram recriados", "database", "localStorage");
  }

  async function createUserRemote(user) {
    const token = localStorage.getItem("metro.apiToken");
    if (!token) return null;
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: user.nome,
        email: user.email,
        password: user.senha,
        role: user.perfil,
        jobTitle: user.cargo,
        department: user.setor
      })
    });
    return safeJson(response);
  }

  async function resetDatabaseRemote(password) {
    const token = localStorage.getItem("metro.apiToken");
    if (!token) return null;
    const response = await fetch("/api/database", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        confirmation: "APAGAR BANCO",
        password
      })
    });
    return safeJson(response);
  }

  function syncRecord(key, record) {
    const collection = recordCollections[key];
    const token = localStorage.getItem("metro.apiToken");
    if (!collection || !token) return;

    fetch(`/api/records/${collection}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(record)
    }).catch(() => {
      // A interface continua funcionando offline; o proximo backend real pode reprocessar dados locais.
    });
  }

  function syncRecordUpdate(key, record) {
    const collection = recordCollections[key];
    const token = localStorage.getItem("metro.apiToken");
    if (!collection || !token || !record?.id) return;

    fetch(`/api/records/${collection}/${encodeURIComponent(record.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(record)
    }).catch(() => {});
  }

  function syncRecordDelete(key, id) {
    const collection = recordCollections[key];
    const token = localStorage.getItem("metro.apiToken");
    if (!collection || !token || !id) return;

    fetch(`/api/records/${collection}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }).catch(() => {});
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
  }

  function calibrationStatus(validade) {
    const today = new Date();
    const due = new Date(validade);
    if (!validade || Number.isNaN(due.getTime())) {
      return { label: "Sem data", className: "status-alerta" };
    }
    const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Vencido", className: "status-danger" };
    if (days <= 30) return { label: "Proximo", className: "status-alerta" };
    return { label: "Valido", className: "status-ok" };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function collectionCounts() {
    return {
      users: getUsers().length,
      instruments: read(keys.instruments, []).length,
      calibrations: read(keys.calibrations, []).length,
      dimensional: read(keys.dimensional, []).length,
      standards: read(keys.standards, []).length,
      plans: read(keys.inspectionPlans, []).length,
      msa: read(keys.msa, []).length,
      nonconformities: read(keys.nonconformities, []).length,
      documents: read(keys.documents, []).length,
      suppliers: read(keys.suppliers, []).length,
      audit: read(keys.audit, []).length
    };
  }

  init();

  return {
    keys,
    developerEmail,
    defaultUsers,
    init,
    read,
    write,
    uid,
    login,
    loginRemote,
    logout,
    getSession,
    requireAuth,
    renderShell,
    canManageRecords,
    renderReadOnlyNotice,
    audit,
    createRecord,
    updateRecord,
    removeRecord,
    resetDatabase,
    resetDatabaseRemote,
    getUsers,
    saveUsers,
    createUserRemote,
    labelRole,
    formatDate,
    formatDateTime,
    calibrationStatus,
    escapeHtml,
    collectionCounts
  };
})();
