/* =========================
   CONFIG
   ========================= */
const CONFIG = {
  strands: {
    themeTitle: "Our Love Story",
    cols: 6,
    grid: [
      "L","O","V","E","S","U",
      "T","O","G","E","T","H",
      "E","R","F","O","R","E",
      "V","E","R","M","O","R",
      "E","H","E","A","R","T",
      "S","M","I","L","E","S"
    ],
    themeWords: ["LOVE","HEART","SMILES","MORE"],
    strandsWord: "TOGETHERFOREVER"
  },

  wordleSolution: "HEART",
  connectionsWords: [
    "JAZZ","MARTINI","CANDLE","DANCE",
    "MONTREAL","OLDPORT","PLATEAU","MILEEND",
    "KIND","FUNNY","SMART","WARM",
    "ALWAYS","TOGETHER","FOREVER","US"
  ],

  finalRevealHtml: `
    <h3 style="margin:0 0 8px;">❤️ Surprise</h3>
    <p style="margin:0;">Meet me at <strong>8:00</strong> — I planned something special.</p>
  `,

  mini: {
    size: 5,
    blocks: new Set([0, 4, 24]),
    solution: [
      "", "T","W","O","",
      "W","O","R","D","S",
      "E","B","O","O","K",
      "R","E","T","R","Y",
      "E","Y","E","S",""
    ]
  }
};

/* =========================
   SAFETY: helper selectors
   ========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* =========================
   VIEW ROUTER (with transition + header hiding)
   ========================= */
const views = [
  "home",
  "mini-intro",
  "mini",
  "wordle-intro",
  "wordle",
  "connections-intro",
  "connections",
  "strands-intro",
  "strands",
  "reveal"
];

let activeView = "home";

const topHeader = $("#topHeader");
const mainRoot = $("#mainRoot");

const immersiveViews = new Set([
  "mini-intro","mini",
  "wordle-intro","wordle",
  "connections-intro","connections",
  "strands-intro","strands"
]);

function setActiveNav(name){
  $$(".bottom-nav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === name);
  });
}

function applyImmersiveMode(viewName){
  const isImm = immersiveViews.has(viewName);
  if(topHeader) topHeader.classList.toggle("is-hidden", isImm);
  if(mainRoot) mainRoot.classList.toggle("is-immersive", isImm);
}

function showView(name){
  if(!views.includes(name)) return;
  if(name === activeView) return;

  const current = document.getElementById(`view-${activeView}`);
  const next = document.getElementById(`view-${name}`);
  if(!current || !next) return;

  current.classList.remove("is-entered");

  setTimeout(()=>{
    current.classList.remove("is-active");
    next.classList.add("is-active");
    void next.offsetWidth;
    next.classList.add("is-entered");

    activeView = name;

    const navName =
      (name === "strands") ? "strands-intro" :
      (name === "connections") ? "connections-intro" :
      (name === "wordle") ? "wordle-intro" :
      (name === "mini") ? "mini-intro" :
      name;

    setActiveNav(navName);
    applyImmersiveMode(name);
    window.scrollTo({ top: 0 });

    // focus hidden inputs for mobile typing
    if(name === "wordle") {
      const hi = $("#wordleHiddenInput");
      if(hi) hi.focus({ preventScroll: true });
    }
    if(name === "mini") {
      const mi = $("#miniHiddenInput");
      if(mi) mi.focus({ preventScroll: true });
      miniStartTimer();
    } else {
      miniStopTimer();
    }
  }, 140);
}

// init view
const homeView = document.getElementById("view-home");
if(homeView){
  homeView.classList.add("is-active");
  requestAnimationFrame(()=> homeView.classList.add("is-entered"));
}
setActiveNav("home");
applyImmersiveMode("home");

/* =========================
   CLICK DELEGATION (fixes “buttons not clickable”)
   ========================= */
document.addEventListener("click", (e)=>{
  const navBtn = e.target.closest("[data-view]");
  if(navBtn){
    showView(navBtn.dataset.view);
    return;
  }

  const go = e.target.closest("[data-goto]");
  if(go){
    showView(go.dataset.goto);
    return;
  }

  // play buttons
  if(e.target.closest("#miniPlay")){
    miniReset();
    showView("mini");
    return;
  }
  if(e.target.closest("#wordlePlay")){
    resetWordle();
    showView("wordle");
    return;
  }
  if(e.target.closest("#connectionsPlay")){
    showView("connections");
    return;
  }
  if(e.target.closest("#strandsPlay")){
    showView("strands");
    return;
  }
});

/* =========================
   MINI — Intro -> Game
   ========================= */
const MP = CONFIG.mini;
const miniCrossword = $("#miniCrossword");
const miniTimerEl = $("#miniTimer");
const miniHiddenInput = $("#miniHiddenInput");
const miniClueText = $("#miniClueText");

const miniPrevClue = $("#miniPrevClue");
const miniNextClue = $("#miniNextClue");

let miniSelected = 1;
let miniLetters = new Array(MP.size * MP.size).fill("");
let miniTimer = 0;
let miniTimerId = null;

const MINI_CLUES = [
  "Jotted (down)",
  "Style of cuisine with bulgogi beef, for short",
  "___ two (etc.)",
  "Opposite of stop"
];
let miniClueIndex = 0;

function formatTime(s){
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}
function miniStartTimer(){
  miniStopTimer();
  miniTimer = 0;
  if(miniTimerEl) miniTimerEl.textContent = formatTime(miniTimer);
  miniTimerId = setInterval(()=>{
    miniTimer++;
    if(miniTimerEl) miniTimerEl.textContent = formatTime(miniTimer);
  }, 1000);
}
function miniStopTimer(){
  if(miniTimerId){
    clearInterval(miniTimerId);
    miniTimerId = null;
  }
}

function idxToRC(idx){ return { r: Math.floor(idx / MP.size), c: idx % MP.size }; }
function isBlock(idx){ return MP.blocks.has(idx); }

function acrossWordIndices(idx){
  if(isBlock(idx)) return [];
  const {r,c} = idxToRC(idx);

  let left = c;
  while(left-1 >= 0 && !isBlock(r*MP.size + (left-1))) left--;
  let right = c;
  while(right+1 < MP.size && !isBlock(r*MP.size + (right+1))) right++;

  const out = [];
  for(let x=left;x<=right;x++) out.push(r*MP.size + x);
  return out;
}

function computeNumbers(){
  const nums = new Array(MP.size*MP.size).fill("");
  let n = 1;

  function isStartAcross(i){
    if(isBlock(i)) return false;
    const {r,c} = idxToRC(i);
    const leftBlocked = (c === 0) || isBlock(r*MP.size + (c-1));
    const rightOpen = (c+1 < MP.size) && !isBlock(r*MP.size + (c+1));
    return leftBlocked && rightOpen;
  }

  function isStartDown(i){
    if(isBlock(i)) return false;
    const {r,c} = idxToRC(i);
    const upBlocked = (r === 0) || isBlock((r-1)*MP.size + c);
    const downOpen = (r+1 < MP.size) && !isBlock((r+1)*MP.size + c);
    return upBlocked && downOpen;
  }

  for(let i=0;i<nums.length;i++){
    if(isStartAcross(i) || isStartDown(i)){
      nums[i] = String(n++);
    }
  }
  return nums;
}
const MINI_NUMS = computeNumbers();

function pickFirstCell(){
  for(let i=0;i<MP.size*MP.size;i++){
    if(!isBlock(i)) return i;
  }
  return 0;
}

function moveToNextCell(){
  const {r,c} = idxToRC(miniSelected);
  for(let x=c+1;x<MP.size;x++){
    const idx = r*MP.size + x;
    if(!isBlock(idx)) { miniSelected = idx; return; }
  }
  for(let i=miniSelected+1;i<MP.size*MP.size;i++){
    if(!isBlock(i)) { miniSelected = i; return; }
  }
}

function renderMini(){
  if(!miniCrossword) return;

  miniCrossword.innerHTML = "";
  if(miniClueText) miniClueText.textContent = MINI_CLUES[miniClueIndex % MINI_CLUES.length];

  const word = new Set(acrossWordIndices(miniSelected));

  for(let i=0;i<MP.size*MP.size;i++){
    const cell = document.createElement("div");
    cell.className = "mini-cell";

    if(isBlock(i)){
      cell.classList.add("block");
      miniCrossword.appendChild(cell);
      continue;
    }

    if(word.has(i)) cell.classList.add("word");
    if(i === miniSelected) cell.classList.add("active");

    const num = MINI_NUMS[i];
    if(num){
      const n = document.createElement("div");
      n.className = "mini-num";
      n.textContent = num;
      cell.appendChild(n);
    }

    const letter = document.createElement("div");
    letter.className = "mini-letter";
    letter.textContent = (miniLetters[i] || "").toUpperCase();
    cell.appendChild(letter);

    cell.addEventListener("click", ()=>{
      miniSelected = i;
      renderMini();
      if(miniHiddenInput) miniHiddenInput.focus({ preventScroll: true });
    });

    miniCrossword.appendChild(cell);
  }
}

function miniReset(){
  miniLetters = new Array(MP.size*MP.size).fill("");
  miniSelected = pickFirstCell();
  miniClueIndex = 0;
  renderMini();
}

function setMiniLetter(ch){
  if(isBlock(miniSelected)) return;
  miniLetters[miniSelected] = ch.toUpperCase();
  moveToNextCell();
  renderMini();
}
function clearMiniLetter(){
  if(isBlock(miniSelected)) return;
  miniLetters[miniSelected] = "";
  renderMini();
}

document.addEventListener("keydown", (e)=>{
  if(activeView !== "mini") return;

  if(e.key === "Backspace"){
    clearMiniLetter();
    return;
  }
  if(/^[a-zA-Z]$/.test(e.key)){
    setMiniLetter(e.key);
  }
});

if(miniHiddenInput){
  miniHiddenInput.addEventListener("input", ()=>{
    const v = (miniHiddenInput.value || "").toUpperCase().replace(/[^A-Z]/g,"");
    if(v) setMiniLetter(v.slice(-1));
    miniHiddenInput.value = "";
  });
}

if(miniPrevClue){
  miniPrevClue.addEventListener("click", ()=>{
    miniClueIndex = (miniClueIndex - 1 + MINI_CLUES.length) % MINI_CLUES.length;
    renderMini();
  });
}
if(miniNextClue){
  miniNextClue.addEventListener("click", ()=>{
    miniClueIndex = (miniClueIndex + 1) % MINI_CLUES.length;
    renderMini();
  });
}

// init mini
miniReset();

/* =========================
   WORDLE — reset + basic input
   ========================= */
const wordleBoard = $("#wordleBoard");
const wordleMsg = $("#wordleMsg");
const wordleHiddenInput = $("#wordleHiddenInput");
const wordleKeyboard = $("#wordleKeyboard");

const SOL = CONFIG.wordleSolution.toUpperCase();
let wordleRow = 0;
let wordleDone = false;
let currentGuess = [];
let keyState = new Map();

function buildWordle(){
  if(!wordleBoard) return;
  wordleBoard.innerHTML = "";
  for(let r=0;r<6;r++){
    const row = document.createElement("div");
    row.className = "wordle-row";
    for(let c=0;c<5;c++){
      const t = document.createElement("div");
      t.className = "wordle-tile";
      row.appendChild(t);
    }
    wordleBoard.appendChild(row);
  }
}

function buildKeyboard(){
  if(!wordleKeyboard) return;
  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","⌫"]
  ];
  wordleKeyboard.innerHTML = "";
  rows.forEach((r)=>{
    const row = document.createElement("div");
    row.className = "kb-row";
    r.forEach((k)=>{
      const b = document.createElement("button");
      b.className = "kb-key";
      b.type = "button";
      b.textContent = k;
      if(k === "ENTER" || k === "⌫") b.classList.add("wide");
      b.addEventListener("click", ()=> handleWordleKey(k));
      row.appendChild(b);
    });
    wordleKeyboard.appendChild(row);
  });
  renderKeyboardStates();
}

function setMsg(t){ if(wordleMsg) wordleMsg.textContent = t || ""; }

function renderKeyboardStates(){
  $$(".kb-key").forEach(b=>{
    const key = b.textContent;
    if(key.length === 1 && /[A-Z]/.test(key)){
      b.classList.remove("correct","present","absent");
      const st = keyState.get(key);
      if(st) b.classList.add(st);
    }
  });
}

function renderCurrentRow(){
  if(!wordleBoard) return;
  const rowEl = wordleBoard.children[wordleRow];
  if(!rowEl) return;
  for(let i=0;i<5;i++){
    const tile = rowEl.children[i];
    const ch = currentGuess[i] || "";
    tile.textContent = ch;
    tile.classList.toggle("filled", !!ch);
  }
}

function colorRow(guess){
  const res = Array(5).fill("absent");
  const solArr = SOL.split("");
  const used = Array(5).fill(false);

  for(let i=0;i<5;i++){
    if(guess[i] === solArr[i]){
      res[i] = "correct";
      used[i] = true;
    }
  }
  for(let i=0;i<5;i++){
    if(res[i] === "correct") continue;
    const idx = solArr.findIndex((ch, j)=> !used[j] && ch === guess[i]);
    if(idx !== -1){
      res[i] = "present";
      used[idx] = true;
    }
  }

  const rowEl = wordleBoard.children[wordleRow];
  for(let i=0;i<5;i++){
    const tile = rowEl.children[i];
    tile.classList.remove("correct","present","absent");
    tile.classList.add(res[i]);
  }

  const rank = { absent: 1, present: 2, correct: 3 };
  for(let i=0;i<5;i++){
    const L = guess[i];
    const next = res[i];
    const cur = keyState.get(L);
    if(!cur || rank[next] > rank[cur]) keyState.set(L, next);
  }
  renderKeyboardStates();
}

function submitWordle(){
  if(wordleDone) return;
  if(currentGuess.length !== 5){
    setMsg("Enter 5 letters.");
    return;
  }
  const guess = currentGuess.join("");
  setMsg("");
  colorRow(guess);

  if(guess === SOL){
    wordleDone = true;
    setMsg("You got it! 💘");
    return;
  }

  wordleRow++;
  currentGuess = [];

  if(wordleRow >= 6){
    wordleDone = true;
    setMsg(`Out of tries! It was ${SOL}.`);
    return;
  }

  renderCurrentRow();
}

function handleWordleKey(k){
  if(wordleDone) return;

  if(k === "ENTER") return submitWordle();
  if(k === "⌫" || k === "BACKSPACE"){
    currentGuess.pop();
    setMsg("");
    return renderCurrentRow();
  }
  if(typeof k === "string" && k.length === 1 && /[A-Z]/i.test(k)){
    if(currentGuess.length >= 5) return;
    currentGuess.push(k.toUpperCase());
    setMsg("");
    renderCurrentRow();
  }
}

document.addEventListener("keydown", (e)=>{
  if(activeView !== "wordle") return;
  if(e.key === "Enter") handleWordleKey("ENTER");
  else if(e.key === "Backspace") handleWordleKey("BACKSPACE");
  else if(/^[a-zA-Z]$/.test(e.key)) handleWordleKey(e.key.toUpperCase());
});

if(wordleHiddenInput){
  wordleHiddenInput.addEventListener("input", ()=>{
    const val = (wordleHiddenInput.value || "").toUpperCase().replace(/[^A-Z]/g,"");
    currentGuess = val.slice(0,5).split("");
    renderCurrentRow();
    wordleHiddenInput.value = "";
  });
}

function resetWordle(){
  wordleRow = 0;
  wordleDone = false;
  currentGuess = [];
  keyState = new Map();
  buildWordle();
  buildKeyboard();
  setMsg("");
}

// init wordle
resetWordle();

/* =========================
   CONNECTIONS (UI-only for now)
   ========================= */
const connectionsPlay = $("#connectionsPlay");
const connGrid = $("#connGrid");
const connSubmit = $("#connSubmit");
const connClear = $("#connClear");
const connShuffle = $("#connShuffle");
const connMsg = $("#connMsg");

let connSelected = new Set();
let connWords = [...CONFIG.connectionsWords];

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderConnections(){
  if(!connGrid) return;
  connGrid.innerHTML = "";
  connWords.forEach(w=>{
    const b = document.createElement("button");
    b.className = "conn-word";
    b.textContent = w;
    if(connSelected.has(w)) b.classList.add("selected");

    b.addEventListener("click", ()=>{
      if(connSelected.has(w)) connSelected.delete(w);
      else{
        if(connSelected.size >= 4){
          if(connMsg) connMsg.textContent = "Pick only 4.";
          return;
        }
        connSelected.add(w);
      }
      if(connMsg) connMsg.textContent = "";
      renderConnections();
    });

    connGrid.appendChild(b);
  });
}
renderConnections();

if(connClear){
  connClear.addEventListener("click", ()=>{
    connSelected.clear();
    if(connMsg) connMsg.textContent = "";
    renderConnections();
  });
}
if(connShuffle){
  connShuffle.addEventListener("click", ()=>{
    connWords = shuffleArray(connWords);
    if(connMsg) connMsg.textContent = "";
    renderConnections();
  });
}
if(connSubmit){
  connSubmit.addEventListener("click", ()=>{
    if(connSelected.size !== 4){
      if(connMsg) connMsg.textContent = "Select exactly 4.";
      return;
    }
    if(connMsg) connMsg.textContent = "Nice — now wire in your group logic ✅";
  });
}

/* =========================
   STRANDS
   ========================= */
const strandsPlay = $("#strandsPlay");
const spanThemeHelp = $("#spanThemeHelp");
const spanThemeTitle = $("#spanThemeTitle");
const spanGridEl = $("#spanGrid");
const spanMsg = $("#spanMsg");
const spanClear = $("#spanClear");
const spanProgress = $("#spanProgress");

const SP = CONFIG.strands;
if(spanThemeTitle) spanThemeTitle.textContent = SP.themeTitle;

let spanSelected = [];
let spanFoundWords = new Set();

function sIdxToRC(idx){ return { r: Math.floor(idx / SP.cols), c: idx % SP.cols }; }
function isAdjacent(a,b){
  const A = sIdxToRC(a), B = sIdxToRC(b);
  return Math.abs(A.r-B.r)<=1 && Math.abs(A.c-B.c)<=1 && !(A.r===B.r && A.c===B.c);
}
function selectionWord(){
  return spanSelected.map(i=>SP.grid[i]).join("").toUpperCase();
}
function updateProgress(){
  const total = SP.themeWords.length + 1;
  if(spanProgress) spanProgress.textContent = `${spanFoundWords.size} of ${total} theme words found.`;
}

function renderStrands(){
  if(!spanGridEl) return;

  spanGridEl.innerHTML = "";
  SP.grid.forEach((ch, idx)=>{
    const cell = document.createElement("div");
    cell.className = "span-cell";
    cell.textContent = ch.toUpperCase();
    if(spanSelected.includes(idx)) cell.classList.add("selected");

    cell.addEventListener("click", ()=>{
      if(spanSelected.includes(idx)){
        if(spanSelected[spanSelected.length-1] === idx){
          spanSelected.pop();
          renderStrands();
          if(spanMsg) spanMsg.textContent = selectionWord();
        }
        return;
      }
      if(spanSelected.length){
        const last = spanSelected[spanSelected.length-1];
        if(!isAdjacent(last, idx)) return;
      }
      spanSelected.push(idx);
      renderStrands();
      if(spanMsg) spanMsg.textContent = selectionWord();

      const w = selectionWord();
      const themeSet = new Set(SP.themeWords.map(x=>x.toUpperCase()));
      const big = SP.strandsWord.toUpperCase();
      if(themeSet.has(w) || w === big){
        if(!spanFoundWords.has(w)){
          spanFoundWords.add(w);
          if(spanMsg) spanMsg.textContent = (w===big) ? "STRANDS FOUND! ⭐" : "Nice!";
          spanSelected = [];
          renderStrands();
          updateProgress();
        }
      }
    });

    spanGridEl.appendChild(cell);
  });

  if(spanThemeHelp) spanThemeHelp.textContent = `Today’s theme: ${SP.themeTitle}`;
}
renderStrands();
updateProgress();

if(spanClear){
  spanClear.addEventListener("click", ()=>{
    spanSelected = [];
    if(spanMsg) spanMsg.textContent = "";
    renderStrands();
  });
}

/* =========================
   FINAL REVEAL
   ========================= */
const revealBtn = $("#revealBtn");
if(revealBtn){
  revealBtn.addEventListener("click", ()=>{
    const el = $("#revealContent");
    if(!el) return;
    el.innerHTML = CONFIG.finalRevealHtml;
    el.classList.remove("hidden");
  });
}
