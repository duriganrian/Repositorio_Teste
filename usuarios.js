const form =
document.getElementById(
"usuarioForm"
);

const tabela =
document.getElementById(
"tabelaUsuarios"
);

let usuarios =
JSON.parse(
localStorage.getItem(
"usuarios"
)
) || [];

renderizar();

form.addEventListener(
"submit",
function(e){

e.preventDefault();

const usuario = {

nome:
document.getElementById(
"nome"
).value,

email:
document.getElementById(
"email"
).value,

perfil:
document.getElementById(
"perfil"
).value

};

usuarios.push(usuario);

localStorage.setItem(
"usuarios",
JSON.stringify(usuarios)
);

registrarAuditoria(
"Cadastro de usuário",
usuario.nome
);

form.reset();

renderizar();

});

function renderizar(){

tabela.innerHTML = "";

usuarios.forEach(item=>{

tabela.innerHTML += `

<tr>

<td>${item.nome}</td>

<td>${item.email}</td>

<td>${item.perfil}</td>

</tr>

`;

});

}

function registrarAuditoria(
acao,
usuario
){

let logs =
JSON.parse(
localStorage.getItem(
"auditoria"
)
) || [];

logs.push({

data:
new Date()
.toLocaleString(),

acao,
usuario

});

localStorage.setItem(
"auditoria",
JSON.stringify(logs)
);

}