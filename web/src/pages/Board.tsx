import { useState, useEffect } from 'react';
import type { Issue, Release } from '../types';
import { IssueStatus } from '../types';
import { issuesApi, releasesApi } from '../services/api';
import IssueCard from '../components/IssueCard';
import CreateIssueModal from '../components/CreateIssueModal';

export default function Board() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hideDone, setHideDone] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [issuesData, releasesData] = await Promise.all([
        issuesApi.getAll(),
        releasesApi.getAll(),
      ]);
      setIssues(issuesData);
      setReleases(releasesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedReleaseId) {
      const selectedRelease = releases.find((r) => r.id === selectedReleaseId);
      if (selectedRelease) {
        try {
          const snapshot = JSON.parse(selectedRelease.snapshot);
          setIssues(snapshot);
          setHideDone(true);
        } catch (error) {
          console.error('스냅샷 파싱 실패:', error);
        }
      }
    } else {
      loadData();
    }
  }, [selectedReleaseId]);

  const getIssuesByStatus = (status: string) => {
    let filteredIssues = issues.filter((issue) => issue.status === status);

    if (hideDone && !selectedReleaseId && status === IssueStatus.DONE) {
      return [];
    }

    return filteredIssues;
  };

  const columns = [
    {
      status: IssueStatus.TODO,
      title: 'To Do',
      bgColor: 'bg-slate-50/50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    {
      status: IssueStatus.ING,
      title: 'In Progress',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      status: IssueStatus.DONE,
      title: 'Done',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700'
    },
    {
      status: IssueStatus.PENDING,
      title: 'Pending',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700'
    },
  ];

  const handleIssueCreated = () => {
    setIsCreateModalOpen(false);
    loadData();
  };

  const handleIssueUpdated = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700"></div>
          <p className="text-lg font-semibold text-gray-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Kanban Board</h2>

          {/* 릴리즈 선택 드롭다운 */}
          <select
            value={selectedReleaseId || ''}
            onChange={(e) => setSelectedReleaseId(e.target.value || null)}
            className="input h-9 w-auto text-sm"
          >
            <option value="">현재 상태</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.version} ({new Date(release.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>

          {/* 완료된 작업 숨김 토글 */}
          {!selectedReleaseId && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span>완료된 작업 숨기기</span>
            </label>
          )}
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={selectedReleaseId !== null}
          className="btn h-10 px-5 whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          새 작업
        </button>
          </div>
        </div>
      </div>

      {/* 릴리즈 보기 알림 */}
      {selectedReleaseId && (
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900">릴리즈 버전을 보고 있습니다</p>
              <p className="text-sm text-blue-700 mt-1">이 보기에서는 작업을 편집할 수 없습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 칸반 보드 */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnIssues = getIssuesByStatus(column.status);
          const isHidden = hideDone && !selectedReleaseId && column.status === IssueStatus.DONE;

          if (isHidden) return null;

          return (
            <div
              key={column.status}
              className="flex-1 min-w-[280px] flex flex-col"
            >
              {/* 컬럼 헤더 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                <div className={`h-1.5 ${column.bgColor.replace('/50', '-500')}`}></div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-800">
                        {column.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-center min-w-[24px] h-6 px-2.5 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 shadow-sm">
                      <span className="text-xs font-bold text-gray-700">
                        {columnIssues.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 컬럼 바디 */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {columnIssues.map((issue, idx) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpdate={handleIssueUpdated}
                    readonly={selectedReleaseId !== null}
                    index={idx}
                  />
                ))}
                {columnIssues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-gray-400">작업 없음</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateIssueModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleIssueCreated}
        />
      )}
    </div>
  );
}
