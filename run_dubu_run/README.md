# 달려라 두부 🐹 — Run Dubu Run!

안나와 행복하게 살던 햄스터 두부는 허리케인을 만나 하늘 너머로 멀리 날아갔다.  
두부는 하늘을 날고 구름을 건너 다시 안나와 살던 집으로 돌아간다.

> A browser-based side-scrolling action game. Tap to jump, multi-tap to fly — guide Dubu the hamster back home!

---

## 플레이 방법 / How to Play

| 입력 | 동작 |
|------|------|
| 탭 / 클릭 | 점프 |
| 연속 탭 / 클릭 | 날기 (두 번째 탭부터 날개 등장) |
| 동굴(쉼터) 도달 후 탭 | 재출발 |

- **간식** 을 먹으면 잠시 무적 상태가 됩니다.
- **비** 를 맞으면 이동 속도가 느려집니다.
- **번개** 는 화면을 흔들고 깜빡이게 합니다.
- 일정 거리마다 **동굴 쉼터** 에서 잠시 쉴 수 있습니다.

---

## 장애물 / Obstacles

| 종류 | 설명 |
|------|------|
| 먹구름 | 공중 장애물 |
| 비 | 이동 속도 15% 감소 |
| 바람 | 수평 돌풍 |
| 번개 | 화면 흔들림 + 깜빡임 |
| 동물 | 다람쥐(지상), 새(공중), 대형 동물 |

---

## 배포 / Deployment

정적 파일만으로 구성된 게임입니다. 별도의 서버 설정 없이 **HTML 파일을 그대로 서빙** 하면 됩니다.

### 로컬 실행

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

브라우저에서 `http://localhost:8080` 접속 후 `run_dubu_run/index.html` 을 열거나,  
루트로 서빙 중이라면 바로 접속합니다.

### GitHub Pages

1. 저장소를 GitHub에 push합니다.
2. **Settings → Pages** 에서 Branch를 `main`, 폴더를 `/run_dubu_run` (또는 루트)으로 설정합니다.
3. 게시된 URL에서 바로 플레이 가능합니다.

### Netlify / Vercel

`run_dubu_run/` 폴더를 Publish directory로 지정하면 됩니다.  
빌드 명령은 필요 없습니다.

---

## 지원 환경 / Supported Platforms

- iPhone 13 mini (375 × 812)
- iPad Pro 12.9
- 데스크탑 브라우저 (Chrome, Safari, Firefox, Edge 최신 버전)

> `ES Modules` (`type="module"`)을 사용하므로 **`file://` 직접 열기는 동작하지 않습니다.**  
> 반드시 로컬 서버 또는 호스팅을 통해 실행하세요.

---

## 파일 구조 / File Structure

```
run_dubu_run/
├── index.html          # 진입점
├── css/
│   └── style.css       # 전체 스타일 (로딩 화면, 레이아웃)
└── js/
    ├── main.js         # 게임 루프, 상태 관리
    ├── player.js       # 두부 캐릭터 물리 & 렌더링
    ├── obstacles.js    # 장애물 & 쉼터(체크포인트) 생성
    ├── terrain.js      # 시차 배경, 지형 생성
    ├── renderer.js     # 장면 조합 렌더링
    ├── ui.js           # 시작 화면, HUD, 게임 오버 화면
    ├── input.js        # 터치 / 마우스 / 키보드 입력
    └── utils.js        # 공통 상수, 유틸리티 함수
```

---

## 기술 스택 / Tech Stack

- **HTML5 Canvas** — 모든 그래픽을 코드로 직접 렌더링 (외부 이미지 에셋 없음)
- **Vanilla JS (ES Modules)** — 프레임워크 의존성 없음
- **CSS3** — 로딩 화면 애니메이션
