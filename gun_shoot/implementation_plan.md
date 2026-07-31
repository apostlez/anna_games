# Roguelike Top-Down Shooter Game Implementation Plan

위에서 아래로 내려오는 적들을 물리치고, 무기와 아이템을 획득하며 진행하는 모바일(아이폰) 및 데스크톱 브라우저 호환 탑다운 로그라이크 슈팅 게임 개발 계획입니다.

## 프레임워크 추천 및 결정: Phaser 3 + Vite

HTML5 Canvas/WebGL 기반의 2D 게임 프레임워크인 **Phaser 3**를 사용합니다. 빌드 도구로 **Vite**를 채택하여 ES 모듈 지원과 GitHub Pages 정적 배포를 동시에 해결합니다.

- **Phaser 3**: 모바일 및 데스크톱 브라우저 최적화, 내장 Arcade Physics를 통한 충돌 처리
- **Vite**: `npm run dev`로 개발 서버 구동, `npm run build`로 정적 파일 번들링 → GitHub Pages 배포 가능

---

## 디자인 및 주요 시스템 합의 사항

1. **조작 방식**:
   - **터치/클릭 이동 + 자동 사격**: 화면을 터치/클릭하면 플레이어 캐릭터가 터치된 위치로 이동, 총알은 자동으로 발사
   - **데스크톱 호환**: 마우스 클릭 드래그 및 WASD/방향키 이동 지원

2. **무기 및 아이템 시스템**:
   - **필드 드랍 무기 상자**: 적 처치 시 무기 상자(`📦`) 드랍, 플레이어가 닿으면 무기 랜덤 변경
   - **스탯 강화**: 레벨업 시 3가지 버프 중 1개 선택 (공격력 / 속사 / 이동 속도 / 체력 보강)

3. **클래식 픽셀 아트 스타일 (이모지 기반)**:
   - 별도 이미지 에셋 없이 이모지(🚀, 👾, 🛸, 📦, 💥 등) 및 Phaser Text 오브젝트로 구성

---

## 구현 완료 상태

> **✅ 전체 7단계 구현 완료** (2026-07-17 ~ 2026-07-25)

### 프로젝트 구조

```
gun_shoot/
├── index.html          # Vite 진입점 (Phaser CDN + type=module)
├── style.css           # 전체화면 모바일 레이아웃
├── game.js             # 메인 씬 로직 (ES 모듈, Phaser 씬 4개)
├── vite.config.js      # Vite 빌드 설정 (base: './', GitHub Pages 호환)
├── package.json        # npm 스크립트 (dev/build/preview)
├── js/
│   ├── player.js       # 플레이어 클래스
│   ├── bullets.js      # 탄환 클래스 및 무기 타입 설정
│   ├── enemies.js      # 적 클래스 및 적 타입 설정
│   └── items.js        # 아이템 클래스 및 아이템 타입 설정
└── dist/               # Vite 프로덕션 빌드 결과물 (GitHub Pages 업로드용)
```

---

## Proposed Changes (구현 완료 파일 목록)

### [gun_shoot] 게임 핵심 컴포넌트

#### [DONE] [index.html](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/index.html)
Vite + Phaser 3 진입점. CDN으로 Phaser 로드, `type="module"`로 game.js 진입.

#### [DONE] [style.css](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/style.css)
전체화면, 스크롤 제거, 터치 줌 방지, 캔버스 중앙 정렬.

#### [DONE] [vite.config.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/vite.config.js)
- `base: './'` → GitHub Pages 서브 디렉토리 배포 호환
- `outDir: 'dist'`
- 개발 서버 port 5173

#### [DONE] [game.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/game.js)
4개 씬 포함:
- **BootScene**: 즉시 MainGameScene으로 전환
- **MainGameScene**: 게임 루프 (플레이어·적 스폰·충돌·HUD·난이도 상승)
- **UpgradeScene**: 레벨업 시 3장 카드 선택 오버레이 (호버 애니메이션 포함)
- **GameOverScene**: 점수/레벨 표시 + 재시작 버튼

#### [DONE] [js/player.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/js/player.js)
- 이모지 `🚀` 기반 Phaser.GameObjects.Text + Arcade Physics
- WASD / 방향키 / 터치 드래그 이동
- HP, EXP, 레벨업 로직

#### [DONE] [js/bullets.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/js/bullets.js)
4가지 무기 타입:
- 권총 🔫: 단발 직선
- 샷건 弾: 3발 확산
- 레이저 ⚡: 고속 관통
- 미사일 🚀: 유도탄 (가장 가까운 적 추적)

#### [DONE] [js/enemies.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/js/enemies.js)
4가지 적 타입 + 각기 다른 이동 패턴:
- 일반(`👾`): 수직 하강
- UFO(`🛸`): 사인파 좌우 흔들기
- 돌격(`🐙`): 플레이어 방향으로 X축 추적
- 보스(`👹`): 천천히 흔들며 하강, 사망 시 아이템 3개 확정 드랍

#### [DONE] [js/items.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/gun_shoot/js/items.js)
3가지 아이템:
- 경험치 보석(`💎`): EXP 획득
- 무기 상자(`📦`): 랜덤 무기 변경
- 체력 회복약(`❤️`): HP 회복
- 자석 효과: 일정 범위 내 플레이어 쪽으로 자동 흡입

---

## 기술 이슈 및 해결 내역

| 이슈 | 원인 | 해결 |
|------|------|------|
| `http-server`에서 ES 모듈 미작동 | MIME 타입/CORS 문제 | **Vite**로 빌드 시스템 전환 |
| `createMultiple()` 풀링 미작동 | Phaser.GameObjects.Text 상속 시 `classType` 미지원 | `new Bullet(scene)` 수동 인스턴스 생성으로 대체 |
| `getFirstDead()` 미작동 | Phaser 그룹에서 Text 상속 오브젝트의 `active` 판별 불일치 | `getChildren().find(b => !b.active)` 수동 탐색 |
| Node.js v18 → Vite 8 비호환 | Vite 8은 Node 20+ 필요 | `nvm`으로 Node.js 22.12.0 설치 후 전환 |
| `player.move()` 메서드 없음 | game.js에서 잘못된 메서드명 호출 | `player.update()`로 수정 |

---

## Verification Plan

### 자동화 검증
- `npm run build` → Vite 빌드 성공 (9 modules transformed, JS 16.97 kB gzip 5.5 kB) ✅
- `npx vite preview --port 4173` → 정적 빌드 파일 서빙 정상 ✅
- `npx vite --port 5173` → 개발 서버 구동 정상 ✅

### GitHub Pages 배포 방법
1. `npm run build` 실행 → `dist/` 폴더 생성
2. `dist/` 내 파일을 GitHub 저장소에 push
3. 저장소 Settings → Pages → Source: `main` 브랜치 `/ (root)` 또는 `docs/` 설정
4. (선택) 저장소 이름이 `gun_shoot`이면 `vite.config.js`의 `base`를 `'/gun_shoot/'`으로 변경 후 재빌드

### 수동 검증 (로컬)
```bash
# 개발 서버 실행
npm run dev   # http://localhost:5173

# 프로덕션 빌드 미리보기
npm run build
npm run preview   # http://localhost:4173
```
- 데스크톱 브라우저 F12 → 모바일 에뮬레이션(iPhone) 에서 터치 이동 및 레이아웃 확인
- 웨이브 진행에 따른 적 스폰 속도 상승, 레벨업 버프 선택 UI 작동 확인

---

## 개발 명령어 요약

```bash
npm run dev      # Vite 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 번들 → dist/
npm run preview  # 빌드 결과물 로컬 확인 (http://localhost:4173)
```

---

## 추가 진행 내역 (2026-07-31 ~ 2026-08-01 세션)

기존 7단계 구현 완료 이후, 아래 기능들을 반복적으로 추가/개선했습니다. 모두 Playwright 기반 라이브 브라우저 테스트로 동작을 확인했습니다.

### 1. 적 이탈 시 피해 제거
- `MainGameScene._onEnemyEscaped()`를 빈 핸들러로 변경. 적이 화면 아래로 지나쳐도 더 이상 `player.takeDamage()` 호출 없음.

### 2. 하늘에서 독립적으로 떨어지는 아이템 스폰
- 적 처치 드랍과 별개로 `itemSpawnTimer`(5초 간격) 추가, `_spawnRandomItem()`이 화면 위쪽에서 랜덤 아이템을 직접 떨어뜨림.

### 3. POWER 아이템 + 충전형 아이템 시스템 (`js/items.js`, `game.js`)
- `ITEM_TYPES.POWER`: 획득 시 `statsModifier.damageMult`를 영구적으로 증가시키는 스택형 아이템.
- **충전 메커니즘**: `CHARGEABLE_ITEM_TYPES = [POWER, ATTACK_SPEED]` 배열로 일반화.
  - 최초 스폰 시 `chargeLevel`이 -10~10 사이 랜덤으로 시작 (음수면 붉은 틴트로 위험 표시).
  - 탄환에 맞을 때마다 `chargeLevel +1`, 최대 50까지 충전 가능 (`_onBulletHitChargeableItem`).
  - 충전 단계가 높을수록 획득 시 효과(데미지 %, 공속 %)가 커짐: `bonus = 0.1 * (1 + chargeLevel * 0.5)`.
  - 크기(`setScale`)도 `|chargeLevel|`에 비례해 커짐 → 시각적으로 충전 상태 구분.
- `ITEM_TYPES.ATTACK_SPEED`: POWER와 동일한 충전 컨셉 공유. 획득 시 `statsModifier.cooldownMult`를 감소(공속 증가)시킴, `0.2~3.0` 범위로 클램프.
- 두 아이템 모두 적 처치 드랍 테이블과 하늘 독립 스폰 테이블에 추가됨.

### 4. HUD 확장 (`game.js` `_createHUD`/`_updateHUD`)
- 무기명 아래에 `⚡ POWER {damageMult%}` 표시.
- 그 아래에 `💨 공격 속도 {100/cooldownMult}%` 표시 (요청에 따라 "공속" → "공격 속도"로 표기 변경).

### 5. 소행성(ASTEROID) 적 타입 (`js/enemies.js`)
- 신규 `ENEMY_TYPES.ASTEROID` (🌑). 스폰 시 `sizeScale`을 0.6~1.9배 사이 랜덤으로 정하고, 그 배율에 비례해 체력·접촉 데미지·점수·경험치를 함께 조정 (`config.variableSize` 처리 블록).
- 크기가 클수록 낙하 속도가 약간 느려짐 (`speed / sqrt(sizeScale)`), 낙하 중 천천히 회전(텀블링) 연출 추가.
- 플레이어 충돌 데미지는 기존 고정값(20) 대신 적 인스턴스별 `contactDamage` 속성을 사용하도록 `_onPlayerHitEnemy`를 일반화 (다른 적 타입은 기존과 동일한 20 유지).
- 스폰 확률 테이블(`_spawnEnemy`)에 ASTEROID 추가 (SWIFT 55%, ASTEROID 20%, 나머지 BASIC).
- 이모지 `🪨`(rock)는 이 환경에서 렌더링되지 않아(테두리 박스만 표시) `🌑`(new moon)으로 교체.

### 6. 지원 행성 (Support Planet) — 상점 / 휴게소 (`game.js`)
- 눈에 띄게 큰(🪐, 72px) 단일 오브젝트를 25초 간격으로 스폰 (`_createSupportPlanet`/`_spawnPlanet`), 매우 느린 속도(35px/s)로 하강해 플레이어가 여유롭게 도달 가능.
- 플레이어가 접촉하면(`_onPlayerVisitPlanet`) `MainGameScene`을 일시정지하고 신규 `StationScene`을 `launch` (레벨업 시 `UpgradeScene`을 여는 것과 동일한 패턴).
- **StationScene** 메뉴 구성:
  - 🛒 **상점**: 점수 80점 소모, 현재 무기를 제외한 나머지 무기 목록에서 선택해 `currentWeapon` 교체.
  - 🛌 **휴게소**: 점수 40점 소모, `maxHp`의 30%만큼 HP 회복 (반복 구매 가능). 점수 부족/HP 가득 참 시 버튼 비활성화 및 경고 메시지.
  - 🚀 **출발**: 행성을 비활성화하고 `MainGameScene`을 재개.
- `_checkGameOver()`에 `planetSpawnTimer.destroy()` 정리 로직 추가. Phaser 설정의 `scene` 배열에 `StationScene` 등록.

---

## Phaser 3 관련 특이사항 및 트러블슈팅 노트 (이번 세션에서 발견)

이 프로젝트(Text 기반 풀링 + 커스텀 AABB 충돌 판정 구조)에서 실제로 겪은 Phaser 3 동작 특이사항을 기록합니다. 추후 유사 기능 추가/디버깅 시 참고합니다.

1. **Arcade Physics Body와 GameObject 위치 동기화는 한쪽 방향으로만 매 프레임 일어난다.**
   - `body.enable`이 이미 `true`인 상태에서 `gameObject.setPosition(x, y)`를 호출해도 물리 body의 실제 위치(`body.x/y`)는 갱신되지 않는다. GameObject → Body 동기화는 `body.enable`이 `false → true`로 바뀌는 시점(`updateFromGameObject()`)에만 일어난다.
   - 반대로 Body → GameObject 동기화(속도로 인한 이동 결과를 GameObject 위치에 반영, `postUpdate`)는 매 프레임 정상적으로 일어난다.
   - 결론: 아이템/적 등 풀링된 오브젝트의 `spawn()`처럼 "위치 설정 → `body.enable = true`" 순서는 정상 동작하지만, 이미 활성화된 오브젝트를 테스트 등의 목적으로 강제 재배치하려면 `gameObject.setPosition()` 대신 `body.reset(x, y)`를 사용해야 한다.

2. **`scene.pause()` / `scene.launch()`를 정상적인 게임 루프 밖에서(예: Playwright로 `scene.update()`를 직접, 반복적으로 호출) 여러 번 연달아 실행하면 씬 상태가 꼬여 `"Cannot pause non-running Scene"` 경고가 뜨며 씬 전환이 무시될 수 있다.**
   - 실제 게임 루프(RAF)가 씬 매니저의 pause/launch 큐를 처리하도록 `waitForTimeout` 등으로 실제 프레임이 흐르게 기다리는 편이 안전하며, 여러 단계의 씬 전환을 테스트할 때는 매 테스트마다 페이지를 새로고침해 씬 상태를 초기화하는 것이 좋다.

3. **최신 유니코드 이모지 일부는 이 브라우저/폰트 환경에서 렌더링되지 않는다.**
   - 예: 🪨(rock, Unicode 12.0)는 빈 사각형(테두리만 있는 박스)으로 표시됨.
   - 이번 세션에서 정상 렌더링 확인된 이모지: 🌑 ⚡ 💨 ❤️ 📦 💎 👾 🛸 🐙 👹 🚀. 새 이모지를 쓸 때는 스크린샷으로 실제 렌더링을 확인 후 사용할 것.

4. **`Phaser.GameObjects.Text`로 표시한 이모지는 `.setTint(color)`로 색조를 입힐 수 있다** (음수 충전 상태를 붉은색으로 표시하는 데 사용). 단, `.setColor()`나 stroke 스타일은 컬러 이모지 글리프 렌더링에 영향을 주지 않으므로 색상 구분에는 `.setTint()`를 사용해야 한다.

5. **`Phaser.Math.CatmullRom(t, p0, p1, p2, p3)`는 4개의 개별 숫자 인자를 요구하며, 배열을 넘기면 조용히 `NaN`을 반환한다** (아이템 낙하 시 좌우 흔들림 연출에 사용하려다 발견된 잠재 버그, `Math.sin(time * 0.002 + x) * 20` 방식으로 대체).

6. **디버그 테스트 패턴**: `game.js` 최하단의 `new Phaser.Game(config);`을 임시로 `window.__game = new Phaser.Game(config);`로 바꿔 Playwright `page.evaluate()`에서 씬/오브젝트에 직접 접근해 테스트한 뒤, 작업 완료 전 반드시 원래 형태로 되돌려야 한다.

