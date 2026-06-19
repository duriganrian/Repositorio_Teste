const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("calibracoes.html");

  const form = document.getElementById("calibracaoForm");
  const tabela = document.getElementById("tabelaCalibracoes");
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
    MetroApp.renderReadOnlyNotice(form, "Funcionarios e gestores consultam as calibracoes. Somente o administrador pode registrar, editar ou excluir.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = collectFormData();
      if (editingId) {
        MetroApp.updateRecord(MetroApp.keys.calibrations, editingId, data, "Calibracao editada", "calibracao");
      } else {
        MetroApp.createRecord(MetroApp.keys.calibrations, data, "Calibracao registrada", "calibracao");
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const calibracoes = MetroApp.read(MetroApp.keys.calibrations, []);
      const item = calibracoes.find((calibracao) => calibracao.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item);
        editingId = item.id;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir esta calibracao?")) {
        MetroApp.removeRecord(MetroApp.keys.calibrations, item.id, "Calibracao excluida", "calibracao");
        renderizar();
      }
    });
  }

  function collectFormData() {
    return {
      instrumento: document.getElementById("instrumento").value.trim(),
      empresa: document.getElementById("empresa").value.trim(),
      certificado: document.getElementById("certificado").value.trim(),
      data: document.getElementById("dataCalibracao").value,
      validade: document.getElementById("validade").value,
      resultado: document.getElementById("resultado").value,
      incerteza: document.getElementById("incerteza").value.trim(),
      arquivo: document.getElementById("arquivo").value.trim(),
      observacoes: document.getElementById("observacoes").value.trim()
    };
  }

  function fillForm(item) {
    Object.entries({
      instrumento: item.instrumento,
      empresa: item.empresa,
      certificado: item.certificado,
      dataCalibracao: item.data,
      validade: item.validade,
      resultado: item.resultado,
      incerteza: item.incerteza,
      arquivo: item.arquivo,
      observacoes: item.observacoes
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value || "";
    });
  }

  function resetFormState() {
    form.reset();
    editingId = null;
    form.querySelector("button[type='submit']").textContent = "Salvar calibracao";
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
    const calibracoes = MetroApp.read(MetroApp.keys.calibrations, []);
    tabela.innerHTML = calibracoes.length
      ? calibracoes.map((item) => {
        const status = MetroApp.calibrationStatus(item.validade);
        return `
          <tr>
            <td>${MetroApp.escapeHtml(item.instrumento)}</td>
            <td>${MetroApp.escapeHtml(item.empresa)}</td>
            <td>${MetroApp.escapeHtml(item.certificado || "-")}</td>
            <td>${MetroApp.formatDate(item.validade)}</td>
            <td>${MetroApp.escapeHtml(item.resultado)}</td>
            <td><span class="status-pill ${status.className}">${status.label}</span></td>
            ${actionButtons(item)}
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="${canManage ? 7 : 6}"><div class="empty-state">Nenhuma calibracao registrada.</div></td></tr>`;
  }

  carregarInstrumentos();
  renderizar();
}
