// Gobble Dash bootstrap: starts the engine and stages the game for
// screenshots. `?shot=start` shows the title, `?shot=play` a run in full
// flight (frozen mid-jump, so the shot catches the staged moment, not a
// collision half a second later), `?shot=caught` and `?shot=escaped` the
// two end screens — each a real state of the same game, so the screenshots
// are honest renders.
import { Engine } from './engine.js';

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stageShot(engine, shot) {
  if (shot === 'start') {
    // Title vignette: Bram on the left, Tom fleeing on the right — both
    // clear of the centred prompt text.
    engine.turkey.x = 840;
    engine.farmer.x = 120;
  } else if (shot === 'play') {
    engine.resetRun();
    // A busy mid-run moment in the kitchen, frozen mid-jump: Tom sails
    // over the glowing oven, the carving knife swings behind him, corn
    // arcs over the oven, Bram closes in shouting, a haystack waits.
    engine.distance = 700;
    engine.score = 3240;
    engine.corn = 24;
    engine.world.nextSpawnX = 1050;
    engine.world.obstacles.push({
      id: 9001, kind: 'oven', x: 560, y: 452, w: 96, h: 96,
      passed: false, swingPhase: 0, fallY: null, fallVy: 0, wobble: 0,
    });
    engine.world.obstacles.push({
      id: 9002, kind: 'knifeSwing', x: 720, y: 452, w: 26, h: 92,
      passed: false, swingPhase: 1.2, fallY: null, fallVy: 0, wobble: 0,
    });
    engine.world.haystacks.push({
      x: 860, y: 452, w: 84, h: 92, used: false,
    });
    engine.world.pickups.push(
      { kind: 'corn', x: 540, y: 452 - 170, taken: false, bob: 0.5 },
      { kind: 'corn', x: 574, y: 452 - 170, taken: false, bob: 1.1 },
      { kind: 'corn', x: 608, y: 452 - 170, taken: false, bob: 1.7 },
    );
    engine.turkey.x = 300;
    engine.turkey.y = 452 - 110;
    engine.turkey.vy = -4;
    engine.turkey.onGround = false;
    engine.turkey.jumpsUsed = 1;
    // Gap 110: close enough for the "COME BACK!" bubble, far from a catch.
    engine.farmer.x = 100;
    // Hold the pose: without this the oven reaches Tom half a second
    // later and the shot catches a collision instead of a jump.
    engine.frozen = true;
  } else if (shot === 'caught') {
    engine.resetRun();
    engine.distance = 612;
    engine.score = 2430;
    engine.corn = 21;
    engine.lives = 0;
    engine.farmer.x = 210 - 12;
    engine.endRun('caught');
  } else if (shot === 'escaped') {
    engine.resetRun();
    engine.distance = 1000;
    engine.score = 5120;
    engine.corn = 38;
    engine.lives = 2;
    engine.endRun('escaped');
  }
  // 'start' needs nothing: the title screen is the engine's first state.
}

const canvas = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7);
const random = mulberry32(Number.isFinite(seed) ? seed : 7);
const engine = new Engine(canvas, random);
engine.start();
stageShot(engine, params.get('shot'));
