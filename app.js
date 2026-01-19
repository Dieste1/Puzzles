/* =========================
   CONFIG — EDIT THIS ONLY
   ========================= */
const CONFIG = {
  siteTitle: "Aliego's Puzzle Pack",
  siteSubtitle: "Solve the puzzles to unlock the final surprise.",

  // WORDLE
  wordleSolution: "HEART", // 5 letters
  // Keep guesses to words your person might try (or use a bigger list).
  wordleAllowedGuesses: [
    "HEART","HONEY","SWEET","LOVEY","ANGEL","CANDY","DATED","SMILE","HUGGY","ROSES","KISSES","CRUSH","ADORE"
  ],

  // CONNECTIONS (4 groups x 4 words)
  connectionsGroups: [
    { title: "Date Night Vibes", words: ["JAZZ","MARTINI","CANDLE","DANCE"] },
    { title: "Places", words: ["MONTREAL","OLDPORT","PLATEAU","MILEEND"] },
    { title: "You", words: ["KIND","FUNNY","SMART","WARM"] },
    { title: "Us", words: ["ALWAYS","TOGETHER","FOREVER","US"] }
  ],

  // SPELLING BEE
  beeCenter: "A",
  beeOuter: ["L","O","V","E","R","T"], // 6 letters
  // Provide your own valid words (must be uppercase, 4+ letters, include center)
  beeValidWords: [
    "VALOR","LATER","ALERT","TRAVEL","RELATE","OVAL","ORAL","LAVA","ALOE","VOTER"
  ],

    // SPANAGRAM / STRANDS-LITE
  spanagram: {
    theme: "Our Love Story",
    // Grid is row-major. Example 6x6 = 36 letters.
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
    // include your spanagram as one of the words (long one)
    spanagramWord: "TOGETHERFOREVER",
    themeWords: ["LOVE","HEART","SMILES","MORE"]
  },


  // FINAL REVEAL
  requireSolveBeforeReveal: true, // if true, requires any puzzle solved
  finalRevealHtml: `
    <h3>❤️ Surprise</h3>
    <p>Meet me at <strong>8:00</strong> — I planned something special.</p>
    <p style="color:#a3a3b2;margin:0;">Dress cozy. Bring your smile.</p>
  `
};

/* =========================
   NAV / VIEWS
   ========================= */
const views = ["home","wordle","connections","bee","spanagram","reveal"];
const state = {
  solvedWordle: false,
  solvedConnections: false,
  solvedBeeAny: false
};

function showView(name){
  views.forEach(v=>{
    document.getElementById(`view-${v}`).classList.toggle("hidden", v !== name);
  });
  document.querySelectorAll(".tab").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=> showView(btn.dataset.view));
});
document.querySelectorAll("[data-goto]").forEach(btn=>{
  btn.addEventListener("click", ()=> showView(btn.dataset.goto));
});

document.getElementById("siteTitle").textContent = CONFIG.siteTitle;
document.getElementById("siteSubtitle").textContent = CONFIG.siteSubtitle;

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
buildWordleBoard();

function wordleSetMsg(text, kind=""){
  wordleMsg.textContent = text;
  wordleMsg.style.color = kind==="ok" ? "rgba(34,197,94,.95)"
                      : kind==="bad" ? "rgba(239,68,68,.95)"
                      : kind==="warn"? "rgba(245,158,11,.95)"
                      : "";
}

function isAllowedWord(w){
  return /^[A-Z]{5}$/.test(w); // any 5-letter input
}

function evaluateGuess(guess){
  // returns array of 5 statuses: ok, warn, bad (Wordle-style with duplicates handling)
  const solArr = SOL.split("");
  const guessArr = guess.split("");
  const result = Array(5).fill("bad");

  // First pass: exact matches
  for(let i=0;i<5;i++){
    if(guessArr[i] === solArr[i]){
      result[i] = "ok";
      solArr[i] = null; // consumed
      guessArr[i] = null;
    }
  }
  // Second pass: present elsewhere
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
  if(!isAllowedWord(raw)) return wordleSetMsg("warn");

  const statuses = evaluateGuess(raw);
  renderGuess(raw, statuses);

  if(raw === SOL){
    wordleDone = true;
    state.solvedWordle = true;
    wordleSetMsg("You got it! 💘", "ok");
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
});

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
    btn.dataset.word = w;

    const isSolved = connSolvedGroups.some(g=>g.words.includes(w));
    if(isSolved){
      btn.classList.add("disabled");
      btn.disabled = true;
    }

    if(connSelected.has(w)) btn.classList.add("selected");

    btn.addEventListener("click", ()=>{
      if(btn.disabled) return;
      if(connSelected.has(w)) connSelected.delete(w);
      else {
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

  // Check against groups
  const match = CONFIG.connectionsGroups.find(g=>{
    const set = new Set(g.words.map(x=>x.toUpperCase()));
    return pick.every(w=>set.has(w));
  });

  if(!match) return connSetMsg("Not a correct group. Try again 💛", "bad");

  const solvedWords = match.words.map(w=>w.toUpperCase());
  if(connSolvedGroups.some(g=>g.title === match.title)) return connSetMsg("Already solved.", "warn");

  connSolvedGroups.push({ title: match.title, words: solvedWords });
  connSelected.clear();
  connSetMsg("Nice! Group solved ✅", "ok");

  if(connSolvedGroups.length === 4){
    state.solvedConnections = true;
    connSetMsg("All groups solved! 🎉", "ok");
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
});

renderConn();

/* =========================
   SPELLING BEE
   ========================= */
const beeLetters = document.getElementById("beeLetters");
const beeInput = document.getElementById("beeInput");
const beeSubmit = document.getElementById("beeSubmit");
const beeReset = document.getElementById("beeReset");
const beeFound = document.getElementById("beeFound");
const beeMsg = document.getElementById("beeMsg");
const beeCount = document.getElementById("beeCount");
const beeScore = document.getElementById("beeScore");

const beeCenter = CONFIG.beeCenter.toUpperCase();
const beeOuter = CONFIG.beeOuter.map(x=>x.toUpperCase());
const beeAllowedLetters = new Set([beeCenter, ...beeOuter]);
const beeValid = new Set(CONFIG.beeValidWords.map(w=>w.toUpperCase()));

let beeFoundSet = new Set();
let beePoints = 0;

function renderBeeLetters(){
  // Display 7 letters with center in middle (grid 3x3). Simple layout:
  // Outer letters around, center in middle.
  const layout = [
    beeOuter[0], beeOuter[1], beeOuter[2],
    beeOuter[3], beeCenter,   beeOuter[4],
    "",          beeOuter[5], ""
  ];
  beeLetters.innerHTML = "";
  layout.forEach(ch=>{
    const div = document.createElement("div");
    div.className = "bee-letter" + (ch === beeCenter ? " center" : "");
    div.textContent = ch;
    beeLetters.appendChild(div);
  });
}

function beeSetMsg(text, kind=""){
  beeMsg.textContent = text;
  beeMsg.style.color = kind==="ok" ? "rgba(34,197,94,.95)"
                  : kind==="bad" ? "rgba(239,68,68,.95)"
                  : kind==="warn"? "rgba(245,158,11,.95)"
                  : "";
}

function isBeeWordValid(w){
  if(w.length < 4) return false;
  if(!w.includes(beeCenter)) return false;
  for(const ch of w){
    if(!beeAllowedLetters.has(ch)) return false;
  }
  return beeValid.has(w);
}

function addBeeWordChip(w){
  const chip = document.createElement("div");
  chip.className = "word-chip";
  chip.textContent = w;
  beeFound.appendChild(chip);
}

function updateBeeStats(){
  beeCount.textContent = String(beeFoundSet.size);
  beeScore.textContent = String(beePoints);
}

function submitBee(){
  const w = beeInput.value.trim().toUpperCase();
  if(!/^[A-Z]+$/.test(w)) return beeSetMsg("Letters only.", "warn");
  if(beeFoundSet.has(w)) return beeSetMsg("Already found.", "warn");

  if(!isBeeWordValid(w)){
    return beeSetMsg("Not in the list (or missing center letter).", "bad");
  }

  beeFoundSet.add(w);
  state.solvedBeeAny = true;

  // scoring: 1 point for 4 letters, + length-4 for longer
  let pts = 1 + Math.max(0, w.length - 4);
  beePoints += pts;

  addBeeWordChip(w);
  updateBeeStats();
  beeInput.value = "";
  beeSetMsg(`Nice! +${pts} points 🐝`, "ok");
}

beeSubmit.addEventListener("click", submitBee);
beeInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") submitBee();
});
beeReset.addEventListener("click", ()=>{
  beeFoundSet = new Set();
  beePoints = 0;
  state.solvedBeeAny = false;
  beeFound.innerHTML = "";
  beeInput.value = "";
  beeSetMsg("");
  updateBeeStats();
});

renderBeeLetters();
updateBeeStats();

/* =========================
   SPANAGRAM (Strands-lite)
   - click letters to form a path
   - must be adjacent (including diagonals)
   - submit to check against word list
   ========================= */
const spanGridEl = document.getElementById("spanGrid");
const spanReset = document.getElementById("spanReset");
const spanSubmit = document.getElementById("spanSubmit");
const spanClear = document.getElementById("spanClear");
const spanMsg = document.getElementById("spanMsg");
const spanThemeHelp = document.getElementById("spanThemeHelp");
const spanWordList = document.getElementById("spanWordList");
const spanFoundCount = document.getElementById("spanFoundCount");

const SP = CONFIG.spanagram;
let spanSelected = []; // indices
let spanFoundWords = new Set();
let spanFoundCells = new Map(); // idx -> "found" | "spanagram"

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
  const all = [...SP.themeWords.map(w=>w.toUpperCase()), SP.spanagramWord.toUpperCase()];
  all.forEach(w=>{
    const chip = document.createElement("div");
    chip.className = "span-word" + (spanFoundWords.has(w) ? " done" : "");
    chip.textContent = w === SP.spanagramWord.toUpperCase() ? `⭐ ${w}` : w;
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
    if(status === "spanagram") cell.classList.add("spanagram");

    cell.addEventListener("click", ()=>{
      // can't select already-found cells (keeps it simple)
      if(spanFoundCells.has(idx)) return;

      // if already selected, allow undo last only
      if(spanSelected.includes(idx)){
        if(spanSelected[spanSelected.length - 1] === idx){
          spanSelected.pop();
          spanSetMsg("");
          renderSpanGrid();
        } else {
          spanSetMsg("You can only undo the last letter.", "warn");
        }
        return;
      }

      // adjacency rule
      if(spanSelected.length > 0){
        const last = spanSelected[spanSelected.length - 1];
        if(!isAdjacent(last, idx)){
          spanSetMsg("Letters must touch (adjacent).", "warn");
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
  const spanWord = SP.spanagramWord.toUpperCase();

  if(!themeSet.has(w) && w !== spanWord){
    return spanSetMsg("Not a theme word. Try again 🧵", "bad");
  }
  if(spanFoundWords.has(w)){
    return spanSetMsg("Already found.", "warn");
  }

  spanFoundWords.add(w);

  // mark cells
  spanSelected.forEach(i=>{
    spanFoundCells.set(i, w === spanWord ? "spanagram" : "found");
  });

  spanSetMsg(w === spanWord ? "SPANAGRAM FOUND! ⭐🎉" : "Nice! ✅", "ok");
  spanSelected = [];
  renderSpanGrid();
  renderSpanWordList();
}

function spanResetAll(){
  spanSelected = [];
  spanFoundWords = new Set();
  spanFoundCells = new Map();
  spanSetMsg("");
  renderSpanGrid();
  renderSpanWordList();
}

if(SP){
  spanThemeHelp.textContent = `Theme: ${SP.theme}. Tap letters to spell words. ⭐ marks the spanagram.`;
  renderSpanGrid();
  renderSpanWordList();

  spanClear.addEventListener("click", spanClearSelection);
  spanSubmit.addEventListener("click", spanSubmitSelection);
  spanReset.addEventListener("click", spanResetAll);
}


/* =========================
   FINAL REVEAL
   ========================= */
const revealBtn = document.getElementById("revealBtn");
const revealGate = document.getElementById("revealGate");
const revealContent = document.getElementById("revealContent");

function anySolved(){
  return state.solvedWordle || state.solvedConnections || state.solvedBeeAny;
}

function updateRevealGate(){
  if(!CONFIG.requireSolveBeforeReveal){
    revealGate.textContent = "Ready when you are 💝";
    return;
  }
  revealGate.textContent = anySolved()
    ? "You’ve solved at least one puzzle… you’ve earned this 💘"
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
