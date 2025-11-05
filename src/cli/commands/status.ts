import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../shared/config';

export async function statusCommand(options: { dir: string }) {
  const projectDir = path.resolve(options.dir);
  const configDir = path.join(projectDir, '.llm-jira');
  const pidFile = path.join(configDir, 'server.pid');

  console.log('📊 LLM-Jira 상태\n');

  // 설정 파일 확인
  const configExists = fs.existsSync(path.join(configDir, 'config.json'));
  console.log(`설정 파일: ${configExists ? '✅ 존재' : '❌ 없음'}`);

  if (configExists) {
    try {
      const config = await loadConfig(projectDir);
      if (config) {
        console.log(`LLM 제공자: ${config.llm.provider}`);
        console.log(`포트: ${config.port || 3000}`);
      }
    } catch (error) {
      console.log(`설정 로드 실패: ${error}`);
    }
  }

  // 데이터베이스 확인
  const dbPath = path.join(configDir, 'db.sqlite');
  const dbExists = fs.existsSync(dbPath);
  console.log(`데이터베이스: ${dbExists ? '✅ 존재' : '❌ 없음'}`);

  // 서버 상태 확인
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim());
    try {
      process.kill(pid, 0); // 프로세스 존재 확인
      const config = configExists ? await loadConfig(projectDir) : null;
      console.log(`서버: ✅ 실행 중 (PID: ${pid})`);
      console.log(`URL: http://localhost:${config?.port || 3000}`);
    } catch {
      // 프로세스가 없으면 PID 파일 삭제
      fs.unlinkSync(pidFile);
      console.log(`서버: ❌ 중지됨`);
    }
  } else {
    console.log(`서버: ❌ 중지됨`);
  }

  console.log('');

  if (!configExists) {
    console.log('초기화하려면: llm-jira init');
  } else if (!fs.existsSync(pidFile)) {
    console.log('서버를 시작하려면: llm-jira start');
  }
}
