const session = MetroApp.requireAuth();

if (session) {
  MetroApp.renderShell("relatorios.html");

  const counts = MetroApp.collectionCounts();
  const calibrations = MetroApp.read(MetroApp.keys.calibrations, []);
  const nonconformities = MetroApp.read(MetroApp.keys.nonconformities, []);
  const planos = MetroApp.read(MetroApp.keys.inspectionPlans, []);
  const audit = MetroApp.read(MetroApp.keys.audit, []);
  const vencimentos = calibrations
    .map((item) => ({ ...item, statusInfo: MetroApp.calibrationStatus(item.validade) }))
    .filter((item) => item.statusInfo.className !== "status-ok");

  const cards = [
    ["Instrumentos", counts.instruments, "Total rastreado"],
    ["Calibracoes", counts.calibrations, "Certificados registrados"],
    ["Vencimentos", vencimentos.length, "Vencidas ou proximas"],
    ["Planos", counts.plans, "Planos de inspecao"],
    ["Nao conformidades", counts.nonconformities, "Ocorrencias cadastradas"],
    ["Usuarios", counts.users, "Pessoas com acesso"]
  ];

  document.getElementById("relatorioCards").innerHTML = cards.map(([label, value, hint]) => `
    <article class="card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </article>
  `).join("");

  document.getElementById("relatorioCalibracoes").innerHTML = vencimentos.length
    ? vencimentos.slice(0, 12).map((item) => `
      <tr>
        <td>${MetroApp.escapeHtml(item.instrumento || "-")}</td>
        <td>${MetroApp.formatDate(item.validade)}</td>
        <td><span class="status-pill ${item.statusInfo.className}">${item.statusInfo.label}</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="3"><div class="empty-state">Nenhuma calibracao vencida ou proxima.</div></td></tr>`;

  const statusCounts = nonconformities.reduce((acc, item) => {
    const status = item.status || "Sem status";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const maxStatus = Math.max(1, ...Object.values(statusCounts));
  document.getElementById("relatorioNaoConformidades").innerHTML = Object.keys(statusCounts).length
    ? Object.entries(statusCounts).map(([status, value]) => `
      <div class="report-bar">
        <header><span>${MetroApp.escapeHtml(status)}</span><strong>${value}</strong></header>
        <div class="report-track"><span class="report-fill" style="width: ${(value / maxStatus) * 100}%"></span></div>
      </div>
    `).join("")
    : `<div class="empty-state">Nenhuma nao conformidade cadastrada.</div>`;

  document.getElementById("relatorioPlanos").innerHTML = planos.length
    ? planos.slice(0, 12).map((item) => `
      <tr>
        <td>${MetroApp.escapeHtml(item.codigo || "-")}</td>
        <td>${MetroApp.escapeHtml(item.peca || item.titulo || "-")}</td>
        <td>${MetroApp.escapeHtml(item.status || "-")}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3"><div class="empty-state">Nenhum plano de inspecao cadastrado.</div></td></tr>`;

  document.getElementById("relatorioAuditoria").innerHTML = audit.length
    ? audit.slice(0, 12).map((log) => `
      <tr>
        <td>${MetroApp.formatDateTime(log.data)}</td>
        <td>${MetroApp.escapeHtml(log.acao)}</td>
        <td>${MetroApp.escapeHtml(log.usuario)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3"><div class="empty-state">Ainda nao ha atividades registradas.</div></td></tr>`;
}
