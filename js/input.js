const keys = {};
const prevKeys = {};
const justPressedMap = {};

const GAME_KEYS = [
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'ShiftLeft', 'ShiftRight',
    'KeyJ', 'KeyK', 'KeyL',
    'KeyZ', 'KeyX', 'KeyC',
    'Enter', 'KeyR', 'Escape'
];

window.addEventListener('keydown', e => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    keys[e.code] = true;
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

export function updateInput() {
    for (const key of GAME_KEYS) {
        justPressedMap[key] = !!keys[key] && !prevKeys[key];
        prevKeys[key] = !!keys[key];
    }
}

export function isDown(code) {
    return !!keys[code];
}

export function justPressed(code) {
    return !!justPressedMap[code];
}

export function anyMovement() {
    return isDown('KeyW') || isDown('KeyA') || isDown('KeyS') || isDown('KeyD') ||
           isDown('ArrowUp') || isDown('ArrowLeft') || isDown('ArrowDown') || isDown('ArrowRight');
}

export function getMovementDir() {
    let dx = 0, dy = 0;
    if (isDown('KeyW') || isDown('ArrowUp')) dy = -1;
    if (isDown('KeyS') || isDown('ArrowDown')) dy = 1;
    if (isDown('KeyA') || isDown('ArrowLeft')) dx = -1;
    if (isDown('KeyD') || isDown('ArrowRight')) dx = 1;
    if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.SQRT2;
        dx *= inv;
        dy *= inv;
    }
    return { dx, dy };
}
