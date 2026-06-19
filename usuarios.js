const session = MetroApp.requireAuth(["desenvolvedor"]);

if (session) {
  MetroApp.renderShell("usuarios.html");

  const form = document.getElementById("usuarioForm");
  const tabela = document.getElementById("tabelaUsuarios");
  const perfilSelect = document.getElementById("perfil");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const users = MetroApp.getUsers();
    const email = document.getElementById("email").value.trim().toLowerCase();
    if (users.some((user) => user.email.toLowerCase() === email)) {
      alert("Ja existe usuario cadastrado com este email.");
      return;
    }

    const perfil = document.getElementById("perfil").value;
    if (perfil === "desenvolvedor" && session.perfil !== "desenvolvedor") {
      alert("Somente o desenvolvedor pode criar outro perfil de desenvolvedor.");
      return;
    }

    const usuario = {
      id: MetroApp.uid("user"),
      nome: document.getElementById("nome").value.trim(),
      email,
      senha: document.getElementById("senha").value,
      perfil,
      cargo: document.getElementById("cargo").value.trim(),
      setor: document.getElementById("setor").value.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
      criadoPorEmail: session.email
    };

    users.unshift(usuario);
    MetroApp.saveUsers(users);
    MetroApp.audit("Usuario cadastrado", usuario.nome, "usuario", usuario.email);
    MetroApp.createUserRemote(usuario).catch(() => {});

    form.reset();
    document.getElementById("setor").value = "Metrologia";
    renderizar();
  });

  function renderizar() {
    const users = MetroApp.getUsers();
    tabela.innerHTML = users.length
      ? users.map((item) => `
        <tr>
          <td>${MetroApp.escapeHtml(item.nome)}</td>
          <td>${MetroApp.escapeHtml(item.email)}</td>
          <td>${MetroApp.labelRole(item.perfil)}</td>
          <td>${MetroApp.escapeHtml(item.cargo || "-")}</td>
          <td><span class="status-pill ${item.ativo === false ? "status-danger" : "status-ok"}">${item.ativo === false ? "Inativo" : "Ativo"}</span></td>
        </tr>
      `).join("")
      : `<tr><td colspan="5"><div class="empty-state">Nenhum usuario cadastrado.</div></td></tr>`;
  }

  renderizar();
}
