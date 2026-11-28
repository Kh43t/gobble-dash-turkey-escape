// Gobble Dash engine: the state machine, the loop, collisions, scoring and
// the farmer's hunt. It owns the rules; render.js owns the pixels.
import { TUNING, stageFor } from './config.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { Controls } from './input.js';

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Engine {
  constructor(canvas, random) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sounds = new SoundBank();
    this.controls = new Controls(canvas);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World(random);
    this.state = 'title';
    this.score = 0;
    this.distance = 0;
    this.lives = TUNING.startLives;
    this.corn = 0;
    this.feathers = 0;
    this.best = 0;
    this.speed = TUNING.baseSpeed;
    this.flashText = '';
    this.flashUntil = 0;
    this.lastTime = 0;
    this.raf = 0;
    this.paused = false;
    this.frozen = false;
    // frozen is staging-only: a screenshot moment holds its pose while the
    // page keeps rendering (see main.js stageShot). Real play never sets it.
    this.outcome = null;
    this.statusEl = document.getElementById('sr-status');
    try {
      this.best = Number(window.localStorage.getItem('gobble-dash-best') || 0) || 0;
    } catch {
      this.best = 0;
    }
  }

  resetRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset();
    this.score = 0;
    this.distance = 0;
    this.lives = TUNING.startLives;
    this.corn = 0;
    this.feathers = 0;
    this.speed = TUNING.baseSpeed;
    this.outcome = null;
    this.flashText = '';
    this.state = 'playing';
    this.sounds.ensure();
    this.sounds.startMusic();
    this.sounds.gobble();
    this.announce('Tom is running! Jump the fences, dodge the oven!');
  }

  announce(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  speedFor(distance) {
    return Math.min(TUNING.maxSpeed, TUNING.baseSpeed + distance * TUNING.speedRampPerMetre);
  }

  start() {
    const loop = (time) => {
      this.raf = window.requestAnimationFrame(loop);
      const delta = this.lastTime ? Math.min(50, time - this.lastTime) : 16.667;
      this.lastTime = time;
      this.tick(time, delta);
      this.render(time);
    };
    this.raf = window.requestAnimationFrame(loop);
  }

  tick(now, deltaMs) {
    // A frozen staged frame does not advance: the screenshot catches the
    // exact moment the maker staged, not a collision a second later.
    if (this.frozen) return;
    if (this.controls.consumeMute()) {
      this.sounds.ensure();
      const muted = this.sounds.toggleMute();
      this.announce(muted ? 'Sound off' : 'Sound on');
    }
    if (this.controls.consumePause()) {
      if (this.state === 'playing') {
        this.paused = !this.paused;
        if (this.paused) this.sounds.stopMusic();
        else this.sounds.startMusic();
      }
    }
    if (this.paused) return;

    if (this.state === 'title') {
      if (this.controls.consumeAction() || this.controls.consumeJump()) {
        this.sounds.ensure();
        this.sounds.click();
        this.resetRun();
      }
      return;
    }
    if (this.state === 'end') {
      if (this.controls.consumeAction() || this.controls.consumeJump()) {
        this.sounds.click();
        this.resetRun();
      }
      return;
    }
    if (this.state !== 'playing') return;

    // Player input.
    if (this.controls.consumeJump()) this.turkey.tryJump(now, this.sounds);
    if (this.controls.consumeSlide()) {
      const stack = this.world.haystackNear(this.turkey.x);
      if (stack && this.turkey.onGround) {
        this.turkey.startHiding();
        stack.used = true;
        this.farmer.fallBack(now, deltaMs, TUNING.hideBonusGap);
        this.sounds.gobble();
        this.announce('Hidden in the hay! Farmer Bram lost your trail.');
      } else {
        this.turkey.trySlide(now, this.sounds);
      }
    }
    if (!this.controls.slideHeld && this.turkey.hiding) this.turkey.stopHiding();

    // Advance the run.
    this.speed = this.speedFor(this.distance);
    const metresThisFrame = (this.speed * deltaMs) / 16.667 / 9;
    this.distance += metresThisFrame;
    this.score += Math.floor(metresThisFrame * TUNING.metreScore);
    this.turkey.update(now, deltaMs, this.speed);
    this.farmer.closeIn(now, deltaMs, this.turkey.hiding, this.turkey.isStunned(now));
    this.farmer.update(now);
    this.world.update(now, deltaMs, this.speed, this.distance, this.sounds);

    // Farmer catches up: game over.
    if (this.farmer.caughtTurkey()) {
      this.endRun('caught');
      return;
    }
    // Escape: the forest at 1000 m.
    if (this.distance >= TUNING.escapeDistance) {
      this.endRun('escaped');
      return;
    }

    this.checkCollisions(now);
    if (this.farmer.gapToTurkey < 90) this.farmer.shout(now, this.sounds);
  }

  checkCollisions(now) {
    const turkeyBox = this.turkey.hitbox();
    if (!this.turkey.isInvulnerable(now)) {
      for (const obstacle of this.world.obstacles) {
        const box = this.world.obstacleBox(obstacle);
        // Shrink the box a little: near misses should feel fair.
        const fair = { x: box.x + 5, y: box.y + 5, w: box.w - 10, h: box.h - 8 };
        if (boxesOverlap(turkeyBox, fair)) {
          if (obstacle.kind === 'mud') {
            this.speed = Math.max(TUNING.baseSpeed * 0.6, this.speed - 1.2);
            obstacle.passed = true;
            continue;
          }
          this.loseLife(now, obstacle);
          break;
        }
      }
    }
    for (const pickup of this.world.pickups) {
      if (pickup.taken) continue;
      if (boxesOverlap(turkeyBox, this.world.pickupBox(pickup))) {
        pickup.taken = true;
        if (pickup.kind === 'corn') {
          this.corn += 1;
          this.score += TUNING.cornScore;
          this.farmer.fallBack(now, 16.667, 6);
          this.sounds.corn();
        } else {
          this.feathers += 1;
          this.score += TUNING.featherScore;
          if (this.lives < 3) this.lives += 1;
          this.sounds.feather();
          this.announce('Golden feather! A life back!');
        }
      }
    }
    // Passing an obstacle cleanly nudges the farmer back a little.
    for (const obstacle of this.world.obstacles) {
      if (!obstacle.passed && obstacle.x + obstacle.w / 2 < this.turkey.x - 30) {
        obstacle.passed = true;
        this.score += 10;
        this.farmer.fallBack(now, 16.667, 4);
      }
    }
  }

  loseLife(now, obstacle) {
    this.lives -= 1;
    this.turkey.hurt(now, this.sounds);
    this.farmer.x += TUNING.obstacleHitGapLoss;
    this.flashText = obstacle.kind === 'oven' ? 'TOO HOT!' : obstacle.kind === 'knifeSwing' || obstacle.kind === 'knifeFall' ? 'THE KNIFE!' : 'OUCH!';
    this.flashUntil = now + 700;
    if (this.lives <= 0) {
      this.endRun('caught');
    } else {
      this.announce(`Ouch! ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
    }
  }

  endRun(outcome) {
    this.state = 'end';
    this.outcome = outcome;
    this.sounds.stopMusic();
    if (outcome === 'escaped') {
      this.score += 500;
      this.sounds.escaped();
      this.announce(`Escaped! Final score ${this.score}.`);
    } else {
      this.sounds.caught();
      this.announce(`Caught! Final score ${this.score}. Press R to run again.`);
    }
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem('gobble-dash-best', String(this.best));
      } catch {
        // Private mode: the best score just does not persist.
      }
    }
  }

  hudState() {
    return {
      score: this.score,
      distance: this.distance,
      lives: Math.max(0, this.lives),
      stageName: stageFor(this.distance).name,
      gap: this.farmer.gapToTurkey,
      corn: this.corn,
      best: this.best,
    };
  }

  render(now) {
    const stage = stageFor(this.distance);
    const renderer = this.renderer;
    renderer.drawBackground(stage, this.distance, now);
    renderer.drawGround(this.distance);
    for (const stack of this.world.haystacks) {
      renderer.drawHaystack(stack, this.turkey.hiding);
    }
    for (const obstacle of this.world.obstacles) renderer.drawObstacle(obstacle, now);
    for (const pickup of this.world.pickups) {
      if (!pickup.taken) renderer.drawPickup(pickup, now);
    }
    renderer.drawFarmer(this.farmer, now, this.state === 'playing');
    renderer.drawTurkey(this.turkey, now);
    if (this.state === 'playing' || this.state === 'end') {
      renderer.drawHud(this.hudState());
    }
    if (this.state === 'title') renderer.drawTitle(now);
    if (this.state === 'end') renderer.drawEnd(this.outcome, this.hudState());
    if (this.paused && this.state === 'playing') renderer.drawPaused();
    if (this.flashText && now < this.flashUntil) {
      renderer.drawFlash(this.flashText, (this.flashUntil - now) / 700);
    }
  }
}
