import { useState, useEffect } from 'react';
import type { Issue, Release, IssueStatus as IssueStatusType } from '../types';
import { IssueStatus } from '../types';
import { issuesApi, releasesApi, tasksApi } from '../services/api';
import IssueCard from '../components/IssueCard';
import CreateIssueModal from '../components/CreateIssueModal';
import LLMSettingsModal from '../components/LLMSettingsModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

// Droppable Column Component
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      } transition-all`}
    >
      {children}
    </div>
  );
}

// Draggable Issue Component
function DraggableIssue({
  id,
  issue,
  onUpdate,
  readonly,
  index,
  showQuickAction,
}: {
  id: string;
  issue: Issue;
  onUpdate: () => void;
  readonly: boolean;
  index: number;
  showQuickAction: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: readonly,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <IssueCard
        issue={issue}
        onUpdate={onUpdate}
        readonly={readonly}
        index={index}
        showQuickAction={showQuickAction}
      />
    </div>
  );
}

export default function Board() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isParallelExecuting, setIsParallelExecuting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 드래그 시작 시 모달 내부인지 확인
  const handleDragStart = (event: DragStartEvent) => {
    const target = (event.activatorEvent as any)?.target as HTMLElement;
    if (target) {
      // 모달 내부에서 시작된 드래그인지 확인 (data-modal-* 속성 확인)
      const isInsideModal =
        target.closest('[data-modal-overlay="true"]') !== null ||
        target.closest('[data-modal-content="true"]') !== null;

      if (isInsideModal) {
        return; // 드래그를 시작하지 않음
      }
    }
    setActiveId(event.active.id as string);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};

      // 검색어가 있으면 서버 사이드 검색 사용
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // 우선순위 필터
      if (priorityFilter !== 'ALL') {
        params.priority = priorityFilter;
      }

      const [issuesData, releasesData] = await Promise.all([
        issuesApi.getAll(params),
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

  const handleParallelExecution = async () => {
    try {
      setIsParallelExecuting(true);

      // LLM 설정 확인
      const savedSettings = localStorage.getItem('llm-settings');
      if (!savedSettings) {
        alert('먼저 LLM 설정을 해주세요. (상단의 "LLM 설정" 버튼을 클릭하세요)');
        return;
      }

      // 1. 현재 실행 중인 도메인 확인
      const runningData = await tasksApi.getRunning();
      const runningDomains = runningData.runningDomains || [];

      // 2. TODO 상태의 작업들 가져오기
      const todoIssues = issues.filter((issue) => issue.status === IssueStatus.TODO);

      if (todoIssues.length === 0) {
        alert('실행 가능한 TODO 작업이 없습니다.');
        return;
      }

      // 3. 도메인 충돌이 없는 작업 필터링
      const executableIssues = todoIssues.filter(
        (issue) => !issue.domain || !runningDomains.includes(issue.domain)
      );

      if (executableIssues.length === 0) {
        alert(
          `실행 가능한 작업이 없습니다.\n현재 실행 중인 도메인: ${runningDomains.join(', ')}`
        );
        return;
      }

      // 4. 도메인별로 그룹화하여 각 도메인에서 하나씩만 선택
      const domainMap = new Map<string, Issue>();
      executableIssues.forEach((issue) => {
        const domain = issue.domain || 'no-domain';
        if (!domainMap.has(domain)) {
          domainMap.set(domain, issue);
        }
      });

      const tasksToExecute = Array.from(domainMap.values());

      if (
        !confirm(
          `${tasksToExecute.length}개의 작업을 병렬로 실행하시겠습니까?\n\n` +
            tasksToExecute
              .map((issue, idx) => `${idx + 1}. [${issue.domain || '도메인없음'}] ${issue.title}`)
              .join('\n')
        )
      ) {
        return;
      }

      // 5. 각 작업에 대해 LLM 실행 명령 생성 및 실행
      const settings = JSON.parse(savedSettings);
      const executionPromises = tasksToExecute.map(async (issue) => {
        try {
          // 이전 실행 기록 확인
          const issueDetail = await issuesApi.getById(issue.id);
          const previousExecutions = issueDetail.executions || [];

          let prompt = `작업: ${issue.title}`;

          if (issue.description) {
            prompt += `\n\n설명: ${issue.description}`;
          }

          // 이전 실행 기록이 있으면 컨텍스트에 추가
          if (previousExecutions.length > 0) {
            prompt += `\n\n[이전 실행 기록]`;
            previousExecutions.slice(-3).forEach((exec, idx) => {
              prompt += `\n\n실행 ${idx + 1} (${exec.status}):`;
              if (exec.error) {
                prompt += `\n에러: ${exec.error.substring(0, 200)}`;
              }
              if (exec.llmResponse) {
                prompt += `\n결과: ${exec.llmResponse.substring(0, 200)}`;
              }
            });
            prompt += `\n\n위 실행 기록을 참고하여 같은 실수를 반복하지 마세요.`;
          }

          if (issue.attachments && issue.attachments.length > 0) {
            prompt += `\n\n첨부 파일: `;
            issue.attachments.forEach((attachment, idx) => {
              if (idx > 0) prompt += ', ';
              prompt += `${attachment.fileName} (${attachment.filePath})`;
            });
          }

          // LLM CLI 명령어 생성
          let llmCommand = '';
          if (settings.provider === 'custom' && settings.customCommand) {
            llmCommand = `${settings.customCommand} "${prompt.replace(/"/g, '\\"')}"`;
          } else if (settings.provider === 'claude') {
            llmCommand = `claude --print "${prompt.replace(/"/g, '\\"')}"`;
          } else if (settings.provider === 'chatgpt') {
            llmCommand = `chatgpt "${prompt.replace(/"/g, '\\"')}"`;
          }

          if (!llmCommand) {
            throw new Error('LLM 명령어를 생성할 수 없습니다.');
          }

          await tasksApi.execute(issue.id, llmCommand, settings.provider);
          return { success: true, issue };
        } catch (error: any) {
          console.error(`작업 실행 실패 [${issue.title}]:`, error);
          return { success: false, issue, error: error.message };
        }
      });

      const results = await Promise.all(executionPromises);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      alert(
        `병렬 실행 완료\n\n` +
          `성공: ${successCount}개\n` +
          `실패: ${failCount}개\n\n` +
          `실시간 로그는 각 작업 카드를 클릭하여 확인하세요.`
      );

      // 데이터 새로고침
      await loadData();
    } catch (error) {
      console.error('병렬 실행 오류:', error);
      alert('병렬 실행 중 오류가 발생했습니다.');
    } finally {
      setIsParallelExecuting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 검색어나 필터가 변경될 때 자동으로 재조회
  useEffect(() => {
    if (!selectedReleaseId) {
      const debounceTimer = setTimeout(() => {
        loadData();
      }, 300); // 300ms 디바운스

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, priorityFilter]);

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
    // 서버에서 이미 필터링된 데이터를 사용하므로 상태별로만 필터링
    const filteredIssues = issues.filter((issue) => issue.status === status);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || selectedReleaseId) return;

    const issueId = active.id as string;
    const newStatus = over.id as IssueStatusType;

    const issue = issues.find((i) => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    try {
      await issuesApi.update(issueId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const activeDragIssue = activeId ? issues.find((i) => i.id === activeId) : null;

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
          <div className="flex flex-col gap-4">
            {/* 상단 행: 타이틀 + 버튼 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Kanban Board</h2>

              <div className="flex gap-2">
                <button
                  onClick={handleParallelExecution}
                  disabled={isParallelExecuting || selectedReleaseId !== null}
                  className="btn h-10 px-4 whitespace-nowrap bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className={`w-4 h-4 ${isParallelExecuting ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {isParallelExecuting ? '병렬 실행 중...' : '병렬 실행'}
                </button>
                <button
                  onClick={() => setIsLLMSettingsOpen(true)}
                  className="btn h-10 px-4 whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  LLM 설정
                </button>
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

            {/* 하단 행: 검색 & 필터 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 검색 바 */}
              <div className="flex-1 min-w-[240px] relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목 또는 설명으로 검색..."
                  className="w-full pl-10 pr-4 h-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 우선순위 필터 */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input h-9 w-auto text-sm"
              >
                <option value="ALL">모든 우선순위</option>
                <option value="HIGH">높음</option>
                <option value="MEDIUM">보통</option>
                <option value="LOW">낮음</option>
              </select>

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

              {/* 필터 초기화 버튼 */}
              {(searchQuery || priorityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('ALL');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  초기화
                </button>
              )}
            </div>
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
              <DroppableColumn
                id={column.status}
                className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[200px] rounded-lg p-2"
              >
                {columnIssues.map((issue, idx) => (
                  <DraggableIssue
                    key={issue.id}
                    id={issue.id}
                    issue={issue}
                    onUpdate={handleIssueUpdated}
                    readonly={selectedReleaseId !== null}
                    index={idx}
                    showQuickAction={column.status === IssueStatus.TODO}
                  />
                ))}
                {columnIssues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-gray-400">작업 없음</p>
                  </div>
                )}
              </DroppableColumn>
            </div>
          );
        })}
        </div>
        <DragOverlay>
          {activeDragIssue ? (
            <div className="opacity-80 cursor-grabbing">
              <IssueCard
                issue={activeDragIssue}
                onUpdate={() => {}}
                readonly={true}
                showQuickAction={false}
              />
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
      </div>

      {/* Buy Me A Coffee */}
      <div className="max-w-[1800px] mx-auto px-8 py-6 flex justify-center">
        <a href="https://www.buymeacoffee.com/ryokai" target="_blank" rel="noopener noreferrer">
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/arial-yellow.png"
            alt="Buy Me A Coffee"
            style={{ height: '60px', width: '217px' }}
          />
        </a>
      </div>

      {isCreateModalOpen && (
        <CreateIssueModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleIssueCreated}
        />
      )}

      {isLLMSettingsOpen && (
        <LLMSettingsModal
          onClose={() => setIsLLMSettingsOpen(false)}
          onSave={() => {
            // 설정 저장 완료
          }}
        />
      )}
    </div>
  );
}
