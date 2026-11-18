// Keyboard + mouse + touch input, normalised to one steering vector per frame.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: null, y: null, active: false };
    this.dashQueued = false;
    this.anyKey = false;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      this.anyKey = true;
      if (e.key === ' ') this.dashQueued = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.active = true;
    });
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.active = true;
      this.dashQueued = true;
    });
    window.addEventListener('blur', () => { this.keys.clear(); });
  }
  /** Steering direction: keyboard wins, else drift toward the pointer. */
  steer(player, scale) {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len, keyboard: true };
    }
    if (this.mouse.active && this.mouse.x !== null) {
      const px = player.x * scale, py = player.y * scale;
      const dx = this.mouse.x - px, dy = this.mouse.y - py;
      const d = Math.hypot(dx, dy);
      if (d > 14) return { x: dx / d, y: dy / d, keyboard: false };
    }
    return { x: 0, y: 0, keyboard: false };
  }
  consumeDash() { const d = this.dashQueued; this.dashQueued = false; return d; }
  pressed(code) { return this.keys.has(code); }
}
