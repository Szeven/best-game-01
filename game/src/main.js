// Glowmoth entry point: game loop, screens, pause, restart and screenshot mode.
// ?shot=start|play|win|lose renders one deterministic scene and sets __shotReady.
import { FIELD, STEP } from './config.js';
import { World, EVENT_OVER, EVENT_WIN, EVENT_HURT, EVENT_COLLECT, EVENT_GOLDEN, EVENT_POWER, EVENT_WAVE } from './world.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawWorld, drawHud, drawTitle, drawPause, drawWin, drawOver, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const world = new World(seed);
const input = new Input(canvas);
const sounds = new SoundBank();
let screen = SCREEN_TITLE;
let best = 0;
try { best = Number(localStorage.getItem('glowmoth-best') || '0') || 0; } catch { best = 0; }
let accumulator = 0;
let last = performance.now();
let time = 0;
let loseReason = 'dawn';
let shotReady = false;

function saveBest() {
  try { localStorage.setItem('glowmoth-best', String(Math.max(best, world.state.score))); } catch { /* storage unavailable */ }
}
function announce(text) { if (statusEl) statusEl.textContent = text; }
function startGame() {
  world.reset();
  screen = SCREEN_PLAY;
  sounds.ensure();
  announce(`Night begins. Gather 400 pollen before dawn. Score 0, 3 hearts.`);
}
function endGame() {
  saveBest();
  best = Math.max(best, world.state.score);
  if (world.state.won) { screen = SCREEN_WIN; sounds.win(); announce(`You win! Harvest ${world.state.score}. Press Enter to play again.`); }
  else { screen = SCREEN_OVER; sounds.lose(); announce(`Night over. Score ${world.state.score}. Press Enter to try again.`); }
}
function handleEvents(events) {
  if (events & EVENT_COLLECT) sounds.collect(world.state.combo);
  if (events & EVENT_GOLDEN) sounds.golden();
  if (events & EVENT_POWER) sounds.power();
  if (events & EVENT_HURT) { sounds.hurt(); loseReason = 'stung'; }
  if (events & EVENT_WAVE) sounds.wave();
  if (events & EVENT_WIN) { /* win fanfare in endGame */ }
  if (events & EVENT_OVER) endGame();
}
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener('resize', () => { resize(); if (shotName) draw(); });
resize();

function scale() { return Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height); }
function draw() {
  const s = scale();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#050a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = (canvas.width - FIELD.width * s) / 2;
  const oy = (canvas.height - FIELD.height * s) / 2;
  ctx.setTransform(s, 0, 0, s, ox, oy);
  if (world.state.shake > 0) ctx.translate((Math.random() - 0.5) * world.state.shake * 14, (Math.random() - 0.5) * world.state.shake * 14);
  if (screen === SCREEN_TITLE) drawTitle(ctx, best, time);
  else if (screen === SCREEN_WIN) { drawWorld(ctx, world, time); drawWin(ctx, world, best); }
  else if (screen === SCREEN_OVER) { drawWorld(ctx, world, time); drawOver(ctx, world, best, loseReason); }
  else if (screen === SCREEN_PAUSE) { drawWorld(ctx, world, time); drawHud(ctx, world, best); drawPause(ctx); }
  else { drawWorld(ctx, world, time); drawHud(ctx, world, best); }
}

if (shotName) {
  // Screenshot mode: stage the scene, draw it once, signal readiness.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  if (staged.reason) loseReason = staged.reason;
  best = staged.best;
  if (screen === SCREEN_WIN) saveBest();
  time = 26;
  draw();
  window.__shotReady = true;
  shotReady = true;
} else {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'enter' || key === ' ') {
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) { e.preventDefault(); startGame(); }
      else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
    }
    if (key === 'p' && (screen === SCREEN_PLAY || screen === SCREEN_PAUSE)) screen = screen === SCREEN_PLAY ? SCREEN_PAUSE : SCREEN_PLAY;
    if (key === 'r' && screen !== SCREEN_TITLE) startGame();
    if (key === 'm') { sounds.ensure(); const muted = sounds.toggleMute(); announce(muted ? 'Sound off' : 'Sound on'); }
  });
  canvas.addEventListener('pointerdown', () => {
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) startGame();
  });
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now; time += dt;
    if (screen === SCREEN_PLAY) {
      sounds.music(dt);
      const steer = input.steer(world.player, scale());
      const dash = input.consumeDash();
      if (dash && world.state.dashCooldown <= 0) sounds.dash();
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        handleEvents(world.step(STEP, steer, dash, false));
        if (screen !== SCREEN_PLAY) break;
      }
    }
    draw();
  };
  requestAnimationFrame(frame);
}
export { shotReady };
