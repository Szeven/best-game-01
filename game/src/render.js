// Glowmoth renderer: the night garden, the moth, the HUD and every menu screen.
// All art is drawn in code — gradients, petals, glow — no image files are shipped.
import { FIELD, NIGHT_SECONDS, WIN_SCORE, COLORS } from './config.js';
import { KIND_DEW, KIND_GOLDEN, KIND_WASP, KIND_THORN, KIND_SHIELD, KIND_MAGNET, KIND_SLOW } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function glowDot(ctx, x, y, radius, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius * 3, 0, 6.283); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, 6.283); ctx.fill();
}
function drawFlower(ctx, x, y, r, color, time, seed) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * 6.283 + seed;
    ctx.fillStyle = color; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.62, r * 0.34, a, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 6.283); ctx.fill();
  ctx.restore();
}
export function drawGarden(ctx, time, world) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, COLORS.nightTop); grad.addColorStop(0.6, COLORS.night); grad.addColorStop(1, COLORS.garden);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 173.3) % FIELD.width, y = (i * 97.7) % 210;
    ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(time * 0.7 + i));
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // Moon.
  glowDot(ctx, FIELD.width - 90, 66, 26, 'rgba(240,244,255,0.9)');
  ctx.fillStyle = '#f4f7ff'; ctx.beginPath(); ctx.arc(FIELD.width - 90, 66, 24, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#dbe4f2'; ctx.beginPath(); ctx.arc(FIELD.width - 98, 60, 6, 0, 6.283); ctx.arc(FIELD.width - 80, 74, 4, 0, 6.283); ctx.fill();
  // Firefly specks drifting in the background.
  for (let i = 0; i < 14; i += 1) {
    const x = (i * 211 + Math.sin(time * 0.3 + i * 2) * 30 + FIELD.width) % FIELD.width;
    const y = 120 + ((i * 137) % 380) + Math.cos(time * 0.5 + i) * 14;
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(time + i * 1.7);
    ctx.fillStyle = '#cfe89a'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Flower beds along the bottom.
  const flowers = [[70, 566, 13, '#e58fb1'], [190, 578, 11, '#9db8ff'], [330, 568, 12, '#e58fb1'], [470, 580, 10, '#ffb347'], [620, 570, 13, '#9db8ff'], [760, 578, 11, '#e58fb1'], [890, 568, 12, '#ffb347']];
  for (const [x, y, r, c] of flowers) drawFlower(ctx, x + Math.sin(time * 0.8 + x) * 2, y, r, c, time, x);
  ctx.fillStyle = 'rgba(20,60,40,0.9)'; ctx.fillRect(0, FIELD.height - 14, FIELD.width, 14);
  if (world) {
    for (const pt of world.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.radius, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
function drawOrb(ctx, o, time) {
  const bob = Math.sin(o.bob) * 2;
  if (o.kind === KIND_GOLDEN) {
    glowDot(ctx, o.x, o.y + bob, 9, 'rgba(255,179,71,0.95)');
    ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(o.x, o.y + bob, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - 2, o.y + bob - 2, 2, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,179,71,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x, o.y + bob, 12 + Math.sin(time * 5) * 2, 0, 6.283); ctx.stroke();
  } else if (o.kind === KIND_DEW) {
    glowDot(ctx, o.x, o.y + bob, 7, 'rgba(111,211,255,0.9)');
    ctx.fillStyle = '#6fd3ff'; ctx.beginPath(); ctx.arc(o.x, o.y + bob, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - 2, o.y + bob - 2, 2, 0, 6.283); ctx.fill();
  } else {
    glowDot(ctx, o.x, o.y + bob, 6, 'rgba(255,217,77,0.9)');
    ctx.fillStyle = '#ffd94d'; ctx.beginPath(); ctx.arc(o.x, o.y + bob, 5, 0, 6.283); ctx.fill();
  }
}
function drawWasp(ctx, w, time) {
  ctx.save(); ctx.translate(w.x, w.y);
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2b0d0d';
  ctx.fillRect(-6, -9, 4, 18); ctx.fillRect(2, -9, 4, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const flap = Math.sin(time * 40 + w.phase) * 0.6;
  ctx.beginPath(); ctx.ellipse(-4, -12, 9, 4, -0.5 + flap, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -12, 9, 4, 0.5 - flap, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(w.dir > 0 ? 10 : -10, -3, 2.5, 0, 6.283); ctx.fill();
  ctx.restore();
}
function drawThorn(ctx, t, time) {
  ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(Math.sin(t.phase) * 0.3);
  ctx.fillStyle = '#b06fd3';
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) { const a = (i / 8) * 6.283; const r = i % 2 ? 7 : 15; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e9c8ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.283); ctx.fill();
  ctx.restore();
}
export function drawMoth(ctx, p, state, time) {
  ctx.save(); ctx.translate(p.x, p.y);
  if (state.invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  if (state.shield > 0) { ctx.strokeStyle = 'rgba(141,255,158,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(time * 4) * 2, 0, 6.283); ctx.stroke(); }
  if (state.magnet > 0) { ctx.strokeStyle = 'rgba(111,211,255,0.5)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); }
  glowDot(ctx, 0, 0, 12, 'rgba(255,243,176,0.55)');
  ctx.rotate(p.angle + Math.PI / 2);
  const flap = Math.sin(p.wing) * 0.55;
  ctx.fillStyle = 'rgba(255,240,180,0.95)';
  ctx.beginPath(); ctx.ellipse(-13, -4, 13, 7, -0.6 - flap, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13, -4, 13, 7, 0.6 + flap, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 12, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#7a5c1e'; ctx.beginPath(); ctx.arc(-3, -6, 2, 0, 6.283); ctx.arc(3, -6, 2, 0, 6.283); ctx.fill();
  ctx.restore();
}
export function drawWorld(ctx, world, time) {
  drawGarden(ctx, time, world);
  const s = world.state;
  for (const o of world.orbs) drawOrb(ctx, o, time);
  for (const pw of world.powers) {
    const label = pw.kind === KIND_SHIELD ? 'S' : pw.kind === KIND_MAGNET ? 'M' : 'T';
    const color = '#8dff9e';
    glowDot(ctx, pw.x, pw.y, 8, 'rgba(141,255,158,0.8)');
    ctx.fillStyle = '#0e2a1e'; ctx.beginPath(); ctx.arc(pw.x, pw.y, 11, 0, 6.283); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, pw.x, pw.y + 0.5);
  }
  for (const t of world.thorns) drawThorn(ctx, t, time);
  for (const w of world.wasps) drawWasp(ctx, w, time);
  drawMoth(ctx, world.player, s, time);
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (s.flash > 0) { ctx.fillStyle = `rgba(255,60,60,${s.flash * 0.22})`; ctx.fillRect(0, 0, FIELD.width, FIELD.height); }
}
export function drawHud(ctx, world, best) {
  const s = world.state;
  ctx.fillStyle = 'rgba(6,14,24,0.62)'; roundRect(ctx, 10, 10, FIELD.width - 20, 52, 12); ctx.fill();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hud; ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`✦ ${s.score}`, 24, 30);
  ctx.font = '15px sans-serif'; ctx.fillStyle = '#ffd94d';
  ctx.fillText(`/ ${WIN_SCORE} to win`, 24, 50);
  // Hearts.
  ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < s.hearts ? '♥' : '♡';
  ctx.fillStyle = '#ff7a7a'; ctx.fillText(hearts, FIELD.width / 2 - 60, 30);
  ctx.fillStyle = COLORS.hud; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`WAVE ${s.wave}`, FIELD.width / 2 - 60, 50);
  // Dawn timer bar.
  const frac = s.timeLeft / NIGHT_SECONDS;
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(ctx, FIELD.width - 250, 22, 190, 12, 6); ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#ffd94d' : '#ff5a4e'; roundRect(ctx, FIELD.width - 250, 22, 190 * frac, 12, 6); ctx.fill();
  ctx.fillStyle = COLORS.hud; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(`🌙 Dawn in ${Math.ceil(s.timeLeft)}s`, FIELD.width - 24, 28);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#9fb8cc';
  ctx.fillText(`Best ${Math.max(best, s.score)}`, FIELD.width - 24, 50);
  // Combo + active powers.
  if (s.multiplier > 1) {
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffb347'; ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`COMBO x${s.multiplier}`, 24, 84);
  }
  const powers = [];
  if (s.shield > 0) powers.push(`SHIELD ${Math.ceil(s.shield)}s`);
  if (s.magnet > 0) powers.push(`MAGNET ${Math.ceil(s.magnet)}s`);
  if (s.slow > 0) powers.push(`SLOW ${Math.ceil(s.slow)}s`);
  if (powers.length) {
    ctx.textAlign = 'right'; ctx.fillStyle = '#8dff9e'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText(powers.join('  •  '), FIELD.width - 24, 84);
  }
  ctx.textAlign = 'left';
}
function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5,12,22,0.72)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = 'rgba(10,24,40,0.92)'; roundRect(ctx, FIELD.width / 2 - 300, 92, 600, 416, 18); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 2; roundRect(ctx, FIELD.width / 2 - 300, 92, 600, 416, 18); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = accent; ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, FIELD.width / 2, 152);
  ctx.fillStyle = COLORS.hud; ctx.font = '17px sans-serif';
  lines.forEach((line, i) => { ctx.fillText(line, FIELD.width / 2, 196 + i * 30); });
}
export function drawTitle(ctx, best, time) {
  drawGarden(ctx, time, null);
  // A few decorative orbs on the title garden.
  glowDot(ctx, 220, 300, 7, 'rgba(255,217,77,0.9)');
  glowDot(ctx, 700, 240, 8, 'rgba(111,211,255,0.9)');
  glowDot(ctx, 480, 380, 6, 'rgba(255,179,71,0.9)');
  panel(ctx, '✦ GLOWMOTH ✦', [
    'Night Garden Harvest — one moth, one night, one harvest.',
    `Gather ${WIN_SCORE} pollen before dawn breaks (${NIGHT_SECONDS}s).`,
    'Gold pollen +10  •  Blue dew +25  •  Golden moth +50',
    'Wasps and thorn-puffs sting — 3 hearts, then the night ends.',
    'Chain pickups for a combo up to x3. Grab S / M / T power-ups.',
    'Move: WASD / arrows / mouse  •  SPACE: dash  •  P: pause  •  M: mute',
    best > 0 ? `Best harvest so far: ${best}` : 'Your first night in the garden — make it glow.',
    '',
    '▶  Press ENTER or click to start',
  ], '#ffd94d');
}
export function drawPause(ctx) {
  panel(ctx, 'PAUSED', ['The garden waits for you.', '', 'P or ENTER to keep flying', 'R to restart the night'], '#6fd3ff');
}
export function drawWin(ctx, world, best) {
  const s = world.state;
  panel(ctx, '🌅 DAWN — YOU WIN!', [
    `Harvest complete: ${s.score} pollen (target ${WIN_SCORE})`,
    `Golden moths caught: ${s.goldenCaught}  •  Pickups: ${s.collected}  •  Wave ${s.wave}`,
    `Best harvest: ${Math.max(best, s.score)}`,
    '',
    'The garden glows because of you. Play again?',
    '',
    '▶  Press ENTER or click to play again',
  ], '#ffd94d');
}
export function drawOver(ctx, world, best, reason) {
  const s = world.state;
  panel(ctx, '🥀 NIGHT FADES…', [
    reason === 'stung' ? 'The wasps got the better of you.' : `Dawn came with only ${s.score} / ${WIN_SCORE} pollen.`,
    `Score: ${s.score}  •  Pickups: ${s.collected}  •  Wave ${s.wave}`,
    `Best harvest: ${Math.max(best, s.score)}`,
    '',
    'Tip: dash through wasps (SPACE), chain pickups for x3,',
    'and chase the golden moth when it flashes by.',
    '',
    '▶  Press ENTER or click to try again',
  ], '#ff7a7a');
}
