import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, CAMERA_LERP, CAMERA_SHAKE_DECAY } from './constants.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    update(targetX, targetY, dt) {
        const viewW = CANVAS_WIDTH / this.zoom;
        const viewH = CANVAS_HEIGHT / this.zoom;

        const goalX = targetX - viewW / 2;
        const goalY = targetY - viewH / 2;

        this.x += (goalX - this.x) * CAMERA_LERP;
        this.y += (goalY - this.y) * CAMERA_LERP;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, MAP_WIDTH - viewW));
        this.y = Math.max(0, Math.min(this.y, MAP_HEIGHT - viewH));

        // Zoom lerp
        this.zoom += (this.targetZoom - this.zoom) * 0.05;

        // Shake
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= CAMERA_SHAKE_DECAY;
        }
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    applyTransform(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);
    }

    restoreTransform(ctx) {
        ctx.restore();
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x + this.shakeOffsetX) * this.zoom,
            y: (wy - this.y + this.shakeOffsetY) * this.zoom
        };
    }

    isVisible(wx, wy, margin = 100) {
        const viewW = CANVAS_WIDTH / this.zoom;
        const viewH = CANVAS_HEIGHT / this.zoom;
        return wx > this.x - margin && wx < this.x + viewW + margin &&
               wy > this.y - margin && wy < this.y + viewH + margin;
    }
}
