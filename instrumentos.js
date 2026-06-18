const formulario =
document.getElementById("instrumentoForm");

const tabela =
document.getElementById("tabelaInstrumentos");

let instrumentos =
JSON.parse(
localStorage.getItem("instrumentos")
) || [];

renderizar();

formulario.addEventListener(
"submit",
function(e){

e.preventDefault();

const instrumento = {

codigo:
document.getElementById("codigo").value,

nome:
document.getElementById("nome").value,

tipo:
document.getElementById("tipo").value,

fabricante:
document.getElementById("fabricante").value,

modelo:
document.getElementById("modelo").value,

serie:
document.getElementById("serie").value,

ultimaCalibracao:
document.getElementById(
"ultimaCalibracao"
).value,

proximaCalibracao:
document.getElementById(
"proximaCalibracao"
).value

};

instrumentos.push(instrumento);

localStorage.setItem(
"instrumentos",
JSON.stringify(instrumentos)
);

formulario.reset();

renderizar();

});

function renderizar(){

tabela.innerHTML = "";

instrumentos.forEach(item=>{

tabela.innerHTML += `

<tr>

<td>${item.codigo}</td>

<td>${item.nome}</td>

<td>${item.tipo}</td>

<td>${item.serie}</td>

<td>${item.proximaCalibracao}</td>

</tr>

`;

});

}