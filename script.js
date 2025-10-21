(function(){
  // Angles & values
  const ANGLES=[0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];
  const VALS={
    0:{sin:'0',cos:'1',tan:'0'},30:{sin:'1/2',cos:'√3/2',tan:'1/√3'},45:{sin:'√2/2',cos:'√2/2',tan:'1'},
    60:{sin:'√3/2',cos:'1/2',tan:'√3'},90:{sin:'1',cos:'0',tan:'—'},120:{sin:'√3/2',cos:'-1/2',tan:'-√3'},
    135:{sin:'√2/2',cos:'-√2/2',tan:'-1'},150:{sin:'1/2',cos:'-√3/2',tan:'-1/√3'},180:{sin:'0',cos:'-1',tan:'0'},
    210:{sin:'-1/2',cos:'-√3/2',tan:'1/√3'},225:{sin:'-√2/2',cos:'-√2/2',tan:'1'},240:{sin:'-√3/2',cos:'-1/2',tan:'√3'},
    270:{sin:'-1',cos:'0',tan:'—'},300:{sin:'-√3/2',cos:'1/2',tan:'-√3'},315:{sin:'-√2/2',cos:'√2/2',tan:'-1'},330:{sin:'-1/2',cos:'√3/2',tan:'-1/√3'}
  };

  // DOM nodes
  const startBtn = document.getElementById('startBtn');
  const hintBtn = document.getElementById('hintBtn');
  const skipBtn = document.getElementById('skipBtn');
  const questionText = document.getElementById('questionText');
  const answers = document.getElementById('answers');
  const angleLine = document.getElementById('angleLine');
  const point = document.getElementById('point');
  const angleLabel = document.getElementById('angleLabel');
  const scoreEl = document.getElementById('score');
  const remainingEl = document.getElementById('remaining');
  const correctCount = document.getElementById('correctCount');
  const wrongCount = document.getElementById('wrongCount');
  const accum = document.getElementById('accum');
  const qCountSelect = document.getElementById('qCount');
  const typeSelect = document.getElementById('typeSelect');
  const applySettings = document.getElementById('applySettings');

  const quads = {
    1: document.querySelector('.q1'),
    2: document.querySelector('.q2'),
    3: document.querySelector('.q3'),
    4: document.querySelector('.q4')
  };

  // state
  let totalQuestions = parseInt(qCountSelect.value);
  let questionType = typeSelect.value; // sin / cos / tan / mix
  let questionPool = [];
  let currentQuestion = null;
  let score=0, correct=0, wrong=0, accumScore=0;
  let inGame=false;

  function degToRad(d){return d*Math.PI/180;}
  function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function getQuadrant(angle){
    const a = ((angle%360)+360)%360;
    if(a>0 && a<90) return 1;
    if(a>90 && a<180) return 2;
    if(a>180 && a<270) return 3;
    if(a>270 && a<360) return 4;
    return 0; // axis
  }

  function highlightQuadrant(q){
    [1,2,3,4].forEach(n=>{ quads[n].style.opacity = (n===q ? '0.4' : '0.22'); });
  }

  function placeAngle(theta){
    const wrap = document.querySelector('.circle-wrap');
    const rect = wrap.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2, r = rect.width/2 - 34;

    // rotate line so 90deg points up: use -theta
    angleLine.style.transform = `rotate(${-theta}deg)`;

    // endpoint (DOM coords: y increases downward)
    const rad = degToRad(theta);
    const x = cx + r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);
    point.style.left = x + 'px';
    point.style.top = y + 'px';

    // label placed slightly beyond tip
    const labelOffset = 28;
    const lx = cx + (r + labelOffset) * Math.cos(rad);
    const ly = cy - (r + labelOffset) * Math.sin(rad);
    angleLabel.style.left = lx + 'px';
    angleLabel.style.top = ly + 'px';
    angleLabel.textContent = `${theta}°`;

    // quadrant color + highlight
    const q = getQuadrant(theta);
    const colors = {1:'var(--tosca)',2:'var(--kunyit)',3:'var(--orange)',4:'var(--sky)'};
    if(q>0) point.style.background = colors[q];
    else point.style.background = 'linear-gradient(135deg,#fff,var(--tosca))';
    highlightQuadrant(q);
  }

  function generatePool(){
    const pool=[];
    for(let i=0;i<totalQuestions;i++){
      const angle = randomFrom(ANGLES);
      let fn = questionType;
      if(questionType==='mix') fn = randomFrom(['sin','cos','tan']);
      pool.push({angle,fn});
    }
    return pool;
  }

  function getCorrectStr(angle, fn){ return VALS[angle][fn] || '—'; }

  function makeChoices(angle, fn){
    const correct = getCorrectStr(angle,fn);
    const s = new Set([correct]);
    while(s.size<3){
      const a = randomFrom(ANGLES);
      const v = VALS[a][fn];
      if(v) s.add(v);
    }
    return shuffle(Array.from(s));
  }

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

  function showQuestion(){
    if(questionPool.length===0){ endGame(); return; }
    currentQuestion = questionPool.shift();
    placeAngle(currentQuestion.angle);
    questionText.textContent = `${currentQuestion.fn.toUpperCase()} ${currentQuestion.angle}° = ?`;
    const choices = makeChoices(currentQuestion.angle, currentQuestion.fn);
    answers.innerHTML = '';
    choices.forEach(ch=>{
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = ch;
      b.dataset.val = ch;
      b.addEventListener('click', ()=> answerSelected(b));
      answers.appendChild(b);
    });
    remainingEl.textContent = questionPool.length + 1;
  }

  function answerSelected(btn){
    if(!inGame) return;
    const selected = btn.dataset.val;
    const correctStr = getCorrectStr(currentQuestion.angle, currentQuestion.fn);
    Array.from(answers.children).forEach(x=>x.disabled=true);

    if(selected === correctStr){
      btn.classList.add('correct');
      score += 100; accumScore += 100; correct++;
    } else {
      btn.classList.add('wrong');
      Array.from(answers.children).forEach(x=>{ if(x.dataset.val === correctStr) x.classList.add('correct'); });
      score = Math.max(0, score-25); wrong++;
      showHint(`Jawaban benar: <strong>${correctStr}</strong><br>Ingat sudut istimewa & tanda kuadran.`);
    }

    scoreEl.textContent = score;
    correctCount.textContent = correct;
    wrongCount.textContent = wrong;
    accum.textContent = accumScore;

    setTimeout(()=>{ Array.from(answers.children).forEach(x=>x.disabled=false); showQuestion(); }, 900);
  }

  function startGame(){
    totalQuestions = parseInt(qCountSelect.value);
    questionType = typeSelect.value;
    questionPool = generatePool();
    score = 0; correct = 0; wrong = 0; accumScore = 0; inGame = true;
    scoreEl.textContent = 0; correctCount.textContent = 0; wrongCount.textContent = 0; accum.textContent = 0;
    showQuestion();
  }

  function endGame(){
    inGame = false;
    questionText.textContent = 'Permainan selesai!';
    answers.innerHTML = '';
    launchConfetti(); playCheer(); showCelebration();
  }

  // hint box
  function showHint(html){
    const root = document.getElementById('hintRoot');
    const box = document.createElement('div');
    box.className = 'hintBox';
    box.innerHTML = html;
    root.appendChild(box);
    setTimeout(()=>box.remove(), 4800);
  }

  // confetti
  function launchConfetti(){
    const colors = ['#06b6b4','#2dd4bf','#facc15','#fb923c','#ef4444','#7c3aed'];
    for(let i=0;i<160;i++){
      const el = document.createElement('div');
      el.className = 'confetti';
      const size = 6 + Math.random()*12;
      el.style.width = size + 'px';
      el.style.height = (size*0.6) + 'px';
      el.style.left = (Math.random()*100) + 'vw';
      el.style.top = '-' + (Math.random()*20) + 'vh';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.opacity = 0.95;
      el.style.transform = 'rotate(' + (Math.random()*360) + 'deg)';
      el.style.borderRadius = '2px';
      el.style.animation = `confettiFall ${2 + Math.random()*3}s cubic-bezier(.2,.7,.2,1) ${Math.random()*0.8}s forwards`;
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 7000);
    }
  }

  // audio cheer
  let cheerAudio = null;
  function playCheer(){
    try{
      if(!cheerAudio){
        cheerAudio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_8d5a8f8f45.mp3?filename=short-cheer-2-8261.mp3');
        cheerAudio.volume = 0.75;
      }
      cheerAudio.currentTime = 0; cheerAudio.play();
    }catch(e){ console.warn('Audio cheer gagal', e); }
  }

  function showCelebration(){
    const card = document.querySelector('.card');
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.innerHTML = `<div style="text-align:center"><h2>🎉 Selamat! Kamu TrigonoMaster! 🎉</h2><div style="margin-top:12px"><button id="playAgain" class="btn primary">Main Lagi</button></div></div>`;
    card.appendChild(el);
    document.getElementById('playAgain').addEventListener('click', ()=>{ el.remove(); startGame(); });
    setTimeout(()=>{ if(el && el.parentNode) el.remove(); }, 7000);
  }

  // controls
  startBtn.addEventListener('click', ()=> startGame());
  hintBtn.addEventListener('click', ()=> showHint('<strong>💡 Petunjuk:</strong><br>Gunakan unit circle: perhatikan kuadran untuk menentukan tanda sin/cos.'));
  skipBtn.addEventListener('click', ()=>{ if(!inGame) return; score = Math.max(0, score-10); wrong++; wrongCount.textContent = wrong; showQuestion(); });
  applySettings.addEventListener('click', ()=>{ totalQuestions = parseInt(qCountSelect.value); questionType = typeSelect.value; showHint('Pengaturan diterapkan. Tekan Mulai untuk memulai.'); });

  // keyboard 1-3 quick keys
  document.addEventListener('keydown', (e)=>{ if(!inGame) return; if(['1','2','3'].includes(e.key)){ const idx = parseInt(e.key)-1; const btn = answers.children[idx]; if(btn) btn.click(); } });

  // initial visual
  placeAngle(0);
  // expose for debug
  window.TQ = { start: startGame, state: ()=>({score,correct,wrong}) };

})();