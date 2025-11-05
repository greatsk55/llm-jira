import { useState, useEffect } from 'react';
import { tasksApi } from '../services/api';
import type { Issue } from '../types';
import type { LLMSettings } from './LLMSettingsModal';
import LogStream from './LogStream';

interface TaskExecutorProps {
  issue: Issue;
  readonly?: boolean;
}

export default function TaskExecutor({ issue, readonly = false }: TaskExecutorProps) {
  const issueId = issue.id;
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 상태 확인
    checkStatus();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [issueId]);

  const checkStatus = async () => {
    try {
      const status = await tasksApi.getStatus(issueId);
      setTaskStatus(status);

      if (status.isRunning) {
        setExecuting(true);
        startPolling();
      }
    } catch (error) {
      console.error('상태 확인 실패:', error);
    }
  };

  const startPolling = () => {
    if (pollInterval) return;

    const interval = setInterval(async () => {
      try {
        const status = await tasksApi.getStatus(issueId);
        setTaskStatus(status);

        if (!status.isRunning) {
          setExecuting(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
        }
      } catch (error) {
        console.error('폴링 오류:', error);
      }
    }, 2000); // 2초마다 확인

    setPollInterval(interval);
  };

  const handleExecute = async () => {
    if (!command.trim()) {
      alert('명령어를 입력하세요');
      return;
    }

    try {
      setExecuting(true);
      await tasksApi.execute(issueId, command);
      checkStatus();
      startPolling();
    } catch (error) {
      console.error('실행 실패:', error);
      alert('작업 실행에 실패했습니다.');
      setExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('실행 중인 작업을 취소하시겠습니까?')) return;

    try {
      await tasksApi.cancel(issueId);
      setExecuting(false);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      checkStatus();
    } catch (error) {
      console.error('취소 실패:', error);
      alert('작업 취소에 실패했습니다.');
    }
  };

  const handleExecuteWithLLM = async () => {
    try {
      // LLM 설정 가져오기
      const savedSettings = localStorage.getItem('llm-settings');
      if (!savedSettings) {
        alert('먼저 LLM 설정을 해주세요. (상단의 "LLM 설정" 버튼을 클릭하세요)');
        return;
      }

      const settings: LLMSettings = JSON.parse(savedSettings);

      // 프롬프트 생성 (개행 문자 제거)
      let prompt = `작업: ${issue.title.replace(/\n/g, ' ')}`;

      if (issue.description) {
        prompt += ` | 설명: ${issue.description.replace(/\n/g, ' ')}`;
      }

      if (issue.attachments && issue.attachments.length > 0) {
        prompt += ` | 첨부 파일: `;
        issue.attachments.forEach((attachment, idx) => {
          if (idx > 0) prompt += ', ';
          prompt += `${attachment.fileName} (${attachment.filePath})`;
        });
      }

      // LLM CLI 명령어 생성
      let llmCommand = '';
      if (settings.provider === 'custom' && settings.customCommand) {
        llmCommand = `${settings.customCommand} "${prompt}"`;
      } else if (settings.provider === 'claude') {
        llmCommand = `claude --print "${prompt}"`;
      } else if (settings.provider === 'chatgpt') {
        llmCommand = `chatgpt "${prompt}"`;
      }

      if (!llmCommand) {
        alert('LLM 명령어를 생성할 수 없습니다.');
        return;
      }

      // 실행
      setExecuting(true);
      await tasksApi.execute(issueId, llmCommand, settings.provider);
      checkStatus();
      startPolling();
    } catch (error) {
      console.error('LLM 실행 실패:', error);
      alert('LLM 작업 실행에 실패했습니다.');
      setExecuting(false);
    }
  };

  const getStatusBadge = () => {
    if (!taskStatus?.latestExecution) return null;

    const status = taskStatus.latestExecution.status as 'RUNNING' | 'SUCCESS' | 'FAILED';
    const colors: Record<string, string> = {
      RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
      SUCCESS: 'bg-green-100 text-green-800 border-green-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const getExecutionCount = () => {
    if (!issue.executions) return 0;
    return issue.executions.length;
  };

  const getFailedExecutionCount = () => {
    if (!issue.executions) return 0;
    return issue.executions.filter((e: any) => e.status === 'FAILED').length;
  };

  if (readonly) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        터미널 실행
        {getStatusBadge()}
        {getExecutionCount() > 0 && (
          <span className="text-xs text-gray-500">
            ({getExecutionCount()}번 실행
            {getFailedExecutionCount() > 0 && `, ${getFailedExecutionCount()}번 실패`})
          </span>
        )}
      </h5>

      <div className="space-y-4">
        {/* LLM에게 작업 요청 버튼 */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
          <button
            onClick={handleExecuteWithLLM}
            disabled={executing}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {executing ? 'LLM 실행 중...' : 'LLM에게 작업 요청'}
          </button>
          <p className="text-xs text-gray-600 mt-2 text-center">
            작업 내용과 첨부 파일을 자동으로 LLM에게 전달합니다
          </p>
        </div>

        {/* 수동 명령어 입력 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-500">또는 직접 명령어 입력</span>
          </div>
        </div>

        {/* 명령어 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            실행할 명령어
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="예: npm test"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              disabled={executing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !executing) {
                  handleExecute();
                }
              }}
            />
            {executing ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                취소
              </button>
            ) : (
              <button
                onClick={handleExecute}
                disabled={!command.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                실행
              </button>
            )}
          </div>
        </div>

        {/* 실시간 로그 스트리밍 */}
        {executing && taskStatus?.latestExecution && (
          <LogStream
            issueId={issueId}
            executionId={taskStatus.latestExecution.id}
            onComplete={() => {
              setExecuting(false);
              checkStatus();
            }}
          />
        )}

        {/* 완료된 실행 결과 (비스트리밍) */}
        {!executing && taskStatus?.latestExecution && (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                {new Date(taskStatus.latestExecution.startedAt).toLocaleString('ko-KR')}
              </span>
            </div>

            {taskStatus.latestExecution.llmResponse && (
              <pre className="whitespace-pre-wrap text-xs leading-relaxed max-h-64 overflow-y-auto">
                {taskStatus.latestExecution.llmResponse}
              </pre>
            )}

            {taskStatus.latestExecution.error && (
              <pre className="whitespace-pre-wrap text-xs leading-relaxed max-h-64 overflow-y-auto text-red-400 mt-2">
                {taskStatus.latestExecution.error}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
