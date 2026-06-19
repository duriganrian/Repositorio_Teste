const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("metrologia.html");

  const form = document.getElementById("metrologiaForm");
  const cards = document.getElementById("metrologyCards");
  const tabela = document.getElementById("tabelaMetrologia");
  const actionHeader = document.querySelector("[data-actions-header]");
  const canManage = MetroApp.canManageRecords(session);
  let editing = null;

  const categories = {
    standards: { label: "Padroes", key: MetroApp.keys.standards, entity: "padrao" },
    inspectionPlans: { label: "Planos de inspecao", key: MetroApp.keys.inspectionPlans, entity: "plano-inspecao" },
    msa: { label: "MSA / R&R", key: MetroApp.keys.msa, entity: "msa" },
    nonconformities: { label: "Nao conformidades", key: MetroApp.keys.nonconformities, entity: "nao-conformidade" },
    documents: { label: "Documentos", key: MetroApp.keys.documents, entity: "documento" },
    suppliers: { label: "Fornecedores", key: MetroApp.keys.suppliers, entity: "fornecedor" }
  };

  if (actionHeader) actionHeader.hidden = !canManage;

  if (!canManage) {
    MetroApp.renderReadOnlyNotice(form, "Esta central fica em consulta para funcionarios e gestores. Somente o administrador pode cadastrar, editar ou excluir registros metrologicos.");
  } else {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const categoryKey = editing?.categoryId || document.getElementById("tipoRegistro").value;
      const category = categories[categoryKey];
      const data = collectFormData(category);

      if (editing) {
        MetroApp.updateRecord(category.key, editing.id, data, `${category.label} editado`, category.entity);
      } else {
        MetroApp.createRecord(category.key, data, `${category.label} registrado`, category.entity);
      }

      resetFormState();
      renderizar();
    });

    tabela.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const category = categories[button.dataset.category];
      if (!category) return;
      const item = MetroApp.read(category.key, []).find((record) => record.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "edit") {
        fillForm(item, button.dataset.category);
        editing = { id: item.id, categoryId: button.dataset.category };
        document.getElementById("tipoRegistro").disabled = true;
        form.querySelector("button[type='submit']").textContent = "Salvar alteracoes";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "delete" && confirm("Excluir este registro metrologico?")) {
        MetroApp.removeRecord(category.key, item.id, `${category.label} excluido`, category.entity);
        renderizar();
      }
    });
  }

  function collectFormData(category) {
    return {
      tipo: category.label,
      titulo: document.getElementById("titulo").value.trim(),
      referencia: document.getElementById("referencia").value.trim(),
      responsavel: document.getElementById("responsavel").value.trim(),
      dataRegistro: document.getElementById("dataRegistro").value,
      validade: document.getElementById("validade").value,
      status: document.getElementById("status").value,
      descricao: document.getElementById("descricao").value.trim()
    };
  }

  function fillForm(item, categoryId) {
    Object.entries({
      tipoRegistro: categoryId,
      titulo: item.titulo,
      referencia: item.referencia,
      responsavel: item.responsavel,
      dataRegistro: item.dataRegistro,
      validade: item.validade,
      status: item.status,
      descricao: item.descricao
    }).forEach(([id, value]) => {
      document.getElementById(id).value = value || "";
    });
  }

  function resetFormState() {
    form.reset();
    editing = null;
    document.getElementById("tipoRegistro").disabled = false;
    form.querySelector("button[type='submit']").textContent = "Salvar registro";
  }

  function allRecords() {
    return Object.entries(categories).flatMap(([categoryId, category]) => (
      MetroApp.read(category.key, []).map((item) => ({ ...item, tipo: category.label, categoryId }))
    )).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }

  function actionButtons(item) {
    if (!canManage) return "";
    return `
      <td>
        <div class="row-actions">
          <button class="edit-button" type="button" data-action="edit" data-category="${MetroApp.escapeHtml(item.categoryId)}" data-id="${MetroApp.escapeHtml(item.id)}">Editar</button>
          <button class="delete-button" type="button" data-action="delete" data-category="${MetroApp.escapeHtml(item.categoryId)}" data-id="${MetroApp.escapeHtml(item.id)}">Excluir</button>
        </div>
      </td>
    `;
  }

  function renderCards() {
    cards.innerHTML = Object.values(categories).map((category) => {
      const count = MetroApp.read(category.key, []).length;
      return `
        <article class="card">
          <span>${category.label}</span>
          <strong>${count}</strong>
          <small>Registros no banco local</small>
        </article>
      `;
    }).join("");
  }

  function renderizar() {
    renderCards();
    const records = allRecords().slice(0, 20);
    tabela.innerHTML = records.length
      ? records.map((item) => {
        const status = item.status === "Bloqueado" || item.status === "Pendente" ? "status-alerta" : "status-ok";
        return `
          <tr>
            <td>${MetroApp.escapeHtml(item.tipo)}</td>
            <td>${MetroApp.escapeHtml(item.titulo || "-")}</td>
            <td>${MetroApp.escapeHtml(item.referencia || "-")}</td>
            <td>${MetroApp.formatDate(item.validade)}</td>
            <td><span class="status-pill ${status}">${MetroApp.escapeHtml(item.status || "-")}</span></td>
            ${actionButtons(item)}
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="${canManage ? 6 : 5}"><div class="empty-state">Nenhum registro metrologico complementar cadastrado.</div></td></tr>`;
  }

  renderizar();
}
