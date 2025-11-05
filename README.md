# LLM-Jira

로컬 환경에서 실행되는 LLM 기반 프로젝트 관리 도구입니다. Jira와 유사한 UI를 제공하며, LLM을 활용한 자동화된 작업 실행 및 테스트 기능을 포함합니다.

## 주요 기능

- 📋 **작업 관리**: TODO, ING, DONE, PENDING 상태로 작업 관리
- 🤖 **LLM 자동화**: Claude API 또는 로컬 LLM을 통한 자동 코드 실행 및 테스트
- ⚡ **병렬 실행**: 여러 작업을 동시에 실행 가능
- 🏷️ **릴리즈 관리**: Git 기반 버전 관리 및 스냅샷
- 📎 **파일 첨부**: 작업에 이미지 및 파일 첨부 가능

## 빠른 시작

### 설치

```bash
npx llm-jira init
```

또는 글로벌 설치:

```bash
npm install -g llm-jira
llm-jira init
```

### 초기 설정

```bash
# 프로젝트 디렉토리에서
llm-jira init
```

초기화 과정에서:
1. 프로젝트 디렉토리 선택 또는 생성
2. LLM 설정 (Claude API 키 또는 로컬 LLM 경로)
3. 자동으로 서버 시작

### 서버 시작

```bash
llm-jira start
```

기본적으로 `http://localhost:3000`에서 웹 UI에 접속할 수 있습니다.

## 사용법

### 작업 생성

웹 UI에서 "새 작업" 버튼을 클릭하여 작업을 생성합니다. 각 작업에는:
- 제목
- 세부 내용
- 첨부 파일 (선택사항)
- 우선순위

를 설정할 수 있습니다.

### 자동 실행

TODO 상태의 작업에서 "진행" 버튼을 클릭하면:
1. 상태가 자동으로 ING로 변경됩니다
2. 설정된 LLM이 작업 설명을 분석하고 코드를 실행합니다
3. 자동으로 테스트가 실행됩니다
4. 테스트 성공 시 상태가 DONE으로 변경됩니다
5. 실패 시 에러 로그가 기록되고 PENDING 상태로 변경될 수 있습니다

### 릴리즈 생성

"릴리즈" 메뉴에서 릴리즈를 생성할 수 있습니다:
- 버전 번호 입력 (예: v1.0.0)
- 현재 작업 상태가 스냅샷으로 저장됩니다
- Git 커밋 및 태그가 자동으로 생성됩니다

### 버전 체크아웃

릴리즈 목록에서 특정 버전을 선택하여 해당 버전의 작업 상태로 복원할 수 있습니다.

## LLM 설정

### Claude API

`.llm-jira/config.json` 파일에 API 키를 설정합니다:

```json
{
  "llm": {
    "provider": "claude",
    "apiKey": "your-api-key-here",
    "model": "claude-3-sonnet-20240229"
  }
}
```

### 로컬 LLM (Ollama)

```json
{
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "model": "llama2"
  }
}
```

### 커스텀 명령어

터미널에서 실행 가능한 LLM 명령어를 설정할 수 있습니다:

```json
{
  "llm": {
    "provider": "command",
    "command": "ollama run llama2"
  }
}
```

## 프로젝트 구조

```
llm-jira/
├── src/
│   ├── cli/          # CLI 명령어
│   ├── server/       # Express 서버
│   ├── shared/       # 공통 타입 및 유틸리티
│   └── index.ts      # 진입점
├── prisma/           # 데이터베이스 스키마
├── web/              # React 프론트엔드
└── package.json
```

## 개발

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run prisma:migrate

# 개발 모드 실행
npm run dev

# 빌드
npm run build
```

## 요구사항

- Node.js 18 이상
- npm 또는 pnpm

## 라이선스

MIT
