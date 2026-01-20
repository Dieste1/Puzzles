/* =========================
   CONFIG — EDIT THIS ONLY
   ========================= */
const CONFIG = {
  siteTitle: "🗞️ Games",

  // WORDLE
  wordleSolution: "HEART", // 5 letters

  // CONNECTIONS (4 groups x 4 words)
  connectionsGroups: [
    { title: "Date Night Vibes", words: ["JAZZ","MARTINI","CANDLE","DANCE"] },
    { title: "Places", words: ["MONTREAL","OLDPORT","PLATEAU","MILEEND"] },
    { title: "You", words: ["KIND","FUNNY","SMART","WARM"] },
    { title: "Us", words: ["ALWAYS","TOGETHER","FOREVER","US"] }
  ],

  // STRANDS
  strands: {
    theme: "Our Love Story",
    rows: 6,
    cols: 6,
    grid: [
      "L","O","V","E","S","U",
      "T","O","G","E","T","H",
      "E","R","F","O","R","E",
      "V","E","R","M","O","R",
      "E","H","E","A","R","T",
      "S","M","I","L","E","S"
    ],
    strandsWord: "TOGETHERFOREVER",
    themeWords: ["LOVE","HEART","SMILES","MORE"]
  },

  // MINI (5x5)
  mini: {
    // # = black square, letters are solution
    solution: [
      "L","O","V","E","#",
      "A","#","R","#","T",
      "D","A","T","E","#",
      "#","H","#","U","G",
      "S","#","M","I","L"
    ]
  },

  // FINAL REVEAL
  requireSolveBeforeReveal: true,
  finalRevealHtml: `
    <h3>❤️ Surprise</h3>
    <p>Meet me at <strong>8:00</strong> — I planned something special.</p>
    <p style="opacity:.75;margin:0;">Dress cozy. Bring your smile.</p>
  `
};

/* =========================
   NAV / VIEWS
   ========================= */
const views = ["home","mini","wordle","connections","strands","reveal"];
const state = {
  solvedWordle: false,
  solvedConnections: false,
  solvedStrandsAny: false
};

function showView(name){
  views.forEach(v=>{
    const el = document.getElementById(`view-${v}`);
    if(!el) return;
    el.classList.toggle("hidden", v !== name);
  });
  document.querySelectorAll(".bottom-nav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-goto]").forEach(card=>{
  card.addEventListener("click", ()=> showView(card.dataset.goto));
});

document.querySelectorAll(".bottom-nav button").forEach(btn=>{
  btn.addEventListener("click", ()=> showView(btn.dataset.view));
});

document.getElementById("siteTitle").textContent = CONFIG.siteTitle;

/* =========================
   MINI (simple crossword)
   - tap a cell, type letter keys
   - blocks (#) are black
   ========================= */
const miniGrid = document.getElementById("miniGrid");
const miniReveal = document.getElementById("miniReveal");
const miniReset = document.getElementById("miniReset");
const miniMsg = document.getElementById("miniMsg");

let miniActive = -1;
let miniEntries = Array(25).fill("");

function renderMini(){
  miniGrid.innerHTML = "";
  CONFIG.mini.solution.forEach((ch, idx)=>{
    const d = document.createElement("div");
    d.className = "mini-cell";
    if(ch === "#") d.classList.add("block");

    const val = (ch === "#") ? "" : (miniEntries[idx] || "");
    d.textContent = val;

    if(idx === miniActive) d.classList.add("active");

    d.addEventListener("click", ()=>{
      if(ch === "#") return;
      miniActive = idx;
      miniMsg.textContent = "";
      renderMini();
    });

    miniGrid.appendChild(d);
  });
}

function miniResetAll(){
  miniEntries = Array(25).fill("");
  miniActive = -1;
  miniMsg.textContent = "";
  renderMini();
}

document.addEventListener("keydown", (e)=>{
  const miniVisible = !document.getElementById("view-mini").classList.contains("hidden");
  if(!miniVisible) return;
  if(miniActive < 0) return;

  const sol = CONFIG.mini.solution[miniActive];
  if(sol === "#") return;

  if(e.key === "Backspace"){
    miniEntries[miniActive] = "";
    renderMini();
    return;
  }

  if(/^[a-zA-Z]$/.test(e.key)){
    miniEntries[miniActive] = e.key.toUpperCase();
    // move forward to next non-block
    for(let i=miniActive+1; i<25; i++){
      if(CONFIG.mini.solution[i] !== "#"){
        miniActive = i;
        break;
      }
    }
    renderMini();
  }
});

miniReveal.addEventListener("click", ()=>{
  CONFIG.mini.solution.forEach((ch, i)=>{
    miniEntries[i] = (ch === "#") ? "" : ch;
  });
  miniMsg.textContent = "Revealed ✅";
  renderMini();
});
miniReset.addEventListener("click", miniResetAll);

renderMini();

/* =========================
   WORDLE
   ========================= */
const wordleBoard = document.getElementById("wordleBoard");
const wordleInput = document.getElementById("wordleInput");
const wordleSubmit = document.getElementById("wordleSubmit");
const wordleMsg = document.getElementById("wordleMsg");
const wordleReset = document.getElementById("wordleReset");

let wordleRow = 0;
let wordleDone = false;
const SOL = CONFIG.wordleSolution.trim().toUpperCase();

function buildWordleBoard(){
  wordleBoard.innerHTML = "";
  for(let r=0;r<6;r++){
    const row = document.createElement("div");
    row.className = "wordle-row";
    for(let c=0;c<5;c++){
      const t = document.createElement("div");
      t.className = "tile";
      t.textContent = "";
      row.appendChild(t);
    }
    wordleBoard.appendChild(row);
  }
}

function wordleSetMsg(text, kind=""){
  wordleMsg.textContent = text;
  wordleMsg.style.color = kind==="ok" ? "rgba(34,197,94,.95)"
                      : kind==="bad" ? "rgba(239,68,68,.95)"
                      : kind==="warn"? "rgba(245,158,11,.95)"
                      : "";
}

function evaluateGuess(guess){
  const solArr = SOL.split("");
  const guessArr = guess.split("");
  const result = Array(5).fill("bad");

  for(let i=0;i<5;i++){
    if(guessArr[i] === solArr[i]){
      result[i] = "ok";
      solArr[i] = null;
      guessArr[i] = null;
    }
  }

  for(let i=0;i<5;i++){
    if(guessArr[i] == null) continue;
    const idx = solArr.indexOf(guessArr[i]);
    if(idx !== -1){
      result[i] = "warn";
      solArr[idx] = null;
    }
  }
  return result;
}

function renderGuess(guess, statuses){
  const rowEl = wordleBoard.children[wordleRow];
  for(let i=0;i<5;i++){
    const tile = rowEl.children[i];
    tile.textContent = guess[i];
    tile.classList.add(statuses[i]);
  }
}

function submitWordle(){
  if(wordleDone) return;

  const raw = wordleInput.value.trim().toUpperCase();
  if(raw.length !== 5) return wordleSetMsg("Need 5 letters.", "warn");
  if(!/^[A-Z]+$/.test(raw)) return wordleSetMsg("Letters only.", "warn");

  const statuses = evaluateGuess(raw);
  renderGuess(raw, statuses);

  if(raw === SOL){
    wordleDone = true;
    state.solvedWordle = true;
    wordleSetMsg("You got it! ✅", "ok");
    updateRevealGate();
    return;
  }

  wordleRow++;
  wordleInput.value = "";
  if(wordleRow >= 6){
    wordleDone = true;
    wordleSetMsg(`Out of tries! The word was ${SOL}.`, "bad");
  } else {
    wordleSetMsg("");
  }
}

wordleSubmit.addEventListener("click", submitWordle);
wordleInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") submitWordle();
});
wordleReset.addEventListener("click", ()=>{
  wordleRow = 0;
  wordleDone = false;
  state.solvedWordle = false;
  buildWordleBoard();
  wordleInput.value = "";
  wordleSetMsg("");
  updateRevealGate();
});

buildWordleBoard();

/* =========================
   CONNECTIONS
   ========================= */
const connGrid = document.getElementById("connGrid");
const connSubmit = document.getElementById("connSubmit");
const connClear = document.getElementById("connClear");
const connReset = document.getElementById("connReset");
const connSolved = document.getElementById("connSolved");
const connMsg = document.getElementById("connMsg");

let connSelected = new Set();
let connSolvedGroups = [];

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function allConnWords(){
  return CONFIG.connectionsGroups.flatMap(g=>g.words.map(w=>w.toUpperCase()));
}

let connWords = shuffle(allConnWords());

function connSetMsg(text, kind=""){
  connMsg.textContent = text;
  connMsg.style.color = kind==="ok" ? "rgba(34,197,94,.95)"
                    : kind==="bad" ? "rgba(239,68,68,.95)"
                    : kind==="warn"? "rgba(245,158,11,.95)"
                    : "";
}

function renderConn(){
  connGrid.innerHTML = "";
  connWords.forEach(w=>{
    const btn = document.createElement("button");
    btn.className = "conn-word";
    btn.type = "button";
    btn.textContent = w;

    const isSolved = connSolvedGroups.some(g=>g.words.includes(w));
    if(isSolved){
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    if(connSelected.has(w)) btn.classList.add("selected");

    btn.addEventListener("click", ()=>{
      if(btn.disabled) return;
      if(connSelected.has(w)) connSelected.delete(w);
      else{
        if(connSelected.size >= 4) return connSetMsg("Pick only 4.", "warn");
        connSelected.add(w);
      }
      connSetMsg("");
      renderConn();
    });

    connGrid.appendChild(btn);
  });

  connSolved.innerHTML = "";
  connSolvedGroups.forEach(g=>{
    const box = document.createElement("div");
    box.className = "solved-pill";
    box.innerHTML = `<strong>✅ ${g.title}</strong><div class="words">${g.words.join(" · ")}</div>`;
    connSolved.appendChild(box);
  });
}

function submitConn(){
  if(connSelected.size !== 4) return connSetMsg("Select exactly 4 words.", "warn");
  const pick = Array.from(connSelected);

  const match = CONFIG.connectionsGroups.find(g=>{
    const set = new Set(g.words.map(x=>x.toUpperCase()));
    return pick.every(w=>set.has(w));
  });

  if(!match) return connSetMsg("Not a correct group. Try again.", "bad");

  const solvedWords = match.words.map(w=>w.toUpperCase());
  if(connSolvedGroups.some(g=>g.title === match.title)) return connSetMsg("Already solved.", "warn");

  connSolvedGroups.push({ title: match.title, words: solvedWords });
  connSelected.clear();
  connSetMsg("Nice! Group solved ✅", "ok");

  if(connSolvedGroups.length === 4){
    state.solvedConnections = true;
    connSetMsg("All groups solved! 🎉", "ok");
    updateRevealGate();
  }
  renderConn();
}

connSubmit.addEventListener("click", submitConn);
connClear.addEventListener("click", ()=>{
  connSelected.clear();
  connSetMsg("");
  renderConn();
});
connReset.addEventListener("click", ()=>{
  connSelected.clear();
  connSolvedGroups = [];
  state.solvedConnections = false;
  connWords = shuffle(allConnWords());
  connSetMsg("");
  renderConn();
  updateRevealGate();
});

renderConn();

/* =========================
   STRANDS (tap path + submit)
   ========================= */
const spanGridEl = document.getElementById("spanGrid");
const spanReset = document.getElementById("spanReset");
const spanSubmit = document.getElementById("spanSubmit");
const spanClear = document.getElementById("spanClear");
const spanMsg = document.getElementById("spanMsg");
const spanThemeHelp = document.getElementById("spanThemeHelp");
const spanWordList = document.getElementById("spanWordList");
const spanFoundCount = document.getElementById("spanFoundCount");

const SP = CONFIG.strands;
let spanSelected = [];
let spanFoundWords = new Set();
let spanFoundCells = new Map(); // idx -> "found" | "strands"

function spanSetMsg(text, kind=""){
  spanMsg.textContent = text;
  spanMsg.style.color = kind==="ok" ? "rgba(34,197,94,.95)"
                : kind==="bad" ? "rgba(239,68,68,.95)"
                : kind==="warn"? "rgba(245,158,11,.95)"
                : "";
}

function idxToRC(idx){
  return { r: Math.floor(idx / SP.cols), c: idx % SP.cols };
}

function isAdjacent(a, b){
  const A = idxToRC(a), B = idxToRC(b);
  return Math.abs(A.r - B.r) <= 1 && Math.abs(A.c - B.c) <= 1 && !(A.r===B.r && A.c===B.c);
}

function spanWordFromSelection(){
  return spanSelected.map(i => SP.grid[i]).join("").toUpperCase();
}

function renderSpanWordList(){
  spanWordList.innerHTML = "";
  const all = [...SP.themeWords.map(w=>w.toUpperCase()), SP.strandsWord.toUpperCase()];
  all.forEach(w=>{
    const chip = document.createElement("div");
    chip.className = "span-word" + (spanFoundWords.has(w) ? " done" : "");
    chip.textContent = w === SP.strandsWord.toUpperCase() ? `⭐ ${w}` : w;
    spanWordList.appendChild(chip);
  });
  spanFoundCount.textContent = String(spanFoundWords.size);
}

function renderSpanGrid(){
  spanGridEl.style.setProperty("--cols", SP.cols);
  spanGridEl.innerHTML = "";

  SP.grid.forEach((ch, idx)=>{
    const cell = document.createElement("div");
    cell.className = "span-cell";
    cell.textContent = ch.toUpperCase();

    if(spanSelected.includes(idx)) cell.classList.add("selected");
    const status = spanFoundCells.get(idx);
    if(status === "found") cell.classList.add("found");
    if(status === "strands") cell.classList.add("strands");

    cell.addEventListener("click", ()=>{
      if(spanFoundCells.has(idx)) return;

      if(spanSelected.includes(idx)){
        if(spanSelected[spanSelected.length - 1] === idx){
          spanSelected.pop();
          spanSetMsg("");
          renderSpanGrid();
        } else {
          spanSetMsg("Undo only the last letter.", "warn");
        }
        return;
      }

      if(spanSelected.length > 0){
        const last = spanSelected[spanSelected.length - 1];
        if(!isAdjacent(last, idx)){
          spanSetMsg("Letters must touch.", "warn");
          return;
        }
      }

      spanSelected.push(idx);
      spanSetMsg(spanWordFromSelection());
      renderSpanGrid();
    });

    spanGridEl.appendChild(cell);
  });
}

function spanClearSelection(){
  spanSelected = [];
  spanSetMsg("");
  renderSpanGrid();
}

function spanSubmitSelection(){
  if(spanSelected.length < 4) return spanSetMsg("Select at least 4 letters.", "warn");
  const w = spanWordFromSelection();

  const themeSet = new Set(SP.themeWords.map(x=>x.toUpperCase()));
  const strandWord = SP.strandsWord.toUpperCase();

  if(!themeSet.has(w) && w !== strandWord){
    return spanSetMsg("Not a theme word.", "bad");
  }
  if(spanFoundWords.has(w)){
    return spanSetMsg("Already found.", "warn");
  }

  spanFoundWords.add(w);
  state.solvedStrandsAny = true;

  spanSelected.forEach(i=>{
    spanFoundCells.set(i, w === strandWord ? "strands" : "found");
  });

  spanSetMsg(w === strandWord ? "STRANDS FOUND! ⭐🎉" : "Nice! ✅", "ok");
  spanSelected = [];
  renderSpanGrid();
  renderSpanWordList();
  updateRevealGate();
}

function spanResetAll(){
  spanSelected = [];
  spanFoundWords = new Set();
  spanFoundCells = new Map();
  state.solvedStrandsAny = false;
  spanSetMsg("");
  renderSpanGrid();
  renderSpanWordList();
  updateRevealGate();
}

spanThemeHelp.textContent = `Theme: ${SP.theme}. Tap letters to spell words. ⭐ marks the strands.`;
renderSpanGrid();
renderSpanWordList();

spanClear.addEventListener("click", spanClearSelection);
spanSubmit.addEventListener("click", spanSubmitSelection);
spanReset.addEventListener("click", spanResetAll);

/* =========================
   FINAL REVEAL
   ========================= */
const revealBtn = document.getElementById("revealBtn");
const revealGate = document.getElementById("revealGate");
const revealContent = document.getElementById("revealContent");

function anySolved(){
  return state.solvedWordle || state.solvedConnections || state.solvedStrandsAny;
}

function updateRevealGate(){
  if(!CONFIG.requireSolveBeforeReveal){
    revealGate.textContent = "Ready when you are 💝";
    return;
  }
  revealGate.textContent = anySolved()
    ? "Unlocked 💘"
    : "Solve at least one puzzle first 😉";
}

revealBtn.addEventListener("click", ()=>{
  updateRevealGate();
  if(CONFIG.requireSolveBeforeReveal && !anySolved()){
    revealContent.classList.add("hidden");
    return;
  }
  revealContent.innerHTML = CONFIG.finalRevealHtml;
  revealContent.classList.remove("hidden");
});

updateRevealGate();

/* Default view */
showView("home");
