/* =========================
   CONFIG
   ========================= */
const CONFIG = {
strands: {
  themeTitle: "I Can't Resist",
  cols: 6, // 8 rows inferred from 48 letters
  grid: [
    "C","S","E","G","C","O",
    "A","L","B","A","O","F",
    "R","A","J","I","L","F",
    "E","I","D","O","L","E",
    "O","Q","T","N","O","E",
    "C","U","I","S","A","F",
    "A","Z","T","S","I","O",
    "Z","P","I","A","C","R"
  ],
  themeWords: ["BAGELS","COFFEE","PIZZA","CARAJILLO","CROISSANT","COQUITA"],
  strandsWord: "FOODIE"
},

  wordleSolution: "FLACA",

  connectionsWords: [
    "FLACA","NONA","GATA","KITTY",
    "CHINA","BADDIE","MONKEY NOVIA","FINANCE BRO",
    "BONIS","CHINCU","ADMIN","MENTE",
    "ROL","FEE","TINI","LIGHT"
  ],

  connectionsGroups: [
    { name: "Eca's Nicknames",             words: ["FLACA","NONA","GATA","KITTY"] },
    { name: "Eca's Alter Egos",            words: ["CHINA","BADDIE","MONKEY NOVIA","FINANCE BRO"] },
    { name: "Aliego's Sayings",            words: ["BONIS","CHINCU","ADMIN","MENTE"], revealWords: ["BONIS","HEY CHINCU","ADMIN WORK","BASICAMENTE"] },
    { name: "Your Favorite Drinks",        words: ["ROL","FEE","TINI","LIGHT"], revealWords: ["APEROL","COFFEE","MARTINI","CLIGHT"] }

  ],

  finalRevealHtml: `
    <div class="confetti-layer" id="confettiLayer" aria-hidden="true"></div>

    <div class="reveal-inner is-visible" id="revealInner">
      <h3 class="reveal-anim" style="margin:0 0 10px;">A Little Something</h3>

      <img
        class="reveal-anim is-delay-1"
        id="revealPhoto"
        src="images/42772e2f-4932-40ba-ac46-3ccc095850e8.png"
        alt="Keychain"
        style="
          width:100%;
          max-width:260px;
          margin:16px auto;
          display:block;
          border-radius:14px;
          box-shadow:0 14px 35px rgba(0,0,0,.35);
          cursor:pointer;
        "
      />

      <p class="reveal-anim is-delay-2" style="margin-top:14px;">
        Almenos en una cosa me tenes que copiar! 💚
      </p>

      <div class="reveal-lightbox" id="revealLightbox" aria-hidden="true">
        <div class="lb-card" role="dialog" aria-label="Photo">
          <button class="lb-close" type="button" id="lbClose" aria-label="Close">✕</button>
          <img src="images/42772e2f-4932-40ba-ac46-3ccc095850e8.png" alt="Keychain photo large"/>
        </div>
      </div>
    </div>
  `,

  mini: {
    size: 5,
    blocks: new Set([0, 4, 24]),
    solution: [
      "", "B","E","C","",
      "B","A","G","E","L",
      "E","N","E","R","O",
      "E","D","S","E","L",
      "R","A","T","S",""
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
  "strands-intro","strands",
  "reveal"
]);


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

  // allow scratch card to remount cleanly when navigating away and back
  if(activeView === "reveal" && name !== "reveal"){
    resetRevealScratchMount();
  }

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

    // Mount scratch card AFTER the view is actually active (prevents missing pointer listeners)
    if(name === "reveal"){
      resetRevealScratchMount();
      requestAnimationFrame(()=> mountRevealScratch());
    }

    const navName =
      (name === "strands") ? "strands-intro" :
      (name === "connections") ? "connections-intro" :
      (name === "wordle") ? "wordle-intro" :
      (name === "mini") ? "mini-intro" :
      name;
applyImmersiveMode(name);
    window.scrollTo({ top: 0 });

    if(name === "wordle") {
      const hi = $("#wordleHiddenInput");
      if(hi) hi.focus({ preventScroll: true });
      requestAnimationFrame(()=> tuneWordleKeyboardLayout());
      setTimeout(()=> tuneWordleKeyboardLayout(), 180);
    }


    if(name === "connections") {
      requestAnimationFrame(()=> tuneConnectionsLayout());
      setTimeout(()=> tuneConnectionsLayout(), 180);
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


// --- Mini completion feedback (NEW)
let miniDidCelebrate = false;
let miniLastFullKey = "";
let miniBannerTimer = null;

function miniAllFilled(){
  for(let i=0;i<MP.size*MP.size;i++){
    if(isBlock(i)) continue;
    const got = (miniLetters[i] || "").toUpperCase();
    if(!got) return false;
  }
  return true;
}

function miniLettersKey(){
  // stable "snapshot" of the grid (non-block cells)
  let s = "";
  for(let i=0;i<MP.size*MP.size;i++){
    if(isBlock(i)) continue;
    s += (miniLetters[i] || "_").toUpperCase();
  }
  return s;
}

function ensureMiniBanner(){
  let el = document.getElementById("miniWinBanner");
  if(el) return el;

  const host = document.querySelector("#view-mini .mini-game");
  if(!host) return null;

  el = document.createElement("div");
  el.id = "miniWinBanner";
  el.setAttribute("role","status");
  el.setAttribute("aria-live","polite");
  el.textContent = "";
  host.appendChild(el);
  return el;
}

function showMiniBanner(msg){
  const el = ensureMiniBanner();
  if(!el) return;

  el.textContent = msg || "";
  el.classList.add("is-visible");

  if(miniBannerTimer) clearTimeout(miniBannerTimer);
  miniBannerTimer = setTimeout(()=> el.classList.remove("is-visible"), 1800);
}

function prefersReducedMotion(){
  try{
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }catch(_){ return false; }
}

function miniWaveCelebrate(){
  if(!miniCrossword) return;
  if(prefersReducedMotion()) return;

  miniCrossword.classList.remove("mini-win");
  // force reflow to allow retrigger if needed
  void miniCrossword.offsetWidth;
  miniCrossword.classList.add("mini-win");

  setTimeout(()=> miniCrossword.classList.remove("mini-win"), 900);
}

function miniShakeAll(){
  if(!miniCrossword) return;
  if(prefersReducedMotion()) return;

  const cells = Array.from(miniCrossword.querySelectorAll(".mini-cell:not(.block)"));
  cells.forEach(c=> c.classList.add("shake"));

  try{
    if(typeof navigator !== "undefined" && navigator.vibrate){
      navigator.vibrate([18, 28, 18]);
    }
  }catch(_){}

  setTimeout(()=> cells.forEach(c=> c.classList.remove("shake")), 320);
}

function miniCheckFilledButWrong(){
  if(Progress.state.miniSolved) return;
  if(!miniAllFilled()) { miniLastFullKey = ""; return; }
  if(miniAllFilledCorrect()) return;

  const key = miniLettersKey();
  if(key && key !== miniLastFullKey){
    miniLastFullKey = key;
    miniShakeAll();
  }
}

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
  "Go to - 4.answer",
  "Boiled-and-baked icon with two rival cities",
  "Nuestro mes",
  "Ford Flop (🫣)",
  "Eca's least favorite New Yorkers"
];

const MINI_DOWN_CLUES = [
  "Silvestre y la Naranja and The Killers, por ejemplo",
  "Discharge, expel waste (🫣)",
  "Worth the wait NYC pipsha",
  "Diego's go to drink”",
  "Online chuckle"
];

function entryClueText(dir, entry, idxInDir){
  const list = (dir === "across") ? MINI_ACROSS_CLUES : MINI_DOWN_CLUES;
  const clue = list[idxInDir] || "—";
  return `${entry.num} — ${clue}`;
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
  let waveIndex = 0;
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
    letter.style.setProperty("--i", String(waveIndex++));
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

  // Completion / wrong-completion feedback
  // Celebrate on every successful solve of the current grid (even if already marked solved in Progress).
  if(miniAllFilledCorrect()){
    if(!miniDidCelebrate){
      miniDidCelebrate = true;
      miniWaveCelebrate();
      showMiniBanner("Congrats — you completed the puzzle! 🎉");
    }
    // Only mark Progress once
    if(!Progress.state.miniSolved){
      Progress.mark("miniSolved", true);
      toast("Mini solved ✅");
      haptic(20);
      miniStopTimer();
      if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
    }
  }else{
    // If the player edits after celebrating, allow celebrating again on a later correct completion
    miniDidCelebrate = false;
    // If every cell is filled but incorrect, shake once per distinct filled grid
    miniCheckFilledButWrong();
  }

}


function miniReset(showToast=false){
  miniLetters = new Array(MP.size*MP.size).fill("");
  miniDidCelebrate = false;
  miniLastFullKey = "";
  miniSelected = pickFirstCell();
  miniDir = "across";
  miniClueIndex = 0;
  renderMini();
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

  // ✅ Always allow delete (even when hidden input is focused)
  if(e.key === "Backspace"){
    e.preventDefault();
    return clearMiniLetter();
  }

  // ✅ Prevent double-typing when the hidden input is handling letters
  if(document.activeElement === miniHiddenInput) return;

  if(/^[a-zA-Z]$/.test(e.key)) setMiniLetter(e.key);
});


if(miniHiddenInput){
  miniHiddenInput.addEventListener("input", ()=>{
    const v = (miniHiddenInput.value || "").toUpperCase().replace(/[^A-Z]/g,"");
    if(v) setMiniLetter(v.slice(-1));
    miniHiddenInput.value = "";
  });

  miniHiddenInput.addEventListener("keydown", (e)=>{
    if(e.key === "Backspace"){
      e.preventDefault();
      clearMiniLetter();
    }
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

function tuneConnectionsLayout(){
  // CSS is the single source of truth for Connections sizing.
  // (NYT-style: let the grid decide width; only adjust via media queries in CSS.)
  return;
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

window.addEventListener("resize", ()=>{
  if(activeView === "connections") tuneConnectionsLayout();
});

window.addEventListener("orientationchange", ()=>{
  if(activeView === "wordle") setTimeout(()=> tuneWordleKeyboardLayout(), 150);
});

window.addEventListener("orientationchange", ()=>{
  if(activeView === "connections") setTimeout(()=> tuneConnectionsLayout(), 150);
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
    setTimeout(()=> setMsg(`Out of tries! Try Again!`), 740);
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

let connAnimating = false;

function setConnectionsAnimating(on){
  connAnimating = !!on;
  const view = document.getElementById("view-connections");
  if(view) view.classList.toggle("is-animating", connAnimating);
}

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* --- Stable tier mapping (lets you choose which group is purple, etc.)
   Add optional `tier: 0|1|2|3` to CONFIG.connectionsGroups entries.
   If omitted, tier defaults to the group's order in CONFIG.connectionsGroups.
   0=yellow, 1=green, 2=blue, 3=purple
*/
function connKey(list){
  return [...list].map(x=>String(x).toUpperCase()).sort().join("|");
}
function normalizeSet(setLike){
  return connKey(setLike);
}
function buildConnTierMap(){
  const map = new Map();
  (CONFIG.connectionsGroups || []).forEach((g, i)=>{
    map.set(connKey(g.words), (g.tier ?? i));
  });
  return map;
}
let CONN_GROUP_TIER = buildConnTierMap();

/* --- Solved rows container (inserted above the grid) --- */
function ensureConnSolvedUI(){
  const host = $("#view-connections .connections-game");
  if(!host) return null;

  let box = $("#connSolved");
  if(box) return box;

  box = document.createElement("div");
  box.id = "connSolved";
  host.insertBefore(box, connGrid);
  return box;
}

let __connSolvedRenderKey = "";

function renderConnSolved(hideLastWords=false){
  const box = ensureConnSolvedUI();
  if(!box) return;

  const key = JSON.stringify({
    hideLastWords: !!hideLastWords,
    mistakes: connMistakes,
    groups: connSolvedGroups.map(g=>({
      name: g.name,
      tier: g.tier,
      animated: g.animated,
      words: g.words,
      revealWords: g.revealWords
    }))
  });

  if(key === __connSolvedRenderKey) return;
  __connSolvedRenderKey = key;

  box.innerHTML = "";

  connSolvedGroups.forEach((g, idx)=>{
    const row = document.createElement("div");
    row.className = `conn-solved-row conn-tier-${g.tier}` + ((idx === connSolvedGroups.length - 1 && g.animated === false) ? " is-pop" : "");

    const title = document.createElement("div");
    title.className = "conn-solved-title";
    title.textContent = g.name;

    const words = document.createElement("div");
    words.className = "conn-solved-words";

    const isLast = (idx === connSolvedGroups.length - 1);
    const hideThisGroup = !!(hideLastWords && isLast && g.animated === false);

    const displayWords = (g.animated ? (g.revealWords || g.words) : g.words);

    displayWords.forEach(w=>{
      const span = document.createElement("span");
      span.className = "conn-solved-word";
      span.dataset.word = w;
      span.textContent = w;

      if(hideThisGroup){
        span.classList.add("is-hidden");
      }else{
        // always keep previously-solved groups visible so they don't "flash" on later clicks
        span.classList.add("is-revealed");
      }

      words.appendChild(span);
    });

    row.appendChild(title);
    row.appendChild(words);
    box.appendChild(row);
  });

  const dots = $$("#view-connections .dot");
  dots.forEach((d, i)=> d.style.opacity = (i < connMistakes) ? "1" : "0.18");
}

function remainingConnWords(){
  return connWords.filter(w => !connLockedWords.has(w));
}

/* --- NYT-style "combine into group" animation --- */
function animateConnGroupSolve(selectedWords){
  if(!connGrid) return;

  // capture start rects from current grid tiles
  const tiles = Array.from(connGrid.querySelectorAll(".conn-word"));
  const starts = new Map();
  selectedWords.forEach(w=>{
    const el = tiles.find(b => (b.textContent || "").trim() === w);
    if(el) starts.set(w, { el, rect: el.getBoundingClientRect() });
  });

  const box = $("#connSolved");
  const lastRow = box ? box.lastElementChild : null;
  if(!lastRow) return;

  const targets = new Map();
  Array.from(lastRow.querySelectorAll(".conn-solved-word")).forEach(t=>{
    const w = (t.dataset.word || t.textContent || "").trim();
    targets.set(w, { el: t, rect: t.getBoundingClientRect() });
  });

  const clones = [];
  selectedWords.forEach(w=>{
    const s = starts.get(w);
    const t = targets.get(w);
    if(!s || !t) return;

    t.el.classList.remove("is-revealed");

    const c = document.createElement("div");
    c.className = "conn-fly";
    c.textContent = w;

    const r = s.rect;
    c.style.left = `${r.left}px`;
    c.style.top = `${r.top}px`;
    c.style.width = `${r.width}px`;
    c.style.height = `${r.height}px`;

    c.style.background = getComputedStyle(s.el).backgroundColor;
    c.style.color = getComputedStyle(s.el).color;
    c.style.letterSpacing = getComputedStyle(s.el).letterSpacing;
    c.style.fontSize = getComputedStyle(s.el).fontSize;

    document.body.appendChild(c);
    clones.push({ c, from: s.rect, to: t.rect, target: t.el });
  });

  requestAnimationFrame(()=>{
    clones.forEach(({ c, from, to })=>{
      const dx = (to.left + to.width/2) - (from.left + from.width/2);
      const dy = (to.top  + to.height/2) - (from.top  + from.height/2);
      const sx = to.width  / from.width;
      const sy = to.height / from.height;

      c.style.transition = "transform 360ms cubic-bezier(.2,.8,.2,1), opacity 260ms ease";
      c.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      c.style.opacity = "1";
    });
  });

  setTimeout(()=>{
  clones.forEach(({ c, target })=>{
    target.classList.remove("is-hidden");
    target.classList.add("is-revealed");
    c.style.opacity = "0";
  });
}, 330);

  setTimeout(()=>{
    clones.forEach(({ c })=> c.remove());
  }, 520);
}

function renderConnections(){
  if(!connGrid) return;

  renderConnSolved(false);
  connGrid.innerHTML = "";

  remainingConnWords().forEach(w=>{
    const b = document.createElement("button");
    b.className = "conn-word";
    b.textContent = w;
    if(connSelected.has(w)) b.classList.add("selected");

    b.addEventListener("click", ()=>{
      if(connAnimating) return;

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

  tuneConnectionsLayout();
}

function findMatchingGroup(selected4){
  const pick = normalizeSet(selected4);
  for(const g of CONFIG.connectionsGroups){
    if(normalizeSet(g.words) === pick) return g;
  }
  return null;
}

function resetConnections(showToast=false){
  setConnectionsAnimating(false);
  connSelected = new Set();
  connWords = [...CONFIG.connectionsWords];
  connMistakes = 4;
  connSolvedGroups = [];
  connLockedWords = new Set();
  CONN_GROUP_TIER = buildConnTierMap();
  if(connMsg) connMsg.textContent = "";
  renderConnections();
}

/* --- Connections: "one away" + shake feedback on wrong submit (NYT-ish) --- */
function connIsOneAway(selected4){
  try{
    const sel = new Set(selected4.map(w=>String(w).toUpperCase()));

    // consider only groups not already solved
    const solvedKeys = new Set(connSolvedGroups.map(g => normalizeSet(g.words)));

    for(const g of (CONFIG.connectionsGroups || [])){
      const key = normalizeSet(g.words);
      if(solvedKeys.has(key)) continue;

      const words = (g.words || []).map(w=>String(w).toUpperCase());
      let hit = 0;
      for(const w of words){
        if(sel.has(w)) hit++;
      }
      if(hit === 3) return true;
    }
  }catch(_){}
  return false;
}

function connShakeSelection(selected4){
  if(!connGrid) return;
  const tiles = Array.from(connGrid.querySelectorAll(".conn-word.selected"));
  tiles.forEach(el=> el.classList.add("shake"));

  // stronger haptic for error
  try{
    if(typeof navigator !== "undefined" && navigator.vibrate){
      navigator.vibrate([18, 28, 18]);
    }
  }catch(_){}

  // remove shake class after animation so future selection isn't affected
  setTimeout(()=>{
    tiles.forEach(el=> el.classList.remove("shake"));
  }, 320);
}

renderConnections();

if(connClear){
  connClear.addEventListener("click", ()=>{
    if(connAnimating) return;
    connSelected.clear();
    if(connMsg) connMsg.textContent = "";
    haptic(6);
    renderConnections();
  });
}
if(connShuffle){
  connShuffle.addEventListener("click", ()=>{
    if(connAnimating) return;
    connWords = shuffleArray(connWords);
    if(connMsg) connMsg.textContent = "";
    haptic(6);
    renderConnections();
  });
}
if(connSubmit){
  connSubmit.addEventListener("click", ()=>{
    if(connAnimating) return;

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

      const tier = Math.max(0, Math.min(3, (match.tier ?? CONN_GROUP_TIER.get(normalizeSet(match.words)) ?? connSolvedGroups.length)));

      setConnectionsAnimating(true);

      match.words.forEach(w=> connLockedWords.add(w));
      connSolvedGroups.push({ name: match.name, words: [...match.words], revealWords: match.revealWords ? [...match.revealWords] : undefined, tier, animated: false });

// Build solved bars (hide newest group's words so they can fly in)
renderConnSolved(true);
animateConnGroupSolve([...match.words]);

      connSelected.clear();
      if(connMsg) connMsg.textContent = "Nice! ✅";
      haptic(16);

      setTimeout(()=>{
  // mark newest group as fully revealed so it won't flash on later clicks
  const last = connSolvedGroups[connSolvedGroups.length - 1];
  if(last) last.animated = true;
  renderConnSolved(false);

  renderConnections();
  setConnectionsAnimating(false);

        if(connSolvedGroups.length === 4){
          if(connMsg) connMsg.textContent = "You solved Connections! 🎉";
          if(!Progress.state.connectionsSolved){
            Progress.mark("connectionsSolved", true);
            toast("Connections solved ✅");
            haptic(25);
            if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
          }
        }
      }, 420);

      return;
    }

    connMistakes = Math.max(0, connMistakes - 1);

    const oneAway = connIsOneAway(selected);
    if(connMsg) connMsg.textContent = connMistakes
      ? (oneAway ? "One away… 👀" : "Not quite — try again.")
      : "No mistakes left.";

    toast(connMistakes ? (oneAway ? "One away…" : `Mistakes left: ${connMistakes}`) : "Out of mistakes");

    // Shake the currently-selected tiles before clearing selection
    setConnectionsAnimating(true);
    connShakeSelection(selected);

    setTimeout(()=>{
      connSelected.clear();
      renderConnections();
      setConnectionsAnimating(false);
    }, 320);
});
}

/* =========================
   STRANDS — NYT-style drag selection + spanagram
   - Smooth pointer (drag) selection
   - Backtrack by dragging to previous cell
   - Lock theme words (blue) + spanagram (yellow)
   - No hint logic (just selection + validation)
   ========================= */
const spanThemeHelp = $("#spanThemeHelp");
const spanThemeTitle = $("#spanThemeTitle");
const spanGridEl = $("#spanGrid");
const spanMsg = $("#spanMsg");
const spanCurrent = $("#spanCurrent");
const spanClear = $("#spanClear");
const spanProgress = $("#spanProgress");

const SP = CONFIG.strands;
if (spanThemeTitle) spanThemeTitle.textContent = SP.themeTitle;

// --- state
let spanSelecting = false;
let spanPointerId = null;

let spanPath = []; // live selection: [idx, idx, ...]
let spanFoundWords = new Set(); // words found (includes spanagram)
let spanFoundPaths = []; // [{ word, type: "theme"|"spanagram", indices: [...] }]

// --- helpers
function sIdxToRC(idx){ return { r: Math.floor(idx / SP.cols), c: idx % SP.cols }; }
function isAdjacent(a,b){
  const A = sIdxToRC(a), B = sIdxToRC(b);
  return Math.abs(A.r-B.r) <= 1 && Math.abs(A.c-B.c) <= 1 && !(A.r === B.r && A.c === B.c);
}
function selectionWord(indices){
  return indices.map(i => SP.grid[i]).join("").toUpperCase();
}
function setSpanMsg(t){
  if(spanMsg) spanMsg.textContent = t || "";
}

function setSpanCurrent(t){
  if(spanCurrent) spanCurrent.textContent = t || "";
}

function updateProgress(){
  const total = (SP.themeWords?.length || 0) + 1; // + spanagram
  if(spanProgress) spanProgress.textContent = `${spanFoundWords.size} of ${total} theme words found.`;

  if(spanFoundWords.size >= total && !Progress.state.strandsSolved){
    Progress.mark("strandsSolved", true);
    toast("Strands solved ✅");
    haptic(25);
    setSpanMsg("Theme complete! ⭐");
    if(Progress.allSolved()) toast("Final Reveal unlocked 🎁");
  }
}

// --- grid build (once)
function buildStrandsGrid(){
  if(!spanGridEl) return;

  spanGridEl.innerHTML = "";

  SP.grid.forEach((ch, idx)=>{
    const cell = document.createElement("div");
    cell.className = "span-cell";
    cell.textContent = String(ch || "").toUpperCase();
    cell.dataset.idx = String(idx);
    spanGridEl.appendChild(cell);
  });

  //if(spanThemeHelp) spanThemeHelp.textContent = `Today’s theme: ${SP.themeTitle}`;
}

// --- SVG overlay for "bubbles + connectors"
function ensureSpanSvg(){
  if(!spanGridEl) return null;
  let svg = spanGridEl.querySelector("svg.span-svg");
  if(svg) return svg;

  // Make sure the grid is a positioning context (CSS will reinforce this later)
  spanGridEl.style.position = spanGridEl.style.position || "relative";

  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "span-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";
  spanGridEl.appendChild(svg);
  return svg;
}

function cellElByIdx(idx){
  return spanGridEl ? spanGridEl.querySelector(`.span-cell[data-idx="${idx}"]`) : null;
}

function cellCenter(idx){
  const cell = cellElByIdx(idx);
  if(!cell || !spanGridEl) return null;
  const gridRect = spanGridEl.getBoundingClientRect();
  const r = cell.getBoundingClientRect();
  return {
    x: (r.left - gridRect.left) + (r.width / 2),
    y: (r.top  - gridRect.top)  + (r.height / 2),
    w: r.width,
    h: r.height
  };
}

function clearSvg(svg){
  while(svg && svg.firstChild) svg.removeChild(svg.firstChild);
}

function svgEl(name){
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function drawPath(svg, indices, type, opts = {}){
  if(!svg || !indices || indices.length === 0) return;

  const centers = indices.map(cellCenter).filter(Boolean);
  if(!centers.length) return;

  // sizes tuned visually; CSS will refine colors later
  const r = opts.radius ?? Math.max(14, Math.min(centers[0].w, centers[0].h) * 0.55);
  const stroke = opts.stroke ?? Math.max(10, r * 0.95);

  // connectors
  for(let i=0;i<centers.length-1;i++){
    const a = centers[i], b = centers[i+1];
    const line = svgEl("line");
    line.setAttribute("x1", String(a.x));
    line.setAttribute("y1", String(a.y));
    line.setAttribute("x2", String(b.x));
    line.setAttribute("y2", String(b.y));
    line.setAttribute("stroke-width", String(stroke));
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("class", `span-link ${type} ${opts.preview ? "preview" : ""}`.trim());
    svg.appendChild(line);
  }

  // bubbles
  centers.forEach((p)=>{
    const c = svgEl("circle");
    c.setAttribute("cx", String(p.x));
    c.setAttribute("cy", String(p.y));
    c.setAttribute("r", String(r));
    c.setAttribute("class", `span-bubble ${type} ${opts.preview ? "preview" : ""}`.trim());
    svg.appendChild(c);
  });
}

function updateStrandsVisual(){
  if(!spanGridEl) return;
  const svg = ensureSpanSvg();
  if(!svg) return;

  clearSvg(svg);

  // Found paths first (so live preview draws on top)
  spanFoundPaths.forEach(p=>{
    drawPath(svg, p.indices, p.type, { preview: false });
  });

  // Live selection on top
  if(spanPath.length){
    drawPath(svg, spanPath, "preview", { preview: true });
  }
}

// --- selection mechanics (pointer drag)
function idxFromPoint(clientX, clientY){
  const el = document.elementFromPoint(clientX, clientY);
  const cell = el ? el.closest(".span-cell") : null;
  if(!cell || !spanGridEl || !spanGridEl.contains(cell)) return null;
  const idx = Number(cell.dataset.idx);
  return Number.isFinite(idx) ? idx : null;
}

function beginSelect(idx){
  spanPath = [idx];
  setSpanCurrent(selectionWord(spanPath));
  updateStrandsVisual();
  haptic(6);
}

function tryExtendPath(idx){
  if(spanPath.length === 0) return beginSelect(idx);

  const last = spanPath[spanPath.length - 1];
  if(idx === last) return;

  // backtrack if dragging to previous cell
  if(spanPath.length >= 2 && idx === spanPath[spanPath.length - 2]){
    spanPath.pop();
    setSpanCurrent(selectionWord(spanPath));
    updateStrandsVisual();
    haptic(4);
    return;
  }

  // don't reuse a cell in the same selection
  if(spanPath.includes(idx)) return;

  if(isAdjacent(last, idx)){
    spanPath.push(idx);
    setSpanCurrent(selectionWord(spanPath));
    updateStrandsVisual();
    haptic(4);
  }
}

function finalizeSelection(){
  if(!spanPath.length){
    setSpanCurrent("");
    // keep any status message as-is
    updateStrandsVisual();
    return;
  }

  const w = selectionWord(spanPath);
  setSpanCurrent("");
  const themeSet = new Set((SP.themeWords || []).map(x => String(x).toUpperCase()));
  const spanagram = String(SP.strandsWord || "").toUpperCase();

  let type = null;
  if(w === spanagram) type = "spanagram";
  else if(themeSet.has(w)) type = "theme";

  if(type){
    if(!spanFoundWords.has(w)){
      spanFoundWords.add(w);
      spanFoundPaths.push({ word: w, type, indices: [...spanPath] });

      setSpanMsg(type === "spanagram" ? "SPANAGRAM! ⭐" : "Esooooooo!");
      toast(type === "spanagram" ? "Spanagram found ⭐" : "Theme word found ✅");
      haptic(18);

      updateProgress();
    }else{
      setSpanMsg("Already found.");
      haptic(8);
    }
  }else{
    setSpanMsg("");
    setSpanCurrent("");
  setSpanCurrent("");
    haptic(8);
  }

  spanPath = [];
  updateStrandsVisual();
}

// --- wire events
function wireStrandsPointerEvents(){
  if(!spanGridEl) return;

  // prevent native gestures while selecting
  spanGridEl.style.touchAction = "none";

  spanGridEl.addEventListener("pointerdown", (e)=>{
    const idx = idxFromPoint(e.clientX, e.clientY);
    if(idx == null) return;

    spanSelecting = true;
    spanPointerId = e.pointerId;

    spanGridEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();

    beginSelect(idx);
  });

  spanGridEl.addEventListener("pointermove", (e)=>{
    if(!spanSelecting) return;
    if(spanPointerId != null && e.pointerId !== spanPointerId) return;

    const idx = idxFromPoint(e.clientX, e.clientY);
    if(idx == null) return;

    e.preventDefault();
    tryExtendPath(idx);
  });

  function end(e){
    if(!spanSelecting) return;
    if(spanPointerId != null && e.pointerId !== spanPointerId) return;

    spanSelecting = false;
    spanPointerId = null;

    e.preventDefault();
    finalizeSelection();
  }

  spanGridEl.addEventListener("pointerup", end);
  spanGridEl.addEventListener("pointercancel", end);
  spanGridEl.addEventListener("lostpointercapture", (e)=>{
    if(spanSelecting){
      spanSelecting = false;
      spanPointerId = null;
      finalizeSelection();
    }
  });

  // keep overlay aligned on resize/orientation changes
  window.addEventListener("resize", ()=> updateStrandsVisual());
  window.addEventListener("orientationchange", ()=> setTimeout(()=> updateStrandsVisual(), 150));
}

function resetStrands(showToast=false){
  spanSelecting = false;
  spanPointerId = null;
  spanPath = [];
  spanFoundWords = new Set();
  spanFoundPaths = [];
  setSpanMsg("");
  setSpanCurrent("");
  updateProgress();
  updateStrandsVisual();
}

// init
buildStrandsGrid();
wireStrandsPointerEvents();
resetStrands(false);

if(spanClear){
  spanClear.addEventListener("click", ()=>{
    spanPath = [];
    setSpanMsg("");
    setSpanCurrent("");
  setSpanCurrent("");
    updateStrandsVisual();
    haptic(6);
  });
}


/* =========================
   FINAL REVEAL — SCRATCH CARD (NEW)
   - No "Open" button: scratch to reveal
   - Underlay is CONFIG.finalRevealHtml
   ========================= */
let __scratchMounted = false;
let __scratchDone = false;
let __scratchCleanup = null;

function mountRevealScratch(){
  if(__scratchMounted) return;
  if(activeView !== "reveal") return;

  const msg = $("#scratchMsg");

  // If not unlocked, keep the view as "locked"
  if(!canOpenReveal()){
    if(msg) msg.textContent = "Finish all 4 puzzles to unlock 💝";
    return;
  }

  const card = $("#scratchCard");
  const under = $("#scratchUnder");
  const canvas = $("#scratchCanvas");
  const hint = $("#scratchHint");


  if(!card || !under || !canvas){
    return;
  }

  // Inject reveal content under the scratch layer
  under.innerHTML = CONFIG.finalRevealHtml;

  const ctx = canvas.getContext("2d");
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  // iOS Safari can fire resize events as the address bar collapses/expands.
  // If we repaint the cover on resize, it "unscratches" everything.
  // So we only repaint while the user hasn't started scratching yet.
  let hasScratched = false;

  function paintCover(){
    const rect = card.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Paint scratch surface (a soft "silver" layer)
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0,0,w,h);

    // base
    ctx.fillStyle = "#3b3b3b";
    ctx.fillRect(0,0,w,h);

    // subtle speckle noise so it feels like a scratch ticket
    for(let i=0;i<220;i++){
      const x = Math.random()*w;
      const y = Math.random()*h;
      const r = 0.6 + Math.random()*1.8;
      ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random()*0.06})`;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    }

    // thin highlight strip
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(0, 0, w, 38);

    // set erase mode
    ctx.globalCompositeOperation = "destination-out";
  }

  paintCover();
  const onScratchResize = ()=>{
    // If the user already scratched, don't repaint (it would reset progress).
    if(__scratchDone) return;
    if(!hasScratched) paintCover();
  };
  const onScratchOrient = ()=> setTimeout(onScratchResize, 150);
  window.addEventListener("resize", onScratchResize);
  window.addEventListener("orientationchange", onScratchOrient);

  let drawing = false;
  let lastPt = null;
  let brushRadius = 30;

  function posFromEvent(e){
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  }

  function scratchAt(x, y, radius, last){
    // "Gradient scratch":
    // - We erase with a soft radial falloff (not a hard circle)
    // - The center erases more than the edges
    // - Multiple passes make it progressively clearer (like real scratching)

    function eraseDot(px, py){
      const g = ctx.createRadialGradient(px, py, 0, px, py, radius);
      // alpha here controls how much we erase per pass (destination-out)
      g.addColorStop(0.0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.55, "rgba(0,0,0,0.22)");
      g.addColorStop(1.0, "rgba(0,0,0,0.00)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI*2);
      ctx.fill();
    }

    if(!last){
      eraseDot(x, y);
      return;
    }

    const dx = x - last.x;
    const dy = y - last.y;
    const dist = Math.hypot(dx, dy);

    // Step smaller than radius so the stroke is continuous
    const step = Math.max(2, radius * 0.45);
    const n = Math.max(1, Math.ceil(dist / step));
    for(let i=1;i<=n;i++){
      const t = i / n;
      eraseDot(last.x + dx * t, last.y + dy * t);
    }
  }

  // NOTE: No auto-reveal, and no reveal button.
  // The player can scratch as little or as much as they want.

  function onDown(e){
    if(__scratchDone) return;
    drawing = true;
    lastPt = null;
    hasScratched = true;
    // Larger brush on touch so it feels effortless
    brushRadius = (e.pointerType === "touch" || e.pointerType === "pen") ? 44 : 32;
    canvas.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    if(hint) hint.style.opacity = "0";
    const p = posFromEvent(e);
    scratchAt(p.x, p.y, brushRadius, null);
    lastPt = p;
  }

  function onMove(e){
    if(!drawing || __scratchDone) return;
    e.preventDefault();
    const p = posFromEvent(e);
    scratchAt(p.x, p.y, brushRadius, lastPt);
    lastPt = p;
  }

  function onUp(e){
    if(!drawing) return;
    drawing = false;
    lastPt = null;
    e.preventDefault();
    // No auto-reveal messaging; let the player keep scratching or stop anytime.
    if(msg) msg.textContent = "";
  }

  canvas.addEventListener("pointerdown", onDown, { passive: false });
  canvas.addEventListener("pointermove", onMove, { passive: false });
  canvas.addEventListener("pointerup", onUp, { passive: false });
  canvas.addEventListener("pointercancel", onUp, { passive: false });

  // iOS: avoid page bounce while scratching
  const onTouchMove = (e)=>{ if(drawing && !__scratchDone) e.preventDefault(); };
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });

  // Ensure we can fully unmount + avoid duplicate listeners (which can repaint the cover later).
  __scratchCleanup = ()=>{
    try{ window.removeEventListener("resize", onScratchResize); }catch(_){ }
    try{ window.removeEventListener("orientationchange", onScratchOrient); }catch(_){ }
    try{ canvas.removeEventListener("pointerdown", onDown); }catch(_){ }
    try{ canvas.removeEventListener("pointermove", onMove); }catch(_){ }
    try{ canvas.removeEventListener("pointerup", onUp); }catch(_){ }
    try{ canvas.removeEventListener("pointercancel", onUp); }catch(_){ }
    try{ canvas.removeEventListener("touchmove", onTouchMove); }catch(_){ }
    if(revealBtn){
      try{ revealBtn.onclick = null; }catch(_){ }
    }
  };
  __scratchMounted = true;
  __scratchDone = false;
  card.classList.remove("is-done");
  if(msg) msg.textContent = "";
  if(hint) hint.style.opacity = "1";
}

function resetRevealScratchMount(){
  try{ __scratchCleanup && __scratchCleanup(); }catch(_){ }
  __scratchCleanup = null;
  __scratchMounted = false;
  __scratchDone = false;
}

/* =========================
   APPLY DOUBLE-TAP ZOOM GUARD
   ========================= */
preventDoubleTapZoom($("#wordleBoard"));
preventDoubleTapZoom($("#wordleKeyboard"));
preventDoubleTapZoom($("#miniCrossword"));
preventDoubleTapZoom($("#connGrid"));
preventDoubleTapZoom($("#spanGrid"));

/* ===== WELCOME SCREEN LOGIC ===== */
const welcomeBtn = document.getElementById("welcomeContinue");
const welcomeScreen = document.getElementById("welcome-screen");

// Smooth fade/slide transition from Welcome -> Main menu
const WELCOME_FADE_MS = 320;

try{
  if(welcomeScreen && !welcomeScreen.classList.contains("hidden")){
    document.body.classList.add("welcome-active");
    if(mainRoot) mainRoot.setAttribute("aria-hidden","true");
  }
}catch(_){}

if(welcomeBtn && welcomeScreen){
  welcomeBtn.addEventListener("click", ()=>{
    // Start exit animation
    welcomeScreen.classList.add("is-hiding");
    welcomeScreen.setAttribute("aria-hidden","true");

    // Reveal the main menu underneath (CSS handles the fade-in)
    try{
      document.body.classList.remove("welcome-active");
      if(mainRoot) mainRoot.removeAttribute("aria-hidden");
    }catch(_){}

    // After animation completes, remove from layout
    setTimeout(()=>{
      welcomeScreen.classList.add("hidden");
      welcomeScreen.classList.remove("is-hiding");
    }, WELCOME_FADE_MS);
  });
}