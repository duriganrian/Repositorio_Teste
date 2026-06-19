const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("nao-conformidades.html");

  const form = document.getElementById("naoConformidadeForm");
  const tabela = document.getElementById("tabelaNaoConformidades");
  const actionHeader = document.querySelector("[data-actions-header]");
  const canManage = MetroApp.canManageRecords(session);
  let editingId = null;

  if (actionHeader) actionHeader.hidden = !canManage;

  if (!canManage) {
    MetroApp.renderReadOnlyNotice(form, "Funcionarios e gestores acompanham as ocorrencias. Somente o administrador pode cadastrar, editar ou excluir.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = collectFormData();
      if (editingId) {
        MetroApp.updateRecord(MetroApp.keys.nonconformities, editingId, data, "Nao conformidade editada", "nao-conformidade");
      } else {
        MetroApp.createRecord(MetroApp.keys.nonconformities, data, "Nao conformidade cadastrada", "nao-conformidade");
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const item = MetroApp.read(MetroApp.keys.nonconformities, []).find((ocorrencia) => ocorrencia.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item);
        editingId = item.id;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir esta nao conformidade?")) {
        MetroApp.removeRecord(MetroApp.keys.nonconformities, item.id, "Nao conformidade excluida", "nao-conformidade");
        renderizar();
      }
    });
  }

  function collectFormData() {
    return {
      codigo: document.getElementById("codigo").value.trim(),
      titulo: document.getElementById("codigo").value.trim(),
      origem: document.getElementById("origem").value,
      referencia: document.getElementById("referencia").value.trim(),
      severidade: document.getElementById("severidade").value,
      responsavel: document.getElementById("responsavel").value.trim(),
      validade: document.getElementById("prazo").value,
      prazo: document.getElementById("prazo").value,
      status: document.getElementById("status").value,
      descricao: document.getElementById("descricao").value.trim(),
      acao: document.getElementById("acao").value.trim()
    };
  }

  function fillForm(item) {
    Object.entries({
      codigo: item.codigo,
      origem: item.origem,
      referencia: item.referencia,
      severidade: item.severidade,
      responsavel: item.responsavel,
      prazo: item.prazo || item.validade,
      status: item.status,
      descricao: item.descricao,
      acao: item.acao
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value || "";
    });
  }

  function resetFormState() {
    form.reset();
    editingId = null;
    form.querySelector("button[type='submit']").textContent = "Salvar ocorrencia";
  }

  function actionButtons(item) {
    if (!canManage) return "";
    return `
      <td>
        <div class="row-actions">
          <button class="edit-button" type="button" data-action="edit" data-id="${MetroApp.escapeHtml(item.id)}">Editar</button>
          <button class="delete-button" type="button" data-action="delete" data-id="${MetroApp.escapeHtml(item.id)}">Excluir</button>
        </div>
      </td>
    `;
  }

  function statusClass(status) {
    if (status === "Concluida" || status === "Cancelada") return "status-ok";
    if (status === "Aberta" || status === "Em analise") return "status-alerta";
    return "status-danger";
  }

  function renderizar() {
    const ocorrencias = MetroApp.read(MetroApp.keys.nonconformities, []);
    tabela.innerHTML = ocorrencias.length
      ? ocorrencias.map((item) => `
        <tr>
          <td>${MetroApp.escapeHtml(item.codigo || "-")}</td>
          <td>${MetroApp.escapeHtml(item.origem || "-")}</td>
          <td>${MetroApp.escapeHtml(item.referencia || "-")}</td>
          <td>${MetroApp.formatDate(item.prazo || item.validade)}</td>
          <td><span class="status-pill ${statusClass(item.status)}">${MetroApp.escapeHtml(item.status || "-")}</span></td>
          ${actionButtons(item)}
        </tr>
      `).join("")
      : `<tr><td colspan="${canManage ? 6 : 5}"><div class="empty-state">Nenhuma nao conformidade cadastrada.</div></td></tr>`;
  }

  renderizar();
}
