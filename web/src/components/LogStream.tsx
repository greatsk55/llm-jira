import { useEffect, useState, useRef } from 'react';

interface LogStreamProps {
  issueId: string;
  executionId: string;
  onComplete?: (status: string) => void;
}

interface LogMessage {
  type: 'init' | 'output' | 'error' | 'complete';
  data?: string;
  status?: string;
  execution?: {
    id: string;
    status: string;
    llmProvider: string;
    startedAt: Date;
    completedAt: Date | null;
  };
  completedAt?: Date | null;
}

export default function LogStream({ issueId, executionId, onComplete }: LogStreamProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('RUNNING');
  const [isConnected, setIsConnected] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Server-Sent Events 연결
    const eventSource = new EventSource(`/api/tasks/${issueId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const message: LogMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'init':
            if (message.execution) {
              setStatus(message.execution.status);
            }
            break;

          case 'output':
            if (message.data) {
              setLogs((prev) => [...prev, message.data!]);
            }
            break;

          case 'error':
            if (message.data) {
              setErrors((prev) => [...prev, message.data!]);
            }
            break;

          case 'complete':
            if (message.status) {
              setStatus(message.status);
              setIsConnected(false);
              if (onComplete) {
                onComplete(message.status);
              }
            }
            eventSource.close();
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [issueId, executionId, onComplete]);

  // 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, errors]);

  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      RUNNING: 'bg-blue-100 text-blue-800',
      SUCCESS: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h5 className="font-semibold text-gray-900">실시간 로그</h5>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>연결됨</span>
            </div>
          )}
        </div>
      </div>

      {/* 로그 출력 */}
      {logs.length > 0 && (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {logs.map((log, index) => (
              <div key={`log-${index}`} className="whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* 에러 출력 */}
      {errors.length > 0 && (
        <div className="bg-red-50 text-red-800 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="text-xs font-mono space-y-1">
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="whitespace-pre-wrap">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && errors.length === 0 && status === 'RUNNING' && (
        <div className="text-center text-gray-400 py-8">
          <div className="h-8 w-8 mx-auto mb-3 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p>로그 스트리밍 대기 중...</p>
        </div>
      )}
    </div>
  );
}
