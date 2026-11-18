// Glowmoth world: the moth, pollen, wasps, power-ups, waves, combo and win/lose.
// Pure simulation (no drawing, no sound here) so screenshots can replay it exactly.
import { FIELD, STEP, NIGHT_SECONDS, WIN_SCORE, START_HEARTS, PLAYER, ORB, COMBO_WINDOW, WAVE_SECONDS } from './config.js';
import { mulberry32, rangeRandom } from './random.js';

export const EVENT_OVER = 1;
export const EVENT_WIN = 2;
export const EVENT_HURT = 4;
export const EVENT_COLLECT = 8;
export const EVENT_GOLDEN = 16;
export const EVENT_POWER = 32;
export const EVENT_WAVE = 64;

export const KIND_POLLEN = 'pollen';
export const KIND_DEW = 'dew';
export const KIND_GOLDEN = 'golden';
export const KIND_WASP = 'wasp';
export const KIND_THORN = 'thorn';
export const KIND_SHIELD = 'shield';
export const KIND_MAGNET = 'magnet';
export const KIND_SLOW = 'slow';

export class World {
  constructor(seed) { this.seed = seed || 1; this.reset(); }
  reset() {
    this.random = mulberry32(this.seed);
    this.time = 0;
    this.state = {
      score: 0, best: 0, hearts: START_HEARTS, timeLeft: NIGHT_SECONDS,
      wave: 1, combo: 0, comboTimer: 0, multiplier: 1, over: false, won: false,
      dashCooldown: 0, invuln: 0, shield: 0, magnet: 0, slow: 0, flash: 0, shake: 0,
      collected: 0, goldenCaught: 0, waspsDodged: 0,
    };
    this.player = { x: FIELD.width / 2, y: FIELD.height - 90, vx: 0, vy: 0, angle: -Math.PI / 2, dashTime: 0, wing: 0 };
    this.orbs = []; this.wasps = []; this.thorns = []; this.powers = []; this.particles = []; this.floaters = [];
    this.spawnTimer = 0; this.waspTimer = 4; this.powerTimer = 14; this.goldenTimer = 9; this.waveTimer = WAVE_SECONDS;
    for (let i = 0; i < 5; i += 1) this.spawnOrb(true);
    for (let i = 0; i < 2; i += 1) this.spawnThorn(true);
  }
  spawnOrb(anywhere) {
    const r = this.random();
    const kind = r < 0.62 ? KIND_POLLEN : r < 0.88 ? KIND_DEW : KIND_POLLEN;
    this.orbs.push({ kind, x: rangeRandom(this.random, 40, FIELD.width - 40), y: anywhere ? rangeRandom(this.random, 60, FIELD.height - 120) : -20, radius: kind === KIND_DEW ? 11 : 9, bob: this.random() * 6.28, drift: rangeRandom(this.random, 12, 30), life: 14 });
  }
  spawnGolden() { this.orbs.push({ kind: KIND_GOLDEN, x: rangeRandom(this.random, 60, FIELD.width - 60), y: rangeRandom(this.random, 80, 260), radius: 13, bob: 0, drift: 55, life: 6, vx: rangeRandom(this.random, -40, 40) }); }
  spawnWasp() {
    const edge = Math.floor(this.random() * 2);
    this.wasps.push({ kind: KIND_WASP, x: edge ? FIELD.width + 20 : -20, y: rangeRandom(this.random, 50, FIELD.height - 150), radius: 15, speed: rangeRandom(this.random, 55, 75) + this.state.wave * 6, phase: this.random() * 6.28, dir: edge ? -1 : 1, life: 12 });
  }
  spawnThorn(anywhere) { this.thorns.push({ kind: KIND_THORN, x: rangeRandom(this.random, 50, FIELD.width - 50), y: anywhere ? rangeRandom(this.random, 80, FIELD.height - 80) : -24, radius: 13, speed: rangeRandom(this.random, 22, 42), sway: rangeRandom(this.random, 0.4, 1.1), phase: this.random() * 6.28 }); }
  spawnPower() {
    const kinds = [KIND_SHIELD, KIND_MAGNET, KIND_SLOW];
    const kind = kinds[Math.floor(this.random() * kinds.length)];
    this.powers.push({ kind, x: rangeRandom(this.random, 60, FIELD.width - 60), y: -20, radius: 13, speed: 34, life: 12 });
  }
  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i += 1) {
      const a = this.random() * 6.283, s = rangeRandom(this.random, 20, speed);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rangeRandom(this.random, 0.3, 0.7), max: 0.7, color, radius: rangeRandom(this.random, 2, 4.5) });
    }
  }
  floater(x, y, text, color) { this.floaters.push({ x, y, text, color, life: 1 }); }
  step(dt, steer, dash, quiet) {
    const s = this.state;
    if (s.over) return 0;
    let events = 0;
    const slowFactor = s.slow > 0 ? 0.55 : 1;
    const wdt = dt * slowFactor;
    this.time += dt;
    s.timeLeft = Math.max(0, NIGHT_SECONDS - this.time);
    s.comboTimer -= dt; if (s.comboTimer <= 0) { s.combo = 0; s.multiplier = 1; }
    s.dashCooldown = Math.max(0, s.dashCooldown - dt);
    s.invuln = Math.max(0, s.invuln - dt); s.shield = Math.max(0, s.shield - dt);
    s.magnet = Math.max(0, s.magnet - dt); s.slow = Math.max(0, s.slow - dt);
    s.flash = Math.max(0, s.flash - dt * 2); s.shake = Math.max(0, s.shake - dt * 3);
    // Wave clock: every 20 s the garden gets busier and a banner fires.
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) { this.waveTimer = WAVE_SECONDS; s.wave += 1; events |= EVENT_WAVE; this.spawnWasp(); this.spawnWasp(); }
    // Player movement + dash.
    const p = this.player;
    p.wing += dt * (steer.x || steer.y ? 22 : 12);
    if (dash && s.dashCooldown <= 0 && (steer.x || steer.y)) {
      p.dashTime = PLAYER.dashTime; s.dashCooldown = PLAYER.dashCooldown;
      p.vx = steer.x * PLAYER.dashSpeed; p.vy = steer.y * PLAYER.dashSpeed;
    }
    if (p.dashTime > 0) { p.dashTime -= dt; }
    else { p.vx = steer.x * PLAYER.speed; p.vy = steer.y * PLAYER.speed; }
    p.x = Math.min(FIELD.width - 18, Math.max(18, p.x + p.vx * dt));
    p.y = Math.min(FIELD.height - 18, Math.max(18, p.y + p.vy * dt));
    if (steer.x || steer.y) p.angle = Math.atan2(steer.y, steer.x);
    // Spawning.
    this.spawnTimer -= wdt;
    if (this.spawnTimer <= 0) { this.spawnTimer = Math.max(1.1, 1.9 - s.wave * 0.08); this.spawnOrb(false); }
    this.waspTimer -= wdt;
    if (this.waspTimer <= 0) { this.waspTimer = Math.max(2.4, 5.0 - s.wave * 0.3); this.spawnWasp(); }
    this.goldenTimer -= wdt;
    if (this.goldenTimer <= 0) { this.goldenTimer = rangeRandom(this.random, 11, 16); this.spawnGolden(); }
    this.powerTimer -= wdt;
    if (this.powerTimer <= 0) { this.powerTimer = rangeRandom(this.random, 13, 19); this.spawnPower(); }
    if (this.random() < 0.0025) this.spawnThorn(false);
    // Orbs drift down and bob; magnet pulls them in.
    for (const o of this.orbs) {
      o.bob += wdt * 3; o.life -= wdt;
      o.y += o.drift * wdt * 0.4;
      o.x += Math.sin(o.bob) * 12 * wdt;
      if (o.kind === KIND_GOLDEN) o.x += (o.vx || 0) * wdt;
      if (s.magnet > 0) { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < 170 && d > 1) { o.x += dx / d * 190 * wdt; o.y += dy / d * 190 * wdt; } }
      if (o.x < 10 || o.x > FIELD.width - 10) o.vx = -(o.vx || 0);
    }
    this.orbs = this.orbs.filter((o) => o.life > 0 && o.y < FIELD.height + 30);
    // Wasps weave across and drift toward the moth.
    for (const w of this.wasps) {
      w.phase += wdt * 3; w.life -= wdt;
      w.x += w.dir * w.speed * wdt;
      w.y += Math.sin(w.phase) * 46 * wdt + (p.y - w.y) * 0.12 * wdt;
      if (w.x < -40 || w.x > FIELD.width + 40) w.life = 0;
    }
    this.wasps = this.wasps.filter((w) => w.life > 0);
    for (const t of this.thorns) { t.phase += wdt; t.y += t.speed * wdt; t.x += Math.sin(t.phase * t.sway) * 22 * wdt; }
    this.thorns = this.thorns.filter((t) => t.y < FIELD.height + 30);
    for (const pw of this.powers) { pw.y += pw.speed * wdt; pw.life -= wdt; }
    this.powers = this.powers.filter((pw) => pw.life > 0 && pw.y < FIELD.height + 30);
    // Collecting: combo grows while the chain stays alive, multiplier up to x5.
    const collect = (o) => {
      s.combo += 1; s.comboTimer = COMBO_WINDOW;
      s.multiplier = Math.min(3, 1 + Math.floor(s.combo / 6));
      const base = o.kind === KIND_GOLDEN ? ORB.golden : o.kind === KIND_DEW ? ORB.dew : ORB.pollen;
      const pts = base * s.multiplier;
      s.score += pts; s.collected += 1;
      const color = o.kind === KIND_GOLDEN ? '#ffb347' : o.kind === KIND_DEW ? '#6fd3ff' : '#ffd94d';
      this.burst(o.x, o.y, color, o.kind === KIND_GOLDEN ? 16 : 8, 120);
      this.floater(o.x, o.y - 14, `+${pts}`, color);
      if (o.kind === KIND_GOLDEN) { s.goldenCaught += 1; events |= EVENT_GOLDEN; } else events |= EVENT_COLLECT;
    };
    for (const o of [...this.orbs]) {
      if (Math.hypot(o.x - p.x, o.y - p.y) < o.radius + PLAYER.radius + 4) { this.orbs.splice(this.orbs.indexOf(o), 1); collect(o); }
    }
    for (const pw of [...this.powers]) {
      if (Math.hypot(pw.x - p.x, pw.y - p.y) < pw.radius + PLAYER.radius + 4) {
        this.powers.splice(this.powers.indexOf(pw), 1);
        if (pw.kind === KIND_SHIELD) s.shield = 8;
        if (pw.kind === KIND_MAGNET) s.magnet = 9;
        if (pw.kind === KIND_SLOW) s.slow = 7;
        this.floater(p.x, p.y - 26, pw.kind === KIND_SHIELD ? 'SHIELD!' : pw.kind === KIND_MAGNET ? 'MAGNET!' : 'SLOW TIME!', '#8dff9e');
        this.burst(p.x, p.y, '#8dff9e', 10, 100);
        events |= EVENT_POWER;
      }
    }
    // Getting stung: shield absorbs it, otherwise a heart and a knockback.
    const hit = () => {
      if (s.invuln > 0 || p.dashTime > 0) return;
      if (s.shield > 0) { s.shield = 0; s.invuln = 1; this.burst(p.x, p.y, '#8dff9e', 12, 140); this.floater(p.x, p.y - 26, 'SHIELD SAVED YOU', '#8dff9e'); return; }
      s.hearts -= 1; s.invuln = 2.0; s.combo = 0; s.multiplier = 1; s.flash = 1; s.shake = 0.6;
      this.burst(p.x, p.y, '#ff5a4e', 14, 160);
      events |= EVENT_HURT;
      if (s.hearts <= 0) { s.over = true; s.won = false; events |= EVENT_OVER; }
    };
    for (const w of this.wasps) if (Math.hypot(w.x - p.x, w.y - p.y) < w.radius + PLAYER.radius - 7) hit();
    for (const t of this.thorns) if (Math.hypot(t.x - p.x, t.y - p.y) < t.radius + PLAYER.radius - 8) hit();
    // Particles and floaters fade.
    for (const pt of this.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const f of this.floaters) { f.y -= 34 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);
    // Dawn: win by reaching the harvest target, lose by falling short.
    if (this.time >= NIGHT_SECONDS - STEP / 2 && !s.over) {
      s.over = true; s.won = s.score >= WIN_SCORE;
      events |= EVENT_OVER | (s.won ? EVENT_WIN : 0);
    }
    if (!quiet && s.over && s.won) events |= EVENT_WIN;
    return events;
  }
}
