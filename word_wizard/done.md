# 완료 기록

## 사운드북 MP3 데이터 수집 [완료]

- 완료일: 2026-09-30
- 원본 페이지: `https://nexusbook.com/qr/word/mp3.asp?step=2&ctype=textbook`
- 교재 단계: `3-4`
- 대상 범위: Day 1~Day 30
- MP3 URL 패턴: `https://nexusbook.com/qr/word/files/mp3/textbook/3-4/{day}.mp3`
- 추출 결과: 날짜별 286개 영어 단어 항목
- 결과 파일: [word_source_extraction.json](data/word_source_extraction.json)

## 완료한 작업

1. 원본 HTML에서 Day 1~30 탭과 날짜별 MP3 URL 규칙을 확인했다.
2. Day 1~30 MP3가 모두 정상 응답하는지 확인했다.
3. MP3를 저장소가 아닌 작업용 임시 폴더에 내려받았다.
4. `faster-whisper`의 `small.en` 모델로 음성을 전사했다.
5. 영어 단어와 한국어 뜻·발음 안내가 섞인 전사 결과에서 주제와 반복 발음을 기준으로 영어 단어를 분리했다.
6. 날짜, 카테고리, 단어 배열, 원본 URL 패턴을 JSON에 기록했다.
7. JSON 문법, Day 1~30 연속성, 날짜별 빈 목록, 날짜 내 중복을 검증했다.

## 결과 상태

- 데이터 추출 상태: 완료
- 자동 전사 및 1차 분리 상태: 완료
- 결과 데이터의 `needsReview`: `true`
- 사람의 음원 대조 검수: 후속 작업
- 출판사 이용 약관·음원 재배포 권한 확인: 후속 작업

## 수집 원칙

- 원본 사이트에서 제품 실행 중 MP3를 직접 추출하지 않는다.
- 외부 MP3는 CORS, 사이트 구조 변경, 저작권 및 이용 약관 문제를 일으킬 수 있으므로 런타임 의존성으로 사용하지 않는다.
- 실제 서비스에 음성 파일을 호스팅하거나 배포하기 전 출판사 이용 약관과 음원 사용 권한을 확인한다.
- 원본 MP3 파일은 저장소에 포함하지 않았다.
- Supabase에 import하기 전 단어, 뜻, 날짜, 단계, 출처와 라이선스 정보를 추가로 검수한다.

## 후속 수정 완료

- 제품 제목을 `Word Wizard`로 변경했다.
- 음성 인식의 마이크 권한, 마이크 없음, 무음, 시작 실패를 감지하고 원인 안내와 재시도로 처리한다.
- 원본 MP3의 단어 구간을 `audio_url`, `audio_start`, `audio_end`로 재생할 수 있는 audio service와 Supabase migration을 추가했다.
- 구간 메타데이터가 아직 없는 로컬 추출 단어는 부정확한 전체 MP3를 재생하지 않고 브라우저 음성 합성으로 fallback한다.
- 가고일을 텍스트가 아닌 [gargoyle.svg](assets/gargoyle.svg) 이미지 에셋으로 교체했다.
- 마법책 쓰기를 물리 키보드 입력 없이 화면 글자 타일 선택 방식으로 변경했다.

## Word Wizard MVP 구현 완료 기록

### 단계 0~3: 기반과 공통 시스템

- Phaser 4.2.1, Vite 8.3.1, Supabase JS, Vitest 의존성을 고정했다.
- PRD의 Supabase URL과 publishable key를 클라이언트 설정에 연결했다.
- `.env.example`과 `VITE_SUPABASE_PUBLISHABLE_KEY` 환경 변수 경로를 추가했다.
- `words` 테이블과 활성 단어 공개 조회 RLS migration을 추가했다.
- Supabase 조회 실패·테이블 미적용 시 추출 JSON으로 fallback한다.
- `npm run validate:words`로 Day 1~30, 286개 단어, 날짜별 최소 수, 중복을 검증한다.
- 답안 정규화, 날짜 단어 전체 사용, `100/N / 50/N / 0` 점수 계산을 구현했다.
- 날짜별 세 게임 진행 상태를 `word-wizard-progress-v1` localStorage에 저장한다.
- 타이틀, 날짜·게임 선택, 완료 날짜 표시, 사운드 토글, Exit 흐름을 구현했다.

### 단계 4~6: 세 학습 게임

- 마법 주문 외치기: 5초 음성 녹음·판정, 권한 거부 처리, 3회 시도, 재시도를 구현했다.
- 마법책 쓰기: 화면 글자 타일, 발음 재생, 정답·오답 페이지 피드백을 구현했다.
- 마법책 쓰기 제출 시 `다 썼다` 버튼과 책장 넘김 애니메이션을 적용하고, 애니메이션 종료 후 다음 페이지를 표시한다.
- 빗자루 비행: 한국어 뜻, 날짜 단어 기반 보기 3개, 정답·오답 경로 피드백을 구현했다.
- 빗자루 비행: 단어/뜻 무작위 문제, 반대 유형 선택지 3개, 공통 정답·오답 효과음을 적용했다.
- [broom.svg](assets/broom.svg) 이미지를 중앙에 배치하고 `BROOM FLIGHT` 텍스트를 하단 작은 캡션으로 배치했다.
- [word_meanings.json](data/word_meanings.json)에 286개 추출 항목의 단어별 한국어 뜻을 연결하고, 명확한 기계 번역 오역을 수동 보정했다.
- 세 모드 모두 선택 날짜의 전체 단어를 사용하고 결과 화면 진입 시 완료 상태를 저장한다.
- 동일 게임 재시작, 다른 게임 선택, 복습 결과, 점수 표시를 구현했다.

### 단계 7~8: UI와 검증

- 오리지널 타워·마법사 SVG, favicon, 세 모드별 시각 상태와 CSS 애니메이션을 추가했다.
- 모바일 세로 화면, ARIA 이름, reduced-motion, 사운드 fallback을 반영했다.
- `npm test`: 4개 파일, 8개 테스트 통과.
- `npm run validate:words`: 30일, 286개 단어 항목 통과.
- `npm run build`: production build 통과.
- `npm run preview`: production preview에서 타이틀 화면 제공을 확인했다.
- Chromium에서 타이틀, 선택 화면, Day 1의 11개 단어 HUD, 쓰기·비행 화면, 완료 날짜 복원을 확인했다.

## 남은 작업

- 출판사 이용 약관과 MP3 기반 파생 데이터의 재배포 권한을 확인한다.
- 실제 Supabase 프로젝트에 migration과 검수된 단어 데이터를 적용한다.
- `npm run preview`와 실제 GitHub Pages 하위 경로에서 배포를 확인한다.
- 실제 지원 모바일 브라우저와 마이크 권한 환경에서 음성 인식을 검수한다.
