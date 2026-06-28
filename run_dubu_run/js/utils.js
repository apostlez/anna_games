/**
 * utils.js — Constants, helpers, collision detection, color palette
 * 달려라 두부 (Run Dubu Run!)
 */

// ─── Game Constants ───────────────────────────────────────────
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

export const GRAVITY = 0.6;
export const JUMP_FORCE = -11;
export const FLY_FORCE = -7;
export const MAX_FALL_SPEED = 14;
export const GROUND_Y = 380; // Ground line Y position

export const BASE_SCROLL_SPEED = 3.5;
export const MAX_SCROLL_SPEED = 8;
export const SPEED_INCREASE_RATE = 0.0002; // per frame

export const PLAYER_START_X = 120;
export const PLAYER_START_Y = 250;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 36;

// Multi-tap fly detection
export const FLY_TAP_WINDOW = 300; // ms between taps to count as multi-tap
export const FLY_TAP_THRESHOLD = 2; // taps within window to trigger fly

// Obstacle spawn
export const MIN_OBSTACLE_SPACING = 200; // px minimum between obstacles
export const OBSTACLE_SPAWN_INTERVAL_MIN = 60; // frames
export const OBSTACLE_SPAWN_INTERVAL_MAX = 150;

// Big Animal constants
export const BIG_ANIMAL_WIDTH = 55;
export const BIG_ANIMAL_HEIGHT = 45;

// Checkpoint constants (checkpoint triggers every 500m of distance)
export const CHECKPOINT_DISTANCE_INTERVAL = 500; // In meters
export const CHECKPOINT_SAFE_DURATION = 180; // 3 seconds at 60fps

// Game clear distance (meters)
export const GAME_CLEAR_DISTANCE = 2000;

// Snack / Invincibility constants
export const SNACK_INVINCIBLE_DURATION = 180; // 3 seconds at 60fps

// ─── Color Palette ────────────────────────────────────────────
export const COLORS = {
    skyTop: '#C8B6FF',
    skyMid: '#BDE0FE',
    skyBottom: '#A8D8EA',
    cloud: '#FFF5E4',
    cloudShadow: '#F0E6D3',
    ground: '#95D5B2',
    groundDark: '#74C69D',
    hills: '#74C69D',
    hillsDark: '#52B788',
    hillsFar: '#B7E4C7',
    accent: '#FFB5C2',
    accentDark: '#FF8FA3',
    text: '#4A4453',
    textLight: '#8B7E99',
    white: '#FFFFFF',
    darkCloud: '#6B7B8D',
    darkCloudShadow: '#4A5568',
    rain: '#7FB3D3',
    lightning: '#FFF06B',
    lightningGlow: '#FFEA00',
    wind: '#D4E4F7',
    animalBrown: '#C4A882',
    animalDark: '#8B7355',
    danger: '#FF6B6B',
    particle: '#FFE5EC',
    starYellow: '#FFD93D',
    hamsterBody: '#F7A072',
    hamsterBodyDark: '#E58A5B',
    hamsterTummy: '#FFF8F0',
    hamsterEar: '#FFB5A7',
    snackSunflower: '#F4E409',
    snackCarrot: '#FF7F11',
    snackJelly: '#FF5C8A',
    invincibleGlow: '#FFF06B',
};


// ─── Helpers ──────────────────────────────────────────────────
/**
 * Random integer between min (inclusive) and max (inclusive)
 */
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Lerp (linear interpolation)
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * AABB collision detection
 * Each box: { x, y, width, height }
 */
export function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Get a shrunken hitbox (forgiving collision)
 */
export function getShrunkBox(box, padX = 6, padY = 6) {
    return {
        x: box.x + padX,
        y: box.y + padY,
        width: box.width - padX * 2,
        height: box.height - padY * 2,
    };
}

// ─── Canvas Drawing Helpers ───────────────────────────────────
/**
 * Draw a rounded rectangle
 */
export function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Draw a fluffy cloud shape
 */
export function drawCloudShape(ctx, x, y, w, h) {
    const r = h * 0.5;
    ctx.beginPath();
    // Bottom flat-ish
    ctx.moveTo(x, y + h * 0.7);
    ctx.quadraticCurveTo(x, y + h, x + w * 0.15, y + h);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.quadraticCurveTo(x + w, y + h, x + w, y + h * 0.7);
    // Right bump
    ctx.quadraticCurveTo(x + w + r * 0.2, y + h * 0.3, x + w * 0.75, y + h * 0.1);
    // Top bumps
    ctx.quadraticCurveTo(x + w * 0.65, y - h * 0.2, x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 0.35, y - h * 0.25, x + w * 0.25, y + h * 0.1);
    // Left bump
    ctx.quadraticCurveTo(x - r * 0.2, y + h * 0.3, x, y + h * 0.7);
    ctx.closePath();
}

/**
 * Ease out quad
 */
export function easeOutQuad(t) {
    return t * (2 - t);
}

/**
 * Ease in out quad
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
