import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { saveConfig } from '../../shared/config';
import { AppConfig } from '../../shared/types';
import { execSync } from 'child_process';

export async function initCommand(options: { dir: string }) {
  const projectDir = path.resolve(options.dir);

  console.log('🚀 LLM-Jira 초기화를 시작합니다...\n');

  // .llm-jira 디렉토리 생성
  const configDir = path.join(projectDir, '.llm-jira');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log('✅ 설정 디렉토리 생성: .llm-jira/');
  }

  // 업로드 디렉토리 생성
  const uploadDir = path.join(configDir, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ 업로드 디렉토리 생성: .llm-jira/uploads/');
  }

  // LLM 설정 입력받기
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'LLM 제공자를 선택하세요:',
      choices: [
        { name: 'Claude API', value: 'claude' },
        { name: 'Ollama (로컬)', value: 'ollama' },
        { name: '커스텀 명령어', value: 'command' },
      ],
    },
  ]);

  let llmConfig: AppConfig['llm'];

  if (answers.provider === 'claude') {
    const claudeAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Claude API 키를 입력하세요:',
        validate: (input) => input.length > 0 || 'API 키를 입력해주세요',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Claude 모델을 입력하세요:',
        default: 'claude-3-sonnet-20240229',
      },
    ]);

    llmConfig = {
      provider: 'claude',
      apiKey: claudeAnswers.apiKey,
      model: claudeAnswers.model,
    };
  } else if (answers.provider === 'ollama') {
    const ollamaAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Ollama 서버 URL을 입력하세요:',
        default: 'http://localhost:11434',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Ollama 모델을 입력하세요:',
        default: 'llama2',
      },
    ]);

    llmConfig = {
      provider: 'ollama',
      baseUrl: ollamaAnswers.baseUrl,
      model: ollamaAnswers.model,
    };
  } else {
    const commandAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: 'LLM 명령어를 입력하세요 (예: ollama run llama2):',
        validate: (input) => input.length > 0 || '명령어를 입력해주세요',
      },
    ]);

    llmConfig = {
      provider: 'command',
      command: commandAnswers.command,
    };
  }

  // 포트 설정
  const portAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: '서버 포트를 입력하세요:',
      default: '3000',
      validate: (input) => {
        const port = parseInt(input);
        return (!isNaN(port) && port > 0 && port < 65536) || '올바른 포트 번호를 입력해주세요 (1-65535)';
      },
    },
  ]);

  const config: AppConfig = {
    llm: llmConfig,
    port: parseInt(portAnswer.port),
    uploadDir: uploadDir,
  };

  // 설정 저장
  saveConfig(projectDir, config);
  console.log('✅ 설정 파일 저장: .llm-jira/config.json\n');

  // 데이터베이스 초기화 (prisma migrate)
  console.log('📦 데이터베이스를 초기화하는 중...');
  const dbPath = path.join(configDir, 'db.sqlite');
  const envContent = `DATABASE_URL="file:${dbPath}"`;
  const envPath = path.join(configDir, '.env');
  fs.writeFileSync(envPath, envContent);

  try {
    // Prisma migrate 실행
    const prismaSchema = path.join(__dirname, '../../../prisma/schema.prisma');
    execSync(`npx prisma migrate deploy --schema="${prismaSchema}"`, {
      cwd: projectDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: `file:${dbPath}`,
      },
    });
    console.log('✅ 데이터베이스 초기화 완료\n');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    process.exit(1);
  }

  // Git 저장소 초기화 (선택적)
  const gitAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'initGit',
      message: 'Git 저장소를 초기화하시겠습니까? (릴리즈 기능에 필요)',
      default: true,
    },
  ]);

  if (gitAnswer.initGit) {
    try {
      if (!fs.existsSync(path.join(projectDir, '.git'))) {
        execSync('git init', { cwd: projectDir, stdio: 'inherit' });
        console.log('✅ Git 저장소 초기화 완료\n');
      } else {
        console.log('ℹ️  Git 저장소가 이미 초기화되어 있습니다.\n');
      }
    } catch (error) {
      console.error('❌ Git 초기화 실패:', error);
    }
  }

  // 자동 서버 시작 여부
  const startAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startNow',
      message: '지금 서버를 시작하시겠습니까?',
      default: true,
    },
  ]);

  console.log('\n✨ 초기화가 완료되었습니다!\n');

  if (startAnswer.startNow) {
    console.log('🚀 서버를 시작합니다...\n');
    const { startCommand } = await import('./start');
    await startCommand({ port: config.port?.toString() || '3000', dir: projectDir });
  } else {
    console.log('서버를 시작하려면 다음 명령어를 실행하세요:');
    console.log(`  llm-jira start\n`);
  }
}
