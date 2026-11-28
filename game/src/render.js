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
    // Birds crossing the sky, so the top half is never empty.
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const bx = ((distance * 0.25 + i * 380 + time * 0.02) % 1100) - 70;
      const by = 62 + i * 42;
      const flap = Math.sin(time * 0.006 + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by);
      ctx.quadraticCurveTo(bx - 4, by - 6 - flap, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 6 - flap, bx + 10, by);
      ctx.stroke();
    }
    // Falling autumn leaves.
    for (let i = 0; i < 8; i++) {
      const lx = (i * 137 + distance * 0.9) % 1000;
      const ly = ((i * 89 + time * 0.03 + distance * 0.25) % 360) + 30;
      const sway = Math.sin(time * 0.004 + i) * 8;
      ctx.fillStyle = ['#d2691e', '#e07b39', '#c96f3a', '#ffb703'][i % 4];
      ctx.beginPath();
      ctx.ellipse(lx + sway, ly, 6, 4, i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fence posts along the hill band.
    const postOffset = (distance * 0.6) % 130;
    ctx.fillStyle = '#5d3a1e';
    for (let x = -postOffset; x < TUNING.canvasWidth; x += 130) {
      ctx.fillRect(x, TUNING.groundY - 40, 6, 16);
    }
    // Pumpkins in the farmyard.
    if (stage.name === 'THE FARMYARD') {
      const pumpOffset = (distance * 0.6) % 420;
      for (const px of [300 - pumpOffset, 720 - pumpOffset]) {
        ctx.fillStyle = '#e07b39';
        ctx.beginPath();
        ctx.ellipse(px, TUNING.groundY - 34, 18, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a8542f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 8, TUNING.groundY - 45);
        ctx.quadraticCurveTo(px - 8, TUNING.groundY - 26, px - 8, TUNING.groundY - 24);
        ctx.moveTo(px + 8, TUNING.groundY - 45);
        ctx.quadraticCurveTo(px + 8, TUNING.groundY - 26, px + 8, TUNING.groundY - 24);
        ctx.stroke();
        ctx.fillStyle = '#4e7a3a';
        ctx.fillRect(px - 2, TUNING.groundY - 50, 4, 7);
      }
    }
    // The kitchen stage reads as a kitchen: a copper pot hangs in the
    // background. (A big window was tried here and cut: it read as a yellow
    // barn door and swallowed the sun.)
    if (stage.name === 'THE FARMHOUSE KITCHEN') {
      ctx.strokeStyle = '#5d3a1e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(600, 70);
      ctx.lineTo(600, 96);
      ctx.stroke();
      ctx.fillStyle = '#b5651d';
      ctx.beginPath();
      ctx.arc(600, 122, 22, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(578, 120, 44, 6);
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
    // Grass tufts along the ground's top edge.
    ctx.strokeStyle = '#5d8a3c';
    ctx.lineWidth = 2;
    const tuftOffset = (distance * 2.4) % 70;
    for (let x = -tuftOffset; x < TUNING.canvasWidth; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, TUNING.groundY + 2);
      ctx.lineTo(x - 4, TUNING.groundY - 8);
      ctx.moveTo(x + 4, TUNING.groundY + 2);
      ctx.lineTo(x + 8, TUNING.groundY - 7);
      ctx.stroke();
    }
  }

  drawTurkey(turkey, now) {
    const ctx = this.ctx;
    const squash = turkey.squash;
    const blink = turkey.isInvulnerable(now) && Math.floor(now / 90) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.35;
    ctx.save();
    ctx.translate(turkey.x, turkey.y);
    const actorScale = TUNING.actorScale;
    ctx.scale((1 + squash * 0.12) * actorScale, (1 - squash * 0.12) * actorScale);
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
    // Drawn bigger than the hitbox on purpose (TUNING.actorScale): Tom must
    // be the biggest thing in the frame, not a speck behind a tree.
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
    // Same actor scale as the turkey: Bram must loom, not hide at the edge.
    ctx.scale(TUNING.actorScale, TUNING.actorScale);
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
      // The dreaded Thanksgiving oven, drawn as an oven: glowing arched
      // door with live flames, chimney with smoke, knobs on top. No text
      // label — the shape must say "oven" on its own.
      const glow = 0.6 + Math.sin(now * 0.008) * 0.25;
      ctx.fillStyle = `rgba(255, 120, 20, ${glow * 0.4})`;
      ctx.beginPath();
      ctx.arc(cx, ground - 50, 72, 0, Math.PI * 2);
      ctx.fill();
      // Chimney with drifting smoke.
      ctx.fillStyle = '#2e2e2e';
      ctx.fillRect(cx - 38, ground - 118, 20, 24);
      for (let i = 0; i < 3; i++) {
        const puff = (now * 0.0004 + i * 0.33) % 1;
        ctx.fillStyle = `rgba(220, 220, 220, ${0.5 * (1 - puff)})`;
        ctx.beginPath();
        ctx.arc(cx - 28 + puff * 16, ground - 126 - puff * 34, 5 + puff * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      // Body: dark steel, top strip with knobs.
      ctx.fillStyle = '#333336';
      roundRect(ctx, cx - 52, ground - 96, 104, 96, 10);
      ctx.fill();
      ctx.fillStyle = '#4a4a4e';
      ctx.fillRect(cx - 52, ground - 96, 104, 16);
      ctx.fillStyle = '#ff5d3a';
      for (const kx of [-30, 0, 30]) {
        ctx.beginPath();
        ctx.arc(cx + kx, ground - 88, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#1d1d1f';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 52, ground - 96, 104, 96);
      // Arched door: hot orange window with two flickering flames.
      ctx.fillStyle = '#ff7b24';
      ctx.beginPath();
      ctx.moveTo(cx - 34, ground - 28);
      ctx.lineTo(cx - 34, ground - 56);
      ctx.arc(cx, ground - 56, 34, Math.PI, 0);
      ctx.lineTo(cx + 34, ground - 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      for (const fx of [-14, 12]) {
        const flick = 1 + Math.sin(now * 0.012 + fx) * 0.18;
        ctx.beginPath();
        ctx.moveTo(cx + fx, ground - 30);
        ctx.quadraticCurveTo(cx + fx - 9, ground - 46, cx + fx, ground - 62 * flick);
        ctx.quadraticCurveTo(cx + fx + 9, ground - 46, cx + fx, ground - 30);
        ctx.fill();
      }
      // Heat shimmer rising off the door.
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.8)';
      ctx.lineWidth = 2;
      for (const sx of [-20, 0, 20]) {
        ctx.beginPath();
        ctx.moveTo(cx + sx, ground - 100);
        ctx.quadraticCurveTo(cx + sx + 5, ground - 108, cx + sx, ground - 116);
        ctx.stroke();
      }
    } else if (obstacle.kind === 'knifeSwing') {
      // The carving knife, big and gleaming: a wooden beam above, the blade
      // hanging from it on a rope, sweeping a wide arc. Slide under it.
      const angle = Math.sin(obstacle.swingPhase) * 0.45;
      // Beam and hook the knife hangs from.
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(cx - 34, ground - 122, 68, 10);
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(cx, ground - 110, 5, 0, Math.PI * 2);
      ctx.fill();
      // Faint arc showing the sweep path, so the danger reads before it hits.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, ground - 110, 96, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(cx, ground - 110);
      ctx.rotate(angle);
      ctx.strokeStyle = '#8a6d3b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 24);
      ctx.stroke();
      // Wooden handle.
      ctx.fillStyle = '#4a2c14';
      roundRect(ctx, -7, 22, 14, 18, 4);
      ctx.fill();
      // Long carving blade, gleaming edge.
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(-11, 40);
      ctx.lineTo(11, 40);
      ctx.lineTo(6, 88);
      ctx.lineTo(0, 100);
      ctx.lineTo(-6, 88);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, 44);
      ctx.lineTo(3, 84);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(90, 100, 110, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, 44);
      ctx.lineTo(-4, 84);
      ctx.stroke();
      ctx.restore();
    } else if (obstacle.kind === 'knifeFall') {
      const fy = obstacle.fallY === null ? -80 : obstacle.fallY;
      const falling = obstacle.armed && fy < TUNING.groundY - obstacle.h;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 2, 20, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Speed lines while it drops, so the player sees it coming.
      if (falling) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        for (const lx of [-16, 0, 16]) {
          ctx.beginPath();
          ctx.moveTo(cx + lx, fy - 14);
          ctx.lineTo(cx + lx, fy - 34);
          ctx.stroke();
        }
      }
      // A bigger blade: long, gleaming, wooden handle.
      ctx.fillStyle = '#dfe6ea';
      ctx.beginPath();
      ctx.moveTo(cx, fy);
      ctx.lineTo(cx + 15, fy + 48);
      ctx.lineTo(cx, fy + 64);
      ctx.lineTo(cx - 15, fy + 48);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 9, fy + 8);
      ctx.lineTo(cx + 3, fy + 50);
      ctx.stroke();
      ctx.fillStyle = '#4a2c14';
      roundRect(ctx, cx - 9, fy + 62, 18, 16, 4);
      ctx.fill();
    } else if (obstacle.kind === 'pot') {
      ctx.fillStyle = '#2f2f2f';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 48, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9e57';
      ctx.beginPath();
      ctx.ellipse(cx, ground - 52, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(cx - 38, ground - 56, 8, 6);
      ctx.fillRect(cx + 30, ground - 56, 8, 6);
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
    // The control hints sit on their own dark pill: white text on a pale
    // sky was unreadable in the v2 screenshots.
    ctx.fillStyle = 'rgba(30, 16, 8, 0.55)';
    roundRect(ctx, 12, 70, 460, 22, 11);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('SPACE jump ×2   ↓ slide   ↓ near hay = hide   P pause   M mute', 26, 85);
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
