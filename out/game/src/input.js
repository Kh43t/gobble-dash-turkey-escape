// Gobble Dash input: keyboard and mouse, one place, no polling elsewhere.
// The engine reads pressed edges (justPressed) so a held key never double-fires.
export class Controls {
  constructor(canvas) {
    this.jumpQueued = false;
    this.slideQueued = false;
    this.actionQueued = false;
    this.pauseQueued = false;
    this.muteQueued = false;
    this.slideHeld = false;
    this.pointerX = 0;
    this.pointerY = 0;
    this.canvas = canvas;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  onKeyDown(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.jumpQueued = true;
      event.preventDefault();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.slideQueued = true;
      this.slideHeld = true;
      event.preventDefault();
    } else if (key === 'Enter' || key === 'r' || key === 'R') {
      this.actionQueued = true;
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      this.pauseQueued = true;
    } else if (key === 'm' || key === 'M') {
      this.muteQueued = true;
    }
  }

  onKeyUp(event) {
    const key = event.key;
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.slideHeld = false;
  }

  onPointerDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.pointerY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
    // A click low on the screen slides; anywhere else jumps.
    if (this.pointerY > this.canvas.height * 0.62) {
      this.slideQueued = true;
    } else {
      this.jumpQueued = true;
    }
    this.actionQueued = true;
  }

  consumeJump() { const value = this.jumpQueued; this.jumpQueued = false; return value; }
  consumeSlide() { const value = this.slideQueued; this.slideQueued = false; return value; }
  consumeAction() { const value = this.actionQueued; this.actionQueued = false; return value; }
  consumePause() { const value = this.pauseQueued; this.pauseQueued = false; return value; }
  consumeMute() { const value = this.muteQueued; this.muteQueued = false; return value; }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
  }
}
