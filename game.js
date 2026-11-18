/* =========================================
   game.js  (load 3rd, last)
   All the game logic in one file. Sections, top to bottom:
     1. SAVED PROGRESS      coins, best scores, unlocks (localStorage)
     2. HELPERS & SOUND     shortcuts, beeps, pop-up messages
     3. GAME STATE          the variables that change while playing
     4. SCREEN DRAWING      cake, customer queue, order ticket, buttons, recipe book
     5. GAME FLOW           timers, serving, scoring, end of game
     6. DIFFICULTY          the mode selector on the start screen
     7. STARTUP             connects buttons to functions (runs last)
   Needs: config.js and art.js loaded before this file.
   ========================================= */


/* =========================================
   1. SAVED PROGRESS
   ========================================= */

function readSavedNumber(key) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch(error) {
    return 0;
  }
}

function readSavedObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch(error) {
    return {};
  }
}

let coins = readSavedNumber("cakeDashCoins");
let bestScores = readSavedObject("cakeDashBestByMode");

/* Old saves had one best score: count it as the Normal best. */
if(bestScores.normal === undefined && readSavedNumber("cakeDashBest") > 0) {
  bestScores.normal = readSavedNumber("cakeDashBest");
}

let difficulty = "normal";
try {
  const savedMode = localStorage.getItem("cakeDashDifficulty");
  if(DIFFICULTIES[savedMode]) difficulty = savedMode;
} catch(error) {}

function orderSeconds() { return DIFFICULTIES[difficulty].seconds; }
function bestForMode()  { return Number(bestScores[difficulty]) || 0; }

let unlocked = readSavedObject("cakeDashUnlocked");

LAYERS.forEach(layer => {
  INGREDIENTS[layer].forEach(item => {
    if(item.unlocked) unlocked[item.id + "_" + layer] = true;
  });
});

function isUnlocked(layer,id) {
  return !!unlocked[id + "_" + layer];
}

function saveProgress() {
  try {
    localStorage.setItem("cakeDashCoins",coins);
    localStorage.setItem("cakeDashBestByMode",JSON.stringify(bestScores));
    localStorage.setItem("cakeDashDifficulty",difficulty);
    localStorage.setItem("cakeDashUnlocked",JSON.stringify(unlocked));
  } catch(error) {
    console.warn("Progress could not be saved.");
  }
}

function availableIngredients(layer) {
  return INGREDIENTS[layer].filter(item => isUnlocked(layer,item.id));
}


/* =========================================
   2. HELPERS & SOUND
   ========================================= */

const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

function findItem(layer,id) {
  return INGREDIENTS[layer].find(item => item.id === id);
}

function formatTime(seconds) {
  const s = Math.max(0,Math.ceil(seconds));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  $(id).classList.add("active");
}

/* Sound effects: [pitch, length]. To add a sound, add a line and call playSound("name"). */
let audioContext = null;

function playSound(type) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();

    if(audioContext.state === "suspended") audioContext.resume();

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    const sounds = {
      click:[440,.06],
      select:[550,.08],
      success:[660,.15],
      wrong:[180,.18],
      unlock:[880,.25],
      bake:[330,.35]
    };

    const [frequency,duration] = sounds[type] || sounds.click;

    osc.frequency.setValueAtTime(frequency,audioContext.currentTime);

    if(type === "success" || type === "unlock") {
      osc.frequency.exponentialRampToValueAtTime(
        frequency*1.5,
        audioContext.currentTime+duration
      );
    }

    gain.gain.setValueAtTime(.12,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioContext.currentTime+duration
    );

    osc.start();
    osc.stop(audioContext.currentTime+duration);
  } catch(error) {}
}

/* Small pop-up message at the top of the screen. */
let toastTimeout = null;

function toast(message,bad=false) {
  const element = $("toast");
  element.innerHTML = `<span class="toast-icon">${ic(bad ? "oops" : "sparkle")}</span><span>${message}</span>`;
  element.classList.toggle("bad",bad);
  element.classList.remove("show");
  void element.offsetWidth;
  element.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  },1600);
}


/* =========================================
   3. GAME STATE
   ========================================= */

let state = null;
let timerId = null;
let bakingInterval = null;
let nextCustomerId = 1;
let baking = false;

function freshState() {
  return {
    running:false,
    score:0,
    gameTimeLeft:CONFIG.GAME_SECONDS,
    orderTimeLeft:orderSeconds(),
    queue:[],
    selection:{base:null,frosting:null,topping:null},
    served:0,
    wrong:0,
    expired:0,
    combo:0,
    bestCombo:0,
    coinsEarned:0,
    lastTick:0
  };
}


/* =========================================
   4. SCREEN DRAWING
   ========================================= */

/* ----- The cake ----- */

function cakeSVG(selection) {
  const base = selection.base ? findItem("base",selection.base) : null;
  const frost = selection.frosting ? findItem("frosting",selection.frosting) : null;
  const topping = selection.topping ? findItem("topping",selection.topping) : null;

  let html = `<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg">`;

  html += `<ellipse cx="100" cy="166" rx="88" ry="14" fill="#fff" stroke="#6e4a3a" stroke-width="3"/>`;
  html += `<ellipse cx="100" cy="162" rx="67" ry="8" fill="#f4d9c4"/>`;

  html += `<path d="M42 100 h116 v52 q0 12 -12 12 h-92 q-12 0 -12 -12z"
    fill="${base ? base.color : "#f5e8dc"}"
    stroke="#6e4a3a" stroke-width="4"/>`;

  if(base) {
    html += `<path d="M60 125h80" stroke="rgba(255,255,255,.4)" stroke-width="5" stroke-linecap="round"/>`;
  } else {
    html += `<text x="100" y="139" text-anchor="middle" font-size="12" fill="#b98a6a">Base</text>`;
  }

  const frostPath = `M36 104 q0 -22 22 -22 h84 q22 0 22 22 q0 8 -9 8 q-5 14 -12 0 q-6 -4 -12 6 q-6 12 -13 0 q-6 -6 -14 0 q-7 12 -13 0 q-6 -6 -12 4 q-7 12 -13 -2 q-9 4 -9 -8z`;

  html += `<path d="${frostPath}"
    fill="${frost ? frost.color : "none"}"
    stroke="${frost ? "#6e4a3a" : "#c9ad98"}"
    stroke-width="4"
    ${frost ? "" : "stroke-dasharray='7 6'"} />`;

  if(frost) {
    html += `<path d="M62 92q10 -6 20 0" stroke="rgba(255,255,255,.6)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  if(topping) {
    html += `<g transform="translate(73.6 33.6) scale(1.1)">${toppingArt(topping.id,topping.color)}</g>`;
  } else {
    html += `<circle cx="100" cy="66" r="12" fill="none" stroke="#c9ad98" stroke-width="3" stroke-dasharray="5 5"/>`;
  }

  html += `</svg>`;
  return html;
}

function renderCake() {
  $("cake-preview").innerHTML = cakeSVG(state.selection);

  LAYERS.forEach(layer => {
    const buttons = $("choices-" + layer).querySelectorAll(".choice");

    buttons.forEach((button,index) => {
      const item = INGREDIENTS[layer][index];
      button.classList.toggle(
        "selected",
        state.selection[layer] === item.id
      );
    });
  });
}

/* ----- Customers and their orders ----- */

function makeCustomer() {
  return {
    id:nextCustomerId++,
    name:pick(CUSTOMER_NAMES),
    look:randomLook(),
    order:{
      base:pick(availableIngredients("base")).id,
      frosting:pick(availableIngredients("frosting")).id,
      topping:pick(availableIngredients("topping")).id
    }
  };
}

function fillQueue() {
  while(state.queue.length < CONFIG.QUEUE_SIZE) {
    state.queue.push(makeCustomer());
  }
}

function renderQueue() {
  const container = $("queue");
  container.innerHTML = "";

  state.queue.forEach((customer,index) => {
    const div = document.createElement("div");
    div.className = "customer" + (index === 0 ? " front" : "");

    div.innerHTML = `
      <div class="customer-face">${customerSVG(customer)}</div>
      <div class="who">
        <b>${customer.name}</b>
        <small>${index === 0 ? "Now serving!" : "Waiting in line"}</small>
      </div>
    `;

    container.appendChild(div);
  });
}

function renderOrder() {
  const front = state.queue[0];
  if(!front) return;

  $("order-face").innerHTML = customerSVG(front);
  $("order-name").textContent = front.name + "'s order";

  const list = $("order-list");
  list.innerHTML = "";

  LAYERS.forEach(layer => {
    const item = findItem(layer,front.order[layer]);
    const li = document.createElement("li");
    const complete = state.selection[layer] === front.order[layer];

    if(complete) li.classList.add("done");

    li.innerHTML = `
      <span class="order-icon">${ingredientIcon(layer,item)}</span>
      <span><span class="kind">${LAYER_NAMES[layer]}</span>${item.label}</span>
      <span class="check">${complete ? ic("check") : ""}</span>
    `;

    list.appendChild(li);
  });
}

/* ----- Ingredient buttons ----- */

function buildChoiceButtons() {
  LAYERS.forEach(layer => {
    const container = $("choices-" + layer);
    container.innerHTML = "";

    INGREDIENTS[layer].forEach(item => {
      const button = document.createElement("button");
      const owned = isUnlocked(layer,item.id);

      button.className = "choice" + (owned ? "" : " locked");
      button.innerHTML = `
        <span class="swatch">${ingredientIcon(layer,item)}</span>
        <span>${item.label}</span>
        ${owned ? "" : `<small>${ic("lock")} ${CONFIG.UNLOCK_COST} coins</small>`}
      `;

      button.addEventListener("click",() => {
        if(!owned) {
          openRecipe();
          return;
        }
        selectIngredient(layer,item.id);
      });

      container.appendChild(button);
    });
  });

  renderCake();
}

function selectIngredient(layer,id) {
  if(!state.running || baking) return;

  state.selection[layer] =
    state.selection[layer] === id ? null : id;

  playSound("select");
  renderCake();
  renderOrder();
}

function resetSelection() {
  state.selection = {base:null,frosting:null,topping:null};
}

function clearCake() {
  if(!state.running || baking) return;

  resetSelection();
  renderCake();
  renderOrder();
  playSound("click");
}

/* ----- Recipe book and ingredient shop ----- */

function buildRecipeBook() {
  let html = "";

  LAYERS.forEach(layer => {
    html += `
      <div class="recipe-group">
        <h3>${LAYER_NAMES[layer]}</h3>
        <div class="recipe-items">
    `;

    INGREDIENTS[layer].forEach(item => {
      const owned = isUnlocked(layer,item.id);

      html += `
        <div class="recipe-item">
          <span class="emoji">${ingredientIcon(layer,item)}</span>
          <span>${item.label}</span>
          ${owned
            ? `<span class="owned">${ic("check")} Unlocked</span>`
            : `<button onclick="unlockIngredient('${layer}','${item.id}')">Unlock · ${CONFIG.UNLOCK_COST} ${ic("coin")}</button>`
          }
        </div>
      `;
    });

    html += `</div></div>`;
  });

  const combinations = LAYERS.reduce(
    (total,layer) => total * availableIngredients(layer).length,
    1
  );

  html += `
    <p style="margin-top:16px;font-size:.85rem;color:var(--brown-light)">
      ${ic("slice")} You can create <strong>${combinations}</strong> different cakes with your unlocked ingredients!
    </p>
  `;

  $("recipe-content").innerHTML = html;
  $("shop-coins").textContent = coins;

  const count = LAYERS.reduce(
    (total,layer) => total + availableIngredients(layer).length,
    0
  );

  $("ingredient-count").textContent = count;
}

function unlockIngredient(layer,id) {
  const key = id + "_" + layer;

  if(unlocked[key]) return;

  if(coins < CONFIG.UNLOCK_COST) {
    toast("Not enough coins! Keep serving customers.",true);
    return;
  }

  coins -= CONFIG.UNLOCK_COST;
  unlocked[key] = true;

  saveProgress();
  playSound("unlock");

  updateCoinDisplay();
  buildRecipeBook();
  buildChoiceButtons();

  toast("New ingredient unlocked!");
}

function openRecipe() {
  buildRecipeBook();
  $("recipe-modal").classList.remove("hidden");
}

function closeRecipe() {
  $("recipe-modal").classList.add("hidden");
}

/* ----- Timers, score and coin displays ----- */

function renderTimers() {
  $("game-timer").textContent = formatTime(state.gameTimeLeft);
  $("timer-pill").classList.toggle("low",state.gameTimeLeft <= 15);

  const percent = Math.max(
    0,
    state.orderTimeLeft / orderSeconds() * 100
  );

  $("order-bar").style.width = percent + "%";
  $("order-bar").classList.toggle("warn",percent <= 50 && percent > 25);
  $("order-bar").classList.toggle("danger",percent <= 25);

  $("order-timer-text").textContent = Math.ceil(state.orderTimeLeft) + "s";
  $("patience-text").textContent = Math.ceil(state.orderTimeLeft) + "s";

  $("order-card").classList.toggle("hurry",percent <= 30);
  $("hurry-chip").classList.toggle("hidden",percent > 30);

  $("round-progress").style.width =
    ((CONFIG.GAME_SECONDS - state.gameTimeLeft) / CONFIG.GAME_SECONDS * 100) + "%";
}

function renderScore() {
  $("score").textContent = state.score;
  $("combo").textContent = state.combo + "x";
}

function updateCoinDisplay() {
  $("coins").textContent = coins;
  $("start-coins").textContent = coins;
  $("shop-coins").textContent = coins;
  $("total-coins").textContent = coins;
}


/* =========================================
   5. GAME FLOW
   ========================================= */

function startGame() {
  clearInterval(timerId);
  clearInterval(bakingInterval);

  state = freshState();
  state.running = true;
  baking = false;

  $("mode-tag").textContent = DIFFICULTIES[difficulty].label;
  nextCustomerId = 1;

  fillQueue();
  showScreen("game-screen");

  $("serve-btn").disabled = false;
  setServeLabel(false);

  renderScore();
  renderTimers();
  renderQueue();
  renderOrder();
  renderCake();

  setOven("cupcake","Ready to bake");
  $("oven-status").classList.remove("active");

  state.lastTick = Date.now();
  timerId = setInterval(tick,100);

  playSound("click");
}

function tick() {
  if(!state || !state.running) return;

  const now = Date.now();
  const dt = (now - state.lastTick) / 1000;

  state.lastTick = now;

  /* The overall timer always runs. */
  state.gameTimeLeft -= dt;

  /* The active customer's timer also runs during baking. */
  state.orderTimeLeft -= dt;

  if(state.gameTimeLeft <= 0) {
    state.gameTimeLeft = 0;
    renderTimers();
    endGame();
    return;
  }

  /* Customer expiration takes priority, even during baking. */
  if(state.orderTimeLeft <= 0) {
    state.orderTimeLeft = 0;
    renderTimers();
    expireOrder();
    return;
  }

  renderTimers();
}

function changeScore(amount) {
  state.score += amount;
  renderScore();
}

function addCoins(amount) {
  coins += amount;
  state.coinsEarned += amount;

  saveProgress();
  updateCoinDisplay();
}

function cakeMatches() {
  const front = state.queue[0];

  return LAYERS.every(layer => {
    return state.selection[layer] === front.order[layer];
  });
}

function nextCustomer() {
  if(!state.running) return;

  state.queue.shift();
  fillQueue();

  state.orderTimeLeft = orderSeconds();
  resetSelection();

  renderQueue();
  renderOrder();
  renderCake();
  renderTimers();
}

/* Stops any cake that is baking and puts the serve button back to normal. */
function stopBaking() {
  clearInterval(bakingInterval);
  bakingInterval = null;
  baking = false;

  $("serve-btn").disabled = false;
  setServeLabel(false);

  $("cake-preview").classList.remove("serve");
  $("cake-preview").style.transform = "";
}

function serve() {
  if(!state.running || baking || !state.queue.length) return;

  const incomplete = LAYERS.some(layer => !state.selection[layer]);

  if(incomplete) {
    toast("Please complete all three cake layers!",true);
    playSound("wrong");
    return;
  }

  if(!cakeMatches()) {
    state.wrong++;
    state.combo = 0;

    changeScore(-CONFIG.POINTS_PENALTY);

    toast("Oops! Wrong cake. Try again!",true);
    playSound("wrong");

    const preview = $("cake-preview");
    preview.classList.remove("shake");
    void preview.offsetWidth;
    preview.classList.add("shake");

    renderScore();
    return;
  }

  baking = true;
  $("serve-btn").disabled = true;
  setServeLabel(true);
  setOven("flame","Baking your cake...");
  $("oven-status").classList.add("active");

  playSound("bake");

  const preview = $("cake-preview");
  preview.style.transform = "scale(1.04)";

  const bakeStart = Date.now();

  bakingInterval = setInterval(() => {
    if(!state || !state.running) {
      clearInterval(bakingInterval);
      return;
    }

    /* Do not complete a cake after its customer's timer has expired. */
    if(state.orderTimeLeft <= 0) {
      clearInterval(bakingInterval);
      expireOrder();
      return;
    }

    const remaining = Math.max(
      0,
      CONFIG.BAKE_SECONDS - (Date.now() - bakeStart) / 1000
    );

    setOven("flame","Baking... " + remaining.toFixed(1) + "s");

    if(remaining <= 0) {
      clearInterval(bakingInterval);
      bakingInterval = null;
      finishCake();
    }
  },100);
}

function finishCake() {
  if(!state || !state.running || !baking) return;

  /* Extra safety check in case the timer reaches zero at the same moment. */
  if(state.orderTimeLeft <= 0) {
    expireOrder();
    return;
  }

  baking = false;

  state.served++;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo,state.combo);

  /* Official scoring: exactly 10 points per correct order. */
  changeScore(CONFIG.POINTS_CORRECT);

  /* Coins are a separate reward and never affect the score. */
  addCoins(CONFIG.COINS_CORRECT);

  playSound("success");
  toast("Perfect cake! +10 points, +5 coins");

  setOven("sparkle","Freshly baked!");
  $("oven-status").classList.remove("active");

  $("cake-preview").classList.add("serve");

  setTimeout(() => {
    if(!state || !state.running) return;

    $("cake-preview").classList.remove("serve");
    $("cake-preview").style.transform = "";

    $("serve-btn").disabled = false;
    setServeLabel(false);

    baking = false;
    nextCustomer();

    setOven("cupcake","Ready to bake");
  },500);
}

function expireOrder() {
  if(!state || !state.running) return;

  /* Cancel any cake currently being prepared. */
  stopBaking();

  state.expired++;
  state.combo = 0;

  changeScore(-CONFIG.POINTS_PENALTY);

  playSound("wrong");
  toast("Customer left! -5 points",true);

  setOven("cupcake","Ready to bake");
  $("oven-status").classList.remove("active");

  nextCustomer();
}

function endGame() {
  if(!state || !state.running) return;

  state.running = false;

  clearInterval(timerId);
  timerId = null;
  stopBaking();

  const newBest = state.score > bestForMode();

  if(newBest) {
    bestScores[difficulty] = state.score;
    saveProgress();
  }

  $("final-score").textContent = state.score;
  $("new-best").classList.toggle("hidden",!newBest);

  $("end-mode").textContent = DIFFICULTIES[difficulty].label;
  $("end-seconds").textContent = orderSeconds();
  $("end-best").textContent = bestForMode();

  $("stat-served").textContent = state.served;
  $("stat-wrong").textContent = state.wrong;
  $("stat-lost").textContent = state.expired;

  $("coins-earned").textContent = state.coinsEarned;
  $("best-combo").textContent = state.bestCombo + "x";
  $("total-coins").textContent = coins;

  renderBest();

  $("end-line").textContent =
    state.served >= 5
      ? "Amazing work, master baker!"
      : "Every little baker starts somewhere!";

  $("end-cake").innerHTML = cakeSVG({
    base:"strawberry",
    frosting:"pink",
    topping:"cherry"
  });

  updateCoinDisplay();
  showScreen("end-screen");
}


/* =========================================
   6. DIFFICULTY SELECTOR
   ========================================= */

function renderBest() {
  $("best-start").textContent = bestForMode();
}

/* Highlights the chosen mode and updates the numbers that depend on it. */
function renderDifficulty() {
  document.querySelectorAll(".diff-btn").forEach(button => {
    const chosen = button.dataset.mode === difficulty;
    button.classList.toggle("selected",chosen);
    button.setAttribute("aria-checked",chosen);
  });

  $("info-order-seconds").textContent = orderSeconds();
  renderBest();
}

function setDifficulty(mode) {
  if(!DIFFICULTIES[mode]) return;

  difficulty = mode;
  saveProgress();
  renderDifficulty();
  playSound("select");
}

/* Builds one button per entry in DIFFICULTIES (done once). */
function buildDifficultyButtons() {
  const container = $("difficulty-options");
  container.innerHTML = "";

  Object.keys(DIFFICULTIES).forEach(mode => {
    const button = document.createElement("button");
    button.className = "diff-btn";
    button.dataset.mode = mode;
    button.setAttribute("role","radio");
    button.innerHTML = `<b>${DIFFICULTIES[mode].label}</b><small>${DIFFICULTIES[mode].seconds}s</small>`;
    button.addEventListener("click",() => setDifficulty(mode));
    container.appendChild(button);
  });
}


/* =========================================
   7. STARTUP  (runs once when the page loads)
   ========================================= */

function init() {
  state = freshState();

  $("info-game-seconds").textContent = CONFIG.GAME_SECONDS;

  buildDifficultyButtons();
  renderDifficulty();
  renderBest();

  updateCoinDisplay();

  $("title-cake").innerHTML = cakeSVG({
    base:"strawberry",
    frosting:"pink",
    topping:"cherry"
  });

  $("start-btn").addEventListener("click",startGame);
  $("again-btn").addEventListener("click",startGame);
  $("menu-btn").addEventListener("click",() => {
    renderDifficulty();
    showScreen("start-screen");
  });

  $("serve-btn").addEventListener("click",serve);
  $("clear-btn").addEventListener("click",clearCake);

  $("recipe-btn-start").addEventListener("click",openRecipe);
  $("recipe-btn-game").addEventListener("click",openRecipe);

  $("recipe-close").addEventListener("click",closeRecipe);

  /* Clicking the dark area outside the recipe card closes the modal. */
  $("recipe-modal").addEventListener("click",event => {
    if(event.target === $("recipe-modal")) closeRecipe();
  });

  buildChoiceButtons();
  buildRecipeBook();
  renderCake();
}

init();
