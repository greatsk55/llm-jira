import * as fs from 'fs-extra';
import * as path from 'path';
import { AppConfig, LLMConfig } from './types';

const CONFIG_DIR = '.llm-jira';
const CONFIG_FILE = 'config.json';

export function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_DIR, CONFIG_FILE);
}

export function getConfigDir(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_DIR);
}

export async function loadConfig(projectRoot: string): Promise<AppConfig | null> {
  const configPath = getConfigPath(projectRoot);
  
  if (!await fs.pathExists(configPath)) {
    return null;
  }

  try {
    const configData = await fs.readJson(configPath);
    return configData as AppConfig;
  } catch (error) {
    console.error('설정 파일을 읽는 중 오류가 발생했습니다:', error);
    return null;
  }
}

export async function saveConfig(projectRoot: string, config: AppConfig): Promise<void> {
  const configDir = getConfigDir(projectRoot);
  const configPath = getConfigPath(projectRoot);

  await fs.ensureDir(configDir);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export async function ensureConfigDir(projectRoot: string): Promise<void> {
  const configDir = getConfigDir(projectRoot);
  await fs.ensureDir(configDir);
}

export function getDefaultConfig(): AppConfig {
  return {
    llm: {
      provider: 'claude',
      model: 'claude-3-sonnet-20240229',
    },
    port: 3000,
    databaseUrl: 'file:.llm-jira/database.db',
    uploadDir: '.llm-jira/uploads',
  };
}
