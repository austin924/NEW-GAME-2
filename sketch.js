// ===== PLAYER + CORE =====
let px = 250, py = 250;
let speed = 4;
let hp = 100, maxHP = 100;
let level = 1;
let xp = 0;
let xpNext = 20;
let weapon = 1;

let enemies = [];
let wave = 1;
let attacking = false;
let gameState = "start";
let fullscreenOn = false;

// ===== PERMANENT PROGRESS =====
const ACC_KEY = "swordgame_account";
let invincible = false; // permanent once unlocked

// ===== STATS =====
let kills = 0;
let finalStats = { level: 1, wave: 1, kills: 0 };
let submittedScore = false;

// ===== LEADERBOARD =====
const LB_KEY = "swordgame_leaderboard";
const LB_TIME_KEY = "swordgame_lb_time";
const LB_REFRESH = 10 * 60 * 1000;
let leaderboard = [];

// ===== ARENAS =====
let arenas = [
  { name: "Grasslands", bg: [40, 120, 40] },
  { name: "Desert", bg: [180, 140, 60] },
  { name: "Ice Fields", bg: [180, 220, 255] },
  { name: "Volcano", bg: [120, 20, 20] },
  { name: "Void", bg: [20, 0, 40] },
  { name: "Ruins", bg: [100, 100, 100] },
  { name: "Forest Night", bg: [10, 40, 20] },
  { name: "Crystal Cavern", bg: [120, 80, 160] },
  { name: "Sky Realm", bg: [120, 180, 255] },
  { name: "Final Realm", bg: [0, 0, 0] }
];

// ===== ADD-ONS =====
let enemyBullets = [];
let dashCooldown = 0;
let inShop = false;

function setup() {
  createCanvas(500, 500);
  loadAccount();
  checkLeaderboardRefresh();
  loadLeaderboard();
}

// ===== INPUT =====
function keyPressed() {
  if (keyCode === 27 && gameState === "playing") gameState = "paused";
  else if (keyCode === 27 && gameState === "paused") gameState = "playing";

  if (gameState === "start" && key === " ") {
    resetGame();
    gameState = "playing";
  }

  if (gameState === "gameover" && (key === "r" || key === "R")) {
    resetGame();
    gameState = "playing";
  }

  if (key === "f" || key === "F") {
    fullscreenOn = !fullscreenOn;
    fullscreen(fullscreenOn);
  }

  if (key === "c" || key === "C") {
    if (gameState === "playing") gameState = "controls";
    else if (gameState === "controls") gameState = "playing";
  }

  if (keyCode === SHIFT) dash();
  if (inShop) handleShopInput();
}

// ===== MAIN LOOP =====
function draw() {
  if (gameState === "start") {
    background(20);
    fill(255);
    textAlign(CENTER);
    textSize(28);
    text("SWORD GAME", width / 2, 220);
    textSize(14);
    text("Leaderboard resets every 10 minutes", width / 2, 250);
    if (invincible) text("ACCOUNT BONUS: INVINCIBLE UNLOCKED", width / 2, 270);
    textSize(16);
    text("SPACE = Start", width / 2, 300);
    text("C = Controls", width / 2, 330);
    return;
  }

  if (gameState === "controls") {
    background(15);
    fill(255);
    textAlign(CENTER);
    textSize(22);
    text("CONTROLS", width / 2, 80);
    textSize(14);
    text("Arrow Keys - Move", width / 2, 130);
    text("Mouse / Space - Attack", width / 2, 155);
    text("SHIFT - Dash", width / 2, 180);
    text("ESC - Pause", width / 2, 205);
    text("C - Back", width / 2, 240);
    return;
  }

  if (gameState === "paused") {
    background(0, 180);
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text("PAUSED", width / 2, height / 2);
    textSize(16);
    text("ESC to Resume", width / 2, height / 2 + 30);
    return;
  }

  if (gameState === "gameover") {
    background(0);
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(32);
    text("GAME OVER", width / 2, 60);

    fill(255);
    textSize(16);
    text("Level: " + finalStats.level, width / 2, 105);
    text("Wave: " + finalStats.wave, width / 2, 125);
    text("Kills: " + finalStats.kills, width / 2, 145);

    textSize(12);
    text("Leaderboard refreshes every 10 minutes", width / 2, 170);

    drawLeaderboard();

    textSize(14);
    text("Press R to Restart", width / 2, height - 30);
    return;
  }

  if (dashCooldown > 0) dashCooldown--;

  if (inShop) {
    drawShop();
    return;
  }

  drawArena();
  checkFinalRealmUnlock(); // <-- FINAL LEVEL CHECK

  if (keyIsDown(LEFT_ARROW)) px -= speed;
  if (keyIsDown(RIGHT_ARROW)) px += speed;
  if (keyIsDown(UP_ARROW)) py -= speed;
  if (keyIsDown(DOWN_ARROW)) py += speed;

  px = constrain(px, 20, width - 20);
  py = constrain(py, 20, height - 20);

  attacking = mouseIsPressed || keyIsDown(32);
  let aim = atan2(mouseY - py, mouseX - px);

  for (let e of enemies) {
    let dx = px - e.x;
    let dy = py - e.y;
    let d = sqrt(dx * dx + dy * dy);
    let dir = atan2(dy, dx);

    e.x += cos(dir) * e.speed;
    e.y += sin(dir) * e.speed;

    if (!invincible && d < e.size / 2 + 12) hp -= e.damage;

    if (e.type === "mage" && frameCount % 90 === 0) shootAtPlayer(e);

    if (attacking && d < 50 + weapon * 15) {
      let hitDir = atan2(e.y - py, e.x - px);
      if (abs(angleDiff(aim, hitDir)) < 0.6) {
        e.hp -= weapon * 2;
        e.x += cos(hitDir) * 14;
        e.y += sin(hitDir) * 14;
      }
    }

    drawEnemy(e, dir);
  }

  updateEnemyBullets();

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      xp += enemies[i].boss ? 20 : 5;
      kills++;
      enemies.splice(i, 1);
    }
  }

  if (xp >= xpNext) {
    xp -= xpNext;
    level++;
    weapon++;
    xpNext = floor(xpNext * 1.4);
    if (level % 5 === 0) hp = maxHP;
  }

  if (enemies.length === 0) {
    wave++;
    if (wave % 5 === 0) inShop = true;
    spawnWave();
  }

  push();
  translate(px, py);
  rotate(aim);
  if (attacking) {
    stroke(255);
    strokeWeight(5);
    line(10, 0, 60 + weapon * 10, 0);
  }
  noStroke();
  fill(invincible ? 255 : 255, invincible ? 255 : 0, 0);
  ellipse(0, 0, 28);
  pop();

  drawHP();
  drawXP();

  fill(255);
  textAlign(LEFT);
  text("Wave: " + wave, 10, 20);
  text("Level: " + level, 10, 40);
  if (invincible) text("INVINCIBLE", 10, 60);

  if (hp <= 0 && !invincible) {
    finalStats = { level, wave, kills };
    submitScore();
    gameState = "gameover";
  }
}

// ===== FINAL REALM / ACCOUNT =====
function checkFinalRealmUnlock() {
  let index = min(floor((wave - 1) / 10), arenas.length - 1);
  if (index === arenas.length - 1 && !invincible) {
    invincible = true;
    saveAccount();
  }
}

function saveAccount() {
  localStorage.setItem(ACC_KEY, JSON.stringify({ invincible }));
}

function loadAccount() {
  let data = localStorage.getItem(ACC_KEY);
  if (data) {
    let acc = JSON.parse(data);
    invincible = !!acc.invincible;
  }
}

// ===== LEADERBOARD =====
function checkLeaderboardRefresh() {
  let last = localStorage.getItem(LB_TIME_KEY);
  let now = Date.now();
  if (!last || now - last > LB_REFRESH) {
    localStorage.setItem(LB_KEY, JSON.stringify([]));
    localStorage.setItem(LB_TIME_KEY, now);
  }
}

function drawLeaderboard() {
  fill(255);
  textAlign(CENTER);
  textSize(18);
  text("LEADERBOARD", width / 2, 200);
  textSize(12);
  for (let i = 0; i < leaderboard.length; i++) {
    let e = leaderboard[i];
    text(
      `${i + 1}. ${e.name} | W${e.wave} L${e.level} K${e.kills}`,
      width / 2,
      225 + i * 18
    );
  }
}

function loadLeaderboard() {
  let data = localStorage.getItem(LB_KEY);
  leaderboard = data ? JSON.parse(data) : [];
}

function saveLeaderboard() {
  localStorage.setItem(LB_KEY, JSON.stringify(leaderboard));
}

function submitScore() {
  if (submittedScore) return;
  submittedScore = true;

  let name = prompt("Enter your name (Leaderboard resets every 10 minutes)");
  if (!name) name = "Anonymous";

  leaderboard.push({
    name,
    level: finalStats.level,
    wave: finalStats.wave,
    kills: finalStats.kills
  });

  leaderboard.sort((a, b) =>
    b.wave - a.wave || b.level - a.level || b.kills - a.kills
  );

  leaderboard = leaderboard.slice(0, 10);
  saveLeaderboard();
}

// ===== SHOP =====
function drawShop() {
  background(20, 180);
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text("SHOP", width / 2, 120);
  textSize(14);
  text("1: +20 Max HP (5 kills)", width / 2, 170);
  text("2: +1 Weapon (8 kills)", width / 2, 200);
  text("3: Heal Full (6 kills)", width / 2, 230);
  text("ENTER to continue", width / 2, 280);
}

function handleShopInput() {
  if (key === "1" && kills >= 5) {
    maxHP += 20;
    hp = maxHP;
    kills -= 5;
  }
  if (key === "2" && kills >= 8) {
    weapon++;
    kills -= 8;
  }
  if (key === "3" && kills >= 6) {
    hp = maxHP;
    kills -= 6;
  }
  if (keyCode === ENTER) inShop = false;
}

// ===== ENEMY PROJECTILES =====
function shootAtPlayer(e) {
  let a = atan2(py - e.y, px - e.x);
  enemyBullets.push({
    x: e.x,
    y: e.y,
    dx: cos(a) * 3,
    dy: sin(a) * 3,
    r: 5
  });
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let b = enemyBullets[i];
    b.x += b.dx;
    b.y += b.dy;
    fill(255, 120, 0);
    ellipse(b.x, b.y, b.r * 2);

    if (!invincible && dist(px, py, b.x, b.y) < b.r + 12) {
      hp -= 5;
      enemyBullets.splice(i, 1);
    }

    if (b.x < 0 || b.y < 0 || b.x > width || b.y > height) {
      enemyBullets.splice(i, 1);
    }
  }
}

// ===== DASH =====
function dash() {
  if (dashCooldown > 0) return;
  let dx = 0, dy = 0;
  if (keyIsDown(LEFT_ARROW)) dx--;
  if (keyIsDown(RIGHT_ARROW)) dx++;
  if (keyIsDown(UP_ARROW)) dy--;
  if (keyIsDown(DOWN_ARROW)) dy++;
  px += dx * 60;
  py += dy * 60;
  dashCooldown = 60;
}

// ===== HELPERS =====
function resetGame() {
  px = 250;
  py = 250;
  hp = maxHP;
  level = 1;
  xp = 0;
  xpNext = 20;
  weapon = 1;
  wave = 1;
  kills = 0;
  submittedScore = false;
  inShop = false;
  spawnWave();
}

function spawnWave() {
  enemies = [];
  if (wave % 5 === 0) {
    enemies.push(makeEnemy("boss"));
    return;
  }
  for (let i = 0; i < wave + 2; i++) {
    enemies.push(makeEnemy(random(["grunt", "brute", "mage"])));
  }
}

function makeEnemy(type) {
  let e = {
    x: random(width),
    y: random(height),
    hp: 10 + wave * 4,
    speed: 1 + wave * 0.1,
    size: 26,
    damage: 0.4,
    type,
    boss: false,
    skin: random(["A", "B", "C"])
  };

  if (type === "brute") {
    e.hp *= 2;
    e.size = 34;
    e.speed *= 0.7;
    e.damage = 0.8;
  }
  if (type === "mage") {
    e.speed *= 1.3;
    e.hp *= 0.8;
  }
  if (type === "boss") {
    e.hp = 120 + wave * 12;
    e.size = 56;
    e.speed = 1.1;
    e.damage = 1.5;
    e.boss = true;
  }
  return e;
}

function drawEnemy(e, dir) {
  push();
  translate(e.x, e.y);
  rotate(dir);
  if (e.boss) fill(180, 0, 0);
  else if (e.skin === "A") fill(0, 200, 100);
  else if (e.skin === "B") fill(0, 140, 255);
  else fill(200, 200, 0);
  ellipse(0, 0, e.size);
  stroke(200);
  strokeWeight(4);
  line(10, 0, e.size, 0);
  pop();
}

function drawArena() {
  let index = min(floor((wave - 1) / 10), arenas.length - 1);
  let a = arenas[index];
  background(a.bg[0], a.bg[1], a.bg[2]);
}

function drawHP() {
  fill(60);
  rect(150, 10, 200, 14);
  fill(0, 255, 0);
  rect(150, 10, 200 * (hp / maxHP), 14);
}

function drawXP() {
  fill(60);
  rect(150, 30, 200, 10);
  fill(0, 150, 255);
  rect(150, 30, 200 * (xp / xpNext), 10);
}

function angleDiff(a, b) {
  let d = a - b;
  return atan2(sin(d), cos(d));
}
