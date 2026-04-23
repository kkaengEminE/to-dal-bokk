import {
    EGG_RADIUS, EGG_BASE_COUNT, EGG_MIN_DISTANCE,
    WALL_THICKNESS, MAP_WIDTH, MAP_HEIGHT, PLAYER_SPAWN_X, PLAYER_SPAWN_Y,
    DRAGON_SPAWN_X, DRAGON_SPAWN_Y
} from './constants.js';
import { circleCircle, distance } from './collision.js';
import { drawEgg } from './draw.js';
import { emitParticles } from './particles.js';

export class EggManager {
    constructor() {
        this.eggs = [];
        this.totalEggs = EGG_BASE_COUNT;
        this.collectedCount = 0;
    }

    spawn(count) {
        this.eggs = [];
        this.totalEggs = count;
        this.collectedCount = 0;

        const margin = WALL_THICKNESS + 60;

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x, y;
            do {
                x = margin + Math.random() * (MAP_WIDTH - margin * 2);
                y = margin + Math.random() * (MAP_HEIGHT - margin * 2);
                attempts++;
            } while (attempts < 100 && (
                distance(x, y, PLAYER_SPAWN_X, PLAYER_SPAWN_Y) < 120 ||
                distance(x, y, DRAGON_SPAWN_X, DRAGON_SPAWN_Y) < 150 ||
                distance(x, y, MAP_WIDTH / 2, MAP_HEIGHT / 2) < 100 || // avoid star center
                this._tooCloseToOthers(x, y)
            ));

            this.eggs.push({
                x, y,
                collected: false,
                burned: false,
                burnTimer: 0
            });
        }
    }

    _tooCloseToOthers(x, y) {
        for (const egg of this.eggs) {
            if (distance(x, y, egg.x, egg.y) < EGG_MIN_DISTANCE) return true;
        }
        return false;
    }

    checkCollection(playerX, playerY, playerRadius) {
        let collected = false;
        for (const egg of this.eggs) {
            if (egg.collected || egg.burned) continue;
            if (circleCircle(playerX, playerY, playerRadius, egg.x, egg.y, EGG_RADIUS)) {
                egg.collected = true;
                this.collectedCount++;
                emitParticles('collect', egg.x, egg.y, 0, 12);
                collected = true;
            }
        }
        return collected;
    }

    allCollected() {
        return this.collectedCount >= this.totalEggs;
    }

    burnAll(dt) {
        for (const egg of this.eggs) {
            if (!egg.collected && !egg.burned) {
                egg.burnTimer += dt;
                if (egg.burnTimer > 0.5) {
                    egg.burned = true;
                    emitParticles('egg_burn', egg.x, egg.y, 0, 15);
                }
            }
        }
    }

    burnImmediate() {
        for (const egg of this.eggs) {
            if (!egg.collected) {
                egg.burned = true;
                emitParticles('egg_burn', egg.x, egg.y, 0, 15);
            }
        }
    }

    draw(ctx, time) {
        for (let i = 0; i < this.eggs.length; i++) {
            const egg = this.eggs[i];
            if (egg.collected || egg.burned) continue;
            drawEgg(ctx, egg.x, egg.y, time, i);
        }
    }
}
