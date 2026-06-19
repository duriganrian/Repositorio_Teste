const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("planos-inspecao.html");

  const form = document.getElementById("planoForm");
  const tabela = document.getElementById("tabelaPlanos");
  const listaInstrumentos = document.getElementById("instrumentosList");
  const actionHeader = document.querySelector("[data-actions-header]");
  const canManage = MetroApp.canManageRecords(session);
  let editingId = null;

  if (actionHeader) actionHeader.hidden = !canManage;

  function carregarInstrumentos() {
    const instrumentos = MetroApp.read(MetroApp.keys.instruments, []);
    listaInstrumentos.innerHTML = instrumentos.map((item) => `
      <option value="${MetroApp.escapeHtml(item.codigo)} - ${MetroApp.escapeHtml(item.nome)}"></option>
    `).join("");
  }

  if (!canManage) {
    MetroApp.renderReadOnlyNotice(form, "Funcionarios e gestores consultam os planos. Somente o administrador pode cadastrar, editar ou excluir.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = collectFormData();
      if (editingId) {
        MetroApp.updateRecord(MetroApp.keys.inspectionPlans, editingId, data, "Plano de inspecao editado", "plano-inspecao");
      } else {
        MetroApp.createRecord(MetroApp.keys.inspectionPlans, data, "Plano de inspecao cadastrado", "plano-inspecao");
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const item = MetroApp.read(MetroApp.keys.inspectionPlans, []).find((plano) => plano.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item);
        editingId = item.id;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir este plano de inspecao?")) {
        MetroApp.removeRecord(MetroApp.keys.inspectionPlans, item.id, "Plano de inspecao excluido", "plano-inspecao");
        renderizar();
      }
    });
  }

  function collectFormData() {
    return {
      codigo: document.getElementById("codigo").value.trim(),
      titulo: document.getElementById("peca").value.trim(),
      peca: document.getElementById("peca").value.trim(),
      revisao: document.getElementById("revisao").value.trim(),
      frequencia: document.getElementById("frequencia").value.trim(),
      amostragem: document.getElementById("amostragem").value.trim(),
      instrumento: document.getElementById("instrumento").value.trim(),
      responsavel: document.getElementById("responsavel").value.trim(),
      validade: document.getElementById("validade").value,
      status: document.getElementById("status").value,
      caracteristicas: document.getElementById("caracteristicas").value.trim(),
      observacoes: document.getElementById("observacoes").value.trim()
    };
  }

  function fillForm(item) {
    Object.entries({
      codigo: item.codigo,
      peca: item.peca,
      revisao: item.revisao,
      frequencia: item.frequencia,
      amostragem: item.amostragem,
      instrumento: item.instrumento,
      responsavel: item.responsavel,
      validade: item.validade,
      status: item.status,
      caracteristicas: item.caracteristicas,
      observacoes: item.observacoes
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value || "";
    });
  }

  function resetFormState() {
    form.reset();
    editingId = null;
    form.querySelector("button[type='submit']").textContent = "Salvar plano";
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

  function renderizar() {
    const planos = MetroApp.read(MetroApp.keys.inspectionPlans, []);
    tabela.innerHTML = planos.length
      ? planos.map((item) => `
        <tr>
          <td>${MetroApp.escapeHtml(item.codigo || "-")}</td>
          <td>${MetroApp.escapeHtml(item.peca || item.titulo || "-")}</td>
          <td>${MetroApp.escapeHtml(item.frequencia || "-")}</td>
          <td>${MetroApp.escapeHtml(item.instrumento || "-")}</td>
          <td><span class="status-pill ${item.status === "Obsoleto" ? "status-danger" : "status-ok"}">${MetroApp.escapeHtml(item.status || "-")}</span></td>
          ${actionButtons(item)}
        </tr>
      `).join("")
      : `<tr><td colspan="${canManage ? 6 : 5}"><div class="empty-state">Nenhum plano de inspecao cadastrado.</div></td></tr>`;
  }

  carregarInstrumentos();
  renderizar();
}
