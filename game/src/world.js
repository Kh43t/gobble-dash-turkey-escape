// The world ahead of Tom: fences, hay bales, mud, ovens, carving knives,
// corn and golden feathers. Spawning, movement and collisions live here;
// drawing lives in render.js.
import { TUNING } from './config.js';

const KINDS = {
  fence: { w: 46, h: 52, jump: true, slide: false },
  haybale: { w: 62, h: 58, jump: true, slide: false },
  mud: { w: 92, h: 14, jump: true, slide: false },
  crate: { w: 58, h: 60, jump: true, slide: false },
  pitchfork: { w: 30, h: 74, jump: false, slide: true },
  oven: { w: 96, h: 96, jump: true, slide: false },
  knifeSwing: { w: 26, h: 92, jump: false, slide: true },
  knifeFall: { w: 30, h: 64, jump: false, slide: false },
  pot: { w: 66, h: 48, jump: true, slide: false },
};

function pickKind(distance, rand) {
  const roll = rand();
  if (distance < 320) {
    if (roll < 0.34) return 'fence';
    if (roll < 0.62) return 'haybale';
    if (roll < 0.82) return 'mud';
    return 'crate';
  }
  if (distance < 640) {
    if (roll < 0.26) return 'crate';
    if (roll < 0.5) return 'pitchfork';
    if (roll < 0.72) return 'haybale';
    if (roll < 0.88) return 'fence';
    return 'mud';
  }
  if (roll < 0.3) return 'oven';
  if (roll < 0.52) return 'knifeSwing';
  if (roll < 0.7) return 'knifeFall';
  if (roll < 0.86) return 'pot';
  return 'pitchfork';
}

export class World {
  constructor(random) {
    this.random = random || Math.random;
    this.reset();
  }

  reset() {
    this.obstacles = [];
    this.pickups = [];
    this.haystacks = [];
    this.nextSpawnX = 1050;
    this.knifeDropTimers = new Map();
    this.distance = 0;
    this.spawnedCount = 0;
  }

  spawnAhead(distance) {
    const kind = pickKind(distance, this.random);
    const spec = KINDS[kind];
    const obstacle = {
      id: this.spawnedCount++,
      kind,
      x: this.nextSpawnX,
      y: TUNING.groundY,
      w: spec.w,
      h: spec.h,
      passed: false,
      swingPhase: this.random() * Math.PI * 2,
      fallY: null,
      fallVy: 0,
      wobble: this.random() * 6,
    };
    if (kind === 'knifeFall') {
      obstacle.fallY = -80;
      obstacle.armed = false;
    }
    this.obstacles.push(obstacle);

    // Corn trails reward a clean jump; a feather rides high now and then.
    if (this.random() < 0.62) {
      const count = 3 + Math.floor(this.random() * 3);
      for (let i = 0; i < count; i++) {
        this.pickups.push({
          kind: 'corn',
          x: this.nextSpawnX + 70 + i * 34,
          y: TUNING.groundY - (kind === 'fence' || kind === 'oven' ? 150 : 64),
          taken: false,
          bob: this.random() * Math.PI * 2,
        });
      }
    }
    if (this.random() < 0.1) {
      this.pickups.push({
        kind: 'feather',
        x: this.nextSpawnX + 40,
        y: TUNING.groundY - 190,
        taken: false,
        bob: 0,
      });
    }
    // A haystack to hide in appears regularly from the farmyard on.
    if (distance > 120 && this.random() < 0.42) {
      this.haystacks.push({
        x: this.nextSpawnX + 260 + this.random() * 120,
        y: TUNING.groundY,
        w: 84,
        h: 92,
        used: false,
      });
    }
    this.nextSpawnX += TUNING.spawnGapMin + this.random() * (TUNING.spawnGapMax - TUNING.spawnGapMin);
  }

  update(now, deltaMs, speed, distance, sounds) {
    const dt = deltaMs / 16.667;
    this.distance = distance;
    const move = speed * dt;
    for (const obstacle of this.obstacles) obstacle.x -= move;
    for (const pickup of this.pickups) pickup.x -= move;
    for (const stack of this.haystacks) stack.x -= move;

    while (this.nextSpawnX < 1300) this.spawnAhead(distance);

    this.obstacles = this.obstacles.filter((o) => o.x > -220);
    this.pickups = this.pickups.filter((p) => p.x > -60);
    this.haystacks = this.haystacks.filter((h) => h.x > -160);

    // Swinging knives sweep; falling knives drop when Tom runs under them.
    for (const obstacle of this.obstacles) {
      if (obstacle.kind === 'knifeSwing') obstacle.swingPhase += dt * 0.06;
      if (obstacle.kind === 'knifeFall') {
        if (!obstacle.armed && obstacle.x < 340 && obstacle.x > 120) {
          obstacle.armed = true;
          sounds.knifeWhizz();
        }
        if (obstacle.armed && obstacle.fallY !== null) {
          obstacle.fallVy += 0.9 * dt;
          obstacle.fallY += obstacle.fallVy * dt;
          if (obstacle.fallY > TUNING.groundY - obstacle.h) {
            obstacle.fallY = TUNING.groundY - obstacle.h;
            obstacle.fallVy = 0;
          }
        }
      }
    }
  }

  obstacleBox(obstacle) {
    if (obstacle.kind === 'knifeFall' && obstacle.fallY !== null) {
      return { x: obstacle.x - obstacle.w / 2, y: obstacle.fallY, w: obstacle.w, h: obstacle.h };
    }
    if (obstacle.kind === 'knifeSwing') {
      const swing = Math.sin(obstacle.swingPhase) * 26;
      return { x: obstacle.x - 13 + swing, y: TUNING.groundY - obstacle.h, w: 26, h: obstacle.h };
    }
    if (obstacle.kind === 'mud') {
      return { x: obstacle.x - obstacle.w / 2, y: TUNING.groundY - 10, w: obstacle.w, h: 10 };
    }
    return {
      x: obstacle.x - obstacle.w / 2,
      y: TUNING.groundY - obstacle.h,
      w: obstacle.w,
      h: obstacle.h,
    };
  }

  pickupBox(pickup) {
    const bob = Math.sin(pickup.bob) * 4;
    return { x: pickup.x - 16, y: pickup.y + bob - 16, w: 32, h: 32 };
  }

  haystackNear(turkeyX) {
    for (const stack of this.haystacks) {
      if (!stack.used && Math.abs(stack.x - turkeyX) < 70) return stack;
    }
    return null;
  }
}

export { KINDS };
