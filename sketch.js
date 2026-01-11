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

function setup() {
  createCanvas(500, 500);
  spawnWave();
}

function draw() {
  background(25);

  // ===== MOVEMENT =====
  if (keyIsDown(LEFT_ARROW)) px -= speed;
  if (keyIsDown(RIGHT_ARROW)) px += speed;
  if (keyIsDown(UP_ARROW)) py -= speed;
  if (keyIsDown(DOWN_ARROW)) py += speed;

  px = constrain(px, 20, width - 20);
  py = constrain(py, 20, height - 20);

  attacking = mouseIsPressed || keyIsDown(32);
  let aim = atan2(mouseY - py, mouseX - px);

  // ===== ENEMIES =====
  for (let e of enemies) {
    let dx = px - e.x;
    let dy = py - e.y;
    let d = sqrt(dx * dx + dy * dy);
    let dir = atan2(dy, dx);

    e.x += cos(dir) * e.speed;
    e.y += sin(dir) * e.speed;

    if (d < e.size / 2 + 12) hp -= e.damage;

    // ATTACK HIT
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

  // ===== KILLS =====
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      xp += enemies[i].boss ? 20 : 5;
      enemies.splice(i, 1);
    }
  }

  // ===== LEVEL UP =====
  if (xp >= xpNext) {
    xp -= xpNext;
    level++;
    weapon++;
    xpNext = floor(xpNext * 1.4);
  }

  if (enemies.length === 0) {
    wave++;
    spawnWave();
  }

  // ===== PLAYER =====
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
  text("Wave: " + wave, 10, 20);
  text("Level: " + level, 10, 40);

  if (hp <= 0) {
    background(0);
    fill(255, 0, 0);
    textSize(32);
    text("GAME OVER", 140, 260);
    noLoop();
  }
}

// ===== ENEMY SPAWNING =====
function spawnWave() {
  enemies = [];

  if (wave % 5 === 0) {
    enemies.push(makeEnemy("boss"));
    return;
  }

  for (let i = 0; i < wave + 2; i++) {
    let type = random(["grunt", "brute", "mage"]);
    enemies.push(makeEnemy(type));
  }
}

function makeEnemy(type) {
  let base = {
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
    base.hp *= 2;
    base.size = 34;
    base.speed *= 0.7;
    base.damage = 0.8;
  }

  if (type === "mage") {
    base.speed *= 1.3;
    base.hp *= 0.8;
  }

  if (type === "boss") {
    base.hp = 120 + wave * 12;
    base.size = 56;
    base.speed = 1.1;
    base.damage = 1.5;
    base.boss = true;
  }

  return base;
}

// ===== ENEMY DRAW =====
function drawEnemy(e, dir) {
  push();
  translate(e.x, e.y);
  rotate(dir);

  if (e.boss) fill(180, 0, 0);
  else if (e.type === "grunt") fill(0, 200, 100);
  else if (e.type === "brute") fill(255, 140, 0);
  else fill(160, 0, 255);

  ellipse(0, 0, e.size);

  // WEAPON
  stroke(200);
  strokeWeight(4);
  if (e.type === "grunt") line(10, 0, 26, 0);        // sword
  if (e.type === "brute") line(12, -6, 32, 6);       // axe
  if (e.type === "mage") line(10, 0, 10, 26);        // staff
  if (e.boss) line(14, 0, 40, 0);                     // boss sword

  pop();
}

// ===== UI =====
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

