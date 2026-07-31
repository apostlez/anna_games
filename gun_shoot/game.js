import Player from './js/player.js';
import { BulletGroup, WEAPON_TYPES, WEAPON_CONFIGS } from './js/bullets.js';
import { EnemyGroup, ENEMY_TYPES } from './js/enemies.js';
import { ItemGroup, ITEM_TYPES, CHARGEABLE_ITEM_TYPES } from './js/items.js';

// ============================================================
//  BOOT SCENE
// ============================================================
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('TitleScene');
    }
}

// ============================================================
//  TITLE SCENE (시작 대기 화면)
// ============================================================
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0b0b16');

        // 배경 별
        const g = this.add.graphics();
        for (let i = 0; i < 90; i++) {
            const x = Phaser.Math.Between(0, 480);
            const y = Phaser.Math.Between(0, 800);
            const r = Math.random() < 0.3 ? 2 : 1;
            g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.9));
            g.fillCircle(x, y, r);
        }

        // 우주선 아이콘
        const ship = this.add.text(240, 250, '🚀', { font: '90px Arial' }).setOrigin(0.5);
        this.tweens.add({ targets: ship, y: 230, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // 타이틀
        this.add.text(240, 370, 'SPACE SHOOTER', {
            font: 'bold 40px Arial', fill: '#00ffff', stroke: '#003344', strokeThickness: 6
        }).setOrigin(0.5);
        this.add.text(240, 415, '👾 ROGUELIKE 👾', { font: '18px Arial', fill: '#00ff88' }).setOrigin(0.5);

        // 조작 안내
        this.add.text(240, 520, '좌우로 이동하며 적을 물리치세요', { font: '16px Arial', fill: '#cccccc' }).setOrigin(0.5);
        this.add.text(240, 548, '터치 / 마우스 · ← → · A D', { font: '14px Arial', fill: '#888888' }).setOrigin(0.5);

        // 시작 안내 (깜빡임)
        const start = this.add.text(240, 650, '👉 터치하여 시작 👈', {
            font: 'bold 24px Arial', fill: '#ffff00'
        }).setOrigin(0.5);
        this.tweens.add({ targets: start, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

        // 입력 시 게임 시작
        this.input.on('pointerdown', () => this.scene.start('MainGameScene'));
        this.input.keyboard.on('keydown', () => this.scene.start('MainGameScene'));
    }
}

// ============================================================
//  MAIN GAME SCENE
// ============================================================
class MainGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGameScene' });
    }

    init() {
        this.score = 0;
        this.difficulty = 1.0;
        this.lastFired = 0;
        this.currentWeapon = WEAPON_TYPES.PISTOL;
        this.statsModifier = { damageMult: 1.0, speedMult: 1.0, cooldownMult: 1.0 };
        this.powerStacks = 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0b0b16');
        this._createStarfield();

        // 물리 그룹 - 직접 인스턴스 생성으로 풀 구성
        this.bulletsGroup = new BulletGroup(this);
        this.enemiesGroup = new EnemyGroup(this);
        this.itemsGroup = new ItemGroup(this);

        // 플레이어
        this.player = new Player(this, 240, 700);

        // 충돌 판정: Phaser 그룹 collider/RTree 는 Text 기반 + 풀링 body 에서
        // 신뢰성 있게 동작하지 않으므로 update() 에서 직접 AABB pairwise 검사한다.

        // 적 스폰 타이머 (1.6초 간격)
        this.spawnTimer = this.time.addEvent({
            delay: 1600,
            callback: this._spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // 난이도 상승 타이머 (15초마다)
        this.diffTimer = this.time.addEvent({
            delay: 15000,
            callback: () => {
                this.difficulty += 0.15;
                const nd = Math.max(600, 1600 - (this.difficulty - 1) * 300);
                this.spawnTimer.reset({ delay: nd, callback: this._spawnEnemy, callbackScope: this, loop: true });
            },
            loop: true
        });

        // 적 처치와 별개로, 하늘에서 아이템이 주기적으로 직접 스폰되는 타이머 (5초 간격)
        this.itemSpawnTimer = this.time.addEvent({
            delay: 5000,
            callback: this._spawnRandomItem,
            callbackScope: this,
            loop: true
        });

        // 쉴 수 있는 지원 행성 (눈에 띄게 크고, 방문하면 상점/휴게소 이용 가능) - 25초 간격으로 스폰 시도
        this._createSupportPlanet();
        this.planetSpawnTimer = this.time.addEvent({
            delay: 25000,
            callback: this._spawnPlanet,
            callbackScope: this,
            loop: true
        });

        // 이벤트 리스너
        this.events.on('enemy-killed', this._onEnemyKilled, this);
        this.events.on('enemy-escaped', this._onEnemyEscaped, this);
        this.events.on('player-levelup', this._onLevelUp, this);

        // HUD
        this._createHUD();
    }

    update(time, delta) {
        if (!this.player || this.player.hp <= 0) return;

        // 배경 별 스크롤 (아래쪽으로 흐르는 효과, 근경이 원경보다 빠르게 이동)
        this.starsFar.tilePositionY -= this.starScrollSpeeds.far * (delta / 1000);
        this.starsNear.tilePositionY -= this.starScrollSpeeds.near * (delta / 1000);

        this.player.update();

        // 적 이동 수동 업데이트 (Phaser.GameObjects.Text 상속 시 자동 호출 안 됨)
        this.enemiesGroup.getChildren().forEach(e => {
            if (e.active) e.update(time, delta);
        });

        // 아이템 이동 수동 업데이트
        this.itemsGroup.getChildren().forEach(it => {
            if (it.active) it.update(time, delta);
        });

        // 탄환 이동 수동 업데이트
        this.bulletsGroup.getChildren().forEach(b => {
            if (b.active) b.update(time, delta);
        });

        // 지원 행성 이동 및 화면 이탈 처리
        if (this.planet.active && this.planet.y > 900) {
            this._deactivatePlanet();
        }

        // 충돌 판정 - body 경계 AABB 직접 검사 (Phaser 그룹 collider/트리 우회)
        this._checkCollisions();

        // 자동 사격
        const cfg = WEAPON_CONFIGS[this.currentWeapon];
        const interval = cfg.cooldown * this.statsModifier.cooldownMult;
        if (time - this.lastFired > interval) {
            this._shoot(this.player.x, this.player.y - 20);
            this.lastFired = time;
        }

        this._updateHUD();
    }

    // ----- 내부 메서드 -----

    // body 경계 AABB 겹침 검사 (Phaser 트리 미사용, 순수 좌표 비교)
    _bodiesOverlap(a, b) {
        const ba = a.body, bb = b.body;
        return ba.right > bb.left && ba.left < bb.right &&
               ba.bottom > bb.top && ba.top < bb.bottom;
    }

    _checkCollisions() {
        const bullets = this.bulletsGroup.getChildren();
        const enemies = this.enemiesGroup.getChildren();
        const items = this.itemsGroup.getChildren();

        // 탄환 vs 적
        for (const bl of bullets) {
            if (!bl.active) continue;
            for (const en of enemies) {
                if (!en.active) continue;
                if (this._bodiesOverlap(bl, en)) {
                    this._onBulletHitEnemy(bl, en);
                    if (!bl.active) break; // 비관통 탄환은 소멸했으므로 다음 탄환으로
                }
            }
        }

        // 탄환 vs 충전형 아이템 (POWER / ATTACK_SPEED, 맞출 때마다 충전되어 획득 시 효과가 커진다)
        for (const bl of bullets) {
            if (!bl.active) continue;
            for (const it of items) {
                if (it.active && CHARGEABLE_ITEM_TYPES.includes(it.itemType) && this._bodiesOverlap(bl, it)) {
                    this._onBulletHitChargeableItem(bl, it);
                    if (!bl.active) break;
                }
            }
        }

        // 플레이어 vs 적
        if (this.player.active) {
            for (const en of enemies) {
                if (en.active && this._bodiesOverlap(this.player, en)) {
                    this._onPlayerHitEnemy(this.player, en);
                    if (!this.player.active) break;
                }
            }
        }

        // 플레이어 vs 아이템
        if (this.player.active) {
            for (const it of items) {
                if (it.active && this._bodiesOverlap(this.player, it)) {
                    this._onPlayerPickItem(this.player, it);
                }
            }
        }

        // 플레이어 vs 지원 행성 (방문하면 상점/휴게소 이용 가능)
        if (this.player.active && this.planet.active && !this.planet.visited &&
            this._bodiesOverlap(this.player, this.planet)) {
            this._onPlayerVisitPlanet();
        }
    }

    _createStarfield() {
        // 반복 타일링 가능한 별 텍스처 2종(원경/근경)을 절차적으로 생성
        this._generateStarTexture('starsFarTex', 240, 26, 1, 0.5);
        this._generateStarTexture('starsNearTex', 240, 16, 2, 0.9);

        // TileSprite 로 화면 전체를 덮고, tilePositionY 를 매 프레임 증가시켜 아래로 스크롤되는 효과 연출
        this.starsFar = this.add.tileSprite(240, 400, 480, 800, 'starsFarTex').setDepth(-20);
        this.starsNear = this.add.tileSprite(240, 400, 480, 800, 'starsNearTex').setDepth(-19);

        // 스크롤 속도 (px/sec), 근경이 원경보다 빠르게 움직여 시차(패럴랙스) 효과
        this.starScrollSpeeds = { far: 25, near: 70 };
    }

    // 지정한 크기의 정사각형 별 텍스처를 생성 (이미 존재하면 재생성하지 않음)
    _generateStarTexture(key, size, count, maxRadius, maxAlpha) {
        if (this.textures.exists(key)) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(0, size);
            const y = Phaser.Math.Between(0, size);
            const r = Math.random() < 0.3 ? maxRadius : 1;
            const a = Phaser.Math.FloatBetween(0.3, maxAlpha);
            g.fillStyle(0xffffff, a);
            g.fillCircle(x, y, r);
        }
        g.generateTexture(key, size, size);
        g.destroy();
    }

    _shoot(x, y) {
        const cfg = WEAPON_CONFIGS[this.currentWeapon];
        const fd = {
            ...cfg,
            damage: Math.round(cfg.damage * this.statsModifier.damageMult),
            speed: cfg.speed * this.statsModifier.speedMult
        };
        const base = -Math.PI / 2;

        if (fd.count === 1) {
            const b = this.bulletsGroup.getChildren().find(b => !b.active);
            if (b) b.fire(x, y, base, fd);
        } else {
            const start = base - ((fd.count - 1) * fd.spread) / 2;
            for (let i = 0; i < fd.count; i++) {
                const b = this.bulletsGroup.getChildren().find(b => !b.active);
                if (b) b.fire(x, y, start + i * fd.spread, fd);
            }
        }
    }

    _spawnEnemy() {
        const x = Phaser.Math.Between(40, 440);
        const roll = Math.random();
        let type = ENEMY_TYPES.BASIC;
        if (this.difficulty > 2.2 && roll < 0.08) type = ENEMY_TYPES.BOSS;
        else if (this.difficulty > 1.4 && roll < 0.30) type = ENEMY_TYPES.HEAVY;
        else if (roll < 0.55) type = ENEMY_TYPES.SWIFT;
        else if (roll < 0.75) type = ENEMY_TYPES.ASTEROID;

        const pool = this.enemiesGroup.getChildren();
        const active = pool.filter(e => e.active).length;
        const e = pool.find(e => !e.active);

        console.log(`[SPAWN] type=${type} x=${x} poolSize=${pool.length} active=${active} found=${!!e}`);

        if (e) {
            e.spawn(x, -30, type, this.difficulty);
            // 플레이어 레벨에 비례해 적 체력 추가 증가 (레벨당 +12%, 속도/점수/경험치는 영향 없음)
            const levelHpMult = 1 + (this.player.level - 1) * 0.12;
            e.hp = Math.round(e.hp * levelHpMult);
            e.maxHp = e.hp;
            console.log(`[SPAWN OK] pos=(${e.x},${e.y}) active=${e.active} visible=${e.visible}`);
        } else {
            console.warn('[SPAWN FAIL] 풀에 사용 가능한 적 없음');
        }
    }

    _onBulletHitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        if (bullet.penetrate) {
            if (bullet.hitEnemies.has(enemy)) return;
            bullet.hitEnemies.add(enemy);
        } else {
            bullet.deactivate();
        }
        enemy.takeDamage(bullet.damage);
    }

    _onPlayerHitEnemy(player, enemy) {
        if (!enemy.active) return;
        player.takeDamage(enemy.contactDamage ?? 20);
        enemy.die();
        this._checkGameOver();
    }

    // 탄환에 맞은 충전형 아이템(POWER/ATTACK_SPEED)은 충전 단계가 오르며, 충전된 채로 획득하면 효과가 커진다
    _onBulletHitChargeableItem(bullet, item) {
        if (!bullet.active || !item.active) return;
        if (bullet.penetrate) {
            if (bullet.hitItems.has(item)) return;
            bullet.hitItems.add(item);
        } else {
            bullet.deactivate();
        }
        item.setCharge(item.chargeLevel + 1);
        this._floatText(item.x, item.y - 20, `충전 +1 (${item.chargeLevel})`, '#ffcc00');
    }

    _onPlayerPickItem(player, item) {
        if (!item.active) return;
        switch (item.itemType) {
            case ITEM_TYPES.EXP:
                player.gainExp(item.value);
                this._floatText(item.x, item.y, `+${item.value} EXP 💎`, '#00ffff');
                break;
            case ITEM_TYPES.HEAL:
                player.hp = Math.min(player.hp + item.value, player.maxHp);
                this._floatText(item.x, item.y, `+${item.value} HP ❤️`, '#ff3366');
                break;
            case ITEM_TYPES.WEAPON: {
                const opts = Object.values(WEAPON_TYPES).filter(w => w !== this.currentWeapon);
                this.currentWeapon = Phaser.Utils.Array.GetRandom(opts);
                this._floatText(player.x, player.y - 40, `${WEAPON_CONFIGS[this.currentWeapon].name} 획득!`, '#ffff00');
                break;
            }
            case ITEM_TYPES.POWER: {
                const bonus = 0.1 * (1 + item.chargeLevel * 0.5); // 충전 단계(-10~10) 당 추가/감소 50% 보너스
                this.powerStacks++;
                this.statsModifier.damageMult = Math.max(0.1, this.statsModifier.damageMult + bonus);
                const pct = Math.round(bonus * 100);
                const sign = pct >= 0 ? '+' : '';
                const color = pct >= 0 ? '#ffcc00' : '#ff4444';
                this._floatText(item.x, item.y, `POWER! 데미지 ${sign}${pct}% ⚡`, color);
                break;
            }
            case ITEM_TYPES.ATTACK_SPEED: {
                const factor = 0.1 * (1 + item.chargeLevel * 0.5); // POWER 와 동일한 공식, 양수면 공속 증가(쿨다운 감소)
                this.statsModifier.cooldownMult = Phaser.Math.Clamp(this.statsModifier.cooldownMult - factor, 0.2, 3.0);
                const pct = Math.round(factor * 100);
                const sign = pct >= 0 ? '+' : '';
                const color = pct >= 0 ? '#00ffcc' : '#ff4444';
                this._floatText(item.x, item.y, `공속 ${sign}${pct}% 💨`, color);
                break;
            }
        }
        item.deactivate();
    }

    _onEnemyKilled(info) {
        // enemies.js 의 die()는 scoreValue / expValue 키로 emit
        const score = info.scoreValue ?? info.scoreVal ?? 0;
        const exp = info.expValue ?? info.expVal ?? 0;
        this.score += score;
        console.log(`[KILL] type=${info.type} score+${score} total=${this.score}`);

        const rand = Math.random();
        if (info.type === ENEMY_TYPES.BOSS) {
            this._dropItem(info.x, info.y, ITEM_TYPES.WEAPON, 0);
            this._dropItem(info.x - 30, info.y, ITEM_TYPES.HEAL, 50);
            this._dropItem(info.x + 30, info.y, ITEM_TYPES.EXP, exp);
            this._dropItem(info.x, info.y - 30, ITEM_TYPES.POWER, 0);
            this._dropItem(info.x - 30, info.y - 30, ITEM_TYPES.ATTACK_SPEED, 0);
        } else {
            if (rand < 0.65) this._dropItem(info.x, info.y, ITEM_TYPES.EXP, exp);
            else if (rand < 0.75) this._dropItem(info.x, info.y, ITEM_TYPES.HEAL, 25);
            else if (rand < 0.83) this._dropItem(info.x, info.y, ITEM_TYPES.WEAPON, 0);
            else if (rand < 0.90) this._dropItem(info.x, info.y, ITEM_TYPES.POWER, 0);
            else if (rand < 0.97) this._dropItem(info.x, info.y, ITEM_TYPES.ATTACK_SPEED, 0);
        }
    }

    _onEnemyEscaped() {
        // 적이 화면 아래로 지나쳐 이탈해도 플레이어는 피해를 입지 않는다
    }

    // 눈에 띄게 큰 지원 행성 오브젝트를 하나 생성해두고, 스폰 시점마다 재활용한다 (풀링과 동일한 패턴)
    _createSupportPlanet() {
        this.planet = this.add.text(240, -120, '🪐', { font: '72px Arial' }).setOrigin(0.5);
        this.physics.add.existing(this.planet);
        this.planet.body.setSize(70, 70);
        this.planet.body.enable = false;
        this.planet.setActive(false).setVisible(false);
        this.planet.visited = false;
    }

    // 지원 행성 스폰 (이미 화면에 떠 있으면 중복 생성하지 않는다)
    _spawnPlanet() {
        if (this.planet.active) return;
        const x = Phaser.Math.Between(140, 340);
        this.planet.setPosition(x, -120);
        this.planet.visited = false;
        this.planet.setActive(true).setVisible(true);
        this.planet.body.enable = true;
        this.planet.body.setVelocity(0, 35); // 아주 천천히 하강해 방문할 시간을 충분히 준다
    }

    _deactivatePlanet() {
        this.planet.setActive(false).setVisible(false);
        this.planet.body.enable = false;
        this.planet.body.setVelocity(0, 0);
    }

    // 플레이어가 지원 행성에 도달하면 게임을 일시정지하고 상점/휴게소 화면을 띄운다
    _onPlayerVisitPlanet() {
        this.planet.visited = true;
        this.planet.body.setVelocity(0, 0);
        this.scene.pause('MainGameScene');
        this.scene.launch('StationScene', { mainScene: this });
    }

    // StationScene 에서 "출발" 선택 시 호출되어 행성을 정리하고 게임을 재개한다
    _onLeavePlanet() {
        this._deactivatePlanet();
        this.scene.resume();
    }

    _onLevelUp(_level) {
        this.scene.pause('MainGameScene');
        this.scene.launch('UpgradeScene', { mainScene: this });
    }

    _dropItem(x, y, type, value) {
        const it = this.itemsGroup.getChildren().find(i => !i.active);
        if (it) {
            const minCharge = CHARGEABLE_ITEM_TYPES.includes(type) ? this._chargeableItemMinCharge() : -10;
            it.spawn(x, y, type, value, minCharge);
        }
    }

    // 플레이어 레벨이 오를수록 POWER/ATTACK_SPEED 아이템의 최초 충전 최저값이 상승한다 (레벨당 +1, 최대 10)
    // -> 레벨이 높아질수록 획득 시 페널티(음수 충전)가 걸릴 위험이 줄어든다
    _chargeableItemMinCharge() {
        const level = this.player ? this.player.level : 1;
        return Phaser.Math.Clamp(-10 + (level - 1) * 1, -10, 10);
    }

    // 적 처치와 별개로, 하늘에서 아이템이 직접 떨어지는 연출 (5초 간격)
    _spawnRandomItem() {
        const x = Phaser.Math.Between(40, 440);
        const roll = Math.random();
        if (roll < 0.30) this._dropItem(x, -30, ITEM_TYPES.POWER, 0);
        else if (roll < 0.55) this._dropItem(x, -30, ITEM_TYPES.ATTACK_SPEED, 0);
        else if (roll < 0.75) this._dropItem(x, -30, ITEM_TYPES.HEAL, 20);
        else if (roll < 0.88) this._dropItem(x, -30, ITEM_TYPES.WEAPON, 0);
        else this._dropItem(x, -30, ITEM_TYPES.EXP, 15);
    }

    _floatText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            font: 'bold 16px Arial',
            fill: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }

    _createHUD() {
        this.hudGfx = this.add.graphics();
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', { font: 'bold 20px Arial', fill: '#ffffff' });
        this.levelText = this.add.text(20, 50, 'LV. 1', { font: '16px Arial', fill: '#00ff88' });
        this.hpLabel = this.add.text(20, 92, 'HP', { font: '12px Arial', fill: '#ff3366' });
        this.weaponText = this.add.text(460, 20, WEAPON_CONFIGS[this.currentWeapon].name,
            { font: '16px Arial', fill: '#ffff00' }).setOrigin(1, 0);
        this.powerText = this.add.text(460, 44, '⚡ POWER 100%',
            { font: '14px Arial', fill: '#ffcc00' }).setOrigin(1, 0);
        this.atkSpeedText = this.add.text(460, 64, '💨 공격 속도 100%',
            { font: '14px Arial', fill: '#00ffcc' }).setOrigin(1, 0);
    }

    _updateHUD() {
        if (!this.player) return;
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.levelText.setText(`LV. ${this.player.level}`);
        this.weaponText.setText(WEAPON_CONFIGS[this.currentWeapon].name);
        this.powerText.setText(`⚡ POWER ${Math.round(this.statsModifier.damageMult * 100)}%`);
        this.atkSpeedText.setText(`💨 공격 속도 ${Math.round(100 / this.statsModifier.cooldownMult)}%`);

        this.hudGfx.clear();
        // EXP 바 (최상단)
        const ep = this.player.exp / this.player.expToNextLevel;
        this.hudGfx.fillStyle(0x111133, 0.9); this.hudGfx.fillRect(0, 0, 480, 7);
        this.hudGfx.fillStyle(0x00aaff, 1); this.hudGfx.fillRect(0, 0, 480 * ep, 7);
        // HP 바
        const hp = this.player.hp / this.player.maxHp;
        this.hudGfx.fillStyle(0x442222, 0.9); this.hudGfx.fillRect(20, 80, 180, 12);
        this.hudGfx.fillStyle(hp > 0.4 ? 0xff3366 : 0xff0000, 1); this.hudGfx.fillRect(20, 80, 180 * hp, 12);
    }

    _checkGameOver() {
        if (this.player.hp <= 0) {
            this.player.setActive(false).setVisible(false);
            this.player.body.enable = false;
            this.spawnTimer.destroy();
            this.diffTimer.destroy();
            this.itemSpawnTimer.destroy();
            this.planetSpawnTimer.destroy();
            this.time.delayedCall(800, () => {
                this.scene.start('GameOverScene', { score: this.score, level: this.player.level });
            });
        }
    }
}

// ============================================================
//  UPGRADE SCENE
// ============================================================
class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    create(data) {
        this.mainScene = data.mainScene;
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, 480, 800);

        this.add.text(240, 160, 'LEVEL UP! ⚡', { font: 'bold 38px Arial', fill: '#00ffff' }).setOrigin(0.5);
        this.add.text(240, 215, '강화할 능력을 선택하세요', { font: '18px Arial', fill: '#aaaaaa' }).setOrigin(0.5);

        const options = [
            { title: '🔥 화력 강화', desc: '공격력 +25%', apply: () => { this.mainScene.statsModifier.damageMult += 0.25; } },
            { title: '⚡ 속사 훈련', desc: '공격 속도 +20%', apply: () => { this.mainScene.statsModifier.cooldownMult *= 0.8; } },
            { title: '👟 기동성 향상', desc: '이동 속도 +40', apply: () => { this.mainScene.player.speed += 40; } },
            {
                title: '❤️ 생명력 보강', desc: '최대 HP +20% & 완전 회복', apply: () => {
                    this.mainScene.player.maxHp = Math.round(this.mainScene.player.maxHp * 1.2);
                    this.mainScene.player.hp = this.mainScene.player.maxHp;
                }
            }
        ];

        Phaser.Utils.Array.Shuffle(options).slice(0, 3).forEach((opt, i) => {
            const yp = 300 + i * 130;
            const card = this.add.graphics();
            const drawCard = (hover) => {
                card.clear();
                card.fillStyle(hover ? 0x2a2a4a : 0x181828, 0.95);
                card.lineStyle(2, hover ? 0x00ffff : 0x00ff88, 1);
                card.fillRoundedRect(40, yp, 400, 100, 10);
                card.strokeRoundedRect(40, yp, 400, 100, 10);
            };
            drawCard(false);

            const tTitle = this.add.text(65, yp + 22, opt.title, { font: 'bold 22px Arial', fill: '#00ff88' });
            this.add.text(65, yp + 58, opt.desc, { font: '15px Arial', fill: '#cccccc' });

            const zone = this.add.zone(240, yp + 50, 400, 100).setInteractive({ useHandCursor: true });
            zone.on('pointerover', () => { drawCard(true); tTitle.setStyle({ fill: '#00ffff' }); });
            zone.on('pointerout', () => { drawCard(false); tTitle.setStyle({ fill: '#00ff88' }); });
            zone.on('pointerdown', () => {
                opt.apply();
                this.scene.stop('UpgradeScene');
                this.mainScene.scene.resume();
            });
        });
    }
}

// ============================================================
//  STATION SCENE (지원 행성 - 상점 / 휴게소)
// ============================================================
class StationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StationScene' });
    }

    create(data) {
        this.mainScene = data.mainScene;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000814, 0.88);
        overlay.fillRect(0, 0, 480, 800);

        this.add.text(240, 110, '🪐 지원 행성', { font: 'bold 34px Arial', fill: '#00ffff' }).setOrigin(0.5);
        this.scoreLabel = this.add.text(240, 155, '', { font: '18px Arial', fill: '#ffff00' }).setOrigin(0.5);

        this.content = this.add.container(0, 0);
        this._showMainMenu();
    }

    _updateScoreLabel() {
        this.scoreLabel.setText(`보유 점수: ${this.mainScene.score}`);
    }

    _clearContent() {
        this.content.removeAll(true);
    }

    _addContentText(x, y, text, style) {
        const t = this.add.text(x, y, text, style).setOrigin(0.5);
        this.content.add(t);
        return t;
    }

    _makeButton(x, y, w, h, title, desc, onClick, opts = {}) {
        const disabled = !!opts.disabled;
        const card = this.add.graphics();
        const draw = (hover) => {
            card.clear();
            card.fillStyle(disabled ? 0x1a1a1a : (hover ? 0x2a2a4a : 0x181828), 0.95);
            card.lineStyle(2, disabled ? 0x444444 : (hover ? 0x00ffff : 0x00ff88), 1);
            card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
            card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        };
        draw(false);
        this.content.add(card);

        const tTitle = this._addContentText(x, y - (desc ? 12 : 0), title,
            { font: 'bold 20px Arial', fill: disabled ? '#777777' : '#00ff88' });
        if (desc) this._addContentText(x, y + 16, desc, { font: '14px Arial', fill: disabled ? '#666666' : '#cccccc' });

        if (!disabled) {
            const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
            zone.on('pointerover', () => { draw(true); tTitle.setStyle({ fill: '#00ffff' }); });
            zone.on('pointerout', () => { draw(false); tTitle.setStyle({ fill: '#00ff88' }); });
            zone.on('pointerdown', onClick);
            this.content.add(zone);
        }
    }

    _flashMessage(text, color = '#ffff00') {
        const t = this.add.text(240, 700, text, {
            font: 'bold 18px Arial', fill: color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: 670, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    }

    _showMainMenu() {
        this._clearContent();
        this._updateScoreLabel();
        this._addContentText(240, 210, '무엇을 하시겠습니까?', { font: '18px Arial', fill: '#aaaaaa' });

        this._makeButton(240, 300, 380, 110, '🛒 상점', '점수로 무기 종류를 교체합니다', () => this._showShop());
        this._makeButton(240, 440, 380, 110, '🛌 휴게소', '점수로 체력을 회복합니다', () => this._showRest());
        this._makeButton(240, 580, 380, 90, '🚀 출발', '행성을 떠나 다시 전투를 시작합니다', () => this._leave());
    }

    _showShop() {
        this._clearContent();
        this._updateScoreLabel();
        const cost = 80;
        this._addContentText(240, 210, `무기 구매 (${cost}점)`, { font: '18px Arial', fill: '#aaaaaa' });

        const weapons = Object.values(WEAPON_TYPES).filter(w => w !== this.mainScene.currentWeapon);
        weapons.forEach((type, i) => {
            const cfg = WEAPON_CONFIGS[type];
            this._makeButton(240, 270 + i * 110, 380, 90, cfg.name,
                `공격력 ${cfg.damage} · 쿨다운 ${cfg.cooldown}ms`,
                () => this._buyWeapon(type, cost));
        });

        this._makeButton(240, 270 + weapons.length * 110 + 20, 380, 70, '⬅ 뒤로가기', null, () => this._showMainMenu());
    }

    _buyWeapon(type, cost) {
        if (this.mainScene.score < cost) {
            this._flashMessage('점수가 부족합니다!', '#ff4444');
            return;
        }
        this.mainScene.score -= cost;
        this.mainScene.currentWeapon = type;
        this._flashMessage(`${WEAPON_CONFIGS[type].name} 장착!`, '#00ff88');
        this._showShop();
    }

    _showRest() {
        this._clearContent();
        this._updateScoreLabel();
        const cost = 40;
        const player = this.mainScene.player;
        const heal = Math.round(player.maxHp * 0.3);
        this._addContentText(240, 210, `HP ${player.hp} / ${player.maxHp}`, { font: '18px Arial', fill: '#aaaaaa' });

        const full = player.hp >= player.maxHp;
        this._makeButton(240, 300, 380, 110, '❤️ 체력 회복',
            full ? '체력이 가득 찼습니다' : `${cost}점 → HP ${heal} 회복`,
            () => this._rest(cost, heal), { disabled: full });

        this._makeButton(240, 440, 380, 70, '⬅ 뒤로가기', null, () => this._showMainMenu());
    }

    _rest(cost, heal) {
        const player = this.mainScene.player;
        if (player.hp >= player.maxHp) {
            this._flashMessage('체력이 가득 찼습니다!', '#ff4444');
            return;
        }
        if (this.mainScene.score < cost) {
            this._flashMessage('점수가 부족합니다!', '#ff4444');
            return;
        }
        this.mainScene.score -= cost;
        player.hp = Math.min(player.hp + heal, player.maxHp);
        this._flashMessage(`HP +${heal} 회복!`, '#00ff88');
        this._showRest();
    }

    _leave() {
        this.mainScene._onLeavePlanet();
        this.scene.stop('StationScene');
    }
}

// ============================================================
//  GAME OVER SCENE
// ============================================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.add.graphics().fillStyle(0x080010, 1).fillRect(0, 0, 480, 800);
        this.add.text(240, 230, 'GAME OVER 💀', { font: 'bold 46px Arial', fill: '#ff3333' }).setOrigin(0.5);
        this.add.text(240, 320, `최종 점수: ${data.score || 0}`, { font: 'bold 26px Arial', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(240, 370, `도달 레벨: LV. ${data.level || 1}`, { font: '20px Arial', fill: '#00ff88' }).setOrigin(0.5);

        const btn = this.add.text(240, 520, '👉 터치하여 재시작 👈', { font: '22px Arial', fill: '#ffff00' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.tweens.add({ targets: btn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
        this.input.on('pointerdown', () => this.scene.start('MainGameScene'));
    }
}

// ============================================================
//  PHASER GAME CONFIG
// ============================================================
const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 800,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, TitleScene, MainGameScene, UpgradeScene, StationScene, GameOverScene]
};

new Phaser.Game(config);