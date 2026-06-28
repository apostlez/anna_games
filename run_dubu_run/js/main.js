/**
 * main.js — Game loop, state machine, orchestration
 * 달려라 두부 (Run Dubu Run!)
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_SCROLL_SPEED, MAX_SCROLL_SPEED, SPEED_INCREASE_RATE, PLAYER_START_X, clamp, GAME_CLEAR_DISTANCE } from './utils.js';
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
    GAME_CLEAR: 'game_clear', // player reached 2km goal
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
        this.restingClearTimer = 0;        // timer to clear obstacles after resting
        this.gameClearDelay = 0;           // prevent accidental tap-through on clear


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
        // Delta time: normalize to 60fps so speed is consistent on any display
        // Clamp: min 0.1 (prevents negative/zero on iOS Safari), max 3.0 (prevents spike on tab-switch)
        const dtFactor = Math.max(0.1, Math.min((timestamp - this._lastTime) / (1000 / 60), 3.0));
        this._lastTime = timestamp;

        this._update(dtFactor);
        this._render();

        requestAnimationFrame((t) => this._loop(t));
    }

    _update(dtFactor) {
        this.frameCount += dtFactor;
        this.ui.update();

        switch (this.state) {
            case STATE.MENU:
                this._updateMenu(dtFactor);
                break;
            case STATE.PLAYING:
                this._updatePlaying(dtFactor);
                break;
            case STATE.RESTING:
                this._updateResting(dtFactor);
                break;
            case STATE.GAME_OVER:
                this._updateGameOver(dtFactor);
                break;
            case STATE.GAME_CLEAR:
                this._updateGameClear(dtFactor);
                break;
        }
    }

    _updateMenu(dtFactor) {
        // Animate terrain in background
        this.terrain.update(1.5 * dtFactor, dtFactor);

        if (this.input.consumeAction()) {
            this._startGame();
        }
    }

    _updatePlaying(dtFactor) {
        // Handle checkpoint safe zone timer
        if (this.checkpointSafeTimer > 0) {
            this.checkpointSafeTimer -= dtFactor;
            this.scrollSpeed = BASE_SCROLL_SPEED;
            this.obstacles.spawnPaused = true;
        } else {
            this.obstacles.spawnPaused = this.obstacles.goalSpawned; // freeze spawning near goal
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

        // Effective per-frame movement scaled by delta time
        const effectiveSpeed = this.scrollSpeed * dtFactor;

        // Handle checkpoint triggers — enter cave rest
        if (this.obstacles.checkpointTriggered !== null) {
            const milestone = this.obstacles.checkpointTriggered;
            this.restCaveX = this.obstacles.checkpointTriggeredX ?? this.player.x;
            this.obstacles.checkpointTriggered = null;
            this.obstacles.checkpointTriggeredX = null;
            this.checkpointSafeTimer = 0;
            this.restingDelay = 50; // ~0.8 s before allowing resume tap
            this.restingClearTimer = 90; // 1.5 s then clear obstacles
            this.obstacles.spawnPaused = true;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.state = 'idle';
            this.ui.showCheckpointBanner(milestone);
            this._spawnCelebrationParticles();
            this.input.reset();
            this.state = STATE.RESTING;
        }

        // Handle goal reached — game clear
        if (this.obstacles.goalTriggered) {
            this.obstacles.goalTriggered = false;
            this.state = STATE.GAME_CLEAR;
            this.gameClearDelay = 60;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.state = 'idle';
            this._spawnCelebrationParticles();
            this.input.reset();
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
        this.terrain.update(effectiveSpeed, dtFactor);
        this.obstacles.update(effectiveSpeed, this.player, dtFactor);
        this.player.update(this.terrain.getCloudPlatforms(), dtFactor);

        // Check death
        if (!this.player.alive) {
            this.renderer.shake(12);
            this.state = STATE.GAME_OVER;
            this.gameOverDelay = 40; // ~0.67 seconds before tap-to-retry works
            this.input.reset();
        }
    }

    _updateGameOver(dtFactor) {
        this.gameOverDelay = Math.max(0, this.gameOverDelay - dtFactor);

        // Still update terrain slowly
        this.terrain.update(0.5 * dtFactor, dtFactor);

        // Update player (fall animation)
        this.player.update(null, dtFactor);

        if (this.gameOverDelay <= 0 && this.input.consumeAction()) {
            this._restartGame();
        }
    }

    _updateResting(dtFactor) {
        // World is frozen — no terrain/obstacle scrolling
        // Pin player at cave entrance and run only animation
        this.player.x = this.restCaveX;
        this.player.vy = 0;
        this.player.vx = 0;
        this.player.state = 'idle';
        this.player.updateAnimationOnly();

        // After a delay, clear obstacles from screen so the player can see a clean cave
        if (this.restingClearTimer > 0) {
            this.restingClearTimer -= dtFactor;
            if (this.restingClearTimer <= 0) {
                this.obstacles.clearNonCheckpointObstacles();
            }
        }

        if (this.restingDelay > 0) {
            this.restingDelay -= dtFactor;
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
        this.restingClearTimer = 0;
        this.gameClearDelay = 0;
    }

    _updateGameClear(dtFactor) {
        this.gameClearDelay = Math.max(0, this.gameClearDelay - dtFactor);

        // Slow terrain scroll for a calm finish scene
        this.terrain.update(0.8 * dtFactor, dtFactor);

        // Player stands idle
        this.player.updateAnimationOnly();

        if (this.gameClearDelay <= 0 && this.input.consumeAction()) {
            this._restartGame();
        }
    }

    _spawnCelebrationParticles() {        for (let i = 0; i < 20; i++) {
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
            case STATE.GAME_CLEAR:
                this.ui.drawGameClearScreen(this.obstacles.getDistance());
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
