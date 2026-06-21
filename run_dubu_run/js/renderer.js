/**
 * renderer.js — Canvas rendering orchestration, screen shake, vignette
 * 달려라 두부 (Run Dubu Run!)
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './utils.js';

export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    /**
     * Trigger screen shake
     */
    shake(amount = 8) {
        this.shakeAmount = amount;
    }

    /**
     * Begin frame — clear and apply screen shake
     */
    beginFrame() {
        const ctx = this.ctx;

        // Update shake
        if (this.shakeAmount > 0.5) {
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            this.shakeAmount = 0;
        }

        ctx.save();
        ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

        // Clear
        ctx.clearRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);
    }

    /**
     * End frame — draw overlays and restore
     */
    endFrame() {
        const ctx = this.ctx;

        // Vignette effect
        this._drawVignette(ctx);

        ctx.restore();
    }

    _drawVignette(ctx) {
        const gradient = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
            CANVAS_WIDTH * 0.3,
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
            CANVAS_WIDTH * 0.75
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    /**
     * Draw distance meter indicator at the top
     */
    drawDistanceBar(distance) {
        const ctx = this.ctx;
        // Subtle distance indicator dots at bottom
        const progress = (distance % 1000) / 1000;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 10; i++) {
            const dotX = 30 + i * 25;
            const filled = i / 10 <= progress;
            ctx.beginPath();
            ctx.arc(dotX, CANVAS_HEIGHT - 15, 2.5, 0, Math.PI * 2);
            if (filled) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
            }
            ctx.fill();
        }
    }
}
