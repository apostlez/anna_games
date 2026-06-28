/**
 * input.js — Unified input handler (touch, click, keyboard)
 * 달려라 두부 (Run Dubu Run!)
 */

import { FLY_TAP_WINDOW, FLY_TAP_THRESHOLD, CANVAS_WIDTH, CANVAS_HEIGHT } from './utils.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.actionPressed = false;   // true on the frame action was triggered
        this.actionHeld = false;      // true while held
        this.tapTimestamps = [];      // for multi-tap fly detection
        this.isFlying = false;        // multi-tap fly state
        this.lastTapX = CANVAS_WIDTH / 2;  // canvas coords of last tap
        this.lastTapY = CANVAS_HEIGHT / 2;

        this._bindEvents();
    }

    _bindEvents() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const { x, y } = this._getCanvasCoords(touch.clientX, touch.clientY);
            this._onAction(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.actionHeld = false;
        }, { passive: false });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const { x, y } = this._getCanvasCoords(e.clientX, e.clientY);
            this._onAction(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.actionHeld = false;
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!e.repeat) {
                    this._onAction(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                this.actionHeld = false;
            }
        });

        // Prevent default touch behaviors (scroll, zoom)
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    _getCanvasCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }

    _onAction(canvasX = CANVAS_WIDTH / 2, canvasY = CANVAS_HEIGHT / 2) {
        this.lastTapX = canvasX;
        this.lastTapY = canvasY;
        this.actionPressed = true;
        this.actionHeld = true;

        // Multi-tap detection for flying
        const now = performance.now();
        this.tapTimestamps.push(now);

        // Remove old taps outside the window
        this.tapTimestamps = this.tapTimestamps.filter(
            t => now - t < FLY_TAP_WINDOW
        );

        // Check if we have enough rapid taps
        this.isFlying = this.tapTimestamps.length >= FLY_TAP_THRESHOLD;
    }

    /**
     * Peek at the pending action without consuming it
     */
    peekAction() {
        return { pressed: this.actionPressed, x: this.lastTapX, y: this.lastTapY };
    }

    /**
     * Get the canvas coordinates of the last tap (non-consuming)
     */
    getLastTap() {
        return { x: this.lastTapX, y: this.lastTapY };
    }

    /**
     * Call at end of each frame to reset per-frame flags
     */
    consumeAction() {
        const wasPressed = this.actionPressed;
        this.actionPressed = false;
        return wasPressed;
    }

    /**
     * Check if fly mode is active (rapid multi-tap)
     */
    checkFlying() {
        const now = performance.now();
        this.tapTimestamps = this.tapTimestamps.filter(
            t => now - t < FLY_TAP_WINDOW
        );
        this.isFlying = this.tapTimestamps.length >= FLY_TAP_THRESHOLD;
        return this.isFlying;
    }

    /**
     * Reset all input state
     */
    reset() {
        this.actionPressed = false;
        this.actionHeld = false;
        this.tapTimestamps = [];
        this.isFlying = false;
        this.lastTapX = CANVAS_WIDTH / 2;
        this.lastTapY = CANVAS_HEIGHT / 2;
    }
}
