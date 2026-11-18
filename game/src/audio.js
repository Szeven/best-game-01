// Tiny WebAudio synth: every sound is generated, no audio files are shipped.
export class SoundBank {
  constructor() { this.ctx = null; this.muted = false; this.musicTimer = 0; this.musicStep = 0; }
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  toggleMute() { this.muted = !this.muted; return this.muted; }
  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  collect(combo) { const base = 520 + Math.min(combo, 8) * 45; this.tone(base, 0.12, 'sine', 0.14); this.tone(base * 1.5, 0.16, 'sine', 0.08, base * 2); }
  golden() { [660, 880, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.14), i * 70)); }
  hurt() { this.tone(220, 0.25, 'sawtooth', 0.16, 70); }
  dash() { this.tone(300, 0.12, 'sine', 0.08, 900); }
  power() { this.tone(440, 0.2, 'triangle', 0.12, 880); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.14), i * 120)); }
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sine', 0.12), i * 140)); }
  wave() { this.tone(330, 0.15, 'square', 0.05, 495); }
  /** Gentle night music: a slow pentatonic lullaby, one note per step. */
  music(dt) {
    if (!this.ctx || this.muted) return;
    this.musicTimer += dt;
    if (this.musicTimer < 0.42) return;
    this.musicTimer = 0;
    const scale = [262, 294, 330, 392, 440, 523, 587];
    const note = scale[this.musicStep % scale.length];
    this.musicStep += 1;
    this.tone(note, 0.5, 'sine', 0.035);
    if (this.musicStep % 4 === 0) this.tone(note / 2, 0.8, 'sine', 0.03);
  }
}
