import { useState } from 'react';
import type { CreateIssueDto } from '../types';
import { Priority } from '../types';
import { issuesApi } from '../services/api';

interface CreateIssueModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateIssueModal({ onClose, onCreated }: CreateIssueModalProps) {
  const [formData, setFormData] = useState<CreateIssueDto>({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setSubmitting(true);
      await issuesApi.create(formData);
      onCreated();
    } catch (error) {
      console.error('작업 생성 실패:', error);
      alert('작업 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="card w-full max-w-lg animate-in zoom-in-95 duration-300 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-800">새 작업 생성</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-white/50 transition-colors flex items-center justify-center"
            type="button"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              제목 <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="작업 제목을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              설명
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              placeholder="작업에 대한 설명을 입력하세요"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              우선순위
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as Priority })
              }
              className="input"
            >
              <option value={Priority.LOW}>낮음</option>
              <option value={Priority.MEDIUM}>보통</option>
              <option value={Priority.HIGH}>높음</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn flex-1 h-11 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg"
              disabled={submitting || !formData.title.trim()}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>생성 중...</span>
                </div>
              ) : (
                '생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
