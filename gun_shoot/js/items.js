export const ITEM_TYPES = {
    EXP: 'EXP',
    WEAPON: 'WEAPON',
    HEAL: 'HEAL',
    POWER: 'POWER',
    ATTACK_SPEED: 'ATTACK_SPEED'
};

// 탄환에 맞을 때마다 chargeLevel 이 변하는 아이템 타입 (POWER 와 동일한 컴셉)
export const CHARGEABLE_ITEM_TYPES = [ITEM_TYPES.POWER, ITEM_TYPES.ATTACK_SPEED];

export const ITEM_CONFIGS = {
    [ITEM_TYPES.EXP]: {
        emoji: '💎',
        size: 20
    },
    [ITEM_TYPES.WEAPON]: {
        emoji: '📦',
        size: 24
    },
    [ITEM_TYPES.HEAL]: {
        emoji: '❤️',
        size: 22
    },
    [ITEM_TYPES.POWER]: {
        emoji: '⚡',
        size: 24
    },
    [ITEM_TYPES.ATTACK_SPEED]: {
        emoji: '💨',
        size: 24
    }
};

export class Item extends Phaser.GameObjects.Text {
    constructor(scene, x, y) {
        super(scene, x, y, '', { font: '20px Arial' });
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5);
        
        this.itemType = null;
        this.value = 0;
        this.chargeLevel = 0; // 탄환으로 맞추면 증가하는 충전 단계 (POWER / ATTACK_SPEED 공통)
        this.magnetRange = 130; // 자석 이당공 시작 거리
        this.magnetSpeed = 380; // 자석 스피드
    }
    
    spawn(x, y, type, value = 0) {
        const config = ITEM_CONFIGS[type];
        this.itemType = type;
        this.value = value;
        this.setScale(1);
        this.clearTint();
        
        this.setText(config.emoji);
        this.setFontSize(config.size);
        
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.body.setSize(config.size, config.size);
        
        // 충전형 아이템(POWER/ATTACK_SPEED)은 최초 충전 상태가 -10~10 사이 랜덤으로 시작 (음수면 획득 시 오히려 패널티)
        if (CHARGEABLE_ITEM_TYPES.includes(type)) {
            this.setCharge(Phaser.Math.Between(-10, 10));
        } else {
            this.chargeLevel = 0;
        }
        
        // 드랍되었을 때 가볍게 사방으로 튕기는 물리 연출
        this.body.setVelocity(
            Phaser.Math.Between(-60, 60),
            Phaser.Math.Between(-120, -60)
        );
    }
    
    // 충전형 아이템의 충전 단계를 설정하고, 음수(위험)일 때는 붉은 틴트로 구분 표시한다
    setCharge(level) {
        this.chargeLevel = Phaser.Math.Clamp(level, -10, 50); // 초기 등장 범위는 -10~10, 탄환으로는 최대 50까지 충전 가능
        if (this.chargeLevel < 0) {
            this.setTint(0xff4444); // 음수 충전: 붉은색 경고 표시
        } else {
            this.clearTint();
        }
        this.setScale(1 + Math.abs(this.chargeLevel) * 0.02);
    }
    
    update(time, delta) {
        if (!this.active) return;
        
        const player = this.scene.player;
        if (player && player.active) {
            let dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            
            // 1. 자석 범위 이내: 플레이어를 향해 기하급수적으로 끌려감
            if (dist < this.magnetRange) {
                let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                // 거리가 가까워질수록 자력이 세지도록 보정
                let currentSpeed = this.magnetSpeed * (1.2 + (1 - dist / this.magnetRange));
                this.body.setVelocity(
                    Math.cos(angle) * currentSpeed,
                    Math.sin(angle) * currentSpeed
                );
            } 
            // 2. 자석 범위 밖: 중력 영향을 받듯 천천히 아래로 하강
            else {
                this.body.setVelocity(
                    Math.sin(time * 0.002 + this.x) * 20, // 좌우 살랑살랑 흔들림 효과
                    60 // 느릿한 하강
                );
            }
        } else {
            this.body.setVelocity(0, 60);
        }
        
        // 화면 아래를 벗어나면 자동 비활성화
        if (this.y > 850) {
            this.deactivate();
        }
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.setVelocity(0, 0);
    }
}

export class ItemGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene) {
        super(scene.physics.world, scene);
        
        // 수동으로 Item 인스턴스를 생성하여 그룹에 추가 (Text 상속 버그 방지)
        for (let i = 0; i < 40; i++) {
            const item = new Item(scene, 0, 0);
            this.add(item);
            item.deactivate();
        }
    }
    
    spawnItem(x, y, type, value = 0) {
        let item = this.getChildren().find(i => !i.active);
        if (item) {
            item.spawn(x, y, type, value);
            return item;
        }
        return null;
    }
}
