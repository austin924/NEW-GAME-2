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

let gameState = "start"; // start | playing | paused | gameover | controls
let fullscreenOn = false;

function setup() {
  createCanvas(500, 500);
}

function keyPressed() {
  // ESC = pause
  if (keyCode === 27 && gameState === "playing") gameState = "paused";
  else if (keyCode === 27 && gameState === "paused") gameState = "playing";

  // START
  if (gameState === "start" && key === " ") {
    resetGame();
    gameState = "playing";
  }

  // RESTART
  if (gameState === "gameover" && (key === "r" || key === "R")) {
    resetGame();
    gameState = "playing";
  }

  // FULLSCREEN
  if (key === "f" || key === "F") {
    fullscreenOn = !fullscreenOn;
    fullscreen(fullscreenOn);
  }

  // CONTROLS
  if (key === "c" || key === "C") {
    if (gameState === "playing") gameState = "controls";
    else if (gameState === "controls") gameState = "playing";
  }
}

function draw() {
  // ===== START =====
  if (gameState === "start") {
    background(20);
    fill(255);
    textAlign(CENTER);
    textSize(28);
    text("SWORD GAME", width / 2, 220);
    textSize(16);
    text("SPACE = Start", width / 2, 260);
    text("C = Controls", width / 2, 290);
    return;
  }

  // ===== CONTROLS =====
  if (gameState === "controls") {
    background(15);
    fill(255);
    textAlign(CENTER);
    textSize(22);
    text("CONTROLS", width / 2, 80);
    textSize(14);
    text("Arrow Keys - Move", width / 2, 130);
    text("Mouse / Space - Attack", width / 2, 155);
    text("ESC - Pause", width / 2, 180);
    text("F - Fullscreen", width / 2, 205);
    text("C - Back", width / 2, 240);
    return;
  }

  // ===== PAUSED =====
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

  // ===== GAME OVER =====
  if (gameState === "gameover") {
    background(0);
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(32);
    text("GAME OVER", width / 2, height / 2);
    textSize(16);
    text("Press R to Restart", width / 2, height / 2 + 30);
    return;
  }

  // ===== PLAYING =====
  background(25);

  // MOVEMENT
  if (keyIsDown(LEFT_ARROW)) px -= speed;
  if (keyIsDown(RIGHT_ARROW)) px += speed;
  if (keyIsDown(UP_ARROW)) py -= speed;
  if (keyIsDown(DOWN_ARROW)) py += speed;

  px = constrain(px, 20, width - 20);
  py = constrain(py, 20, height - 20);

  attacking = mouseIsPressed || keyIsDown(32);
  let aim = atan2(mouseY - py, mouseX - px);

  // ENEMIES
  for (let e of enemies) {
    let dx = px - e.x;
    let dy = py - e.y;
    let d = sqrt(dx * dx + dy * dy);
    let dir = atan2(dy, dx);

    e.x += cos(dir) * e.speed;
    e.y += sin(dir) * e.speed;

    if (d < e.size / 2 + 12) hp -= e.damage;

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

  // KILLS
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      xp += enemies[i].boss ? 20 : 5;
      enemies.splice(i, 1);
    }
  }

  // LEVEL UP + HEALTH REGEN EVERY 5 LEVELS
  if (xp >= xpNext) {
    xp -= xpNext;
    level++;
    weapon++;
    xpNext = floor(xpNext * 1.4);

    if (level % 5 === 0) {
      hp = maxHP; // 🔥 FULL HEAL
    }
  }

  if (enemies.length === 0) {
    wave++;
    spawnWave();
  }

  // PLAYER
  push();
  translate(px, py);
  rotate(aim);

  if (attacking) {
    stroke(255);
    strokeWeight(5);
    line(10, 0, 60 + weapon * 10, 0);
  }

  noStroke();
  fill(255, 0, 0);
  ellipse(0, 0, 28);
  pop();

  drawHP();
  drawXP();

  fill(255);
  textAlign(LEFT);
  text("Wave: " + wave, 10, 20);
  text("Level: " + level, 10, 40);

  if (hp <= 0) gameState = "gameover";
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
    boss: false
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
  else if (e.type === "grunt") fill(0, 200, 100);
  else if (e.type === "brute") fill(255, 140, 0);
  else fill(160, 0, 255);

  ellipse(0, 0, e.size);
  stroke(200);
  strokeWeight(4);
  line(10, 0, e.size, 0);
  pop();
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
