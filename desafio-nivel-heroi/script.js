const nomeInput = document.getElementById('nome');
const xpInput = document.getElementById('xp');
const mensagemEl = document.getElementById('mensagem');
const listaEl = document.getElementById('lista');
const heroes = [];


function classificarPorXP(xp) {
xp = Number(xp) || 0;
if (xp < 1000) return 'Ferro';
else if (xp >= 1001 && xp <= 2000) return 'Bronze';
else if (xp >= 2001 && xp <= 5000) return 'Prata';
else if (xp >= 5001 && xp <= 7000) return 'Ouro';
else if (xp >= 7001 && xp <= 8000) return 'Platina';
else if (xp >= 8001 && xp <= 9000) return 'Ascendente';
else if (xp >= 9001 && xp <= 10000) return 'Imortal';
else if (xp >= 10001) return 'Radiante';
else return 'Ferro';
}


function exibirMensagem(nome, nivel) {
mensagemEl.style.display = 'block';
mensagemEl.textContent = `O Herói de nome ${nome} está no nível de ${nivel}`;
}


document.getElementById('adicionarBtn').addEventListener('click', () => {
const nome = nomeInput.value.trim();
const xp = Number(xpInput.value);
if (!nome) return alert('Informe o nome do herói.');
if (isNaN(xp) || xp < 0) return alert('Informe um XP válido.');
heroes.push({ nome, xp });
renderLista();
nomeInput.value = '';
xpInput.value = '';
});


document.getElementById('limparBtn').addEventListener('click', () => {
heroes.length = 0;
renderLista();
mensagemEl.style.display = 'none';
});


document.getElementById('classificarBtn').addEventListener('click', () => {
const nome = nomeInput.value.trim();
const xp = Number(xpInput.value);
if (!nome) return alert('Informe o nome do herói.');
if (isNaN(xp) || xp < 0) return alert('Informe um XP válido.');
const nivel = classificarPorXP(xp);
exibirMensagem(nome, nivel);
});


document.getElementById('classificarTodosBtn').addEventListener('click', () => {
if (heroes.length === 0) return alert('A lista está vazia.');
for (let i = 0; i < heroes.length; i++) {
const h = heroes[i];
console.log(`O Herói de nome ${h.nome} está no nível de ${classificarPorXP(h.xp)}`);
}
renderLista();
exibirMensagem(heroes[0].nome, classificarPorXP(heroes[0].xp));
});


function renderLista() {
listaEl.innerHTML = '';
for (const heroi of heroes) {
const nivel = classificarPorXP(heroi.xp);
const div = document.createElement('div');
div.className = 'hero';
div.innerHTML = `
<div class="meta">
<div style="min-width:140px"><strong>${heroi.nome}</strong><div style="font-size:12px;color:var(--muted)">XP: ${heroi.xp}</div></div>
<div class="badge">${nivel}</div>
</div>
`;
listaEl.appendChild(div);
}
if (heroes.length === 0) {
listaEl.innerHTML = '<div style="color:var(--muted)">Nenhum herói na lista.</div>';
}
}