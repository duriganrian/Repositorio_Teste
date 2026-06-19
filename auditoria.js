const session = MetroApp.requireAuth(["desenvolvedor", "gestor"]);

if (session) {
  MetroApp.renderShell("auditoria.html");

  const tabela = document.getElementById("tabelaAuditoria");
  const usuarioFiltro = document.getElementById("usuarioFiltro");
  const acaoFiltro = document.getElementById("acaoFiltro");

  function preencherUsuarios() {
    const users = MetroApp.getUsers();
    usuarioFiltro.innerHTML = `
      <option value="">Todos os usuarios</option>
      ${users.map((user) => `<option value="${MetroApp.escapeHtml(user.email)}">${MetroApp.escapeHtml(user.nome)} - ${MetroApp.escapeHtml(user.email)}</option>`).join("")}
    `;
  }

  function renderizar() {
    const email = usuarioFiltro.value;
    const termo = acaoFiltro.value.trim().toLowerCase();
    const logs = MetroApp.read(MetroApp.keys.audit, []).filter((log) => {
      const matchEmail = !email || log.usuarioEmail === email || log.entidadeId === email;
      const haystack = `${log.acao} ${log.detalhe} ${log.usuario}`.toLowerCase();
      const matchTermo = !termo || haystack.includes(termo);
      return matchEmail && matchTermo;
    });

    tabela.innerHTML = logs.length
      ? logs.map((log) => `
        <tr>
          <td>${MetroApp.formatDateTime(log.data)}</td>
          <td>${MetroApp.escapeHtml(log.acao)}</td>
          <td>${MetroApp.escapeHtml(log.detalhe || "-")}</td>
          <td>${MetroApp.escapeHtml(log.usuario)}<br><small>${MetroApp.escapeHtml(log.usuarioEmail)}</small></td>
          <td>${MetroApp.labelRole(log.perfil)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="5"><div class="empty-state">Nenhum registro encontrado.</div></td></tr>`;
  }

  usuarioFiltro.addEventListener("change", renderizar);
  acaoFiltro.addEventListener("input", renderizar);

  preencherUsuarios();
  renderizar();
}
