const tabela =
document.getElementById(
"tabelaAuditoria"
);

const logs =
JSON.parse(
localStorage.getItem(
"auditoria"
)
) || [];

logs.forEach(log=>{

tabela.innerHTML += `

<tr>

<td>${log.data}</td>
<td>${log.acao}</td>
<td>${log.usuario}</td>

</tr>

`;

});