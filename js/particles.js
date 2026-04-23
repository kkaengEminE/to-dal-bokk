import { MAX_PARTICLES, COLOR_FIRE } from './constants.js';

const particles = [];

export function emitParticles(type, x, y, angle, count) {
    for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) {
            particles.shift();
        }
        const p = createParticle(type, x, y, angle);
        if (p) particles.push(p);
    }
}

function createParticle(type, x, y, angle) {
    const base = { x, y, life: 0, alpha: 1 };

    switch (type) {
        case 'fire': {
            const spread = (Math.random() - 0.5) * 1.3;
            const speed = 150 + Math.random() * 180;
            const a = angle + spread;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed - 15,
                maxLife: 0.4 + Math.random() * 0.5,
                radius: 3 + Math.random() * 5,
                color: COLOR_FIRE[Math.floor(Math.random() * COLOR_FIRE.length)],
                type: 'fire'
            };
        }
        case 'fire_ground': {
            return {
                ...base,
                vx: (Math.random() - 0.5) * 40,
                vy: -30 - Math.random() * 60,
                maxLife: 0.5 + Math.random() * 0.8,
                radius: 3 + Math.random() * 5,
                color: COLOR_FIRE[Math.floor(Math.random() * COLOR_FIRE.length)],
                type: 'fire'
            };
        }
        case 'wind': {
            const spread = (Math.random() - 0.5) * 1.4;
            const speed = 300 + Math.random() * 250;
            const a = angle + spread;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                maxLife: 0.3 + Math.random() * 0.5,
                radius: 2,
                length: 8,
                color: 'rgba(255,255,255,0.5)',
                type: 'wind'
            };
        }
        case 'slash': {
            const spread = (Math.random() - 0.5) * 0.3;
            const speed = 30 + Math.random() * 20;
            const a = angle + spread;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                maxLife: 0.15,
                radius: 3 + Math.random() * 2,
                color: '#ffffff',
                type: 'slash'
            };
        }
        case 'collect': {
            const a = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed - 30,
                maxLife: 0.5 + Math.random() * 0.3,
                radius: 2 + Math.random() * 3,
                color: '#ffd700',
                type: 'sparkle'
            };
        }
        case 'dust': {
            const a = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                maxLife: 0.3 + Math.random() * 0.2,
                radius: 2 + Math.random() * 2,
                color: '#a0845c',
                type: 'dust'
            };
        }
        case 'hit': {
            const a = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 60;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                maxLife: 0.3,
                radius: 2 + Math.random() * 3,
                color: '#ffffff',
                type: 'sparkle'
            };
        }
        case 'egg_burn': {
            const a = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            return {
                ...base,
                vx: Math.cos(a) * speed,
                vy: -40 - Math.random() * 40,
                maxLife: 0.6 + Math.random() * 0.4,
                radius: 3 + Math.random() * 4,
                color: COLOR_FIRE[Math.floor(Math.random() * COLOR_FIRE.length)],
                type: 'fire'
            };
        }
        default:
            return null;
    }
}

export function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
        }
    }
}

export function drawParticles(ctx) {
    for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        if (p.type === 'wind') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
            ctx.stroke();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

export function clearParticles() {
    particles.length = 0;
}
