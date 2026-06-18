const form =
document.getElementById(
"calibracaoForm"
);

const tabela =
document.getElementById(
"tabelaCalibracoes"
);

let calibracoes =
JSON.parse(
localStorage.getItem(
"calibracoes"
)
) || [];

renderizar();

form.addEventListener(
"submit",
function(e){

e.preventDefault();

const registro = {

instrumento:
document.getElementById(
"instrumento"
).value,

empresa:
document.getElementById(
"empresa"
).value,

certificado:
document.getElementById(
"certificado"
).value,

data:
document.getElementById(
"dataCalibracao"
).value,

validade:
document.getElementById(
"validade"
).value

};

calibracoes.push(registro);

localStorage.setItem(
"calibracoes",
JSON.stringify(calibracoes)
);

form.reset();

renderizar();

});

function renderizar(){

tabela.innerHTML = "";

calibracoes.forEach(item=>{

const hoje =
new Date();

const validade =
new Date(item.validade);

const diferenca =
(validade-hoje)
/(1000*60*60*24);

let status = "";
let classe = "";

if(diferenca < 0){

status = "Vencido";
classe = "status-vencido";

}
else if(diferenca <= 30){

status = "Próximo";

classe = "status-alerta";

}
else{

status = "Válido";

classe = "status-ok";

}

tabela.innerHTML += `

<tr>

<td>${item.instrumento}</td>

<td>${item.empresa}</td>

<td>${item.certificado}</td>

<td>${item.validade}</td>

<td class="${classe}">
${status}
</td>

</tr>

`;

});

}