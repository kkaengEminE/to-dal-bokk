import {
    PLAYER_RADIUS, DRAGON_RADIUS, EGG_RADIUS,
    COLOR_TOMATO, COLOR_TOMATO_DARK, COLOR_STEM,
    COLOR_DRAGON, COLOR_DRAGON_LIGHT, COLOR_DRAGON_EYE,
    COLOR_EGG, COLOR_EGG_OUTLINE,
    PS_MOVING, PS_ROLLING, PS_ATTACKING, PS_FLINCHING, PS_STAGGERING, PS_DEAD,
    DS_FIRE_BREATH, DS_TAIL_SWIPE, DS_WING_GUST,
    DS_SPECIAL_RISING, DS_SPECIAL_HOVERING, DS_SPECIAL_FIRE, DS_SPECIAL_CRASH,
    DS_STUNNED, DS_DEAD, AP_ACTIVE, AP_WINDUP,
    attackConfig, SPECIAL_CRASH_RADIUS, HEAVY_SLASH_ARC, HEAVY_SLASH_RANGE,
    THRUST_LENGTH, THRUST_WIDTH, MAP_WIDTH, MAP_HEIGHT
} from './constants.js';

// ========== TOMATO PLAYER ==========
export function drawTomato(ctx, player, time) {
    const { x, y, facing, state, attackType, attackPhase, stateTimer, hp, iframeTimer } = player;

    ctx.save();
    ctx.translate(x, y);

    // Iframe blink
    if (iframeTimer > 0 && Math.floor(iframeTimer * 10) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }

    // Hit flash
    if (state === PS_FLINCHING && stateTimer < 0.1) {
        ctx.globalAlpha = 0.6;
    }

    const roll = state === PS_ROLLING;
    const dead = state === PS_DEAD;

    if (roll) {
        ctx.rotate(time * 15);
    } else {
        ctx.rotate(0);
    }

    if (dead) {
        // Squished tomato
        ctx.scale(1.3, 0.5);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, PLAYER_RADIUS - 2, PLAYER_RADIUS * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLOR_TOMATO;
    ctx.strokeStyle = COLOR_TOMATO_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stem
    ctx.fillStyle = COLOR_STEM;
    ctx.beginPath();
    ctx.moveTo(-4, -PLAYER_RADIUS + 2);
    ctx.lineTo(0, -PLAYER_RADIUS - 6);
    ctx.lineTo(4, -PLAYER_RADIUS + 2);
    ctx.fill();
    // Leaf
    ctx.beginPath();
    ctx.ellipse(5, -PLAYER_RADIUS - 2, 5, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();

    if (!dead) {
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-5, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        if (state === PS_STAGGERING) {
            // Dizzy mouth
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 3, 4, 0, Math.PI);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 2, 3, 0.1, Math.PI - 0.1);
            ctx.stroke();
        }
    }

    ctx.restore();

    // Draw limbs and equipment (not rotated with body during roll)
    if (!roll && !dead) {
        drawLimbs(ctx, player, time);
        drawEquipment(ctx, player, time);
    }
}

function drawLimbs(ctx, player, time) {
    const { x, y, facing, state, stateTimer } = player;
    const walkCycle = Math.sin(time * 10) * 6;
    const isMoving = state === PS_MOVING;

    ctx.strokeStyle = COLOR_TOMATO_DARK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const cos = Math.cos(facing);
    const sin = Math.sin(facing);

    // Legs
    const legOffset = isMoving ? walkCycle : 0;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(x - cos * 4 + sin * 6, y - sin * 4 - cos * 6 + PLAYER_RADIUS - 4);
    ctx.lineTo(x - cos * 4 + sin * 6 + legOffset * 0.5, y - sin * 4 - cos * 6 + PLAYER_RADIUS + 8);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + cos * 4 + sin * 6, y + sin * 4 - cos * 6 + PLAYER_RADIUS - 4);
    ctx.lineTo(x + cos * 4 + sin * 6 - legOffset * 0.5, y + sin * 4 - cos * 6 + PLAYER_RADIUS + 8);
    ctx.stroke();

    // Arms (drawn with equipment)
}

function drawEquipment(ctx, player, time) {
    const { x, y, facing, state, attackType, attackPhase, attackTimer, attackDuration } = player;

    ctx.save();
    ctx.translate(x, y);

    // Shield (left side relative to facing)
    const shieldAngle = facing + Math.PI * 0.6;
    const shieldDist = PLAYER_RADIUS + 4;
    const sx = Math.cos(shieldAngle) * shieldDist;
    const sy = Math.sin(shieldAngle) * shieldDist;

    // Shield arm
    ctx.strokeStyle = COLOR_TOMATO_DARK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(Math.cos(shieldAngle) * (PLAYER_RADIUS - 4), Math.sin(shieldAngle) * (PLAYER_RADIUS - 4));
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Shield
    ctx.fillStyle = '#8B7355';
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shield cross
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy);
    ctx.lineTo(sx + 4, sy);
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(sx, sy + 4);
    ctx.stroke();

    // Sword (right side)
    let swordAngle = facing - Math.PI * 0.4;
    let swordExtend = PLAYER_RADIUS + 2;

    if (state === PS_ATTACKING && attackPhase === AP_ACTIVE) {
        const progress = attackTimer / attackDuration;
        if (attackType === 'HEAVY_LEFT') {
            swordAngle = facing - Math.PI * 0.8 + progress * Math.PI * 1.2;
            swordExtend = PLAYER_RADIUS + 8;
        } else if (attackType === 'HEAVY_RIGHT') {
            swordAngle = facing + Math.PI * 0.8 - progress * Math.PI * 1.2;
            swordExtend = PLAYER_RADIUS + 8;
        } else if (attackType === 'THRUST') {
            swordAngle = facing;
            swordExtend = PLAYER_RADIUS + 8 + progress * 20;
        }
    }

    const armX = Math.cos(swordAngle) * (PLAYER_RADIUS - 4);
    const armY = Math.sin(swordAngle) * (PLAYER_RADIUS - 4);
    const tipX = Math.cos(swordAngle) * (swordExtend + 16);
    const tipY = Math.sin(swordAngle) * (swordExtend + 16);
    const hiltX = Math.cos(swordAngle) * swordExtend;
    const hiltY = Math.sin(swordAngle) * swordExtend;

    // Sword arm
    ctx.strokeStyle = COLOR_TOMATO_DARK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(armX, armY);
    ctx.lineTo(hiltX, hiltY);
    ctx.stroke();

    // Sword blade
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hiltX, hiltY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Blade edge highlight
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hiltX, hiltY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Hilt
    const perpX = Math.cos(swordAngle + Math.PI / 2) * 5;
    const perpY = Math.sin(swordAngle + Math.PI / 2) * 5;
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hiltX - perpX, hiltY - perpY);
    ctx.lineTo(hiltX + perpX, hiltY + perpY);
    ctx.stroke();

    ctx.restore();
}

// ========== DRAGON ==========
export function drawDragon(ctx, dragon, time) {
    const { x, y, facing, state, stateTimer, hp, maxHp, scale } = dragon;

    ctx.save();
    ctx.translate(x, y);

    const s = scale || 1;
    ctx.scale(s, s);

    // Iframe blink for stunned
    if (state === DS_STUNNED && Math.floor(time * 5) % 2 === 0) {
        ctx.globalAlpha = 0.7;
    }

    if (state === DS_DEAD) {
        ctx.globalAlpha = Math.max(0, 1 - stateTimer);
        ctx.scale(1, 0.6);
    }

    const hpRatio = hp / maxHp;
    const bodyColor = hpRatio > 0.5 ? COLOR_DRAGON :
        hpRatio > 0.25 ? '#4a3a10' : '#6b2020';

    // Shadow
    if (state !== DS_SPECIAL_RISING && state !== DS_SPECIAL_HOVERING && state !== DS_SPECIAL_FIRE) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, DRAGON_RADIUS, DRAGON_RADIUS * 0.9, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Tail (behind body)
    drawDragonTail(ctx, dragon, time);

    // Wings
    drawDragonWings(ctx, dragon, time);

    // Body
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#1a3008';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, DRAGON_RADIUS, DRAGON_RADIUS * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly
    ctx.fillStyle = COLOR_DRAGON_LIGHT;
    ctx.beginPath();
    ctx.ellipse(0, 4, DRAGON_RADIUS * 0.5, DRAGON_RADIUS * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headDist = DRAGON_RADIUS + 12;
    const hx = Math.cos(facing) * headDist;
    const hy = Math.sin(facing) * headDist;
    drawDragonHead(ctx, hx, hy, facing, dragon, time);

    // Stun stars
    if (state === DS_STUNNED) {
        for (let i = 0; i < 3; i++) {
            const a = time * 3 + i * Math.PI * 2 / 3;
            const starX = Math.cos(a) * 25;
            const starY = -DRAGON_RADIUS - 10 + Math.sin(a * 2) * 5;
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px Arial';
            ctx.fillText('★', starX - 5, starY);
        }
    }

    ctx.restore();
}

function drawDragonHead(ctx, hx, hy, facing, dragon, time) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(facing);

    // Head shape (triangle)
    ctx.fillStyle = dragon.hp / dragon.maxHp > 0.25 ? COLOR_DRAGON : '#6b2020';
    ctx.strokeStyle = '#1a3008';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-8, -12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = COLOR_DRAGON_EYE;
    ctx.beginPath();
    ctx.arc(2, -6, 4, 0, Math.PI * 2);
    ctx.arc(2, 6, 4, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(3, -6, 2, 0, Math.PI * 2);
    ctx.arc(3, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.moveTo(-2, -10);
    ctx.lineTo(-8, -22);
    ctx.lineTo(2, -12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 10);
    ctx.lineTo(-8, 22);
    ctx.lineTo(2, 12);
    ctx.fill();

    // Fire breath indicator
    if (dragon.state === DS_FIRE_BREATH && dragon.attackPhase === AP_ACTIVE) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(18, 0, 6 + Math.sin(time * 20) * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawDragonWings(ctx, dragon, time) {
    const { state } = dragon;
    let wingSpread = 0.7;
    let wingFlap = Math.sin(time * 2) * 0.1;

    if (state === DS_WING_GUST) {
        wingSpread = 1.2;
        wingFlap = Math.sin(time * 15) * 0.3;
    } else if (state === DS_SPECIAL_HOVERING || state === DS_SPECIAL_FIRE) {
        wingFlap = Math.sin(time * 6) * 0.3;
        wingSpread = 1.0;
    }

    const wingColor = 'rgba(45, 80, 22, 0.6)';
    const wingOutline = '#1a3008';

    // Left wing
    ctx.save();
    ctx.rotate(-Math.PI / 2 - wingFlap);
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = wingOutline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-DRAGON_RADIUS * wingSpread, -DRAGON_RADIUS * 1.5,
        -DRAGON_RADIUS * wingSpread * 0.8, -DRAGON_RADIUS * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right wing
    ctx.save();
    ctx.rotate(Math.PI / 2 + wingFlap);
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = wingOutline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(DRAGON_RADIUS * wingSpread, -DRAGON_RADIUS * 1.5,
        DRAGON_RADIUS * wingSpread * 0.8, -DRAGON_RADIUS * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawDragonTail(ctx, dragon, time) {
    const { facing, state, stateTimer } = dragon;
    const tailAngle = facing + Math.PI;
    let tailSwing = Math.sin(time * 2) * 0.3;

    if (state === DS_TAIL_SWIPE) {
        tailSwing = Math.sin(stateTimer * 15) * 1.5;
    }

    const t1x = Math.cos(tailAngle + tailSwing) * DRAGON_RADIUS;
    const t1y = Math.sin(tailAngle + tailSwing) * DRAGON_RADIUS;
    const t2x = Math.cos(tailAngle + tailSwing * 1.5) * (DRAGON_RADIUS + 30);
    const t2y = Math.sin(tailAngle + tailSwing * 1.5) * (DRAGON_RADIUS + 30);
    const t3x = Math.cos(tailAngle + tailSwing * 2) * (DRAGON_RADIUS + 55);
    const t3y = Math.sin(tailAngle + tailSwing * 2) * (DRAGON_RADIUS + 55);

    ctx.strokeStyle = COLOR_DRAGON;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(t1x * 0.5, t1y * 0.5);
    ctx.quadraticCurveTo(t2x, t2y, t3x, t3y);
    ctx.stroke();

    // Tail tip (arrow)
    ctx.fillStyle = COLOR_DRAGON;
    const tipAngle = Math.atan2(t3y - t2y, t3x - t2x);
    ctx.save();
    ctx.translate(t3x, t3y);
    ctx.rotate(tipAngle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ========== EGG ==========
export function drawEgg(ctx, x, y, time, index) {
    const wobble = Math.sin(time * 2 + index * 1.5) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + EGG_RADIUS + 2, EGG_RADIUS * 0.7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Egg body
    ctx.save();
    ctx.translate(x + wobble, y);
    ctx.fillStyle = COLOR_EGG;
    ctx.strokeStyle = COLOR_EGG_OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, EGG_RADIUS * 0.8, EGG_RADIUS, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-2, -3, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ========== FIRE OVERLAY ==========
export function drawMapFire(ctx, mapWidth, mapHeight, starCx, starCy, starRadius, intensity) {
    const vertices = getStarVerticesForDraw(starCx, starCy, starRadius, starRadius * 0.4);

    // Draw fire overlay with star clipped out using save/clip/restore
    ctx.save();

    // Create a path that covers the entire map minus the star (using even-odd rule)
    ctx.beginPath();
    ctx.rect(0, 0, mapWidth, mapHeight);
    ctx.moveTo(vertices[0].x, vertices[0].y);
    // Draw star in reverse order for even-odd clipping
    for (let i = vertices.length - 1; i >= 0; i--) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.clip('evenodd');

    // Fill with fire color
    ctx.fillStyle = `rgba(200, 50, 0, ${intensity * 0.4})`;
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    // Additional glow
    ctx.fillStyle = `rgba(255, 100, 0, ${intensity * 0.15})`;
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    ctx.restore();
}

function getStarVerticesForDraw(cx, cy, outerR, innerR) {
    const points = [];
    const step = Math.PI / 5;
    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * step;
        const r = i % 2 === 0 ? outerR : innerR;
        points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    return points;
}

// ========== DISH (VICTORY) ==========
export function drawDish(ctx, cx, cy) {
    // Plate
    ctx.fillStyle = '#f5f5f5';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 120, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Plate rim
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 110, 70, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Scrambled eggs base
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 80, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Egg chunks
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r = 20 + Math.sin(i * 2.5) * 25;
        const ex = cx + Math.cos(a) * r;
        const ey = cy + 5 + Math.sin(a) * r * 0.6;
        ctx.fillStyle = i % 3 === 0 ? '#fff8dc' : '#ffe066';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 12 + (i % 3) * 4, 8 + (i % 2) * 3, i * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Tomato pieces
    const tomatoPositions = [
        { x: -30, y: -10 }, { x: 20, y: -15 }, { x: -10, y: 20 },
        { x: 35, y: 10 }, { x: -25, y: 15 }, { x: 10, y: -5 }
    ];
    for (const tp of tomatoPositions) {
        ctx.fillStyle = COLOR_TOMATO;
        ctx.strokeStyle = COLOR_TOMATO_DARK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx + tp.x, cy + 5 + tp.y, 8 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Green onion garnish
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const gx = cx - 40 + i * 20 + Math.random() * 10;
        const gy = cy + Math.random() * 20 - 5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 8, gy - 3);
        ctx.stroke();
    }
}

// ========== DEBUG HITBOXES ==========
export function drawDebugHitboxes(ctx, dragon, player) {
    ctx.save();

    // Dragon attack hitboxes
    if (dragon.state === DS_FIRE_BREATH) {
        const headDist = DRAGON_RADIUS + 12;
        const fx = dragon.x + Math.cos(dragon.facing) * headDist;
        const fy = dragon.y + Math.sin(dragon.facing) * headDist;
        const isActive = dragon.attackPhase === AP_ACTIVE;
        drawConeHitbox(ctx, fx, fy, dragon.facing, attackConfig.fireBreathSpread, attackConfig.fireBreathRange,
            isActive ? 'rgba(255, 60, 0, 0.25)' : 'rgba(255, 60, 0, 0.10)',
            isActive ? 'rgba(255, 60, 0, 0.6)' : 'rgba(255, 60, 0, 0.3)');
    }

    if (dragon.state === DS_TAIL_SWIPE) {
        const tailAngle = dragon.facing + Math.PI;
        const isActive = dragon.attackPhase === AP_ACTIVE;
        drawArcHitbox(ctx, dragon.x, dragon.y, tailAngle, attackConfig.tailSwipeArc, attackConfig.tailSwipeRange,
            isActive ? 'rgba(0, 100, 255, 0.25)' : 'rgba(0, 100, 255, 0.10)',
            isActive ? 'rgba(0, 100, 255, 0.6)' : 'rgba(0, 100, 255, 0.3)');
    }

    if (dragon.state === DS_WING_GUST) {
        const isActive = dragon.attackPhase === AP_ACTIVE;
        drawConeHitbox(ctx, dragon.x, dragon.y, dragon.facing, attackConfig.wingGustSpread, attackConfig.wingGustRange,
            isActive ? 'rgba(0, 200, 100, 0.25)' : 'rgba(0, 200, 100, 0.10)',
            isActive ? 'rgba(0, 200, 100, 0.6)' : 'rgba(0, 200, 100, 0.3)');
    }

    if (dragon.state === DS_SPECIAL_CRASH && dragon.specialTimer >= 2.0) {
        const MAP_CX = MAP_WIDTH / 2;
        const MAP_CY = MAP_HEIGHT / 2;
        ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(MAP_CX, MAP_CY, SPECIAL_CRASH_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Player attack hitbox
    if (player.state === PS_ATTACKING && player.attackPhase === AP_ACTIVE) {
        const hitbox = player.getAttackHitbox();
        if (hitbox) {
            if (hitbox.type === 'arc') {
                drawArcHitbox(ctx, hitbox.cx, hitbox.cy, hitbox.centerAngle, hitbox.sweep, hitbox.range,
                    'rgba(255, 255, 0, 0.25)', 'rgba(255, 255, 0, 0.6)');
            } else if (hitbox.type === 'rect') {
                ctx.save();
                ctx.translate(player.x, player.y);
                ctx.rotate(hitbox.angle);
                ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
                ctx.lineWidth = 2;
                ctx.fillRect(0, -THRUST_WIDTH / 2, hitbox.length, THRUST_WIDTH);
                ctx.strokeRect(0, -THRUST_WIDTH / 2, hitbox.length, THRUST_WIDTH);
                ctx.restore();
            }
        }
    }

    // Always show dragon hitbox circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(dragon.x, dragon.y, dragon.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Player hitbox circle
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

function drawConeHitbox(ctx, ox, oy, angle, spread, range, fillColor, strokeColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, range, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawArcHitbox(ctx, ox, oy, centerAngle, arc, range, fillColor, strokeColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, range, centerAngle - arc / 2, centerAngle + arc / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
