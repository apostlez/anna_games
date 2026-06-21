/**
 * main.js — Game loop, state machine, orchestration
 * 달려라 두부 (Run Dubu Run!)
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_SCROLL_SPEED, MAX_SCROLL_SPEED, SPEED_INCREASE_RATE, PLAYER_START_X, clamp } from './utils.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { TerrainManager } from './terrain.js';
import { ObstacleManager } from './obstacles.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

// ─── Game States ─────────────────────────────────────────────
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    RESTING: 'resting',  // player is hiding in the cave checkpoint
};

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Modules
        this.input = new InputManager(this.canvas);
        this.player = new Player();
        this.terrain = new TerrainManager();
        this.obstacles = new ObstacleManager();
        this.renderer = new Renderer(this.ctx);
        this.ui = new UI(this.ctx);

        this.state = STATE.MENU;
        this.scrollSpeed = BASE_SCROLL_SPEED;
        this.frameCount = 0;
        this.gameOverDelay = 0; // prevent accidental tap-through
        this.checkpointSafeTimer = 0;
        this.restCaveX = PLAYER_START_X;   // x where the cave checkpoint is
        this.restingDelay = 0;             // short lock-out before allowing resume


        // Handle resize
        this._handleResize();
        window.addEventListener('resize', () => this._handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this._handleResize(), 100);
        });

        // Start the loop
        this._lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _handleResize() {
        const canvas = this.canvas;
        const parent = canvas.parentElement;
        const parentW = parent.clientWidth;
        const parentH = parent.clientHeight;

        const ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
        let displayW, displayH;

        if (parentW / parentH > ratio) {
            // Parent is wider — fit to height
            displayH = parentH;
            displayW = displayH * ratio;
        } else {
            // Parent is taller — fit to width
            displayW = parentW;
            displayH = displayW / ratio;
        }

        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
    }

    _loop(timestamp) {
        // Delta time (capped to prevent spiral of death)
        const dt = Math.min(timestamp - this._lastTime, 33.33); // cap at ~30fps equivalent
        this._lastTime = timestamp;

        // Fixed timestep updates (60fps)
        const step = 1000 / 60;
        const updates = Math.floor(dt / step) || 1;

        for (let i = 0; i < Math.min(updates, 3); i++) {
            this._update();
        }

        this._render();

        requestAnimationFrame((t) => this._loop(t));
    }

    _update() {
        this.frameCount++;
        this.ui.update();

        switch (this.state) {
            case STATE.MENU:
                this._updateMenu();
                break;
            case STATE.PLAYING:
                this._updatePlaying();
                break;
            case STATE.RESTING:
                this._updateResting();
                break;
            case STATE.GAME_OVER:
                this._updateGameOver();
                break;
        }
    }

    _updateMenu() {
        // Animate terrain in background
        this.terrain.update(1.5);

        if (this.input.consumeAction()) {
            this._startGame();
        }
    }

    _updatePlaying() {
        // Handle checkpoint safe zone timer
        if (this.checkpointSafeTimer > 0) {
            this.checkpointSafeTimer--;
            this.scrollSpeed = BASE_SCROLL_SPEED;
            this.obstacles.spawnPaused = true;
        } else {
            this.obstacles.spawnPaused = false;
            // Progressive difficulty
            let targetSpeed = BASE_SCROLL_SPEED + this.frameCount * SPEED_INCREASE_RATE;
            
            // Apply 15% slow effect if inside rain zone
            if (this.obstacles.insideRain) {
                targetSpeed *= 0.85;
            }
            
            this.scrollSpeed = clamp(
                targetSpeed,
                BASE_SCROLL_SPEED * 0.5,
                MAX_SCROLL_SPEED
            );
        }

        // Handle checkpoint triggers — enter cave rest
        if (this.obstacles.checkpointTriggered !== null) {
            const milestone = this.obstacles.checkpointTriggered;
            this.restCaveX = this.obstacles.checkpointTriggeredX ?? this.player.x;
            this.obstacles.checkpointTriggered = null;
            this.obstacles.checkpointTriggeredX = null;
            this.checkpointSafeTimer = 0;
            this.restingDelay = 50; // ~0.8 s before allowing resume tap
            this.obstacles.spawnPaused = true;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.state = 'idle';
            this.ui.showCheckpointBanner(milestone);
            this._spawnCelebrationParticles();
            this.input.reset();
            this.state = STATE.RESTING;
        }

        // Handle lightning strike effects (screen shake)
        if (this.obstacles.triggerLightningEffect) {
            this.renderer.shake(16);
            this.obstacles.triggerLightningEffect = false; // consume
        }


        // Input
        const actionPressed = this.input.consumeAction();
        const isFlying = this.input.checkFlying();

        if (actionPressed) {
            if (isFlying) {
                this.player.fly();
            } else {
                this.player.jump();
            }
        }

        // Update world
        this.terrain.update(this.scrollSpeed);
        this.obstacles.update(this.scrollSpeed, this.player);
        this.player.update(this.terrain.getCloudPlatforms());

        // Check death
        if (!this.player.alive) {
            this.renderer.shake(12);
            this.state = STATE.GAME_OVER;
            this.gameOverDelay = 40; // ~0.67 seconds before tap-to-retry works
            this.input.reset();
        }
    }

    _updateGameOver() {
        this.gameOverDelay = Math.max(0, this.gameOverDelay - 1);

        // Still update terrain slowly
        this.terrain.update(0.5);

        // Update player (fall animation)
        this.player.update(null);

        if (this.gameOverDelay <= 0 && this.input.consumeAction()) {
            this._restartGame();
        }
    }

    _updateResting() {
        // World is frozen — no terrain/obstacle scrolling
        // Pin player at cave entrance and run only animation
        this.player.x = this.restCaveX;
        this.player.vy = 0;
        this.player.vx = 0;
        this.player.state = 'idle';
        this.player.updateAnimationOnly();

        if (this.restingDelay > 0) {
            this.restingDelay--;
            return;
        }

        // Any tap resumes the game
        if (this.input.consumeAction()) {
            this.state = STATE.PLAYING;
            this.checkpointSafeTimer = 90; // brief safe window on resume
            this.obstacles.spawnPaused = false;
            this.input.reset();
        }
    }

    _startGame() {
        this.state = STATE.PLAYING;
        this.player.reset();
        this.terrain.reset();
        this.obstacles.reset();
        this.scrollSpeed = BASE_SCROLL_SPEED;
        this.frameCount = 0;
        this.input.reset();
        this.checkpointSafeTimer = 0;
        this.restCaveX = PLAYER_START_X;
        this.restingDelay = 0;
    }

    _spawnCelebrationParticles() {
        for (let i = 0; i < 20; i++) {
            this.player.particles.push({
                x: this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 40,
                y: this.player.y + this.player.height / 2 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 3,
                life: 30 + Math.random() * 20,
                maxLife: 50,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#FFD93D' : '#FFB5C2',
                type: 'sparkle',
            });
        }
    }


    _restartGame() {
        this.ui.resetGameOver();
        this._startGame();
    }

    _render() {
        const ctx = this.ctx;

        this.renderer.beginFrame();

        // Background (sky, far clouds, far hills)
        this.terrain.drawBackground(ctx);

        // Midground (mid hills, cloud platforms)
        this.terrain.drawMidground(ctx);

        // Foreground (near hills, ground, grass) - drawn BEFORE player/obstacles so they appear on top
        this.terrain.drawForeground(ctx);

        // Obstacles (drawn after ground so squirrels are fully visible in front of hills)
        this.obstacles.draw(ctx);

        // Player
        this.player.draw(ctx);

        // Rain screen tint overlay (visual only)
        if (this.obstacles.insideRain) {
            ctx.save();
            ctx.fillStyle = 'rgba(20, 32, 55, 0.16)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
        }


        // Renderer overlays
        this.renderer.endFrame();

        // UI
        switch (this.state) {
            case STATE.MENU:
                this.ui.drawStartScreen();
                break;
            case STATE.PLAYING:
                this.ui.drawHUD(
                    this.obstacles.getDistance(),
                    this.scrollSpeed
                );
                this.renderer.drawDistanceBar(this.obstacles.getDistance());
                break;
            case STATE.RESTING:
                this.ui.drawHUD(
                    this.obstacles.getDistance(),
                    this.scrollSpeed
                );
                this.renderer.drawDistanceBar(this.obstacles.getDistance());
                this._drawRestingOverlay();
                break;
            case STATE.GAME_OVER:
                this.ui.drawGameOverScreen(this.obstacles.getDistance());
                break;
        }
    }

    _drawRestingOverlay() {
        const ctx = this.ctx;
        ctx.save();

        // Dim the world behind the panel
        ctx.fillStyle = 'rgba(15, 10, 30, 0.45)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Rounded panel
        const pw = 290, ph = 106;
        const px = (CANVAS_WIDTH - pw) / 2;
        const py = CANVAS_HEIGHT / 2 - ph / 2 - 18;
        ctx.fillStyle = 'rgba(40, 28, 60, 0.78)';
        ctx.strokeStyle = 'rgba(200, 182, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 14);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#FFE5EC';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏕 쉼터에서 쉼는 중...', CANVAS_WIDTH / 2, py + 42);

        // Blinking tap prompt
        if (Math.sin(this.frameCount * 0.12) > 0) {
            ctx.fillStyle = '#C8B6FF';
            ctx.font = '17px sans-serif';
            ctx.fillText('👍 탭하여 출발!', CANVAS_WIDTH / 2, py + 76);
        }

        ctx.restore();
    }
}

// ─── Boot ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
