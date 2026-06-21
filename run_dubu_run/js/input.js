/**
 * input.js — Unified input handler (touch, click, keyboard)
 * 달려라 두부 (Run Dubu Run!)
 */

import { FLY_TAP_WINDOW, FLY_TAP_THRESHOLD } from './utils.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.actionPressed = false;   // true on the frame action was triggered
        this.actionHeld = false;      // true while held
        this.tapTimestamps = [];      // for multi-tap fly detection
        this.isFlying = false;        // multi-tap fly state

        this._bindEvents();
    }

    _bindEvents() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._onAction();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.actionHeld = false;
        }, { passive: false });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._onAction();
        });

        this.canvas.addEventListener('mouseup', () => {
            this.actionHeld = false;
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!e.repeat) {
                    this._onAction();
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

    _onAction() {
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
    }
}
