# Claude 작업 실행 가이드라인

이 파일은 LLM JIRA 시스템에서 작업을 실행할 때 따라야 할 규칙입니다.

## 작업 완료 기준 및 상태 관리

### 중요: 작업 완료 시 상태 업데이트 필수

**작업을 실행한 LLM은 반드시 작업 완료 후 API를 호출하여 Issue 상태를 업데이트해야 합니다.**

```bash
# 작업 완료 시 상태 업데이트 API 호출
curl -X PUT http://localhost:3001/api/issues/{ISSUE_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE", "reason": "모든 요구사항 완료, 빌드 및 테스트 성공"}'
```

**환경 변수:**
- `ISSUE_ID`: 현재 작업 중인 Issue의 ID (실행 명령어에 포함됨)
- API 서버: `http://localhost:3001`

**상태 값:**
- `TODO`: 재시도 필요 (빌드 실패, 테스트 실패 등)
- `PENDING`: 외부 요인으로 완료 불가 (의존성 부족, 의사결정 필요 등)
- `DONE`: 모든 조건 충족하여 완료
- `ING`: 실행 중 (자동 설정됨, 수동 설정 불필요)

### 작업 상태 자동 분류

작업 실행 후 다음 기준으로 상태를 업데이트하세요:

1. **DONE (완료)**: 다음 조건을 **모두** 만족할 때
   - ✅ 모든 요구사항이 완전히 구현됨
   - ✅ 빌드/컴파일이 성공함 (해당되는 경우)
   - ✅ 모든 테스트가 통과함 (해당되는 경우)
   - ✅ 실행 중 에러가 발생하지 않음
   - ✅ 코드 리뷰 수준의 품질 확인
   - **예**: 빌드 성공, 테스트 통과, 기능 완전 구현

2. **PENDING (보류)**: 다음 조건 중 **하나라도** 해당할 때
   - ⏸️ 의존성 문제로 진행 불가 (다른 작업 완료 대기)
   - ⏸️ 외부 리소스 필요 (API 키, 라이브러리, 설정 등)
   - ⏸️ 기술적 결정 필요 (아키텍처 선택, 라이브러리 선택 등)
   - ⏸️ 일부만 구현되었으나 완료 불가능한 상황
   - ⏸️ 해결 방법을 찾지 못한 버그/이슈 존재
   - **예**: npm 패키지 누락, 설정 파일 없음, 의사결정 필요

3. **TODO (재시도 필요)**: 다음 조건 중 **하나라도** 해당할 때
   - ❌ 빌드 실패 (재시도로 해결 가능한 경우)
   - ❌ 일부 테스트 실패
   - ❌ 런타임 에러 발생
   - ❌ 요구사항 미충족
   - ❌ 코드 품질 기준 미달
   - **예**: 타입 에러, 테스트 실패, 로직 오류

### 상태 업데이트 자동화 규칙

작업 실행 후 **반드시** Issue 상태를 업데이트하세요:

```bash
# 실행 성공 판단 기준
if (빌드_성공 && 테스트_통과 && 에러_없음 && 요구사항_충족) {
  curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
    -H "Content-Type: application/json" \
    -d '{"status": "DONE", "reason": "모든 요구사항 완료"}'
} else if (의존성_부족 || 외부_리소스_필요 || 해결불가_문제) {
  curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
    -H "Content-Type: application/json" \
    -d '{"status": "PENDING", "reason": "의존성 부족 또는 외부 리소스 필요"}'
} else {
  curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
    -H "Content-Type: application/json" \
    -d '{"status": "TODO", "reason": "재시도 필요"}'
}
```

### 작업 실행 워크플로우 예시

```bash
#!/bin/bash
# LLM이 실행하는 전체 워크플로우 예시

# 1. 작업 수행 (예: 코드 수정)
echo "IssueCard.tsx 수정 중..."
# ... 코드 수정 작업 ...

# 2. 빌드 확인
npm run build
BUILD_STATUS=$?

# 3. 테스트 실행 (있는 경우)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
  npm test
  TEST_STATUS=$?
else
  TEST_STATUS=0  # 테스트 없으면 성공으로 간주
fi

# 4. 결과에 따라 상태 업데이트
if [ $BUILD_STATUS -eq 0 ] && [ $TEST_STATUS -eq 0 ]; then
  # 성공: DONE으로 업데이트
  curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
    -H "Content-Type: application/json" \
    -d '{"status": "DONE", "reason": "빌드 및 테스트 성공"}'
  echo "✅ 작업 완료: DONE"
else
  # 실패: TODO로 업데이트 (자동 재시도됨)
  if [ $BUILD_STATUS -ne 0 ]; then
    REASON="빌드 실패"
  else
    REASON="테스트 실패"
  fi

  curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
    -H "Content-Type: application/json" \
    -d "{\"status\": \"TODO\", \"reason\": \"$REASON\"}"
  echo "❌ 작업 실패: $REASON - 자동으로 재시도됩니다"
  exit 1
fi
```

### 완전한 구현 체크리스트

작업을 DONE으로 표시하기 전 확인:

1. **기능 완성도**:
   - [ ] 모든 요구사항이 완전히 구현됨
   - [ ] 코드가 올바르게 동작함
   - [ ] 기존 기능이 손상되지 않음

2. **테스트 및 검증**:
   - [ ] 단위 테스트 작성 (해당되는 경우)
   - [ ] 엣지 케이스 고려
   - [ ] 에러 처리 확인
   - [ ] 모든 테스트 통과 확인

3. **코드 품질**:
   - [ ] 깨끗하고 읽기 쉬운 코드 작성
   - [ ] 적절한 주석 추가
   - [ ] 일관된 코딩 스타일 유지
   - [ ] 보안 취약점 확인 (XSS, SQL Injection, Command Injection 등)

4. **문서화**:
   - [ ] 복잡한 로직은 설명 추가
   - [ ] API 변경사항 문서화
   - [ ] 필요시 README 업데이트

## 재실행 시 컨텍스트 활용

같은 작업을 재실행할 때는 **이전 실행 기록을 자동으로 참고**합니다:

### 자동 재시도 메커니즘

시스템은 작업 실패 시 **최대 3회까지 자동으로 재시도**합니다:

1. **재시도 조건**:
   - LLM이 상태를 업데이트하지 않고 프로세스가 종료됨
   - Exit code가 0이 아님 (실패)
   - 재시도 가능한 에러 패턴 감지 (타입 에러, 빌드 실패 등)

2. **재시도 불가능 조건 (즉시 PENDING)**:
   - 파일/명령어 없음 (ENOENT, not found)
   - 권한 문제 (permission denied)
   - 의존성 문제 (dependency, missing)
   - 연결 실패 (connection refused, timeout)

3. **이전 컨텍스트 자동 제공**:
   - 시스템이 자동으로 이전 실행 기록을 로그에 출력
   - LLM은 이전 에러를 참고하여 다른 방법으로 시도
   - 같은 실수를 반복하지 않도록 학습

### 재시도 예시 시나리오

**시나리오 1: 타입 에러 자동 재시도**
```
[시도 1]
❌ 빌드 실패: Property 'domain' does not exist on type 'Issue'
→ 시스템이 자동으로 TODO 상태로 설정
→ 2초 후 재시도

[시도 2 - 이전 에러 참고]
📝 이전 실패: Property 'domain' does not exist
✅ 타입 정의에 domain 필드 추가
✅ 빌드 성공
→ LLM이 DONE으로 업데이트

최종 상태: DONE
```

**시나리오 2: 의존성 문제로 PENDING**
```
[시도 1]
❌ Error: Cannot find module 'zod'
→ 시스템이 "의존성 문제" 패턴 감지
→ 재시도 불가능으로 판단
→ 즉시 PENDING 상태로 설정

최종 상태: PENDING
이유: 의존성 패키지 누락 - 수동 설치 필요
```

**시나리오 3: 최대 재시도 횟수 초과**
```
[시도 1] ❌ 테스트 실패
[시도 2] ❌ 테스트 실패 (다른 케이스)
[시도 3] ❌ 테스트 실패 (여전히 문제)
→ 최대 재시도 횟수(3) 초과
→ PENDING 상태로 설정

최종 상태: PENDING
이유: 3회 재시도 후에도 해결 불가
```

### LLM이 직접 재시도하는 방법

LLM이 작업 중 문제를 감지하고 다시 시도하고 싶다면:

```bash
# 현재 시도 실패 - TODO로 표시
curl -X PUT http://localhost:3001/api/issues/$ISSUE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "TODO", "reason": "첫 시도 실패 - 다른 방법으로 재시도 예정"}'

# 이후 시스템이 자동으로 재실행하거나,
# LLM이 같은 명령 내에서 다른 방법 시도 가능
```

### 이전 실행 기록 분석 예시

```
--- 시도 1 (2025-01-15 10:30:00) ---
에러: TypeError: Cannot read property 'map' of undefined
출력: Build started... Compiling TypeScript...

→ 분석: undefined 체크 누락
→ 해결: Optional chaining 또는 null 체크 추가

--- 시도 2 (2025-01-15 10:32:15) ---
에러: Test failed: expected 5 to equal 6
출력: All tests passed except 1

→ 분석: 로직 오류
→ 해결: 계산 로직 수정

--- 시도 3 (2025-01-15 10:34:30) ---
✅ 성공: 모든 테스트 통과, 빌드 성공
```

## 작업 실패 시

- 문제를 명확히 설명
- 시도한 해결 방법 기록
- 작업을 PENDING 또는 TODO로 표시 (재시도 가능 여부에 따라)
- 도움이 필요한 부분 명시
- 다음 실행 시 참고할 수 있도록 execution 기록에 상세 정보 저장

## 도메인 기반 병렬 실행

시스템은 도메인 태그를 사용하여 안전한 병렬 작업 실행을 지원합니다.

### 도메인 태그 개념

- 각 작업(Issue)은 선택적으로 **도메인 태그**를 가질 수 있습니다
- 도메인은 작업이 영향을 미치는 코드베이스의 영역을 나타냅니다
- **중요**: 도메인은 가능한 한 **세분화**하여 병렬 실행을 최대화해야 합니다

### 도메인 세분화 전략

**나쁜 예 (너무 광범위)**:
- ❌ `frontend` - 너무 광범위하여 병렬 실행 기회를 제한
- ❌ `backend` - 전체 백엔드는 많은 파일을 포함

**좋은 예 (세분화된 도메인)**:
- ✅ `ui-header` - 헤더 컴포넌트만 수정
- ✅ `ui-modal` - 모달 컴포넌트만 수정
- ✅ `api-issues` - 이슈 API 엔드포인트만 수정
- ✅ `api-tasks` - 태스크 API 엔드포인트만 수정
- ✅ `db-schema-users` - 사용자 관련 스키마만 수정
- ✅ `db-schema-tasks` - 태스크 관련 스키마만 수정
- ✅ `styles-tailwind` - Tailwind 설정만 수정
- ✅ `config-vite` - Vite 설정만 수정
- ✅ `test-unit-issues` - 이슈 단위 테스트
- ✅ `test-e2e-auth` - 인증 E2E 테스트

### 도메인 분류 가이드라인

1. **컴포넌트 레벨로 분리**:
   - `ui-[컴포넌트명]`: 예) `ui-board`, `ui-issuecard`, `ui-modal`
   - `api-[리소스명]`: 예) `api-issues`, `api-releases`, `api-executions`

2. **파일/경로 기반 분리**:
   - `src-server-routes-[파일명]`: 예) `src-server-routes-issues`
   - `web-components-[컴포넌트명]`: 예) `web-components-board`

3. **기능 단위로 분리**:
   - 같은 파일을 수정하는 작업은 같은 도메인
   - 다른 파일을 수정하는 작업은 다른 도메인
   - 의존성이 없는 작업은 반드시 다른 도메인으로 분리

4. **테스트 도메인**:
   - `test-unit-[모듈명]`
   - `test-e2e-[기능명]`
   - `test-integration-[영역명]`

**핵심 원칙**: 코드 충돌이 발생하지 않는 최소 단위로 도메인을 나누어 병렬 실행을 극대화하세요.

### 병렬 실행 규칙

1. **도메인 충돌 방지**:
   - 같은 도메인의 작업은 동시에 실행할 수 없습니다
   - 예: `frontend` 도메인 작업이 실행 중이면, 다른 `frontend` 작업은 대기해야 합니다
   - 서로 다른 도메인의 작업은 병렬로 실행 가능합니다

2. **자동 작업 선택 시**:
   - `/api/tasks/running` 엔드포인트로 현재 실행 중인 도메인을 확인하세요
   - TODO 상태의 작업 중에서 **현재 실행 중이지 않은 도메인**의 작업만 선택하세요
   - 도메인 태그가 없는 작업은 항상 실행 가능합니다

3. **도메인 태깅 지침**:
   - 작업이 특정 영역에만 영향을 준다면 명확한 도메인 태그를 부여하세요
   - 여러 영역에 걸친 작업이라면 가장 주된 영역의 태그를 사용하세요
   - 전체 시스템에 영향을 주는 작업은 도메인 태그를 비워두세요

### 예시 시나리오

**시나리오 1: 안전한 병렬 실행**
- 작업 A: `frontend` 도메인 - React 컴포넌트 수정
- 작업 B: `backend` 도메인 - API 엔드포인트 추가
- → 두 작업은 안전하게 병렬 실행 가능 ✅

**시나리오 2: 충돌 방지**
- 작업 A: `database` 도메인 - 스키마 마이그레이션 (실행 중)
- 작업 B: `database` 도메인 - 새 모델 추가
- → 작업 B는 작업 A가 완료될 때까지 대기 ⏸️

**시나리오 3: 혼합 실행**
- 작업 A: `frontend` 도메인 (실행 중)
- 작업 B: `backend` 도메인 (실행 가능)
- 작업 C: `frontend` 도메인 (대기)
- 작업 D: 도메인 없음 (실행 가능)
- → B와 D는 실행 가능, C는 A 완료 후 실행 ⏳

### API 사용 예시

```javascript
// 1. 현재 실행 중인 도메인 확인
const { runningDomains } = await fetch('/api/tasks/running').then(r => r.json());

// 2. 실행 가능한 작업 필터링
const todoIssues = await fetch('/api/issues?status=TODO').then(r => r.json());
const executableIssues = todoIssues.filter(issue =>
  !issue.domain || !runningDomains.includes(issue.domain)
);

// 3. 작업 실행 (도메인 충돌 시 409 에러 반환)
const result = await fetch(`/api/tasks/${issueId}/execute`, {
  method: 'POST',
  body: JSON.stringify({ command, llmProvider })
});
```

## Task 작성 규칙

효과적인 Task를 작성하기 위한 필수 규칙입니다. LLM이 Task를 완벽하게 이해하고 실행할 수 있도록 제목, 설명, 도메인을 명확하게 작성하세요.

### Task 제목 작성 규칙

Task 제목은 **구체적이고 실행 가능한 동사**로 시작해야 합니다.

#### 좋은 제목 (구체적이고 측정 가능)

- ✅ "IssueCard 컴포넌트에 우선순위 배지 추가"
- ✅ "사용자 인증 API에 JWT 토큰 검증 로직 구현"
- ✅ "Board 페이지 로딩 시간 3초 이하로 최적화"
- ✅ "Prisma 스키마에 Comment 모델 추가 및 마이그레이션"
- ✅ "TaskExecutor의 메모리 누수 버그 수정"
- ✅ "Issue 생성 시 도메인 자동 추론 기능 구현"

#### 나쁜 제목 (모호하고 측정 불가능)

- ❌ "프론트엔드 개선" → 너무 광범위함
- ❌ "버그 수정" → 어떤 버그인지 불명확
- ❌ "성능 향상" → 무엇을, 얼마나 향상시킬지 불명확
- ❌ "리팩토링" → 어떤 코드를 어떻게 리팩토링할지 불명확
- ❌ "새 기능 추가" → 어떤 기능인지 불명확

#### 제목 작성 패턴

```
[대상] + [동작] + [세부사항]

예시:
- "IssueCard 컴포넌트" + "추가" + "우선순위 배지"
- "사용자 인증 API" + "구현" + "JWT 토큰 검증"
- "Board 페이지" + "최적화" + "로딩 시간 3초 이하"
```

### Task 설명(Description) 작성 규칙

Task 설명은 LLM이 **자율적으로 완료**할 수 있도록 충분한 정보를 제공해야 합니다.

#### 필수 포함 요소

1. **목표 (What)**: 무엇을 달성해야 하는가?
2. **이유 (Why)**: 왜 이 작업이 필요한가?
3. **구현 세부사항 (How)**: 어떻게 구현할 것인가?
4. **완료 조건 (Done Criteria)**: 어떻게 완료를 판단하는가?
5. **제약사항 (Constraints)**: 지켜야 할 규칙이나 제약이 있는가?
6. **참고사항 (References)**: 관련 파일, 코드, 문서가 있는가?

#### 설명 작성 템플릿

```markdown
## 목표
[무엇을 달성할 것인지 1-2문장으로 명확히 설명]

## 배경/이유
[왜 이 작업이 필요한지 설명]

## 구현 세부사항
1. [첫 번째 단계]
2. [두 번째 단계]
3. [세 번째 단계]

## 완료 조건
- [ ] [조건 1]
- [ ] [조건 2]
- [ ] [조건 3]

## 제약사항
- [제약사항 1]
- [제약사항 2]

## 참고사항
- 관련 파일: `src/path/to/file.ts`
- 참고 이슈: #123
- 문서: https://...
```

#### 좋은 설명 예시

```markdown
## 목표
IssueCard 컴포넌트에 우선순위를 시각적으로 표시하는 배지를 추가합니다.

## 배경/이유
사용자가 Kanban 보드에서 Issue의 우선순위를 빠르게 식별할 수 있도록 개선이 필요합니다.
현재는 상세 모달을 열어야만 우선순위를 확인할 수 있어 UX가 불편합니다.

## 구현 세부사항
1. `web/src/components/IssueCard.tsx` 파일 수정
2. 우선순위별 색상 정의:
   - HIGH: 빨간색 (#EF4444)
   - MEDIUM: 노란색 (#F59E0B)
   - LOW: 회색 (#6B7280)
3. 카드 우측 상단에 배지 컴포넌트 추가
4. 배지는 둥근 모서리 스타일 적용 (rounded-full)
5. Tailwind CSS 사용

## 완료 조건
- [ ] 모든 우선순위(HIGH/MEDIUM/LOW)에 배지가 정확히 표시됨
- [ ] 배지 색상이 우선순위에 맞게 적용됨
- [ ] 반응형 디자인 유지 (모바일에서도 정상 표시)
- [ ] TypeScript 타입 에러 없음
- [ ] 빌드 성공

## 제약사항
- 기존 IssueCard 레이아웃을 크게 변경하지 말 것
- Tailwind CSS만 사용 (별도 CSS 파일 생성 금지)
- 접근성(a11y) 고려 (색맹 사용자를 위한 텍스트 포함)

## 참고사항
- 관련 파일: `web/src/components/IssueCard.tsx`
- 타입 정의: `src/types/index.ts` (Priority 타입)
- 디자인 참고: Jira, Linear 등의 유사 기능
```

#### 나쁜 설명 예시

```markdown
❌ "카드에 배지 추가해주세요"
→ 문제점: 무엇을, 왜, 어떻게 추가할지 불명확

❌ "우선순위 기능 만들기"
→ 문제점: 이미 우선순위가 있는지, 새로 만드는지, UI/API 중 무엇인지 불명확

❌ "Issue.tsx 수정"
→ 문제점: 무엇을 어떻게 수정할지 전혀 알 수 없음
```

### 도메인(Domain) 작성 규칙

도메인은 **가능한 한 세분화**하여 병렬 실행 기회를 최대화해야 합니다.

#### 도메인 명명 규칙

1. **소문자와 하이픈 사용**: `ui-issue-card`, `api-auth`
2. **계층 구조 반영**: `ui-`, `api-`, `db-`, `config-`, `test-` 등의 접두사
3. **구체적인 범위**: 파일명이나 컴포넌트명 포함

#### 도메인 결정 플로우차트

```
작업이 수정하는 파일은?
├─ 단일 컴포넌트 파일
│  └─ ui-[컴포넌트명]
│     예: ui-issue-card, ui-modal
│
├─ 단일 API 엔드포인트 파일
│  └─ api-[리소스명]
│     예: api-issues, api-tasks
│
├─ 데이터베이스 스키마
│  └─ db-schema-[모델명]
│     예: db-schema-issue, db-schema-user
│
├─ 설정 파일
│  └─ config-[설정명]
│     예: config-vite, config-tailwind
│
├─ 테스트 파일
│  └─ test-[타입]-[대상]
│     예: test-unit-issues, test-e2e-auth
│
├─ 여러 파일이지만 동일 기능 영역
│  └─ feature-[기능명]
│     예: feature-auth, feature-real-time-update
│
└─ 전체 시스템에 영향
   └─ (도메인 없음)
      예: 패키지 버전 업그레이드, 전역 설정 변경
```

#### 도메인 예시 매핑

| 작업 내용 | 올바른 도메인 | 잘못된 도메인 |
|---------|-----------|------------|
| IssueCard.tsx 수정 | `ui-issue-card` | `frontend` ❌ |
| Board.tsx 수정 | `ui-board` | `ui` ❌ |
| /api/issues 엔드포인트 수정 | `api-issues` | `backend` ❌ |
| /api/tasks 엔드포인트 수정 | `api-tasks` | `api` ❌ |
| Prisma User 모델 수정 | `db-schema-user` | `database` ❌ |
| Tailwind 설정 수정 | `config-tailwind` | `config` ❌ |
| Issue 생성 E2E 테스트 | `test-e2e-issue-create` | `test` ❌ |
| 여러 컴포넌트에 걸친 인증 기능 | `feature-auth` | `auth` ❌ |
| npm 패키지 전역 업데이트 | (없음) | `dependencies` ❌ |

#### 도메인 충돌 여부 판단

```javascript
// 두 작업이 안전하게 병렬 실행 가능한가?

function canRunInParallel(task1, task2) {
  // 1. 도메인이 다르면 병렬 실행 가능
  if (task1.domain !== task2.domain) return true;

  // 2. 둘 다 도메인이 없으면 순차 실행 (안전을 위해)
  if (!task1.domain && !task2.domain) return false;

  // 3. 같은 도메인이면 순차 실행
  if (task1.domain === task2.domain) return false;

  return true;
}
```

### 완전한 Task 예시

#### 예시 1: UI 컴포넌트 수정

```
제목: IssueCard 컴포넌트에 우선순위 배지 추가

설명:
## 목표
IssueCard 컴포넌트에 우선순위(HIGH/MEDIUM/LOW)를 시각적으로 표시하는 배지를 추가합니다.

## 배경/이유
사용자가 Kanban 보드에서 Issue의 우선순위를 빠르게 식별할 수 있도록 개선이 필요합니다.

## 구현 세부사항
1. `web/src/components/IssueCard.tsx` 파일 수정
2. 우선순위별 색상:
   - HIGH: bg-red-500
   - MEDIUM: bg-yellow-500
   - LOW: bg-gray-500
3. 카드 우측 상단에 배치
4. 접근성을 위해 아이콘과 텍���트 모두 표시

## 완료 조건
- [ ] 모든 우선순위에 배지가 표시됨
- [ ] 색상이 정확히 적용됨
- [ ] TypeScript 에러 없음
- [ ] 반응형 디자인 유지

## 제약사항
- Tailwind CSS만 사용
- 기존 레이아웃 유지

## 참고사항
- 파일: `web/src/components/IssueCard.tsx`
- 타입: `src/types/index.ts` (Priority)

도메인: ui-issue-card
```

#### 예시 2: API 엔드포인트 추가

```
제목: Issue 필터링 API 엔드포인트 구현

설명:
## 목표
Issue를 우선순위, 담당자, 태그로 필터링할 수 있는 API를 구현합니다.

## 배경/이유
현재는 모든 Issue를 가져온 후 클라이언트에서 필터링하여 성능 문제가 발생합니다.
서버 사이드 필터링으로 네트워크 트래픽과 렌더링 시간을 개선합니다.

## 구현 세부사항
1. `src/server/routes/issues.ts`에 GET /api/issues 엔드포인트 수정
2. Query 파라미터 추가:
   - priority: 'HIGH' | 'MEDIUM' | 'LOW'
   - assignee: string (사용자 ID)
   - tags: string[] (쉼표로 구분)
   - status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'PENDING'
3. Prisma where 조건 동적 생성
4. 여러 필터 동시 적용 가능 (AND 조건)
5. 입력 검증 추가 (Zod 스키마)

## 완료 조건
- [ ] 각 필터가 개별적으로 동작함
- [ ] 여러 필터 조합 시 정확한 결과 반환
- [ ] 잘못된 파라미터 시 400 에러 반환
- [ ] TypeScript 타입 에러 없음
- [ ] 서버 빌드 성공

## 제약사항
- 기존 /api/issues 엔드포인트 호환성 유지 (파라미터 없으면 전체 반환)
- Zod로 입력 검증 필수
- SQL Injection 방지 (Prisma 사용)

## 참고사항
- 파일: `src/server/routes/issues.ts`
- Prisma 문서: https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting

도메인: api-issues
```

#### 예시 3: 데이터베이스 스키마 변경

```
제목: Issue 모델에 estimatedHours 필드 추가

설명:
## 목표
Issue 모델에 예상 작업 시간(estimatedHours)을 저장할 수 있는 필드를 추가합니다.

## 배경/이유
프로젝트 관리를 위해 각 Issue의 예상 소요 시간을 추적할 필요가 있습니다.

## 구현 세부사항
1. `prisma/schema.prisma` 파일 수정
2. Issue 모델에 필드 추가:
   - estimatedHours: Float (nullable, 기본값 null)
3. 마이그레이션 생성 및 실행:
   - npx prisma migrate dev --name add_estimated_hours
4. TypeScript 타입 자동 생성 확인
5. 기존 데이터 영향 없음 확인 (nullable이므로 안전)

## 완료 조건
- [ ] Prisma 스키마에 필드 추가됨
- [ ] 마이그레이션 성공적으로 실행됨
- [ ] TypeScript 타입이 자동 생성됨
- [ ] 기존 API가 정상 동작함 (필드는 optional)
- [ ] 데이터베이스에 컬럼 추가 확인

## 제약사항
- 기존 데이터에 영향을 주지 않을 것 (nullable)
- 음수 값 허용 안 함 (추후 Validation 추가 예정)

## 참고사항
- 파일: `prisma/schema.prisma`
- Prisma 마이그레이션: https://www.prisma.io/docs/concepts/components/prisma-migrate

도메인: db-schema-issue
```

### Task 작성 체크리스트

새 Task를 작성할 때 다음을 확인하세요:

#### 제목 체크리스트
- [ ] 구체적인 동사로 시작 (추가, 구현, 수정, 최적화 등)
- [ ] 대상이 명확함 (컴포넌트명, API명, 파일명 등)
- [ ] 50자 이내로 간결함
- [ ] 완료 여부를 객관적으로 판단 가능

#### 설명 체크리스트
- [ ] 목표가 1-2문장으로 명확히 설명됨
- [ ] 배경/이유가 포함됨
- [ ] 구현 단계가 구체적으로 나열됨
- [ ] 완료 조건이 체크리스트로 정리됨
- [ ] 제약사항이 있다면 명시됨
- [ ] 관련 파일 경로가 포함됨
- [ ] LLM이 추가 질문 없이 실행 가능할 정도로 상세함

#### 도메인 체크리스트
- [ ] 소문자와 하이픈만 사용
- [ ] 적절한 접두사 사용 (ui-, api-, db-, config-, test- 등)
- [ ] 가능한 한 세분화됨 (병렬 실행 최적화)
- [ ] 수정할 파일 범위를 정확히 반영
- [ ] 다른 작업과 충돌 가능성 최소화

### 자주 하는 실수와 해결 방법

| 실수 | 문제점 | 해결 방법 |
|-----|-------|---------|
| "버그 수정" | 어떤 버그인지 불명확 | "TaskExecutor 무한 루프 버그 수정" |
| "프론트엔드 개선" | 범위가 너무 광범위 | "IssueCard 로딩 스켈레톤 추가" |
| "테스트 추가" | 무엇을 테스트할지 불명확 | "Issue CRUD API 단위 테스트 추가" |
| 도메인: `frontend` | 너무 광범위 | `ui-issue-card` |
| 도메인: `api` | 너무 광범위 | `api-issues` |
| 설명 없이 제목만 | LLM이 이해 불가 | 위의 템플릿 사용 |
| "가능하면 테스트도" | 모호한 요구사항 | 명시적으로 "단위 테스트 필수" |

### LLM을 위한 추가 가이드

Task를 실행하는 LLM은 다음을 반드시 확인하세요:

1. **작업 시작 전**:
   - Task 설명을 완전히 이해했는가?
   - 모든 관련 파일 경로를 확인했는가?
   - 이전 실행 기록이 있다면 참고했는가?
   - 완료 조건을 명확히 인지했는가?

2. **작업 진행 중**:
   - 구현 세부사항을 단계별로 따르고 있는가?
   - 제약사항을 위반하지 않았는가?
   - 코드 품질 기준을 충족하는가?

3. **작업 완료 전**:
   - 모든 완료 조건을 체크했는가?
   - 빌드/테스트가 성공했는가?
   - 예상치 못한 부작용이 없는가?

4. **상태 업데이트**:
   - DONE: 모든 조건 완벽히 충족
   - PENDING: 외부 요인으로 완료 불가
   - TODO: 재시도로 해결 가능

## 참고사항

- 항상 프로젝트의 전체 컨텍스트를 고려하세요
- 기존 코드 패턴을 따르세요
- 의문이 있으면 확인 후 진행하세요
- 도메인 태그를 활용하여 안전한 병렬 작업을 수행하세요
- 명확하고 구체적인 Task 작성이 성공적인 자동화의 핵심입니다
