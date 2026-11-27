// Gobble Dash tuning: every number that shapes how the escape feels.
// One file, one job: change the feel here, never by hunting through the engine.
export const TUNING = {
  canvasWidth: 960,
  canvasHeight: 540,
  groundY: 452,
  gravity: 0.62,
  jumpVelocity: -14.2,
  doubleJumpVelocity: -12.0,
  slideTimeMs: 520,
  baseSpeed: 5.4,
  maxSpeed: 9.6,
  speedRampPerMetre: 0.0032,
  escapeDistance: 1000,
  startGap: 210,
  gapCatchAt: 0,
  gapMax: 320,
  farmerCloseRate: 0.55,
  farmerFallBackRate: 1.15,
  hideBonusGap: 55,
  cornScore: 25,
  featherScore: 150,
  metreScore: 1,
  startLives: 3,
  spawnGapMin: 300,
  spawnGapMax: 560,
  obstacleHitGapLoss: 46,
  obstacleHitStunMs: 650,
  invulnerableMs: 1400,
};

export const STAGES = [
  { name: 'THE FARMYARD', from: 0, sky: ['#ffd9a0', '#ff9e57'], hill: '#7fae4c', far: '#5d8a3c' },
  { name: 'THE OLD BARN', from: 320, sky: ['#e8b06a', '#c96f3a'], hill: '#8a6b3f', far: '#6b4e2e' },
  { name: 'THE FARMHOUSE KITCHEN', from: 640, sky: ['#f7c873', '#e07b39'], hill: '#a8542f', far: '#7c3a20' },
  { name: 'THE FOREST EDGE', from: 900, sky: ['#cfe8a8', '#7fb069'], hill: '#4e7a3a', far: '#33511f' },
];

export function stageFor(distance) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (distance >= stage.from) current = stage;
  }
  return current;
}
