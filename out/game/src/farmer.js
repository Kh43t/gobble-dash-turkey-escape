// Farmer Bram: the chaser. He never stops coming, but he is old, out of
// shape, and easily fooled by a haystack. The gap between him and Tom is
// the game's real health bar.
import { TUNING } from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 210 - TUNING.startGap;
    this.runCycle = 0;
    this.shoutCooldown = 0;
    this.mood = 'chasing';
    this.tripTimer = 0;
  }

  get gapToTurkey() {
    return 210 - this.x;
  }

  closeIn(now, deltaMs, turkeyHiding, turkeyStunned) {
    const dt = deltaMs / 16.667;
    let rate = TUNING.farmerCloseRate;
    if (turkeyHiding) rate = -TUNING.farmerFallBackRate * 0.8;
    if (turkeyStunned) rate *= 2.2;
    this.x += rate * dt;
    this.runCycle += dt * 0.3;
    if (this.shoutCooldown > 0) this.shoutCooldown -= deltaMs;
  }

  fallBack(now, deltaMs, amount) {
    // A bonus is paid at once, in full: corn, a clean pass and a good hide
    // each buy real distance from Bram.
    this.x -= amount;
  }

  trip(now) {
    this.tripTimer = now + 900;
    this.mood = 'tripped';
  }

  update(now) {
    if (this.mood === 'tripped' && now >= this.tripTimer) this.mood = 'chasing';
  }

  shout(now, sounds) {
    if (now < this.shoutCooldown) return;
    this.shoutCooldown = 5200;
    sounds.farmerShout();
  }

  caughtTurkey() {
    return this.x >= 210 - 18;
  }

  screenX() {
    return this.x;
  }
}
