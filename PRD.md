# LLM-Jira PRD (Product Requirements Document)

## 1. 프로젝트 개요
LLM-Jira는 로컬 환경에서 실행되는 프로젝트 관리 도구로, Jira와 유사한 UI를 제공하며 LLM을 활용한 자동화된 작업 실행 및 테스트 기능을 포함합니다.

## 2. 핵심 기능

### 2.1 설치 및 실행
- **요구사항**: npm/pnpm을 통한 원라인 설치 (`npx llm-jira init` 또는 `npm install -g llm-jira`)
- 로컬 서버 및 데이터베이스 자동 구축
- 웹 UI 자동 실행 (기본 포트: 3000)

### 2.2 작업 관리 (Issue Management)
- **상태**: TODO, ING (진행중), DONE (완료), PENDING (보류)
- **속성**:
  - 제목 (Title)
  - 세부 내용 (Description)
  - 첨부 파일 (이미지, 문서 등)
  - 생성일시, 수정일시
  - 우선순위

### 2.3 자동화 실행
- TODO 항목의 "진행" 버튼 클릭 시:
  1. 상태를 ING로 변경
  2. 연결된 LLM (Claude API 또는 로컬 LLM)에 작업 설명 전달
  3. LLM이 코드를 실행하고 테스트까지 수행
  4. 테스트 성공 시 자동으로 DONE으로 변경
  5. 실패 시 에러 로그 기록 및 PENDING으로 변경 가능

### 2.4 병렬 실행
- 여러 작업을 동시에 실행 가능
- 작업별 독립적인 실행 컨텍스트
- 실시간 상태 업데이트

### 2.5 릴리즈 관리
- 릴리즈 생성 시 현재 작업 상태들을 스냅샷으로 저장
- Git에 커밋 및 태그 생성
- 특정 릴리즈 버전으로 체크아웃 가능
- 릴리즈 히스토리 조회

## 3. 기술 스택

### Frontend
- React 18+ (TypeScript)
- Vite (빌드 도구)
- TailwindCSS (스타일링)
- React Query (상태 관리)

### Backend
- Node.js + Express (TypeScript)
- SQLite (로컬 데이터베이스)
- Prisma ORM

### CLI & 설치
- npm/pnpm 패키지
- 초기화 스크립트

### LLM 통합
- Anthropic Claude API
- 로컬 LLM 지원 (ollama, LM Studio 등)

## 4. 데이터베이스 스키마

### Issues
- id (UUID)
- title (String)
- description (Text)
- status (TODO | ING | DONE | PENDING)
- priority (LOW | MEDIUM | HIGH)
- createdAt (DateTime)
- updatedAt (DateTime)

### Attachments
- id (UUID)
- issueId (Foreign Key)
- fileName (String)
- filePath (String)
- fileType (String)
- createdAt (DateTime)

### Releases
- id (UUID)
- version (String, e.g., "v1.0.0")
- gitCommitHash (String)
- gitTag (String)
- createdAt (DateTime)
- snapshot (JSON - 작업 상태 스냅샷)

### Executions
- id (UUID)
- issueId (Foreign Key)
- status (RUNNING | SUCCESS | FAILED)
- llmResponse (Text)
- testResults (JSON)
- startedAt (DateTime)
- completedAt (DateTime)
- error (Text, nullable)

## 5. 사용자 플로우

### 5.1 초기 설정
1. `npx llm-jira init` 실행
2. 프로젝트 디렉토리 선택 또는 생성
3. LLM 설정 (API 키 또는 로컬 LLM 경로)
4. 자동으로 서버 시작 및 브라우저 오픈

### 5.2 작업 생성 및 관리
1. 웹 UI에서 새 작업 생성
2. 제목, 설명, 파일 첨부
3. 상태별 보기 (TODO, ING, DONE, PENDING)

### 5.3 자동 실행
1. TODO 항목의 "진행" 버튼 클릭
2. 백그라운드에서 LLM이 작업 수행
3. 실시간 로그 확인
4. 자동으로 상태 업데이트

### 5.4 릴리즈
1. "릴리즈 생성" 버튼 클릭
2. 버전 번호 입력 (예: v1.0.0)
3. 현재 상태 스냅샷 저장 및 Git 커밋
4. Git 태그 생성

### 5.5 버전 체크아웃
1. 릴리즈 목록에서 특정 버전 선택
2. 해당 버전의 작업 상태로 복원
3. Git 체크아웃 수행

## 6. 제약사항
- 로컬 환경에서만 실행
- SQLite 사용으로 단일 사용자 환경
- LLM API 비용은 사용자 부담

## 7. 향후 확장 가능성
- 멀티 사용자 지원
- 원격 서버 배포 옵션
- 추가 LLM 프로바이더 지원
- 웹훅 통합
