
const playerLifeEl = document.getElementById('player-life');
const cpuLifeEl = document.getElementById('cpu-life');
const handCardsEl = document.getElementById('hand-cards');
const playerFieldEl = document.getElementById('player-field');
const cpuFieldEl = document.getElementById('cpu-field');
const drawBtn = document.getElementById('draw-btn');
const endBtn = document.getElementById('end-btn');
const logEl = document.getElementById('log');

let playerLife = 8000;
let cpuLife = 8000;
let deck = [];
let hand = [];
let playerField = [];
let cpuField = [];
let turn = 'player';

// Map card data to real YGOPRODeck image IDs (images hosted at images.ygoprodeck.com)
// IDs chosen from public API examples; you can change IDs to other cards if desired.
const baseCards = [
  {id:43230671, name:'Blue-Eyes Variant', atk:3000, def:2500},
  {id:15480588, name:'Dark Magician Variant', atk:2500, def:2100},
  {id:27551, name:'Summoned Skull', atk:2500, def:1200},
  {id:53871273, name:'Kuriboh', atk:300, def:200},
  {id:67647362, name:'Plunder Patroll Captain', atk:2100, def:1400},
  {id:73082255, name:'Cool Card', atk:1800, def:1200},
  {id:99261403, name:'Mysterious', atk:1600, def:1000},
  {id:35686188, name:'Tragedy', atk:2000, def:1500},
  {id:66976526, name:'Example One', atk:1400, def:1200},
  {id:3618240, name:'Art Example', atk:1200, def:900}
];

function cardImageUrl(id){ return `https://images.ygoprodeck.com/images/cards/${id}.jpg`; }
function shuffle(array){ for(let i=array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]] } }

function log(txt){
  const p = document.createElement('div'); p.textContent = txt;
  logEl.prepend(p);
}

function buildDeck(){
  deck = [];
  // make multiple copies for deck
  for(let r=0;r<4;r++){
    baseCards.forEach(c=> deck.push({...c, uid:`${c.id}-${r}-${Math.random().toString(36).slice(2,7)}`}));
  }
  shuffle(deck);
}

function startGame(){
  buildDeck();
  hand = []; playerField=[]; cpuField=[];
  playerLife = 8000; cpuLife = 8000;
  drawBtn.disabled = false; endBtn.disabled = false;
  updateUI();
  for(let i=0;i<5;i++){ draw('player'); draw('cpu'); }
  cpuAutoPlay();
  log('Jogo iniciado. Seu turno.');
}

function updateUI(){
  playerLifeEl.textContent = playerLife;
  cpuLifeEl.textContent = cpuLife;
  renderHand();
  renderField();
}

function renderHand(){
  handCardsEl.innerHTML = '';
  hand.forEach(card=>{
    const el = document.createElement('div'); el.className='card';
    el.dataset.uid = card.uid;
    el.innerHTML = `<img src="${cardImageUrl(card.id)}" alt="${card.name}" onerror="this.style.opacity=0.15;this.style.filter='grayscale(60%)'">
      <div class="meta"><div class="name">${card.name}</div><div class="stats"><span>ATK ${card.atk}</span><span>DEF ${card.def}</span></div></div>`;
    el.onclick = ()=>playCard(card.uid);
    handCardsEl.appendChild(el);
  });
}

function renderField(){
  playerFieldEl.innerHTML=''; cpuFieldEl.innerHTML='';
  playerField.forEach(card=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${cardImageUrl(card.id)}" alt="${card.name}" onerror="this.style.opacity=0.15;this.style.filter='grayscale(60%)'">
      <div class="meta"><div class="name">${card.name}</div><div class="stats"><span>ATK ${card.atk}</span><span>UID ${card.uid.slice(-4)}</span></div></div>`;
    el.onclick = ()=>attackFrom(card.uid);
    playerFieldEl.appendChild(el);
  });
  cpuField.forEach(card=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${cardImageUrl(card.id)}" alt="${card.name}" onerror="this.style.opacity=0.15;this.style.filter='grayscale(60%)'">
      <div class="meta"><div class="name">${card.name}</div><div class="stats"><span>ATK ${card.atk}</span></div></div>`;
    cpuFieldEl.appendChild(el);
  });
}

function draw(who='player'){
  if(deck.length===0){ log('Deck vazio!'); return null; }
  const card = deck.pop();
  if(who==='player'){ hand.push(card); log('Você comprou ' + card.name); } else { cpuField.push(card); }
  updateUI();
  return card;
}

function playCard(uid){
  if(turn !== 'player'){ log('Não é seu turno.'); return; }
  const idx = hand.findIndex(c=>c.uid===uid);
  if(idx===-1) return;
  const card = hand.splice(idx,1)[0];
  playerField.push(card);
  log(`Você jogou ${card.name} para o campo.`);
  updateUI();
}

function attackFrom(uid){
  if(turn !== 'player'){ log('Só pode atacar no seu turno.'); return; }
  const attacker = playerField.find(c=>c.uid===uid);
  if(!attacker){ log('Carta inválida.'); return; }
  if(cpuField.length===0){
    cpuLife -= attacker.atk;
    animateHit(cpuFieldEl);
    log(`${attacker.name} atacou diretamente! CPU perde ${attacker.atk} LP.`);
    updateUI();
    checkEnd();
    return;
  }
  const defender = cpuField[0];
  if(attacker.atk > defender.atk){
    const diff = attacker.atk - defender.atk;
    cpuLife -= diff;
    cpuField.splice(0,1);
    log(`${attacker.name} destruiu ${defender.name}. CPU perde ${diff} LP.`);
  } else if(attacker.atk < defender.atk){
    const diff = defender.atk - attacker.atk;
    playerLife -= diff;
    const i = playerField.findIndex(c=>c.uid===uid);
    if(i>-1) playerField.splice(i,1);
    log(`${attacker.name} foi destruído por ${defender.name}. Você perde ${diff} LP.`);
  } else {
    log(`${attacker.name} e ${defender.name} se anularam.`);
    cpuField.splice(0,1);
    const i = playerField.findIndex(c=>c.uid===uid);
    if(i>-1) playerField.splice(i,1);
  }
  updateUI();
  checkEnd();
}

function cpuAutoPlay(){
  // play up to 2 monsters if has less than 2
  while(cpuField.length<2 && deck.length>0){
    const c = draw('cpu');
    log(`CPU jogou ${c.name}.`);
  }
}

function cpuTurn(){
  if(cpuField.length>0){
    // smarter: attack with strongest monster
    const attacker = cpuField.reduce((a,b)=> a.atk>b.atk? a:b);
    const atk = attacker.atk;
    // if player has monsters, attack weakest to trade
    if(playerField.length>0){
      const defender = playerField.reduce((a,b)=> a.atk<b.atk? a:b);
      if(attacker.atk > defender.atk){
        const diff = attacker.atk - defender.atk;
        cpuLife -= 0; // no damage to cpu
        const idx = playerField.findIndex(c=>c.uid===defender.uid);
        if(idx>-1) playerField.splice(idx,1);
        log(`CPU atacou ${defender.name} e destruiu. Você perde cartas no campo.`);
      } else {
        const idx = cpuField.findIndex(c=>c.uid===attacker.uid);
        if(idx>-1) cpuField.splice(idx,1);
        playerLife -= (defender.atk - attacker.atk);
        log(`CPU atacou e perdeu uma carta. Você perde ${(defender.atk - attacker.atk)} LP.`);
      }
    } else {
      playerLife -= atk;
      log(`CPU atacou diretamente com ${attacker.name}. Você perde ${atk} LP.`);
    }
  } else {
    log('CPU não tem monstros para atacar.');
  }
  updateUI();
  checkEnd();
  turn = 'player';
  log('Seu turno.');
}

endBtn.onclick = ()=>{
  if(turn !== 'player'){ log('Já é turno do CPU.'); return; }
  turn = 'cpu';
  log('Turno do CPU...');
  cpuAutoPlay();
  setTimeout(()=>{ cpuTurn(); }, 700);
};

drawBtn.onclick = ()=>{
  if(turn !== 'player'){ log('Não é seu turno.'); return; }
  draw('player');
}

function checkEnd(){
  if(playerLife<=0 || cpuLife<=0){
    const winner = playerLife<=0 ? 'CPU' : 'Jogador';
    log('Jogo encerrado. ' + winner + ' venceu!');
    drawBtn.disabled = true; endBtn.disabled = true;
  }
}

function animateHit(el){
  el.animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{duration:300});
}

startGame();
