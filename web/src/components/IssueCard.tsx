import { useState } from 'react';
import type { Issue } from '../types';
import { Priority } from '../types';
import IssueDetailModal from './IssueDetailModal';
import type { LLMSettings } from './LLMSettingsModal';
import { tasksApi, issuesApi } from '../services/api';

interface IssueCardProps {
  issue: Issue;
  onUpdate: () => void;
  readonly?: boolean;
  index?: number;
  showQuickAction?: boolean;
}

export default function IssueCard({ issue, onUpdate, readonly = false, index, showQuickAction = false }: IssueCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 모달이 열릴 때 body의 포인터 이벤트 비활성화
  const handleOpenModal = () => {
    setIsDetailOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailOpen(false);
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        );
      case Priority.MEDIUM:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
          </svg>
        );
      case Priority.LOW:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Future use: Status change handler
  // const handleStatusChange = async (newStatus: IssueStatus) => {
  //   if (readonly) return;
  //   try {
  //     await issuesApi.update(issue.id, { status: newStatus });
  //     onUpdate();
  //   } catch (error) {
  //     console.error('상태 변경 실패:', error);
  //     alert('상태 변경에 실패했습니다.');
  //   }
  // };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (readonly) return;
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return;
    try {
      await issuesApi.delete(issue.id);
      onUpdate();
    } catch (error: any) {
      console.error('삭제 실패:', error);
      const errorMessage = error?.response?.data?.error || '작업 삭제에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleQuickExecute = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    try {
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
      await tasksApi.execute(issue.id, llmCommand, settings.provider);

      // 잠시 후 업데이트 (상태 변경 확인)
      setTimeout(() => {
        onUpdate();
        setExecuting(false);
      }, 1000);
    } catch (error) {
      console.error('LLM 실행 실패:', error);
      alert('LLM 작업 실행에 실패했습니다.');
      setExecuting(false);
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 group"
        onClick={handleOpenModal}
      >
        {/* 상단: ID와 우선순위 */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
            {index !== undefined ? `#${index + 1}` : `#${issue.id.slice(0, 4)}`}
          </span>
          <div className="flex items-center gap-1.5">
            {getPriorityIcon(issue.priority)}
            {!readonly && (
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
          {issue.title}
        </h4>

        {/* 설명 */}
        {issue.description && (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {issue.description}
          </p>
        )}

        {/* 도메인 태그 */}
        {issue.domain && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {issue.domain}
            </span>
          </div>
        )}

        {/* 빠른 실행 버튼 (TODO에서만 표시) */}
        {showQuickAction && !readonly && (
          <div className="mb-3">
            <button
              onClick={handleQuickExecute}
              disabled={executing}
              className="w-full h-9 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {executing ? 'LLM 실행 중...' : 'LLM 실행'}
            </button>
          </div>
        )}

        {/* 하단: 메타 정보 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="font-medium">{issue.attachments.length}</span>
              </div>
            )}
            {issue.executions && issue.executions.length > 0 && (
              <div className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">{issue.executions.length}</span>
              </div>
            )}
          </div>
          <time className="text-xs text-gray-400 font-medium">
            {new Date(issue.createdAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>
      </div>

      {isDetailOpen && (
        <IssueDetailModal
          issue={issue}
          onClose={handleCloseModal}
          onUpdate={() => {
            onUpdate();
            handleCloseModal();
          }}
          readonly={readonly}
        />
      )}
    </>
  );
}
