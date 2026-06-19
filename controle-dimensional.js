const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("controle-dimensional.html");

  const form = document.getElementById("dimensionalForm");
  const tabela = document.getElementById("tabelaDimensional");
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
    MetroApp.renderReadOnlyNotice(form, "Funcionarios e gestores consultam as medicoes. Somente o administrador pode registrar, editar ou excluir.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = collectFormData();
      if (editingId) {
        MetroApp.updateRecord(MetroApp.keys.dimensional, editingId, data, data.status === "Aprovado" ? "Medicao editada aprovada" : "Medicao editada reprovada", "controle-dimensional");
      } else {
        MetroApp.createRecord(
          MetroApp.keys.dimensional,
          data,
          data.status === "Aprovado" ? "Medicao aprovada" : "Medicao reprovada",
          "controle-dimensional"
        );
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const registros = MetroApp.read(MetroApp.keys.dimensional, []);
      const item = registros.find((registro) => registro.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item);
        editingId = item.id;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir esta medicao?")) {
        MetroApp.removeRecord(MetroApp.keys.dimensional, item.id, "Medicao excluida", "controle-dimensional");
        renderizar();
      }
    });
  }

  function collectFormData() {
    const nominal = Number(document.getElementById("nominal").value);
    const minimo = Number(document.getElementById("minimo").value);
    const maximo = Number(document.getElementById("maximo").value);
    const medicao = Number(document.getElementById("medicao").value);
    const aprovado = medicao >= minimo && medicao <= maximo;

    return {
      ordem: document.getElementById("ordem").value.trim(),
      peca: document.getElementById("peca").value.trim(),
      lote: document.getElementById("lote").value.trim(),
      caracteristica: document.getElementById("caracteristica").value.trim(),
      instrumento: document.getElementById("instrumento").value.trim(),
      nominal,
      minimo,
      maximo,
      medicao,
      desvio: Number((medicao - nominal).toFixed(3)),
      status: aprovado ? "Aprovado" : "Reprovado",
      observacoes: document.getElementById("observacoes").value.trim()
    };
  }

  function fillForm(item) {
    Object.entries({
      ordem: item.ordem,
      peca: item.peca,
      lote: item.lote,
      caracteristica: item.caracteristica,
      instrumento: item.instrumento,
      nominal: item.nominal,
      minimo: item.minimo,
      maximo: item.maximo,
      medicao: item.medicao,
      observacoes: item.observacoes
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value ?? "";
    });
  }

  function resetFormState() {
    form.reset();
    editingId = null;
    form.querySelector("button[type='submit']").textContent = "Registrar medicao";
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
    const registros = MetroApp.read(MetroApp.keys.dimensional, []);
    tabela.innerHTML = registros.length
      ? registros.map((item) => {
        const classe = item.status === "Aprovado" ? "status-aprovado" : "status-reprovado";
        return `
          <tr>
            <td>${MetroApp.escapeHtml(item.peca)}</td>
            <td>${MetroApp.escapeHtml(item.caracteristica)}</td>
            <td>${item.nominal}</td>
            <td>${item.medicao}</td>
            <td>${item.desvio}</td>
            <td><span class="status-pill ${classe}">${item.status}</span></td>
            ${actionButtons(item)}
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="${canManage ? 7 : 6}"><div class="empty-state">Nenhuma medicao registrada.</div></td></tr>`;
  }

  carregarInstrumentos();
  renderizar();
}
