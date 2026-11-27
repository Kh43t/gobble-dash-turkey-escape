// Gobble Dash sound: every effect and the banjo-ish bassline are synthesised
// live with WebAudio. No audio files, no network, nothing to load.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, seconds, type, volume, slideTo) {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + seconds);
    gain.gain.setValueAtTime(volume || 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  noise(seconds, volume, lowpass) {
    if (this.muted || !this.context) return;
    const now = this.context.currentTime;
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(now);
  }

  gobble() {
    // Tom's signature: three descending clucks.
    if (!this.context || this.muted) return;
    [520, 430, 340].forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.09, 'square', 0.07, freq * 0.7), i * 90);
    });
  }

  jump() { this.tone(280, 0.16, 'sine', 0.12, 620); }
  doubleJump() { this.tone(420, 0.14, 'triangle', 0.12, 880); }
  slide() { this.noise(0.18, 0.08, 900); }
  corn() { this.tone(880, 0.08, 'sine', 0.1); window.setTimeout(() => this.tone(1320, 0.12, 'sine', 0.1), 60); }
  feather() { [660, 880, 1100, 1320].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.12, 'triangle', 0.09), i * 70)); }
  thud() { this.tone(140, 0.22, 'sawtooth', 0.16, 55); this.noise(0.2, 0.14, 500); }
  knifeWhizz() { this.noise(0.28, 0.1, 3200); }
  farmerShout() { this.tone(180, 0.3, 'sawtooth', 0.12, 90); }
  caught() { [392, 330, 262, 196].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.28, 'triangle', 0.12), i * 170)); }
  escaped() { [523, 659, 784, 1047, 1319].forEach((f, i) => window.setTimeout(() => this.tone(f, 0.3, 'triangle', 0.11), i * 130)); }
  click() { this.tone(700, 0.05, 'square', 0.05); }

  startMusic() {
    if (this.musicTimer || !this.context) return;
    // A cheerful 8-step bassline, C major pentatonic, banjo-pluck timbre.
    const bass = [131, 165, 196, 165, 131, 196, 220, 165];
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      const freq = bass[this.musicStep % bass.length];
      this.tone(freq, 0.22, 'triangle', 0.05);
      if (this.musicStep % 2 === 0) this.tone(freq * 2, 0.1, 'sine', 0.025);
      this.musicStep += 1;
    }, 240);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
