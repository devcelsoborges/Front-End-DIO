(function(){
  const EMOJIS = ['🦁','🐼','🦊','🐙','🐵','🐸','🦄','🐯','🐝','🐨','🦋','🐶','🐱','🐻','🐔','🦖','🐢','🐬','🐳','🦅','🦉','🐞','🍓','🍍'];

  const boardEl = document.getElementById('board');
  const movesEl = document.getElementById('moves');
  const timerEl = document.getElementById('timer');
  const matchesEl = document.getElementById('matches');
  const totalPairsEl = document.getElementById('totalPairs');
  const restartBtn = document.getElementById('restartBtn');
  const difficultySelect = document.getElementById('difficulty');

  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let moves = 0;
  let matches = 0;
  let totalPairs = Number(difficultySelect.value);
  let timerInterval = null;
  let seconds = 0;

  function startTimer(){
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = formatTime(seconds);
    timerInterval = setInterval(()=>{
      seconds++;
      timerEl.textContent = formatTime(seconds);
    },1000);
  }
  function stopTimer(){ clearInterval(timerInterval); }

  function formatTime(s){
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
  }

  function shuffle(array){
    for(let i=array.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }

  function buildBoard(pairs){
    totalPairs = pairs;
    totalPairsEl.textContent = pairs;
    boardEl.dataset.pairs = pairs;

    const chosen = EMOJIS.slice().sort(()=>0.5-Math.random()).slice(0,pairs);
    const deck = shuffle([...chosen,...chosen]);

    boardEl.innerHTML='';
    deck.forEach(emoji=>{
      const card=document.createElement('button');
      card.className='card flipped'; // começa virada mostrando o emoji
      card.dataset.emoji=emoji;
      card.innerHTML=`
        <div class="face back">❓</div>
        <div class="face front">${emoji}</div>`;
      card.addEventListener('click',onCardClick);
      boardEl.appendChild(card);
    });

    firstCard=null; secondCard=null; lockBoard=false;
    moves=0; matches=0;
    movesEl.textContent=moves;
    matchesEl.textContent=matches;

    // Mostra todos os emojis por 5s antes de esconder
    setTimeout(()=>{
      document.querySelectorAll('.card').forEach(card=>{
        card.classList.remove('flipped');
      });
      startTimer(); // só começa o tempo depois
    }, 5000);
  }

  function onCardClick(e){
    const card=e.currentTarget;
    if(lockBoard) return;
    if(card===firstCard) return;
    if(card.classList.contains('matched')) return;

    card.classList.add('flipped');

    if(!firstCard){ firstCard=card; return; }

    secondCard=card;
    lockBoard=true;
    moves++;
    movesEl.textContent=moves;

    if(firstCard.dataset.emoji===secondCard.dataset.emoji){
      firstCard.classList.add('matched');
      secondCard.classList.add('matched');
      matches++;
      matchesEl.textContent=matches;
      resetTurn();

      if(matches===totalPairs){
        stopTimer();
        setTimeout(()=>alert(`Parabéns! Você venceu em ${moves} movimentos e tempo ${formatTime(seconds)}.`),300);
      }
    } else {
      setTimeout(()=>{
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetTurn();
      },700);
    }
  }

  function resetTurn(){ [firstCard,secondCard]=[null,null]; lockBoard=false; }

  restartBtn.addEventListener('click',()=>buildBoard(Number(difficultySelect.value)));
  difficultySelect.addEventListener('change',()=>buildBoard(Number(difficultySelect.value)));

  buildBoard(totalPairs);
})();
