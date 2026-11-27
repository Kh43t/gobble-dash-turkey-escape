// Gobble Dash rendering: every pixel of Tom, Farmer Bram, the farm, the
// kitchen and the HUD is drawn here on canvas. No images, no fonts to load.
import { TUNING } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scroll = 0;
  }

  clear(stage) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, TUNING.canvasHeight);
    gradient.addColorStop(0, stage.sky[0]);
    gradient.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TUNING.canvasWidth, TUNING.canvasHeight);
  }

  drawSun(time) {
    const ctx = this.ctx;
    const x = 800 + Math.sin(time * 0.0001) * 8;
    const y = 84;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCloud(x, y, scale) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 24 * scale, y - 8 * scale, 26 * scale, 0, Math.PI * 2);
    ctx.arc(x + 52 * scale, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBackground(stage, distance, time) {
    const ctx = this.ctx;
    this.clear(stage);
    this.drawSun(time);
    const cloudOffset = (distance * 0.12) % 1100;
    this.drawCloud(180 - cloudOffset, 70, 1);
    this.drawCloud(560 - cloudOffset, 120, 0.8);
    this.drawCloud(900 - cloudOffset + 1100, 60, 1.1);
    // Far hills.
    ctx.fillStyle = stage.far;
    ctx.beginPath();
    ctx.moveTo(0, TUNING.groundY - 60);
    for (let x = 0; x <= TUNING.canvasWidth; x += 60) {
      const hillX = x + ((distance * 0.3) % 120);
      ctx.lineTo(x, TUNING.groundY - 60 - Math.abs(Math.sin(hillX * 0.01)) * 46);
    }
    ctx.lineTo(TUNING.canvasWidth, TUNING.groundY);
    ctx.lineTo(0, TUNING.groundY);
    ctx.closePath();
    ctx.fill();
    // Near hill band with trees.
    ctx.fillStyle = stage.hill;
    ctx.fillRect(0, TUNING.groundY - 26, TUNING.canvasWidth, 26);
    const treeOffset = (distance * 0.6) % 260;
    for (let i = -1; i < 5; i++) {
      const tx = i * 260 + 120 - treeOffset;
      ctx.fillStyle = '#3d5a26';
      ctx.beginPath();
      ctx.arc(tx, TUNING.groundY - 44, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d3a1e';
      ctx.fillRect(tx - 4, TUNING.groundY - 34, 8, 34);
    }
  }

  drawGround(distance) {
    const ctx = this.ctx;
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(0, TUNING.groundY, TUNING.canvasWidth, TUNING.canvasHeight - TUNING.groundY);
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(0, TUNING.groundY, TUNING.canvasWidth, 8);
    // Scrolling dirt dashes.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    const dashOffset = (distance * 2.4) % 90;
    for (let x = -dashOffset; x < TUNING.canvasWidth; x += 90) {
      ctx.fillRect(x, TUNING.groundY + 34, 44, 6);
      ctx.fillRect(x + 30, TUNING.groundY + 62, 30, 5);
    }
  }

  drawTurkey(turkey, now) {
    const ctx = this.ctx;
    const squash = turkey.squash;
    const blink = turkey.isInvulnerable(now) && Math.floor(now / 90) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;
    ctx.save();
    ctx.translate(turkey.x, turkey.y);
    ctx.scale(1 + squash * 0.12, 1 - squash * 0.12);
    if (turkey.hiding) {
      // Only the tail fan and a nervous eye poke out of the hay.
      ctx.fillStyle = '#8a5a2e';
      ctx.beginPath();
      ctx.ellipse(0, -18, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }
    const legSwing = turkey.onGround && !turkey.sliding
      ? Math.sin(turkey.runCycle) * 12
      : 0;
    // Tail fan.
    ctx.fillStyle = '#a0522d';
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.32);
      ctx.beginPath();
      ctx.ellipse(-26, -46, 9, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#d2691e';
    ctx.beginPath();
    ctx.ellipse(-22, -40, 7, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Body.
    const bodyH = turkey.sliding ? 30 : 44;
    ctx.fillStyle = '#7a4a21';
    ctx.beginPath();
    ctx.ellipse(0, -22, 30, bodyH / 2 + 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93582a';
    ctx.beginPath();
    ctx.ellipse(4, -20, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping on jumps.
    const flapAngle = turkey.flap > 0 ? -0.9 + turkey.flap * 0.4 : 0.25;
    ctx.save();
    ctx.translate(-4, -26);
    ctx.rotate(flapAngle);
    ctx.fillStyle = '#5d3a17';
    ctx.beginPath();
    ctx.ellipse(-6, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Head, beak, wattle, eye.
    ctx.fillStyle = '#7a4a21';
    ctx.beginPath();
    ctx.arc(24, -52, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4a259';
    ctx.beginPath();
    ctx.moveTo(34, -54);
    ctx.lineTo(48, -49);
    ctx.lineTo(34, -45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.ellipse(30, -42, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(27, -56, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(28, -56, 2, 0, Math.PI * 2);
    ctx.fill();
    // Red head crest.
    ctx.fillStyle = '#d62828';
    ctx.beginPath();
    ctx.arc(22, -64, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawFarmer(farmer, now, showShout) {
    const ctx = this.ctx;
    const x = farmer.screenX();
    const y = TUNING.groundY;
    const tripped = farmer.mood === 'tripped';
    ctx.save();
    ctx.translate(x, y);
    if (tripped) ctx.rotate(-0.5);
    const swing = Math.sin(farmer.runCycle) * 10;
    // Legs: blue overalls.
    ctx.strokeStyle = '#2b4c7e';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, -34);
    ctx.lineTo(-8 + swing, 0);
    ctx.moveTo(8, -34);
    ctx.lineTo(8 - swing, 0);
    ctx.stroke();
    // Body: red plaid shirt.
    ctx.fillStyle = '#b3392e';
    roundRect(ctx, -18, -72, 36, 42, 8);
    ctx.fill();
    ctx.strokeStyle = '#7e241d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -58);
    ctx.lineTo(18, -58);
    ctx.moveTo(-18, -46);
    ctx.lineTo(18, -46);
    ctx.stroke();
    // Arms reaching forward, grabbing for the turkey.
    ctx.strokeStyle = '#e8b88a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, -64);
    ctx.lineTo(30 + Math.sin(now * 0.01) * 4, -52);
    ctx.moveTo(10, -56);
    ctx.lineTo(28, -44);
    ctx.stroke();
    // Head with straw hat and angry beard.
    ctx.fillStyle = '#e8b88a';
    ctx.beginPath();
    ctx.arc(4, -84, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2d06b';
    ctx.beginPath();
    ctx.ellipse(4, -94, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c15a';
    ctx.fillRect(-8, -108, 24, 12);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(4, -72, 11, 7, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(0, -87, 2, 0, Math.PI * 2);
    ctx.arc(9, -87, 2, 0, Math.PI * 2);
    ctx.fill();
    // Angry brows.
    ctx.strokeStyle = '#1d1d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -91);
    ctx.lineTo(3, -89);
    ctx.moveTo(7, -89);
    ctx.lineTo(13, -91);
    ctx.stroke();
    ctx.restore();
    // Shout bubble when he is close — only while the chase is on.
    if (showShout && farmer.gapToTurkey < 120 && farmer.mood === 'chasing') {
      ctx.fillStyle = '#fff';
      roundRect(ctx, x - 10, y - 168, 92, 30, 10);
      ctx.fill();
      ctx.fillStyle = '#1d1d1d';
      ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('COME BACK!', x + 2, y - 148);
    }
  }

  drawObstacle(obstacle, now) {
    const ctx = this.ctx;
    const ground = TUNING.groundY;
    const cx = obstacle.x;
    if (obstacle.kind === 'fence') {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(cx - 23, ground - 52, 6, 52);
      ctx.fillRect(cx + 17, ground - 52, 6, 52);
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(cx - 28, ground - 48, 56, 7);
      ctx.fillRect(cx - 28, ground - 28, 56, 7);
    } else if (obstacle.kind === 'haybale') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(cx, ground - 26, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a67c2e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, ground - 26, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 26, ground - 26);
      ctx.lineTo(cx + 26, ground - 26);
      ctx.stroke();
    } else if (obstacle.kind === 'mud') {
      ctx.fillStyle = '#5d3a1e';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 4, 48, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a4a21';
      ctx.beginPath();
      ctx.ellipse(cx - 14, ground - 5, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('MUD!', cx - 18, ground - 16);
    } else if (obstacle.kind === 'crate') {
      ctx.fillStyle = '#9c6b30';
      ctx.fillRect(cx - 29, ground - 60, 58, 60);
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 29, ground - 60, 58, 60);
      ctx.beginPath();
      ctx.moveTo(cx - 29, ground - 60);
      ctx.lineTo(cx + 29, ground);
      ctx.moveTo(cx + 29, ground - 60);
      ctx.lineTo(cx - 29, ground);
      ctx.stroke();
    } else if (obstacle.kind === 'pitchfork') {
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, ground);
      ctx.lineTo(cx, ground - 66);
      ctx.stroke();
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 3;
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, ground - 66);
        ctx.lineTo(cx + dx, ground - 78);
        ctx.stroke();
      }
    } else if (obstacle.kind === 'oven') {
      // The dreaded Thanksgiving oven, door glowing, heat shimmering.
      const glow = 0.6 + Math.sin(now * 0.008) * 0.25;
      ctx.fillStyle = `rgba(255, 120, 20, ${glow * 0.35})`;
      ctx.beginPath();
      ctx.arc(cx, ground - 50, 66, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      roundRect(ctx, cx - 48, ground - 96, 96, 96, 8);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.fillRect(cx - 48, ground - 96, 96, 14);
      ctx.fillStyle = '#ff7b24';
      roundRect(ctx, cx - 32, ground - 66, 64, 44, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(cx - 18, ground - 30);
      ctx.lineTo(cx, ground - 58);
      ctx.lineTo(cx + 18, ground - 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('OVEN', cx - 18, ground - 102);
    } else if (obstacle.kind === 'knifeSwing') {
      const swing = Math.sin(obstacle.swingPhase) * 26;
      const kx = cx + swing;
      ctx.strokeStyle = '#5d3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, ground - 96);
      ctx.lineTo(kx, ground - 60);
      ctx.stroke();
      ctx.save();
      ctx.translate(kx, ground - 44);
      ctx.rotate(Math.sin(obstacle.swingPhase) * 0.5);
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(10, 6);
      ctx.lineTo(0, 16);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(-6, 14, 12, 14);
      ctx.restore();
    } else if (obstacle.kind === 'knifeFall') {
      const fy = obstacle.fallY === null ? -80 : obstacle.fallY;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 2, 18, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(cx, fy);
      ctx.lineTo(cx + 12, fy + 40);
      ctx.lineTo(cx, fy + 52);
      ctx.lineTo(cx - 12, fy + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a2c14';
      ctx.fillRect(cx - 7, fy + 50, 14, 14);
    } else if (obstacle.kind === 'pot') {
      ctx.fillStyle = '#2f2f2f';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 48, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9e57';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 52, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('STEW', cx - 16, ground - 66);
    }
  }

  drawPickup(pickup, now) {
    const ctx = this.ctx;
    const bob = Math.sin(pickup.bob + now * 0.005) * 4;
    const y = pickup.y + bob;
    if (pickup.kind === 'corn') {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.ellipse(pickup.x, y, 10, 16, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4a259';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(pickup.x + i * 5, y - 4, 2.4, 0, Math.PI * 2);
        ctx.arc(pickup.x + i * 5, y + 5, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7fae4c';
      ctx.beginPath();
      ctx.ellipse(pickup.x, y + 16, 8, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(pickup.x, y, 8, 18, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.ellipse(pickup.x, y, 4, 12, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHaystack(stack, turkeyHiding) {
    const ctx = this.ctx;
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.moveTo(stack.x - 42, TUNING.groundY);
    ctx.quadraticCurveTo(stack.x, TUNING.groundY - 104, stack.x + 42, TUNING.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a67c2e';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(stack.x + i * 14, TUNING.groundY - 88 + Math.abs(i) * 10);
      ctx.lineTo(stack.x + i * 16, TUNING.groundY - 8);
      ctx.stroke();
    }
    if (!turkeyHiding && !stack.used) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('HIDE! ↓', stack.x - 26, TUNING.groundY - 108);
    }
  }

  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(30, 16, 8, 0.55)';
    roundRect(ctx, 12, 10, 936, 54, 12);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`SCORE ${state.score}`, 26, 44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`${Math.floor(state.distance)} m`, 260, 43);
    ctx.fillStyle = '#ffb703';
    ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(state.stageName, 400, 42);
    // Lives as hearts.
    for (let i = 0; i < 3; i++) {
      const hx = 640 + i * 30;
      const hy = 34;
      ctx.fillStyle = i < state.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(hx - 5, hy - 3, 7, 0, Math.PI * 2);
      ctx.arc(hx + 5, hy - 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 11, hy - 1);
      ctx.lineTo(hx, hy + 11);
      ctx.lineTo(hx + 11, hy - 1);
      ctx.closePath();
      ctx.fill();
    }
    // Farmer gap bar: the closer he gets, the redder it burns.
    const gapRatio = Math.max(0, Math.min(1, state.gap / 320));
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 740, 24, 190, 14, 7);
    ctx.fill();
    ctx.fillStyle = gapRatio > 0.5 ? '#7fae4c' : gapRatio > 0.25 ? '#ffb703' : '#e63946';
    roundRect(ctx, 740, 24, 190 * gapRatio, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('FARMER', 740, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('SPACE jump ×2   ↓ slide   ↓ near hay = hide   P pause   M mute', 26, 84);
  }

  drawTitle(now) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(30, 16, 8, 0.45)';
    ctx.fillRect(0, 0, TUNING.canvasWidth, TUNING.canvasHeight);
    const bob = Math.sin(now * 0.002) * 6;
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 64px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOBBLE DASH', 480, 150 + bob);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('The Great Turkey Escape', 480, 192 + bob);
    ctx.fillStyle = '#ffe8b3';
    ctx.font = '19px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Thanksgiving is coming. Farmer Bram wants you for dinner.', 480, 240);
    ctx.fillText('Run 1000 m through the farmyard, the barn and the kitchen —', 480, 268);
    ctx.fillText('jump the fences, slide under the knives, dodge the oven,', 480, 296);
    ctx.fillText('grab the corn, and hide in the hay when he gets too close.', 480, 324);
    const pulse = 0.6 + Math.sin(now * 0.006) * 0.4;
    ctx.fillStyle = `rgba(255, 210, 63, ${pulse})`;
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO RUN', 480, 396);
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('SPACE / ↑ jump (twice = double jump)    ↓ slide    P pause    M mute', 480, 436);
    ctx.fillText('3 lives — lose one when you crash, get caught when Bram reaches you.', 480, 464);
    ctx.textAlign = 'left';
  }

  drawEnd(outcome, state) {
    const ctx = this.ctx;
    ctx.fillStyle = outcome === 'escaped' ? 'rgba(20, 60, 20, 0.6)' : 'rgba(60, 10, 10, 0.6)';
    ctx.fillRect(0, 0, TUNING.canvasWidth, TUNING.canvasHeight);
    ctx.textAlign = 'center';
    if (outcome === 'escaped') {
      ctx.fillStyle = '#a7f3a7';
      ctx.font = 'bold 58px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('ESCAPED!', 480, 170);
      ctx.fillStyle = '#fff';
      ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('Tom made it to the forest — no Thanksgiving dinner this year!', 480, 220);
      ctx.fillText('The turkey is free, and Farmer Bram is still running.', 480, 250);
    } else {
      ctx.fillStyle = '#ff8a7a';
      ctx.font = 'bold 58px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('CAUGHT!', 480, 170);
      ctx.fillStyle = '#fff';
      ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillText('Farmer Bram got you... the oven was already warm.', 480, 220);
      ctx.fillText('But turkeys are stubborn. Run again!', 480, 250);
    }
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`SCORE ${state.score}    •    ${Math.floor(state.distance)} m    •    ${state.corn} corn`, 480, 310);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`Best score: ${state.best}`, 480, 346);
    const pulse = 0.6 + Math.sin(Date.now() * 0.006) * 0.4;
    ctx.fillStyle = `rgba(255, 210, 63, ${pulse})`;
    ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', 480, 410);
    ctx.textAlign = 'left';
  }

  drawPaused() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    ctx.fillRect(0, 0, TUNING.canvasWidth, TUNING.canvasHeight);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 44px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('PAUSED', 480, 260);
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Press P to keep running', 480, 300);
    ctx.textAlign = 'left';
  }

  drawFlash(text, alpha) {
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 60, 40, ${alpha})`;
    ctx.font = 'bold 40px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(text, 480, 200);
    ctx.textAlign = 'left';
  }
}
