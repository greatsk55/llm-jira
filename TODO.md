# TODO List

## 진행 중인 작업
- 없음

## 다음 개발 예정 항목

### 향후 개선 항목
- [ ] 릴리즈 버전 태그 연동 (Git 태그 자동 생성)
- [ ] 다국어 지원 확장 (독일어, 프랑스어 등)
- [ ] 사용자 인증 및 권한 관리
- [ ] 프로젝트 별 워크스페이스 분리
- [ ] 작업 템플릿 기능
- [ ] 커스텀 필드 추가 기능
- [ ] 활동 로그 및 감사 추적

## 완료된 항목
- [x] 프로젝트 초기 설정
- [x] Prisma 스키마 정의 및 마이그레이션
- [x] Express 서버 구축
- [x] CLI 툴 개발 (init, start, stop, status)
- [x] React + Vite 웹 UI 구축
- [x] Tailwind CSS 스타일링
- [x] 칸반 보드 UI
- [x] 이슈 CRUD 기능
- [x] 첨부파일 업로드/다운로드
- [x] 릴리즈 버전 관리
- [x] 릴리즈 스냅샷 조회
- [x] 완료된 작업 숨기기 토글
- [x] 반응형 디자인
- [x] 카드 디자인 개선 (프리미엄 UI)
- [x] LLM 룰 파일 자동 생성 (CLAUDE.md, GEMINI.md, CHATGPT.md)
- [x] Task 실행 API 엔드포인트 (/api/tasks/:id/execute)
- [x] 터미널 명령 백그라운드 실행
- [x] 실행 상태 추적 및 관리
- [x] 드래그 앤 드롭으로 작업 상태 변경
- [x] TODO 카드에 빠른 실행 버튼 추가
- [x] 실행 기록 클릭하여 로그 확인
- [x] 언어 선택 기능 (한국어, 영어, 일본어, 중국어)
- [x] 룰 파일 자동 생성 (언어별 가이드라인)
- [x] 도메인 기반 병렬 실행 시스템
- [x] 도메인 태그 필드 추가 (DB, API, UI)
- [x] 도메인 충돌 감지 및 방지
- [x] Server-Sent Events 로그 스트리밍 API
- [x] 실시간 로그 모니터링 UI (LogStream 컴포넌트)
- [x] 서버 사이드 검색 기능 (제목/설명)
- [x] 검색 디바운싱 (300ms)
- [x] 우선순위별 서버 사이드 필터링
- [x] 정렬 기능 (sortBy, sortOrder)
- [x] IssueDetailModal에 실행 버튼 (이미 TaskExecutor로 구현됨)
- [x] 명령어 입력 폼
- [x] 실행 상태 표시 (RUNNING/SUCCESS/FAILED)
- [x] 실시간 로그 출력
- [x] 취소 버튼
- [x] Task 삭제 기능 (API 및 UI)
- [x] IssueDetailModal에 삭제 버튼 추가
- [x] IssueCard에 삭제 버튼 추가 (hover 시 표시)
- [x] 도메인 세분화 규칙 추가 (CLAUDE.md)
- [x] 작업 상태 자동 분류 규칙 (DONE/PENDING/TODO)
- [x] 재실행 시 이전 실행 로그 컨텍스트 제공
- [x] 병렬 작업 자동 실행 버튼 구현
- [x] 도메인 충돌 감지 및 자동 필터링
- [x] 이전 실행 기록을 새 실행에 포함
- [x] TODO_DETAILED.md 작성 (18개 상세 Task)
- [x] 18개 상세 Task를 DB에 Issue로 추가

### 5. 알림 시스템 (DB에 추가됨)
- [x] 브라우저 알림 권한 요청 기능 (Issue로 추가됨)

### 6. 대시보드 (DB에 추가됨)
- [x] 작업 통계 대시보드 페이지 구현 (Issue로 추가됨)
- [x] 대시보드 통계 API 엔드포인트 구현 (Issue로 추가됨)

### 7. 첨부파일 개선 (DB에 추가됨)
- [x] 이미지 첨부파일 미리보기 기능 (Issue로 추가됨)
- [x] 파일 다중 업로드 및 드래그 앤 드롭 구현 (Issue로 추가됨)
- [x] 파일 용량 제한 설정 기능 (Issue로 추가됨)

### 8. 릴리즈 관리 개선 (DB에 추가됨)
- [x] 릴리즈 노트 작성 기능 (Issue로 추가됨)
- [x] 릴리즈 비교 기능 (Issue로 추가됨)
- [x] 릴리즈 삭제 기능 (Issue로 추가됨)

### 9. 성능 최적화 (DB에 추가됨)
- [x] Issue 목록 무한 스크롤 구현 (Issue로 추가됨)
- [x] 이미지 레이지 로딩 구현 (Issue로 추가됨)
- [x] API 응답 캐싱 구현 (Issue로 추가됨)
- [x] 웹소켓 실시간 업데이트 구현 (Issue로 추가됨)

### 10. 테스트 (DB에 추가됨)
- [x] Issue CRUD API 단위 테스트 작성 (Issue로 추가됨)
- [x] Kanban 보드 E2E 테스트 작성 (Issue로 추가됨)
- [x] CI/CD 파이프라인 구축 (GitHub Actions) (Issue로 추가됨)

## 버그 및 개선사항
- 없음

## 참고사항
- Tailwind CSS v4 사용 중 (`@import "tailwindcss"` 문법)
- SQLite 데이터베이스 사용 (enum 미지원)
- TypeScript strict mode 적용
