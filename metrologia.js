const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("metrologia.html");

  const form = document.getElementById("metrologiaForm");
  const cards = document.getElementById("metrologyCards");
  const tabela = document.getElementById("tabelaMetrologia");

  const categories = {
    standards: { label: "Padroes", key: MetroApp.keys.standards, entity: "padrao" },
    inspectionPlans: { label: "Planos de inspecao", key: MetroApp.keys.inspectionPlans, entity: "plano-inspecao" },
    msa: { label: "MSA / R&R", key: MetroApp.keys.msa, entity: "msa" },
    nonconformities: { label: "Nao conformidades", key: MetroApp.keys.nonconformities, entity: "nao-conformidade" },
    documents: { label: "Documentos", key: MetroApp.keys.documents, entity: "documento" },
    suppliers: { label: "Fornecedores", key: MetroApp.keys.suppliers, entity: "fornecedor" }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = categories[document.getElementById("tipoRegistro").value];

    MetroApp.createRecord(
      category.key,
      {
        tipo: category.label,
        titulo: document.getElementById("titulo").value.trim(),
        referencia: document.getElementById("referencia").value.trim(),
        responsavel: document.getElementById("responsavel").value.trim(),
        dataRegistro: document.getElementById("dataRegistro").value,
        validade: document.getElementById("validade").value,
        status: document.getElementById("status").value,
        descricao: document.getElementById("descricao").value.trim()
      },
      `${category.label} registrado`,
      category.entity
    );

    form.reset();
    renderizar();
  });

  function allRecords() {
    return Object.values(categories).flatMap((category) => (
      MetroApp.read(category.key, []).map((item) => ({ ...item, tipo: category.label }))
    )).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
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
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="5"><div class="empty-state">Nenhum registro metrologico complementar cadastrado.</div></td></tr>`;
  }

  renderizar();
}
