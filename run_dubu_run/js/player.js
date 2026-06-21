/**
 * player.js — Cinnamoroll character: physics, jump/fly, animation
 * 달려라 두부 (Run Dubu Run!)
 */

import {
    GRAVITY, JUMP_FORCE, FLY_FORCE, MAX_FALL_SPEED,
    PLAYER_START_X, PLAYER_START_Y, PLAYER_WIDTH, PLAYER_HEIGHT,
    GROUND_Y, COLORS, clamp, getShrunkBox
} from './utils.js';

// Animation states
const STATE = {
    IDLE: 'idle',
    JUMPING: 'jumping',
    FLYING: 'flying',
    FALLING: 'falling',
    HURT: 'hurt',
};

export class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = PLAYER_START_X;
        this.y = PLAYER_START_Y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.vy = 0;
        this.vx = 0; // wind push
        this.state = STATE.IDLE;
        this.onGround = false;
        this.onCloud = false;
        this.alive = true;
        this.hurtTimer = 0;
        this.hurtFlash = 0;
        this.invincible = false;
        this.invincibleTimer = 0;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.flapAngle = 0;
        this.earBounce = 0;
        this.tailWag = 0;
        this.squish = { x: 1, y: 1 };
        this.particles = [];
    }

    jump() {
        if (this.alive) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
            this.onCloud = false;
            this.state = STATE.JUMPING;
            // Squish effect
            this.squish = { x: 0.8, y: 1.3 };
            // Spawn jump particles
            this._spawnJumpParticles();
        }
    }

    fly() {
        if (this.alive) {
            this.vy = clamp(this.vy + FLY_FORCE, -15, MAX_FALL_SPEED);
            this.state = STATE.FLYING;
            this.flapAngle = -0.3;
            // Spawn sparkle particles
            this._spawnFlyParticles();
        }
    }

    hurt() {
        if (this.invincible || !this.alive) return false;
        this.alive = false;
        this.state = STATE.HURT;
        this.hurtTimer = 60;
        this.vy = JUMP_FORCE * 0.7;
        return true;
    }

    activateInvincibility(duration = 180) {
        this.invincible = true;
        this.invincibleTimer = duration;
    }


    getHitbox() {
        return getShrunkBox({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        }, 8, 6);
    }

    update(cloudPlatforms) {
        if (!this.alive && this.hurtTimer > 0) {
            this.hurtTimer--;
            this.hurtFlash = (this.hurtFlash + 1) % 6;
        }

        // Invincibility frames
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
            if (this.animTimer % 6 === 0) {
                this._spawnInvincibleParticles();
            }
        }

        // Apply gravity
        this.vy += GRAVITY;
        this.vy = clamp(this.vy, -20, MAX_FALL_SPEED);

        // Apply wind push
        if (this.vx !== 0) {
            this.x += this.vx;
            this.vx *= 0.88; // stronger friction to reduce persistent drift
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Spring back toward natural x position to prevent wind-induced drift
        this.x += (PLAYER_START_X - this.x) * 0.025;

        // Keep player in horizontal bounds
        this.x = clamp(this.x, 20, 200);

        // Move vertically
        this.y += this.vy;

        // Ground collision
        this.onGround = false;
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
            if (this.state === STATE.JUMPING || this.state === STATE.FALLING) {
                this.state = STATE.IDLE;
                this.squish = { x: 1.2, y: 0.8 }; // Land squish
            }
        }

        // Cloud platform collision (only when falling)
        this.onCloud = false;
        if (this.vy > 0 && cloudPlatforms) {
            for (const cloud of cloudPlatforms) {
                if (
                    this.x + this.width > cloud.x + 10 &&
                    this.x < cloud.x + cloud.width - 10 &&
                    this.y + this.height >= cloud.y &&
                    this.y + this.height <= cloud.y + cloud.height * 0.5 + this.vy
                ) {
                    this.y = cloud.y - this.height;
                    this.vy = 0;
                    this.onCloud = true;
                    this.onGround = true; // treat cloud as ground for jumping
                    if (this.state !== STATE.IDLE) {
                        this.state = STATE.IDLE;
                        this.squish = { x: 1.15, y: 0.85 };
                    }
                    break;
                }
            }
        }

        // Ceiling
        if (this.y < 10) {
            this.y = 10;
            this.vy = 1;
        }

        // Update state
        if (this.alive) {
            if (!this.onGround && this.vy > 2 && this.state !== STATE.FLYING) {
                this.state = STATE.FALLING;
            }
        }

        // Animation updates
        this.animTimer++;
        this._updateAnimation();
        this._updateParticles();

        // Recover squish
        this.squish.x += (1 - this.squish.x) * 0.15;
        this.squish.y += (1 - this.squish.y) * 0.15;
    }

    _updateAnimation() {
        // Ear bounce
        if (this.state === STATE.IDLE) {
            this.earBounce = Math.sin(this.animTimer * 0.08) * 2;
        } else if (this.state === STATE.FLYING) {
            this.earBounce = Math.sin(this.animTimer * 0.3) * 5;
        } else {
            this.earBounce = Math.sin(this.animTimer * 0.15) * 3;
        }

        // Tail wag
        this.tailWag = Math.sin(this.animTimer * 0.12) * 8;

        // Flap angle recovery
        this.flapAngle *= 0.9;
    }

    _spawnJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * -2,
                life: 20 + Math.random() * 10,
                maxLife: 30,
                size: 3 + Math.random() * 3,
                color: COLORS.cloud,
                type: 'puff',
            });
        }
    }

    _spawnFlyParticles() {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 15,
                y: this.y + this.height * 0.5 + (Math.random() - 0.5) * 10,
                vx: -1 - Math.random() * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 15 + Math.random() * 10,
                maxLife: 25,
                size: 2 + Math.random() * 2,
                color: COLORS.starYellow,
                type: 'sparkle',
            });
        }
    }

    _spawnInvincibleParticles() {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                vx: -1 - Math.random() * 1.5,
                vy: (Math.random() - 0.5) * 1.5 - 0.5,
                life: 15 + Math.random() * 10,
                maxLife: 25,
                size: 2.5 + Math.random() * 2.5,
                color: COLORS.invincibleGlow,
                type: 'sparkle',
            });
        }
    }


    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /** Update only animation timers — used when game is in RESTING state */
    updateAnimationOnly() {
        this.animTimer++;
        this._updateAnimation();
        this._updateParticles();
        this.squish.x += (1 - this.squish.x) * 0.15;
        this.squish.y += (1 - this.squish.y) * 0.15;
    }

    draw(ctx) {
        ctx.save();

        // Hurt flash effect
        if (!this.alive && this.hurtFlash < 3) {
            ctx.globalAlpha = 0.4;
        }
        if (this.invincible && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);
        ctx.scale(this.squish.x, this.squish.y);

        // Tilt based on velocity
        let tilt = 0;
        if (this.state === STATE.FLYING) tilt = -0.15;
        else if (this.state === STATE.FALLING) tilt = 0.1;
        else if (this.state === STATE.HURT) tilt = this.animTimer * 0.3;
        ctx.rotate(tilt);

        const w = this.width;
        const h = this.height;

        // ─── Draw Hamster 두부 ───
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(2, h * 0.45, w * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold Invincible Aura
        if (this.invincible) {
            ctx.save();
            ctx.strokeStyle = COLORS.invincibleGlow;
            ctx.lineWidth = 3;
            ctx.shadowColor = COLORS.invincibleGlow;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = 0.5 + Math.sin(this.animTimer * 0.15) * 0.25;
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.62, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Tail (back)
        ctx.save();
        ctx.translate(w * 0.42, h * 0.22);
        ctx.rotate((this.tailWag * Math.PI) / 180);
        ctx.fillStyle = COLORS.hamsterEar;
        ctx.strokeStyle = COLORS.hamsterBodyDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Body (main orange/cream hamster body)
        ctx.fillStyle = COLORS.hamsterBody;
        ctx.strokeStyle = COLORS.hamsterBodyDark;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, h * 0.05, w * 0.48, h * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tummy (white patch)
        ctx.fillStyle = COLORS.hamsterTummy;
        ctx.beginPath();
        ctx.ellipse(0, h * 0.15, w * 0.28, h * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left ear
        ctx.save();
        ctx.translate(-w * 0.22, -h * 0.32);
        ctx.rotate((-10 + this.earBounce) * Math.PI / 180);
        ctx.fillStyle = COLORS.hamsterBody;
        ctx.strokeStyle = COLORS.hamsterBodyDark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner ear
        ctx.fillStyle = COLORS.hamsterEar;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right ear
        ctx.save();
        ctx.translate(w * 0.22, -h * 0.32);
        ctx.rotate((10 - this.earBounce) * Math.PI / 180);
        ctx.fillStyle = COLORS.hamsterBody;
        ctx.strokeStyle = COLORS.hamsterBodyDark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner ear
        ctx.fillStyle = COLORS.hamsterEar;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Eyes
        const eyeSpacing = 7;
        const eyeY = -h * 0.05;
        // Left eye
        ctx.fillStyle = '#4A4453';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing, eyeY, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.ellipse(eyeSpacing, eyeY, 3, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing + 1, eyeY - 1.5, 1.2, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing + 1, eyeY - 1.5, 1.2, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cheek pouches (puffy cheeks)
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.ellipse(-w * 0.28, h * 0.06, 6, 4.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.28, h * 0.06, 6, 4.5, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Tiny pink nose
        ctx.fillStyle = COLORS.hamsterEar;
        ctx.beginPath();
        ctx.moveTo(0, eyeY + 1);
        ctx.lineTo(-2, eyeY - 1);
        ctx.lineTo(2, eyeY - 1);
        ctx.closePath();
        ctx.fill();

        // Mouth (small smile)
        ctx.strokeStyle = '#4A4453';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-1.5, eyeY + 3, 2, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(1.5, eyeY + 3, 2, 0, Math.PI);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = 'rgba(74, 68, 83, 0.4)';
        ctx.lineWidth = 1;
        // Left whiskers
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, eyeY + 1);
        ctx.lineTo(-w * 0.42, eyeY);
        ctx.moveTo(-w * 0.22, eyeY + 3);
        ctx.lineTo(-w * 0.40, eyeY + 5);
        ctx.stroke();
        // Right whiskers
        ctx.beginPath();
        ctx.moveTo(w * 0.22, eyeY + 1);
        ctx.lineTo(w * 0.42, eyeY);
        ctx.moveTo(w * 0.22, eyeY + 3);
        ctx.lineTo(w * 0.40, eyeY + 5);
        ctx.stroke();

        // Hand paws (front)
        ctx.fillStyle = COLORS.hamsterTummy;
        ctx.strokeStyle = COLORS.hamsterBodyDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-w * 0.18, h * 0.18, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.18, h * 0.18, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Foot paws (bottom, showing run cycle or jumping)
        let footOffset = 0;
        if (this.state === STATE.IDLE || this.onGround) {
            footOffset = Math.sin(this.animTimer * 0.2) * 2;
        }
        ctx.fillStyle = COLORS.hamsterEar;
        ctx.beginPath();
        ctx.ellipse(-w * 0.25, h * 0.42 + footOffset, 5, 3.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.25, h * 0.42 - footOffset, 5, 3.5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wings (only when flying — visible from 2nd tap / multi-tap onward)
        if (this.state === STATE.FLYING) {
            const wingAngle = Math.sin(this.animTimer * 0.4) * 20;

            ctx.save();
            ctx.translate(-w * 0.35, -h * 0.05);
            ctx.rotate((wingAngle - 30) * Math.PI / 180);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = COLORS.hamsterBodyDark;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 12, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(w * 0.35, -h * 0.05);
            ctx.rotate((-wingAngle + 30) * Math.PI / 180);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.strokeStyle = COLORS.hamsterBodyDark;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 12, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();

        // Draw particles
        this._drawParticles(ctx);
    }

    _drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;

            if (p.type === 'sparkle') {
                // Star sparkle
                ctx.fillStyle = p.color;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 0.2);
                const s = p.size * alpha;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
                }
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            } else {
                // Puff cloud
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
}
