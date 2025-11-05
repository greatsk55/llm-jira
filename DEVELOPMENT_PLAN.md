# 개발 계획 (Development Plan)

## Phase 1: 프로젝트 구조 및 기본 설정 (1일)

### 1.1 프로젝트 초기화
- [x] monorepo 구조 설정 (또는 단일 패키지)
- [x] TypeScript 설정
- [x] 패키지 구조 설계
  ```
  llm-jira/
  ├── packages/
  │   ├── cli/          # CLI 도구
  │   ├── server/       # 백엔드 API
  │   ├── web/          # 프론트엔드
  │   └── shared/       # 공통 타입
  ├── package.json
  └── README.md
  ```

### 1.2 기본 의존성 설치
- CLI: commander, inquirer, chalk
- Server: express, cors, multer (파일 업로드)
- Database: prisma, sqlite3
- Web: react, vite, tailwindcss, react-query

## Phase 2: 데이터베이스 및 백엔드 API (2일)

### 2.1 Prisma 스키마 설계
- [ ] Issues 모델
- [ ] Attachments 모델
- [ ] Releases 모델
- [ ] Executions 모델
- [ ] 마이그레이션 파일 생성

### 2.2 Express 서버 구축
- [ ] 기본 서버 설정
- [ ] API 라우트 구조
  - `/api/issues` (CRUD)
  - `/api/attachments` (업로드/다운로드)
  - `/api/executions` (실행 관리)
  - `/api/releases` (릴리즈 관리)
- [ ] 미들웨어 설정 (CORS, body-parser, multer)
- [ ] 에러 핸들링

### 2.3 API 엔드포인트 구현
- [ ] Issues CRUD
- [ ] 파일 업로드/다운로드
- [ ] 상태 변경
- [ ] 릴리즈 생성/조회
- [ ] Git 연동 유틸리티

## Phase 3: LLM 통합 (2일)

### 3.1 LLM 프로바이더 추상화
- [ ] LLM 인터페이스 정의
- [ ] Claude API 구현
- [ ] 로컬 LLM 구현 (ollama, LM Studio)
- [ ] 설정 파일 관리

### 3.2 작업 실행 엔진
- [ ] 작업 큐 시스템
- [ ] 병렬 실행 관리
- [ ] 실행 컨텍스트 분리
- [ ] 결과 파싱 및 상태 업데이트
- [ ] 테스트 실행 로직

### 3.3 로깅 및 모니터링
- [ ] 실행 로그 저장
- [ ] 실시간 로그 스트리밍 (WebSocket 또는 SSE)
- [ ] 에러 처리

## Phase 4: 프론트엔드 UI (3일)

### 4.1 기본 레이아웃
- [ ] React 프로젝트 설정
- [ ] 라우팅 설정
- [ ] 기본 레이아웃 컴포넌트
- [ ] TailwindCSS 설정

### 4.2 작업 관리 UI
- [ ] 작업 목록 뷰 (칸반 보드 스타일)
- [ ] 작업 생성/수정 폼
- [ ] 파일 업로드 UI
- [ ] 상태별 필터링

### 4.3 실행 관리 UI
- [ ] "진행" 버튼 및 실행 트리거
- [ ] 실시간 실행 로그 표시
- [ ] 실행 상태 표시 (진행중/완료/실패)
- [ ] 병렬 실행 표시

### 4.4 릴리즈 관리 UI
- [ ] 릴리즈 목록
- [ ] 릴리즈 생성 폼
- [ ] 버전 체크아웃 UI

## Phase 5: CLI 도구 (1일)

### 5.1 CLI 명령어 구현
- [ ] `init`: 프로젝트 초기화
- [ ] `start`: 서버 시작
- [ ] `stop`: 서버 중지
- [ ] `status`: 상태 확인

### 5.2 초기화 프로세스
- [ ] 프로젝트 디렉토리 확인/생성
- [ ] 설정 파일 생성 (.llm-jira/config.json)
- [ ] 데이터베이스 초기화
- [ ] 의존성 설치
- [ ] 서버 자동 시작

## Phase 6: Git 연동 (1일)

### 6.1 Git 유틸리티
- [ ] Git 저장소 확인
- [ ] 커밋 생성
- [ ] 태그 생성
- [ ] 체크아웃 기능

### 6.2 릴리즈 프로세스
- [ ] 스냅샷 생성 (JSON)
- [ ] Git 커밋
- [ ] Git 태그
- [ ] 체크아웃 및 복원

## Phase 7: 통합 및 테스트 (2일)

### 7.1 통합 테스트
- [ ] 전체 플로우 테스트
- [ ] 에러 시나리오 테스트
- [ ] 병렬 실행 테스트

### 7.2 문서화
- [ ] README 작성
- [ ] 설치 가이드
- [ ] 사용 가이드
- [ ] API 문서

### 7.3 패키지 배포 준비
- [ ] package.json 설정
- [ ] 빌드 스크립트
- [ ] 배포 스크립트

## Phase 8: 최종 검토 및 수정 (1일)

### 8.1 버그 수정
### 8.2 성능 최적화
### 8.3 사용자 경험 개선
### 8.4 최종 테스트

---

## 기술 스택 상세

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite (via Prisma)
- **File Storage**: 로컬 파일시스템
- **Real-time**: Server-Sent Events (SSE) 또는 WebSocket

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (서버 상태) + Context API (로컬 상태)
- **UI Components**: Headless UI 또는 Radix UI

### CLI
- **Framework**: Commander.js
- **Interactive**: Inquirer.js
- **File System**: fs-extra

### LLM Integration
- **Claude**: @anthropic-ai/sdk
- **Ollama**: axios로 HTTP API 호출
- **Generic**: 명령어 실행 인터페이스

## 개발 환경 설정

```bash
# Node.js 18+ 필요
node --version

# 패키지 매니저 (pnpm 권장)
npm install -g pnpm

# 프로젝트 클론 후
pnpm install
```

## 빌드 및 실행

```bash
# 개발 모드
pnpm dev

# 프로덕션 빌드
pnpm build

# CLI 테스트
pnpm --filter cli start
```
