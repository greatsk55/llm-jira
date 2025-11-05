import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LLMSettingsModalProps {
  onClose: () => void;
  onSave: (settings: LLMSettings) => void;
}

export interface LLMSettings {
  provider: 'claude' | 'chatgpt' | 'custom';
  customCommand?: string;
  language: 'ko' | 'en' | 'ja' | 'zh';
  generateRuleFiles: boolean;
}

const DEFAULT_COMMANDS = {
  claude: 'claude',
  chatgpt: 'chatgpt',
};

export default function LLMSettingsModal({ onClose, onSave }: LLMSettingsModalProps) {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<'claude' | 'chatgpt' | 'custom'>('claude');
  const [customCommand, setCustomCommand] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');
  const [generateRuleFiles, setGenerateRuleFiles] = useState(true);

  useEffect(() => {
    // localStorage에서 기존 설정 불러오기
    const savedSettings = localStorage.getItem('llm-settings');
    if (savedSettings) {
      const settings: LLMSettings = JSON.parse(savedSettings);
      setProvider(settings.provider);
      if (settings.customCommand) {
        setCustomCommand(settings.customCommand);
      }
      if (settings.language) {
        setLanguage(settings.language);
      }
      if (settings.generateRuleFiles !== undefined) {
        setGenerateRuleFiles(settings.generateRuleFiles);
      }
    }
  }, []);

  const handleSave = async () => {
    const settings: LLMSettings = {
      provider,
      customCommand: provider === 'custom' ? customCommand : undefined,
      language,
      generateRuleFiles,
    };

    // localStorage에 저장
    localStorage.setItem('llm-settings', JSON.stringify(settings));

    // 룰 파일 생성 API 호출
    if (generateRuleFiles) {
      try {
        await fetch('/api/llm/generate-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language }),
        });
      } catch (error) {
        console.error('룰 파일 생성 실패:', error);
      }
    }

    onSave(settings);
    onClose();
  };

  const getCommandPreview = () => {
    if (provider === 'custom') {
      return customCommand || t('llmSettings.commandPlaceholder');
    }
    return DEFAULT_COMMANDS[provider];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-800">{t('llmSettings.title')}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-white/50 transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('llmSettings.providerLabel')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                <input
                  type="radio"
                  name="provider"
                  value="claude"
                  checked={provider === 'claude'}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900">{t('llmSettings.claudeLabel')}</div>
                  <div className="text-sm text-gray-500">{t('llmSettings.claudeDesc')}</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                <input
                  type="radio"
                  name="provider"
                  value="chatgpt"
                  checked={provider === 'chatgpt'}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900">{t('llmSettings.chatgptLabel')}</div>
                  <div className="text-sm text-gray-500">{t('llmSettings.chatgptDesc')}</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
                <input
                  type="radio"
                  name="provider"
                  value="custom"
                  checked={provider === 'custom'}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900">{t('llmSettings.customLabel')}</div>
                  <div className="text-sm text-gray-500">{t('llmSettings.customDesc')}</div>
                </div>
              </label>
            </div>
          </div>

          {provider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('llmSettings.commandTemplate')}
              </label>
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder={t('llmSettings.commandPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('llmSettings.commandNote')}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">{t('llmSettings.commandPreview')}</div>
            <code className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200 block">
              {getCommandPreview()} "[작업 내용]"
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('llmSettings.languageLabel')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ko">{t('llmSettings.korean')}</option>
              <option value="en">{t('llmSettings.english')}</option>
              <option value="ja">{t('llmSettings.japanese')}</option>
              <option value="zh">{t('llmSettings.chinese')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {t('llmSettings.languageNote')}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50">
              <input
                type="checkbox"
                checked={generateRuleFiles}
                onChange={(e) => setGenerateRuleFiles(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{t('llmSettings.generateRuleFiles')}</div>
                <div className="text-sm text-gray-500">
                  {t('llmSettings.generateRuleFilesDesc')}
                </div>
              </div>
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <div className="text-sm font-semibold text-yellow-800 mb-1">{t('llmSettings.warning')}</div>
                <div className="text-xs text-yellow-700">
                  {t('llmSettings.warningMessage')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 h-11 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-lg transition-colors"
            >
              {t('llmSettings.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={provider === 'custom' && !customCommand.trim()}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-lg transition-all"
            >
              {t('llmSettings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
