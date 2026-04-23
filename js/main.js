import {
    CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT,
    PLAYER_BASE_HP, DRAGON_BASE_HP, EGG_BASE_COUNT,
    NG_PLUS_HP_INCREMENT, NG_PLUS_DRAGON_HP_INCREMENT, EGG_NG_PLUS_INCREMENT,
    NG_PLUS_DRAGON_SPEED_MULT, STAR_RADIUS,
    WING_GUST_PUSH_SPEED, attackConfig,
    STATE_TITLE, STATE_PLAYING, STATE_BOSS_SPECIAL,
    STATE_EGGS_BURNED, STATE_VICTORY, STATE_VICTORY_SCREEN, STATE_DEATH,
    PS_DEAD, DS_DEAD, DS_SPECIAL_SETUP, DS_SPECIAL_RISING,
    DS_SPECIAL_FIRE, DS_SPECIAL_CRASH, DS_SPECIAL_HOVERING,
    DS_STUNNED, AP_ACTIVE
} from './constants.js';
import { Player } from './player.js';
import { Dragon } from './dragon.js';
import { EggManager } from './egg.js';
import { GameMap } from './map.js';
import { Camera } from './camera.js';
import { updateInput, justPressed } from './input.js';
import { updateParticles, drawParticles, clearParticles, emitParticles } from './particles.js';
import { drawTomato, drawDragon, drawMapFire, drawDebugHitboxes } from './draw.js';
import { drawUI, drawWarning, getVictoryButtonBounds } from './ui.js';
import { circleInArcSimple, angleBetween, pointInStar, distance } from './collision.js';

// ===== CANVAS SETUP =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ===== GAME STATE =====
let gameState = STATE_TITLE;
let ngLevel = 0;
let timer = 0;
let lastTime = 0;
let fireCheckDone = false;
let eggsBurnedTimer = 0;
let victoryFadeTimer = 0;

// ===== GAME OBJECTS =====
let player = new Player(PLAYER_BASE_HP);
let dragon = new Dragon(DRAGON_BASE_HP);
let eggs = new EggManager();
let gameMap = new GameMap();
let camera = new Camera();

// ===== ADMIN DEBUG MODE =====
let debugMode = false;
const adminToggle = document.getElementById('admin-toggle');
const adminPanel = document.getElementById('admin-panel');

function setupAdminPanel() {
    const sliders = {
        'slider-fire-range': { key: 'fireBreathRange', unit: 'px' },
        'slider-fire-spread': { key: 'fireBreathSpread', unit: '°', toRad: true },
        'slider-wind-range': { key: 'wingGustRange', unit: 'px' },
        'slider-wind-spread': { key: 'wingGustSpread', unit: '°', toRad: true },
        'slider-tail-range': { key: 'tailSwipeRange', unit: 'px' },
        'slider-tail-arc': { key: 'tailSwipeArc', unit: '°', toRad: true },
    };

    for (const [id, cfg] of Object.entries(sliders)) {
        const slider = document.getElementById(id);
        const valSpan = document.getElementById('val-' + id.replace('slider-', ''));
        const currentVal = cfg.toRad ? Math.round(attackConfig[cfg.key] * 180 / Math.PI) : attackConfig[cfg.key];
        slider.value = currentVal;
        valSpan.textContent = currentVal + cfg.unit;

        slider.addEventListener('input', () => {
            const v = Number(slider.value);
            valSpan.textContent = v + cfg.unit;
            attackConfig[cfg.key] = cfg.toRad ? v * Math.PI / 180 : v;
        });
    }
}

adminToggle.addEventListener('click', () => {
    debugMode = !debugMode;
    adminToggle.classList.toggle('active', debugMode);
    adminPanel.classList.toggle('hidden', !debugMode);
});

setupAdminPanel();

// ===== CLICK HANDLER (for victory screen button) =====
canvas.addEventListener('click', (e) => {
    if (gameState !== STATE_VICTORY_SCREEN) return;
    const bounds = getVictoryButtonBounds();
    if (!bounds) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    if (mx >= bounds.x && mx <= bounds.x + bounds.w &&
        my >= bounds.y && my <= bounds.y + bounds.h) {
        startNewGamePlus();
    }
});

function startGame() {
    const maxHp = PLAYER_BASE_HP + ngLevel * NG_PLUS_HP_INCREMENT;
    const dragonHp = DRAGON_BASE_HP + ngLevel * NG_PLUS_DRAGON_HP_INCREMENT;
    const eggCount = EGG_BASE_COUNT + ngLevel * EGG_NG_PLUS_INCREMENT;
    const dragonSpeedMult = Math.pow(NG_PLUS_DRAGON_SPEED_MULT, ngLevel);

    player.reset(maxHp);
    dragon.reset(dragonHp, 1 / dragonSpeedMult); // faster = higher mult
    eggs.spawn(eggCount);
    gameMap.doorOpen = false;
    gameMap.showStar = false;
    camera = new Camera();
    clearParticles();

    timer = 0;
    fireCheckDone = false;
    eggsBurnedTimer = 0;
    victoryFadeTimer = 0;
    gameState = STATE_PLAYING;
}

function startNewGamePlus() {
    ngLevel++;
    gameState = STATE_TITLE;
}

// ===== GAME LOOP =====
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    updateInput();
    update(dt);
    render(currentTime / 1000);

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    switch (gameState) {
        case STATE_TITLE:
            if (justPressed('Enter')) startGame();
            break;

        case STATE_PLAYING:
            updatePlaying(dt);
            break;

        case STATE_BOSS_SPECIAL:
            updateBossSpecial(dt);
            break;

        case STATE_DEATH:
            if (justPressed('KeyR')) startGame();
            break;

        case STATE_EGGS_BURNED:
            eggsBurnedTimer += dt;
            updateParticles(dt);
            if (justPressed('KeyR')) startGame();
            break;

        case STATE_VICTORY:
            updateVictory(dt);
            break;

        case STATE_VICTORY_SCREEN:
            // Just wait for click
            if (justPressed('Enter')) startNewGamePlus();
            break;
    }
}

function updatePlaying(dt) {
    timer += dt;

    player.update(dt, gameMap);
    dragon.update(dt, player);
    updateParticles(dt);
    camera.update(player.x, player.y, dt);

    // Egg collection
    eggs.checkCollection(player.x, player.y, player.radius);

    // Hide star when stun ends
    if (gameMap.showStar && dragon.state !== DS_STUNNED && !dragon.isInSpecialPhase()) {
        gameMap.showStar = false;
    }

    // Check if dragon enters special phase
    if (dragon.isInSpecialPhase()) {
        gameState = STATE_BOSS_SPECIAL;
        gameMap.showStar = true;
        camera.targetZoom = 0.85;
        return;
    }

    // Combat: player attacks dragon
    checkPlayerAttacksDragon();

    // Combat: dragon attacks player
    checkDragonAttacksPlayer(dt);

    // Check dragon death
    if (dragon.state === DS_DEAD) {
        onDragonDeath();
        return;
    }

    // Check player death
    if (player.state === PS_DEAD) {
        gameState = STATE_DEATH;
    }
}

function updateBossSpecial(dt) {
    timer += dt;

    player.update(dt, gameMap);
    dragon.update(dt, player);
    updateParticles(dt);
    camera.update(player.x, player.y, dt);

    // Check if special fire damages player
    if (dragon.state === DS_SPECIAL_FIRE && !fireCheckDone) {
        fireCheckDone = true;
        // Check if player is inside star
        if (!pointInStar(player.x, player.y, MAP_WIDTH / 2, MAP_HEIGHT / 2, STAR_RADIUS, STAR_RADIUS * 0.4)) {
            player.takeDamage(1);
            camera.shake(10, 0.5);
        }
    }

    // Check crash damage
    if (dragon.checkCrashHit(player)) {
        player.takeDamage(1);
        camera.shake(12, 0.4);
    }

    // Still allow player attacks during special phase (e.g., during stun)
    checkPlayerAttacksDragon();

    // Check dragon death during special
    if (dragon.state === DS_DEAD) {
        gameMap.showStar = false;
        camera.targetZoom = 1;
        onDragonDeath();
        return;
    }

    // Check player death
    if (player.state === PS_DEAD) {
        gameState = STATE_DEATH;
        return;
    }

    // Special phase ended (dragon returned to idle/stunned from special)
    if (!dragon.isInSpecialPhase() && dragon.state !== DS_DEAD) {
        gameState = STATE_PLAYING;
        camera.targetZoom = 1;
        fireCheckDone = false;
        // Keep star visible during stun, hide after
        if (dragon.state !== DS_STUNNED) {
            gameMap.showStar = false;
        }
    }
}

function updateVictory(dt) {
    // Timer stays frozen at victory
    player.update(dt, gameMap);
    updateParticles(dt);
    camera.update(player.x, player.y, dt);

    // Check if player walks through door
    if (gameMap.isAtDoor(player.x, player.y, player.radius)) {
        victoryFadeTimer += dt;
        if (victoryFadeTimer >= 1.5) {
            gameState = STATE_VICTORY_SCREEN;
        }
    }
}

function checkPlayerAttacksDragon() {
    if (!player.isAttackActive()) return;
    if (player.attackHitRegistered) return;

    const hitbox = player.getAttackHitbox();
    if (!hitbox) return;

    let hit = false;
    if (hitbox.type === 'arc') {
        hit = circleInArcSimple(
            dragon.x, dragon.y, dragon.radius,
            hitbox.cx, hitbox.cy, hitbox.range,
            hitbox.centerAngle, hitbox.sweep
        );
    } else if (hitbox.type === 'rect') {
        // Simplified: check if dragon center is within thrust range and angle
        const dist = distance(player.x, player.y, dragon.x, dragon.y);
        const angle = angleBetween(player.x, player.y, dragon.x, dragon.y);
        const angleDiff = Math.abs(angle - hitbox.angle);
        const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        hit = dist <= hitbox.length + dragon.radius && normalizedDiff <= 0.4;
    }

    if (hit) {
        player.attackHitRegistered = true;
        const died = dragon.takeDamage(player.getAttackDamage());
        camera.shake(4, 0.15);
        emitParticles('slash', dragon.x, dragon.y, player.facing, 6);
    }
}

function checkDragonAttacksPlayer(dt) {
    if (player.invincible) return;

    // Fire breath
    if (dragon.checkFireBreathHit(player)) {
        player.takeDamage(1);
        camera.shake(6, 0.2);
    }

    // Tail swipe
    if (dragon.checkTailSwipeHit(player)) {
        player.takeDamage(1);
        camera.shake(8, 0.25);
        const kb = angleBetween(dragon.x, dragon.y, player.x, player.y);
        player.applyKnockback(kb, 300);
    }

    // Wing gust (pushback, no damage)
    if (dragon.checkWingGustHit(player)) {
        const pushAngle = angleBetween(dragon.x, dragon.y, player.x, player.y);
        player.applyKnockback(pushAngle, WING_GUST_PUSH_SPEED);
    }
}

function onDragonDeath() {
    if (!eggs.allCollected()) {
        // Penalty: all eggs burn
        gameState = STATE_EGGS_BURNED;
        eggsBurnedTimer = 0;
        player.takeDamage(1);
        eggs.burnImmediate();
        camera.shake(10, 0.5);

        // Fire effect all over map
        for (let i = 0; i < 30; i++) {
            const fx = 50 + Math.random() * (MAP_WIDTH - 100);
            const fy = 50 + Math.random() * (MAP_HEIGHT - 100);
            emitParticles('fire_ground', fx, fy, 0, 3);
        }

        if (player.state === PS_DEAD) {
            gameState = STATE_DEATH;
        }
    } else {
        // Victory!
        gameState = STATE_VICTORY;
        gameMap.doorOpen = true;
        victoryFadeTimer = 0;
        // Don't keep incrementing timer
    }
}

// ===== RENDER =====
function render(time) {
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === STATE_VICTORY_SCREEN) {
        drawUI(ctx, gameState, player, dragon, eggs, timer, ngLevel);
        return;
    }

    if (gameState === STATE_TITLE) {
        drawUI(ctx, gameState, player, dragon, eggs, timer, ngLevel);
        return;
    }

    // World rendering with camera
    camera.applyTransform(ctx);

    // Map
    gameMap.draw(ctx, time);

    // Eggs
    eggs.draw(ctx, time);

    // Dragon
    if (dragon.hp > 0 || dragon.stateTimer < 1.5) {
        drawDragon(ctx, dragon, time);
    }

    // Player
    drawTomato(ctx, player, time);

    // Particles (world space)
    drawParticles(ctx);

    // Debug hitboxes (world space)
    if (debugMode) {
        drawDebugHitboxes(ctx, dragon, player);
    }

    // Special phase fire overlay (with fade-out into crash)
    const fireIntensity = dragon.getFireOverlayIntensity();
    if (fireIntensity > 0) {
        drawMapFire(ctx, MAP_WIDTH, MAP_HEIGHT, MAP_WIDTH / 2, MAP_HEIGHT / 2, STAR_RADIUS, fireIntensity);
    }

    camera.restoreTransform(ctx);

    // Screen-space UI
    drawUI(ctx, gameState, player, dragon, eggs, timer, ngLevel);

    // Warning during special setup/rising/hovering
    if (dragon.state === DS_SPECIAL_SETUP || dragon.state === DS_SPECIAL_RISING || dragon.state === DS_SPECIAL_HOVERING) {
        drawWarning(ctx, '⚠');
    }

    // Warning before crash (during sky wait after fire)
    if (dragon.state === DS_SPECIAL_CRASH && dragon.specialTimer < 2.0) {
        drawWarning(ctx, '⚠');
    }

    // Victory fade
    if (gameState === STATE_VICTORY && victoryFadeTimer > 0) {
        const alpha = Math.min(1, victoryFadeTimer / 1.5);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

// ===== START =====
requestAnimationFrame(gameLoop);
