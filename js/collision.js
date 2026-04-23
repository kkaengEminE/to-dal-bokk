export function circleCircle(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = dx * dx + dy * dy;
    const rSum = r1 + r2;
    return dist <= rSum * rSum;
}

export function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

export function pointInCone(px, py, cx, cy, coneAngle, coneSpread, coneRange) {
    const dx = px - cx;
    const dy = py - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq > coneRange * coneRange) return false;
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle(angle - coneAngle));
    return diff <= coneSpread / 2;
}

export function circleInCone(cx, cy, cr, coneCx, coneCy, coneAngle, coneSpread, coneRange) {
    // Check if circle overlaps with cone by testing center + nearest point
    if (pointInCone(cx, cy, coneCx, coneCy, coneAngle, coneSpread, coneRange + cr)) {
        return true;
    }
    return false;
}

export function circleInArc(cx, cy, cr, arcCx, arcCy, arcRange, arcStartAngle, arcSweep) {
    const dx = cx - arcCx;
    const dy = cy - arcCy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > arcRange + cr) return false;
    const angle = Math.atan2(dy, dx);
    const diff = normalizeAngle(angle - arcStartAngle);
    // Check if angle is within sweep (sweep can be > PI)
    if (arcSweep >= Math.PI * 2) return true;
    const halfSweep = arcSweep / 2;
    return Math.abs(normalizeAngle(diff - halfSweep + Math.PI) + Math.PI - halfSweep) <= halfSweep
        || Math.abs(diff) <= halfSweep
        || Math.abs(normalizeAngle(diff - arcSweep)) <= 0.1;
}

export function circleInArcSimple(cx, cy, cr, arcCx, arcCy, arcRange, centerAngle, arcSweep) {
    const dx = cx - arcCx;
    const dy = cy - arcCy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > arcRange + cr) return false;
    if (arcSweep >= Math.PI * 2) return true;
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle(angle - centerAngle));
    return diff <= arcSweep / 2;
}

export function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= cr * cr;
}

export function pointInStar(px, py, starCx, starCy, outerR, innerR) {
    const vertices = getStarVertices(starCx, starCy, outerR, innerR);
    return pointInPolygon(px, py, vertices);
}

export function getStarVertices(cx, cy, outerR, innerR) {
    const points = [];
    const step = Math.PI / 5;
    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * step;
        const r = i % 2 === 0 ? outerR : innerR;
        points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    return points;
}

function pointInPolygon(px, py, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        if ((yi > py) !== (yj > py) &&
            px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}
