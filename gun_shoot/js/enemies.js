export const ENEMY_TYPES = {
    BASIC: 'BASIC',
    SWIFT: 'SWIFT',
    HEAVY: 'HEAVY',
    BOSS: 'BOSS',
    ASTEROID: 'ASTEROID'
};

export const ENEMY_CONFIGS = {
    [ENEMY_TYPES.BASIC]: {
        emoji: '👾',
        hp: 30,
        speed: 100,
        score: 10,
        exp: 15,
        size: 28
    },
    [ENEMY_TYPES.SWIFT]: {
        emoji: '🛸',
        hp: 15,
        speed: 160,
        score: 20,
        exp: 20,
        size: 28
    },
    [ENEMY_TYPES.HEAVY]: {
        emoji: '🐙',
        hp: 75,
        speed: 70,
        score: 30,
        exp: 40,
        size: 32
    },
    [ENEMY_TYPES.BOSS]: {
        emoji: '👹',
        hp: 500,
        speed: 40,
        score: 200,
        exp: 150,
        size: 56,
        isBoss: true
    },
    [ENEMY_TYPES.ASTEROID]: {
        emoji: '🌑',
        hp: 40,
        speed: 90,
        score: 15,
        exp: 20,
        size: 32,
        damage: 20,
        // 소행성은 크기가 매번 랜덤으로 달라지며, 그에 비례해 체력/데미지/보상이 변한다
        variableSize: true,
        minSizeScale: 0.6,
        maxSizeScale: 1.9
    }
};

export class Enemy extends Phaser.GameObjects.Text {
    constructor(scene, x, y) {
        super(scene, x, y, '', { font: '28px Arial' });
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5);
        
        this.enemyType = null;
        this.hp = 0;
        this.maxHp = 0;
        this.speed = 0;
        this.scoreValue = 0;
        this.expValue = 0;
        
        // 이동 패턴을 위한 변수
        this.spawnTime = 0;
        this.waveOffset = Math.random() * 100;
        this.startX = 0;
    }
    
    spawn(x, y, type, difficultyMultiplier = 1) {
        const config = ENEMY_CONFIGS[type];
        this.enemyType = type;
        this.setText(config.emoji);
        this.setFontSize(config.size);
        
        this.hp = Math.round(config.hp * difficultyMultiplier);
        this.maxHp = this.hp;
        // 난이도 상승에 따른 속도 증가 보정 (최대 1.5배 제한)
        const speedFactor = Math.min(1 + (difficultyMultiplier - 1) * 0.1, 1.5);
        this.speed = config.speed * speedFactor;
        
        this.scoreValue = config.score;
        this.expValue = config.exp;
        this.contactDamage = config.damage ?? 20;
        
        this.setPosition(x, y);
        this.startX = x;
        this.spawnTime = this.scene.time.now;
        this.angle = 0;
        
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.body.setSize(config.size, config.size);
        this.spriteSize = config.size;
        
        // 소행성은 크기를 랜덤으로 정하고, 그 크기에 비례해 체력/접촉 데미지/보상/속도를 재조정한다
        this.sizeScale = 1;
        if (config.variableSize) {
            const sizeScale = Phaser.Math.FloatBetween(config.minSizeScale, config.maxSizeScale);
            this.sizeScale = sizeScale;
            const scaledSize = Math.round(config.size * sizeScale);
            this.setFontSize(scaledSize);
            this.spriteSize = scaledSize;
            this.body.setSize(scaledSize, scaledSize);
            this.hp = Math.round(this.hp * sizeScale);
            this.maxHp = this.hp;
            this.scoreValue = Math.round(this.scoreValue * sizeScale);
            this.expValue = Math.round(this.expValue * sizeScale);
            this.contactDamage = Math.round(this.contactDamage * sizeScale);
            // 큰 소행성일수록 조금 더 느리게 낙하
            this.speed = this.speed / Math.sqrt(sizeScale);
        }
        
        // 보스는 더 웅장하게 보이도록 스케일 조정
        if (config.isBoss) {
            this.setScale(1.3);
        } else {
            this.setScale(1.0);
        }
    }
    
    update(time, delta) {
        if (!this.active) return;
        
        // 1. 적 타입별 차별화된 이동 패턴 구현
        if (this.enemyType === ENEMY_TYPES.BASIC) {
            this.body.setVelocityY(this.speed);
            this.body.setVelocityX(0);
        } 
        else if (this.enemyType === ENEMY_TYPES.SWIFT) {
            // 좌우 물결 무늬 기동 (Sine Wave) - velocity 기반으로 body/gameObject 동기화 유지
            let elapsed = (time - this.spawnTime) / 1000;
            let targetX = this.startX + Math.sin(elapsed * 6 + this.waveOffset) * 60;
            let dx = targetX - this.x;
            this.body.setVelocityX(dx * 10);
            this.body.setVelocityY(this.speed);
        } 
        else if (this.enemyType === ENEMY_TYPES.HEAVY) {
            // 플레이어 방향으로 다소 느리게 유도 이동
            const player = this.scene.player;
            if (player && player.active) {
                let dx = player.x - this.x;
                // X축 방향 부드러운 스티어링
                let vx = Math.sign(dx) * (this.speed * 0.6);
                this.body.setVelocity(vx, this.speed);
            } else {
                this.body.setVelocity(0, this.speed);
            }
        } 
        else if (this.enemyType === ENEMY_TYPES.BOSS) {
            // 보스는 매우 묵직하고 거대하게 천천히 흔들리며 전진 - velocity 기반으로 동기화 유지
            let elapsed = (time - this.spawnTime) / 1000;
            let targetX = this.startX + Math.sin(elapsed * 2.5) * 40;
            let dx = targetX - this.x;
            this.body.setVelocityX(dx * 6);
            this.body.setVelocityY(this.speed);
        }
        else if (this.enemyType === ENEMY_TYPES.ASTEROID) {
            // 소행성은 일직선으로 낙하하며 크기에 따라 정해진 방향으로 천천히 회전(텀블링)한다
            this.body.setVelocityY(this.speed);
            this.body.setVelocityX(0);
            const spinDir = this.waveOffset >= 50 ? 1 : -1;
            this.angle += spinDir * delta * (0.03 / Math.max(this.sizeScale, 0.5));
        }
        
        // 2. 화면 밑으로 벗어나면 비활성화 (기지 통과 판정 이벤트)
        if (this.y > 850) {
            this.deactivate();
            this.scene.events.emit('enemy-escaped', this);
        }
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        
        // 피격 넉백/크기 깜빡임 연출
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.15,
            scaleY: this.scaleY * 1.15,
            duration: 60,
            yoyo: true,
            repeat: 0
        });
        
        if (this.hp <= 0) {
            this.die();
            return true; // 처치 완료
        }
        return false; // 아직 생존
    }
    
    die() {
        // 사망 이펙트 (이모지 💥 생성 후 팽창 및 페이드아웃)
        const currentSize = this.spriteSize ?? 28;
        const explosion = this.scene.add.text(this.x, this.y, '💥', { font: `${currentSize}px Arial` }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: explosion,
            scale: 1.6,
            alpha: 0,
            duration: 250,
            onComplete: () => explosion.destroy()
        });
        
        // 씬에 처치 이벤트 전송 (경험치, 드롭 아이템 트리거)
        this.scene.events.emit('enemy-killed', {
            x: this.x,
            y: this.y,
            type: this.enemyType,
            scoreValue: this.scoreValue,
            expValue: this.expValue
        });
        
        this.deactivate();
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.setVelocity(0, 0);
    }
}

export class EnemyGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);
        
        // 수동으로 Enemy 인스턴스를 생성하여 그룹에 추가 (Text 상속 버그 방지)
        for (let i = 0; i < 30; i++) {
            const enemy = new Enemy(scene, 0, 0);
            this.add(enemy);
            enemy.deactivate();
        }
    }
    
    spawnEnemy(x, y, type, difficultyMultiplier) {
        let enemy = this.getChildren().find(e => !e.active);
        if (enemy) {
            enemy.spawn(x, y, type, difficultyMultiplier);
            return enemy;
        }
        return null;
    }
}
