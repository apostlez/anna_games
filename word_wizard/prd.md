# title

Word Wizard

# Story

너는 영어 단어 공부가 필요하다.
지금부터 수업을 시작한다.

# object

파닉스 복습이 필요.
연상 및 확인 방법
1. 스펠링 -> 말하기, 의미
2. 의미 -> 쓰기, 말하기
3. 듣기 -> 스펠링, 의미

# 자료 조사

다른 영어 학습용 게임이 있는지
단어 및 어휘 퀴즈: Parroto에서는 실시간 1v1 대전이나 떨어지는 단어를 맞히는 워드 슈터 등 다양한 어휘 게임을 즐길 수 있습니다.
단계별 영단어 연습: 영어게임은 초중고 기초 단어부터 실전 대비 어휘까지 퀴즈 형식으로 반복 학습할 수 있는 무료 서비스를 제공합니다.
어린이 인터랙티브 학습: Novakid 게임 페이지에서는 4세 이상 어린이를 위한 무료 영어 학습 게임 콘텐츠를 이용할 수 있습니다.

# Scenario

학습 방법 (게임 시나리오)

1. 웹의 메인 페이지에 https://apostlez.github.io/anna_games/word_wizard/ 접근하면 Start 버튼와 타이틀 이미지가 표시된다.
- 타이틀 이미지는 탑을 배경으로 마법사가 지팡이와 책을 들고 주문을 외울 준비를 하는 모습이다.
2. Start 버튼을 누르면 마법책을 펼쳐 날짜를 고른다, 각 날짜의 3가지 항목을 모두 완료하면 하루의 일과가 끝난다.
3. 모든 게임 화면에는 우측 상단에 exit 버튼이 있어 종료할 수 있다.
4. 완료한 날짜는 선택 화면에서 확인할 수 있어야 한다.

- 마법 주문 외치기 : 스펠북에 나타난 단어를 읽으면 마법이 나가서 괴물을 쫒는다.
    - 정면에서 가고일이 날아오는 동안 앞에 펼쳐진 책에 단어가 나타난다.
    - 마이크 표시가 활성화되면 단어를 읽고, 읽은 단어가 올바르게 읽으면 파이어볼이 지팡이에서 발사된다.
    - 마법이 나갈 때 뜻을 글자를 표시하고 소리도 출력
    - 10 개를 모두 맞추면 축하 메시지 표시
    - 100 점 만점에 점수를 표시
    - 마이크, 사운드 사용
- 마법책 쓰기 : 스승님이 불러주는 단어를 책에 적는다.
    - 스펠링이 맞으면 마법책이 빛나며 다음 장으로 넘어간다.
    - 스펠링이 틀리면 해당 페이지가 붍타 사라진다.
    - 10 개를 모두 맞추면 축하 메시지 표시
    - 100 점 만점에 점수를 표시
    - 사운드 사용
- 빗자루 비행: 한글로 쓰인 쪽지를 보고 갈림길에서 맞는 단어를 선택해서 전진한다.
    - 10 개를 모두 맞추면 커다란 탑에 도착
    - 점수에 따라 작은 탑에 도착
단어 선택은 데이터베이스에서 가져온다

# 데이터베이스 및 기능
단어:
사운드북: https://nexusbook.com/qr/word/mp3.asp?step=2&ctype=textbook
mp3 에서 단어를 추출해 text 로 기록한다.
텍스트 단어를 발음을 출력하는 기능 필요.
녹음한 단어를 텍스트로 인식하는 기능 필요


supabase project url: https://nknybfpwlzrjhdygsxts.supabase.co
publichable key: sb_publishable_IKl8qJp1ZyT-cG4B6eVt1g_D3nxtU68

# 캐릭터

마법사 이미지를 생성한다, 생성할 수 없으면 생성할 수 있는 적절한 모델이나 서비스를 프롬프트와 함께 추천

# 1차 구현 완료 후 수정 및 피드백

title 변경 : Word Wizard
마이크로 읽기가 동작하지 않음.
발음이 실제 단어와 다르게 부정확하다, 실제 mp3 에서 해당 단어 부분만 부분 재생하는 방식으로 사용할 수 있나?

가고일은 텍스트가 아니라 이미지를 생성하도록 해라
키보드 입력 부분은 불필요하다, 키보드 입력으로 처리하는 부분은 모두 제거해라

단어를 인식하는 시간이 너무 짧다, 읽고 생각하는 시간을 감안해 5초 정도로 늘려라
그리고 가고일이 너무 귀엽다. 좀 더 멋있게 고쳐봐라,
SPELLBOOK 에서 가운데 불필요한 박스가 보인다
책으로 보이는데. 이 책은 "페이지에 쓰기" 를 눌렀을 때 책장이 넘어가는 애니메이션으로 처리하면 좋겠다.
그리고 애니메이션이 끝나면 사라져서 버튼을 누르는데 불편하지 않도록 해라
그리고 "페이지에 쓰기"의 라벨을 "다 썼다" 로 고쳐라

SPELLBOOK 에서 글자를 선택하면 화면이 깜박인다, 이 문제를 수정해라

SPELLBOOK 에서 정답과 오답을 입력했을 때 나오는 적절한 효과음을 추가해라

SPELLBOOK 에서 다음 문제로 넘어가면 음성 재생이 일어나야 한다.
그리고 마법 주문 외치기에서 음성 인식 시간이 여전히 짧다.
그리고 3번 틀리면 다음 문제로 넘어가도록 해라.
갈림길에서는 단어, 또는 단어의 뜻이 나와야 한다.
선택지는 문제가 단어일 때는 뜻을 표시하고
문제가 뜻 인 경우 단어를 표시한다.
3개의 단어, 또는 뜻은 선택된 단어와 그날의 단어 중에서 무작위 2개를 추가로 선택해 보여준다.
마찬가지로 정답과 오답에 대한 효과음을 동일하게 적용해라
갈림길에서는 뜻 다시 듣기 버튼이 불필요하다

빗자루 비행에서 문제와 올바른 뜻이 맞지 않는다, 각 단어와 올바른 뜻이 매치되도록 데이터를 점검하고 수정해라,
그리고 broom flight 텍스트를 작게 아래쪽에 배치하고 멋진 빗자루 이미지를 생성해 가운데 배치하도록 해라
마법 주문 외치기에서 "마이크로 읽기"를 선택하면 즉시 실패로 넘어간다, 소리를 5초 동안 녹음하고 판단하도록 수정해라

마법 주문 외치기에서 chrome 에서 버튼이 "녹음 중" 으로 바뀌고 "녹음한 음성을 확인하는 중입니다" 뒤에 상태가 바뀌지 않는다.
"마이크로 읽기" 를 선택하면 라벨을 "완료" 로 표시하고 버튼을 누르면 녹음을 중지하고 확인하는 단계로 넘어가도록 해라.
최대 녹음 시간은 5초로 한다.

마법 주문 외치기에서 버튼을 누를때마다 화면이 깜박인다, 이를 수정해라

이미지를 생성하는 적절한 AI 모델이 있는지 알려줘라

있습니다. 이 프로젝트에는 다음 조합이 적합합니다.

| 용도 | 추천 모델/서비스 | 장점 |
|---|---|---|
| 캐릭터·가고일·빗자루 일관성 | **FLUX.1 Kontext / FLUX Pro** | 참조 이미지 기반 수정과 스타일 유지 |
| 빠른 제작·API 연동 | **OpenAI Image Generation** | 프롬프트와 참조 이미지 사용이 쉬움 |
| 상업 배포 권리 관리 | **Adobe Firefly** | 기업용 라이선스·편집 workflow |
| 대량 스프라이트 제작 | **ComfyUI + FLUX/SDXL** | LoRA, 포즈·크기·배경 제어 가능 |

**권장 선택:**  
초기 에셋은 OpenAI Image Generation 또는 FLUX Kontext로 제작하고, 배경 제거와 크기 정리는 별도 이미지 편집 도구로 처리하는 방식입니다.

가고일 프롬프트 예시:

```text
Original dark fantasy gargoyle for a children's English learning game,
angular stone armor, large swept horns, sharp wings, glowing red eyes,
serious intimidating expression, dramatic three-quarter pose,
full body, centered composition, transparent background,
polished 2D game asset, no text, no logo, no recognizable franchise.
```

빗자루 프롬프트 예시:

```text
Original magical flying broom for a fantasy English learning game,
dark carved wood handle, warm gold bands, dramatic feather-like bristles,
subtle green magical glow, dynamic three-quarter angle,
isolated transparent background, polished 2D game asset,
no text, no logo, no recognizable franchise.
```

배포 전에는 생성 서비스의 상업 이용 조건과 라이선스를 반드시 확인해야 합니다.