# 작업 기록과 재개 안내

7개 과목의 PDF 81개(1771페이지)와 sales.csv 1개가 준비되었습니다. 공개 탑재와 PR 머지·배포는 사용자가 승인했습니다. D-14 표시는 넣지 않습니다. 응용수리의 (1) 중복 2개는 바이트 단위로 완전히 동일하여 제외했습니다. 전자응용회로설계는 7주차 PDF가 없다고 사용자가 확인하여 1~6주차 각 3강만 등록합니다.

OCR 완료: 이미지가 많은 1082페이지를 처리했고, 944페이지에 검색 글자를 추가했습니다. 모든 catalog.json은 version=2, ocrVersion=2입니다. TSV 인식 결과는 csv.QUOTE_NONE으로 읽습니다. 원본 PDF 해시가 그대로인 것과 TSV 메타데이터가 색인에 섞이지 않은 것을 확인했습니다.

검증 완료: 7과목 자료 등록·검색·PDF 렌더링, 기존 노트와 삭제한 교재 보존, CSV 24행 표·행별 출처·노트 저장·오프라인 보기, 이미지 속 이승엽/score 검색과 원문 페이지 열기. 반복 OCR 명령은 완료한 카탈로그를 건너뛰어 재처리 0페이지입니다.

작업 브랜치: feature/course-library-ocr. PR: https://github.com/studyanswer/studyanswer.github.io/pull/4. 배포 상태는 PR 및 Pages API로 확인합니다. 머지된 경우 main의 해당 커밋과 공개 사이트를 기준으로 이어서 작업합니다. 이미 완료한 OCR을 다시 돌릴 필요는 없습니다.

OCR 언어 모델: /workspace/.cache/secret-note-ocr/tessdata. 페이지 캐시: /workspace/.cache/secret-note-ocr/pages-v2. 서버: 기존 체크아웃에서 python3 -m http.server 8080 --bind 127.0.0.1. 브라우저 검증은 tests/*.cjs에 저장하며 Playwright와 /usr/bin/chromium이 필요합니다. 실제 모델 의미 검색 검증은 별도 미완료이며 us.aws.cdn.hf.co 접속 허용을 환경 초안에 저장해 두었습니다. TLS 검증을 끄지 말고 기본 Chromium 신뢰 저장소를 영구 수정하지 마세요.

사용량 초기화 후 같은 대화에서 이어서 요청하면 이 기록과 Git 상태를 확인해 진행합니다. 자동 재개를 약속하지 않습니다. 시험 후 삭제 요청을 받으면 원본·검색 색인·Git 기록·기기 캐시를 함께 점검합니다.

초성 검색 추가: PDF/OCR/CSV 본문에서 초성 및 혼합 입력 지원. tests/initial-search.cjs로 기존 단어 검색, 쌍자음, 정규식 특수문자, 실제 교재/OCR 검색 검증 완료.

AI기초와활용 퀴즈 28문제 등록. 원문 문제/보기/정답/교안 해설 및 보충 설명 포함. O/X 추가, 정답 우선 표시, 기기별 설명 수정 지원. 자동 추가는 기존 수정·삭제와 개인 노트 보존. quiz-smoke 및 초성 검색 회귀 검증 통과.

AI기초와활용 29~30번 추가: AGI 5레벨 및 전통적 소프트웨어. 총 30문제, 주차 미확인 상태로 원문·교안 해설·보충 설명 보존.

AI기초와활용 31~32번 추가: 현실의 AI 및 환각 용어. 총 32문제. 교안 관점과 원문 표현을 보존하고 보충 설명 구분.

AI기초와활용 33~36번 추가: 기호주의/연결주의, 전문가 시스템, 딥러닝, GAN. 총 36문제. 35~36번 이미지 해설란은 비어 있음 표시 및 보충 설명 구분.

AI기초와활용 37~42번 추가: LLM 데이터 원천/학습 단계, 정렬, 3H, 트랜스포머, 어텐션. 총 42문제. 42번 원문 해설 없음 표시 및 보충 설명 구분.

과목 정정: AGI 5레벨부터 공학생을위한실용AI. AI기초와활용 28문제, 공학생을위한실용AI 14문제(1~14번). 기존 잘못 분류된 노트를 일회성 이동하며 수정·표시·삭제 기록 보존. 내부 ID는 중복 방지를 위해 유지.

공학생을위한실용AI 15~16번 추가: CoT 및 MCP. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 16문제.

공학생을위한실용AI 17~18번 추가: 프롬프팅 구성요소와 설명. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 18문제.

공학생을위한실용AI 19~20번 추가: MoE 및 프롬프팅과 재학습 구분. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 20문제.

공학생을위한실용AI 21~22번 추가: 프로그래밍 언어 및 구글 코랩. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 22문제.

공학생을위한실용AI 23~24번 추가: 바이브 코딩. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 24문제.

공학생을위한실용AI 25~26번 추가: 확산 모델. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 26문제.

공학생을위한실용AI 27~28번 추가: 이미지 생성 프롬프트 및 상업 광고 활용. 최종 AI기초와활용 28문제 / 공학생을위한실용AI 28문제.

반도체패키지공학실무 1~6번 등록. 총 퀴즈 62문제(AI기초 28 / 실용AI 28 / 패키징 6). 패키지 내부 전후공정과 반도체 전체 전후공정 구분 설명 포함.

반도체패키지공학실무 7~12번 등록: 웨이퍼 준비, 백그라인딩 흐름/Mesh/휠, 소잉 속도/방식. 총 패키징 12문제, 전체 68문제. 원문 오탈자와 교안 수치 보존 및 보기별 보충 설명 포함.

반도체패키지공학실무 13~18번 등록: 다이 본딩 준비/흐름/픽업도구/접착제/설비/검사. 총 패키징 18문제, 전체 74문제. 원문 보기·해설 표기 보존 및 보충 설명 구분.

반도체패키지공학실무 19~24번 등록: 와이어 본딩 작업/파라미터/도구/소재/설비/검사. 총 패키징 24문제, 전체 80문제. DST/BST/BPT 구분 설명 포함.

반도체패키지공학실무 25~30번 등록: 솔더볼·플럭스·어태치·공정 순서·Saw/Sorter. 총 패키징 30문제, 전체 86문제. 교안 해설 보존 및 일반화가 어려운 부분 보충 설명 포함.

반도체패키지공학실무 31~38번 등록: 마킹/전후공정/Trim-Form/Singulation/Off-loader/Annealing/Mask/실장 형태. 총 패키징 38문제, 전체 94문제. 교안 해설과 보충 설명 구분.

검정 과목 목록 화면: 첫 화면에는 7과목 버튼만 표시. 과목 안에서 복습 노트/자료실 접근, 정답 먼저 표시하고 오답 설명은 펼침, 단어·초성 노트 검색. 기존 94문항과 82개 자료 유지. 서비스 워커 v16.

우측 상단/하단 88×88 CSS px 영역의 pointerdown 한 번으로 전체 앱 검정 화면 전환/복귀. 검정 화면 다른 영역 터치 무시, 열린 모달 포함 가림, 검색/스크롤/복습 상태 유지. 모바일 터치 테스트 통과. 서비스 워커 v17.

과목 화면 왼쪽→오른쪽 스와이프로 목록 복귀: 80px 이상, 가로 이동 우세, 1초 이내 터치. 세로 스크롤 유지, 반대 방향/모달/입력창/복습/검정 화면 제외. 실제 모바일 터치 테스트 및 모서리 숨김 회귀 통과. 서비스 워커 v18.

노트 목록 추가·수정·삭제 버튼 제거. 노트 등록·수정은 대화로 반영, 앱은 검색·열람·복습용. 기존 개인 수정 및 삭제 상태/백업 유지 확인. 서비스 워커 v19.
과목 삭제 버튼과 이벤트 처리도 제거. 이전에 삭제한 과목은 재생성하지 않는 기존 데이터 보존 정책 유지.
PDF 빼기/삭제와 과목 추가 버튼 제거. 등록된 노트/과목/자료를 앱에서 삭제하는 UI 없음.

응용수리실무 1~12번 등록: 사용자 제공 이미지 6장, 정답 e/무한 비순환소수/4/5/0/4200/30000/뉴욕/오후10시/3/9개/9/24. 원문 해설 보존, 무리수 정의·뉴욕 런던 시차·36 소인수분해 오타 보충. 주차 미확인. 전체 106문제. 멱등 가져오기와 기존 데이터/백업/오프라인 회귀 통과. 서비스 워커 v20.

응용수리실무 13~28번 등록: 사용자 이미지 8장, 정답 4/40분/20%/100원/1km/4km/h/1km/60초/900g/40%/200g/5%/4가지/3가지/6가지/11가지. 교안의 속력 단위·거리 결과 1h·소금물 y 설명 20% 오타 보충. 과목 28문항/전체122문항. 전체 정답·기존 데이터·백업/복원·오프라인/과목 정정 회귀 통과. 서비스 워커 v21.

전자응용회로설계 1~12번 등록: 이미지 6장 모두 O. 교안 빈 해설란 명시, Schematics 버전 기준 단축키/메뉴 설명, 중첩은 독립 전원 비활성화·종속 전원 유지, 테브난 개방전압·노턴 단락전류 등 보충. 과목12/전체134문항. 기존 데이터/백업/오프라인 회귀 통과. 서비스 워커 v22.
전자응용회로설계 13~24번 추가(모두 O): 최대 전력 전달은 교안 O 보존+교류 복소켤레 조건 보충, RMS 0 이상, PARAM 스윕 설정, 종속 전원, 저항/RL/RC 위상, VOFF/DF/리사주/MULT/미분적분 조건. 과목24/전체146문항. 전체 정답·기존 데이터·백업/오프라인 회귀 통과.
전자응용회로설계 25~30번 추가(모두 O). RC 직류는 정상상태, RLC 공진은 동일 전원전압 기준, 순방향 0.7V는 근사, 브리지 정류와 충전 제어 구분, 센터탭2다이오드, 제너 역방향 전류제한 보충. 과목30/전체152문항.
전자응용회로설계 31~36번 추가(모두 O): DC/Nested Sweep, 직류 부하선, 전류이득 주파수 의존성, 공통 이미터 반전/바이패스 저역 확장 조건. 과목36/전체158문항. 미수강 나머지는 추후 이미지 제공 때 37번부터. 서비스 워커 v23.

상단 과목 목록/내 기기 저장 표시와 하단 백업/복원 영역 및 바인딩 제거. 과목 복귀는 스와이프 사용. 158문항/82자료와 개인 기록 보존, 모바일 스와이프/숨김/노트·교재 검색·오프라인·과목 정정 검사 통과. 서비스 워커 v24.

PDF 뷰어 상자·테두리 제거: 투명 전체 뷰포트 대화상자와 흐린 배경, 제목/닫기/페이지 이동 유지. PDF 가로폭100%, 실제 표시 높이의 절반만큼 하단 여백, 남는 세로 공간에서 아래쪽 정렬. PDF 닫기는 우측 모서리 숨김에서 제외하여 정상 동작. 모바일 실제 PDF/전후 페이지/닫기/레이아웃 검사 통과. 서비스 워커 v25.

PDF pinch conflict fix: defer visible PDF corner conceal until a stationary single-touch release; cancel for multi-touch, movement or cancellation, preserve immediate restore and non-PDF corner behavior. Enable browser pinch/pan in PDF viewer. Remove empty-subject startup copy so an empty library is blank. Service worker v26. Verified pdf-pinch.cjs, pdf-layout.cjs and corner-toggle.cjs with mobile Chromium touch events.

PDF controls now move with the page: place top spacing before the heading rather than between controls and canvas. Measure actual heading/control heights to retain full width and half-page bottom gap, including title wrapping. Service worker v27. PDF layout adjacency and pinch regression tests pass.

PDF single-finger horizontal swipes now navigate pages (left next/right previous) at normal zoom, ignoring vertical and multi-touch gestures. PDF closes via X, with cancel dismissal prevented. Opening PDF fixes the background body and disables root scroll; close unlocks and restores prior position. Dialog contains overscroll. Service worker v28. Mobile Chromium PDF swipe, pinch and layout tests pass, including lock/unlock, boundaries and zoomed panning exclusion.

Study layout cleanup: bottom fixed subject tabs, subject title retained at top; removed PDF upload entry and explanatory banners. Document rows open directly and support keyboard activation. Move each question's wrong-choice details after its answer; remove only the 교안해설: prefix in displayed answers without changing stored content. PDF X no longer starts focused. Fit a full PDF page at default zoom, lock normal-zoom scrolling, allow movement after zoom, preserve swipe navigation and background lock. Cache v29. clean-layout, pdf-layout, pdf-swipe, pdf-pinch and syntax/diff checks pass.

PDF double tap/click toggles 2x page zoom and fitted size, with zoomed panning and normal scroll lock. Touch detector ignores corner taps, multi-touch, movement and long holds. Close clears custom zoom. Cache v31. Mobile Chromium double-tap, pinch and swipe tests pass.
