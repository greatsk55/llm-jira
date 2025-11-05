import { useState } from 'react';
import type { Issue, UpdateIssueDto } from '../types';
import { Priority } from '../types';
import { issuesApi, attachmentsApi } from '../services/api';
import TaskExecutor from './TaskExecutor';

interface IssueDetailModalProps {
  issue: Issue;
  onClose: () => void;
  onUpdate: () => void;
  readonly?: boolean;
}

export default function IssueDetailModal({ issue, onClose, onUpdate, readonly = false }: IssueDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateIssueDto>({
    title: issue.title,
    description: issue.description || '',
    priority: issue.priority,
    domain: issue.domain || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await issuesApi.update(issue.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('작업 수정 실패:', error);
      alert('작업 수정에 실패했습니다.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await attachmentsApi.upload(issue.id, file);
      onUpdate();
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const blob = await attachmentsApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return;

    try {
      await attachmentsApi.delete(id);
      onUpdate();
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm('이 작업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await issuesApi.delete(issue.id);
      onClose();
      onUpdate();
    } catch (error: any) {
      console.error('작업 삭제 실패:', error);
      const errorMessage = error?.response?.data?.error || '작업 삭제에 실패했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      data-modal-overlay="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        data-modal-content="true"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-800">작업 상세</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-white/50 transition-colors flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우선순위
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as Priority })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={Priority.LOW}>낮음</option>
                  <option value={Priority.MEDIUM}>보통</option>
                  <option value={Priority.HIGH}>높음</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도메인 태그
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: frontend, backend, database, auth"
                />
                <p className="text-xs text-gray-500 mt-1">
                  병렬 실행을 위한 도메인 태그입니다. 같은 도메인의 작업은 동시에 실행되지 않습니다.
                </p>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn flex-1 h-11 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg"
                >
                  저장
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-gray-900">{issue.title}</h4>
                  {!readonly && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-lg text-sm font-semibold shadow-md transition-all"
                      >
                        수정
                      </button>
                      <button
                        onClick={handleDeleteIssue}
                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-semibold shadow-md transition-all"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                {issue.description && (
                  <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                <div>
                  <div className="text-sm text-gray-500">상태</div>
                  <div className="font-medium">{issue.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">우선순위</div>
                  <div className="font-medium">{issue.priority}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">도메인</div>
                  <div className="font-medium">
                    {issue.domain ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {issue.domain}
                      </span>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">생성일</div>
                  <div className="font-medium">
                    {new Date(issue.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">수정일</div>
                  <div className="font-medium">
                    {new Date(issue.updatedAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">첨부 파일</h5>
                  {!readonly && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        {uploading ? '업로드 중...' : '+ 파일 추가'}
                      </span>
                    </label>
                  )}
                </div>
                {issue.attachments && issue.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {issue.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📎</span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {attachment.fileName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(2)} KB
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleDownload(attachment.id, attachment.fileName)
                            }
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            다운로드
                          </button>
                          {!readonly && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    첨부된 파일이 없습니다.
                  </div>
                )}
              </div>

              {/* 터미널 실행 */}
              <TaskExecutor issue={issue} readonly={readonly} />

              {issue.executions && issue.executions.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">실행 기록</h5>
                  <div className="space-y-3">
                    {issue.executions.map((execution) => (
                      <details
                        key={execution.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <summary className="list-none">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{execution.llmProvider}</span>
                              {execution.command && (
                                <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">
                                  {execution.command.length > 50
                                    ? execution.command.substring(0, 50) + '...'
                                    : execution.command}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                execution.status === 'SUCCESS'
                                  ? 'bg-green-100 text-green-800'
                                  : execution.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {execution.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(execution.startedAt).toLocaleString('ko-KR')}
                            {execution.completedAt && (
                              <span className="ml-2">
                                ~ {new Date(execution.completedAt).toLocaleString('ko-KR')}
                              </span>
                            )}
                          </div>
                        </summary>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {execution.llmResponse && (
                            <div className="mb-3">
                              <div className="text-sm font-semibold text-gray-700 mb-2">출력:</div>
                              <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {execution.llmResponse}
                              </pre>
                            </div>
                          )}
                          {execution.error && (
                            <div>
                              <div className="text-sm font-semibold text-red-700 mb-2">에러:</div>
                              <pre className="bg-red-50 text-red-800 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {execution.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
