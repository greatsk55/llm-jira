import { useState, useEffect } from 'react';
import type { Release } from '../types';
import { releasesApi } from '../services/api';

export default function Releases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersion, setNewVersion] = useState('');
  const [creating, setCreating] = useState(false);

  const loadReleases = async () => {
    try {
      setLoading(true);
      const data = await releasesApi.getAll();
      setReleases(data);
    } catch (error) {
      console.error('릴리즈 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim()) return;

    try {
      setCreating(true);
      await releasesApi.create(newVersion);
      setNewVersion('');
      loadReleases();
    } catch (error) {
      console.error('릴리즈 생성 실패:', error);
      alert('릴리즈 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleCheckout = async (id: string) => {
    if (!confirm('이 버전으로 복원하시겠습니까?')) return;

    try {
      await releasesApi.checkout(id);
      alert('버전이 복원되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('체크아웃 실패:', error);
      alert('버전 복원에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">릴리즈 관리</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">새 릴리즈 생성</h3>
        <form onSubmit={handleCreateRelease} className="flex gap-4">
          <input
            type="text"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="버전 번호 (예: v1.0.0)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newVersion.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {creating ? '생성 중...' : '생성'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                버전
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Git 태그
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {releases.map((release) => (
              <tr key={release.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {release.version}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {release.gitTag || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(release.createdAt).toLocaleString('ko-KR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleCheckout(release.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    복원
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {releases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            생성된 릴리즈가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
