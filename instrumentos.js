const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("instrumentos.html");

  const form = document.getElementById("instrumentoForm");
  const tabela = document.getElementById("tabelaInstrumentos");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    MetroApp.createRecord(
      MetroApp.keys.instruments,
      {
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
      },
      "Instrumento cadastrado",
      "instrumento"
    );

    form.reset();
    renderizar();
  });

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
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="6"><div class="empty-state">Nenhum instrumento cadastrado.</div></td></tr>`;
  }

  renderizar();
}
