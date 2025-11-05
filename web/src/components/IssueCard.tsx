import { useState } from 'react';
import type { Issue } from '../types';
import { IssueStatus, Priority } from '../types';
import { issuesApi } from '../services/api';
import IssueDetailModal from './IssueDetailModal';

interface IssueCardProps {
  issue: Issue;
  onUpdate: () => void;
  readonly?: boolean;
  index?: number;
}

export default function IssueCard({ issue, onUpdate, readonly = false, index }: IssueCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (readonly) return;

    try {
      await issuesApi.update(issue.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (readonly) return;
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return;

    try {
      await issuesApi.delete(issue.id);
      onUpdate();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('작업 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 group"
        onClick={() => setIsDetailOpen(true)}
      >
        {/* 상단: ID와 우선순위 */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
            {index !== undefined ? `#${index + 1}` : `#${issue.id.slice(0, 4)}`}
          </span>
          <div className="flex items-center gap-1.5">
            {getPriorityIcon(issue.priority)}
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
          onClose={() => setIsDetailOpen(false)}
          onUpdate={() => {
            onUpdate();
            setIsDetailOpen(false);
          }}
          readonly={readonly}
        />
      )}
    </>
  );
}
