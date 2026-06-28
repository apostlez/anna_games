/**
 * obstacles.js — Obstacle spawning & behavior
 * 달려라 두부 (Run Dubu Run!)
 * 
 * Types: Dark Cloud (먹구름), Rain (비), Wind (바람), Lightning (번개), Animals (동물)
 */

import {
    CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS,
    randInt, randFloat, drawCloudShape, checkCollision,
    BIG_ANIMAL_WIDTH, BIG_ANIMAL_HEIGHT, CHECKPOINT_DISTANCE_INTERVAL,
    CHECKPOINT_SAFE_DURATION, SNACK_INVINCIBLE_DURATION, drawRoundedRect,
    GAME_CLEAR_DISTANCE, PLAYER_START_X,
    DIFFICULTY_EASY, DIFFICULTY_HARD, HARD_GAME_CLEAR_DISTANCE
} from './utils.js';


// ─── Obstacle Types ──────────────────────────────────────────
const TYPES = {
    DARK_CLOUD: 'dark_cloud',
    RAIN: 'rain',
    WIND: 'wind',
    LIGHTNING: 'lightning',
    ANIMAL: 'animal',
    BIG_ANIMAL: 'big_animal',
};

// ─── Dark Cloud ──────────────────────────────────────────────
class DarkCloud {
    constructor(x, y) {
        this.type = TYPES.DARK_CLOUD;
        this.x = x;
        this.y = y;
        this.width = randInt(70, 110);
        this.height = randInt(30, 45);
        this.active = true;
        this.pulseTimer = 0;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.pulseTimer += 0.03;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x + 10, y: this.y + 5, width: this.width - 20, height: this.height - 10 };
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulseTimer) * 0.05;
        ctx.save();
        ctx.globalAlpha = 0.85 + pulse;

        // Shadow
        ctx.fillStyle = COLORS.darkCloudShadow;
        drawCloudShape(ctx, this.x + 4, this.y + 5, this.width, this.height);
        ctx.fill();

        // Body
        ctx.fillStyle = COLORS.darkCloud;
        drawCloudShape(ctx, this.x, this.y, this.width, this.height);
        ctx.fill();

        // Inner darkness
        ctx.fillStyle = 'rgba(40, 50, 60, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width * 0.5,
            this.y + this.height * 0.5,
            this.width * 0.25,
            this.height * 0.2,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#2D3748';
        const eyeY = this.y + this.height * 0.45;
        // Left eye
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.35, eyeY, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.ellipse(this.x + this.width * 0.65, eyeY, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Angry eyebrows
        ctx.strokeStyle = '#1A202C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.25, eyeY - 6);
        ctx.lineTo(this.x + this.width * 0.4, eyeY - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.75, eyeY - 6);
        ctx.lineTo(this.x + this.width * 0.6, eyeY - 3);
        ctx.stroke();

        ctx.restore();
    }
}

// ─── Rain Zone ───────────────────────────────────────────────
class RainZone {
    constructor(x) {
        this.type = TYPES.RAIN;
        this.x = x;
        this.y = 0;
        this.width = randInt(80, 140);
        this.height = GROUND_Y;
        this.active = true;
        this.drops = [];
        this.cloudY = randInt(20, 60);
        this.cloudWidth = this.width + 40;

        // Generate rain drops
        for (let i = 0; i < 30; i++) {
            this.drops.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: randFloat(4, 8),
                length: randInt(8, 16),
                opacity: randFloat(0.3, 0.7),
            });
        }
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        for (const drop of this.drops) {
            drop.y += drop.speed;
            if (drop.y > this.height) {
                drop.y = this.cloudY + 30;
                drop.x = Math.random() * this.width;
            }
        }
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x + 15, y: this.cloudY + 30, width: this.width - 30, height: this.height - this.cloudY - 30 };
    }

    draw(ctx) {
        // Rain cloud on top
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = COLORS.darkCloud;
        drawCloudShape(ctx, this.x - 20, this.cloudY, this.cloudWidth, 30);
        ctx.fill();
        ctx.restore();

        // Rain drops
        ctx.strokeStyle = COLORS.rain;
        ctx.lineWidth = 1.5;
        for (const drop of this.drops) {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(this.x + drop.x, drop.y);
            ctx.lineTo(this.x + drop.x - 1, drop.y + drop.length);
            ctx.stroke();
        }

        // Splash at ground
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = COLORS.rain;
        for (let i = 0; i < 5; i++) {
            const splashX = this.x + (i / 5) * this.width + Math.sin(performance.now() * 0.003 + i) * 5;
            ctx.beginPath();
            ctx.arc(splashX, GROUND_Y - 2, 2, Math.PI, 0);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// ─── Wind Gust ───────────────────────────────────────────────
class WindGust {
    constructor(x, y) {
        this.type = TYPES.WIND;
        this.x = x;
        this.y = y;
        this.width = randInt(100, 160);
        this.height = randInt(60, 100);
        this.active = true;
        this.pushForce = randFloat(-4, -2); // pushes player left
        this.swirls = [];
        this.timer = 0;

        for (let i = 0; i < 12; i++) {
            this.swirls.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: randFloat(3, 8),
                speed: randFloat(2, 5),
                angle: Math.random() * Math.PI * 2,
                rotSpeed: randFloat(0.05, 0.15),
                opacity: randFloat(0.2, 0.5),
            });
        }
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.timer += 0.05;

        for (const s of this.swirls) {
            s.x += s.speed;
            s.angle += s.rotSpeed;
            s.opacity = 0.2 + Math.sin(this.timer + s.angle) * 0.15;
            if (s.x > this.width) {
                s.x = -5;
                s.y = Math.random() * this.height;
            }
        }

        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x + 10, y: this.y + 10, width: this.width - 20, height: this.height - 20 };
    }

    /**
     * Wind doesn't kill — it pushes the player.
     * Return push force for the player.
     */
    getPushForce() {
        return this.pushForce;
    }

    draw(ctx) {
        // Wind zone indicator (subtle)
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = COLORS.wind;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();

        // Swirl particles
        for (const s of this.swirls) {
            ctx.save();
            ctx.globalAlpha = s.opacity;
            ctx.strokeStyle = COLORS.wind;
            ctx.lineWidth = 1.5;
            ctx.translate(this.x + s.x, this.y + s.y);
            ctx.rotate(s.angle);

            // Swirl line
            ctx.beginPath();
            ctx.moveTo(-s.size, 0);
            ctx.quadraticCurveTo(0, -s.size * 0.5, s.size, 0);
            ctx.stroke();

            // Small arc
            ctx.beginPath();
            ctx.arc(0, 0, s.size * 0.5, 0, Math.PI);
            ctx.stroke();

            ctx.restore();
        }

        // Wind direction lines
        ctx.strokeStyle = 'rgba(200, 220, 240, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const lineY = this.y + (i / 3) * this.height;
            const offset = (performance.now() * 0.1 + i * 50) % this.width;
            ctx.beginPath();
            ctx.moveTo(this.x + offset, lineY);
            ctx.lineTo(this.x + offset + 20, lineY);
            ctx.stroke();
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(this.x + offset + 20, lineY);
            ctx.lineTo(this.x + offset + 16, lineY - 3);
            ctx.moveTo(this.x + offset + 20, lineY);
            ctx.lineTo(this.x + offset + 16, lineY + 3);
            ctx.stroke();
        }
    }
}

// ─── Lightning Strike ────────────────────────────────────────
class LightningStrike {
    constructor(x) {
        this.type = TYPES.LIGHTNING;
        this.x = x;
        this.width = 40;
        this.y = 0;
        this.height = GROUND_Y;
        this.active = true;

        // Warning phase → strike phase
        this.phase = 'warning'; // 'warning' | 'strike' | 'fade'
        this.warningTimer = 90; // frames of warning
        this.strikeTimer = 0;
        this.strikeDuration = 15;
        this.fadeTimer = 0;
        this.fadeDuration = 30;
        this.dangerous = false;
        this.triggerFlashAndShake = false;
        
        // Bolt segments
        this.boltSegments = this._generateBolt();
    }

    _generateBolt() {
        const segments = [];
        let y = 20;
        let x = this.width / 2;
        while (y < GROUND_Y - 10) {
            const nx = x + randInt(-15, 15);
            const ny = y + randInt(15, 35);
            segments.push({ x1: x, y1: y, x2: nx, y2: Math.min(ny, GROUND_Y - 5) });
            x = nx;
            y = ny;
        }
        return segments;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;

        if (this.phase === 'warning') {
            this.warningTimer--;
            if (this.warningTimer <= 0) {
                this.phase = 'strike';
                this.strikeTimer = this.strikeDuration;
                this.dangerous = true;
                this.boltSegments = this._generateBolt(); // Regenerate bolt shape
                this.triggerFlashAndShake = true;
            }
        } else if (this.phase === 'strike') {
            this.strikeTimer--;
            if (this.strikeTimer <= 0) {
                this.phase = 'fade';
                this.fadeTimer = this.fadeDuration;
                this.dangerous = false;
            }
        } else if (this.phase === 'fade') {
            this.fadeTimer--;
            if (this.fadeTimer <= 0) {
                this.active = false;
            }
        }

        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        if (!this.dangerous) return null;
        return { x: this.x + 5, y: 20, width: this.width - 10, height: GROUND_Y - 20 };
    }

    draw(ctx) {
        if (this.phase === 'warning') {
            // Warning indicator — flashing column
            const flash = Math.sin(this.warningTimer * 0.3) * 0.5 + 0.5;
            ctx.save();
            ctx.globalAlpha = 0.15 * flash;
            ctx.fillStyle = COLORS.lightning;
            ctx.fillRect(this.x, 0, this.width, GROUND_Y);
            ctx.restore();

            // Warning icon at top
            ctx.save();
            ctx.globalAlpha = 0.5 + flash * 0.5;
            ctx.fillStyle = COLORS.lightning;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', this.x + this.width / 2, 30);
            ctx.restore();

        } else if (this.phase === 'strike') {
            // Flash background
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = COLORS.lightningGlow;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();

            // Glow
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = COLORS.lightningGlow;
            ctx.fillRect(this.x - 10, 0, this.width + 20, GROUND_Y);
            ctx.restore();

            // Bolt
            ctx.save();
            ctx.strokeStyle = COLORS.lightningGlow;
            ctx.lineWidth = 4;
            ctx.shadowColor = COLORS.lightningGlow;
            ctx.shadowBlur = 15;
            for (const seg of this.boltSegments) {
                ctx.beginPath();
                ctx.moveTo(this.x + seg.x1, seg.y1);
                ctx.lineTo(this.x + seg.x2, seg.y2);
                ctx.stroke();
            }
            // Inner white bolt
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            for (const seg of this.boltSegments) {
                ctx.beginPath();
                ctx.moveTo(this.x + seg.x1, seg.y1);
                ctx.lineTo(this.x + seg.x2, seg.y2);
                ctx.stroke();
            }
            ctx.restore();

            // Ground impact flash
            ctx.fillStyle = COLORS.lightningGlow;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, GROUND_Y, 20, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

        } else if (this.phase === 'fade') {
            // Fading afterimage
            const alpha = this.fadeTimer / this.fadeDuration * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = COLORS.lightning;
            ctx.lineWidth = 2;
            for (const seg of this.boltSegments) {
                ctx.beginPath();
                ctx.moveTo(this.x + seg.x1, seg.y1);
                ctx.lineTo(this.x + seg.x2, seg.y2);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}

// ─── Animal (ground-based) ───────────────────────────────────
class Animal {
    constructor(x) {
        this.type = TYPES.ANIMAL;
        this.x = x;
        this.width = 28;
        this.height = 22;
        this.active = true;
        this.animTimer = 0;
        this.animalType = Math.random() > 0.5 ? 'bird' : 'squirrel';
        this.moveSpeed = this.animalType === 'bird' ? randFloat(1.2, 2.8) : randFloat(0.6, 1.8);
        this.hopTimer = 0;
        this.hopHeight = 0;

        if (this.animalType === 'bird') {
            this.y = randInt(80, 230);
            this.baseY = this.y;
        } else {
            this.y = GROUND_Y - this.height;
        }
    }

    update(scrollSpeed, dtFactor = 1) {
        this.x -= scrollSpeed + this.moveSpeed * dtFactor;
        this.animTimer++;

        // Hopping for squirrel
        if (this.animalType === 'squirrel') {
            this.hopTimer++;
            this.hopHeight = Math.abs(Math.sin(this.hopTimer * 0.12)) * 10;
            this.y = GROUND_Y - this.height - this.hopHeight;
        } else {
            // Bird flies with sine wave
            this.y = this.baseY + Math.sin(this.animTimer * 0.1) * 20;
        }

        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x + 3, y: this.y + 3, width: this.width - 6, height: this.height - 3 };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.animalType === 'bird') {
            this._drawBird(ctx);
        } else {
            this._drawSquirrel(ctx);
        }

        ctx.restore();
    }

    _drawBird(ctx) {
        const wingAngle = Math.sin(this.animTimer * 0.35) * 25;


        // Body
        ctx.fillStyle = '#6BA3BE';
        ctx.beginPath();
        ctx.ellipse(0, 2, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#5A93AE';
        ctx.beginPath();
        ctx.arc(-6, -3, 6, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.save();
        ctx.rotate(wingAngle * Math.PI / 180);
        ctx.fillStyle = '#7BB3CE';
        ctx.beginPath();
        ctx.ellipse(2, -2, 5, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Eye
        ctx.fillStyle = '#2D3748';
        ctx.beginPath();
        ctx.arc(-8, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#F6AD55';
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.lineTo(-15, -2);
        ctx.lineTo(-12, -1);
        ctx.closePath();
        ctx.fill();

        // Tail
        ctx.fillStyle = '#5A93AE';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(14, -3);
        ctx.lineTo(14, 3);
        ctx.closePath();
        ctx.fill();
    }

    _drawSquirrel(ctx) {
        // Body
        ctx.fillStyle = COLORS.animalBrown;
        ctx.beginPath();
        ctx.ellipse(0, 2, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(-4, -5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.ellipse(-7, -10, 2.5, 3.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-1, -10, 2.5, 3.5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#2D3748';
        ctx.beginPath();
        ctx.arc(-6, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#8B6040';
        ctx.beginPath();
        ctx.arc(-9, -4, 1, 0, Math.PI * 2);
        ctx.fill();

        // Tail (fluffy)
        ctx.fillStyle = COLORS.animalBrown;
        ctx.save();
        const tailWag = Math.sin(this.animTimer * 0.1) * 10;
        ctx.translate(6, -2);
        ctx.rotate((tailWag + 30) * Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(0, -6, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail highlight
        ctx.fillStyle = COLORS.animalDark;
        ctx.beginPath();
        ctx.ellipse(1, -8, 2, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Belly
        ctx.fillStyle = '#DEC9A8';
        ctx.beginPath();
        ctx.ellipse(0, 4, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ─── Big Animal ──────────────────────────────────────────────
class BigAnimal {
    constructor(x) {
        this.type = TYPES.BIG_ANIMAL;
        this.x = x;
        this.width = BIG_ANIMAL_WIDTH;
        this.height = BIG_ANIMAL_HEIGHT;
        this.y = GROUND_Y - this.height;
        this.active = true;
        this.animTimer = 0;
        this.moveSpeed = randFloat(0.3, 0.8);
        this.waddleAngle = 0;
    }

    update(scrollSpeed, dtFactor = 1) {
        this.x -= scrollSpeed + this.moveSpeed * dtFactor;
        this.animTimer++;
        this.waddleAngle = Math.sin(this.animTimer * 0.1) * 0.08;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x + 6, y: this.y + 6, width: this.width - 12, height: this.height - 6 };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.waddleAngle);

        const w = this.width;
        const h = this.height;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, h / 2 - 2, w * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Bear
        // Ears
        ctx.fillStyle = '#8B5A2B';
        ctx.strokeStyle = '#5C3A21';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-w * 0.3, -h * 0.35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w * 0.3, -h * 0.35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner ears
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.arc(-w * 0.3, -h * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.3, -h * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();

        // Main body/head
        ctx.fillStyle = '#9C6644';
        ctx.strokeStyle = '#7F5539';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.45, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Snout
        ctx.fillStyle = '#E6CCB2';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.1, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#2D3748';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.06);
        ctx.lineTo(-3, h * 0.02);
        ctx.lineTo(3, h * 0.02);
        ctx.closePath();
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#2D3748';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-2, h * 0.08, 2.5, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(2, h * 0.08, 2.5, 0, Math.PI);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#2D3748';
        ctx.beginPath();
        ctx.arc(-10, -5, 3, 0, Math.PI * 2);
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-9, -6, 1, 0, Math.PI * 2);
        ctx.arc(11, -6, 1, 0, Math.PI * 2);
        ctx.fill();

        // Paws
        ctx.fillStyle = '#9C6644';
        ctx.strokeStyle = '#7F5539';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-w * 0.3, h * 0.35, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.3, h * 0.35, 7, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

// ─── Checkpoint ──────────────────────────────────────────────
class Checkpoint {
    constructor(x, milestone) {
        this.type = 'checkpoint';
        this.x = x;
        this.width = 40;
        this.height = 80;
        this.y = GROUND_Y - this.height;
        this.active = true;
        this.milestone = milestone;
        this.triggered = false;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return null; // indicator only
    }

    draw(ctx) {
        ctx.save();

        const caveW = 70;  // visual width of the cave
        const caveH = 68;  // visual height of the rock mountain
        const cx = this.x + 20; // cave horizontal center
        const groundY = GROUND_Y;

        // ── Rock mountain backdrop (dark layer) ───────────────
        ctx.fillStyle = '#4E4060';
        ctx.beginPath();
        ctx.moveTo(cx - caveW * 0.7, groundY);
        ctx.lineTo(cx + caveW * 0.7, groundY);
        ctx.lineTo(cx + caveW * 0.52, groundY - caveH - 12);
        ctx.quadraticCurveTo(cx, groundY - caveH - 36, cx - caveW * 0.52, groundY - caveH - 12);
        ctx.closePath();
        ctx.fill();

        // ── Rock mountain lighter layer ───────────────────────
        ctx.fillStyle = '#6B5F7A';
        ctx.beginPath();
        ctx.moveTo(cx - caveW * 0.6, groundY);
        ctx.lineTo(cx + caveW * 0.6, groundY);
        ctx.lineTo(cx + caveW * 0.42, groundY - caveH - 2);
        ctx.quadraticCurveTo(cx, groundY - caveH - 24, cx - caveW * 0.42, groundY - caveH - 2);
        ctx.closePath();
        ctx.fill();

        // ── Cave interior (dark arch) ─────────────────────────
        ctx.fillStyle = '#12101C';
        ctx.beginPath();
        ctx.arc(cx, groundY - caveH * 0.46, caveW * 0.31, Math.PI, 0);
        ctx.lineTo(cx + caveW * 0.31, groundY - 1);
        ctx.lineTo(cx - caveW * 0.31, groundY - 1);
        ctx.closePath();
        ctx.fill();

        // ── Cave arch highlight / rim ─────────────────────────
        ctx.strokeStyle = '#8B7E99';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, groundY - caveH * 0.46, caveW * 0.31, Math.PI, 0);
        ctx.stroke();

        // ── Boulders at base ──────────────────────────────────
        ctx.fillStyle = '#564868';
        ctx.beginPath();
        ctx.ellipse(cx - caveW * 0.44, groundY - 6, 11, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + caveW * 0.44, groundY - 6, 10, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // ── Small pebbles ─────────────────────────────────────
        ctx.fillStyle = '#7A6B8A';
        ctx.beginPath();
        ctx.ellipse(cx - caveW * 0.28, groundY - 3, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + caveW * 0.28, groundY - 3, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── "쉼터" label ───────────────────────────────────────
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏕 쉼터', cx, groundY - caveH - 20);
        ctx.fillStyle = '#C8B6FF';
        ctx.font = '9px sans-serif';
        ctx.fillText(`${this.milestone}m`, cx, groundY - caveH - 7);

        ctx.restore();
    }
}

// ─── Snack Collectible ───────────────────────────────────────
class Snack {
    constructor(x, y, snackType) {
        this.type = 'snack';
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.active = true;
        this.snackType = snackType; // 'sunflower' | 'carrot' | 'jelly'
        this.bounceTimer = Math.random() * Math.PI * 2;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.bounceTimer += 0.05;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    draw(ctx) {
        const bounce = Math.sin(this.bounceTimer) * 4;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + bounce);

        if (this.snackType === 'sunflower') {
            ctx.fillStyle = COLORS.snackSunflower;
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 11, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Stripes
            ctx.strokeStyle = '#4A4453';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2, -8);
            ctx.quadraticCurveTo(-1, 0, -2, 8);
            ctx.moveTo(2, -8);
            ctx.quadraticCurveTo(1, 0, 2, 8);
            ctx.stroke();
        } else if (this.snackType === 'carrot') {
            ctx.fillStyle = COLORS.snackCarrot;
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(6, -8);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fill();

            // Green top leaf
            ctx.fillStyle = '#74C69D';
            ctx.beginPath();
            ctx.ellipse(0, -11, 3, 5, -0.2, 0, Math.PI * 2);
            ctx.ellipse(3, -10, 2.5, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = COLORS.snackJelly;
            ctx.strokeStyle = '#FF8FA3';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.quadraticCurveTo(-8, 3, -6, 8);
            ctx.quadraticCurveTo(0, 10, 6, 8);
            ctx.quadraticCurveTo(8, 3, 0, -9);
            ctx.fill();
            ctx.stroke();
        }

        // Sparkle
        if (Math.sin(this.bounceTimer * 2) > 0.5) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(8, -8, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}


// ─── Shallow Puddle (Hard mode — slows player 50%) ───────────
class ShallowPuddle {
    constructor(x) {
        this.type = 'shallow_puddle';
        this.x = x;
        this.width = randInt(80, 140);
        this.active = true;
        this.waveTimer = Math.random() * Math.PI * 2;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.waveTimer += 0.06;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x, y: GROUND_Y - 9, width: this.width, height: 12 };
    }

    draw(ctx) {
        ctx.save();
        // Water fill
        ctx.fillStyle = 'rgba(80, 170, 230, 0.55)';
        ctx.fillRect(this.x, GROUND_Y - 9, this.width, 12);

        // Wave lines
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= this.width; i += 12) {
            const wy = Math.sin(this.waveTimer + i * 0.15) * 2 - 5;
            if (i === 0) ctx.moveTo(this.x + i, GROUND_Y + wy);
            else ctx.lineTo(this.x + i, GROUND_Y + wy);
        }
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💧 얕은 물', this.x + this.width / 2, GROUND_Y - 14);
        ctx.restore();
    }
}

// ─── Deep Puddle (Hard mode — game over on contact) ──────────
class DeepPuddle {
    constructor(x) {
        this.type = 'deep_puddle';
        this.x = x;
        this.width = randInt(100, 160);
        this.active = true;
        this.waveTimer = Math.random() * Math.PI * 2;
        this.blinkTimer = 0;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.waveTimer += 0.05;
        this.blinkTimer += 0.1;
        if (this.x + this.width < -50) this.active = false;
    }

    getHitbox() {
        return { x: this.x, y: GROUND_Y - 10, width: this.width, height: 15 };
    }

    draw(ctx) {
        ctx.save();
        // Dark deep water
        ctx.fillStyle = 'rgba(0, 20, 70, 0.82)';
        ctx.fillRect(this.x, GROUND_Y - 10, this.width, 14);

        // Surface glint
        ctx.fillStyle = 'rgba(40, 100, 200, 0.5)';
        ctx.fillRect(this.x, GROUND_Y - 10, this.width, 4);

        // Danger wave
        ctx.strokeStyle = 'rgba(100, 160, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= this.width; i += 10) {
            const wy = Math.sin(this.waveTimer + i * 0.18) * 1.5 - 7;
            if (i === 0) ctx.moveTo(this.x + i, GROUND_Y + wy);
            else ctx.lineTo(this.x + i, GROUND_Y + wy);
        }
        ctx.stroke();

        // Warning label
        const blinkAlpha = 0.6 + Math.sin(this.blinkTimer) * 0.35;
        ctx.globalAlpha = blinkAlpha;
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ 깊은 물', this.x + this.width / 2, GROUND_Y - 15);
        ctx.restore();
    }
}


// ─── Goal Scene (2km Finish — Anna & Castle) ─────────────────
class GoalScene {
    constructor(x) {
        this.type = 'goal';
        this.x = x;
        this.width = 280;
        this.active = true;
        this.triggered = false;
        this.animTimer = 0;
    }

    update(scrollSpeed) {
        this.x -= scrollSpeed;
        this.animTimer++;
        if (this.x + this.width < -100) this.active = false;
    }

    getHitbox() {
        return null;
    }

    draw(ctx) {
        const gx = this.x;
        const groundY = GROUND_Y;
        const cx = gx + 80; // castle center x

        // ── Flower path ──────────────────────────────────────
        const flowerColors = ['#FF6B8A', '#FFD93D', '#C3F7C0', '#B5C0FF'];
        for (let i = 0; i < 8; i++) {
            const fx = gx + 8 + i * 30;
            ctx.fillStyle = '#74C69D';
            ctx.beginPath();
            ctx.moveTo(fx, groundY);
            ctx.lineTo(fx - 2, groundY - 14);
            ctx.lineTo(fx + 2, groundY - 14);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(fx, groundY - 18, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Castle base walls ─────────────────────────────────
        ctx.fillStyle = '#FFB3CC';
        ctx.fillRect(cx - 45, groundY - 95, 90, 95);

        // Left tower
        ctx.fillStyle = '#FF9EBB';
        ctx.fillRect(cx - 58, groundY - 85, 28, 85);
        // Right tower
        ctx.fillRect(cx + 30, groundY - 85, 28, 85);

        // Tower / main roof (triangles)
        ctx.fillStyle = '#C44569';
        // Left roof
        ctx.beginPath();
        ctx.moveTo(cx - 60, groundY - 85);
        ctx.lineTo(cx - 44, groundY - 112);
        ctx.lineTo(cx - 28, groundY - 85);
        ctx.closePath();
        ctx.fill();
        // Right roof
        ctx.beginPath();
        ctx.moveTo(cx + 28, groundY - 85);
        ctx.lineTo(cx + 44, groundY - 112);
        ctx.lineTo(cx + 60, groundY - 85);
        ctx.closePath();
        ctx.fill();
        // Main roof
        ctx.beginPath();
        ctx.moveTo(cx - 46, groundY - 95);
        ctx.lineTo(cx, groundY - 130);
        ctx.lineTo(cx + 46, groundY - 95);
        ctx.closePath();
        ctx.fill();

        // Battlements on main wall
        ctx.fillStyle = '#FF9EBB';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(cx - 38 + i * 18, groundY - 100, 10, 8);
        }

        // Gate (arched door)
        ctx.fillStyle = '#7B2D8B';
        ctx.beginPath();
        ctx.arc(cx, groundY - 25, 20, Math.PI, 0);
        ctx.lineTo(cx + 20, groundY);
        ctx.lineTo(cx - 20, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#B24DC8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, groundY - 25, 20, Math.PI, 0);
        ctx.stroke();

        // Windows
        ctx.fillStyle = '#FFF5CC';
        ctx.beginPath(); ctx.arc(cx - 44, groundY - 55, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 44, groundY - 55, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx - 20, groundY - 58, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 20, groundY - 58, 7, 0, Math.PI * 2); ctx.fill();

        // Window cross lines
        ctx.strokeStyle = '#C44569';
        ctx.lineWidth = 1.2;
        [[cx - 44, groundY - 55, 6], [cx + 44, groundY - 55, 6],
         [cx - 20, groundY - 58, 7], [cx + 20, groundY - 58, 7]].forEach(([wx, wy, r]) => {
            ctx.beginPath();
            ctx.moveTo(wx - r, wy); ctx.lineTo(wx + r, wy);
            ctx.moveTo(wx, wy - r); ctx.lineTo(wx, wy + r);
            ctx.stroke();
        });

        // Flag on main tower
        ctx.strokeStyle = '#D4A017';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, groundY - 130);
        ctx.lineTo(cx, groundY - 152);
        ctx.stroke();
        ctx.fillStyle = '#FF6B8A';
        ctx.beginPath();
        ctx.moveTo(cx, groundY - 152);
        ctx.lineTo(cx + 16, groundY - 145);
        ctx.lineTo(cx, groundY - 138);
        ctx.closePath();
        ctx.fill();

        // Castle label
        ctx.fillStyle = '#C44569';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 안나의 집!', cx, groundY - 138);

        // ── Anna character ────────────────────────────────────
        this._drawAnna(ctx, gx + 185, groundY, Math.sin(this.animTimer * 0.12) * 0.4);

        // ── Floating sparkles ─────────────────────────────────
        const t = this.animTimer * 0.05;
        const sparkCols = ['#FFD93D', '#FF6B8A', '#C3F7C0', '#B5C0FF'];
        for (let i = 0; i < 6; i++) {
            const sx = gx + 20 + i * 40 + Math.sin(t + i) * 5;
            const sy = groundY - 115 - Math.abs(Math.sin(t * 1.3 + i)) * 28;
            ctx.fillStyle = sparkCols[i % 4];
            ctx.globalAlpha = 0.6 + Math.sin(t * 2 + i) * 0.3;
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawAnna(ctx, x, groundY, waveAngle) {
        // Dress
        ctx.fillStyle = '#FFB7D5';
        ctx.beginPath();
        ctx.moveTo(x - 15, groundY);
        ctx.lineTo(x + 15, groundY);
        ctx.lineTo(x + 11, groundY - 38);
        ctx.lineTo(x - 11, groundY - 38);
        ctx.closePath();
        ctx.fill();

        // Torso
        ctx.fillStyle = '#FF90B3';
        ctx.fillRect(x - 9, groundY - 58, 18, 22);

        // Head
        ctx.fillStyle = '#FFDDB3';
        ctx.beginPath();
        ctx.arc(x, groundY - 70, 13, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#5C3317';
        ctx.beginPath();
        ctx.arc(x, groundY - 76, 13, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath(); ctx.arc(x - 13, groundY - 68, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 13, groundY - 68, 5, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#2D3748';
        ctx.beginPath(); ctx.arc(x - 5, groundY - 69, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, groundY - 69, 2, 0, Math.PI * 2); ctx.fill();

        // Smile
        ctx.strokeStyle = '#C8705A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, groundY - 63, 4, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // Cheeks
        ctx.fillStyle = 'rgba(255,150,160,0.4)';
        ctx.beginPath(); ctx.ellipse(x - 8, groundY - 65, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 8, groundY - 65, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

        // Waving arm (right, animated)
        ctx.save();
        ctx.translate(x + 9, groundY - 52);
        ctx.rotate(-waveAngle - 0.3);
        ctx.strokeStyle = '#FFDDB3';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -18);
        ctx.stroke();
        ctx.fillStyle = '#FFDDB3';
        ctx.beginPath();
        ctx.arc(0, -21, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Left arm
        ctx.strokeStyle = '#FFDDB3';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 9, groundY - 52);
        ctx.lineTo(x - 17, groundY - 40);
        ctx.stroke();

        // Legs
        ctx.beginPath(); ctx.moveTo(x - 4, groundY - 38); ctx.lineTo(x - 5, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 4, groundY - 38); ctx.lineTo(x + 5, groundY); ctx.stroke();
    }
}


// ─── Obstacle Manager ────────────────────────────────────────
export class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120;
        this.distance = 0;
        this.insideRain = false;
        this.triggerLightningEffect = false;
        this.checkpointTriggered = null;
        this.checkpointTriggeredX = null;
        this.snackCollected = null;
        this.lastCheckpointMilestone = 0;
        this.spawnPaused = false;
        this.goalSpawned = false;
        this.goalTriggered = false;
        this.difficulty = DIFFICULTY_EASY;
        this.insideShallowPuddle = false;
        this.insideDeepPuddle = false;
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120;
        this.distance = 0;
        this.insideRain = false;
        this.triggerLightningEffect = false;
        this.checkpointTriggered = null;
        this.checkpointTriggeredX = null;
        this.snackCollected = null;
        this.lastCheckpointMilestone = 0;
        this.spawnPaused = false;
        this.goalSpawned = false;
        this.goalTriggered = false;
        this.insideShallowPuddle = false;
        this.insideDeepPuddle = false;
    }

    update(scrollSpeed, player, dtFactor = 1) {
        this.distance += scrollSpeed;
        this.insideShallowPuddle = false;
        this.insideDeepPuddle = false;

        const clearDist = this.difficulty === DIFFICULTY_HARD ? HARD_GAME_CLEAR_DISTANCE : GAME_CLEAR_DISTANCE;

        // Spawn goal scene near finish
        if (!this.goalSpawned && this.getDistance() >= clearDist - 100) {
            this.goalSpawned = true;
            this.spawnPaused = true; // stop spawning new obstacles on approach
            this.obstacles.push(new GoalScene(CANVAS_WIDTH + 100));
        }

        // Spawn checkpoint when milestone is crossed (not at game-clear distance)
        const currentMilestone = Math.floor(this.getDistance() / CHECKPOINT_DISTANCE_INTERVAL) * CHECKPOINT_DISTANCE_INTERVAL;
        if (currentMilestone > this.lastCheckpointMilestone && currentMilestone < clearDist) {
            this.lastCheckpointMilestone = currentMilestone;
            this._spawnCheckpoint(currentMilestone);
        }

        // Spawn snacks randomly (not during safe zone)
        if (!this.spawnPaused && Math.random() < 0.005) {
            this._spawnSnack();
        }

        if (!this.spawnPaused) {
            this.spawnTimer += dtFactor;
            // Difficulty ramp: decrease spawn interval over distance
            const difficultyFactor = Math.min(this.distance / 15000, 1);
            const minInterval = 60 - difficultyFactor * 25;
            const maxInterval = 150 - difficultyFactor * 60;

            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnInterval = randInt(Math.floor(minInterval), Math.floor(maxInterval));
                this._spawnObstacle(difficultyFactor);
            }
        }

        // Update all obstacles
        let windPush = 0;
        this.insideRain = false;
        this.triggerLightningEffect = false;

        for (const obs of this.obstacles) {
            obs.update(scrollSpeed, dtFactor);

            // Special effect trigger for lightning
            if (obs.type === TYPES.LIGHTNING && obs.triggerFlashAndShake) {
                this.triggerLightningEffect = true;
                obs.triggerFlashAndShake = false; // consume
            }

            // Check collision with player
            if (player.alive) {
                const hitbox = obs.getHitbox();
                if (hitbox && checkCollision(player.getHitbox(), hitbox)) {
                    if (obs.type === TYPES.RAIN) {
                        this.insideRain = true;
                    } else if (obs.type === TYPES.WIND) {
                        windPush += obs.getPushForce();
                    } else if (obs.type === 'snack') {
                        obs.active = false; // consume
                        player.activateInvincibility(SNACK_INVINCIBLE_DURATION);
                        this.snackCollected = obs.snackType;
                    } else if (obs.type === 'checkpoint') {
                        // checkpoint logic is handled below
                    } else if (obs.type === TYPES.LIGHTNING) {
                        // lightning is visual-only, no damage
                    } else if (obs.type === 'shallow_puddle') {
                        this.insideShallowPuddle = true;
                    } else if (obs.type === 'deep_puddle') {
                        this.insideDeepPuddle = true;
                    } else {
                        // Dark cloud, animal, big animal = damage (unless invincible)
                        if (!player.invincible) {
                            player.hurt();
                        }
                    }
                }
            }

            // Check if player passed checkpoint
            if (obs.type === 'checkpoint' && !obs.triggered) {
                if (player.x >= obs.x) {
                    obs.triggered = true;
                    this.checkpointTriggered = obs.milestone;
                    this.checkpointTriggeredX = obs.x;
                }
            }

            // Check if player reached the goal scene
            if (obs.type === 'goal' && !obs.triggered) {
                if (obs.x <= PLAYER_START_X + 60) {
                    obs.triggered = true;
                    this.goalTriggered = true;
                }
            }
        }

        // Apply wind push to player
        if (windPush !== 0) {
            player.vx += windPush * 0.1;
        }

        // Clean up inactive obstacles
        this.obstacles = this.obstacles.filter(o => o.active);
    }

    clearNonCheckpointObstacles() {
        this.obstacles = this.obstacles.filter(o => o.type === 'checkpoint' || o.type === 'goal');
    }

    _spawnCheckpoint(milestone) {
        const x = CANVAS_WIDTH + 100;
        this.obstacles.push(new Checkpoint(x, milestone));
    }

    _spawnSnack() {
        const x = CANVAS_WIDTH + randInt(50, 150);
        // Spacing check
        const last = this.obstacles[this.obstacles.length - 1];
        if (last && x - last.x < 150) return;

        const y = Math.random() > 0.5 ? GROUND_Y - 30 : randInt(120, 260);
        const types = ['sunflower', 'carrot', 'jelly'];
        const selectedType = types[randInt(0, 2)];
        this.obstacles.push(new Snack(x, y, selectedType));
    }

    _spawnObstacle(difficulty) {
        const x = CANVAS_WIDTH + randInt(50, 150);

        // Weighted random selection based on difficulty
        const weights = [
            { type: TYPES.DARK_CLOUD, weight: 25 },
            { type: TYPES.ANIMAL, weight: 20 },
            { type: TYPES.BIG_ANIMAL, weight: 10 + difficulty * 10 },
            { type: TYPES.WIND, weight: 15 },
            { type: TYPES.RAIN, weight: 15 + difficulty * 5 },
            { type: TYPES.LIGHTNING, weight: 5 + difficulty * 10 },
        ];
        if (this.difficulty === DIFFICULTY_HARD) {
            weights.push({ type: 'shallow_puddle', weight: 18 });
            weights.push({ type: 'deep_puddle', weight: 10 });
        }

        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        let rand = Math.random() * totalWeight;
        let selectedType = TYPES.DARK_CLOUD;

        for (const w of weights) {
            rand -= w.weight;
            if (rand <= 0) {
                selectedType = w.type;
                break;
            }
        }

        // Check minimum spacing from last obstacle of same type
        const lastSame = [...this.obstacles].reverse().find(o => o.type === selectedType);
        if (lastSame && x - lastSame.x < 200) {
            return; // Too close, skip
        }

        switch (selectedType) {
            case TYPES.DARK_CLOUD:
                this.obstacles.push(new DarkCloud(x, randInt(80, 280)));
                break;
            case TYPES.RAIN:
                this.obstacles.push(new RainZone(x));
                break;
            case TYPES.WIND:
                this.obstacles.push(new WindGust(x, randInt(60, 250)));
                break;
            case TYPES.LIGHTNING:
                this.obstacles.push(new LightningStrike(x));
                break;
            case TYPES.ANIMAL:
                this.obstacles.push(new Animal(x));
                break;
            case TYPES.BIG_ANIMAL:
                this.obstacles.push(new BigAnimal(x));
                break;
            case 'shallow_puddle':
                this.obstacles.push(new ShallowPuddle(x));
                break;
            case 'deep_puddle':
                this.obstacles.push(new DeepPuddle(x));
                break;
        }
    }

    draw(ctx) {
        for (const obs of this.obstacles) {
            obs.draw(ctx);
        }
    }

    getDistance() {
        return Math.floor(this.distance / 10); // Convert to "meters"
    }
}

