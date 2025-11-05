import fs from 'fs';
import path from 'path';

export async function stopCommand(options: { dir: string }) {
  const projectDir = path.resolve(options.dir);
  const configDir = path.join(projectDir, '.llm-jira');
  const pidFile = path.join(configDir, 'server.pid');

  if (!fs.existsSync(pidFile)) {
    console.log('ℹ️  실행 중인 서버가 없습니다.');
    return;
  }

  const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim());

  try {
    // 프로세스 종료
    process.kill(pid, 'SIGTERM');

    // PID 파일 삭제
    fs.unlinkSync(pidFile);

    console.log('✅ 서버가 중지되었습니다.');
  } catch (error: any) {
    if (error.code === 'ESRCH') {
      // 프로세스가 이미 없음
      fs.unlinkSync(pidFile);
      console.log('ℹ️  서버 프로세스를 찾을 수 없습니다. (이미 종료됨)');
    } else {
      console.error('❌ 서버 중지 실패:', error.message);
      process.exit(1);
    }
  }
}
