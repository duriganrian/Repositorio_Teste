const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("dashboard.html");

  const counts = MetroApp.collectionCounts();
  const cards = [
    ["Instrumentos", counts.instruments, "Itens cadastrados e rastreados"],
    ["Calibracoes", counts.calibrations, "Historico e validade"],
    ["Controle dimensional", counts.dimensional, "Medicoes registradas"],
    ["Usuarios", counts.users, "Pessoas com acesso"],
    ["Nao conformidades", counts.nonconformities, "Ocorrencias abertas/fechadas"],
    ["Auditoria", counts.audit, "Acoes gravadas"]
  ];

  document.getElementById("dashboardCards").innerHTML = cards.map(([label, value, hint]) => `
    <article class="card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </article>
  `).join("");

  const calibrations = MetroApp.read(MetroApp.keys.calibrations, [])
    .map((item) => ({ ...item, status: MetroApp.calibrationStatus(item.validade) }))
    .filter((item) => item.status.className !== "status-ok")
    .slice(0, 8);

  document.getElementById("calibrationAlerts").innerHTML = calibrations.length
    ? calibrations.map((item) => `
      <tr>
        <td>${MetroApp.escapeHtml(item.instrumento)}</td>
        <td>${MetroApp.formatDate(item.validade)}</td>
        <td><span class="status-pill ${item.status.className}">${item.status.label}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="3"><div class="empty-state">Nenhuma calibracao vencida ou proxima.</div></td></tr>`;

  const logs = MetroApp.read(MetroApp.keys.audit, []).slice(0, 8);
  document.getElementById("recentActivity").innerHTML = logs.length
    ? logs.map((log) => `
      <tr>
        <td>${MetroApp.formatDateTime(log.data)}</td>
        <td>${MetroApp.escapeHtml(log.acao)}</td>
        <td>${MetroApp.escapeHtml(log.usuario)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3"><div class="empty-state">Ainda nao ha atividades registradas.</div></td></tr>`;
}
