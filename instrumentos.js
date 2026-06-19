const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("instrumentos.html");

  const form = document.getElementById("instrumentoForm");
  const tabela = document.getElementById("tabelaInstrumentos");
  const actionHeader = document.querySelector("[data-actions-header]");
  const canManage = MetroApp.canManageRecords(session);
  let editingId = null;

  if (actionHeader) actionHeader.hidden = !canManage;

  if (!canManage) {
    MetroApp.renderReadOnlyNotice(form, "Funcionarios e gestores consultam os instrumentos. Somente o administrador pode cadastrar, editar ou excluir.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = collectFormData();
      if (editingId) {
        MetroApp.updateRecord(MetroApp.keys.instruments, editingId, data, "Instrumento editado", "instrumento");
      } else {
        MetroApp.createRecord(MetroApp.keys.instruments, data, "Instrumento cadastrado", "instrumento");
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const instrumentos = MetroApp.read(MetroApp.keys.instruments, []);
      const item = instrumentos.find((instrumento) => instrumento.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item);
        editingId = item.id;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir este instrumento?")) {
        MetroApp.removeRecord(MetroApp.keys.instruments, item.id, "Instrumento excluido", "instrumento");
        renderizar();
      }
    });
  }

  function collectFormData() {
    return {
      codigo: document.getElementById("codigo").value.trim(),
      nome: document.getElementById("nome").value.trim(),
      tipo: document.getElementById("tipo").value.trim(),
      fabricante: document.getElementById("fabricante").value.trim(),
      modelo: document.getElementById("modelo").value.trim(),
      serie: document.getElementById("serie").value.trim(),
      faixa: document.getElementById("faixa").value.trim(),
      resolucao: document.getElementById("resolucao").value.trim(),
      localizacao: document.getElementById("localizacao").value.trim(),
      responsavel: document.getElementById("responsavel").value.trim(),
      criticidade: document.getElementById("criticidade").value,
      status: document.getElementById("status").value,
      ultimaCalibracao: document.getElementById("ultimaCalibracao").value,
      proximaCalibracao: document.getElementById("proximaCalibracao").value
    };
  }

  function fillForm(item) {
    Object.entries({
      codigo: item.codigo,
      nome: item.nome,
      tipo: item.tipo,
      fabricante: item.fabricante,
      modelo: item.modelo,
      serie: item.serie,
      faixa: item.faixa,
      resolucao: item.resolucao,
      localizacao: item.localizacao,
      responsavel: item.responsavel,
      criticidade: item.criticidade,
      status: item.status,
      ultimaCalibracao: item.ultimaCalibracao,
      proximaCalibracao: item.proximaCalibracao
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value || "";
    });
  }

  function resetFormState() {
    form.reset();
    editingId = null;
    form.querySelector("button[type='submit']").textContent = "Salvar instrumento";
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
    const instrumentos = MetroApp.read(MetroApp.keys.instruments, []);
    tabela.innerHTML = instrumentos.length
      ? instrumentos.map((item) => {
        const status = MetroApp.calibrationStatus(item.proximaCalibracao);
        return `
          <tr>
            <td>${MetroApp.escapeHtml(item.codigo)}</td>
            <td>${MetroApp.escapeHtml(item.nome)}</td>
            <td>${MetroApp.escapeHtml(item.tipo)}</td>
            <td>${MetroApp.escapeHtml(item.localizacao || "-")}</td>
            <td>${MetroApp.formatDate(item.proximaCalibracao)}</td>
            <td><span class="status-pill ${status.className}">${status.label}</span></td>
            ${actionButtons(item)}
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="${canManage ? 7 : 6}"><div class="empty-state">Nenhum instrumento cadastrado.</div></td></tr>`;
  }

  renderizar();
}
