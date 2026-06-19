const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("controle-dimensional.html");

  const form = document.getElementById("dimensionalForm");
  const tabela = document.getElementById("tabelaDimensional");
  const listaInstrumentos = document.getElementById("instrumentosList");

  function carregarInstrumentos() {
    const instrumentos = MetroApp.read(MetroApp.keys.instruments, []);
    listaInstrumentos.innerHTML = instrumentos.map((item) => `
      <option value="${MetroApp.escapeHtml(item.codigo)} - ${MetroApp.escapeHtml(item.nome)}"></option>
    `).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nominal = Number(document.getElementById("nominal").value);
    const minimo = Number(document.getElementById("minimo").value);
    const maximo = Number(document.getElementById("maximo").value);
    const medicao = Number(document.getElementById("medicao").value);
    const aprovado = medicao >= minimo && medicao <= maximo;

    MetroApp.createRecord(
      MetroApp.keys.dimensional,
      {
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
      },
      aprovado ? "Medicao aprovada" : "Medicao reprovada",
      "controle-dimensional"
    );

    form.reset();
    renderizar();
  });

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
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="6"><div class="empty-state">Nenhuma medicao registrada.</div></td></tr>`;
  }

  carregarInstrumentos();
  renderizar();
}
