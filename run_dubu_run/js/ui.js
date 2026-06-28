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

        // Game clear animation
        this.gameClearSlide = 0;

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
    drawStartScreen(difficulty = 'easy', sessionScores = []) {
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

        // ─── Difficulty selector ───────────────────────────────
        const dBtnY = 302;
        const dBtnH = 38;
        const easyX = CANVAS_WIDTH / 2 - 155;
        const hardX = CANVAS_WIDTH / 2 + 15;
        const dBtnW = 140;

        // Easy button
        ctx.save();
        if (difficulty === 'easy') {
            ctx.shadowColor = COLORS.accent;
            ctx.shadowBlur = 8;
            ctx.fillStyle = COLORS.accent;
        } else {
            ctx.fillStyle = 'rgba(180,180,180,0.55)';
        }
        drawRoundedRect(ctx, easyX, dBtnY, dBtnW, dBtnH, 10);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = difficulty === 'easy' ? '#fff' : COLORS.textLight;
        ctx.font = 'bold 14px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌟 쉬움', easyX + dBtnW / 2, dBtnY + dBtnH / 2);

        // Hard button
        ctx.save();
        if (difficulty === 'hard') {
            ctx.shadowColor = '#FF6B6B';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#FF6B6B';
        } else {
            ctx.fillStyle = 'rgba(180,180,180,0.55)';
        }
        drawRoundedRect(ctx, hardX, dBtnY, dBtnW, dBtnH, 10);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = difficulty === 'hard' ? '#fff' : COLORS.textLight;
        ctx.font = 'bold 14px "Quicksand", sans-serif';
        ctx.fillText('🔥 어려움', hardX + dBtnW / 2, dBtnY + dBtnH / 2);

        // Hard mode hint
        if (difficulty === 'hard') {
            ctx.fillStyle = 'rgba(200, 80, 80, 0.8)';
            ctx.font = '10px "Quicksand", sans-serif';
            ctx.fillText('물웅덩이 조심! 목표 4km', CANVAS_WIDTH / 2, dBtnY + dBtnH + 12);
        } else {
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '10px "Quicksand", sans-serif';
            ctx.fillText('목표 2km', CANVAS_WIDTH / 2, dBtnY + dBtnH + 12);
        }

        // Session best record (if exists)
        if (sessionScores.length > 0) {
            const best = sessionScores[0];
            const tag = best.difficulty === 'hard' ? '[🔥]' : '[🌟]';
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '11px "Quicksand", sans-serif';
            ctx.fillText(`이번 세션 최고: ${best.distance}m  ⭐${best.score}  ${tag}`, CANVAS_WIDTH / 2, dBtnY + dBtnH + 30);
        }
    }

    // ─── HUD ──────────────────────────────────────────────────
    drawHUD(distance, scrollSpeed, score = 0) {
        const ctx = this.ctx;

        // ─── Menu button (top-left, hamburger ≡) ────────────────
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        drawRoundedRect(ctx, 10, 10, 34, 34, 8);
        ctx.fill();
        ctx.fillStyle = COLORS.text;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = COLORS.text;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(17, 19 + i * 7);
            ctx.lineTo(37, 19 + i * 7);
            ctx.stroke();
        }
        ctx.restore();

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

        // Score pill — below distance
        if (score > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            drawRoundedRect(ctx, CANVAS_WIDTH - 140, 46, 125, 24, 12);
            ctx.fill();
            ctx.fillStyle = COLORS.textLight;
            ctx.font = 'bold 12px "Quicksand", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${score}pt`, CANVAS_WIDTH - 25, 58);
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('⭐', CANVAS_WIDTH - 135, 58);
            ctx.restore();
        }

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
    drawGameOverScreen(distance, score = 0, sessionScores = []) {
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
        const hasSession = sessionScores.length > 1;
        const cardW = 320;
        const cardH = hasSession ? Math.min(60 + sessionScores.length * 20 + 180, 320) : 220;
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
        ctx.fillText('Distance', CANVAS_WIDTH / 2, cardY + 88);
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 26px "Quicksand", sans-serif';
        ctx.fillText(`${distance}m`, CANVAS_WIDTH / 2, cardY + 114);

        // Score
        if (score > 0) {
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '11px "Quicksand", sans-serif';
            ctx.fillText('점수', CANVAS_WIDTH / 2 - 50, cardY + 135);
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = 'bold 13px "Quicksand", sans-serif';
            ctx.fillText(`⭐ ${score}pt`, CANVAS_WIDTH / 2 + 20, cardY + 135);
        }

        // Session scores section
        if (sessionScores.length > 1) {
            const listY = cardY + 152;
            ctx.strokeStyle = 'rgba(180,180,200,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + 30, listY - 4);
            ctx.lineTo(cardX + cardW - 30, listY - 4);
            ctx.stroke();

            ctx.fillStyle = COLORS.textLight;
            ctx.font = 'bold 10px "Quicksand", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('📋 이번 세션 기록', CANVAS_WIDTH / 2, listY + 8);

            const maxShow = Math.min(sessionScores.length, 4);
            for (let i = 0; i < maxShow; i++) {
                const s = sessionScores[i];
                const rowY = listY + 22 + i * 17;
                const tag = s.difficulty === 'hard' ? '🔥' : '🌟';
                const isMe = i === 0 && sessionScores[0].distance === distance && sessionScores[0].score === score;
                ctx.fillStyle = isMe ? COLORS.accent : COLORS.textLight;
                ctx.font = `${isMe ? 'bold ' : ''}10px "Quicksand", sans-serif`;
                ctx.fillText(`#${i + 1}  ${s.distance}m  ⭐${s.score}  ${tag}`, CANVAS_WIDTH / 2, rowY);
            }
        }

        const recordY = cardH - 68;

        // New record badge
        if (isNewRecord) {
            const badgeAlpha = 0.7 + Math.sin(this.animTimer * 0.1) * 0.3;
            ctx.save();
            ctx.globalAlpha = badgeAlpha * eased;
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = 'bold 13px "Quicksand", sans-serif';
            ctx.fillText('⭐ NEW RECORD! ⭐', CANVAS_WIDTH / 2, cardY + recordY);
            ctx.restore();
        } else {
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '12px "Quicksand", sans-serif';
            ctx.fillText(`Best: ${this.highScore}m`, CANVAS_WIDTH / 2, cardY + recordY);
        }

        // Retry prompt
        if (this.gameOverSlide >= 0.8) {
            const retryAlpha = 0.5 + Math.sin(this.animTimer * 0.08) * 0.4;
            ctx.save();
            ctx.globalAlpha = retryAlpha;
            ctx.fillStyle = COLORS.accent;
            ctx.font = 'bold 15px "Quicksand", sans-serif';
            ctx.fillText('TAP TO RETRY', CANVAS_WIDTH / 2, cardY + cardH - 25);
            ctx.restore();
        }

        ctx.restore();
    }

    resetGameOver() {
        this.gameOverSlide = 0;
        this.showRetry = false;
        this.gameClearSlide = 0;
    }

    // ─── Game Clear Screen ─────────────────────────────────────
    drawGameClearScreen(distance, score = 0) {
        const ctx = this.ctx;

        // Update high score
        if (distance > this.highScore) {
            this.highScore = distance;
            this._saveHighScore(distance);
        }

        // Animate slide in
        this.gameClearSlide = Math.min(this.gameClearSlide + 0.03, 1);
        const eased = easeOutQuad(this.gameClearSlide);

        // Celebratory overlay (warm glow)
        ctx.save();
        ctx.globalAlpha = 0.35 * eased;
        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        // Confetti
        const t = this.animTimer;
        const confettiColors = ['#FF6B8A', '#FFD93D', '#74C69D', '#B5C0FF', '#FF9EBB'];
        for (let i = 0; i < 20; i++) {
            const cx = (Math.sin(t * 0.04 + i * 1.3) * 0.5 + 0.5) * CANVAS_WIDTH;
            const cy = ((t * 0.6 + i * 22) % (CANVAS_HEIGHT + 20)) - 10;
            ctx.save();
            ctx.globalAlpha = 0.7 * eased;
            ctx.fillStyle = confettiColors[i % confettiColors.length];
            ctx.translate(cx, cy);
            ctx.rotate(t * 0.05 + i);
            ctx.fillRect(-4, -4, 8, 4);
            ctx.restore();
        }

        // Card
        const cardW = 340;
        const cardH = 230;
        const cardX = CANVAS_WIDTH / 2 - cardW / 2;
        const targetY = CANVAS_HEIGHT / 2 - cardH / 2 - 10;
        const cardY = targetY - 60 + eased * 60;

        ctx.save();
        ctx.globalAlpha = eased;
        ctx.shadowColor = 'rgba(196, 69, 105, 0.25)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 22);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = eased;

        // Card border (gold)
        const borderPulse = 0.7 + Math.sin(t * 0.1) * 0.3;
        ctx.strokeStyle = `rgba(255, 193, 7, ${borderPulse})`;
        ctx.lineWidth = 3.5;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 22);
        ctx.stroke();

        // 🎉 Title
        ctx.fillStyle = '#C44569';
        ctx.font = 'bold 30px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎉 게임 클리어! 🎉', CANVAS_WIDTH / 2, cardY + 42);

        // Subtitle
        ctx.fillStyle = '#7B2D8B';
        ctx.font = 'bold 14px "Quicksand", sans-serif';
        ctx.fillText('두부가 안나에게 돌아왔어요! 🐹🏠', CANVAS_WIDTH / 2, cardY + 72);

        // Divider
        ctx.strokeStyle = '#FFD93D';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 40, cardY + 92);
        ctx.lineTo(cardX + cardW - 40, cardY + 92);
        ctx.stroke();

        // Distance
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '13px "Quicksand", sans-serif';
        ctx.fillText('완주 거리', CANVAS_WIDTH / 2, cardY + 115);
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 28px "Quicksand", sans-serif';
        ctx.fillText(`${distance}m`, CANVAS_WIDTH / 2, cardY + 143);

        // Score
        if (score > 0) {
            ctx.fillStyle = COLORS.starYellow;
            ctx.font = 'bold 14px "Quicksand", sans-serif';
            ctx.fillText(`⭐ ${score}pt`, CANVAS_WIDTH / 2, cardY + 165);
        }

        // Stars row
        const starPulse = 0.8 + Math.sin(t * 0.12) * 0.2;
        ctx.save();
        ctx.globalAlpha = starPulse * eased;
        ctx.fillStyle = COLORS.starYellow;
        ctx.font = '22px sans-serif';
        ctx.fillText('⭐⭐⭐', CANVAS_WIDTH / 2, cardY + 185);
        ctx.restore();

        // Tap to replay
        if (this.gameClearSlide >= 0.8) {
            const replayAlpha = 0.5 + Math.sin(t * 0.08) * 0.4;
            ctx.save();
            ctx.globalAlpha = replayAlpha;
            ctx.fillStyle = COLORS.accent;
            ctx.font = 'bold 15px "Quicksand", sans-serif';
            ctx.fillText('탭하여 다시 하기', CANVAS_WIDTH / 2, cardY + 213);
            ctx.restore();
        }

        ctx.restore();
    }

    // ─── Pause Overlay ────────────────────────────────────────
    drawPauseOverlay() {
        const ctx = this.ctx;

        // Dim backdrop
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();

        const cy = CANVAS_HEIGHT / 2;
        const btnW = 220, btnH = 46;
        const resumeY  = cy - 40;
        const titleBtnY = cy + 20;
        const btnX = CANVAS_WIDTH / 2 - btnW / 2;

        // "Resume" button
        ctx.save();
        ctx.shadowColor = COLORS.accent;
        ctx.shadowBlur = 12;
        ctx.fillStyle = COLORS.accent;
        drawRoundedRect(ctx, btnX, resumeY, btnW, btnH, 14);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶ 다시 진행하기', CANVAS_WIDTH / 2, resumeY + btnH / 2);

        // "Go to title" button
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        drawRoundedRect(ctx, btnX, titleBtnY, btnW, btnH, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, btnX, titleBtnY, btnW, btnH, 14);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↩ 타이틀로 돌아가기', CANVAS_WIDTH / 2, titleBtnY + btnH / 2);

        // Pause label
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = 'bold 13px "Quicksand", sans-serif';
        ctx.fillText('일시 정지', CANVAS_WIDTH / 2, cy - 70);
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
