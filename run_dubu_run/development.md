# 제목

달려라 두부 (run dubu run!)

# 줄거리
~~허리케인으로 시나모롤이 카페에서 하늘 너머로 멀리 날아갔다. 시나모롤은 하늘을 날고 구름을 건너 다시 카페로 되돌아 가야 한다.~~
(시나모롤은 저작권으로 사용할 수 없어 변경)

안나와 행복하게 살던 햄스터 두부는 허리케인을 만나 하늘 너머로 멀리 날아갔다. 두부는 하늘을 날고 구름을 건너 다시 안나와 살던 집으로 돌아간다..

# 진행
동작 : 탭, 또는 클릭 시 점프, 여러번 탭하면 날기
지도에는 지형과 장애물이 있다.
지형 : 하늘, 구름, 땅, 언덕
장애물 종류 : 먹구름, 비, 바람, 번개, 동물

# 동작 환경
플랫폼 독립적으로 동작하는 것을 목표로 browser 에서 실행.
최소 지원 플랫폼: iphone 13 mini, ipad pro 12.9

# 결과물

10 files in 

run_dubu_run/
 — a complete side-scrolling action game with:

🐰 Dubu drawn with Canvas paths (ears, beret, tail, wings)
☁️ 3-layer parallax terrain (sky → clouds → ground with hills & grass)
⚡ 5 obstacle types — dark clouds, rain, wind, lightning, animals
🎮 Tap to jump, rapid multi-tap to fly
📈 Progressive difficulty + high score persistence
📱 Responsive for iPhone 13 mini and iPad Pro 12.9

# 개선 포인트

다람쥐는 언덕에 앞으로 와서 보이도록 수정
새는 날아야 한다.
커다란 동물이 있으면 좋겠다.
플레이어 캐릭터는 햄스터로 변경, 이름은 두부,
게임 이름 변경: 게임 타이틀을 **"두부의 모험"**
줄거리는 허리케인으로 날아간 햄스터가 집을 찾아 여행을 떠나는 것으로 변경한다.
비와 번개의 영향: 화면 효과 외에 **플레이어 이동 속도를 15% 늦추는 효과(비)**와 **화면 깜빡임 및 흔들림 효과(번개)**를 추가한다.
체크포인트를 두고 중간 중간 쉬도록 하도록 하자.
햄스터가 좋아하는 간식을 먹으면 잠시동안 충돌을 무시한다.

# 개선 포인트 2

✅ 햄스터 캐릭터가 점프할 떄 날개가 보이는 효과를 두 번째 점프부터만 보이게 수정하고
✅ 쉼터의 그림을 표지판이 아닌 동굴 모양으로 바꾸고 동굴에 숨고 멈추도록 해라.
✅ 그리고 다시 탭을 했을 때 다시 출발한다.
✅ 진행하다보면 햄스터 캐릭터의 위치가 뒤로 밀리는 현상이 있다. 이를 수정해라.

## 개선 포인트 2 구현 내용 (2026-06-21)

| 항목 | 파일 | 내용 |
|------|------|------|
| 날개 표시 조건 변경 | `js/player.js` | 첫 점프(단일 탭)에는 날개 숨김. 연속 탭(fly 상태)부터만 날개 표시 |
| 쉼터 동굴 디자인 | `js/obstacles.js` | Checkpoint 그래픽을 표지판 → 바위산 + 아치형 동굴 입구로 재작성 |
| 동굴 쉬기 / 재출발 | `js/main.js` | `STATE.RESTING` 상태 추가. 체크포인트 도달 시 스크롤·장애물 정지, 플레이어 동굴 앞 고정. 탭 시 재개 |
| 캐릭터 뒤로 밀림 수정 | `js/player.js` | 바람 마찰 계수 강화(`0.92→0.88`) + 매 프레임 `PLAYER_START_X` 방향 스프링 복원력 적용 |

# 개선 포인트 3

✅ 게임의 타이틀을 **달려라 두부**, **Run Dubu run!** 으로 변경
✅ 줄거리 변경

## 개선 포인트 3 구현 내용 (2026-06-21)

| 항목 | 파일 | 내용 |
|------|------|------|
| 게임 타이틀 변경 | `index.html`, `js/ui.js` | "두부의 모험" → "달려라 두부 / Run Dubu Run!" |
| 메타 정보 업데이트 | `index.html` | description, og:title, og:description, title 태그 모두 변경 |
| 로딩 화면 텍스트 | `index.html` | "두부의 모험" → "달려라 두부" |
| 시작 화면 타이틀 | `js/ui.js` | 한글 타이틀 + 영문 "Run Dubu Run!" 서브라인 추가 |
| 시작 화면 줄거리 | `js/ui.js` | "허리케인으로 날아간 햄스터 두부, 집으로 돌아가는 모험!" |
| JS/CSS 파일 주석 | 전체 JS + CSS | "Jump Cinnamoroll" → "달려라 두부 (Run Dubu Run!)" |
| README 작성 | `README.md` | 배포용 README (플레이 방법, 배포 가이드, 파일 구조) |