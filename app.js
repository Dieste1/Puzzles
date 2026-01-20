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
  `
};

/* =========================
   VIEW ROUTER (with transition)
   ========================= */
const views = ["home","mini","wordle","connections","strands-intro","strands","reveal"];
let activeView = "home";

function setActiveNav(name){
  document.querySelectorAll(".bottom-nav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === name);
  });
}

function showView(name){
  if(name === activeView) return;

  const current = document.getElementById(`view-${activeView}`);
  const next = document.getElementById(`view-${name}`);

  // hide current (remove entered -> fades out)
  current.classList.remove("is-entered");

  // after fade out, swap display
  setTimeout(()=>{
    current.classList.remove("is-active");
    next.classList.add("is-active");

    // force reflow so transition triggers
    void next.offsetWidth;

    next.classList.add("is-entered");

    activeView = name;
    setActiveNav(name === "strands" ? "strands-intro" : name);
    window.scrollTo({ top: 0 });

  }, 140);
}

// initialize
document.getElementById("view-home").classList.add("is-active");
requestAnimationFrame(()=>{
  document.getElementById("view-home").classList.add("is-entered");
});
setActiveNav("home");

document.querySelectorAll("[data-view]").forEach(btn=>{
  btn.addEventListener("click", ()=> showView(btn.dataset.view));
});
document.querySelectorAll("[data-goto]").forEach(el=>{
  el.addEventListener("click", ()=> showView(el.dataset.goto));
});

/* =========================
   MINI (simple)
   ========================= */
const miniGrid = document.getElementById("miniGrid");
const miniReveal = document.getElementById("miniReveal");
const MINI_FILL = [
  "L","O","V","E","S",
  "H","E","A","R","T",
  "S","M","I","L","E",
  "S","A","L","W","A",
  "Y","S","U","S","!"
];

function buildMini(){
  miniGrid.innerHTML = "";
  for(let i=0;i<25;i++){
    const c = document.createElement("div");
    c.className = "mini-cell";
    c.textContent = " ";
    c.dataset.letter = MINI_FILL[i] || " ";
    miniGrid.appendChild(c);
  }
}
buildMini();

miniReveal.addEventListener("click", ()=>{
  document.querySelectorAll(".mini-cell").forEach(c=>{
    c.textContent = c.dataset.letter;
  });
});

/* =========================
   WORDLE (basic)
   ========================= */
const wordleBoard = document.getElementById("wordleBoard");
const wordleInput = document.getElementById("wordleInput");
const wordleSubmit = document.getElementById("wordleSubmit");
const wordleMsg = document.getElementById("wordleMsg");

let wordleRow = 0;
let wordleDone = false;
const SOL = CONFIG.wordleSolution.toUpperCase();

function buildWordle(){
  wordleBoard.innerHTML = "";
  for(let r=0;r<6;r++){
    const row = document.createElement("div");
    row.className = "wordle-row";
    for(let c=0;c<5;c++){
      const t = document.createElement("div");
      t.className = "tile";
      row.appendChild(t);
    }
    wordleBoard.appendChild(row);
  }
}
buildWordle();

function submitWordle(){
  if(wordleDone) return;
  const guess = wordleInput.value.trim().toUpperCase();
  if(!/^[A-Z]{5}$/.test(guess)){
    wordleMsg.textContent = "Enter 5 letters.";
    return;
  }
  const rowEl = wordleBoard.children[wordleRow];
  for(let i=0;i<5;i++){
    rowEl.children[i].textContent = guess[i];
  }
  if(guess === SOL){
    wordleDone = true;
    wordleMsg.textContent = "You got it! 💘";
    return;
  }
  wordleRow++;
  wordleInput.value = "";
  if(wordleRow >= 6){
    wordleDone = true;
    wordleMsg.textContent = `Out of tries! It was ${SOL}.`;
  } else {
    wordleMsg.textContent = "";
  }
}
wordleSubmit.addEventListener("click", submitWordle);
wordleInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") submitWordle(); });

/* =========================
   CONNECTIONS (simple selection UI)
   ========================= */
const connGrid = document.getElementById("connGrid");
const connSubmit = document.getElementById("connSubmit");
const connClear = document.getElementById("connClear");
const connMsg = document.getElementById("connMsg");

let connSelected = new Set();

function renderConnections(){
  connGrid.innerHTML = "";
  CONFIG.connectionsWords.forEach(w=>{
    const b = document.createElement("button");
    b.className = "conn-word";
    b.textContent = w;
    b.addEventListener("click", ()=>{
      if(connSelected.has(w)) connSelected.delete(w);
      else{
        if(connSelected.size >= 4){
          connMsg.textContent = "Pick only 4.";
          return;
        }
        connSelected.add(w);
      }
      connMsg.textContent = "";
      b.style.opacity = connSelected.has(w) ? "0.6" : "1";
    });
    connGrid.appendChild(b);
  });
}
renderConnections();

connClear.addEventListener("click", ()=>{
  connSelected.clear();
  connMsg.textContent = "";
  renderConnections();
});

connSubmit.addEventListener("click", ()=>{
  if(connSelected.size !== 4){
    connMsg.textContent = "Select exactly 4.";
    return;
  }
  connMsg.textContent = "Nice — now wire in your group logic ✅";
});

/* =========================
   STRANDS — Intro -> Play -> Game
   ========================= */
const strandsPlay = document.getElementById("strandsPlay");
const spanThemeHelp = document.getElementById("spanThemeHelp");
const spanThemeTitle = document.getElementById("spanThemeTitle");
const spanGridEl = document.getElementById("spanGrid");
const spanMsg = document.getElementById("spanMsg");
const spanClear = document.getElementById("spanClear");
const spanProgress = document.getElementById("spanProgress");

const SP = CONFIG.strands;
spanThemeTitle.textContent = SP.themeTitle;

let spanSelected = [];
let spanFoundWords = new Set();

function idxToRC(idx){ return { r: Math.floor(idx / SP.cols), c: idx % SP.cols }; }
function isAdjacent(a,b){
  const A = idxToRC(a), B = idxToRC(b);
  return Math.abs(A.r-B.r)<=1 && Math.abs(A.c-B.c)<=1 && !(A.r===B.r && A.c===B.c);
}
function selectionWord(){
  return spanSelected.map(i=>SP.grid[i]).join("").toUpperCase();
}

function updateProgress(){
  const total = SP.themeWords.length + 1; // includes strandsWord
  spanProgress.textContent = `${spanFoundWords.size} of ${total} theme words found.`;
}

function renderStrands(){
  spanGridEl.innerHTML = "";
  SP.grid.forEach((ch, idx)=>{
    const cell = document.createElement("div");
    cell.className = "span-cell";
    cell.textContent = ch.toUpperCase();

    if(spanSelected.includes(idx)) cell.classList.add("selected");

    cell.addEventListener("click", ()=>{
      // undo last tap
      if(spanSelected.includes(idx)){
        if(spanSelected[spanSelected.length-1] === idx){
          spanSelected.pop();
          renderStrands();
          spanMsg.textContent = selectionWord();
        }
        return;
      }
      // adjacency
      if(spanSelected.length){
        const last = spanSelected[spanSelected.length-1];
        if(!isAdjacent(last, idx)) return;
      }
      spanSelected.push(idx);
      renderStrands();
      spanMsg.textContent = selectionWord();

      // auto-check if it matches any word
      const w = selectionWord();
      const themeSet = new Set(SP.themeWords.map(x=>x.toUpperCase()));
      const big = SP.strandsWord.toUpperCase();
      if(themeSet.has(w) || w === big){
        if(!spanFoundWords.has(w)){
          spanFoundWords.add(w);
          spanMsg.textContent = (w===big) ? "STRANDS FOUND! ⭐" : "Nice!";
          spanSelected = [];
          renderStrands();
          updateProgress();
        }
      }
    });

    spanGridEl.appendChild(cell);
  });

  spanThemeHelp.textContent = `Today’s theme: ${SP.themeTitle}`;
}

renderStrands();
updateProgress();

spanClear.addEventListener("click", ()=>{
  spanSelected = [];
  spanMsg.textContent = "";
  renderStrands();
});

// Strands flow
strandsPlay.addEventListener("click", ()=>{
  showView("strands");
});

/* =========================
   FINAL REVEAL
   ========================= */
document.getElementById("revealBtn").addEventListener("click", ()=>{
  const el = document.getElementById("revealContent");
  el.innerHTML = CONFIG.finalRevealHtml;
  el.classList.remove("hidden");
});
