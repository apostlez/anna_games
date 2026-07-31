export const WEAPON_TYPES = {
    PISTOL: 'PISTOL',
    SHOTGUN: 'SHOTGUN',
    LASER: 'LASER',
    MISSILE: 'MISSILE'
};

export const WEAPON_CONFIGS = {
    [WEAPON_TYPES.PISTOL]: {
        name: '권총 🔫',
        emoji: '🔸',
        damage: 15,
        speed: 550,
        cooldown: 350, // ms
        penetrate: false,
        spread: 0,
        count: 1
    },
    [WEAPON_TYPES.SHOTGUN]: {
        name: '샷건 弾',
        emoji: '🔴',
        damage: 12,
        speed: 450,
        cooldown: 750,
        penetrate: false,
        spread: 0.25, // 라디안 각도 확산 (약 15도)
        count: 3
    },
    [WEAPON_TYPES.LASER]: {
        name: '레이저 ⚡',
        emoji: '⚡',
        damage: 8,
        speed: 900,
        cooldown: 120,
        penetrate: true,
        spread: 0,
        count: 1
    },
    [WEAPON_TYPES.MISSILE]: {
        name: '미사일 🚀',
        emoji: '🔺',
        damage: 35,
        speed: 300,
        cooldown: 1000,
        penetrate: false,
        spread: 0,
        count: 1,
        homing: true
    }
};

export class Bullet extends Phaser.GameObjects.Text {
    constructor(scene, x, y) {
        super(scene, x, y, '', { font: '18px Arial' });
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5);
        
        // 물리 설정 초기화
        this.body.setCollideWorldBounds(false);
        this.body.setSize(16, 16);
        
        this.damage = 0;
        this.speed = 0;
        this.penetrate = false;
        this.homing = false;
        this.targetEnemy = null;
        
        // 관통 피해를 입힌 적의 ID를 저장해 중복 피격을 방지
        this.hitEnemies = new Set();
        // 관통 탄환이 같은 POWER 아이템을 중복 충전하지 않도록 방지
        this.hitItems = new Set();
    }
    
    fire(x, y, angle, config) {
        this.setPosition(x, y);
        this.setText(config.emoji);
        this.damage = config.damage;
        this.speed = config.speed;
        this.penetrate = config.penetrate || false;
        this.homing = config.homing || false;
        
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        // 텍스트(이모지) 설정 후 body 크기를 다시 지정해 offset을 재계산 (시각적 위치와 물리 body 정렬)
        this.body.setSize(16, 16, true);
        this.hitEnemies.clear();
        this.hitItems.clear();
        
        // 발사 속도 설정
        this.body.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );
        
        // 유도탄일 경우 가장 가까운 적을 타겟팅
        if (this.homing) {
            this.findNearestEnemy();
        }
    }
    
    findNearestEnemy() {
        // 메인 씬의 적 그룹에서 탐색 (MainGameScene 내 enemies 그룹 참조 예정)
        const enemiesGroup = this.scene.enemiesGroup;
        if (!enemiesGroup || enemiesGroup.getLength() === 0) {
            this.targetEnemy = null;
            return;
        }
        
        let nearest = null;
        let minDist = 99999;
        
        enemiesGroup.getChildren().forEach(enemy => {
            if (enemy.active) {
                let dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }
        });
        
        this.targetEnemy = nearest;
    }
    
    update() {
        if (!this.active) return;
        
        // 1. 유도탄 추적 처리
        if (this.homing && this.targetEnemy && this.targetEnemy.active) {
            let angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetEnemy.x, this.targetEnemy.y);
            // 서서히 적 방향으로 회전 및 속도 갱신
            this.body.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );
        } else if (this.homing) {
            // 타겟을 잃었거나 처치된 경우 주기적으로 새로운 타겟을 재탐색
            this.findNearestEnemy();
        }
        
        // 2. 화면 이탈 시 탄환 비활성화
        if (this.y < -50 || this.y > 850 || this.x < -50 || this.x > 530) {
            this.deactivate();
        }
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.setVelocity(0, 0);
        this.targetEnemy = null;
        this.hitEnemies.clear();
        this.hitItems.clear();
    }
}

export class BulletGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);
        
        // 수동으로 Bullet 인스턴스를 생성하여 그룹에 추가 (Text 상속 버그 방지)
        for (let i = 0; i < 60; i++) {
            const bullet = new Bullet(scene, 0, 0);
            this.add(bullet);
            bullet.deactivate();
        }
    }
    
    shoot(x, y, weaponType, statsModifier = { damageMult: 1, speedMult: 1 }) {
        const config = WEAPON_CONFIGS[weaponType];
        if (!config) return;
        
        const finalConfig = {
            ...config,
            damage: Math.round(config.damage * statsModifier.damageMult),
            speed: config.speed * statsModifier.speedMult
        };
        
        // 위 방향(12시 방향)으로 사격 각도는 -Math.PI / 2
        const baseAngle = -Math.PI / 2;
        
        if (finalConfig.count === 1) {
            const bullet = this.getChildren().find(b => !b.active);
            if (bullet) {
                bullet.fire(x, y, baseAngle, finalConfig);
            }
        } else {
            // 다발(샷건 등) 사격 처리
            const startAngle = baseAngle - ((finalConfig.count - 1) * finalConfig.spread) / 2;
            for (let i = 0; i < finalConfig.count; i++) {
                const angle = startAngle + i * finalConfig.spread;
                const bullet = this.getChildren().find(b => !b.active);
                if (bullet) {
                    bullet.fire(x, y, angle, finalConfig);
                }
            }
        }
    }
}
