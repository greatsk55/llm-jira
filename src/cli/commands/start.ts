import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { loadConfig } from '../../shared/config';

export async function startCommand(options: { port?: string; dir: string }) {
  const projectDir = path.resolve(options.dir);
  const configDir = path.join(projectDir, '.llm-jira');
  const pidFile = path.join(configDir, 'server.pid');

  // 설정 파일 확인
  if (!fs.existsSync(path.join(configDir, 'config.json'))) {
    console.error('❌ 설정 파일이 없습니다. 먼저 "llm-jira init"을 실행하세요.');
    process.exit(1);
  }

  // 이미 실행 중인지 확인
  if (fs.existsSync(pidFile)) {
    const pid = fs.readFileSync(pidFile, 'utf-8').trim();
    try {
      process.kill(parseInt(pid), 0); // 프로세스 존재 확인
      console.log('ℹ️  서버가 이미 실행 중입니다.');
      console.log(`   상태를 확인하려면: llm-jira status`);
      console.log(`   중지하려면: llm-jira stop`);
      return;
    } catch {
      // 프로세스가 없으면 PID 파일 삭제
      fs.unlinkSync(pidFile);
    }
  }

  const config = await loadConfig(projectDir);
  const port = options.port || config?.port?.toString() || '3000';

  console.log('🚀 LLM-Jira 서버를 시작합니다...\n');

  // 서버 실행 (현재 프로젝트의 빌드된 서버 사용)
  const serverPath = path.join(__dirname, '../../../dist/server/index.js');

  // 서버가 빌드되지 않았으면 에러
  if (!fs.existsSync(serverPath)) {
    console.error('❌ 서버가 빌드되지 않았습니다.');
    console.error('   개발 모드로 실행하려면: npm run dev');
    console.error('   또는 먼저 빌드하세요: npm run build');
    process.exit(1);
  }

  const env = {
    ...process.env,
    PORT: port,
    CONFIG_DIR: configDir,
    DATABASE_URL: `file:${path.join(configDir, 'db.sqlite')}`,
  };

  // 백그라운드로 서버 실행
  const server: ChildProcess = spawn('node', [serverPath], {
    detached: true,
    stdio: 'ignore',
    env,
  });

  if (server.pid) {
    fs.writeFileSync(pidFile, server.pid.toString());
    server.unref(); // 부모 프로세스와 분리

    console.log(`✅ 서버가 시작되었습니다!`);
    console.log(`   URL: http://localhost:${port}`);
    console.log(`   PID: ${server.pid}\n`);
    console.log('명령어:');
    console.log('  llm-jira status  - 서버 상태 확인');
    console.log('  llm-jira stop    - 서버 중지\n');
  } else {
    console.error('❌ 서버 시작에 실패했습니다.');
    process.exit(1);
  }
}
