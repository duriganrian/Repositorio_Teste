const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("calibracoes.html");

  const form = document.getElementById("calibracaoForm");
  const tabela = document.getElementById("tabelaCalibracoes");
  const listaInstrumentos = document.getElementById("instrumentosList");

  function carregarInstrumentos() {
    const instrumentos = MetroApp.read(MetroApp.keys.instruments, []);
    listaInstrumentos.innerHTML = instrumentos.map((item) => `
      <option value="${MetroApp.escapeHtml(item.codigo)} - ${MetroApp.escapeHtml(item.nome)}"></option>
    `).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    MetroApp.createRecord(
      MetroApp.keys.calibrations,
      {
        instrumento: document.getElementById("instrumento").value.trim(),
        empresa: document.getElementById("empresa").value.trim(),
        certificado: document.getElementById("certificado").value.trim(),
        data: document.getElementById("dataCalibracao").value,
        validade: document.getElementById("validade").value,
        resultado: document.getElementById("resultado").value,
        incerteza: document.getElementById("incerteza").value.trim(),
        arquivo: document.getElementById("arquivo").value.trim(),
        observacoes: document.getElementById("observacoes").value.trim()
      },
      "Calibracao registrada",
      "calibracao"
    );

    form.reset();
    renderizar();
  });

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
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="6"><div class="empty-state">Nenhuma calibracao registrada.</div></td></tr>`;
  }

  carregarInstrumentos();
  renderizar();
}
