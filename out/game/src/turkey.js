// Tom the turkey: the player. Runs, jumps (twice), slides, hides and flaps.
// Physics live here; drawing lives in render.js.
import { TUNING } from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 210;
    this.y = TUNING.groundY;
    this.vy = 0;
    this.width = 64;
    this.height = 74;
    this.onGround = true;
    this.jumpsUsed = 0;
    this.sliding = false;
    this.slideUntil = 0;
    this.hiding = false;
    this.runCycle = 0;
    this.flap = 0;
    this.stunUntil = 0;
    this.invulnerableUntil = 0;
    this.squash = 0;
  }

  get feetY() { return this.y; }
  get headY() { return this.y - this.currentHeight(); }

  currentHeight() {
    return this.sliding ? 40 : this.height;
  }

  hitbox() {
    return {
      x: this.x - 26,
      y: this.y - this.currentHeight(),
      w: 52,
      h: this.currentHeight(),
    };
  }

  isStunned(now) { return now < this.stunUntil; }
  isInvulnerable(now) { return now < this.invulnerableUntil; }

  tryJump(now, sounds) {
    if (this.isStunned(now) || this.hiding) return false;
    if (this.onGround) {
      this.vy = TUNING.jumpVelocity;
      this.onGround = false;
      this.jumpsUsed = 1;
      this.sliding = false;
      this.flap = 1;
      sounds.jump();
      return true;
    }
    if (this.jumpsUsed < 2) {
      this.vy = TUNING.doubleJumpVelocity;
      this.jumpsUsed = 2;
      this.flap = 1;
      sounds.doubleJump();
      return true;
    }
    return false;
  }

  trySlide(now, sounds) {
    if (this.isStunned(now) || !this.onGround || this.hiding) return false;
    this.sliding = true;
    this.slideUntil = now + TUNING.slideTimeMs;
    sounds.slide();
    return true;
  }

  startHiding() {
    if (!this.onGround) return;
    this.hiding = true;
    this.sliding = false;
  }

  stopHiding() { this.hiding = false; }

  hurt(now, sounds) {
    this.stunUntil = now + TUNING.obstacleHitStunMs;
    this.invulnerableUntil = now + TUNING.invulnerableMs;
    this.vy = -6;
    this.onGround = false;
    this.sliding = false;
    this.hiding = false;
    this.squash = 1;
    sounds.thud();
  }

  update(now, deltaMs, speed) {
    const dt = deltaMs / 16.667;
    if (this.sliding && now >= this.slideUntil) this.sliding = false;
    if (!this.onGround) {
      this.vy += TUNING.gravity * dt;
      this.y += this.vy * dt;
      if (this.y >= TUNING.groundY) {
        this.y = TUNING.groundY;
        this.vy = 0;
        this.onGround = true;
        this.jumpsUsed = 0;
        this.squash = 0.6;
      }
    }
    if (this.onGround && !this.sliding && !this.hiding) {
      this.runCycle += dt * (0.22 + speed * 0.012);
    }
    if (this.flap > 0) this.flap = Math.max(0, this.flap - dt * 0.08);
    if (this.squash > 0) this.squash = Math.max(0, this.squash - dt * 0.05);
  }
}
