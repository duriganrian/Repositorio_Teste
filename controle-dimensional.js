const form =
document.getElementById(
"dimensionalForm"
);

const tabela =
document.getElementById(
"tabelaDimensional"
);

let registros =
JSON.parse(
localStorage.getItem(
"controleDimensional"
)
) || [];

renderizar();

form.addEventListener(
"submit",
function(e){

e.preventDefault();

const nominal =
parseFloat(
document.getElementById(
"nominal"
).value
);

const minimo =
parseFloat(
document.getElementById(
"minimo"
).value
);

const maximo =
parseFloat(
document.getElementById(
"maximo"
).value
);

const medicao =
parseFloat(
document.getElementById(
"medicao"
).value
);

const aprovado =
medicao >= minimo &&
medicao <= maximo;

const registro = {

peca:
document.getElementById(
"peca"
).value,

caracteristica:
document.getElementById(
"caracteristica"
).value,

nominal,
medicao,

status:
aprovado
? "Aprovado"
: "Reprovado"

};

registros.push(registro);

localStorage.setItem(
"controleDimensional",
JSON.stringify(registros)
);

form.reset();

renderizar();

});

function renderizar(){

tabela.innerHTML = "";

registros.forEach(item=>{

const classe =
item.status === "Aprovado"
? "status-aprovado"
: "status-reprovado";

tabela.innerHTML += `

<tr>

<td>${item.peca}</td>

<td>${item.caracteristica}</td>

<td>${item.nominal}</td>

<td>${item.medicao}</td>

<td class="${classe}">
${item.status}
</td>

</tr>

`;

});

}