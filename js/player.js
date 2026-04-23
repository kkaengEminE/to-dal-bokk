import {
    PLAYER_RADIUS, PLAYER_SPEED, PLAYER_BASE_HP, PLAYER_SPAWN_X, PLAYER_SPAWN_Y,
    ROLL_SPEED, ROLL_DURATION, ROLL_STAMINA_COST,
    BACKSTEP_SPEED, BACKSTEP_DURATION, BACKSTEP_STAMINA_COST,
    STAMINA_MAX, STAMINA_REGEN_RATE, STAMINA_REGEN_DELAY, STAMINA_DEPLETED_STAGGER,
    ATTACK_WINDUP, ATTACK_ACTIVE, ATTACK_RECOVERY,
    HEAVY_SLASH_ARC, HEAVY_SLASH_RANGE, HEAVY_SLASH_DAMAGE,
    THRUST_LENGTH, THRUST_WIDTH, THRUST_DAMAGE,
    HIT_IFRAME_DURATION, FLINCH_DURATION,
    PS_IDLE, PS_MOVING, PS_ROLLING, PS_BACKSTEPPING, PS_ATTACKING,
    PS_FLINCHING, PS_STAGGERING, PS_DEAD,
    AP_WINDUP, AP_ACTIVE, AP_RECOVERY,
    WALL_THICKNESS
} from './constants.js';
import * as Input from './input.js';
import { emitParticles } from './particles.js';

export class Player {
    constructor(maxHp = PLAYER_BASE_HP) {
        this.x = PLAYER_SPAWN_X;
        this.y = PLAYER_SPAWN_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 0; // angle in radians
        this.radius = PLAYER_RADIUS;

        this.maxHp = maxHp;
        this.hp = maxHp;
        this.stamina = STAMINA_MAX;
        this.staminaRegenTimer = 0;
        this.staminaLocked = false;

        this.state = PS_IDLE;
        this.stateTimer = 0;

        this.attackType = null;   // 'HEAVY_LEFT', 'HEAVY_RIGHT', 'THRUST'
        this.attackPhase = null;  // AP_WINDUP, AP_ACTIVE, AP_RECOVERY
        this.attackTimer = 0;
        this.attackDuration = 0;
        this.attackHitRegistered = false;

        this.iframeTimer = 0;
        this.invincible = false;

        this.eggsCollected = 0;

        this.knockbackVx = 0;
        this.knockbackVy = 0;
    }

    reset(maxHp) {
        this.x = PLAYER_SPAWN_X;
        this.y = PLAYER_SPAWN_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 0;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.stamina = STAMINA_MAX;
        this.staminaRegenTimer = 0;
        this.staminaLocked = false;
        this.state = PS_IDLE;
        this.stateTimer = 0;
        this.attackType = null;
        this.attackPhase = null;
        this.iframeTimer = 0;
        this.invincible = false;
        this.eggsCollected = 0;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
    }

    update(dt, map) {
        this.stateTimer += dt;

        // Iframes
        if (this.iframeTimer > 0) {
            this.iframeTimer -= dt;
            this.invincible = true;
        } else {
            this.invincible = false;
        }

        // Knockback decay
        this.knockbackVx *= 0.9;
        this.knockbackVy *= 0.9;
        if (Math.abs(this.knockbackVx) < 1) this.knockbackVx = 0;
        if (Math.abs(this.knockbackVy) < 1) this.knockbackVy = 0;

        switch (this.state) {
            case PS_IDLE:
            case PS_MOVING:
                this._updateMovement(dt);
                this._checkDodge();
                this._checkAttack();
                this._regenStamina(dt);
                break;
            case PS_ROLLING:
                this._updateRoll(dt);
                break;
            case PS_BACKSTEPPING:
                this._updateBackstep(dt);
                break;
            case PS_ATTACKING:
                this._updateAttack(dt);
                break;
            case PS_FLINCHING:
                if (this.stateTimer >= FLINCH_DURATION) {
                    this.state = PS_IDLE;
                    this.stateTimer = 0;
                }
                break;
            case PS_STAGGERING:
                if (this.stateTimer >= STAMINA_DEPLETED_STAGGER) {
                    this.state = PS_IDLE;
                    this.stateTimer = 0;
                    this.staminaLocked = false;
                }
                break;
            case PS_DEAD:
                break;
        }

        // Apply knockback
        this.x += this.knockbackVx * dt;
        this.y += this.knockbackVy * dt;

        // Clamp to bounds
        const clamped = map.clampToBounds(this.x, this.y, this.radius);
        this.x = clamped.x;
        this.y = clamped.y;
    }

    _updateMovement(dt) {
        const { dx, dy } = Input.getMovementDir();

        if (dx !== 0 || dy !== 0) {
            this.vx = dx * PLAYER_SPEED;
            this.vy = dy * PLAYER_SPEED;
            this.facing = Math.atan2(dy, dx);
            this.state = PS_MOVING;
        } else {
            this.vx = 0;
            this.vy = 0;
            if (this.state === PS_MOVING) {
                this.state = PS_IDLE;
                this.stateTimer = 0;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    _checkDodge() {
        if (Input.justPressed('Space')) {
            if (this.stamina >= ROLL_STAMINA_COST && !this.staminaLocked) {
                this._startRoll();
            } else if (this.stamina < ROLL_STAMINA_COST) {
                this._stagger();
            }
        }
        if (Input.justPressed('ShiftLeft') || Input.justPressed('ShiftRight')) {
            if (this.stamina >= BACKSTEP_STAMINA_COST && !this.staminaLocked) {
                this._startBackstep();
            } else if (this.stamina < BACKSTEP_STAMINA_COST) {
                this._stagger();
            }
        }
    }

    _startRoll() {
        this.state = PS_ROLLING;
        this.stateTimer = 0;
        this.stamina -= ROLL_STAMINA_COST;
        this.staminaRegenTimer = STAMINA_REGEN_DELAY;
        this.invincible = true;
        this.iframeTimer = ROLL_DURATION;

        const { dx, dy } = Input.getMovementDir();
        if (dx !== 0 || dy !== 0) {
            this.vx = dx * ROLL_SPEED;
            this.vy = dy * ROLL_SPEED;
        } else {
            this.vx = Math.cos(this.facing) * ROLL_SPEED;
            this.vy = Math.sin(this.facing) * ROLL_SPEED;
        }

        emitParticles('dust', this.x, this.y, 0, 5);
    }

    _startBackstep() {
        this.state = PS_BACKSTEPPING;
        this.stateTimer = 0;
        this.stamina -= BACKSTEP_STAMINA_COST;
        this.staminaRegenTimer = STAMINA_REGEN_DELAY;
        this.invincible = true;
        this.iframeTimer = BACKSTEP_DURATION;

        const backAngle = this.facing + Math.PI;
        this.vx = Math.cos(backAngle) * BACKSTEP_SPEED;
        this.vy = Math.sin(backAngle) * BACKSTEP_SPEED;

        emitParticles('dust', this.x, this.y, 0, 3);
    }

    _stagger() {
        this.state = PS_STAGGERING;
        this.stateTimer = 0;
        this.staminaLocked = true;
        this.vx = 0;
        this.vy = 0;
    }

    _updateRoll(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.stateTimer >= ROLL_DURATION) {
            this.state = PS_IDLE;
            this.stateTimer = 0;
            this.vx = 0;
            this.vy = 0;
        }
    }

    _updateBackstep(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.stateTimer >= BACKSTEP_DURATION) {
            this.state = PS_IDLE;
            this.stateTimer = 0;
            this.vx = 0;
            this.vy = 0;
        }
    }

    _checkAttack() {
        let type = null;
        if (Input.justPressed('KeyJ') || Input.justPressed('KeyZ')) type = 'HEAVY_LEFT';
        else if (Input.justPressed('KeyK') || Input.justPressed('KeyX')) type = 'HEAVY_RIGHT';
        else if (Input.justPressed('KeyL') || Input.justPressed('KeyC')) type = 'THRUST';

        if (type) {
            this.state = PS_ATTACKING;
            this.stateTimer = 0;
            this.attackType = type;
            this.attackPhase = AP_WINDUP;
            this.attackTimer = 0;
            this.attackDuration = ATTACK_WINDUP;
            this.attackHitRegistered = false;
            this.vx = 0;
            this.vy = 0;
        }
    }

    _updateAttack(dt) {
        this.attackTimer += dt;

        if (this.attackTimer >= this.attackDuration) {
            this.attackTimer = 0;
            if (this.attackPhase === AP_WINDUP) {
                this.attackPhase = AP_ACTIVE;
                this.attackDuration = ATTACK_ACTIVE;
                // Small forward lunge for attacks
                const lungeSpeed = this.attackType === 'THRUST' ? 100 : 50;
                this.x += Math.cos(this.facing) * lungeSpeed * dt;
                this.y += Math.sin(this.facing) * lungeSpeed * dt;
            } else if (this.attackPhase === AP_ACTIVE) {
                this.attackPhase = AP_RECOVERY;
                this.attackDuration = ATTACK_RECOVERY;
            } else if (this.attackPhase === AP_RECOVERY) {
                this.state = PS_IDLE;
                this.stateTimer = 0;
                this.attackType = null;
                this.attackPhase = null;
            }
        }
    }

    _regenStamina(dt) {
        if (this.staminaLocked) return;
        if (this.staminaRegenTimer > 0) {
            this.staminaRegenTimer -= dt;
            return;
        }
        this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_REGEN_RATE * dt);
    }

    takeDamage(amount = 1) {
        if (this.invincible || this.state === PS_DEAD) return false;

        this.hp -= amount;
        this.iframeTimer = HIT_IFRAME_DURATION;
        this.invincible = true;

        emitParticles('hit', this.x, this.y, 0, 8);

        if (this.hp <= 0) {
            this.hp = 0;
            this.state = PS_DEAD;
            this.stateTimer = 0;
            this.vx = 0;
            this.vy = 0;
            return true; // died
        }

        this.state = PS_FLINCHING;
        this.stateTimer = 0;
        this.vx = 0;
        this.vy = 0;
        return false;
    }

    applyKnockback(angle, speed) {
        this.knockbackVx = Math.cos(angle) * speed;
        this.knockbackVy = Math.sin(angle) * speed;
    }

    isAttackActive() {
        return this.state === PS_ATTACKING && this.attackPhase === AP_ACTIVE;
    }

    getAttackDamage() {
        if (this.attackType === 'THRUST') return THRUST_DAMAGE;
        return HEAVY_SLASH_DAMAGE;
    }

    getAttackHitbox() {
        if (!this.isAttackActive()) return null;

        if (this.attackType === 'HEAVY_LEFT' || this.attackType === 'HEAVY_RIGHT') {
            const offset = this.attackType === 'HEAVY_LEFT' ? -HEAVY_SLASH_ARC / 2 : HEAVY_SLASH_ARC / 2;
            const progress = this.attackTimer / this.attackDuration;
            const sweepAngle = this.attackType === 'HEAVY_LEFT'
                ? this.facing - HEAVY_SLASH_ARC / 2 + progress * HEAVY_SLASH_ARC
                : this.facing + HEAVY_SLASH_ARC / 2 - progress * HEAVY_SLASH_ARC;
            return {
                type: 'arc',
                cx: this.x,
                cy: this.y,
                range: HEAVY_SLASH_RANGE,
                centerAngle: this.facing,
                sweep: HEAVY_SLASH_ARC
            };
        } else if (this.attackType === 'THRUST') {
            return {
                type: 'rect',
                x: this.x + Math.cos(this.facing) * PLAYER_RADIUS,
                y: this.y + Math.sin(this.facing) * PLAYER_RADIUS,
                angle: this.facing,
                length: THRUST_LENGTH,
                width: THRUST_WIDTH
            };
        }
        return null;
    }
}
