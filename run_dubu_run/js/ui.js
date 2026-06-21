/**
 * ui.js — Start screen, HUD, game-over screen (all drawn on canvas)
 * 달려라 두부 (Run Dubu Run!)
 */

import {
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS,
    drawRoundedRect, easeOutQuad, easeInOutQuad
} from './utils.js';

export class UI {
    constructor(ctx) {
        this.ctx = ctx;
        this.animTimer = 0;
        this.fadeAlpha = 0;
        this.fadeTarget = 0;

        // High score from localStorage
        this.highScore = this._loadHighScore();

        // Menu animation
        this.titleBounce = 0;
        this.promptAlpha = 0;
        this.starsAnim = [];

        // Game over animation
        this.gameOverSlide = 0;
        this.showRetry = false;

        // Checkpoint banner state
        this.checkpointBannerTimer = 0;
        this.checkpointMilestone = 0;

        // Init decorative stars
        for (let i = 0; i < 15; i++) {
            this.starsAnim.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT * 0.6,
                size: 1 + Math.random() * 2.5,
                speed: 0.3 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
            });
        }
    }

    update() {
        this.animTimer++;

        // Fade transition
        if (this.fadeAlpha < this.fadeTarget) {
            this.fadeAlpha = Math.min(this.fadeAlpha + 0.03, this.fadeTarget);
        } else if (this.fadeAlpha > this.fadeTarget) {
            this.fadeAlpha = Math.max(this.fadeAlpha - 0.05, this.fadeTarget);
        }

        // Stars animation
        for (const star of this.starsAnim) {
            star.twinkle += 0.03;
        }

        // Checkpoint banner timer update
        if (this.checkpointBannerTimer > 0) {
            this.checkpointBannerTimer--;
        }
    }

    // ─── Start Screen ─────────────────────────────────────────
    drawStartScreen() {
        const ctx = this.ctx;
        this.titleBounce = Math.sin(this.animTimer * 0.04) * 8;
        this.promptAlpha = 0.5 + Math.sin(this.animTimer * 0.06) * 0.4;

        // Decorative stars
        for (const star of this.starsAnim) {
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.starYellow;
            ctx.translate(star.x, star.y);
            ctx.rotate(star.twinkle * 0.5);
            this._drawStar(ctx, 0, 0, star.size);
            ctx.restore();
        }

        // Title card background
        const cardW = 400;
        const cardH = 200;
        const cardX = CANVAS_WIDTH / 2 - cardW / 2;
        const cardY = 80 + this.titleBounce;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.restore();

        // Card border
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.stroke();

        // Title text
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 32px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('달려라 두부', CANVAS_WIDTH / 2, cardY + 48);

        // English title
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 16px "Quicksand", sans-serif';
        ctx.fillText('Run Dubu Run!', CANVAS_WIDTH / 2, cardY + 75);

        // Subtitle — Korean story
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '12px "Quicksand", sans-serif';
        ctx.fillText('허리케인으로 날아간 햄스터 두부, 집으로 돌아가는 모험!', CANVAS_WIDTH / 2, cardY + 100);

        // Decorative line
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 60, cardY + 120);
        ctx.lineTo(cardX + cardW - 60, cardY + 120);
        ctx.stroke();

        // High score
        if (this.highScore > 0) {
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '12px "Quicksand", sans-serif';
            ctx.fillText(`Best: ${this.highScore}m`, CANVAS_WIDTH / 2, cardY + 145);
        }

        // Controls hint
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '12px "Quicksand", sans-serif';
        ctx.fillText('탭 = 점프  |  연속탭 = 날기', CANVAS_WIDTH / 2, cardY + 170);

        // "Tap to Start" prompt
        ctx.save();
        ctx.globalAlpha = this.promptAlpha;
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 18px "Quicksand", sans-serif';
        ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 65);
        ctx.restore();

        // Bouncing arrow
        const arrowBounce = Math.sin(this.animTimer * 0.08) * 5;
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - 8, CANVAS_HEIGHT - 45 + arrowBounce);
        ctx.lineTo(CANVAS_WIDTH / 2 + 8, CANVAS_HEIGHT - 45 + arrowBounce);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38 + arrowBounce);
        ctx.closePath();
        ctx.fill();
    }

    // ─── HUD ──────────────────────────────────────────────────
    drawHUD(distance, scrollSpeed) {
        const ctx = this.ctx;

        // Distance display — top right
        ctx.save();

        // Background pill
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        drawRoundedRect(ctx, CANVAS_WIDTH - 140, 12, 125, 30, 15);
        ctx.fill();

        // Distance text
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px "Quicksand", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${distance}m`, CANVAS_WIDTH - 25, 27);

        // Running icon
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🐹', CANVAS_WIDTH - 135, 27);

        ctx.restore();

        // Draw checkpoint banner if active
        this._drawCheckpointBanner();

        // High score indicator (if close to beating it)
        if (this.highScore > 0 && distance > this.highScore * 0.8 && distance < this.highScore) {
            const alpha = 0.3 + Math.sin(this.animTimer * 0.1) * 0.2;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = '11px "Quicksand", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`Best: ${this.highScore}m`, CANVAS_WIDTH - 25, 52);
            ctx.restore();
        }

        // New record indicator
        if (distance > this.highScore && this.highScore > 0) {
            const pulse = Math.sin(this.animTimer * 0.15) * 0.3 + 0.7;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = 'bold 11px "Quicksand", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('★ NEW RECORD!', CANVAS_WIDTH - 25, 52);
            ctx.restore();
        }
    }

    // ─── Game Over Screen ─────────────────────────────────────
    drawGameOverScreen(distance) {
        const ctx = this.ctx;

        // Update high score
        const isNewRecord = distance > this.highScore;
        if (isNewRecord) {
            this.highScore = distance;
            this._saveHighScore(distance);
        }

        // Animate slide in
        this.gameOverSlide = Math.min(this.gameOverSlide + 0.04, 1);
        const eased = easeOutQuad(this.gameOverSlide);

        // Dim overlay
        ctx.save();
        ctx.globalAlpha = 0.4 * eased;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        // Card
        const cardW = 320;
        const cardH = 220;
        const cardX = CANVAS_WIDTH / 2 - cardW / 2;
        const targetY = CANVAS_HEIGHT / 2 - cardH / 2;
        const cardY = targetY - 50 + eased * 50;

        ctx.save();
        ctx.globalAlpha = eased;

        // Card shadow
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = eased;

        // Card border
        ctx.strokeStyle = isNewRecord ? COLORS.starYellow : COLORS.accent;
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
        ctx.stroke();

        // Game Over text
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 26px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Game Over', CANVAS_WIDTH / 2, cardY + 40);

        // Divider
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 40, cardY + 65);
        ctx.lineTo(cardX + cardW - 40, cardY + 65);
        ctx.stroke();

        // Distance
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '13px "Quicksand", sans-serif';
        ctx.fillText('Distance', CANVAS_WIDTH / 2, cardY + 90);
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 28px "Quicksand", sans-serif';
        ctx.fillText(`${distance}m`, CANVAS_WIDTH / 2, cardY + 118);

        // New record badge
        if (isNewRecord) {
            const badgeAlpha = 0.7 + Math.sin(this.animTimer * 0.1) * 0.3;
            ctx.save();
            ctx.globalAlpha = badgeAlpha * eased;
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = 'bold 13px "Quicksand", sans-serif';
            ctx.fillText('⭐ NEW RECORD! ⭐', CANVAS_WIDTH / 2, cardY + 145);
            ctx.restore();
        } else {
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '12px "Quicksand", sans-serif';
            ctx.fillText(`Best: ${this.highScore}m`, CANVAS_WIDTH / 2, cardY + 145);
        }

        // Retry prompt
        if (this.gameOverSlide >= 0.8) {
            const retryAlpha = 0.5 + Math.sin(this.animTimer * 0.08) * 0.4;
            ctx.save();
            ctx.globalAlpha = retryAlpha;
            ctx.fillStyle = COLORS.accent;
            ctx.font = 'bold 15px "Quicksand", sans-serif';
            ctx.fillText('TAP TO RETRY', CANVAS_WIDTH / 2, cardY + 190);
            ctx.restore();
        }

        ctx.restore();
    }

    resetGameOver() {
        this.gameOverSlide = 0;
        this.showRetry = false;
    }

    showCheckpointBanner(milestone) {
        this.checkpointMilestone = milestone;
        this.checkpointBannerTimer = 180; // 3 seconds
    }

    _drawCheckpointBanner() {
        if (this.checkpointBannerTimer <= 0) return;

        const ctx = this.ctx;
        ctx.save();

        // Animation: slide-in/fade-in from top, stay, slide-up/fade-out
        let alpha = 1;
        let yOffset = 0;

        if (this.checkpointBannerTimer > 150) {
            const t = (180 - this.checkpointBannerTimer) / 30; // 0 to 1
            alpha = t;
            yOffset = -20 + t * 20;
        } else if (this.checkpointBannerTimer < 30) {
            const t = this.checkpointBannerTimer / 30; // 1 to 0
            alpha = t;
            yOffset = -20 + t * 20;
        }

        ctx.globalAlpha = alpha;

        const bannerW = 280;
        const bannerH = 45;
        const bannerX = CANVAS_WIDTH / 2 - bannerW / 2;
        const bannerY = 60 + yOffset;

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 12);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Border
        ctx.strokeStyle = COLORS.starYellow;
        ctx.lineWidth = 2.5;
        drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 12);
        ctx.stroke();

        // Icon & text
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🚩 쉼터 도달! (${this.checkpointMilestone}m)`, CANVAS_WIDTH / 2, bannerY + 23);

        ctx.restore();
    }

    // ─── Helpers ──────────────────────────────────────────────
    _drawStar(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](
                x + Math.cos(angle) * size,
                y + Math.sin(angle) * size
            );
        }
        ctx.closePath();
        ctx.fill();
    }

    _loadHighScore() {
        try {
            return parseInt(localStorage.getItem('jumpTofu_highScore')) || 0;
        } catch {
            return 0;
        }
    }

    _saveHighScore(score) {
        try {
            localStorage.setItem('jumpTofu_highScore', score.toString());
        } catch {
            // localStorage might not be available
        }
    }
}
