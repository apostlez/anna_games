export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        // 커스텀 벡터 우주선(위쪽을 향하도록 직접 드로잉)을 사용해 이모지의 대각선 방향 문제 해결
        super(scene, x, y);

        // 씬에 오브젝트 추가 및 물리 바디 적용
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this._buildShipGraphics(scene);

        // 물리 바디 설정 (컨테이너 원점(0,0) = 우주선 중심에 맞춰 수동 오프셋)
        this.body.setCollideWorldBounds(true);
        this.body.setSize(24, 24, false);
        this.body.setOffset(-12, -12);
        
        // 플레이어 기본 스탯
        this.hp = 100;
        this.maxHp = 100;
        this.speed = 250;
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;
        
        // 키보드 입력 설정
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // 터치/마우스 이동을 위한 목표 포인터
        this.targetPointer = null;
        
        // 화면 터치/클릭 입력 이벤트 등록
        scene.input.on('pointerdown', (pointer) => {
            this.targetPointer = pointer;
        });
        
        scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.targetPointer = pointer;
            }
        });
        
        scene.input.on('pointerup', () => {
            this.targetPointer = null;
        });
    }

    // 위쪽(12시 방향)을 향하는 전투기 모양을 직접 벡터로 그려 컨테이너 자식으로 추가
    _buildShipGraphics(scene) {
        const g = scene.add.graphics();

        // 동체 (nose가 위쪽을 향하는 화살촉 모양)
        g.fillStyle(0x00e5ff, 1);
        g.lineStyle(2, 0x006677, 1);
        g.beginPath();
        g.moveTo(0, -18);
        g.lineTo(9, 6);
        g.lineTo(4, 3);
        g.lineTo(0, 9);
        g.lineTo(-4, 3);
        g.lineTo(-9, 6);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // 조종석
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(0, -4, 3);

        // 양 날개 (레드 포인트)
        g.fillStyle(0xff3366, 1);
        g.fillTriangle(-9, 6, -15, 13, -3, 8);
        g.fillTriangle(9, 6, 15, 13, 3, 8);

        this.add(g);

        // 하단 추진 불꽃 (깜빡임 애니메이션)
        const flame = scene.add.graphics();
        flame.fillStyle(0xffaa00, 0.9);
        flame.fillTriangle(-4, 9, 4, 9, 0, 19);
        this.add(flame);

        scene.tweens.add({
            targets: flame,
            scaleY: 0.6,
            alpha: 0.5,
            duration: 120,
            yoyo: true,
            repeat: -1
        });
    }
    
    update() {
        // 물리 속도 초기화
        this.body.setVelocity(0);
        
        let vx = 0;
        
        // 1. 키보드 입력 (좌우만, 상하 무시)
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            vx = -this.speed;
            this.targetPointer = null;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            vx = this.speed;
            this.targetPointer = null;
        }
        
        // 2. 터치 / 마우스 (X축만 추적, Y 무시)
        else if (this.targetPointer && this.targetPointer.isDown) {
            const dx = this.targetPointer.x - this.x;
            if (Math.abs(dx) > 15) {
                vx = Math.sign(dx) * this.speed;
            }
        }
        
        // X축만 이동, Y는 완전 고정
        this.body.setVelocityX(vx);
        this.body.setVelocityY(0);
    }
    
    // 체력 감소
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        
        // 데미지 입었을 때 깜빡임 연출
        this.scene.tweens.add({
            targets: this,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
    }
    
    // 경험치 획득 및 레벨업 체크
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.exp -= this.expToNextLevel;
        this.level += 1;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        this.hp = this.maxHp; // 레벨업 시 체력 완전 회복
        
        // 씬 이벤트 발생시켜 UI 등에서 감지할 수 있게 함
        this.scene.events.emit('player-levelup', this.level);
    }
}
