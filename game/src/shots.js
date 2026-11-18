// Deterministic screenshot scenes behind ?shot=start|play|win|lose.
// Each replays the real rules forward from a fresh world, steered by an autopilot,
// so the frame is what a real game looks like and the same seed gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER, KIND_WASP } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = 1 / 30;
/** Steer toward the best orb, fleeing any wasp that gets close. */
export function autopilot(world, skill) {
  const state = world;
  const p = world.player;
  let threat = null;
  for (const w of world.wasps) {
    const d = Math.hypot(w.x - p.x, w.y - p.y);
    if (d < 110 && (threat === null || d < threat.d)) threat = { d, x: w.x, y: w.y };
  }
  for (const t of world.thorns) {
    const d = Math.hypot(t.x - p.x, t.y - p.y);
    if (d < 95 && (threat === null || d < threat.d)) threat = { d, x: t.x, y: t.y };
  }
  if (threat && skill > 0.5) {
    const dx = p.x - threat.x, dy = p.y - threat.y, d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d, dash: threat.d < 60 };
  }
  let bestOrb = null, bestScore = -1;
  for (const o of world.orbs) {
    const d = Math.hypot(o.x - p.x, o.y - p.y) + 1;
    const value = o.kind === 'golden' ? 50 : o.kind === 'dew' ? 25 : 10;
    const score = (o.y < 60 ? value * 0.3 : value) / d;
    if (score > bestScore) { bestScore = score; bestOrb = o; }
  }
  if (!bestOrb) return { x: 0, y: -1, dash: false };
  const dx = bestOrb.x - p.x, dy = bestOrb.y - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d, dash: false };
}
/** A careless pilot: drifts to the middle and never dodges — it gets stung. */
function carelessPilot(world) {
  const p = world.player;
  const dx = 480 - p.x, dy = 300 - p.y, d = Math.hypot(dx, dy) || 1;
  return { x: dx / d * 0.4, y: dy / d * 0.4, dash: false };
}
export function stageShot(name, world) {
  world.reset();
  if (name === 'start') {
    for (let i = 0; i < 4 / STEP; i += 1) world.step(STEP, { x: 0, y: 0 }, false, true);
    return { screen: SCREEN_TITLE, best: 120 };
  }
  if (name === 'play') {
    for (let i = 0; i < 26 / STEP; i += 1) {
      const s = autopilot(world, 1);
      if (world.step(STEP, s, s.dash, true) & EVENT_OVER) break;
    }
    return { screen: SCREEN_PLAY, best: 120 };
  }
  if (name === 'win') {
    // A sharp night: the pilot plays the full 90 s and clears the target.
    for (let i = 0; i < 90 / STEP; i += 1) {
      const s = autopilot(world, 1);
      const ev = world.step(STEP, s, s.dash, true);
      if (ev & EVENT_OVER) break;
    }
    return { screen: world.state.won ? SCREEN_WIN : SCREEN_PLAY, best: 120 };
  }
  // lose: the careless pilot is stung out, or dawn catches it short.
  for (let i = 0; i < 90 / STEP; i += 1) {
    if (world.step(STEP, carelessPilot(world), false, true) & EVENT_OVER) break;
  }
  return { screen: SCREEN_OVER, best: 120, reason: world.state.hearts === 0 ? 'stung' : 'dawn' };
}
export { SAMPLE, KIND_WASP };
