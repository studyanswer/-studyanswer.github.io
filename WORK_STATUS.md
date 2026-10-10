# 재개 지점

사용자가 사용량 초기화 후 같은 대화에서 이어서 진행하기를 원합니다. 자동 재개를 약속하지 않습니다.

## 완료

- 7개 과목 PDF 81개(1771페이지), 실용AI의 sales.csv 24행 등록 구조 완성.
- 응용수리 1주차 1·2강의 (1) 파일 2개는 SHA-256까지 완전히 동일하므로 제외.
- 전자응용회로는 1~6주차 각 3강; 사용자가 7주차 PDF 없음 확인.
- CSV 표 보기·행별 검색·원본 다운로드·노트 저장 구현.
- 모든 과목의 기본 등록, 검색, PDF 렌더링, CSV, 기존 노트 보존 테스트 통과 (OCR 전).
- 공개 탑재 및 PR 머지·배포는 사용자가 승인. D-14 표시는 넣지 말 것.
- 원본 PDF는 변경하지 않음.

## 진행 중 / 배포 전 필수

1082개 이미지 페이지 OCR을 4개 프로세스로 처리함. 첫 결과의 TSV 따옴표 처리 문제가 확인되어 csv.QUOTE_NONE으로 수정. 올바른 파서로 재처리 중이며, 완료 전 기존 OCR 색인은 검증 완료로 간주하면 안 됨.

실행: python3 scripts/ocr-library.py --tessdata-dir /workspace/.cache/secret-note-ocr/tessdata --workers 4

캐시: /workspace/.cache/secret-note-ocr/pages-v2. 현재 실행을 확인하고, 완료했으면 다시 OCR을 하지 말 것. ocrVersion=2가 올바른 파서 결과. 미완료이면 같은 명령으로 재개.

완료 후:
1. 모든 catalog.json의 ocrVersion=2 확인. OCR 텍스트에 탭/TSV 메타데이터가 섞이지 않았는지 확인. 원본 PDF 해시 확인.
2. /tmp/secret-note-seven-subjects.cjs 및 /tmp/secret-note-multi-library-test.cjs 실행. 마이그레이션 검사에는 state.builtinLibraryIds도 초기화하여 버전1 상태를 올바르게 시뮬레이션해야 함.
3. OCR 전에는 없던 검색어(컴퓨터: 이승엽/박찬호/입력도우미, 프로그래밍: printf/scanf/switch)의 실제 검색 결과와 원문 페이지 렌더링 검증. OCR 오류 가능성 표시 확인.
4. scripts/ocr-library.py를 다시 실행하면 완료한 카탈로그가 모두 skip되는지 확인.
5. 작업 브랜치에 최종 색인과 검증 결과 커밋. 이 문서는 완료 상태로 갱신하거나 삭제.
6. PR을 검토 가능한 상태로 만든 뒤 머지하고 Pages 빌드 및 공개 PDF/CSV/색인 URL 검증.

아직 main에는 이번 6과목 추가와 OCR을 배포하지 않음. main은 AI기초 14개 버전. 실제 의미 검색 모델 검증은 아직 별도 미완료이며 클라우드 모델 CDN 제한이 남아 있을 수 있음. 환경의 기본 Chromium 신뢰 저장소를 수정하는 작업은 자동 검토가 거부했음; 영구 신뢰 변경이나 TLS 검증 비활성화로 우회하지 말 것. 필요한 도메인 us.aws.cdn.hf.co는 설정 초안에 추가 저장됨.
