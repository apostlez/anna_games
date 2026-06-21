/**
 * terrain.js — Procedural terrain generation, parallax layers
 * 달려라 두부 (Run Dubu Run!)
 */

import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS,
    randInt, randFloat, drawCloudShape
} from './utils.js';

// ─── Cloud Platforms ──────────────────────────────────────────
class CloudPlatform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 20;
        this.opacity = 0.9 + Math.random() * 0.1;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.02 + Math.random() * 0.01;
        this.baseY = y;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        // Gentle floating bob
        this.y = this.baseY + Math.sin(performance.now() * 0.001 + this.bobOffset) * 3;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Shadow
        ctx.fillStyle = COLORS.cloudShadow;
        drawCloudShape(ctx, this.x + 3, this.y + 4, this.width, this.height);
        ctx.fill();

        // Cloud body
        ctx.fillStyle = COLORS.cloud;
        drawCloudShape(ctx, this.x, this.y, this.width, this.height);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width * 0.35,
            this.y + this.height * 0.25,
            this.width * 0.15,
            this.height * 0.15,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    }

    isOffScreen() {
        return this.x + this.width < -50;
    }
}

// ─── Hill (background decoration) ─────────────────────────────
class Hill {
    constructor(x, width, height, layer) {
        this.x = x;
        this.width = width;
        this.height = height;
        this.layer = layer; // 0 = far, 1 = mid, 2 = near
    }

    draw(ctx) {
        const colors = [COLORS.hillsFar, COLORS.hills, COLORS.groundDark];
        ctx.fillStyle = colors[this.layer] || COLORS.hills;
        ctx.beginPath();
        ctx.moveTo(this.x, GROUND_Y);
        ctx.quadraticCurveTo(
            this.x + this.width / 2,
            GROUND_Y - this.height,
            this.x + this.width,
            GROUND_Y
        );
        ctx.fill();
    }
}

// ─── Decorative Cloud (background) ───────────────────────────
class BackgroundCloud {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.opacity = 0.3 + Math.random() * 0.4;
    }

    update() {
        this.x -= this.speed;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = COLORS.cloud;
        drawCloudShape(ctx, this.x, this.y, this.width, this.height);
        ctx.fill();
        ctx.restore();
    }

    isOffScreen() {
        return this.x + this.width < -20;
    }
}

// ─── Terrain Manager ─────────────────────────────────────────
export class TerrainManager {
    constructor() {
        this.cloudPlatforms = [];
        this.hills = [[], [], []]; // 3 layers
        this.bgClouds = [];
        this.grassPatches = [];

        this._cloudSpawnTimer = 0;
        this._cloudSpawnInterval = 120;
        this._bgCloudSpawnTimer = 0;

        this._init();
    }

    _init() {
        // Initial background clouds
        for (let i = 0; i < 8; i++) {
            this.bgClouds.push(new BackgroundCloud(
                randInt(-100, CANVAS_WIDTH + 200),
                randInt(20, 200),
                randInt(60, 140),
                randInt(15, 30),
                randFloat(0.2, 0.8)
            ));
        }

        // Initial hills
        for (let layer = 0; layer < 3; layer++) {
            const count = 4 + layer;
            for (let i = 0; i < count; i++) {
                const w = randInt(120, 280 - layer * 40);
                const h = randInt(20 + layer * 10, 50 + layer * 15);
                this.hills[layer].push(new Hill(
                    i * (CANVAS_WIDTH / count) + randInt(-30, 30),
                    w, h, layer
                ));
            }
        }

        // Initial cloud platforms
        for (let i = 0; i < 3; i++) {
            this.cloudPlatforms.push(new CloudPlatform(
                300 + i * 250 + randInt(-30, 30),
                randInt(150, 300),
                randInt(70, 120)
            ));
        }

        // Initial grass patches
        for (let i = 0; i < 30; i++) {
            this.grassPatches.push({
                x: randInt(0, CANVAS_WIDTH),
                height: randInt(4, 10),
                width: randInt(2, 4),
            });
        }
    }

    reset() {
        this.cloudPlatforms = [];
        this.hills = [[], [], []];
        this.bgClouds = [];
        this.grassPatches = [];
        this._cloudSpawnTimer = 0;
        this._bgCloudSpawnTimer = 0;
        this._init();
    }

    update(scrollSpeed) {
        // Update background clouds
        for (const cloud of this.bgClouds) {
            cloud.update();
        }
        this.bgClouds = this.bgClouds.filter(c => !c.isOffScreen());

        // Spawn new background clouds
        this._bgCloudSpawnTimer++;
        if (this._bgCloudSpawnTimer > 60) {
            this._bgCloudSpawnTimer = 0;
            if (this.bgClouds.length < 10) {
                this.bgClouds.push(new BackgroundCloud(
                    CANVAS_WIDTH + randInt(20, 100),
                    randInt(20, 220),
                    randInt(60, 140),
                    randInt(15, 30),
                    randFloat(0.2, 0.8)
                ));
            }
        }

        // Update cloud platforms
        for (const cloud of this.cloudPlatforms) {
            cloud.update(scrollSpeed);
        }
        this.cloudPlatforms = this.cloudPlatforms.filter(c => !c.isOffScreen());

        // Spawn new cloud platforms
        this._cloudSpawnTimer++;
        if (this._cloudSpawnTimer > this._cloudSpawnInterval) {
            this._cloudSpawnTimer = 0;
            this._cloudSpawnInterval = randInt(80, 180);
            this.cloudPlatforms.push(new CloudPlatform(
                CANVAS_WIDTH + randInt(50, 150),
                randInt(130, 310),
                randInt(70, 130)
            ));
        }

        // Update hills (parallax)
        const speeds = [0.3, 0.6, 1.0];
        for (let layer = 0; layer < 3; layer++) {
            for (const hill of this.hills[layer]) {
                hill.x -= scrollSpeed * speeds[layer];
                if (hill.x + hill.width < -50) {
                    hill.x = CANVAS_WIDTH + randInt(20, 100);
                    hill.width = randInt(120, 280 - layer * 40);
                    hill.height = randInt(20 + layer * 10, 50 + layer * 15);
                }
            }
        }

        // Update grass
        for (const g of this.grassPatches) {
            g.x -= scrollSpeed;
            if (g.x < -10) {
                g.x = CANVAS_WIDTH + randInt(0, 30);
                g.height = randInt(4, 10);
            }
        }
    }

    getCloudPlatforms() {
        return this.cloudPlatforms;
    }

    drawBackground(ctx) {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, COLORS.skyTop);
        grad.addColorStop(0.5, COLORS.skyMid);
        grad.addColorStop(0.85, COLORS.skyBottom);
        grad.addColorStop(1, COLORS.ground);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background clouds
        for (const cloud of this.bgClouds) {
            cloud.draw(ctx);
        }

        // Far hills
        this.hills[0].forEach(h => h.draw(ctx));
    }

    drawMidground(ctx) {
        // Mid hills
        this.hills[1].forEach(h => h.draw(ctx));

        // Cloud platforms
        for (const cloud of this.cloudPlatforms) {
            cloud.draw(ctx);
        }
    }

    drawForeground(ctx) {
        // Near hills
        this.hills[2].forEach(h => h.draw(ctx));

        // Ground
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

        // Ground top edge (darker line)
        ctx.fillStyle = COLORS.groundDark;
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);

        // Grass patches
        ctx.strokeStyle = COLORS.hillsDark;
        ctx.lineWidth = 1.5;
        for (const g of this.grassPatches) {
            ctx.beginPath();
            ctx.moveTo(g.x, GROUND_Y);
            ctx.quadraticCurveTo(g.x - 2, GROUND_Y - g.height, g.x - 1, GROUND_Y - g.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(g.x + g.width, GROUND_Y);
            ctx.quadraticCurveTo(g.x + g.width + 2, GROUND_Y - g.height * 0.8, g.x + g.width + 3, GROUND_Y - g.height * 0.7);
            ctx.stroke();
        }

        // Ground pattern dots
        ctx.fillStyle = COLORS.groundDark;
        for (let i = 0; i < CANVAS_WIDTH; i += 20) {
            const dotY = GROUND_Y + 10 + Math.sin(i * 0.1) * 5;
            ctx.beginPath();
            ctx.arc(i + ((performance.now() * 0.02) % 20), dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
