import {
    CANVAS_WIDTH, CANVAS_HEIGHT, STAMINA_MAX,
    COLOR_HP_PLAYER, COLOR_HP_DRAGON, COLOR_STAMINA, COLOR_STAMINA_EMPTY,
    STATE_TITLE, STATE_PLAYING, STATE_BOSS_SPECIAL, STATE_DEATH,
    STATE_VICTORY, STATE_VICTORY_SCREEN, STATE_EGGS_BURNED
} from './constants.js';
import { drawDish } from './draw.js';

export function drawUI(ctx, gameState, player, dragon, eggs, timer, ngLevel) {
    ctx.save();

    switch (gameState) {
        case STATE_TITLE:
            drawTitleScreen(ctx, ngLevel);
            break;
        case STATE_PLAYING:
        case STATE_BOSS_SPECIAL:
            drawHUD(ctx, player, dragon, eggs, timer, ngLevel);
            break;
        case STATE_DEATH:
            drawHUD(ctx, player, dragon, eggs, timer, ngLevel);
            drawDeathScreen(ctx);
            break;
        case STATE_EGGS_BURNED:
            drawHUD(ctx, player, dragon, eggs, timer, ngLevel);
            drawEggsBurnedScreen(ctx);
            break;
        case STATE_VICTORY:
            drawHUD(ctx, player, dragon, eggs, timer, ngLevel);
            drawVictoryHint(ctx);
            break;
        case STATE_VICTORY_SCREEN:
            drawVictoryScreen(ctx, timer, ngLevel);
            break;
    }

    ctx.restore();
}

function drawHUD(ctx, player, dragon, eggs, timer, ngLevel) {
    // Egg counter (top-left)
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    const eggText = `🥚 ${eggs.collectedCount} / ${eggs.totalEggs}`;
    ctx.strokeText(eggText, 20, 30);
    ctx.fillText(eggText, 20, 30);

    // Timer (top-left, below eggs)
    const mins = Math.floor(timer / 60);
    const secs = Math.floor(timer % 60);
    const timeText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.font = '16px monospace';
    ctx.strokeText(timeText, 20, 55);
    ctx.fillText(timeText, 20, 55);

    // NG+ indicator
    if (ngLevel > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.strokeText(`NG+${ngLevel}`, CANVAS_WIDTH - 20, 30);
        ctx.fillText(`NG+${ngLevel}`, CANVAS_WIDTH - 20, 30);
    }

    // Dragon HP bar (top center)
    if (dragon.hp > 0) {
        const barW = 300;
        const barH = 16;
        const barX = (CANVAS_WIDTH - barW) / 2;
        const barY = 15;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        // HP fill
        const ratio = dragon.hp / dragon.maxHp;
        ctx.fillStyle = COLOR_HP_DRAGON;
        ctx.fillRect(barX, barY, barW * ratio, barH);
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DRAGON', CANVAS_WIDTH / 2, barY + 12);
    }

    // Player HP bar (bottom center)
    const pBarW = 200;
    const pBarH = 14;
    const pBarX = (CANVAS_WIDTH - pBarW) / 2;
    const pBarY = CANVAS_HEIGHT - 55;

    ctx.fillStyle = '#333';
    ctx.fillRect(pBarX - 1, pBarY - 1, pBarW + 2, pBarH + 2);

    // Draw HP segments
    const segW = pBarW / player.maxHp;
    for (let i = 0; i < player.maxHp; i++) {
        if (i < player.hp) {
            ctx.fillStyle = COLOR_HP_PLAYER;
        } else {
            ctx.fillStyle = '#1a1a1a';
        }
        ctx.fillRect(pBarX + i * segW + 1, pBarY, segW - 2, pBarH);
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(pBarX - 1, pBarY - 1, pBarW + 2, pBarH + 2);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, CANVAS_WIDTH / 2, pBarY + 11);

    // Stamina bar (below HP)
    const sBarY = pBarY + pBarH + 6;
    const sBarH = 8;

    ctx.fillStyle = '#222';
    ctx.fillRect(pBarX - 1, sBarY - 1, pBarW + 2, sBarH + 2);

    const staminaRatio = player.stamina / STAMINA_MAX;
    const staminaColor = player.staminaLocked ? COLOR_STAMINA_EMPTY : COLOR_STAMINA;
    ctx.fillStyle = staminaColor;
    ctx.fillRect(pBarX, sBarY, pBarW * staminaRatio, sBarH);

    // Flash when empty
    if (player.stamina <= 0) {
        const flash = Math.sin(Date.now() * 0.01) > 0;
        if (flash) {
            ctx.fillStyle = COLOR_STAMINA_EMPTY;
            ctx.fillRect(pBarX, sBarY, pBarW * 0.03, sBarH);
        }
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(pBarX - 1, sBarY - 1, pBarW + 2, sBarH + 2);
}

function drawTitleScreen(ctx, ngLevel) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = COLOR_HP_PLAYER;
    ctx.font = 'bold 72px serif';
    ctx.fillText('토달볶', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.fillStyle = '#ccc';
    ctx.font = '24px monospace';
    ctx.fillText('to-dal-bokk', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    // Subtitle
    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('토마토 vs 드래곤', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    if (ngLevel > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`NG+${ngLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    // Controls hint
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('WASD: 이동  |  Space: 구르기  |  Shift: 뒤로피하기', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    ctx.fillText('J/Z: 크게베기(좌)  |  K/X: 크게베기(우)  |  L/C: 찌르기', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 125);

    // Start prompt
    const blink = Math.sin(Date.now() * 0.003) > 0;
    if (blink) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('Enter를 눌러 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 180);
    }
}

function drawDeathScreen(ctx) {
    ctx.fillStyle = 'rgba(100,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 64px serif';
    ctx.fillText('사망', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#ccc';
    ctx.font = '20px monospace';
    ctx.fillText('R을 눌러 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function drawEggsBurnedScreen(ctx) {
    ctx.fillStyle = 'rgba(80,30,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 36px serif';
    ctx.fillText('달걀이 모두 타버렸다!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.fillStyle = '#ccc';
    ctx.font = '18px monospace';
    ctx.fillText('달걀을 먼저 모은 후 드래곤을 잡아야 합니다', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

    ctx.fillStyle = '#aaa';
    ctx.font = '20px monospace';
    ctx.fillText('R을 눌러 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function drawVictoryHint(ctx) {
    const blink = Math.sin(Date.now() * 0.004) > 0;
    if (blink) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('문이 열렸다!', CANVAS_WIDTH / 2, 80);
    }
}

export function drawVictoryScreen(ctx, timer, ngLevel) {
    ctx.fillStyle = '#f5e6d0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // Dish
    drawDish(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    // Title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px serif';
    ctx.fillText('토마토 달걀 볶음', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);

    // Time
    const mins = Math.floor(timer / 60);
    const secs = Math.floor(timer % 60);
    const ms = Math.floor((timer % 1) * 100);
    ctx.fillStyle = '#666';
    ctx.font = '20px monospace';
    ctx.fillText(`클리어 시간: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);

    // Play again button
    const btnX = CANVAS_WIDTH / 2 - 80;
    const btnY = CANVAS_HEIGHT / 2 + 170;
    const btnW = 160;
    const btnH = 44;

    ctx.fillStyle = '#e63946';
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    } else {
        ctx.rect(btnX, btnY, btnW, btnH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('다시 하기', CANVAS_WIDTH / 2, btnY + 28);

    if (ngLevel >= 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px monospace';
        ctx.fillText(`(NG+${ngLevel + 1}으로 시작)`, CANVAS_WIDTH / 2, btnY + btnH + 25);
    }

    // Store button bounds for click detection
    drawVictoryScreen._btnBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
}

export function getVictoryButtonBounds() {
    return drawVictoryScreen._btnBounds || null;
}

// Special phase countdown
export function drawSpecialCountdown(ctx, secondsLeft) {
    ctx.fillStyle = '#ff4400';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    const text = Math.ceil(secondsLeft).toString();
    ctx.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function drawWarning(ctx, text) {
    const blink = Math.sin(Date.now() * 0.008) > 0;
    if (blink) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
        ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    }
}
