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

  connectionsGroups: [
    { name: "Date Night Vibes", words: ["JAZZ","MARTINI","CANDLE","DANCE"] },
    { name: "Montreal Spots",   words: ["MONTREAL","OLDPORT","PLATEAU","MILEEND"] },
    { name: "You Are…",         words: ["KIND","FUNNY","SMART","WARM"] },
    { name: "Us Forever",       words: ["ALWAYS","TOGETHER","FOREVER","US"] }
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
   HELPERS
   ========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* =========================
   HAPTICS (light taps)
   ========================= */
function haptic(ms = 10){
  try{
    if(typeof navigator !== "undefined" && navigator.vibrate){
      navigator.vibrate(ms);
    }
  }catch(_){}
}

/* =========================
   DOUBLE-TAP ZOOM GUARD (iOS)
   - Prevents double-tap zoom ONLY on game surfaces
   - Does not interfere with normal scrolling
   ========================= */
function preventDoubleTapZoom(el){
  if(!el) return;
  let lastTap = 0;
  let lastX = 0;
  let lastY = 0;

  el.addEventListener("touchend", (e)=>{
    // ignore multi-touch (pinch)
    if(e.touches && e.touches.length) return;
    const now = Date.now();

    const touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    const x = touch ? touch.clientX : 0;
    const y = touch ? touch.clientY : 0;

    const dt = now - lastTap;
    const dx = Math.abs(x - lastX);
    const dy = Math.abs(y - lastY);

    // A "double tap" is quick + basically same spot
    if(dt > 0 && dt < 320 && dx < 24 && dy < 24){
      e.preventDefault(); // stops iOS zoom
    }

    lastTap = now;
    lastX = x; lastY = y;
  }, { passive: false });
}

/* =========================
   PROGRESS + LOCKING
   ========================= */
const STORE_KEY = "aliego_puzzle_pack_v2";

const Progress = {
  state: {
    miniSolved: false,
    wordleSolved: false,
    connectionsSolved: false,
    strandsSolved: false
  },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed === "object"){
        this.state = { ...this.state, ...parsed };
      }
    }catch(_){}
  },
  save(){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); }catch(_){}
  },
  mark(key, val=true){
    this.state[key] = !!val;
    this.save();
    updateHomeLockUI();
    updateHomeBadges();
  },
  allSolved(){
    const s = this.state;
    return !!(s.miniSolved && s.wordleSolved && s.connectionsSolved && s.strandsSolved);
  }
};
Progress.load();

/* =========================
   TOAST
   ========================= */
let toastEl = null;
let toastTimer = null;

function ensureToast(){
  if(toastEl) return toastEl;
  toastEl = document.createElement("div");
  toastEl.id = "toast";
  toastEl.style.position = "fixed";
  toastEl.style.left = "50%";
  toastEl.style.bottom = "92px";
  toastEl.style.transform = "translateX(-50%)";
  toastEl.style.background = "rgba(0,0,0,.86)";
  toastEl.style.color = "#fff";
  toastEl.style.padding = "10px 14px";
  toastEl.style.borderRadius = "999px";
  toastEl.style.fontWeight = "800";
  toastEl.style.fontSize = "14px";
  toastEl.style.maxWidth = "92vw";
  toastEl.style.textAlign = "center";
  toastEl.style.boxShadow = "0 10px 25px rgba(0,0,0,.25)";
  toastEl.style.zIndex = "9999";
  toastEl.style.opacity = "0";
  toastEl.style.pointerEvents = "none";
  toastEl.style.transition = "opacity 160ms ease, transform 160ms ease";
  document.body.appendChild(toastEl);
  return toastEl;
}

function toast(msg){
  const el = ensureToast();
  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translateX(-50%) translateY(0)";
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(6px)";
  }, 1800);
}

/* =========================
   VIEW ROUTER
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

function updateHomeLockUI(){
  const card = document.querySelector('.game-card[data-goto="reveal"]');
  if(!card) return;
  const meta = card.querySelector(".meta");
  if(!meta) return;
  const spans = meta.querySelectorAll("span");
  const unlocked = Progress.allSolved();
  if(spans[0]) spans[0].textContent = unlocked ? "Unlocked" : "Locked";
  if(spans[1]) spans[1].textContent = unlocked ? "🎁" : "💝";
  card.style.opacity = unlocked ? "1" : "0.88";
}

function canOpenReveal(){
  return Progress.allSolved();
}

/* =========================
   HOME "COMPLETED ✓" BADGES (no HTML change)
   ========================= */
const BADGE_MAP = [
  { goto: "mini-intro", key: "miniSolved" },
  { goto: "wordle-intro", key: "wordleSolved" },
  { goto: "connections-intro", key: "connectionsSolved" },
  { goto: "strands-intro", key: "strandsSolved" }
];

function ensureBadge(card){
  let b = card.querySelector(".home-badge");
  if(b) return b;
  b = document.createElement("div");
  b.className = "home-badge";
  b.textContent = "✓ Completed";
  card.appendChild(b);
  return b;
}

function updateHomeBadges(){
  BADGE_MAP.forEach(({ goto, key })=>{
    const card = document.querySelector(`.game-card[data-goto="${goto}"]`);
    if(!card) return;
    const badge = ensureBadge(card);
    const on = !!Progress.state[key];
    badge.style.display = on ? "inline-flex" : "none";
  });
}

/* =========================
   VIEW SWITCH
   ========================= */
function showView(name){
  if(!views.includes(name)) return;
  if(name === activeView) return;

  if(name === "reveal" && !canOpenReveal()){
    toast("Finish all 4 puzzles to unlock the final reveal 💝");
    if(activeView !== "home") showView("home");
    return;
  }

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

    if(name === "wordle") {
      const hi = $("#wordleHiddenInput");
      if(hi) hi.focus({ preventScroll: true });
      requestAnimationFrame(()=> tuneWordleKeyboardLayout());
      setTimeout(()=> tuneWordleKeyboardLayout(), 180);
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
const homeView = $("#view-home");
if(homeView){
  homeView.classList.add("is-active");
  requestAnimationFrame(()=> homeView.classList.add("is-entered"));
}
setActiveNav("home");
applyImmersiveMode("home");
updateHomeLockUI();
updateHomeBadges();

function resetAllProgress(){
  Progress.state = {
    miniSolved: false,
    wordleSolved: false,
    connectionsSolved: false,
    strandsSolved: false
  };
  Progress.save();
  updateHomeLockUI();
  updateHomeBadges();
  toast("Progress reset.");
  haptic(20);
}

function enableHomeResetGesture(){
  const home = document.getElementById("view-home");
  if(!home) return;

  let timer = null;

  home.addEventListener("touchstart", (e)=>{
    const card = e.target.closest(".game-card");
    if(!card) return;

    // long press anywhere on a card = reset prompt
    timer = setTimeout(()=>{
      const ok = confirm("Reset all puzzle progress?");
      if(ok) resetAllProgress();
    }, 650);
  }, { passive: true });

  ["touchend","touchcancel","scroll"].forEach(evt=>{
    home.addEventListener(evt, ()=> {
      if(timer) clearTimeout(timer);
      timer = null;
    }, { passive: true });
  });

  home.addEventListener("mousedown", (e)=>{
    const card = e.target.closest(".game-card");
    if(!card) return;
    timer = setTimeout(()=>{
      const ok = confirm("Reset all puzzle progress?");
      if(ok) resetAllProgress();
    }, 650);
  });

  home.addEventListener("mouseup", ()=>{
    if(timer) clearTimeout(timer);
    timer = null;
  });
}

enableHomeResetGesture();


/* =========================
   CLICK DELEGATION (SAFE ON iOS)
   ========================= */
function delegateNav(e){
  const navBtn = e.target.closest("[data-view]");
  if(navBtn){
    showView(navBtn.dataset.view);
    return true;
  }

  const go = e.target.closest("[data-goto]");
  if(go){
    showView(go.dataset.goto);
    return true;
  }

  if(e.target.closest("#miniPlay")){
    miniReset(true);
    showView("mini");
    return true;
  }
  if(e.target.closest("#wordlePlay")){
    resetWordle();
    showView("wordle");
    return true;
  }
  if(e.target.closest("#connectionsPlay")){
    resetConnections(true);
    showView("connections");
    return true;
  }
  if(e.target.closest("#strandsPlay")){
    resetStrands(true);
    showView("strands");
    return true;
  }
  return false;
}

document.addEventListener("click", (e)=>{ delegateNav(e); });

/* =========================
   MINI — Across/Down + Clues
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

let miniDir = "across";
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

function downWordIndices(idx){
  if(isBlock(idx)) return [];
  const {r,c} = idxToRC(idx);
  let up = r;
  while(up-1 >= 0 && !isBlock((up-1)*MP.size + c)) up--;
  let down = r;
  while(down+1 < MP.size && !isBlock((down+1)*MP.size + c)) down++;
  const out = [];
  for(let y=up;y<=down;y++) out.push(y*MP.size + c);
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

function getMiniWordIndices(idx){
  return (miniDir === "across") ? acrossWordIndices(idx) : downWordIndices(idx);
}

function moveToNextInActiveWord(){
  const word = getMiniWordIndices(miniSelected);
  if(!word.length) return;
  const pos = word.indexOf(miniSelected);
  if(pos === -1) return;
  const next = word[pos+1];
  if(typeof next === "number"){
    miniSelected = next;
    return;
  }
  for(let i=miniSelected+1;i<MP.size*MP.size;i++){
    if(!isBlock(i)) { miniSelected = i; return; }
  }
}

function miniAllFilledCorrect(){
  for(let i=0;i<MP.size*MP.size;i++){
    if(isBlock(i)) continue;
    const want = (MP.solution[i] || "").toUpperCase();
    const got = (miniLetters[i] || "").toUpperCase();
    if(!want) continue;
    if(got !== want) return false;
  }
  return true;
}

function buildMiniEntries(){
  const entries = { across: [], down: [] };

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

  for(let i=0;i<MP.size*MP.size;i++){
    const num = MINI_NUMS[i];
    if(!num) continue;
    if(isStartAcross(i)) entries.across.push({ num, start: i, indices: acrossWordIndices(i) });
    if(isStartDown(i)) entries.down.push({ num, start: i, indices: downWordIndices(i) });
  }
  return entries;
}
const MINI_ENTRIES = buildMiniEntries();

const MINI_ACROSS_CLUES = [
  "___ of a kind",
  "Things you type",
  "Digital book, for short",
  "Give it another go",
  "They help you see"
];

const MINI_DOWN_CLUES = [
  "Maguire who played Spider-Man",
  "Put into words",
  "Smells",
  "“They ___ here”",
  "It’s above the clouds"
];

function entryClueText(dir, entry, idxInDir){
  const list = (dir === "across") ? MINI_ACROSS_CLUES : MINI_DOWN_CLUES;
  const clue = list[idxInDir] || "—";
  const label = `${entry.num} ${dir.toUpperCase()}`;
  return `${label} — ${clue}`;
}

function findEntryIndexForCell(dir, cellIdx){
  const list = (dir === "across") ? MINI_ENTRIES.across : MINI_ENTRIES.down;
  for(let i=0;i<list.length;i++){
    if(list[i].indices.includes(cellIdx)) return i;
  }
  return 0;
}

function setMiniClueFromSelection(){
  const dirList = (miniDir === "across") ? MINI_ENTRIES.across : MINI_ENTRIES.down;
  miniClueIndex = findEntryIndexForCell(miniDir, miniSelected);
  const entry = dirList[miniClueIndex];
  if(miniClueText && entry) miniClueText.textContent = entryClueText(miniDir, entry, miniClueIndex);
}

function renderMini(){
  if(!miniCrossword) return;

  miniCrossword.innerHTML = "";
  const word = new Set(getMiniWordIndices(miniSelected));
  setMiniClueFromSelection();

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
      if(miniSelected === i){
        miniDir = (miniDir === "across") ? "down" : "across";
        toast(miniDir === "across" ? "Across" : "Down");
        haptic(8);
      }
      miniSelected = i;
      renderMini();
      if(miniHiddenInput) miniHiddenInput.focus({ preventScroll: true });
    });

    miniCrossword.appendChild(cell);
  }

  if(!Progress.state.miniSolved && miniAllFilledCorrect()){
    Progress.mark("miniSolved", true);
    toast("Mini solved ✅");
    haptic(20);
    if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
  }
}

function miniReset(showToast=false){
  miniLetters = new Array(MP.size*MP.size).fill("");
  miniSelected = pickFirstCell();
  miniDir = "across";
  miniClueIndex = 0;
  renderMini();
  if(showToast) toast("Mini ready 🧩");
}

function setMiniLetter(ch){
  if(isBlock(miniSelected)) return;
  miniLetters[miniSelected] = ch.toUpperCase();
  moveToNextInActiveWord();
  renderMini();
  haptic(6);
}
function clearMiniLetter(){
  if(isBlock(miniSelected)) return;
  miniLetters[miniSelected] = "";
  renderMini();
  haptic(6);
}

document.addEventListener("keydown", (e)=>{
  if(activeView !== "mini") return;
  if(e.key === "Backspace") return clearMiniLetter();
  if(/^[a-zA-Z]$/.test(e.key)) setMiniLetter(e.key);
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
    const list = (miniDir === "across") ? MINI_ENTRIES.across : MINI_ENTRIES.down;
    miniClueIndex = (miniClueIndex - 1 + list.length) % list.length;
    const entry = list[miniClueIndex];
    if(entry){
      miniSelected = entry.start;
      renderMini();
      haptic(6);
    }
  });
}
if(miniNextClue){
  miniNextClue.addEventListener("click", ()=>{
    const list = (miniDir === "across") ? MINI_ENTRIES.across : MINI_ENTRIES.down;
    miniClueIndex = (miniClueIndex + 1) % list.length;
    const entry = list[miniClueIndex];
    if(entry){
      miniSelected = entry.start;
      renderMini();
      haptic(6);
    }
  });
}

miniReset();

/* =========================
   WORDLE — + NYT-like keyboard fit + FLIP ANIM
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

function tuneWordleKeyboardLayout(){
  if(!wordleKeyboard) return;
  wordleKeyboard.style.maxWidth = "520px";
  wordleKeyboard.style.marginLeft = "auto";
  wordleKeyboard.style.marginRight = "auto";

  const rows = $$("#wordleKeyboard .kb-row");
  if(!rows.length) return;

  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const isSmall = vw <= 390;

  rows.forEach(row=>{
    row.style.gap = isSmall ? "6px" : "8px";
    row.style.paddingLeft = isSmall ? "6px" : "8px";
    row.style.paddingRight = isSmall ? "6px" : "8px";

    const keys = Array.from(row.querySelectorAll(".kb-key"));
    if(!keys.length) return;

    keys.forEach(k=>{
      const wide = k.classList.contains("wide");
      k.style.flexGrow = String(wide ? 1.5 : 1);
      k.style.flexShrink = "1";
      k.style.flexBasis = "0px";
      k.style.minWidth = "0px";
      k.style.paddingLeft = "0px";
      k.style.paddingRight = "0px";
      k.style.height = isSmall ? "54px" : "58px";
      k.style.borderRadius = "10px";
      k.style.fontSize = isSmall ? "13px" : "14px";
      k.style.letterSpacing = ".2px";
    });
  });
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
      b.dataset.key = k;
      b.addEventListener("click", ()=> handleWordleKey(k));
      row.appendChild(b);
    });

    wordleKeyboard.appendChild(row);
  });

  tuneWordleKeyboardLayout();
  renderKeyboardStates();
}

window.addEventListener("resize", ()=>{
  if(activeView === "wordle") tuneWordleKeyboardLayout();
});
window.addEventListener("orientationchange", ()=>{
  if(activeView === "wordle") setTimeout(()=> tuneWordleKeyboardLayout(), 150);
});

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

/* NEW: compute result first, then animate flips, then apply final colors */
function evaluateGuess(guess){
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
  return res;
}

function applyKeyStates(guess, res){
  const rank = { absent: 1, present: 2, correct: 3 };
  for(let i=0;i<5;i++){
    const L = guess[i];
    const next = res[i];
    const cur = keyState.get(L);
    if(!cur || rank[next] > rank[cur]) keyState.set(L, next);
  }
  renderKeyboardStates();
}

/* NEW: flip animation sequence */
function flipRevealRow(guess, res){
  if(!wordleBoard) return;
  const rowEl = wordleBoard.children[wordleRow];
  if(!rowEl) return;

  for(let i=0;i<5;i++){
    const tile = rowEl.children[i];

    // reset classes for reruns
    tile.classList.remove("correct","present","absent","flip","flip-done");

    // put letter (already present), start flip
    const delay = i * 110;

    setTimeout(()=>{
      tile.classList.add("flip");    // CSS handles keyframes
      haptic(6);
    }, delay);

    // halfway point: apply color class
    setTimeout(()=>{
      tile.classList.add(res[i]);
      tile.classList.add("flip-done");
    }, delay + 190);
  }

  // update keyboard states near end of animation
  setTimeout(()=>{
    applyKeyStates(guess, res);
  }, 700);
}

function submitWordle(){
  if(wordleDone) return;

  if(currentGuess.length !== 5){
    setMsg("Enter 5 letters.");
    return;
  }

  const guess = currentGuess.join("");
  const res = evaluateGuess(guess);

  setMsg("");
  flipRevealRow(guess, res);

  if(guess === SOL){
    wordleDone = true;
    setTimeout(()=> setMsg("You got it! 💘"), 740);
    if(!Progress.state.wordleSolved){
      Progress.mark("wordleSolved", true);
      toast("Wordle solved ✅");
      haptic(25);
      if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
    }
    return;
  }

  wordleRow++;
  currentGuess = [];

  if(wordleRow >= 6){
    wordleDone = true;
    setTimeout(()=> setMsg(`Out of tries! It was ${SOL}.`), 740);
    return;
  }

  // wait until the flip finishes before showing next row typing feel
  setTimeout(()=> renderCurrentRow(), 760);
}

function handleWordleKey(k){
  if(wordleDone) return;

  if(k === "ENTER") return submitWordle();
  if(k === "⌫" || k === "BACKSPACE"){
    currentGuess.pop();
    setMsg("");
    haptic(6);
    return renderCurrentRow();
  }
  if(typeof k === "string" && k.length === 1 && /[A-Z]/i.test(k)){
    if(currentGuess.length >= 5) return;
    currentGuess.push(k.toUpperCase());
    setMsg("");
    haptic(6);
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
  requestAnimationFrame(()=> tuneWordleKeyboardLayout());
}

resetWordle();

/* =========================
   CONNECTIONS — FULL GAME
   ========================= */
const connGrid = $("#connGrid");
const connSubmit = $("#connSubmit");
const connClear = $("#connClear");
const connShuffle = $("#connShuffle");
const connMsg = $("#connMsg");

let connSelected = new Set();
let connWords = [...CONFIG.connectionsWords];

let connMistakes = 4;
let connSolvedGroups = [];
let connLockedWords = new Set();

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ensureConnSolvedUI(){
  const host = $("#view-connections .connections-game");
  if(!host) return null;

  let box = $("#connSolved");
  if(box) return box;

  box = document.createElement("div");
  box.id = "connSolved";
  box.style.display = "flex";
  box.style.flexDirection = "column";
  box.style.gap = "10px";
  box.style.margin = "12px 0 12px";
  host.insertBefore(box, connGrid);
  return box;
}

function renderConnSolved(){
  const box = ensureConnSolvedUI();
  if(!box) return;
  box.innerHTML = "";

  connSolvedGroups.forEach(g=>{
    const row = document.createElement("div");
    row.style.border = "1px solid rgba(255,255,255,.18)";
    row.style.borderRadius = "14px";
    row.style.padding = "10px 12px";
    row.style.background = "rgba(255,255,255,.06)";

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.style.marginBottom = "6px";
    title.textContent = g.name;

    const words = document.createElement("div");
    words.style.opacity = ".85";
    words.style.fontWeight = "800";
    words.style.letterSpacing = ".3px";
    words.textContent = g.words.join(" · ");

    row.appendChild(title);
    row.appendChild(words);
    box.appendChild(row);
  });

  const dots = $$("#view-connections .dot");
  dots.forEach((d, i)=>{
    d.style.opacity = (i < connMistakes) ? "1" : "0.18";
  });
}

function remainingConnWords(){
  return connWords.filter(w => !connLockedWords.has(w));
}

function renderConnections(){
  if(!connGrid) return;

  renderConnSolved();
  connGrid.innerHTML = "";

  remainingConnWords().forEach(w=>{
    const b = document.createElement("button");
    b.className = "conn-word";
    b.textContent = w;
    if(connSelected.has(w)) b.classList.add("selected");

    b.addEventListener("click", ()=>{
      if(connLockedWords.has(w)) return;

      if(connSelected.has(w)) connSelected.delete(w);
      else{
        if(connSelected.size >= 4){
          if(connMsg) connMsg.textContent = "Pick only 4.";
          haptic(8);
          return;
        }
        connSelected.add(w);
      }
      if(connMsg) connMsg.textContent = "";
      haptic(6);
      renderConnections();
    });

    connGrid.appendChild(b);
  });
}

function normalizeSet(setLike){
  return [...setLike].map(x=>String(x).toUpperCase()).sort().join("|");
}

function findMatchingGroup(selected4){
  const pick = normalizeSet(selected4);
  for(const g of CONFIG.connectionsGroups){
    const key = normalizeSet(g.words);
    if(key === pick) return g;
  }
  return null;
}

function resetConnections(showToast=false){
  connSelected = new Set();
  connWords = [...CONFIG.connectionsWords];
  connMistakes = 4;
  connSolvedGroups = [];
  connLockedWords = new Set();
  if(connMsg) connMsg.textContent = "";
  renderConnections();
  if(showToast) toast("Connections ready 🟪");
}

renderConnections();

if(connClear){
  connClear.addEventListener("click", ()=>{
    connSelected.clear();
    if(connMsg) connMsg.textContent = "";
    haptic(6);
    renderConnections();
  });
}
if(connShuffle){
  connShuffle.addEventListener("click", ()=>{
    connWords = shuffleArray(connWords);
    if(connMsg) connMsg.textContent = "";
    haptic(6);
    renderConnections();
  });
}
if(connSubmit){
  connSubmit.addEventListener("click", ()=>{
    if(connSelected.size !== 4){
      if(connMsg) connMsg.textContent = "Select exactly 4.";
      haptic(8);
      return;
    }

    const selected = [...connSelected];
    const match = findMatchingGroup(selected);

    if(match){
      const already = connSolvedGroups.some(g => normalizeSet(g.words) === normalizeSet(match.words));
      if(already){
        if(connMsg) connMsg.textContent = "You already found that group.";
        connSelected.clear();
        haptic(8);
        renderConnections();
        return;
      }

      match.words.forEach(w=> connLockedWords.add(w));
      connSolvedGroups.push({ name: match.name, words: [...match.words] });
      connSelected.clear();
      if(connMsg) connMsg.textContent = "Nice! ✅";
      haptic(16);
      renderConnections();

      if(connSolvedGroups.length === 4){
        if(connMsg) connMsg.textContent = "You solved Connections! 🎉";
        if(!Progress.state.connectionsSolved){
          Progress.mark("connectionsSolved", true);
          toast("Connections solved ✅");
          haptic(25);
          if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
        }
      }
      return;
    }

    connMistakes = Math.max(0, connMistakes - 1);
    if(connMsg) connMsg.textContent = connMistakes ? "Not quite — try again." : "No mistakes left.";
    toast(connMistakes ? `Mistakes left: ${connMistakes}` : "Out of mistakes");
    haptic(12);
    connSelected.clear();
    renderConnections();
  });
}

/* =========================
   STRANDS — completion + solved flag
   ========================= */
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

  if(spanFoundWords.size >= total && !Progress.state.strandsSolved){
    Progress.mark("strandsSolved", true);
    toast("Strands solved ✅");
    haptic(25);
    if(spanMsg) spanMsg.textContent = "Theme complete! ⭐";
    if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
  }
}

function resetStrands(showToast=false){
  spanSelected = [];
  spanFoundWords = new Set();
  if(spanMsg) spanMsg.textContent = "";
  renderStrands();
  updateProgress();
  if(showToast) toast("Strands ready 🧵");
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
          haptic(6);
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
      haptic(6);

      const w = selectionWord();
      const themeSet = new Set(SP.themeWords.map(x=>x.toUpperCase()));
      const big = SP.strandsWord.toUpperCase();

      if(themeSet.has(w) || w === big){
        if(!spanFoundWords.has(w)){
          spanFoundWords.add(w);
          if(spanMsg) spanMsg.textContent = (w===big) ? "STRANDS FOUND! ⭐" : "Nice!";
          spanSelected = [];
          renderStrands();
          haptic(16);
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
    haptic(6);
    renderStrands();
  });
}

/* =========================
   FINAL REVEAL
   ========================= */
const revealBtn = $("#revealBtn");
if(revealBtn){
  revealBtn.addEventListener("click", ()=>{
    if(!canOpenReveal()){
      toast("Solve all 4 puzzles first 💝");
      haptic(10);
      return;
    }
    const el = $("#revealContent");
    if(!el) return;
    el.innerHTML = CONFIG.finalRevealHtml;
    el.classList.remove("hidden");
    haptic(20);
  });
}

/* =========================
   APPLY DOUBLE-TAP ZOOM GUARD
   ========================= */
preventDoubleTapZoom($("#wordleBoard"));
preventDoubleTapZoom($("#wordleKeyboard"));
preventDoubleTapZoom($("#miniCrossword"));
preventDoubleTapZoom($("#connGrid"));
preventDoubleTapZoom($("#spanGrid"));
