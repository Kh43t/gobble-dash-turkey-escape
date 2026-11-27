// Gobble Dash bootstrap: starts the engine and stages the game for
// screenshots. `?shot=start` shows the title, `?shot=play` a run in full
// flight, `?shot=caught` and `?shot=escaped` the two end screens — each a
// real state of the same game, so the screenshots are honest renders.
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
    // A busy mid-run moment in the kitchen: oven and carving knife on screen.
    engine.distance = 700;
    engine.score = 3240;
    engine.corn = 24;
    engine.world.nextSpawnX = 560;
    engine.world.spawnAhead(700);
    engine.world.spawnAhead(700);
    engine.world.spawnAhead(700);
    engine.world.obstacles.push({
      id: 9001, kind: 'oven', x: 640, y: 452, w: 96, h: 96,
      passed: false, swingPhase: 0, fallY: null, fallVy: 0, wobble: 0,
    });
    engine.world.obstacles.push({
      id: 9002, kind: 'knifeSwing', x: 830, y: 452, w: 26, h: 92,
      passed: false, swingPhase: 1.2, fallY: null, fallVy: 0, wobble: 0,
    });
    engine.world.pickups.push(
      { kind: 'corn', x: 400, y: 452 - 150, taken: false, bob: 0.5 },
      { kind: 'corn', x: 434, y: 452 - 150, taken: false, bob: 1.1 },
      { kind: 'corn', x: 468, y: 452 - 150, taken: false, bob: 1.7 },
    );
    engine.turkey.y = 452 - 90;
    engine.turkey.vy = -4;
    engine.turkey.onGround = false;
    engine.turkey.jumpsUsed = 1;
    engine.farmer.x = 210 - 150;
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
