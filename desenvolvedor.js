const session = MetroApp.requireAuth(["desenvolvedor"]);

if (session) {
  MetroApp.renderShell("desenvolvedor.html");

  const profileList = document.getElementById("profileList");
  const profileTitle = document.getElementById("profileTitle");
  const profileDetails = document.getElementById("profileDetails");
  const profileRecords = document.getElementById("profileRecords");
  const profileAudit = document.getElementById("profileAudit");
  const resetButton = document.getElementById("btnResetDatabase");
  const resetMessage = document.getElementById("resetMessage");
  let selectedEmail = session.email;

  const modules = [
    ["Instrumentos", MetroApp.keys.instruments, (item) => item.nome || item.codigo],
    ["Calibracoes", MetroApp.keys.calibrations, (item) => item.instrumento || item.certificado],
    ["Controle dimensional", MetroApp.keys.dimensional, (item) => `${item.peca || ""} ${item.caracteristica || ""}`.trim()],
    ["Padroes", MetroApp.keys.standards, (item) => item.titulo],
    ["Planos de inspecao", MetroApp.keys.inspectionPlans, (item) => item.titulo],
    ["MSA / R&R", MetroApp.keys.msa, (item) => item.titulo],
    ["Nao conformidades", MetroApp.keys.nonconformities, (item) => item.titulo],
    ["Documentos", MetroApp.keys.documents, (item) => item.titulo],
    ["Fornecedores", MetroApp.keys.suppliers, (item) => item.titulo]
  ];

  function userRecords(email) {
    return modules.flatMap(([label, key, describe]) => (
      MetroApp.read(key, [])
        .filter((item) => item.criadoPorEmail === email || item.atualizadoPorEmail === email)
        .map((item) => ({
          module: label,
          title: describe(item) || "-",
          date: item.criadoEm || item.atualizadoEm,
          status: item.status || item.resultado || "-"
        }))
    )).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function userAudit(email) {
    return MetroApp.read(MetroApp.keys.audit, [])
      .filter((log) => log.usuarioEmail === email || log.entidadeId === email)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  function renderProfiles() {
    const users = MetroApp.getUsers();
    profileList.innerHTML = users.map((user) => `
      <button class="profile-button ${user.email === selectedEmail ? "active" : ""}" type="button" data-email="${MetroApp.escapeHtml(user.email)}">
        <strong>${MetroApp.escapeHtml(user.nome)}</strong>
        <small>${MetroApp.labelRole(user.perfil)} - ${MetroApp.escapeHtml(user.email)}</small>
      </button>
    `).join("");

    profileList.querySelectorAll("[data-email]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedEmail = button.dataset.email;
        render();
      });
    });
  }

  function renderProfileDetails(user) {
    profileTitle.textContent = user ? user.nome : "Perfil";
    profileDetails.innerHTML = user ? `
      <div class="cards">
        <article class="card">
          <span>Email</span>
          <small>${MetroApp.escapeHtml(user.email)}</small>
        </article>
        <article class="card">
          <span>Perfil</span>
          <small>${MetroApp.labelRole(user.perfil)}</small>
        </article>
        <article class="card">
          <span>Cargo</span>
          <small>${MetroApp.escapeHtml(user.cargo || "-")}</small>
        </article>
        <article class="card">
          <span>Setor</span>
          <small>${MetroApp.escapeHtml(user.setor || "-")}</small>
        </article>
      </div>
    ` : `<div class="empty-state">Selecione um perfil.</div>`;
  }

  function renderRecords(email) {
    const records = userRecords(email);
    profileRecords.innerHTML = records.length
      ? records.map((item) => `
        <tr>
          <td>${MetroApp.escapeHtml(item.module)}</td>
          <td>${MetroApp.escapeHtml(item.title)}</td>
          <td>${MetroApp.formatDateTime(item.date)}</td>
          <td>${MetroApp.escapeHtml(item.status)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="4"><div class="empty-state">Nenhum registro operacional feito por esta pessoa.</div></td></tr>`;
  }

  function renderAudit(email) {
    const logs = userAudit(email);
    profileAudit.innerHTML = logs.length
      ? logs.map((log) => `
        <tr>
          <td>${MetroApp.formatDateTime(log.data)}</td>
          <td>${MetroApp.escapeHtml(log.acao)}</td>
          <td>${MetroApp.escapeHtml(log.detalhe || "-")}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3"><div class="empty-state">Nenhuma acao registrada para esta pessoa.</div></td></tr>`;
  }

  function render() {
    const user = MetroApp.getUsers().find((item) => item.email === selectedEmail);
    renderProfiles();
    renderProfileDetails(user);
    renderRecords(selectedEmail);
    renderAudit(selectedEmail);
  }

  resetButton.addEventListener("click", async () => {
    resetMessage.textContent = "";
    const confirmation = document.getElementById("confirmacaoTexto").value.trim();
    const password = document.getElementById("confirmacaoSenha").value;

    if (confirmation !== "APAGAR BANCO") {
      resetMessage.textContent = "Digite APAGAR BANCO para confirmar.";
      return;
    }

    const hasRemoteSession = !!localStorage.getItem("metro.apiToken");
    if (!hasRemoteSession && password !== "DevLocal@2026") {
      resetMessage.textContent = "Senha do desenvolvedor incorreta.";
      return;
    }

    if (hasRemoteSession) {
      try {
        const result = await MetroApp.resetDatabaseRemote(password);
        if (result && result.error) {
          resetMessage.textContent = result.error;
          return;
        }
      } catch (error) {
        resetMessage.textContent = "Nao foi possivel apagar o banco remoto agora.";
        return;
      }
    }

    MetroApp.resetDatabase();
    resetMessage.textContent = "Banco local apagado e usuarios padrao recriados.";
    selectedEmail = MetroApp.developerEmail;
    document.getElementById("confirmacaoTexto").value = "";
    document.getElementById("confirmacaoSenha").value = "";
    render();
  });

  render();
}
