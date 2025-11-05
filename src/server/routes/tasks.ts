import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { spawn, ChildProcess } from 'child_process';

const router = Router();
const prisma = new PrismaClient();

// 실행 중인 작업들을 추적
const runningTasks = new Map<string, {
  process: ChildProcess;
  issueId: string;
  executionId: string;
  startTime: Date;
  domain?: string | null;
}>();

/**
 * 실행 중인 작업을 강제로 종료합니다 (외부에서 호출 가능)
 */
export async function forceKillTask(issueId: string): Promise<boolean> {
  const taskInfo = runningTasks.get(issueId);

  if (!taskInfo) {
    return false; // 실행 중인 작업이 없음
  }

  console.log(`🛑 Force killing task ${issueId} (execution: ${taskInfo.executionId})`);

  try {
    // 프로세스 종료
    taskInfo.process.kill('SIGTERM');
    runningTasks.delete(issueId);

    // Execution 상태 업데이트
    await prisma.execution.update({
      where: { id: taskInfo.executionId },
      data: {
        status: 'FAILED',
        error: 'Task forcefully terminated during deletion',
        completedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(`Error force killing task ${issueId}:`, error);
    // 에러가 발생해도 Map에서는 제거
    runningTasks.delete(issueId);
    return false;
  }
}

/**
 * 현재 실행 중인 작업들의 도메인 목록을 반환
 */
function getRunningDomains(): Set<string> {
  const domains = new Set<string>();
  for (const taskInfo of runningTasks.values()) {
    if (taskInfo.domain) {
      domains.add(taskInfo.domain);
    }
  }
  return domains;
}

/**
 * 주어진 도메인이 현재 실행 중인지 확인
 */
function isDomainRunning(domain: string | null | undefined): boolean {
  if (!domain) {
    return false; // 도메인이 없는 작업은 항상 실행 가능
  }
  return getRunningDomains().has(domain);
}

/**
 * POST /api/tasks/:issueId/execute
 * 작업을 실행합니다 (터미널 명령 실행)
 */
router.post('/:issueId/execute', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { command, llmProvider = 'system', maxRetries = 3 } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }

    // 이슈 확인 및 이전 실행 기록 조회
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5, // 최근 5개의 실행 기록
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 도메인 충돌 체크
    if (issue.domain && isDomainRunning(issue.domain)) {
      return res.status(409).json({
        error: 'Domain conflict',
        message: `작업의 도메인 '${issue.domain}'이(가) 이미 실행 중입니다. 병렬 실행을 위해서는 다른 도메인의 작업을 선택하세요.`,
        domain: issue.domain,
      });
    }

    // 상태를 ING로 업데이트
    await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'ING' },
    });

    // Execution 레코드 생성
    const execution = await prisma.execution.create({
      data: {
        issueId,
        llmProvider,
        command: command,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // 백그라운드에서 명령 실행 (이전 실행 기록 포함)
    executeTaskInBackground(issueId, execution.id, command, issue, maxRetries);

    res.json({
      message: 'Task execution started',
      issueId,
      executionId: execution.id,
      status: 'RUNNING',
      domain: issue.domain,
      previousExecutions: issue.executions.length,
    });
  } catch (error) {
    console.error('Task execution error:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

/**
 * GET /api/tasks/:issueId/status
 * 작업의 실행 상태를 확인합니다
 */
router.get('/:issueId/status', async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const isRunning = runningTasks.has(issueId);
    const latestExecution = issue.executions[0];

    res.json({
      issueId,
      issueStatus: issue.status,
      isRunning,
      latestExecution: latestExecution || null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * POST /api/tasks/:issueId/cancel
 * 실행 중인 작업을 취소합니다
 */
router.post('/:issueId/cancel', async (req, res) => {
  try {
    const { issueId } = req.params;

    const taskInfo = runningTasks.get(issueId);

    if (!taskInfo) {
      return res.status(404).json({ error: 'No running task found for this issue' });
    }

    // 프로세스 종료
    taskInfo.process.kill('SIGTERM');
    runningTasks.delete(issueId);

    // Execution 상태 업데이트
    await prisma.execution.update({
      where: { id: taskInfo.executionId },
      data: {
        status: 'FAILED',
        error: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    // Issue 상태를 PENDING으로
    await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'PENDING' },
    });

    res.json({ message: 'Task cancelled' });
  } catch (error) {
    console.error('Task cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

/**
 * GET /api/tasks/running
 * 현재 실행 중인 모든 작업 목록
 */
router.get('/running', async (req, res) => {
  try {
    const runningTasksList = Array.from(runningTasks.entries()).map(
      ([issueId, info]) => ({
        issueId,
        executionId: info.executionId,
        startTime: info.startTime,
        domain: info.domain,
      })
    );

    const runningDomains = Array.from(getRunningDomains());

    res.json({
      runningTasks: runningTasksList,
      runningDomains,
    });
  } catch (error) {
    console.error('Error fetching running tasks:', error);
    res.status(500).json({ error: 'Failed to fetch running tasks' });
  }
});

/**
 * GET /api/tasks/:issueId/stream
 * 실행 중인 작업의 로그를 Server-Sent Events로 스트리밍
 */
router.get('/:issueId/stream', async (req, res) => {
  const { issueId } = req.params;

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 최신 실행 정보 조회
  const execution = await prisma.execution.findFirst({
    where: { issueId },
    orderBy: { startedAt: 'desc' },
  });

  if (!execution) {
    res.write(`data: ${JSON.stringify({ error: 'No execution found' })}\n\n`);
    res.end();
    return;
  }

  // 초기 데이터 전송
  res.write(`data: ${JSON.stringify({
    type: 'init',
    execution: {
      id: execution.id,
      status: execution.status,
      llmProvider: execution.llmProvider,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
    },
  })}\n\n`);

  let lastOutputLength = 0;
  let lastErrorLength = 0;

  // 주기적으로 실행 상태 확인 및 업데이트 전송
  const intervalId = setInterval(async () => {
    try {
      const updatedExecution = await prisma.execution.findUnique({
        where: { id: execution.id },
      });

      if (!updatedExecution) {
        clearInterval(intervalId);
        res.end();
        return;
      }

      // 새로운 출력이 있으면 전송
      const currentOutput = updatedExecution.llmResponse || '';
      const currentError = updatedExecution.error || '';

      if (currentOutput.length > lastOutputLength) {
        const newOutput = currentOutput.substring(lastOutputLength);
        res.write(`data: ${JSON.stringify({
          type: 'output',
          data: newOutput,
        })}\n\n`);
        lastOutputLength = currentOutput.length;
      }

      if (currentError.length > lastErrorLength) {
        const newError = currentError.substring(lastErrorLength);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          data: newError,
        })}\n\n`);
        lastErrorLength = currentError.length;
      }

      // 실행 완료 시
      if (updatedExecution.status !== 'RUNNING') {
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          status: updatedExecution.status,
          completedAt: updatedExecution.completedAt,
        })}\n\n`);
        clearInterval(intervalId);
        res.end();
      }
    } catch (error) {
      console.error('Error streaming logs:', error);
      clearInterval(intervalId);
      res.end();
    }
  }, 500); // 500ms마다 체크

  // 클라이언트 연결 종료 시 정리
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

/**
 * 백그라운드에서 작업을 실행합니다
 */
function executeTaskInBackground(
  issueId: string,
  executionId: string,
  command: string,
  issue: any,
  maxRetries: number,
  currentRetry: number = 0
) {
  const startTime = new Date();
  let output = '';
  let errorOutput = '';
  const domain = issue.domain;

  console.log(`🚀 Executing task ${issueId} (domain: ${domain || 'none'}, retry: ${currentRetry}/${maxRetries}): ${command}`);

  // 이전 실행 기록을 컨텍스트로 추가
  const previousExecutions = issue.executions || [];
  const previousContext = buildPreviousExecutionContext(previousExecutions);

  // 명령어에 ISSUE_ID 환경 변수와 이전 컨텍스트 추가
  let enhancedCommand = command;

  // ISSUE_ID 환경 변수 주입
  enhancedCommand = `ISSUE_ID=${issueId} ${enhancedCommand}`;

  // 이전 실행 실패가 있으면 컨텍스트 주입
  if (previousContext && currentRetry > 0) {
    const contextMsg = `이전 시도 실패 기록:\n${previousContext}\n\n위 실패를 참고하여 다른 방법으로 시도하세요.\n\n`;
    console.log(`📝 Previous execution context:\n${contextMsg}`);
  }

  // 명령어를 쉘로 실행
  const childProcess = spawn(enhancedCommand, {
    shell: true,
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ISSUE_ID: issueId,
      API_BASE_URL: 'http://localhost:3001',
    },
  });

  // stdin을 즉시 닫아서 명령이 입력 대기하지 않도록 함
  childProcess.stdin?.end();

  // 실행 정보 저장
  runningTasks.set(issueId, {
    process: childProcess,
    issueId,
    executionId,
    startTime,
    domain,
  });

  // 프로세스 시작 확인
  childProcess.on('spawn', () => {
    console.log(`✅ Process spawned successfully for ${issueId}`);
  });

  // stdout 수집 및 실시간 DB 업데이트
  childProcess.stdout?.on('data', async (data) => {
    const chunk = data.toString();
    console.log(`📤 stdout (${issueId}):`, chunk);
    output += chunk;

    // 실시간으로 DB 업데이트
    try {
      await prisma.execution.update({
        where: { id: executionId },
        data: { llmResponse: output },
      });
    } catch (err) {
      console.error('Error updating execution output:', err);
    }
  });

  // stderr 수집 및 실시간 DB 업데이트
  childProcess.stderr?.on('data', async (data) => {
    const chunk = data.toString();
    console.log(`📤 stderr (${issueId}):`, chunk);
    errorOutput += chunk;

    // 실시간으로 DB 업데이트
    try {
      await prisma.execution.update({
        where: { id: executionId },
        data: { error: errorOutput },
      });
    } catch (err) {
      console.error('Error updating execution error:', err);
    }
  });

  // 타임아웃 (10분)
  const timeout = setTimeout(() => {
    console.warn(`⏰ Task ${issueId} timeout - killing process`);
    childProcess.kill('SIGTERM');
  }, 10 * 60 * 1000);

  // 프로세스 종료 처리
  childProcess.on('close', async (code) => {
    clearTimeout(timeout);
    runningTasks.delete(issueId);

    const success = code === 0;
    const llmResponse = output || errorOutput;
    const error = success ? null : errorOutput || `Process exited with code ${code}`;

    console.log(`${success ? '✅' : '❌'} Task ${issueId} finished with code ${code}`);
    console.log(`📊 Output length: ${output.length}, Error length: ${errorOutput.length}`);

    try {
      // Execution 업데이트
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: success ? 'SUCCESS' : 'FAILED',
          llmResponse,
          error,
          completedAt: new Date(),
        },
      });

      // Issue 상태 확인 (LLM이 이미 업데이트했는지 확인)
      const updatedIssue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 5,
          },
        },
      });

      // LLM이 상태를 업데이트하지 않았으면 자동 판단
      if (updatedIssue && updatedIssue.status === 'ING') {
        console.log(`⚠️ Issue ${issueId} 상태가 ING로 남아있음 - 자동 판단 시작`);

        // 실패 시 자동 재시도 로직
        if (!success && currentRetry < maxRetries) {
          const shouldRetry = analyzeFailureForRetry(errorOutput, output);

          if (shouldRetry) {
            console.log(`🔄 Task ${issueId} 자동 재시도 (${currentRetry + 1}/${maxRetries})`);

            // 새로운 Execution 생성
            const newExecution = await prisma.execution.create({
              data: {
                issueId,
                llmProvider: 'system',
                command: command,
                status: 'RUNNING',
                startedAt: new Date(),
              },
            });

            // 재시도 실행
            setTimeout(() => {
              executeTaskInBackground(issueId, newExecution.id, command, updatedIssue, maxRetries, currentRetry + 1);
            }, 2000); // 2초 후 재시도

            return; // 여기서 종료하고 재시도 대기
          } else {
            // 재시도 불가능 - PENDING으로 설정
            console.log(`⏸️ Task ${issueId} 재시도 불가능 - PENDING으로 설정`);
            await prisma.issue.update({
              where: { id: issueId },
              data: { status: 'PENDING' },
            });
          }
        } else if (!success) {
          // 최대 재시도 횟수 초과 - PENDING으로 설정
          console.log(`⏸️ Task ${issueId} 최대 재시도 횟수 초과 - PENDING으로 설정`);
          await prisma.issue.update({
            where: { id: issueId },
            data: { status: 'PENDING' },
          });
        } else {
          // 성공했지만 LLM이 상태를 업데이트하지 않음 - TODO로 설정 (재확인 필요)
          console.log(`⚠️ Task ${issueId} 성공했으나 상태 미업데이트 - TODO로 설정`);
          await prisma.issue.update({
            where: { id: issueId },
            data: { status: 'TODO' },
          });
        }
      } else {
        console.log(`✅ Issue ${issueId} 상태가 이미 업데이트됨: ${updatedIssue?.status}`);
      }
    } catch (err) {
      console.error('Error updating execution status:', err);
    }
  });

  // 에러 처리
  childProcess.on('error', async (err) => {
    console.error(`❌ Process error for ${issueId}:`, err);
    clearTimeout(timeout);
    runningTasks.delete(issueId);

    try {
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          error: `Process error: ${err.message}`,
          completedAt: new Date(),
        },
      });

      // 재시도 가능 여부 확인
      if (currentRetry < maxRetries) {
        console.log(`🔄 Process error - 재시도 (${currentRetry + 1}/${maxRetries})`);

        const updatedIssue = await prisma.issue.findUnique({
          where: { id: issueId },
          include: {
            executions: {
              orderBy: { startedAt: 'desc' },
              take: 5,
            },
          },
        });

        if (updatedIssue) {
          const newExecution = await prisma.execution.create({
            data: {
              issueId,
              llmProvider: 'system',
              command: command,
              status: 'RUNNING',
              startedAt: new Date(),
            },
          });

          setTimeout(() => {
            executeTaskInBackground(issueId, newExecution.id, command, updatedIssue, maxRetries, currentRetry + 1);
          }, 2000);
          return;
        }
      }

      await prisma.issue.update({
        where: { id: issueId },
        data: { status: 'PENDING' },
      });

      console.error(`❌ Task ${issueId} failed:`, err.message);
    } catch (updateErr) {
      console.error('Error updating execution on error:', updateErr);
    }
  });
}

/**
 * 이전 실행 기록을 컨텍스트 문자열로 변환
 */
function buildPreviousExecutionContext(executions: any[]): string {
  if (!executions || executions.length === 0) {
    return '';
  }

  const failedExecutions = executions.filter(e => e.status === 'FAILED');
  if (failedExecutions.length === 0) {
    return '';
  }

  let context = '';
  failedExecutions.slice(0, 3).forEach((exec, index) => {
    context += `\n--- 시도 ${index + 1} (${exec.startedAt.toISOString()}) ---\n`;
    if (exec.error) {
      context += `에러: ${exec.error.substring(0, 500)}\n`;
    }
    if (exec.llmResponse) {
      context += `출력: ${exec.llmResponse.substring(0, 500)}\n`;
    }
  });

  return context;
}

/**
 * 실패를 분석하여 재시도 가능 여부 판단
 */
function analyzeFailureForRetry(errorOutput: string, output: string): boolean {
  const combinedOutput = (errorOutput + output).toLowerCase();

  // 재시도 불가능한 경우들
  const nonRetryablePatterns = [
    'enoent', // 파일/명령어 없음
    'permission denied', // 권한 없음
    'not found', // 리소스 없음
    'connection refused', // 서버 연결 불가
    'etimedout', // 타임아웃
    'dependency', // 의존성 문제
    'missing', // 누락
  ];

  for (const pattern of nonRetryablePatterns) {
    if (combinedOutput.includes(pattern)) {
      console.log(`❌ 재시도 불가능 패턴 발견: ${pattern}`);
      return false;
    }
  }

  // 재시도 가능한 경우들
  const retryablePatterns = [
    'type error',
    'syntax error',
    'test failed',
    'assertion',
    'build failed',
  ];

  for (const pattern of retryablePatterns) {
    if (combinedOutput.includes(pattern)) {
      console.log(`✅ 재시도 가능 패턴 발견: ${pattern}`);
      return true;
    }
  }

  // 기본값: 재시도 가능
  return true;
}

export default router;
