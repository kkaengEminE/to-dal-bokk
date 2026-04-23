import {
    DRAGON_RADIUS, DRAGON_BASE_HP, DRAGON_SPEED, DRAGON_SPAWN_X, DRAGON_SPAWN_Y,
    DRAGON_IDLE_TIME_MIN, DRAGON_IDLE_TIME_MAX,
    FIRE_BREATH_TELEGRAPH, FIRE_BREATH_ACTIVE, FIRE_BREATH_RECOVERY,
    FIRE_BREATH_RANGE, FIRE_BREATH_SPREAD, FIRE_BREATH_TRACK_SPEED,
    TAIL_SWIPE_TELEGRAPH, TAIL_SWIPE_ACTIVE, TAIL_SWIPE_RECOVERY,
    TAIL_SWIPE_RANGE, TAIL_SWIPE_ARC,
    WING_GUST_TELEGRAPH, WING_GUST_ACTIVE, WING_GUST_RECOVERY,
    WING_GUST_RANGE, WING_GUST_SPREAD, WING_GUST_PUSH_SPEED,
    attackConfig,
    SPECIAL_HP_THRESHOLD, SPECIAL_STAR_GROW_TIME, SPECIAL_RISE_TIME,
    SPECIAL_HOVER_TIME, SPECIAL_FIRE_DURATION, SPECIAL_CRASH_DELAY,
    SPECIAL_CRASH_RADIUS, SPECIAL_STUN_TIME, STAR_RADIUS,
    MAP_WIDTH, MAP_HEIGHT, WALL_THICKNESS,
    DS_IDLE, DS_CHASING, DS_FIRE_BREATH, DS_TAIL_SWIPE, DS_WING_GUST,
    DS_SPECIAL_SETUP, DS_SPECIAL_RISING, DS_SPECIAL_HOVERING,
    DS_SPECIAL_FIRE, DS_SPECIAL_CRASH, DS_STUNNED, DS_DEAD,
    AP_WINDUP, AP_ACTIVE, AP_RECOVERY
} from './constants.js';
import { distance, angleBetween, normalizeAngle, circleInCone, circleInArcSimple, circleCircle } from './collision.js';
import { emitParticles } from './particles.js';

export class Dragon {
    constructor(maxHp = DRAGON_BASE_HP, speedMult = 1) {
        this.x = DRAGON_SPAWN_X;
        this.y = DRAGON_SPAWN_Y;
        this.facing = Math.PI; // face left initially
        this.radius = DRAGON_RADIUS;

        this.maxHp = maxHp;
        this.hp = maxHp;
        this.speed = DRAGON_SPEED * speedMult;

        this.state = DS_IDLE;
        this.stateTimer = 0;
        this.idleTimer = this._randomIdleTime();

        this.attackPhase = null;
        this.attackTimer = 0;
        this.attackDuration = 0;
        this.attackHitRegistered = false;

        this.specialPhaseUsed = false;
        this.specialTimer = 0;
        this.scale = 1;
        this.invincible = false;

        this.hitFlashTimer = 0;
    }

    reset(maxHp, speedMult = 1) {
        this.x = DRAGON_SPAWN_X;
        this.y = DRAGON_SPAWN_Y;
        this.facing = Math.PI;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.speed = DRAGON_SPEED * speedMult;
        this.state = DS_IDLE;
        this.stateTimer = 0;
        this.idleTimer = this._randomIdleTime();
        this.attackPhase = null;
        this.specialPhaseUsed = false;
        this.specialTimer = 0;
        this.scale = 1;
        this.invincible = false;
        this.hitFlashTimer = 0;
    }

    _randomIdleTime() {
        return DRAGON_IDLE_TIME_MIN + Math.random() * (DRAGON_IDLE_TIME_MAX - DRAGON_IDLE_TIME_MIN);
    }

    update(dt, player) {
        this.stateTimer += dt;
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        if (this.state === DS_DEAD) return;

        // Check special phase trigger
        if (!this.specialPhaseUsed && this.hp > 0 &&
            this.hp / this.maxHp <= SPECIAL_HP_THRESHOLD &&
            this.state !== DS_SPECIAL_SETUP && this.state !== DS_SPECIAL_RISING &&
            this.state !== DS_SPECIAL_HOVERING && this.state !== DS_SPECIAL_FIRE &&
            this.state !== DS_SPECIAL_CRASH && this.state !== DS_STUNNED) {
            this._enterSpecialPhase();
            return;
        }

        switch (this.state) {
            case DS_IDLE:
                this._updateIdle(dt, player);
                break;
            case DS_CHASING:
                this._updateChasing(dt, player);
                break;
            case DS_FIRE_BREATH:
                this._updateFireBreath(dt, player);
                break;
            case DS_TAIL_SWIPE:
                this._updateTailSwipe(dt, player);
                break;
            case DS_WING_GUST:
                this._updateWingGust(dt, player);
                break;
            case DS_SPECIAL_SETUP:
                this._updateSpecialSetup(dt);
                break;
            case DS_SPECIAL_RISING:
                this._updateSpecialRising(dt);
                break;
            case DS_SPECIAL_HOVERING:
                this._updateSpecialHovering(dt);
                break;
            case DS_SPECIAL_FIRE:
                this._updateSpecialFire(dt);
                break;
            case DS_SPECIAL_CRASH:
                this._updateSpecialCrash(dt);
                break;
            case DS_STUNNED:
                this._updateStunned(dt);
                break;
        }

        // Clamp to bounds (not during special aerial states)
        if (this.state !== DS_SPECIAL_RISING && this.state !== DS_SPECIAL_HOVERING &&
            this.state !== DS_SPECIAL_FIRE) {
            this.x = Math.max(WALL_THICKNESS + this.radius,
                Math.min(this.x, MAP_WIDTH - WALL_THICKNESS - this.radius));
            this.y = Math.max(WALL_THICKNESS + this.radius,
                Math.min(this.y, MAP_HEIGHT - WALL_THICKNESS - this.radius));
        }
    }

    _facePlayer(player, dt, speed = 3) {
        const targetAngle = angleBetween(this.x, this.y, player.x, player.y);
        const diff = normalizeAngle(targetAngle - this.facing);
        this.facing += diff * Math.min(1, speed * dt);
    }

    _updateIdle(dt, player) {
        this._facePlayer(player, dt);
        this.idleTimer -= dt;

        if (this.idleTimer <= 0) {
            const dist = distance(this.x, this.y, player.x, player.y);

            if (dist >= 200) {
                this._setState(DS_CHASING);
                return;
            }

            // Choose attack based on distance
            const r = Math.random();
            if (dist < 80) {
                if (r < 0.4) this._startAttack(DS_TAIL_SWIPE);
                else if (r < 0.7) this._startAttack(DS_FIRE_BREATH);
                else this._startAttack(DS_WING_GUST);
            } else {
                if (r < 0.5) this._startAttack(DS_FIRE_BREATH);
                else if (r < 0.75) this._startAttack(DS_TAIL_SWIPE);
                else this._startAttack(DS_WING_GUST);
            }
        }
    }

    _updateChasing(dt, player) {
        this._facePlayer(player, dt, 5);
        const dist = distance(this.x, this.y, player.x, player.y);

        // Move toward player
        this.x += Math.cos(this.facing) * this.speed * dt;
        this.y += Math.sin(this.facing) * this.speed * dt;

        if (dist < 150) {
            this._setState(DS_IDLE);
            this.idleTimer = 0.3; // Quick transition to attack
        } else if (this.stateTimer > 3) {
            // Chase too long, use fire breath
            this._startAttack(DS_FIRE_BREATH);
        }
    }

    _startAttack(attackState) {
        this._setState(attackState);
        this.attackPhase = AP_WINDUP;
        this.attackTimer = 0;
        this.attackHitRegistered = false;

        switch (attackState) {
            case DS_FIRE_BREATH:
                this.attackDuration = FIRE_BREATH_TELEGRAPH;
                break;
            case DS_TAIL_SWIPE:
                this.attackDuration = TAIL_SWIPE_TELEGRAPH;
                break;
            case DS_WING_GUST:
                this.attackDuration = WING_GUST_TELEGRAPH;
                break;
        }
    }

    _advanceAttackPhase(activeTime, recoveryTime) {
        this.attackTimer = 0;
        this.attackHitRegistered = false;
        if (this.attackPhase === AP_WINDUP) {
            this.attackPhase = AP_ACTIVE;
            this.attackDuration = activeTime;
        } else if (this.attackPhase === AP_ACTIVE) {
            this.attackPhase = AP_RECOVERY;
            this.attackDuration = recoveryTime;
        } else {
            this._setState(DS_IDLE);
            this.idleTimer = this._randomIdleTime();
            this.attackPhase = null;
        }
    }

    _updateFireBreath(dt, player) {
        this.attackTimer += dt;

        if (this.attackPhase === AP_WINDUP) {
            this._facePlayer(player, dt, 4);
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(FIRE_BREATH_ACTIVE, FIRE_BREATH_RECOVERY);
            }
        } else if (this.attackPhase === AP_ACTIVE) {
            // Slow tracking
            this._facePlayer(player, dt, FIRE_BREATH_TRACK_SPEED);
            // Emit fire particles
            const headDist = DRAGON_RADIUS + 12;
            const fx = this.x + Math.cos(this.facing) * headDist;
            const fy = this.y + Math.sin(this.facing) * headDist;
            emitParticles('fire', fx, fy, this.facing, 3);

            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, FIRE_BREATH_RECOVERY);
            }
        } else if (this.attackPhase === AP_RECOVERY) {
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, 0);
            }
        }
    }

    _updateTailSwipe(dt, player) {
        this.attackTimer += dt;

        if (this.attackPhase === AP_WINDUP) {
            this._facePlayer(player, dt, 2);
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(TAIL_SWIPE_ACTIVE, TAIL_SWIPE_RECOVERY);
            }
        } else if (this.attackPhase === AP_ACTIVE) {
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, TAIL_SWIPE_RECOVERY);
            }
        } else if (this.attackPhase === AP_RECOVERY) {
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, 0);
            }
        }
    }

    _updateWingGust(dt, player) {
        this.attackTimer += dt;

        if (this.attackPhase === AP_WINDUP) {
            this._facePlayer(player, dt, 3);
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(WING_GUST_ACTIVE, WING_GUST_RECOVERY);
            }
        } else if (this.attackPhase === AP_ACTIVE) {
            // Emit wind particles from both wings
            const perpAngle = this.facing + Math.PI / 2;
            const wingDist = DRAGON_RADIUS * 0.7;
            const lx = this.x + Math.cos(perpAngle) * wingDist;
            const ly = this.y + Math.sin(perpAngle) * wingDist;
            emitParticles('wind', lx, ly, this.facing, 2);
            const rx = this.x - Math.cos(perpAngle) * wingDist;
            const ry = this.y - Math.sin(perpAngle) * wingDist;
            emitParticles('wind', rx, ry, this.facing, 2);
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, WING_GUST_RECOVERY);
            }
        } else if (this.attackPhase === AP_RECOVERY) {
            if (this.attackTimer >= this.attackDuration) {
                this._advanceAttackPhase(0, 0);
            }
        }
    }

    // ===== SPECIAL PHASE =====
    _enterSpecialPhase() {
        this.specialPhaseUsed = true;
        this.invincible = true;
        this.specialTimer = 0;
        this._setState(DS_SPECIAL_SETUP);
        this.attackPhase = null;
    }

    _updateSpecialSetup(dt) {
        this.specialTimer += dt;
        // Move toward map center
        const cx = MAP_WIDTH / 2;
        const cy = MAP_HEIGHT / 2 - 100;
        const dist = distance(this.x, this.y, cx, cy);
        if (dist > 5) {
            const a = angleBetween(this.x, this.y, cx, cy);
            this.x += Math.cos(a) * 200 * dt;
            this.y += Math.sin(a) * 200 * dt;
        }
        if (this.specialTimer >= SPECIAL_STAR_GROW_TIME) {
            this._setState(DS_SPECIAL_RISING);
            this.specialTimer = 0;
        }
    }

    _updateSpecialRising(dt) {
        this.specialTimer += dt;
        // Scale down to simulate rising
        this.scale = 1 - (this.specialTimer / SPECIAL_RISE_TIME) * 0.5;
        if (this.specialTimer >= SPECIAL_RISE_TIME) {
            this.scale = 0.5;
            this._setState(DS_SPECIAL_HOVERING);
            this.specialTimer = 0;
        }
    }

    _updateSpecialHovering(dt) {
        this.specialTimer += dt;
        // Bob animation
        this.y = MAP_HEIGHT / 2 - 100 + Math.sin(this.specialTimer * 3) * 5;
        // Emit fire particles around map edges
        if (Math.random() < 0.3) {
            const side = Math.floor(Math.random() * 4);
            let fx, fy;
            if (side === 0) { fx = Math.random() * MAP_WIDTH; fy = WALL_THICKNESS; }
            else if (side === 1) { fx = Math.random() * MAP_WIDTH; fy = MAP_HEIGHT - WALL_THICKNESS; }
            else if (side === 2) { fx = WALL_THICKNESS; fy = Math.random() * MAP_HEIGHT; }
            else { fx = MAP_WIDTH - WALL_THICKNESS; fy = Math.random() * MAP_HEIGHT; }
            emitParticles('fire_ground', fx, fy, 0, 2);
        }

        if (this.specialTimer >= SPECIAL_HOVER_TIME) {
            this._setState(DS_SPECIAL_FIRE);
            this.specialTimer = 0;
        }
    }

    _updateSpecialFire(dt) {
        this.specialTimer += dt;
        // Emit lots of fire
        for (let i = 0; i < 5; i++) {
            const fx = WALL_THICKNESS + Math.random() * (MAP_WIDTH - WALL_THICKNESS * 2);
            const fy = WALL_THICKNESS + Math.random() * (MAP_HEIGHT - WALL_THICKNESS * 2);
            emitParticles('fire_ground', fx, fy, 0, 1);
        }

        if (this.specialTimer >= SPECIAL_FIRE_DURATION) {
            this._setState(DS_SPECIAL_CRASH);
            this.specialTimer = 0;
            this.x = MAP_WIDTH / 2;
            this.y = MAP_HEIGHT / 2;
        }
    }

    _updateSpecialCrash(dt) {
        this.specialTimer += dt;
        const waitTime = 2.0;     // wait in sky after fire ends
        const descendTime = 0.5;  // descend duration

        if (this.specialTimer < waitTime) {
            // Phase 1: hovering in sky, fire gone
            this.scale = 0.5;
        } else if (this.specialTimer < waitTime + descendTime) {
            // Phase 2: descending
            const t = (this.specialTimer - waitTime) / descendTime;
            this.scale = 0.5 + t * 0.5;
        } else {
            // Landed
            this.scale = 1;
            this.x = MAP_WIDTH / 2;
            this.y = MAP_HEIGHT / 2;
            this.invincible = false;
            this._setState(DS_IDLE);
            this.idleTimer = 2.0; // 2s before resuming attacks
        }
    }

    _updateStunned(dt) {
        if (this.stateTimer >= SPECIAL_STUN_TIME) {
            this._setState(DS_IDLE);
            this.idleTimer = this._randomIdleTime();
        }
    }

    _setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }

    takeDamage(amount) {
        if (this.invincible || this.state === DS_DEAD) return false;

        this.hp -= amount;
        this.hitFlashTimer = 0.15;
        emitParticles('hit', this.x, this.y, 0, 10);

        if (this.hp <= 0) {
            this.hp = 0;
            this._setState(DS_DEAD);
            emitParticles('fire_ground', this.x, this.y, 0, 30);
            return true; // died
        }
        return false;
    }

    // ===== COLLISION CHECKS =====
    isAttackActive() {
        return this.attackPhase === AP_ACTIVE && !this.attackHitRegistered;
    }

    checkFireBreathHit(player) {
        if (this.state !== DS_FIRE_BREATH || this.attackPhase !== AP_ACTIVE) return false;
        if (this.attackHitRegistered) return false;

        const headDist = DRAGON_RADIUS + 12;
        const fx = this.x + Math.cos(this.facing) * headDist;
        const fy = this.y + Math.sin(this.facing) * headDist;

        if (circleInCone(player.x, player.y, player.radius, fx, fy, this.facing, attackConfig.fireBreathSpread, attackConfig.fireBreathRange)) {
            this.attackHitRegistered = true;
            return true;
        }
        return false;
    }

    checkTailSwipeHit(player) {
        if (this.state !== DS_TAIL_SWIPE || this.attackPhase !== AP_ACTIVE) return false;
        if (this.attackHitRegistered) return false;

        const tailAngle = this.facing + Math.PI;
        if (circleInArcSimple(player.x, player.y, player.radius, this.x, this.y, attackConfig.tailSwipeRange, tailAngle, attackConfig.tailSwipeArc)) {
            this.attackHitRegistered = true;
            return true;
        }
        return false;
    }

    checkWingGustHit(player) {
        if (this.state !== DS_WING_GUST || this.attackPhase !== AP_ACTIVE) return false;

        if (circleInCone(player.x, player.y, player.radius, this.x, this.y, this.facing, attackConfig.wingGustSpread, attackConfig.wingGustRange)) {
            return true; // pushback, called every frame
        }
        return false;
    }

    checkCrashHit(player) {
        if (this.state !== DS_SPECIAL_CRASH) return false;
        if (this.attackHitRegistered) return false;
        if (this.specialTimer < 2.0) return false; // hit check when descending starts

        if (circleCircle(player.x, player.y, player.radius, MAP_WIDTH / 2, MAP_HEIGHT / 2, SPECIAL_CRASH_RADIUS)) {
            this.attackHitRegistered = true;
            return true;
        }
        return false;
    }

    isInSpecialPhase() {
        return this.state === DS_SPECIAL_SETUP || this.state === DS_SPECIAL_RISING ||
               this.state === DS_SPECIAL_HOVERING || this.state === DS_SPECIAL_FIRE ||
               this.state === DS_SPECIAL_CRASH;
    }

    isFireActive() {
        return this.state === DS_SPECIAL_FIRE;
    }

    getFireOverlayIntensity() {
        if (this.state === DS_SPECIAL_FIRE) {
            return Math.min(1, this.specialTimer / 0.5);
        }
        // Fade out during early crash phase
        if (this.state === DS_SPECIAL_CRASH && this.specialTimer < 0.5) {
            return 1 - this.specialTimer / 0.5;
        }
        return 0;
    }

    getSpecialHoverTimeLeft() {
        if (this.state === DS_SPECIAL_HOVERING) {
            return SPECIAL_HOVER_TIME - this.specialTimer;
        }
        return -1;
    }
}
