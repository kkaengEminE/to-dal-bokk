import {
    MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, WALL_THICKNESS,
    COLOR_GRASS, COLOR_GRASS_ALT, COLOR_WALL, COLOR_WALL_DARK,
    COLOR_DOOR_CLOSED, COLOR_DOOR_OPEN, COLOR_STAR, STAR_RADIUS
} from './constants.js';
import { getStarVertices } from './collision.js';

export class GameMap {
    constructor() {
        this.width = MAP_WIDTH;
        this.height = MAP_HEIGHT;
        this.doorOpen = false;
        this.showStar = false;
        this.starPulse = 0;
        this.doorX = MAP_WIDTH / 2 - 30;
        this.doorY = 0;
        this.doorW = 60;
        this.doorH = WALL_THICKNESS;
        this.starCx = MAP_WIDTH / 2;
        this.starCy = MAP_HEIGHT / 2;
    }

    isInBounds(x, y, radius) {
        return x - radius >= WALL_THICKNESS &&
               x + radius <= this.width - WALL_THICKNESS &&
               y - radius >= WALL_THICKNESS &&
               y + radius <= this.height - WALL_THICKNESS;
    }

    clampToBounds(x, y, radius) {
        return {
            x: Math.max(WALL_THICKNESS + radius, Math.min(x, this.width - WALL_THICKNESS - radius)),
            y: Math.max(WALL_THICKNESS + radius, Math.min(y, this.height - WALL_THICKNESS - radius))
        };
    }

    isAtDoor(x, y, radius) {
        return this.doorOpen &&
               x > this.doorX && x < this.doorX + this.doorW &&
               y - radius <= this.doorY + this.doorH;
    }

    draw(ctx, time) {
        // Ground tiles
        for (let ty = 0; ty < this.height; ty += TILE_SIZE) {
            for (let tx = 0; tx < this.width; tx += TILE_SIZE) {
                const alt = ((tx / TILE_SIZE) + (ty / TILE_SIZE)) % 2 === 0;
                ctx.fillStyle = alt ? COLOR_GRASS : COLOR_GRASS_ALT;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            }
        }

        // Walls
        ctx.fillStyle = COLOR_WALL;
        // Top wall (with door gap)
        ctx.fillRect(0, 0, this.doorX, WALL_THICKNESS);
        ctx.fillRect(this.doorX + this.doorW, 0, this.width - this.doorX - this.doorW, WALL_THICKNESS);
        // Bottom wall
        ctx.fillRect(0, this.height - WALL_THICKNESS, this.width, WALL_THICKNESS);
        // Left wall
        ctx.fillRect(0, 0, WALL_THICKNESS, this.height);
        // Right wall
        ctx.fillRect(this.width - WALL_THICKNESS, 0, WALL_THICKNESS, this.height);

        // Wall outlines
        ctx.strokeStyle = COLOR_WALL_DARK;
        ctx.lineWidth = 2;
        ctx.strokeRect(WALL_THICKNESS, WALL_THICKNESS,
            this.width - WALL_THICKNESS * 2, this.height - WALL_THICKNESS * 2);

        // Door
        if (this.doorOpen) {
            ctx.fillStyle = COLOR_DOOR_OPEN;
            ctx.fillRect(this.doorX, this.doorY, this.doorW, this.doorH);
            // Glow effect
            const glow = 0.3 + Math.sin(time * 3) * 0.2;
            ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
            ctx.fillRect(this.doorX - 5, this.doorY, this.doorW + 10, this.doorH + 10);
        } else {
            ctx.fillStyle = COLOR_DOOR_CLOSED;
            ctx.fillRect(this.doorX, this.doorY, this.doorW, this.doorH);
            // X pattern
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.doorX + 5, this.doorY + 5);
            ctx.lineTo(this.doorX + this.doorW - 5, this.doorY + this.doorH - 5);
            ctx.moveTo(this.doorX + this.doorW - 5, this.doorY + 5);
            ctx.lineTo(this.doorX + 5, this.doorY + this.doorH - 5);
            ctx.stroke();
        }

        // Star safe zone
        if (this.showStar) {
            this.starPulse += 0.05;
            const pulse = 0.5 + Math.sin(this.starPulse) * 0.3;
            const vertices = getStarVertices(this.starCx, this.starCy, STAR_RADIUS, STAR_RADIUS * 0.4);

            // Fill
            ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();

            // Outline
            ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}
